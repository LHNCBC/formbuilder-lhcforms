import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {TreeNode, ITreeOptions} from '@circlon/angular-tree-component/';
import {TREE_ACTIONS, KEYS, TreeModel} from '@circlon/angular-tree-component';

enum JsonFormatType {
  R4 = 'R4',
  STU3 = 'STU3',
  LFORMS = 'lforms'
}

@Injectable({
  providedIn: 'root'
})
export class FetchService {
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

  fhirUrl = 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire';
  assetsUrl = '/assets';
  constructor(private http: HttpClient) { }

  getFormData(id: string): Observable<any> {
    return this.http.get(this.fhirUrl + '/' + id, {responseType: 'json'});
  }

  getItemEditorSchema(): Observable<any> {
    return this.http.get(this.assetsUrl + '/item-editor.schema.json', {responseType: 'json'});
  }

  getOptions() {
    return this.treeOptions;
  }

  searchForms(term: string, options?): Observable<any[]> {
    options = options || {};
    options.observe = options.observe || 'body' as const;
    options.responseType = options.responseType || 'json' as const;
    options.params = (options.params || new HttpParams()).set('title', term).set('_elements', 'id,title');
    return this.http.get<any []>(this.fhirUrl, options).pipe(
      tap((resp) => { console.log(resp); }),
      map((resp: any) => {
        return (resp.entry as Array<any>).map((e) => {
          return {title: e.resource.title, id: e.resource.id};
        });
      }),
      catchError((error) => {console.log('searching for ' + term, error); return of([]); })
    );
  }
}
