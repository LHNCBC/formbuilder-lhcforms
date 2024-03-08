/**
 * Form related helper functions.
 */
import {inject, Injectable, SimpleChange} from '@angular/core';
import {IDType, ITreeNode} from '@bugsplat/angular-tree-component/lib/defs/api';
import {TreeModel} from '@bugsplat/angular-tree-component';
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
import {Util} from '../lib/util';
import {FetchService} from './fetch.service';
import {TerminologyServerComponent} from '../lib/widgets/terminology-server/terminology-server.component';
import {ExtensionsService} from './extensions.service';
declare var LForms: any;

@Injectable({
  providedIn: 'root'
})
export class FormService {
  static _lformsLoaded$ = new Subject<string>();

  private _loading = false;
  _guidingStep$: Subject<string> = new Subject<string>();
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

  fetchService = inject(FetchService);
  formLevelExtensionService = inject(ExtensionsService);
  constructor(private modalService: NgbModal, private http: HttpClient) {
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
        jsonObj = LForms.Util._convertLFormsToFHIRData('Questionnaire', 'R4', jsonObj);
      }
      else {
        throw new Error('Not a valid questionnaire');
      }
    }

    jsonObj = this.convertToR4(jsonObj);
    return this.validateFhirQuestionnaire(jsonObj);
  }


  /**
   * Convert a given questionniare to R4 version. R4 is also internal format.
   * Other formats are converted to internal format using LForms library when loading an external form.
   *
   * @param fhirQ - A given questionnaire. Could be STU3, R4 etc.
   */
  convertToR4(fhirQ: fhir.Questionnaire): fhir.Questionnaire {
    let ret = fhirQ;
    const fhirVersion = LForms.Util.guessFHIRVersion(fhirQ);
    if(fhirVersion !== 'R4') {
      ret = LForms.Util.getFormFHIRData(fhirQ.resourceType, 'R4',
        LForms.Util.convertFHIRQuestionnaireToLForms(fhirQ));
    }
    return ret;
  }

  /**
   * Convert R4, which is default internal format, to other formats such as STU3.
   *
   * @param fhirQ - Given questionnaire.
   * @param version -  desired format, such as STU3
   */
  convertFromR4(fhirQ: fhir.Questionnaire, version: string): fhir.Questionnaire {
    let ret = fhirQ;
    if(version !== 'R4') {
      ret = LForms.Util.getFormFHIRData(fhirQ.resourceType, version,
        LForms.Util.convertFHIRQuestionnaireToLForms(fhirQ));
    }
    return ret;
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
