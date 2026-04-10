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
