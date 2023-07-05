/**
 * Form related helper functions.
 */
import {inject, Injectable} from '@angular/core';
import {IDType, ITreeNode} from '@bugsplat/angular-tree-component/lib/defs/api';
import {TreeModel} from '@bugsplat/angular-tree-component';
import fhir from 'fhir/r4';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MessageDlgComponent, MessageType} from '../lib/widgets/message-dlg/message-dlg.component';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import traverse from 'json-schema-traverse';
import jsonTraverse from 'traverse';
import ngxItemSchema from '../../assets/ngx-item.schema.json';
import fhirExtensionSchema from '../../assets/fhir-extension-schema.json';
import itemLayout from '../../assets/items-layout.json';
import ngxFlSchema from '../../assets/ngx-fl.schema.json';
import flLayout from '../../assets/fl-fields-layout.json';
import itemEditorSchema from '../../assets/item-editor.schema.json';
import {Util} from '../lib/util';
import {FetchService} from './fetch.service';
declare var LForms: any;

@Injectable({
  providedIn: 'root'
})
export class FormService {

  private _loading = false;
  _guidingStep$: Subject<string> = new Subject<string>();
  _formReset$: BehaviorSubject<void> = new BehaviorSubject<void>(null);

  localStorageError: Error = null;
  treeModel: TreeModel;
  itemSchema: any = {properties: {}};
  flSchema: any = {properties: {}};
  private _itemEditorSchema: any = {properties: {}};

  snomedUser = false;

  fetchService = inject(FetchService);
  constructor(private modalService: NgbModal, private http: HttpClient) {
    [{schema: ngxItemSchema as any, layout: itemLayout}, {schema: ngxFlSchema as any, layout: flLayout}].forEach((obj) => {
      if(!obj.schema.definitions) {
        obj.schema.definitions = {};
      }
      obj.schema.definitions.Extension = fhirExtensionSchema as any;
      this._updateExtension(obj.schema);
      obj.schema.layout = obj.layout;
    });
    this.itemSchema = ngxItemSchema;
    this.flSchema = ngxFlSchema;
    this._itemEditorSchema = itemEditorSchema;
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

  /**
   * Update main schema with adjusted extension schema recursively
   *
   * @param rootSchema
   */
  _updateExtension(rootSchema: any) {
    const extension = rootSchema.definitions.Extension;
    traverse(rootSchema, {}, (
      schema,
      jsonPtr,
      rootSch,
      parentJsonPtr,
      parentKeyword,
      parentSchema,
      indexOrProp) => {
      if(parentKeyword === 'items' && (parentJsonPtr.endsWith('extension') || parentJsonPtr.endsWith('modifierExtension'))) {
        // Save title and description before over writing them.
        const commonFields = {title: schema.title, description: schema.description};
        Object.assign(schema, extension);
        // title and description are overwritten. Restore them.
        if(commonFields.title) {
          schema.title = commonFields.title;
        }
        if(commonFields.description) {
          schema.description = commonFields.description;
        }
      }
    });
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


  /**
   * Getter for form reset Observable
   */
  get formReset$(): Observable<void> {
    return this._formReset$.asObservable();
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
  setGuidingStep(step: string) {
    this._guidingStep$.next(step);
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
        jsonObj = LForms.Util._convertLFormsToFHIRData('Questionnaire', 'R4', jsonObj);
      }
      else {
        throw new Error('Not a valid questionnaire');
      }
    }

    return this.validateFhirQuestionnaire(jsonObj);
  }


  /**
   * Possible validation checks.
   *
   * @param json
   */
  validateFhirQuestionnaire(json: any): fhir.Questionnaire {
    jsonTraverse(json).forEach(function(x) {
        if (this.key === 'item') {
          let htIndex = -1;
          const index = x.findIndex((e) => {
            htIndex = Util.findItemIndexWithHelpText(e.item);
            return htIndex >= 0;
          });
          if(index >= 0) {
            const helpText = x[index].item[htIndex].text;
            x[index].item.splice(htIndex, 1);
            if(x[index].item.length === 0) {
              delete x[index].item;
            }
            jsonTraverse(x[index]).set(['__$helpText'], helpText);
          }
        }
    });

    return json as fhir.Questionnaire;
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
}
