import { Injectable } from '@angular/core';
import {IDType, ITreeNode} from '@circlon/angular-tree-component/lib/defs/api';
import {TreeModel} from '@circlon/angular-tree-component';

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

  getTreeNodeById(id: IDType): ITreeNode {
    return this.treeModel.getNodeById(id);
  }

  getTreeNodeByLinkId(linkId: string): ITreeNode {
    return this.findNodeByLinkId(this.treeModel.roots, linkId);
  }

  findNodeByLinkId(targetNodes: ITreeNode [], linkId: string): ITreeNode {
    let ret: ITreeNode;
    if (!targetNodes || targetNodes.length === 0) {
      return null;
    }
    for (const node of targetNodes) {
        if (node.data.linkId === linkId) {
          ret = node;
        } else if (node.hasChildren) {
          ret = this.findNodeByLinkId(node.children, linkId);
        }
        if (ret) {
          break;
        }
    }
    return ret;
  }
}
