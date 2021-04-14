/**
 * Handle side bar tree, item level fields editing in ui and editing in json
 */
import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import {ITreeOptions, TreeComponent} from '@circlon/angular-tree-component';
import {FetchService, LoincItemType} from '../fetch.service';
import {MatInput} from '@angular/material/input';
import {ShareObjectService} from '../share-object.service';
import {ITreeNode} from '@circlon/angular-tree-component/lib/defs/api';
import {FormService} from '../services/form.service';
import {NgxSchemaFormComponent} from '../ngx-schema-form/ngx-schema-form.component';
import {ItemJsonEditorComponent} from '../lib/widgets/item-json-editor/item-json-editor.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {debounceTime, distinctUntilChanged, switchMap, takeUntil} from 'rxjs/operators';
import {fhir} from '../fhir';

export class LinkIdCollection {
  linkIdHash = {};

  addLinkId(linkId, itemPath): boolean {
    let ret = false;
    if (linkId && linkId.trim().length > 0) {
      this.linkIdHash[linkId.trim()] = itemPath;
      ret = true;
    }

    return ret;
  }

  getItemPath(linkId): string {
    return this.linkIdHash[linkId];
  }

  hasLinkId(linkId): boolean {
    return this.linkIdHash.hasOwnProperty(linkId);
  }

  deleteLinkId(linkId): boolean {
    let ret = false;
    if (this.getItemPath(linkId)) {
      delete this.linkIdHash[linkId];
      ret = true;
    }
    return ret;
  }

  changeLinkId(oldLinkId, newLinkId): boolean {
    let ret = false;
    const itemPath = this.getItemPath(oldLinkId);
    if (itemPath) {
      this.deleteLinkId(oldLinkId);
      this.addLinkId(newLinkId, itemPath);
      ret = true;
    }
    return ret;
  }
}

@Component({
  selector: 'lfb-item-component',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit, AfterViewInit {
  id = 1;
  @ViewChild('tree') treeComponent: TreeComponent;
  @ViewChild('jsonEditor') jsonItemEditor: ItemJsonEditorComponent;
  @ViewChild('uiEditor') uiItemEditor: NgxSchemaFormComponent;
  @ViewChild('formSearch') sInput: MatInput;
  @ViewChild('drawer', { read: ElementRef }) sidenavEl: ElementRef;
  // qItem: any;
  focusNode: ITreeNode;
  item: fhir.QuestionnaireItem = null;
  options: ITreeOptions;
  @Input()
  model: any [] = [];
  @Output()
  modelChange = new EventEmitter<any[]>();
  isTreeExpanded = false;
  editType = 'ui';
  itemEditorSchema: any;
  editor = 'ngx';
  loincType = LoincItemType.PANEL;

  loincTypeOpts = [
    {
      value: LoincItemType.PANEL,
      display: 'Panel'
    },
    {
      value: LoincItemType.QUESTION,
      display: 'Question'
    }
  ]

  loincItem: any;

  linkIdCollection = new LinkIdCollection();

  acSearch = (term$: Observable<string>): Observable<any []> => {
    return term$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term) => term.length < 2 ? [] : this.dataSrv.searchLoincItems(term, this.loincType)));
  }

  constructor(
              public dialog: MatDialog,
              private modalService: NgbModal,
              private formService: FormService,
              private dataSrv: FetchService,
              private selectedNodeSrv: ShareObjectService) {
    this.options = this.dataSrv.getOptions();
    this.dataSrv.getItemEditorSchema().subscribe((data) => {
      this.itemEditorSchema = data;
    });
  }

  ngOnInit() {
  }

  itemChanged(item) {
    this.notifyChange();
  }

  notifyChange() {
    this.modelChange.emit(this.model);
  }
  /**
   * Initialize component
   */
  ngAfterViewInit() {
    this.item = this.focusNode ? this.focusNode.data : null;
    this.options.scrollContainer = this.sidenavEl.nativeElement;
    this.formService.setTreeModel(this.treeComponent.treeModel);
  }


  /**
   * Tree initialization
   * @param event - a
   */
  onTreeInitialized(event) {
    const node = this.treeComponent.treeModel.getFirstRoot();
    this.treeComponent.treeModel.setFocusedNode(node);
    this.setNode(node);
  }

  onFocus(event) {
    this.setNode(event.node);
  }

  /**
   * Focus node is
   * @param node - a
   */
  setNode(node: ITreeNode): void {
    this.focusNode = node;
    this.item = node.data;
  }

  /**
   * Handle tree expansion/collapse
   */

  toggleTreeExpansion() {
    if (this.treeComponent) {
      if (this.isTreeExpanded) {
        this.treeComponent.treeModel.collapseAll();
        this.isTreeExpanded = false;
      } else {
        this.treeComponent.treeModel.expandAll();
        this.isTreeExpanded = true;
      }
    }
  }

  extractDataFromTree(roots: any [], collection) {
    for (const root of roots) {
      collection.push(root.data);
      if (root.children && root.children.length > 0) {
        collection.item = [];
        this.extractDataFromTree(root.children, collection.item);
      }
    }
  }


  /**
   * Create linkId, using a random number generated by the tree.
   * @param node - a
   */
  defaultLinkId(node: ITreeNode): string {
    return '' + node.id;
  }


  /**
   * Toggle between ui and json
   * @param event - a
   */
  toggleEditType(event) {
    this.editType = this.editType === 'json' ? 'ui' : 'json';
  }


  /**
   * Compute tree hierarchy sequence numbering.
   * @param node - Target node of computation
   */
  getIndexPath(node: ITreeNode): number[] {
    const ret: number [] = [];
    if (node) {
      ret.push(node.index + 1);
      while (node.level > 1) {
        node = node.parent;
        ret.push(node.index + 1);
      }
    }
    return ret.reverse();
  }


  /**
   * Handle add item button
   * @param event - a
   */
  addItem(event): void {
    this.insertAnItem({text: 'New item ' + this.id++});
  }

  insertAnItem(item, index?: number) {
    if (typeof index === 'undefined') {
      index = this.focusNode.index + 1;
    }
    this.focusNode.parent.data.item.splice(index, 0, item);
    this.treeComponent.treeModel.update();
    this.treeComponent.treeModel.focusNextNode();
    this.setNode(this.treeComponent.treeModel.getFocusedNode());
  }

  /**
   * Handle delete item button
   * @param index - Index of the node among its siblings.
   */
  deleteItem(index?: number) {
    if (typeof index === 'undefined') {
      index = this.focusNode.index;
    }
    this.focusNode.parent.data.item.splice(index, 1);
    this.treeComponent.treeModel.update();
    this.treeComponent.treeModel.focusNextNode();
    this.setNode(this.treeComponent.treeModel.getFocusedNode());
  }

  /**
   * TODO - Add loinc item from CT server.
   * @param dialogTemplateRef - a
   */
  addLoincItem(dialogTemplateRef): void {
    this.modalService.open(dialogTemplateRef, {ariaLabelledBy: 'modal-basic-title'}).result.then((autoCompResult) => {
      this.getLoincItem(autoCompResult, this.loincType).subscribe((item) => {
        this.insertAnItem(item);
        this.loincItem = null;
      });
    }, (reason) => {
      this.loincItem = null;
    });
  }

  /**
   *
   * @param autoCompResult - Loinc number of the item.
   * @param loincType - Loinc item type
   */
  getLoincItem(autoCompResult, loincType: LoincItemType): Observable<any> {
    let ret: Observable<any>;
    if(loincType === LoincItemType.PANEL) {
      ret = this.dataSrv.getLoincPanel(autoCompResult.code[0].code);
    }
    else if(loincType === LoincItemType.QUESTION) {
      ret = of(autoCompResult);
    }

    return ret;
  }

  /**
   * TODO - not sure if we need this yet.
   * @param linkId - a
   */
  registerLinkId(linkId) {
    this.linkIdCollection.addLinkId(linkId, this.focusNode.path.join('/'));
  }

  /**
   * Fetch loinc item by id
   * loincNum - Loinc number of the item.
   *
   */
  getItem(loincNum: string) {
  }

  formatter(acResult: any) {
    return acResult.code[0].code + ': ' + acResult.text;
  }
}
