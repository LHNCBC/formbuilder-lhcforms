import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {TreeNode} from '@bugsplat/angular-tree-component';
import {AppJsonPipe} from '../lib/pipes/app-json.pipe';
import fhir from 'fhir/r4';
import {PropertyGroup} from "@lhncbc/ngx-schema-form";

@Injectable({
  providedIn: 'root'
})
/**
 * A service to share objects across the components, mainly intended for
 * sharing changed questionnaire and questionnaire item.
 */
export class SharedObjectService {

  private questionnaireSource$ = new BehaviorSubject<fhir.Questionnaire>(null);
  private itemSource$ = new BehaviorSubject<fhir.QuestionnaireItem>(null);
  private nodeSource$: BehaviorSubject<TreeNode> = new BehaviorSubject<TreeNode>(null);
  node$ = this.nodeSource$.asObservable();
  private objSource$: BehaviorSubject<any> = new BehaviorSubject<any>({});
  object$ = this.objSource$.asObservable();
  objectStr$ = this.object$.pipe(map((item) => {
    return new AppJsonPipe().transform(item);
    // return JSON.stringify(item, null, 2);
  }));
  private _modelProperty$ = new BehaviorSubject<fhir.QuestionnaireItem>(null);

  _questionnaire: fhir.Questionnaire;

  /**
   * The working Questionnaire maintained by BasePageComponent. Unlike `questionnaire`,
   * which is published once per load, this object is updated in place as form-level
   * fields change and its `item` is replaced as items change, so it always holds the
   * current item tree. Form-level editors do not see items, so use this to reach them.
   */
  currentQuestionnaire: fhir.Questionnaire = null;

  constructor() {
    this.questionnaire$.subscribe(questionnaire => {
      this._questionnaire = questionnaire;
    });
  }


  /**
   * Set an object to share it with listeners.
   *
   * @param obj - Object to share, can be a string representation.
   */
  setObject(obj: any) {
    let valid = true;
    if (typeof obj === 'string') {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        valid = false;
      }
    }
    if (valid) {
      this.objSource$.next(obj);
    }
  }

  /**
   * Set questionnaire and share it with listeners.
   *
   * @param questionnaire - Questionnaire object to share.
   */
  set questionnaire(questionnaire: fhir.Questionnaire) {
    this.questionnaireSource$.next(questionnaire);
  }

  /**
   * Get the observable to listen to the changes in questionnaire.
   */
  get questionnaire$(): Observable<fhir.Questionnaire> {
    return this.questionnaireSource$.asObservable();
  }

  /**
   *
   */
  get questionnaire(): fhir.Questionnaire {
    return this._questionnaire;
  }

  /**
   * Build a Questionnaire that includes the current item tree.
   *
   * The form-level editor model deliberately excludes `item`. When given that model,
   * combine its current values with the items of `currentQuestionnaire`. Otherwise,
   * e.g. when given an item-level model, return `currentQuestionnaire`.
   *
   * @param formLevelValue - Optional value of the form-level editor model.
   * @returns A Questionnaire with form-level values and the current items, or null when
   *   no Questionnaire is loaded and no form-level value is given.
   */
  composeQuestionnaire(formLevelValue?: any): fhir.Questionnaire {
    if(formLevelValue?.resourceType === 'Questionnaire') {
      const composed: fhir.Questionnaire = {...formLevelValue};
      const items = this.currentQuestionnaire?.item;
      if(items) {
        composed.item = items;
      }
      return composed;
    }
    return this.currentQuestionnaire;
  }

  set currentItem (item: fhir.QuestionnaireItem) {
    this.itemSource$.next(item);
  }

  get currentItem$(): Observable<fhir.QuestionnaireItem> {
    return this.itemSource$.asObservable();
  }


  /**
   * Setter to notify initialization of the model for when switching from node to node in the sidebar tree.
   * @param item
   */
  set modelInitialized(item: fhir.QuestionnaireItem) {
    this._modelProperty$.next(item);
  }

  /**
   * Get the observer of the model initialization.
   */
  get modelInitialized$(): Observable<fhir.QuestionnaireItem> {
    return this._modelProperty$.asObservable();
  }

}
