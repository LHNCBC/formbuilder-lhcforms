import {Injectable, inject} from '@angular/core';
import Client from 'fhirclient/lib/Client';
import * as fhirClient from 'fhirclient';
import {defer, from, mergeMap, Observable, of, timeout, TimeoutError} from 'rxjs';
import fhir from 'fhir/r4';
import {fhirPrimitives} from '../fhir';
import {FormService} from './form.service';
import {FHIR_VERSION_TYPE, Util} from '../lib/util';
import {catchError, map} from 'rxjs/operators';
import {HttpClient, HttpResponse, HttpParams} from "@angular/common/http";
declare var LForms: any;

export interface FHIRServer {
  // resultsOffset: number;
  // pageSize: number;
  id?: number;
  displayName?: string;
  endpoint: fhirPrimitives.url;
  desc?: string;
  version?: string;
}

/**
 * Specifies metadata response from a FHIR server.
 */
export interface FHIRServerValidityResponse {
  message?: string;
  errorMessage?: string;
  fhirServer?: FHIRServer;
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
       version:     // FHIR version, ex: STU3, R4, R5 ...
   }
  */
  fhirServerList: FHIRServer[] = [

    {
      id: 5,
      displayName: 'NLM HAPI FHIR Server - R5',
      endpoint: 'https://lforms-fhir.nlm.nih.gov/baseR5',
      desc: 'NLM Test Server (R5 Resources)',
      version: 'R5'
    },
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
      endpoint: 'https://hapi.fhir.org/baseR4',
      desc: 'UHN Test Server (R4 Resources)',
      version: 'R4'
    },
    {
      id: 2,
      displayName: 'UHN HAPI Server - STU3',
      endpoint: 'https://hapi.fhir.org/baseDstu3',
      desc: 'UHN Test Server (STU3 Resources)',
      version: 'STU3'
    }
  ];

  currentServer: FHIRServer;
  smartClient: Client;

  validationServers = new Set<FHIRServer>(this.fhirServerList);
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

      res = this.formService.convertFromR5(res, this.getFhirServer().version);
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
      res = this.formService.convertFromR5(res, this.getFhirServer().version);
      return this.promiseToObservable(this.smartClient.update(res));
    };


    /**
     * Read a questionnaire fhir resource.
     * @param id - Id of the resource.
     * @returns - An http promise
     */
    read(id): Observable<fhir.Questionnaire> {
      return this.promiseToObservable(this.smartClient.request<fhir.Questionnaire>({
        url: 'Questionnaire/'+id+'?_format=application/fhir+json',
        // headers: this.config.headers
      })).pipe(map((res: fhir.Questionnaire) => {
        return this.formService.convertToR5(res);
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
     * @param otherQueryParams - (Optional) Any additional or overriding query parameters to send to FHIR server.
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

  /**
   * Use /Questionnaire/$validate API to validate the questionnaire and return
   * the server response.
   *
   * @param questionnaire - Input questionnaire to validate
   * @param serverUrl - Server url. If it contains '/Questionnaire/$validate',
   * it is assumed that it may contain additional search parameters and used
   * unchanged. Otherwise, it is assumed as baseUrl and /Questionnaire/$validate
   * is appended.
   *
   * @return - Observable with issues reported by the server.
   */
  getValidationErrors(questionnaire: fhir.Questionnaire, serverUrl?: fhirPrimitives.url): Observable<fhir.OperationOutcomeIssue[]> {
    let url = serverUrl || this.currentServer.endpoint;
    if(!/\Questionnaire\/\$validate/i.test(serverUrl)) {
      url += '/Questionnaire/$validate';
    }

    return this.httpClient.post<fhir.OperationOutcome>(
      url, JSON.stringify(questionnaire, null, 2),
      {
        headers: {'Content-Type': 'application/fhir+json'},
        observe: 'body',
        responseType: 'json'
      })
      .pipe(map((outcome) => { return outcome.issue || [];}));
  }

  /**
   * Get the last used server. The last in the list is assumed to be last used.
   *
   * @param fhirVersion - R5|R4|STU3 etc.
   *
   * @returns - The url of the last used server.
   */
  getLastUsedValidationServer(fhirVersion: FHIR_VERSION_TYPE): fhirPrimitives.url {
    const last = Array.from(this.validationServers).reverse().find((e) => {
      return fhirVersion === e.version;
    });

    return last.endpoint;
  }

  /**
   * Check for well-formedness of an url with http protocol.
   *
   * @param webUrl - Input url
   * @return - A URL object of the input if valid, otherwise null.
   */
  getValidWebUrl(webUrl: fhirPrimitives.url): URL {
    let urlObj: URL = null;
    try {
      urlObj = new URL(webUrl);
      if(!urlObj.protocol.match(/^https?:/i)) {
        urlObj = null;
      }
    } catch (e) {}

    return urlObj;
  }

  /**
   * Validate base url of the FHIR server. It should respond to metadata API
   * with FHIR version.
   *
   * @param fullUrl - User entered url string.
   * @return - Observable with server's validity information.
   */
  validateBaseUrl(fullUrl: string): Observable<FHIRServerValidityResponse> {
    const ret: FHIRServerValidityResponse = {};
    let url = this.getValidWebUrl(fullUrl);

    if (!url) {
      ret.errorMessage = `Invalid url: ${fullUrl}`;
      return of(ret);
    }

    const options: {params?: HttpParams, observe: 'response', responseType: 'json'} = {
      observe: 'response',
      responseType: 'json',
      params: (new HttpParams())
        .set('_format', 'json')
        .set('_elements', 'fhirVersion,implementation') // Gives a small response. Is this reliable?
    };

    const baseUrl = Util.extractBaseUrl(fullUrl);
    return this.httpClient.get<fhir.CapabilityStatement>(baseUrl+'/metadata', options)
      .pipe(
        map<HttpResponse<fhir.CapabilityStatement>, FHIRServerValidityResponse>((resp: HttpResponse<fhir.CapabilityStatement>) => {
          const body: fhir.CapabilityStatement = resp.body;
          const version = LForms.Util._fhirVersionToRelease(body.fhirVersion);
          if(!version || version === body.fhirVersion) {
            ret.errorMessage = `${url.href} returned an unsupported FHIR version: ${body.fhirVersion}`;
            return ret;
          }

          const u = body.implementation?.url;
          if(u && u !== baseUrl) {
            fullUrl = fullUrl.replace(baseUrl, u);
          }
          ret.fhirServer = {
            // Remove any trailing slashes.
            endpoint: fullUrl,
            desc: body.implementation?.description || '',
            version
          };
          const s = Array.from(this.validationServers).find((el) => {
            return el.endpoint === ret.fhirServer.endpoint;
          });
          if(!s) {
            this.validationServers.add(ret.fhirServer);
          }

          return ret;
        }),
        catchError((error) => {
          const ret: FHIRServerValidityResponse = {};
          if(error.message.startsWith('Invalid url:')) {
            ret.errorMessage = error.message;
          } else {
            // Error from the server.
            ret.errorMessage = `${baseUrl}: Unable to confirm the URL is a FHIR server.`;
          }
          return of(ret);
        }));
  }

  /**
   * Run validations on a given server and version, with input questionnaire to validate.
   * @param version - Supported version - R5|R4|STU3
   * @param url - URL object representing the server and any search parameters.
   * @param questionnaire - fhir.Questionnaire to validate.
   *
   * @return - Observable with array of error messages.
   */
  runValidations(version: FHIR_VERSION_TYPE, url: URL, questionnaire: fhir.Questionnaire): Observable<string[]> {
    const filterErrors = (issues: fhir.OperationOutcomeIssue[]) => {
      return  issues?.filter((iss) => {return iss.severity === 'fatal' || iss.severity === 'error';})
        .map((err) => {
          let str = `${err.severity.charAt(0).toUpperCase()+err.severity.slice(1)}: ${err.diagnostics}`;
          if(err.location) {
            str += ` [${err.location?.join('; ')}]`;
          }
          return str;
        });
    };
    const sTimeout = 30;
    return this.validateBaseUrl(url.href)
      .pipe(
        timeout(sTimeout * 1000),
        mergeMap((validServer: FHIRServerValidityResponse): Observable<string[]> => {
          let ret: string[] = [];
          if (validServer.errorMessage) {
            ret.push(validServer.errorMessage);
          } else if (validServer.fhirServer) {
            if (validServer.fhirServer.version === version) {
              return this.getValidationErrors(questionnaire, validServer.fhirServer.endpoint)
                .pipe(
                  map((issues: fhir.OperationOutcomeIssue[]): string[] => {
                    return filterErrors(issues);
                  }),
                  catchError((error) => {
                    let errors: string[] = [];
                    if (error.status === 412) {
                      // Hapi sends the errors with http code 412
                      errors.push(...filterErrors(error.error.issue));
                    } else if(error instanceof TimeoutError) {
                      errors.push(`Connection timed out after ${sTimeout} seconds`);
                    } else {
                      if(error.status === 0) {
                        // Mark the network errors
                        errors.push(`Detected network error.`);
                      }
                      errors.push(error.message);
                    }
                    return of(errors);
                  }));
            } else {
              ret.push(`This server version is ${validServer.fhirServer.version}. Please specify a server to validate ${version} format.`);
            }
          }
          return of(ret);
        }),
        catchError((error) => {
          const ret: string[] = [];
          if(error instanceof TimeoutError) {
            ret.push(`Connection timed out after ${sTimeout} seconds`);
          } else {
            ret.push(error.message);
          }
          return of(ret);
        })
      );
  }

}
