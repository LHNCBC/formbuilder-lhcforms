import { Injectable, EventEmitter } from '@angular/core';
import {TreeModel} from '@bugsplat/angular-tree-component';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TreeService {
  treeModel: TreeModel;

  _nodeFocus = new Subject<any>();
  constructor() { }
  get nodeFocus (): Subject<any> {
    return this._nodeFocus;
  }
}
