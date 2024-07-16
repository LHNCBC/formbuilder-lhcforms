import {Injectable, inject} from '@angular/core';
import Client from 'fhirclient/lib/Client';
import * as fhirClient from 'fhirclient';
import {defer, from, Observable} from 'rxjs';
import fhir from 'fhir/r4';
import {fhirPrimitives} from '../fhir';
import {FormService} from './form.service';
import {catchError, map} from 'rxjs/operators';
import {HttpErrorResponse, HttpClient, HttpResponse} from "@angular/common/http";

export interface FHIRServer {
  // resultsOffset: number;
  // pageSize: number;
  id?: number;
  displayName?: string;
  endpoint: fhirPrimitives.url;
  desc?: string;
  version?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FhirService {

  /*
  List of fhir servers.
  The server object definition:
   {
       id:          // Helps to track the object in angular template binding
       displayName: // Name as seen by the user
       endpoint:    // The url of the FHIR API endpoint to be assigned to
                    // x-target-fhir-endpoint
       basicAuth:   // Optional basic authentication string to be assigned to
                    // x-target-fhir-server-authorization header.
       version:     // FHIR version, ex: STU3, R4 ...
   }
  */
  fhirServerList: FHIRServer[] = [
    {
      id: 4,
      displayName: 'NLM HAPI FHIR Server - R4',
      endpoint: 'https://lforms-fhir.nlm.nih.gov/baseR4',
      desc: 'NLM Test Server (R4 Resources)',
      version: 'R4'
    },
    {
      id: 3,
      displayName: 'UHN HAPI Server - R4',
      endpoint: 'http://hapi.fhir.org/baseR4',
      desc: 'UHN Test Server (R4 Resources)',
      version: 'R4'
    },
    {
      id: 2,
      displayName: 'UHN HAPI Server - STU3',
      endpoint: 'http://hapi.fhir.org/baseDstu3',
      desc: 'UHN Test Server (STU3 Resources)',
      version: 'STU3'
    }
  ];
/*
  config: any = {
    headers: {}
  };
*/
  currentServer: FHIRServer;
  smartClient: Client;
  formService = inject(FormService);
  httpClient: HttpClient = inject<HttpClient>(HttpClient);
  constructor() {
    // this.smartClient = FHIR.client(window.location.href+'fhir-api');
    this.setFhirServer(this.fhirServerList[0]);
  }

    /**
     * Creates a resource on the fhir server, assigning publisher field from the user profile.
     *
     * @param resource - A string representation of fhir resource or fhir resource object.
     * @param userProfile - User's login profile.
     * @returns - An http promise
     */
    create(resource: string | fhir.Resource, userProfile): Observable<fhir.Resource> {
      // There is no equivalent field to identify the author/publisher in lforms.
      // This field could be handy to retrieve user's resources from fhir server.
      // For now combine name and email to make it unique and searchable by name.
      let res = typeof resource === 'string' ? JSON.parse(resource) : resource;
      this.assignPublisher(res, userProfile);

      res = this.formService.convertFromR4(res, this.getFhirServer().version);
      return this.promiseToObservable(this.smartClient.create(res));
    };


    /**
     * Creates a resource on the fhir server.
     *
     * @param resource - A string representation of fhir resource or fhir resource object.
     * @param userProfile - User's login profile.
     * @returns - An http promise
     */
    update(resource: string | fhir.Resource, userProfile): Observable<fhir.Resource> {
      let res = typeof resource === 'string' ? JSON.parse(resource) : resource;
      this.assignPublisher(res, userProfile);
      res = this.formService.convertFromR4(res, this.getFhirServer().version);
      return this.promiseToObservable(this.smartClient.update(res));
    };


    /**
     * Read a questionnaire fhir resource.
     * @param id - Id of the resource.
     * @returns - An http promise
     */
    read(id): Observable<fhir.Resource> {
      return this.promiseToObservable(this.smartClient.request<fhir.Resource>({
        url: 'Questionnaire/'+id+'?_format=application/fhir+json',
        // headers: this.config.headers
      })).pipe(map((res: fhir.Resource) => {
        return this.formService.convertToR4(res as fhir.Questionnaire);
      }));
    };


    /**
     * Delete a questionnaire fhir resource.
     *
     * @param id - Id of the resource.
     * @returns - An http promise
     */
    delete(id): Observable<any> {
      return this.promiseToObservable(this.smartClient.delete('Questionnaire/' + id));
    };


    /**
     *
     *
     * @param searchStr - A search term to search FHIR resources
     * @param searchField - Field to search, should be a valid searchable field. Refer to FHIR REST API for list of fields.
     * @param otherQueryParams? - (Optional) Any additional or overriding query parameters to send to FHIR server.
     * @returns Http promise
     */
    search(searchStr: string, searchField?: string, otherQueryParams?: any): Observable<fhir.Bundle> {
      const query = {_sort: ['-_lastUpdated'], _total: 'accurate', _format: 'application/fhir+json'};
      Object.assign(query, otherQueryParams);

      if(!searchField) {
        searchField = '_content';
      }

      if(searchStr) {
        // query[searchField+':contains'] = searchStr;
        query[searchField] = searchStr;
      }

      return this.promiseToObservable(this.smartClient.request<fhir.Bundle>({
        url: 'Questionnaire?' + this.queryToString(query)
      }));
    };


    /**
     * Get FHIR results using a url. The paginated results are obtained using a url in the result bundle
     * @param url - The URL referring to the resource bundle on the FHIR server.
     * @returns - FHIR resource bundle
     */
    getBundleByUrl(url: fhirPrimitives.url): Observable<fhir.Bundle> {
      return this.promiseToObservable(this.smartClient.request(url));
    };

    /**
     * Get FHIR pagination results using a current bundle. The paginated results are
     * obtained using a url in the current results bundle
     *
     * @param bundle - The FHIR bundle from which to extract the relation url.
     * @param relation - A string specifying the relation ('prev' | 'next')
     * @returns - FHIR resource bundle
     */
    getPage(bundle, relation): Observable<fhir.Bundle> {
      let url;
      if(relation === 'prev' || relation === 'previous') {
        url = bundle.link.prev || bundle.link.previous; // prev and previous are synonymous
      }
      else {
        url = bundle.link[relation];
      }

      return this.getBundleByUrl(url);
    };


    /**
     * Set fhir server headers
     *
     * @param fhirServer - fhirServer object. See dataConstants.fhirServerList for its definition.
     */
    setFhirServer(fhirServer: FHIRServer): void {
      this.currentServer = fhirServer;
      this.smartClient = fhirClient.client(this.currentServer.endpoint);
    };

    getFhirServer(): FHIRServer {
      return this.currentServer;
    }

    /**
     * If publisher is specified, assign one by creating one from user profile, if exists.
     *
     * @param resource - FHIR resource object.
     * @param userProfile - User's login profile
     * @returns - a
     */
    assignPublisher(resource, userProfile): void {
      if(resource && !resource.publisher && userProfile) {
        if(userProfile.displayName) {
          let pubName = userProfile.displayName;
          if(userProfile.email) {
            pubName += '; ' + userProfile.email;
          }
          resource.publisher = pubName;
        }
      }
    }

    queryToString(obj: any): string {
      let ret: string = null;
      if(obj) {
        ret = Object.entries(obj).map(([k, v]) => {
          if(Array.isArray(v)) {
            v = (v as Array<string>).join(',');
          }
           return encodeURI(k)+'='+encodeURI(v as string);
        }).join('&');
      }
      return ret;
    }

    promiseToObservable<T>(promise: Promise<T>): Observable<T> {
      return defer(() => from(promise));
    }

    getSmartClient(): Client {
      return this.smartClient;
    }

  /**
   * Add new FHIR server to the list.
   * @param newFHIRServer - New server objecy
   */
  addNewFhirServer(newFHIRServer: FHIRServer) {
    this.fhirServerList.unshift(newFHIRServer);
    this.setFhirServer(newFHIRServer);
  }


  /**
   * Find out if a fhir server object exists for a base url.
   * @param endpoint - Base url to search.
   */
  hasFhirServer(endpoint: fhirPrimitives.url): boolean {
    return this.fhirServerList.some((server) => {
      return server.endpoint === endpoint;
    });
  }

  getValidationErrorsBak(questionnaire: fhir.Questionnaire): Observable<any> {
    return this.promiseToObservable(this.smartClient.request<fhir.Resource>({
      url: 'Questionnaire/$validate',
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      body: JSON.stringify(questionnaire)
    })).pipe(catchError((res: HttpErrorResponse) => {
      console.log(res.error);
      return res.error.issue;
    }));
  }

  getValidationErrors(questionnaire: fhir.Questionnaire): Observable<fhir.OperationOutcomeIssue[]> {
    return this.httpClient.post<fhir.OperationOutcome>(
      this.currentServer.endpoint+'/Questionnaire/$validate', JSON.stringify(questionnaire, null, 2),
      {headers: {'Content-Type': 'application/fhir+json'},
        observe: 'body',responseType: 'json'})
      .pipe(map((outcome) => { return outcome.issue;}));
  }


}
