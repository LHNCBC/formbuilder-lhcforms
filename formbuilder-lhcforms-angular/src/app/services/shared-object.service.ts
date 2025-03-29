import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ITreeNode} from '@bugsplat/angular-tree-component/lib/defs/api';
import {AppJsonPipe} from '../lib/pipes/app-json.pipe';
import fhir from 'fhir/r4';

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
  private nodeSource$: BehaviorSubject<ITreeNode> = new BehaviorSubject<ITreeNode>(null);
  node$ = this.nodeSource$.asObservable();
  private objSource$: BehaviorSubject<any> = new BehaviorSubject<any>({});
  object$ = this.objSource$.asObservable();
  objectStr$ = this.object$.pipe(map((item) => {
    return new AppJsonPipe().transform(item);
    // return JSON.stringify(item, null, 2);
  }));
  constructor() {}


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


  set questionnaire(questionnaire: fhir.Questionnaire) {
    this.questionnaireSource$.next(questionnaire);
  }

  get questionnaire$(): Observable<fhir.Questionnaire> {
    return this.questionnaireSource$.asObservable();
  }

  set currentItem (item: fhir.QuestionnaireItem) {
    this.itemSource$.next(item);
  }

  get currentItem$(): Observable<fhir.QuestionnaireItem> {
    return this.itemSource$.asObservable();
  }

}
