import { Injectable } from '@angular/core';
import {ITreeModel} from 'angular-tree-component/dist/defs/api';

@Injectable({
  providedIn: 'root'
})
export class TreeService {
  treeModel: ITreeModel;

  constructor() { }
}
