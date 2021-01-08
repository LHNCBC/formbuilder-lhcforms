import { Injectable } from '@angular/core';
import {ITreeModel} from '@circlon/angular-tree-component/lib/defs/api';

@Injectable({
  providedIn: 'root'
})
export class TreeService {
  treeModel: ITreeModel;

  constructor() { }
}
