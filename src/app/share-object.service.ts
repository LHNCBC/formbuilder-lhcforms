import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ITreeNode} from 'angular-tree-component/dist/defs/api';

@Injectable({
  providedIn: 'root'
})
export class ShareObjectService {
  nodeSource$: BehaviorSubject<ITreeNode> = new BehaviorSubject<ITreeNode>(null);
  node$ = this.nodeSource$.asObservable();
  objSource$: BehaviorSubject<any> = new BehaviorSubject<any>({});
  object$ = this.objSource$.asObservable();
  objectStr$ = this.object$.pipe(map((item) => {
    return JSON.stringify(item, null, 2);
  }));
  constructor() {}

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

  setNode(node: ITreeNode): void {
    this.nodeSource$.next(node);
  }
}
