import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ITreeNode} from '@circlon/angular-tree-component/lib/defs/api';
import {AppJsonPipe} from './lib/pipes/app-json.pipe';

@Injectable({
  providedIn: 'root'
})
export class ShareObjectService {

  nodeSource$: BehaviorSubject<ITreeNode> = new BehaviorSubject<ITreeNode>(null);
  node$ = this.nodeSource$.asObservable();
  objSource$: BehaviorSubject<any> = new BehaviorSubject<any>({});
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

  /**
   * Set a tree node to share it with listeners.
   *
   * @param obj
   */
  setNode(node: ITreeNode): void {
    this.nodeSource$.next(node);
  }
}
