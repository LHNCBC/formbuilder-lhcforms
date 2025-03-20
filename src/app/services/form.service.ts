/**
 * Form related helper functions.
 */
import {inject, Injectable, SimpleChange} from '@angular/core';
import {IDType, ITreeNode} from '@bugsplat/angular-tree-component/lib/defs/api';
import {TreeModel, TreeNode} from '@bugsplat/angular-tree-component';
import fhir from 'fhir/r4';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MessageDlgComponent, MessageType} from '../lib/widgets/message-dlg/message-dlg.component';
import {Observable, Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import jsonTraverse from 'traverse';
import {JsonPointer} from 'json-ptr';
import {loadLForms, getSupportedLFormsVersions} from 'lforms-loader';

// Configuration files
// @ts-ignore
import ngxItemSchema from '../../assets/ngx-item.schema.json5';
// @ts-ignore
import fhirSchemaDefinitions from '../../assets/fhir-definitions.schema.json5';
// @ts-ignore
import itemLayout from '../../assets/items-layout.json5';
// @ts-ignore
import ngxFlSchema from '../../assets/ngx-fl.schema.json5';
// @ts-ignore
import flLayout from '../../assets/fl-fields-layout.json5';
// @ts-ignore
import itemEditorSchema from '../../assets/item-editor.schema.json5';
import {GuidingStep, Util} from '../lib/util';
import {FetchService} from './fetch.service';
import {TerminologyServerComponent} from '../lib/widgets/terminology-server/terminology-server.component';
import {ExtensionsService} from './extensions.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

declare var LForms: any;

export interface ErrorNode {
  [fieldName:string]: any [];
}

export interface TreeNodeStatus{
  treeNodeId: string;
  linkId: string;
  hasError?: boolean;
  childHasError?: boolean;
  errorMessage?: string;
  errors?: ErrorNode;
}

export type TreeNodeStatusMap = {
  [key:string]: TreeNodeStatus;
}

export type LinkIdTrackerMap = {
  [linkIdKey:string] : string[];
}

@Injectable({
  providedIn: 'root'
})
export class FormService {
  static _lformsLoaded$ = new Subject<string>();
  static readonly TREE_NODE_ID = "__$treeNodeId";
  _validationStatusChanged$: Subject<void> = new Subject<void>();


  private _loading = false;
  _guidingStep$: Subject<GuidingStep> = new Subject<GuidingStep>();
  _formReset$: Subject<void> = new Subject<void>();
  _formChanged$: Subject<SimpleChange> = new Subject<SimpleChange>();
  _advPanelState = {
    formLevel: true,
    itemLevel: true
  }

  localStorageError: Error = null;
  treeModel: TreeModel;
  itemSchema: any = {properties: {}};
  flSchema: any = {properties: {}};
  private _itemEditorSchema: any = {properties: {}};

  snomedUser = false;
  _lformsVersion = '';
  _lformsErrorMessage = null;
  _windowOpenerUrl: string = null;

  fetchService = inject(FetchService);
  formLevelExtensionService = inject(ExtensionsService);

  treeNodeStatusMap: TreeNodeStatusMap;
  linkIdTracker:LinkIdTrackerMap = {};

  // All operators
  operatorOptions: any [] = [
    {option: 'exists', label: 'Not empty'},
    {option: 'notexists', label: 'Empty'},
    {option: '=', label: '='},
    {option: '!=', label: '!='},
    {option: '>', label: '>'},
    {option: '<', label: '<'},
    {option: '>=', label: '>='},
    {option: '<=', label: '<='}
  ];

  // A subset of operators for certain types
  operatorOptions2: any [] = this.operatorOptions.filter((e) => {
    return (
      e.option === 'exists' ||
      e.option === 'notexists' ||
      e.option === '=' ||
      e.option === '!='
    );
  });

  // Operators based on type.
  enableWhenOperatorOptions = {
    decimal: this.operatorOptions,
    integer: this.operatorOptions,
    quantity: this.operatorOptions,
    date: this.operatorOptions,
    dateTime: this.operatorOptions,
    time: this.operatorOptions,
    string: this.operatorOptions,
    text: this.operatorOptions,
    url: this.operatorOptions2,
    boolean: this.operatorOptions2,
    coding: this.operatorOptions2,
    attachment: this.operatorOptions2,
    reference: this.operatorOptions2
  };

  constructor(private modalService: NgbModal, private http: HttpClient, private liveAnnouncer: LiveAnnouncer ) {
    [{schema: ngxItemSchema as any, layout: itemLayout}, {schema: ngxFlSchema as any, layout: flLayout}].forEach((obj) => {
      if(!obj.schema.definitions) {
        obj.schema.definitions = {};
      }
      obj.schema.definitions = fhirSchemaDefinitions.definitions as any;
      obj.schema.formLayout = obj.layout.formLayout;
      this.overrideSchemaWidgetFromLayout(obj.schema, obj.layout);
      this.overrideFieldLabelsFromLayout(obj.schema, obj.layout);
    });
    this.itemSchema = ngxItemSchema;
    this.flSchema = ngxFlSchema;
    this._itemEditorSchema = itemEditorSchema;


    // Load lforms.
    this.loadLFormsLib().then((loadedVersion: string) => {
      this._lformsVersion = LForms.lformsVersion;
      FormService._lformsLoaded$.next(this._lformsVersion);
    }).catch((error) => {
      console.error(error);
      this._lformsVersion = 'ERROR';
      FormService._lformsLoaded$.error(error);
    });

  }

  /**
   * Override schema.widget with widget definitions from layout.
   * @param schema - Schema object typically from *-schema.json file.
   * @param widgets - widgets definitions from layout files.
   * @param widgetsMap - An object mapping widget type to list of json pointers to select fields in schema. The selected field's widget
   *   definition is replaced with widget definitions from the layout.
   *   See src/assets/*layout.json5 and src/assets/*schema.json5 files for more information.
   */
  overrideSchemaWidgetFromLayout(schema, {widgets, widgetsMap}) {
    if(!widgetsMap || !widgets) {
      return;
    }

    Object.keys(widgetsMap).forEach((widgetType) => {
      const widgetInfo = widgets[widgetType];
      if(widgetInfo) {
        const fieldPtrs: string[] = widgetsMap[widgetType];
        fieldPtrs?.forEach((ptr) => {
          const fieldSchema: any = JsonPointer.get(schema, ptr);
          if(fieldSchema) {
            fieldSchema.widget = widgetInfo;
          }
        });
      }
    });
  }

  /**
   * Override field labels with custom labels. By default, title attribute of the field is used as label. To override default label,
   * custom labels are defined in layout file.
   * @param schema - Schema object.
   * @param overridePropertyLabels - An object defined in layout file.
   */
  overrideFieldLabelsFromLayout(schema, {overridePropertyLabels}) {
    if(!overridePropertyLabels) {
      return;
    }

    Object.entries(overridePropertyLabels).forEach(([ptr, title]) => {
      const fieldSchema: any = JsonPointer.get(schema, ptr);
      if(fieldSchema) {
        if(fieldSchema) {
          fieldSchema.title = title;
        }
      }
    });
  }

  public get itemEditorSchema() {
    return this._itemEditorSchema;
  }

  /**
   * Get item level schema
   */
  getItemSchema() {
    return this.itemSchema;
  }

  /**
   * Get form level schema
   */
  getFormLevelSchema() {
    return this.flSchema;
  }

  get windowOpenerUrl(): string {
    return this._windowOpenerUrl;
  }

  set windowOpenerUrl(url: string) {
    this._windowOpenerUrl = url;
  }

  get lformsVersion(): string {
    return this._lformsVersion;
  }

  get lformsErrorMessage(): string | null {
    return this._lformsErrorMessage;
  }
  set loading(loading: boolean) {
    this._loading = loading;
  }

  get loading(): boolean {
    return this._loading;
  }

  /**
   * Access guiding step observable.
   */
  get guidingStep$(): Observable<string> {
    return this._guidingStep$.asObservable();
  }

  static get lformsLoaded$(): Observable<string> {
    return FormService._lformsLoaded$.asObservable();
  }

  /**
   * Getter for validation status changed Observable
   */
  get validationStatusChanged$(): Observable<void> {
    return this._validationStatusChanged$.asObservable();
  }

  /**
   * Getter for form reset Observable
   */
  get formReset$(): Observable<void> {
    return this._formReset$.asObservable();
  }

  /**
   * Form changed getter. Triggered when new form is loaded, such as clicking different node on the sidebar.
   * @return - Observable resolving to SimpleChange object.
   */
  get formChanged$(): Observable<SimpleChange> {
    return this._formChanged$.asObservable();
  }

  /**
   * Setter for form level advanced panel state
   */
  set formLevel(collapse: boolean) {
    this._advPanelState.formLevel = collapse;
  }

  /**
   * Getter for form level advanced panel state
   */
  get formLevel(): boolean {
    return this._advPanelState.formLevel;
  }

  /**
   * Setter for item level advanced panel state
   */
  set itemLevel(collapse: boolean) {
    this._advPanelState.itemLevel = collapse;
  }

  /**
   * Getter for item level advanced panel state
   */
  get itemLevel(): boolean {
    return this._advPanelState.itemLevel;
  }

  /**
   * Trigger formChanged$ observable with form changes.
   *
   * @param change - SimpleChange object representing changes to the form.
   */
  formChanged(change: SimpleChange): void {
    this._formChanged$.next(change);
  }

  /**
   * Notify form reset event.
   */
  resetForm(): void {
    this._formReset$.next(null);
  }
  /**
   * Inform the listeners of change in step.
   * @param step
   */
  setGuidingStep(step: GuidingStep) {
    this._guidingStep$.next(step);
  }

  /**
   * Traverses through the tree nodes, stores each node in the 'validationNodes'
   * array, and returns this array to be used for validation during initialization.
   * @returns - array of TreeNodes.
   */
  loadValidationNodes(): TreeNode[] {
    const validationNodes: TreeNode[] = [];
    function recurse(node: TreeNode): void {
      validationNodes.push(node);

      if (node.hasChildren) {
        for (const child of node.children) {
          recurse(child);
        }
      }
    }

    const roots = this.treeModel.roots;
    if (roots) {
      for (const root of roots) {
        recurse(root);
      }
    }

    return validationNodes;
  }

  /**
   * Walk through the treeModel and populate the TreeNodeStatus for each of the
   * TreeNodes into the TreeNodeStatusMap.
   */
  loadTreeNodeStatusMap(): void {
    const treeNodeStatusMap: TreeNodeStatusMap = {};
    function recurse(node: TreeNode): void {
      treeNodeStatusMap[node.data[FormService.TREE_NODE_ID]] = {
        treeNodeId: node.data[FormService.TREE_NODE_ID],
        linkId: (node.data.linkId) ? node.data.linkId : ''
      }

      if (node.hasChildren) {
        for (const child of node.children) {
          recurse(child);
        }
      }
    }

    if (!this.treeNodeStatusMap || Object.keys(this.treeNodeStatusMap).length === 0) {
      const roots = this.treeModel.roots;
      if (roots) {
        for (const root of roots) {
          recurse(root);
        }
      }

      this.treeNodeStatusMap = treeNodeStatusMap;
    }
  };

  /**
   * Add Tree Node Status for error tracking when an item is added to the Questionnaire
   * @param treeNodeId - tree node id
   * @param linkId - linkId associated with item of the node.
   */
  addTreeNodeStatus(treeNodeId: string, linkId: string): void {
    if (!(treeNodeId in this.treeNodeStatusMap)) {
      this.treeNodeStatusMap[treeNodeId] = {
        treeNodeId: treeNodeId,
        linkId: (linkId) ? linkId : ''
      }
    }
  };

  /**
   * Remove the Tree Node Status from error tracking when the item is deleted.
   * @param treeNodeId - tree node id
   */
  deleteTreeNodeStatus(treeNodeId: string): void {
    delete this.treeNodeStatusMap[treeNodeId];
  }

  /**
   * The 'linkId' must be unique within the questionnaire. Check if the edited 'linkId'
   * already exists in the questionnaire using the 'linkIdTracker'.
   * @param newLinkId - linkId associated with item of the node.
   * @param treeNodeId - tree node id.
   * @returns true if the edited 'linkId' is not unique, otherwie return false.
   */
  treeNodeHasDuplicateLinkIdByLinkIdTracker(newLinkId: string, treeNodeId: string): boolean {
    if (!treeNodeId || !this.treeNodeStatusMap)
      return false;

    return (newLinkId in this.linkIdTracker && ( this.linkIdTracker[newLinkId].length > 1 || (this.linkIdTracker[newLinkId].length === 1 && this.linkIdTracker[newLinkId].indexOf(treeNodeId.toString()) === -1)) );
  };

  /**
   * Check if the tree node for the given tree node id contains an error.
   * @param treeNodeId - tree node id.
   * @param includeChildNodes - indicates whether to include child nodes in this check.
   * @returns true if the tree node contains error, otherwise false.
   */
  isTreeNodeHasErrorById(treeNodeId: string, includeChildNodes: boolean = true): boolean {
    if (this.treeNodeStatusMap && this.treeNodeStatusMap[treeNodeId]) {
      const nodeHasError = ('hasError' in this.treeNodeStatusMap[treeNodeId]) ? this.treeNodeStatusMap[treeNodeId]['hasError'] : false;
      if (includeChildNodes) {
        const childNodeHasError = ('childHasError' in this.treeNodeStatusMap[treeNodeId]) ? this.treeNodeStatusMap[treeNodeId]['childHasError'] : false;
        return (nodeHasError || childNodeHasError);
      } else {
        return nodeHasError;
      }
    }
    return false;
  }

  /**
   * Check if the focus node contains an error.
   * @returns true if the focus node contains error, otherwise false.
   */
  isFocusNodeHasError(): boolean {
    if (this.treeModel) {
      const node = this.treeModel.getFocusedNode();
      if (node)
        return this.isTreeNodeHasErrorById(node.data[FormService.TREE_NODE_ID], false);
    }
    return false;
  }

  /**
   * Return the TreeNodeStatus for the given tree node id.
   * @param treeNodeId - tree node id.
   * @returns - TreeNodeStatus object if found, otherwise null.
   */
  getTreeNodeStatusById(treeNodeId: string): TreeNodeStatus | null {
    if (this.treeNodeStatusMap && (treeNodeId in this.treeNodeStatusMap)) {
      return this.treeNodeStatusMap[treeNodeId];
    }
    return null;
  }

  /**
   * Check if the sibling nodes contain errors.
   * @param node - current tree node
   * @returns true if any of the sibling nodes contain errors, otherwise false.
   */
  siblingHasError(node:ITreeNode): boolean {
    let siblingHasError = false;
    if (node.parent && !node.isRoot && node.parent.hasChildren) {
      siblingHasError = node.parent.children.some((n) => {
        const siblingIdStr = n.data[FormService.TREE_NODE_ID];
        return node.data[FormService.TREE_NODE_ID] !== siblingIdStr && (this.treeNodeStatusMap[siblingIdStr]?.hasError ?? false);
      });
    }
    return siblingHasError;
  }

  /**
   * Set the ancestor nodes' 'childHasError' status to 'false'.
   * @param node - Ancestor node.
   */
  removeErrorFromAncestorNodes(node: ITreeNode): void {
    const nodeIdStr = node.data[FormService.TREE_NODE_ID];
    if (nodeIdStr in this.treeNodeStatusMap) {
      this.treeNodeStatusMap[nodeIdStr]['childHasError'] = false;
    }

    if (node.parent && !node.isRoot &&
        (!('childHasError' in this.treeNodeStatusMap[nodeIdStr]) || !this.treeNodeStatusMap[nodeIdStr]['childHasError'])) {

      const siblingHasError = this.siblingHasError(node);
      if (!siblingHasError)
        this.removeErrorFromAncestorNodes(node.parent);
    }
  }

  /**
   * Set the ancestor nodes' 'childHasError' status to 'true'.
   * @param node - Ancestor node.
   */
  addErrorForAncestorNodes(node: ITreeNode): void {
    const nodeIdStr = node.data[FormService.TREE_NODE_ID];

    if (nodeIdStr in this.treeNodeStatusMap) {
      this.treeNodeStatusMap[nodeIdStr]['childHasError'] = true;
    }

    // The root node may have parent, but it is not an item
    if (node.parent && !node.isRoot) {
      this.addErrorForAncestorNodes(node.parent);
    }
  }

  /**
   * Update validation status to the TreeNodeStatusMap.
   * @param treeNodeId - tree node id
   * @param linkId - linkId associated with item of the node.
   * @param fieldName - name of the field being validated.
   * @param errors - Null, if the validation passes. Set the 'hasError' status to 'false'
   *                 and the ancestor nodes' 'chilcHasError' status to 'false'.
   *                 Array of errors if the the validation fails. Set the 'hasError' status
   *                 to 'true' and the ancestor nodes' 'childHasError' status to 'true'.
   *                 Also stores the array of errors objects.
   */
  updateValidationStatus(treeNodeId: string, linkId: string, fieldName: string, errors: any[]): void {
    if (!this.treeNodeStatusMap || !this.treeNodeStatusMap[treeNodeId])
      return;

    this.treeNodeStatusMap[treeNodeId]['linkId'] = linkId;
    if (errors) {
      if (!this.treeNodeStatusMap[treeNodeId]['errors'])
        this.treeNodeStatusMap[treeNodeId]['errors'] = {};
      this.treeNodeStatusMap[treeNodeId]['errors'][fieldName] = errors;
      this.treeNodeStatusMap[treeNodeId]['hasError'] = true;
    } else {
      if (this.treeNodeStatusMap[treeNodeId]['errors'] && fieldName in this.treeNodeStatusMap[treeNodeId]['errors']) {
        this.liveAnnouncer.announce('Error is resolved for this node.');
        delete this.treeNodeStatusMap[treeNodeId]['errors'][fieldName];
      }

      this.treeNodeStatusMap[treeNodeId]['hasError'] = (Object.keys(this.treeNodeStatusMap[treeNodeId]?.errors ?? {}).length > 0);
    }

    const node = this.getTreeNodeById(treeNodeId);

    if (node && node.parent && !node.isRoot) {
      if (errors) {
        this.addErrorForAncestorNodes(node.parent);

      } else {
        // Only remove the error from ancestor nodes if
        // - the focus node does not contain errors
        // - the child nodes do not contain errors
        // - the sibling nodes do not contain errors
        const siblingHasError = this.siblingHasError(node);
        if (!siblingHasError && Object.keys(this.treeNodeStatusMap[treeNodeId]?.errors ?? {}).length === 0 &&
            (!('childHasError' in this.treeNodeStatusMap[treeNodeId]) || !this.treeNodeStatusMap[treeNodeId]['childHasError']))
          this.removeErrorFromAncestorNodes(node.parent);
      }
    }
  }

  /**
   * Delete the enableWhen error that matches the given rowIndex and adjusts the indices of the
   * remaining enableWhen error keys that are greater than the rowIndex from the TreeNodeStatusMap.
   *
   * The errors are tracked using the key format 'enableWhen_' + <row index>.  When an enableWhen
   * is deleted, the existing enableWhen errors may need to be shifted up accordingly.
   *
   * @param treeNodeId - tree node id.
   * @param rowIndex - the row index of the Enable When condition that is being deleted.
   */
  deleteErrorAndAdjustEnableWhenIndexes(treeNodeId: string, rowIndex: number): void {
    if (!this.treeNodeStatusMap || !this.treeNodeStatusMap[treeNodeId])
      return;

    const fieldName = `enableWhen_${rowIndex}`;
    if (this.treeNodeStatusMap[treeNodeId]['errors'] && fieldName in this.treeNodeStatusMap[treeNodeId]['errors']) {
      delete this.treeNodeStatusMap[treeNodeId]['errors'][fieldName];
    }

    const enableWhenKeys = Object.keys(this.treeNodeStatusMap[treeNodeId]['errors']);

    enableWhenKeys.forEach(ewKey => {
      const match = ewKey.match(/enableWhen_(\d+)/);
      const keyIndex = match ? Number(match[1]) : -1;

      if (!isNaN(keyIndex) && keyIndex > rowIndex) {
        this.treeNodeStatusMap[treeNodeId]['errors'][`enableWhen_${keyIndex - 1}`] =
          this.treeNodeStatusMap[treeNodeId]['errors'][`enableWhen_${keyIndex}`];
        delete this.treeNodeStatusMap[treeNodeId]['errors'][`enableWhen_${keyIndex}`];
      }
    });

    this.treeNodeStatusMap[treeNodeId]['hasError'] = (Object.keys(this.treeNodeStatusMap[treeNodeId]?.errors ?? {}).length > 0);
    this._validationStatusChanged$.next(null);
  }


  /**
   * Remove treeNodeStatusMap from local storage.
   */
  clearAutoSavedTreeNodeStatusMap() {
    localStorage.removeItem('treeMap');
    this.treeNodeStatusMap = {};
  }

  /**
   * Load and initialize the 'linkIdTracker' to track duplicate
   * 'linkIds' for each tree node.
   */
  loadLinkIdTracker(): void {
    Object.values(this.treeNodeStatusMap).map((node) => {
      const linkId = node.linkId;
      const nodeId = node.treeNodeId;

      if (linkId in this.linkIdTracker) {
        if (this.linkIdTracker[linkId].indexOf(nodeId) === -1)
          this.linkIdTracker[linkId].push(nodeId);
      } else {
        this.linkIdTracker[linkId] = [nodeId];
      }
    });
  }

  /**
   * Retrieve tree node ids for a specified 'linkId'.
   * @param linkId - linkId associated with item of the node.
   * @returns Array of tree node id(s) if found, otherwise null
   */
  getNodeIdsByLinkId(linkId: string): string[] | null {
    return ((linkId || linkId === '') && linkId in this.linkIdTracker) ? this.linkIdTracker[linkId] : null;
  }

  /**
   * Check if the linkId exists in the Questionnaire/linkIdTracker.
   * @param linkId - linkId associated with item of the node.
   * @returns True if the linkId exists in the linkIdTracker.
   */
  isValidLinkId(linkId: string): boolean {
    return !!this.getNodeIdsByLinkId(linkId);
  }

  /**
   * Add the 'linkId' and associated tree node id to the 'linkIdTracker'.
   * @param treeNodeId - tree node id.
   * @param linkId - linkId associated with item of the node.
   */
  addLinkIdToLinkIdTracker(treeNodeId: string, linkId: string): void {
    if (linkId in this.linkIdTracker) {
      if (this.linkIdTracker[linkId].indexOf(treeNodeId) === -1)
        this.linkIdTracker[linkId].push(treeNodeId);
    } else {
      this.linkIdTracker[linkId] = [treeNodeId];
    }
  }

  /**
   * Remove the specified 'linkId' from the 'linkIdTracker', but if the 'linkId'
   * corresponds to an array containing multiple ids, only remove the matching
   * 'treeNodeId' from the array.
   * @param treeNodeId - tree node id.
   * @param linkId - linkId associated with item of the node.
   */
  removeLinkIdFromLinkIdTracker(treeNodeId: string, linkId: string): void {
    if (linkId in this.linkIdTracker) {
      if (this.linkIdTracker[linkId].length > 1) {
        const index = this.linkIdTracker[linkId].indexOf(treeNodeId);
        if (index > -1) {
          this.linkIdTracker[linkId].splice(index, 1);
        }
      } else {
        delete this.linkIdTracker[linkId];
      }
    }
  }

  /**
   * Update the 'linkIdTracker' whenever the 'linkId' value changes.
   * @param prevLinkId - existing linkId associated with item of the node.
   * @param newLinkId - updated linkId associated with item of the node.
   * @param treeNodeId - tree node id
   */
  updateLinkIdForLinkIdTracker(prevLinkId: string, newLinkId: string, treeNodeId: string): void {
    if (treeNodeId) {
      if (prevLinkId)
        this.removeLinkIdFromLinkIdTracker(treeNodeId, prevLinkId);
      this.addLinkIdToLinkIdTracker(treeNodeId, newLinkId);
    }
  }

  /**
   * Reset the linkIdTracker
   */
  clearLinkIdTracker(): void {
    this.linkIdTracker = {};
  }

  /**
   * Intended to collect source items for enable when logic
   * Get sources for focused item.
   */
  getSourcesExcludingFocusedTree(): ITreeNode [] {
    let ret = null;
    if (this.treeModel) {
      const fNode = this.treeModel.getFocusedNode();
      ret = this.getEnableWhenSources(fNode);
    }
    return ret;
  }

  /**
   * Returns a list of EnableWhen operators based on the given answer type.
   * @param answerType - Type of the source item.
   * @returns - a list of operators associated with the given answer type.
   */
  getEnableWhenOperatorListByAnswerType(answerType: string): any [] {
    return this.enableWhenOperatorOptions[answerType];
  }

  /**
   * Get sources excluding the branch of a given node.
   * @param focusedNode
   * @param treeModel?: Optional tree model to search. Default is this.treeModel.
   */
  getEnableWhenSources(focusedNode: ITreeNode, treeModel?: TreeModel): ITreeNode [] {
    if (!treeModel) {
      treeModel = this.treeModel;
    }
    let ret = null;
    if (treeModel) {
      ret = this.getEnableWhenSources_(treeModel.roots, focusedNode);
    }
    return ret;
  }


  /**
   * Get sources from a given list of nodes excluding the branch of focused node.
   * @param nodes - List of nodes to search
   * @param focusedNode - Reference node to exclude the node and its descending branch
   * @private
   */
  private getEnableWhenSources_(nodes: ITreeNode [], focusedNode: ITreeNode): ITreeNode [] {
    const ret: ITreeNode [] = [];
    for (const node of nodes) {
      if (node !== focusedNode) {
        if (node.data.type !== 'group' && node.data.type !== 'display') {
          ret.push(node);
        }
        if (node.hasChildren) {
          ret.push.apply(ret, this.getEnableWhenSources_(node.children, focusedNode));
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
   * Get node by its tree node id.
   * @param treeNodeId
   */
  getTreeNodeById(treeNodeId: IDType): ITreeNode {
    return this.treeModel.getNodeById(treeNodeId);
  }


  /**
   * Get a node by linkId from entire tree.
   * @param linkId
   */
  getTreeNodeByLinkId(linkId: string): ITreeNode {
    return this.findNodeByLinkId(this.treeModel?.roots, linkId);
  }

  /**
   * Checks if the focused node has an extension.
   * @returns True if the focused node's data contains an extension. Otherwise false.
   */
  hasExtension(): boolean {
    const ext = this.treeModel?.getFocusedNode()?.data?.extension;
    return Array.isArray(ext) ? ext.length > 0 : !!ext;
  }

  /**
   * Checks if the focused node has sub-items.
   * @returns True if the focused node's data contains sub-items. Otherwise false.
   */
  hasSubItems(): boolean {
    return !!this.treeModel?.getFocusedNode()?.data?.item;
  }

  /**
   * Get preferred terminology server walking along the ancestral tree nodes. Returns the first encountered server.
   * @param sourceNode - Tree node to start the traversal.
   * @return - Returns the url of the terminology server extracted from the extension.
   */
  getPreferredTerminologyServer(sourceNode: ITreeNode): string {
    let ret = null;
    Util.traverseAncestors(sourceNode, (node) => {
      const found = node.data.extension?.find((ext) => {
        return ext.url === TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI
      });
      ret = found ? found.valueUrl : null;
      return !ret; // Continue traverse if url is not found.
    });
    if(!ret) {
      const ext = this.formLevelExtensionService.getFirstExtensionByUrl(TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI)
      ret = ext ? ext.valueUrl : null;
    }
    return ret;
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


  /**
   * General purpose information dialog
   *
   * @param title - Title of dialog
   * @param message - Message to display
   * @param type - INFO | WARNING | DANGER
   */
  showMessage(title: string, message: string, type: MessageType = MessageType.INFO) {

    const modalRef = this.modalService.open(MessageDlgComponent, {scrollable: true});
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.type = type;
  }


  /**
   * Parse input string to questionnaire.
   * @param text - Text content of input form, either FHIR questionnaire or LForms format.
   */
  parseQuestionnaire(text: string): fhir.Questionnaire {
    const invalidError = new Error('Not a valid JSON');
    if(!text) {
      throw invalidError;
    }

    let jsonObj = null;
    try {
      jsonObj = JSON.parse(text);
    }
    catch(e) {
      throw invalidError;
    }

    if(jsonObj.resourceType !== 'Questionnaire') {
      if (!!jsonObj.name) {
        jsonObj = LForms.Util.getFormFHIRData('Questionnaire', 'R5', jsonObj);
      }
      else {
        throw new Error('Not a valid questionnaire');
      }
    }

    return this.convertToR5(jsonObj);
  }


  /**
   * Convert a given questionnaire to R5 version. R5 is also internal format.
   * Other formats are converted to internal format using LForms library when loading an external form.
   *
   * @param fhirQ - A given questionnaire. Could be STU3, R4, R5 etc.
   */
  convertToR5(fhirQ: fhir.Questionnaire): fhir.Questionnaire {
    let ret = fhirQ;
    const fhirVersion = Util.detectFHIRVersion(fhirQ);
    if(fhirVersion !== 'R5') {
      ret = Util.convertQuestionnaire(fhirQ, 'R5');
    }
    return ret;
  }

  /**
   * Convert from R5, which is default internal format, to other formats such as STU3.
   *
   * @param fhirQ - Given questionnaire.
   * @param version -  desired format, such as STU3
   */
  convertFromR5(fhirQ: fhir.Questionnaire, version: string): fhir.Questionnaire {
    let ret = fhirQ;
    if (version === 'LHC-Forms') {
      ret = LForms.Util.convertFHIRQuestionnaireToLForms(fhirQ);
    } else if (version !== 'R5') {
      ret = Util.convertQuestionnaire(fhirQ, version);
    }
    return ret;
  }

  /**
   * Possible adjustments to questionnaire.
   *
   * @param questionnaire - Input questionnaire
   */
  updateFhirQuestionnaire(questionnaire: fhir.Questionnaire): fhir.Questionnaire {

    // Remove any meta.tag.code generated by LForms.
    if(questionnaire.meta?.tag) {
      questionnaire.meta.tag = questionnaire.meta.tag.filter((tag) => {
        return ! /^\s*lformsVersion\s*:/i.test(tag.code);
      });
      if(questionnaire.meta.tag.length === 0) {
        delete questionnaire.meta.tag;
      }
    }
    jsonTraverse(questionnaire).forEach(function(x) {
        if (x?.item) {
          // Convert any help text items to __$helpText.
          let htIndex = Util.findItemIndexWithHelpText(x.item);

          if(htIndex >= 0) {
            const helpText = x.item[htIndex];
            jsonTraverse(x).set(['__$helpText'], helpText);
            x.item.splice(htIndex, 1);
            if(x.item.length === 0) {
              delete x.item;
            }
          }
        }
        if(x?.answerOption || x?.type === 'coding' || x?.answerValueSet || x?.answerConstraint) {
          x.__$isAnswerList = true;
        }
    });

    return questionnaire;
  }


  /**
   * Remove questionnaire from local storage.
   */
  clearAutoSavedForm() {
    localStorage.removeItem('fhirQuestionnaire');
  }


  /**
   * Save questionnaire in local storage
   * @param fhirQ - Questionnaire
   */
  autoSaveForm(fhirQ: fhir.Questionnaire) {
    this.autoSave('fhirQuestionnaire', fhirQ);
    this.notifyWindowOpener({type: 'updateQuestionnaire', questionnaire: fhirQ});
  }


  /**
   * Send data to parent window (window that opened this page).
   *
   * @param data - Data to post.
   */
  notifyWindowOpener(data: any) {
    if(this._windowOpenerUrl) {
      window.opener.postMessage(data, this._windowOpenerUrl);
    }
  }


  /**
   * Retrieve questionnaire from the storage.
   */
  autoLoadForm(): fhir.Questionnaire {
    return this.autoLoad('fhirQuestionnaire') as fhir.Questionnaire;
  }


  /**
   * Store key, value to local storage. Checks the availability of storage before saving.
   * @param key - Key for storage.
   * @param value - Object or string to store.
   */
  autoSave(key: string, value: any) {
    if(this._storageAvailable('localStorage')) {
      if(value) {
        if(key !== 'state' && value) {
          // Non state are objects
          localStorage.setItem(key, JSON.stringify(value));
        }
        else {
          // State is string type.
          localStorage.setItem(key, value);
        }
      }
      else {
        localStorage.removeItem(key);
      }
    }
    else {
      console.error('Local storage not available!');
    }
  }


  /**
   * Retrieve an item from local storage
   * @param key - Key of the item to retrieve
   */
  autoLoad(key: string): any {
    let ret: any = null;
    if(this._storageAvailable('localStorage')) {
      const str = localStorage.getItem(key);
      if(str) {
        if(key !== 'state') {
          ret = JSON.parse(str);
        }
        else {
          ret = str;
        }
      }
    }
    else {
      console.error('Local storage not available!');
    }
    return ret;
  }


  /**
   * Test the storage for availability
   * @param type - localStorage | sessionStorage
   * @return boolean
   */
  _storageAvailable(type): boolean {
    let storage;
    try {
      storage = window[type];
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      this.localStorageError = null;
      return true;
    }
    catch(e) {
      this.localStorageError = e;
      return e instanceof DOMException && (
          // everything except Firefox
        e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        (storage && storage.length !== 0);
    }
  }


  /**
   * Check if a questionnaire is saved in local storage.
   */
  isAutoSaved(): boolean {
    return !!localStorage.getItem('fhirQuestionnaire');
  }

  /**
   * Get snomed user flag.
   */
  isSnomedUser(): boolean {
    return this.snomedUser;
  }

  /**
   * Set snomed user flag.
   * @param accepted -boolean
   */
  setSnomedUser(accepted: boolean) {
    this.snomedUser = accepted;
    if(this.snomedUser) {
      this.fetchService.fetchSnomedEditions();
    }
  }

  /**
   * Load LForms library at run time.
   * @return - A promise which resolves to version number loaded.
   */
  loadLFormsLib(): Promise<string> {
    return getSupportedLFormsVersions().then((versions) => {
      const latestVersion = versions[0] || '34.3.0';
      return loadLForms(latestVersion).then(() => latestVersion).catch((error) => {
        console.error(`lforms-loader.loadLForms() failed: ${error.message}`);
        throw new Error(error);
      });
    }).catch((error) => {
      console.error(`lforms-loader.getSupportedLFormsVersions() failed: ${error.message}`);
      throw new Error(error);
    });
  }
}
