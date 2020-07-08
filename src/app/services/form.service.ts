import { Injectable } from '@angular/core';
import {ITreeNode} from 'angular-tree-component/dist/defs/api';
import {TreeModel} from 'angular-tree-component';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  treeModel: TreeModel;
  constructor() { }

  getSourcesExcludingFocussedTree(): ITreeNode [] {
    let ret = null;
    if (this.treeModel) {
      const fNode = this.treeModel.getFocusedNode();
      ret = this.getEnableWhenSources(fNode);
    }
    return ret;
  }

  getEnableWhenSources(focussedNode: ITreeNode, treeModel?: TreeModel): ITreeNode [] {
    if (!treeModel) {
      treeModel = this.treeModel;
    }
    let ret = null;
    if (treeModel) {
      ret = this.getEnableWhenSources_(treeModel.roots, focussedNode);
    }
    return ret;
  }

  private getEnableWhenSources_(nodes: ITreeNode [], focussedNode: ITreeNode): ITreeNode [] {
    const ret: ITreeNode [] = [];
    for (const node of nodes) {
      if (node !== focussedNode) {
        if (node.data.type !== 'group' && node.data.type !== 'display') {
          ret.push(node);
        }
        if (node.hasChildren) {
          ret.push.apply(ret, this.getEnableWhenSources_(node.children, focussedNode));
        }
      }
    }
    return ret;
  }

  setTreeModel(treeModel: TreeModel) {
    this.treeModel = treeModel;
  }
}
