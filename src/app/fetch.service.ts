/**
 * A service to fetch data from clinical tables search service and lforms-fhir servers.
 */
import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {TreeNode, ITreeOptions} from '@circlon/angular-tree-component/';
import {TREE_ACTIONS, KEYS, TreeModel} from '@circlon/angular-tree-component';
import {AutoCompleteResult} from './lib/widgets/auto-complete/auto-complete.component';
import {Util} from './lib/util';
declare var LForms: any;

enum JsonFormatType {
  R4 = 'R4',
  STU3 = 'STU3',
  LFORMS = 'lforms'
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
        drop: (tree: TreeModel, node: TreeNode, $event: any, {from, to}) => {
          if (to.parent.data.type === 'display') {
            to.parent.data.type = 'group';
          }
          if (from.parent.data.type === 'group' && from.parent.data.item.length === 0) {
            from.parent.data.type = 'display';
          }
          TREE_ACTIONS.MOVE_NODE(tree, node, $event, {from, to});
        }
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

  /**
   * Get questionnaire by id from FHIR server.
   * @param id - Id of the questionnaire
   */
  getFormData(id: string): Observable<any> {
    return this.http.get(FetchService.fhirUrl + '/' + id, {responseType: 'json'});
  }

  /**
   * This is used to configure widget to edit item in json editor.
   */
  getItemEditorSchema(): Observable<any> {
    return this.http.get(this.assetsUrl + '/item-editor.schema.json', {responseType: 'json'});
  }

  /**
   * Options for sidebar tree
   */
  getTreeOptions() {
    return this.treeOptions;
  }


  /**
   * Search questionnaires on fhir server, intended for auto completion for importing questionnaires.
   *
   * @param term - Search term
   * @param options - http request options
   */
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
      const fhirQ = LForms.Util.getFormFHIRData('Questionnaire', 'R4', wrapperLForm);
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
            display: answer.displayText
          }
        }
        answerOption.push(option);
      });
      ret.answerOption = answerOption;
    }
    ret.type = Util.getFhirType(datatype);
    if(units) {
      ret.extension = Util.convertUnitsToExtensions(units);
    }
    return ret;
  }
}
