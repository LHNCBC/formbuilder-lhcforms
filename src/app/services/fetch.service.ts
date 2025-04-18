/**
 * A service to fetch data from clinical tables search service and lforms-fhir servers.
 */
import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {Observable, of, retry, throwError} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {AutoCompleteResult} from '../lib/widgets/auto-complete/auto-complete.component';
import {Util} from '../lib/util';
import fhir, {BundleEntry} from 'fhir/r4';
import SNOMED_CT_Editions from '../../assets/SNOMED_CT_Editions.json';
declare var LForms: any;

enum JsonFormatType {
  R5 = 'R5',
  R4 = 'R4',
  STU3 = 'STU3',
  LFORMS = 'lforms'
}

/**
 * A map with edition id as key and SNOMEDEdition as value.
 */
export interface SNOMEDEditions  extends Map<string, SNOMEDEdition> {
}
export interface SNOMEDEdition {
  title?: string,
  versions?: string [];
}

export enum LoincItemType {
  PANEL = 'panel',
  QUESTION = 'question'
}

@Injectable({
  providedIn: 'root'
})
export class FetchService {
  static loincBaseUrl = 'https://clinicaltables.nlm.nih.gov';
  static loincSearchUrl = FetchService.loincBaseUrl + '/api/loinc_items/v3/search';
  static loincFormsUrl = FetchService.loincBaseUrl + '/loinc_form_definitions';
  static fhirUrl = 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire';
  static snomedCodeSystemsUrl = 'https://snowstorm.ihtsdotools.org/fhir/CodeSystem';
  _snomedEditions: SNOMEDEditions = null;

  assetsUrl = '/assets';
  constructor(private http: HttpClient) { }

  /**
   * Getter for _snomedEditions
   */
  get snomedEditions(): SNOMEDEditions {
    return this._snomedEditions;
  }

  /**
   * Get questionnaire by id from FHIR server.
   * @param id - Id of the questionnaire
   */
  getFhirFormData(id: string): Observable<fhir.Questionnaire> {
    return this.http.get<fhir.Questionnaire>(FetchService.fhirUrl + '/' + id, {responseType: 'json'});
  }


  /**
   * Get questionnaire by id from LOINC.
   *
   * @param loincNum - LOINC number of the form.
   */
  getLoincFormData(loincNum: string): Observable<fhir.Questionnaire> {
    const options: any = {observe: 'body', responseType: 'json'};
    options.params = new HttpParams().set('loinc_num', loincNum);

    return this.http.get<fhir.Questionnaire>(FetchService.loincFormsUrl, options)
      .pipe(
        map((response: any) => {
          return LForms.Util.getFormFHIRData('Questionnaire', 'R5', response);
        }),
        catchError((error) => {console.log(`Loading loinc form ${loincNum}`, error); return of([]); })
      );
  }


  /**
   * Search LOINC questionnaires on ctss, intended for auto completion for importing questionnaires.
   *
   * @param term - Search term
   * @param options - http request options
   */
  searchLoincForms(term: string, options?): Observable<AutoCompleteResult []> {
    options = options || {};
    options.observe = options.observe || 'body' as const;
    options.responseType = options.responseType || 'json' as const;
    options.params = (options.params || new HttpParams())
      .set('terms', term)
      .set('df', 'LOINC_NUM,text')
      .set('type', 'form_and_section')
      .set('available', 'true');
    return this.http.get<AutoCompleteResult []>(FetchService.loincSearchUrl, options).pipe(
      map((resp: any) => {
        return (resp[3] as Array<any>).map((e) => {
          return {id: e[0], title: e[1]};
        });
      }),
      catchError((error) => {console.log('searching for ' + term, error); return of([]); })
    );
  }

  /**
   * Search CTSS for loinc items, intended for auto complete.
   *
   * @param term - Search term.
   * @param loincType - Panel or question.
   * @param options - http request options.
   */
  searchLoincItems(term: string, loincType?: LoincItemType, options?): Observable<AutoCompleteResult []> {
    options = options || {};
    options.observe = options.observe || 'body' as const;
    options.responseType = options.responseType || 'json' as const;
    options.params = (options.params ||
      new HttpParams());
    if(loincType === LoincItemType.PANEL) {
      options.params = options.params.set('type', 'form_and_section').set('available', true);
    }
    else {
      options.params = options.params.set('type', 'question').set('ef', 'answers,units,datatype');
    }
    options.params = options.params
      .set('terms', term)
      .set('maxList', 20);
    return this.http.get<AutoCompleteResult []>(FetchService.loincSearchUrl, options).pipe(
    // tap((resp: HttpResponse<AutoCompleteResult []>) => {console.log(resp)}),
      map((resp: any) => {
        const results: AutoCompleteResult [] = [];
        if (Array.isArray(resp)) {
          const loincNums: string[] = resp[1];
          const texts: string [] = resp[3];
          const extraFields: any = resp[2];
          loincNums.forEach((loincNum, index) => {
            const item: any = this.convertLoincQToItem(
              loincNum,
              texts[index][0],
              extraFields ? extraFields.answers[index] : null,
              extraFields ? extraFields.units[index] : null,
              extraFields ? extraFields.datatype[index] : null);
            results.push(item);
            // results.push({id: loincNum[index], title: texts[index][0]});
          });
        }
        return results;
      })
    );
  }


  /**
   * Fetch loinc panel based on loinc number.
   * @param loincNum - Loinc number
   * @param options - Any http options.
   */
  getLoincPanel(loincNum: string, options?): Observable<any> {
    options = options || {};
    options.observe = options.observe || 'body' as const;
    options.responseType = options.responseType || 'json' as const;
    options.params =
      (options.params ||
        new HttpParams())
        .set('loinc_num', loincNum);
    return this.http.get<any>(FetchService.loincFormsUrl, options).pipe(map((form: any) => {
      // We get the item (panel) in lforms form format. Convert form level fields to item level fields and pass it
      // FHIR conversion library.
      const convertedLFormsItem = {
        question: form.name,
        questionCode: form.code,
        dataType: 'SECTION',
        items: form.items
      };
      // Wrap it in LForms for conversion
      const wrapperLForm = {
        lformsVersion: form.lformsVersion,
        name: form.name,
        items: [convertedLFormsItem]
      };
      // const fhirQ = fhir.SDC.convertLFormsToQuestionnaire(wrapperLForm);
      const fhirQ = LForms.Util.getFormFHIRData('Questionnaire', 'R5', wrapperLForm);
      return fhirQ.item[0]; // It is just one item in item array.
    }));
  }

  /**
   * Create FHIR Questionnaire.item from loinc question info.
   *
   */
  convertLoincQToItem(loincNum: string, text: string, answers: any [], units: any[], datatype: string): any {
    const ret: any = {};
    ret.code = [
      {
        code: loincNum,
        system: 'http://loinc.org',
        display: text
      }
    ];
    ret.text = text;
    if(answers) {
      const answerOption: any[] = [];
      answers.forEach((answer) => {
        const option: any = {
          valueCoding: {
            code: answer.AnswerStringID,
            system: 'http://loinc.org',
            display: answer.DisplayText
          }
        }
        answerOption.push(option);
      });
      ret.answerOption = answerOption;
    }
    ret.type = Util.getFhirType(datatype);
    if(units) {
      ret.extension = Util.convertUnitsToExtensions(units, ret.type);
    }
    return ret;
  }

  /**
   * Fetch and store SNOMED editions and versions data from SNOMED site.
   *
   * Uses SNOMED CT API call to get code systems from snomed site.
   */
  fetchSnomedEditions() {
    if(this._snomedEditions) {
      return;
    }

    this.http.get<fhir.Bundle>(FetchService.snomedCodeSystemsUrl).pipe(
      retry(3),
      catchError(this.handleSNOMEDError),
      // tap((resp: any) => {console.log(resp);}),
      map(this.parseSNOMEDEditions)
    ).subscribe({next: (editions: SNOMEDEditions) => {
      console.log('Fetched SNOMED editions.');
      this._snomedEditions = editions;
    }, error: (error) => {
      console.log('Using packaged SNOMED editions.');
      this._snomedEditions = this.parseSNOMEDEditions(SNOMED_CT_Editions as fhir.Bundle);
    }});
  }


  /**
   * It parses a SNOMED CodeSystem bundle. Stores the editions
   * in a map with its id as key and the iterator preserves the order of input array.
   *
   * @param snomedCSBundle - Response from SNOMED CodeSystem API.
   */
  parseSNOMEDEditions(snomedCSBundle: fhir.Bundle): SNOMEDEditions {
    const editionVersionRE = /^http:\/\/snomed.info\/sct\/([^\/]+)\/version\/(.+)?$/;
    const results = new Map<string, SNOMEDEdition>(); // Iterates with insertion order
    snomedCSBundle.entry.forEach((res: BundleEntry<fhir.CodeSystem>) => {
      const versionUri = res.resource.version;
      const matches = versionUri.match(editionVersionRE);
      if (matches) {
        const id = matches[1];
        const version = matches[2];
        let edition: SNOMEDEdition = results.get(id);
        if (edition) {
          edition.versions.push(version);
        } else {
          edition = {title: res.resource.title, versions: [version]};
          results.set(id, edition);
        }
      }
    });
    return results;
  }

  /**
   * Handle errors with SNOMED Code System API
   * @param error
   * @private
   */
  private handleSNOMEDError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `${FetchService.snomedCodeSystemsUrl} returned code ${error.status}, body was: `, error.error);
    }
    // Return an observable with a user-facing error message.
    return throwError(() => error.error);
  }
}
