import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {TreeNode, ITreeOptions} from '@circlon/angular-tree-component/';
import {TREE_ACTIONS, KEYS, TreeModel} from '@circlon/angular-tree-component';
import {AutoCompleteResult} from './lib/widgets/auto-complete/auto-complete.component';
declare var LForms: any;

enum JsonFormatType {
  R4 = 'R4',
  STU3 = 'STU3',
  LFORMS = 'lforms'
}

@Injectable({
  providedIn: 'root'
})
export class FetchService {
  static loincBaseUrl = 'https://clinicaltables.nlm.nih.gov';
  static loincSearchUrl = FetchService.loincBaseUrl + '/api/loinc_items/v3/search';
  static loincFormsUrl = FetchService.loincBaseUrl + '/loinc_form_definitions';
  static fhirUrl = 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire';
  treeOptions: ITreeOptions = {
    displayField: 'text',
   // isExpandedField: 'expanded',
    // idField: 'linkId',
    childrenField: 'item',
    actionMapping: {
      mouse: {
        dblClick: (tree, node, $event) => {
          if (node.hasChildren) { TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event); }
        },
        click: TREE_ACTIONS.FOCUS,
      },
      keys: {
        [KEYS.ENTER]: TREE_ACTIONS.EXPAND
      }
    },
    nodeHeight: 23,
    allowDrag: (node) => {
      return true;
    },
    allowDrop: (node) => {
      return true;
    },
    // allowDragoverStyling: true,
    levelPadding: 10,
    useVirtualScroll: true,
    animateExpand: true,
    scrollOnActivate: true,
    animateSpeed: 30,
    animateAcceleration: 1.2,
    scrollContainer: document.documentElement // HTML
  };

  assetsUrl = '/assets';
  constructor(private http: HttpClient) { }

  getFormData(id: string): Observable<any> {
    return this.http.get(FetchService.fhirUrl + '/' + id, {responseType: 'json'});
  }

  getItemEditorSchema(): Observable<any> {
    return this.http.get(this.assetsUrl + '/item-editor.schema.json', {responseType: 'json'});
  }

  getOptions() {
    return this.treeOptions;
  }

  searchForms(term: string, options?): Observable<AutoCompleteResult []> {
    options = options || {};
    options.observe = options.observe || 'body' as const;
    options.responseType = options.responseType || 'json' as const;
    options.params = (options.params || new HttpParams()).set('title', term).set('_elements', 'id,title');
    return this.http.get<AutoCompleteResult []>(FetchService.fhirUrl, options).pipe(
      tap((resp) => { console.log(resp); }),
      map((resp: any) => {
        return (resp.entry as Array<any>).map((e) => {
          return {title: e.resource.title, id: e.resource.id};
        });
      }),
      catchError((error) => {console.log('searching for ' + term, error); return of([]); })
    );
  }

  searchLoincItems(term: string, options?): Observable<AutoCompleteResult []> {
    options = options || {};
    options.observe = options.observe || 'body' as const;
    options.responseType = options.responseType || 'json' as const;
    options.params = (options.params ||
      new HttpParams())
      .set('type', 'form_and_section')
      .set('available', true)
      .set('terms', term)
      .set('maxList', 20);
    return this.http.get<AutoCompleteResult []>(FetchService.loincSearchUrl, options).pipe(
    // tap((resp: HttpResponse<AutoCompleteResult []>) => {console.log(resp)}),
      map((resp: any) => {
        const results: AutoCompleteResult [] = [];
        if (Array.isArray(resp)) {
          const codes: string[] = resp[1];
          const titles: string [] = resp[3];
          codes.forEach((code, index) => {
            results.push({id: codes[index], title: titles[index][0]});
          });
        }
        return results;
      })
    );
  }
  /**
   *
   * @param loincNum - Loinc number
   * @param options - Any http options.
   */
  getLoincItem(loincNum: string, options?): Observable<any> {
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
      const fhirQ = LForms.Util.getFormFHIRData('Questionnaire', 'R4', wrapperLForm);
      return fhirQ.item[0]; // It is just one item in item array.
    }));
  }
}
