import { Injectable } from '@angular/core';
import {IDType, ITreeNode} from '@circlon/angular-tree-component/lib/defs/api';
import {TreeModel} from '@circlon/angular-tree-component';


/**
 * Form related helper functions.
 */
@Injectable({
  providedIn: 'root'
})
export class FormService {

  treeModel: TreeModel;
  constructor() { }

  /**
   * Intended to collection source items for enable when logic
   * Get sources for focussed item.
   */
  getSourcesExcludingFocussedTree(): ITreeNode [] {
    let ret = null;
    if (this.treeModel) {
      const fNode = this.treeModel.getFocusedNode();
      ret = this.getEnableWhenSources(fNode);
    }
    return ret;
  }


  /**
   * Get sources excluding the branch of a given node.
   * @param focussedNode
   * @param treeModel?: Optional tree model to search. Default is this.treeModel.
   */
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


  /**
   * Get sources from a given list of nodes excluding the branch of focussed node.
   * @param nodes - List of nodes to search
   * @param focussedNode - Reference node to exclude the node and its descending branch
   * @private
   */
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


  /**
   * Setter
   * @param treeModel
   */
  setTreeModel(treeModel: TreeModel) {
    this.treeModel = treeModel;
  }


  /**
   * Get node by its id.
   * @param id
   */
  getTreeNodeById(id: IDType): ITreeNode {
    return this.treeModel.getNodeById(id);
  }


  /**
   * Get a node by linkId from entire tree.
   * @param linkId
   */
  getTreeNodeByLinkId(linkId: string): ITreeNode {
    return this.findNodeByLinkId(this.treeModel.roots, linkId);
  }


  /**
   * Get a node by linkId from a given set of tree nodes.
   * @param targetNodes - Array of tree nodes
   * @param linkId - linkId associated with item of the node.
   */
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
