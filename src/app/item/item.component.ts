/**
 * Handle side bar tree, item level fields editing in ui and editing in json
 */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {ITreeOptions, KEYS, TREE_ACTIONS, TreeComponent} from '@bugsplat/angular-tree-component';
import {FetchService, LoincItemType} from '../services/fetch.service';
import {MatInput} from '@angular/material/input';
import {ITreeNode} from '@bugsplat/angular-tree-component/lib/defs/api';
import {FormService} from '../services/form.service';
import {NgxSchemaFormComponent} from '../ngx-schema-form/ngx-schema-form.component';
import {ItemJsonEditorComponent} from '../lib/widgets/item-json-editor/item-json-editor.component';
import {NgbActiveModal, NgbDropdown, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {debounceTime, distinctUntilChanged, switchMap,} from 'rxjs/operators';
import fhir from 'fhir/r4';
import {TreeService} from '../services/tree.service';
import {faEllipsisH, faExclamationTriangle, faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {environment} from '../../environments/environment';
import {NodeDialogComponent} from './node-dialog.component';
import {Util} from '../lib/util';
import {MessageType} from '../lib/widgets/message-dlg/message-dlg.component';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import copy from "fast-copy";
import traverse from "traverse";

declare var LForms: any;

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
  selector: 'lfb-confirm-dlg',
  template: `
    <div class="modal-header bg-primary">
      <h4 class="modal-title text-white">{{title}}</h4>
      <button type="button" class="btn-close btn-close-white" aria-label="Close"
              (click)="activeModal.dismiss(false)"
              (keydown.enter)="activeModal.dismiss(false)"
      ></button>
    </div>
    <div class="modal-body">
      <p>{{message}}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary"
              (keydown.enter)="activeModal.dismiss(false)"
              (click)="activeModal.dismiss(false)"
      >No</button>
      <button type="button" class="btn btn-primary"
              (keydown.enter)="activeModal.close(true)"
              (click)="activeModal.close(true)"
      >Yes</button>
    </div>
  `
})
export class ConfirmDlgComponent {
  @Input()
  title: string;
  @Input()
  message: string;

  constructor(public activeModal: NgbActiveModal) {
  }
}

@Component({
  selector: 'lfb-item-component',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemComponent implements AfterViewInit, OnChanges, OnDestroy {
  errorIcon = faExclamationTriangle;
  helpIcon = faInfoCircle;
  id = 1;
  nodeMenuIcon = faEllipsisH;

  @ViewChild('tree') treeComponent: TreeComponent;
  @ViewChild('jsonEditor') jsonItemEditor: ItemJsonEditorComponent;
  @ViewChild('uiEditor') uiItemEditor: NgxSchemaFormComponent;
  @ViewChild('formSearch') sInput: MatInput;
  @ViewChild('drawer', { read: ElementRef }) sidenavEl: ElementRef;
  // qItem: any;
  focusNode: ITreeNode;
  itemData: fhir.QuestionnaireItem = null;
  treeOptions: ITreeOptions = {
    displayField: 'text',
    childrenField: 'item',
    idField: 'linkId',
    actionMapping: {
      mouse: {
        dblClick: (tree, node, $event) => {
          if (node.hasChildren) { TREE_ACTIONS.TOGGLE_EXPANDED(tree, node, $event); }
        },
        click: TREE_ACTIONS.ACTIVATE
      },
      keys: {
        [KEYS.SPACE]: TREE_ACTIONS.TOGGLE_EXPANDED,
        [KEYS.ENTER]: (tree, node, $event) => {
          TREE_ACTIONS.ACTIVATE(tree, node, $event);
          this.focusActiveNode();
        }
      }
    },
    nodeHeight: 23,
    dropSlotHeight: 23,
    allowDrag: (node) => {
      return true;
    },
    allowDrop: (node) => {
      return true;
    },
    // allowDragoverStyling: true,
    levelPadding: 10,
    useVirtualScroll: false,
    animateExpand: true,
    scrollOnActivate: true,
    animateSpeed: 30,
    animateAcceleration: 1.2,
    scrollContainer: document.documentElement // HTML
  };
  errorMessage = 'Error(s) exist in this item. The resultant form may not render properly.';
  @Input()
  questionnaire: fhir.Questionnaire = {resourceType: 'Questionnaire', status: 'draft', item: []};
  itemList: any [];
  @Output()
  itemChange = new EventEmitter<any []>();
  isTreeExpanded = false;
  editType = 'ui';
  itemEditorSchema: any;
  editor = 'ngx';
  loincType = LoincItemType.PANEL;
  errors$ = new EventEmitter<any []>(true); // Use async emitter.
  treeHelpMessage = 'You can drag and drop items in the tree to move them around in the hierarchy';

  loincTypeOpts = [
    {
      value: LoincItemType.PANEL,
      display: 'Panel'
    },
    {
      value: LoincItemType.QUESTION,
      display: 'Question'
    }
  ];

  loincItem: any;

  linkIdCollection = new LinkIdCollection();
  itemLoading$ = new BehaviorSubject<boolean>(false);
  spinner$ = new BehaviorSubject<boolean>(false);

  subscriptions: Subscription [] = [];
  loadingTime = 0.0;
  startTime = Date.now();
  devMode = !environment.production;
  contextMenuActive = false;
  treeFirstFocus = false;
  /**
   * A function variable to pass into ng bootstrap typeahead for call back.
   * Wait at least for two characters, 200 millis of inactivity and not the
   * same string as previously searched.
   *
   * @param term$ - User typed string
   */
  acSearch = (term$: Observable<string>): Observable<any []> => {
    return term$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term) => term.length < 2 ? [] : this.dataSrv.searchLoincItems(term, this.loincType)));
  };

  constructor(
              public liveAnnouncer: LiveAnnouncer,
              public dialog: MatDialog,
              private modalService: NgbModal,
              private treeService: TreeService,
              private formService: FormService,
              private dataSrv: FetchService,
              private cdr: ChangeDetectorRef) {
    this.itemEditorSchema = formService.itemEditorSchema;
  }


  /**
   * Initialize component
   */
  ngAfterViewInit() {
    this.treeOptions.scrollContainer = this.sidenavEl.nativeElement;
    this.formService.setTreeModel(this.treeComponent.treeModel);
    setTimeout(() => {
      this.treeComponent.treeModel.update();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.itemList = changes.questionnaire.currentValue?.item;
    this.itemList = this.itemList || [];
    if(this.itemList.length === 0) {
      this.itemList.push({text: 'Item 0', type: 'string'});
    }
    if(this.treeComponent?.treeModel) {
      this.treeComponent?.treeModel.update();
    }
  }

  /**
   * Inform the change to host element.
   */
  itemChanged(item) {
    if(this.itemData) {
      for (const key of Object.keys(this.itemData)) {
        if(key !== 'item') {
          delete this.itemData[key];
        }
      }
      Object.assign(this.itemData, item);
    }

    if (typeof this.itemData?.linkId === 'number') {
      this.itemData.linkId = ''+this.itemData.linkId;
    }
    this.loadingTime = (Date.now() - this.startTime)/1000;
    // console.log('item changed', this.itemData?.linkId);
    if(!this.formService.loading) {
      this.itemChange.emit(this.itemList);
    }
  }


  /**
   * Handles tree update event
   */
  onTreeUpdated() {
    this.focusNode = this.treeComponent.treeModel.getFocusedNode();
    if(!this.focusNode) {
      const node = this.treeComponent.treeModel.getFirstRoot();
      if(node) {
        this.treeComponent.treeModel.setFocusedNode(node);
        this.treeComponent.treeModel.setActiveNode(node, true);
        this.setNode(node);
      }
    }
    else {
      this.treeComponent.treeModel.setActiveNode(this.focusNode, true);
    }
  }

  /**
   * Handle tree events
   * @param event - The event.
   */
  onTreeEvent(event) {
    switch(event.eventName) {
      case 'toggleExpanded':
        if(event.isExpanded) {
          this.liveAnnouncer.announce(`"${Util.formatNodeForDisplay(event.node)}" is expanded.`);
        }
        else {
          this.liveAnnouncer.announce(`"${Util.formatNodeForDisplay(event.node)}" is collapsed.`);
        }
        break;

      case 'activate':
        this.startSpinner();
        setTimeout(() => {
          this.setNode(event.node);
          this.stopSpinner();
          this.liveAnnouncer.announce(`"${Util.formatNodeForDisplay(event.node)}" is selected`);
        });
        break;

      case 'updateData':
        this.startSpinner();
        setTimeout(() => {
          this.onTreeUpdated();
          this.stopSpinner();
        });
        break;

      case 'focus':
        this.treeComponent.treeModel.setFocus(true);
        this.treeNodeFocusAnnounce(event.node);
        break;

      default:
        break;
    }
  }


  /**
   * Trigger spinner. It is a modal dialog disabling user actions.
   * Match this with stopSpinner.
   */
  startSpinner() {
    this.spinner$.next(true);
  }


  /**
   * Stop spinner.
   */
  stopSpinner() {
    this.spinner$.next(false);
  }

  /**
   * Set selected node, typically invoked when user clicks a node on the tree.
   * @param node - Selected node.
   */
  setNode(node: ITreeNode): void {
    this.startTime = Date.now();
    this.focusNode = node;
    this.itemData = this.focusNode ? this.focusNode.data : null;
    if(this.focusNode && this.focusNode.data
      && (!this.focusNode.data.linkId || typeof this.focusNode.data.linkId  === 'number')) {
      this.focusNode.data.linkId = this.defaultLinkId(this.focusNode);
    }
    this.treeService.nodeFocus.next(node);
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


  /**
   * Create linkId, using a random number generated by the tree.
   */
  defaultLinkId(node: ITreeNode): string {
    return '' + node.id;
  }


  /**
   * Toggle between ui and json
   */
  toggleEditType(event) {
    this.editType = this.editType === 'json' ? 'ui' : 'json';
  }


  /**
   * Compute tree hierarchy sequence numbering.
   * @param node - Target node of computation
   */
  getIndexPath(node: ITreeNode): number[] {
    return Util.getIndexPath(node);
  }


  /**
   * Handle add item button
   */
  addItem(event): void {
    this.insertAnItem({text: 'New item ' + this.id++});
  }

  insertAnItem(item, index?: number) {
    this.startSpinner();
    setTimeout(() => {
      if(this.itemList.length === 0) {
        this.itemList.push(item);
      }
      else {
        if (typeof index === 'undefined') {
          index = this.focusNode ? this.focusNode.index + 1 : 0;
        }
        this.focusNode.parent.data.item.splice(index, 0, item);
      }

      this.treeComponent.treeModel.update();
      this.treeComponent.treeModel.focusNextNode();
      this.setNode(this.treeComponent.treeModel.getFocusedNode());
      document.getElementById('text').focus();
      this.stopSpinner();
    });
  }

  /**
   * Update the data structure based on context node and position.
   * @param dropdown - NgbDropdown object.
   * @param domEvent - DOM event object.
   * @param contextNode - Context node
   * @param position - Insertion point.
   */
  onInsertItem(dropdown: NgbDropdown, domEvent: Event, contextNode: ITreeNode, position: ('BEFORE'|'AFTER'|'CHILD') = 'AFTER') {
    const newItem = {text: 'New item ' + this.id++};
    const nodeData = contextNode.data;
    switch(position) {
      case 'CHILD':
        if (!nodeData.item) {
          nodeData.item = [];
        }
        nodeData.item.push(newItem);
        break;

      case 'BEFORE':
        contextNode.parent.data.item.splice(contextNode.index, 0, newItem);
        break;

      case 'AFTER':
        contextNode.parent.data.item.splice(contextNode.index + 1, 0, newItem);
        break;
    }
    this.treeComponent.treeModel.update();
    this.setFocusedNode(position);
    domEvent.stopPropagation();
    dropdown.close();
  }

  /**
   * Set focus on the next node based on position.
   * @param position - Position around the target node.
   */
  setFocusedNode(position: string) {
    setTimeout(() => {
      const contextNode = this.treeComponent.treeModel.getFocusedNode();
      switch (position) {
        case 'CHILD':
          contextNode.getLastChild(false).setActiveAndVisible(false);
          break;
        case 'BEFORE':
          contextNode.findPreviousSibling(false).setActiveAndVisible(false);
          break;
        case 'AFTER':
          contextNode.findNextSibling(false).setActiveAndVisible(false);
          break;
      }
      setTimeout(() => {
        this.focusActiveNode();
      });
    });
  }

  /**
   * Move the item in the data structure.
   * @param contextNode - The node to move
   * @param targetNode - Destination node
   * @param position - ('AFTER'|'BEFORE'|'CHILD')
   */
  moveItem(contextNode: ITreeNode, targetNode: ITreeNode, position: ('AFTER'|'BEFORE'|'CHILD') = 'AFTER') {
    this.treeComponent.treeModel.moveNode(contextNode, {
        dropOnNode: position === 'CHILD',
        parent: position === 'CHILD' ? targetNode : targetNode.parent,
        index: targetNode.index + (position === 'AFTER' ? 1 : 0)
      });
    this.treeComponent.treeModel.setFocusedNode(contextNode);
    this.treeComponent.treeModel.getFocusedNode().setActiveAndVisible(false);
  }

  /**
   * Menu item handler for move tasks.
   * @param domEvent - DOM event.
   * @param contextNode - Context node.
   */
  onMoveDlg(domEvent: Event, contextNode: ITreeNode) {
    const modalRef = this.openNodeDlg(contextNode, 'Move');
    modalRef.result.then((result) => {
      this.moveItem(contextNode, result.target, result.location);
    }, (reason) => {
    })
      .finally(() => {
        setTimeout(() => {
          this.focusActiveNode();
        });
    });
    domEvent.stopPropagation();
  }

  /**
   * Menu item handler for copy tasks.
   * @param domEvent - DOM event.
   * @param contextNode - Context node.
   */
  onCopyDlg(domEvent: Event, contextNode: ITreeNode) {
    const modalRef = this.openNodeDlg(contextNode, 'Copy');
    modalRef.result.then((result) => {
      this.copyItem(contextNode, result.target, result.location);
    }, (reason) => {
    })
      .finally(() => {
        setTimeout(() => {
          this.focusActiveNode();
        });
      });
    domEvent.stopPropagation();
  }
  /**
   * Dialog box to interact with target node searching.
   * @param contextNode - Context node
   * @param mode - Move or insert.
   */
  openNodeDlg(contextNode: ITreeNode, mode: ('Move'|'Insert'|'Copy')): NgbModalRef {
    const modalRef = this.modalService.open(NodeDialogComponent, {ariaLabelledBy: 'modal-move-title'});
    modalRef.componentInstance.node = contextNode;
    modalRef.componentInstance.item = this;
    modalRef.componentInstance.mode = mode;
    return modalRef;
  }

  /**
   * Delete sidebar item with confirmation dialog.
   */

  confirmItemDelete(): Promise<any> {
    const modalRef = this.modalService.open(ConfirmDlgComponent);
    modalRef.componentInstance.title = 'Confirm deletion';
    modalRef.componentInstance.message = 'Are you sure you want to delete this item?';
    modalRef.componentInstance.type = MessageType.WARNING;
    return modalRef.result.then(() => {
      this.deleteFocusedItem();
    })
      .finally(() => {
        setTimeout(() => {
          this.focusActiveNode();
        });
    });
  }


  /**
   * Handle delete item button
   */
  deleteFocusedItem() {
    const index = this.focusNode.index; // Save the index of the node to delete.
    // Figure out what should be the next node to focus.
    // Next sibling if exists
    let nextFocusedNode = this.focusNode.findNextSibling(true);
    // previous sibling if exists
    nextFocusedNode = nextFocusedNode ? nextFocusedNode : this.focusNode.findPreviousSibling(true);
    // Parent could be a virtual one for root nodes.
    nextFocusedNode = nextFocusedNode ? nextFocusedNode : this.focusNode.parent;
    this.startSpinner();
    setTimeout(() => {
      // Change the focus first
      if(!nextFocusedNode.data.virtual) {
        this.treeComponent.treeModel.setFocusedNode(nextFocusedNode);
      }
      // Remove the node and update the tree.
      this.focusNode.parent.data.item.splice(index, 1);
      this.treeComponent.treeModel.update();
      // Set the model for item editor.
      nextFocusedNode = this.treeComponent.treeModel.getFocusedNode();
      this.setNode(nextFocusedNode);
      if(nextFocusedNode) {
        this.treeComponent.treeModel.getFocusedNode().setActiveAndVisible(false);
      }
      this.stopSpinner();
    });
  }

  /**
   * Invoke the dialog which returns selected lforms item from the search box.
   * @param dialogTemplateRef - Dialog template for adding loinc item.
   */
  addLoincItem(dialogTemplateRef): void {
    this.modalService.open(dialogTemplateRef, {ariaLabelledBy: 'modal-basic-title'}).result.then((autoCompResult) => {
      const subscription = this.getLoincItem(autoCompResult, this.loincType).subscribe((item) => {
        this.insertAnItem(item);
        this.loincItem = null;
      });
      this.subscriptions.push(subscription);
    }, (reason) => {
      this.loincItem = null;
    });
  }

  /**
   * Get loinc item using selected auto completion result.
   * If the selected item is a panel, use its loinc number to get the panel from the server, otherwise
   * return the selected item.
   *
   * @param autoCompResult - Auto completion item selected from the search box.
   *
   * @param loincType - Loinc item type: panel or question.
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
   * @param linkId - Link id
   */
  /*
  registerLinkId(linkId) {
    this.linkIdCollection.addLinkId(linkId, this.focusNode.path.join('/'));
  }
*/
  /**
   * Fetch loinc item by id
   * loincNum - Loinc number of the item.
   *
   */
  getItem(loincNum: string) {
  }

  /**
   * Auto complete result formatting used in add loinc item dialog
   * @param acResult - Selected result item.
   */
  formatter(acResult: any) {
    return acResult.code[0].code + ': ' + acResult.text;
  }

  /**
   * Truncate a long string to display in the sidebar node tree.
   * @param text - Text of the string
   * @param limit - Limit the length to truncate.
   */
  truncate(text, limit: number = 15): string {
    return Util.truncateString(text, limit);
  }

  /**
   * Handle errorsChanged event from <lfb-ngx-schema-form>
   * @param errors - Event object from <lfb-ngx-schema-form>
   */
  onErrorsChanged(errors: any []) {
    this.errors$.next(errors);
  }


  /**
   * Stop the event propagation
   * @param domEvent - Event object
   */
  preventEventPropagation(domEvent: Event) {
    domEvent.stopPropagation();
    return false;
  }

  /**
   * Keep track of context menu open status.
   * @param open - True is opened, false is closed
   */
  handleContextMenuOpen(open: boolean) {
    this.contextMenuActive = open;
    if(open) {
      this.liveAnnouncer.announce(`Use up or down arrow keys to navigate the menu items`);
    }
  }

  /**
   * Put the focus on the active node. Intended for use after clicking context menu items.
   */
  focusActiveNode() {
    setTimeout(() => {
      const activeNode = document.querySelector('.node-content-wrapper-active') as HTMLElement;
      if(activeNode) {
        this.treeComponent.treeModel.setFocus(true);
        activeNode.focus();
      }
    });
  }


  /**
   * Handle focus event on tree wrapper element
   * @param domEvent - DOM event object.
   */
  treeInitialFocus(domEvent: Event) {
    if(!this.treeFirstFocus) {
      this.treeFirstFocus = true;
      this.liveAnnouncer.announce(
        `You can use up and down arrow keys to move the focus on the tree nodes. ` +
        `You may use enter key to select the focused node for editing. ` +
        `The Right or left arrow keys to will expand or collapse a selected node if it has children. ` +
        `Space bar will toggle expansion and collapse of tree node. `
      );
    }
  }

  /**
   * Read out for screen reader when the tree node is focused.
   * @param node - Focused node.
   */
  treeNodeFocusAnnounce(node: ITreeNode) {
    const promises = [];
    if (node?.data && node.id !== this.treeComponent.treeModel.getActiveNode()?.id) {
      // console.log(`${Util.formatNodeForDisplay(node)} is focused`);
      const messageList = [];
      messageList.push(`${Util.formatNodeForDisplay(node)}`);
      if (node.hasChildren) {
        if(node.isExpanded) {
          messageList.push(`has children and is expanded.`);
        }
        else {
          messageList.push(`has children and is collapsed.`);
        }
      }
      this.liveAnnouncer.announce(messageList.join(' '));
    }
  }


  /**
   * Debug dom event.
   * @param domEvent - DOM event object.
   */
  logEvent(domEvent: Event) {
    console.log(domEvent.type,
      domEvent.target instanceof HTMLElement ? '"'+domEvent.target.nodeName+':'+domEvent.target.className+'"' : null,
      domEvent.currentTarget instanceof HTMLElement ? '"'+domEvent.currentTarget.nodeName+':'+domEvent.currentTarget.className+'"' : null,
      domEvent instanceof FocusEvent ?
        domEvent.relatedTarget instanceof HTMLElement ? '"'+domEvent.relatedTarget.nodeName+':'+domEvent.relatedTarget.className+'"' : null
        : null);
  }


  /**
   * Unsubscribe any subscriptions.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  private addNewItem(position: 'AFTER' | 'BEFORE' | 'CHILD', newItem, targetNode: ITreeNode) {

    switch (position) {
      case 'CHILD':
        if (!targetNode.data.item) {
          targetNode.data.item = [];
        }
        targetNode.data.item.push(newItem);
        break;

      case 'BEFORE':
        targetNode.parent.data.item.splice(targetNode.index, 0, newItem);
        break;

      case 'AFTER':
        targetNode.parent.data.item.splice(targetNode.index + 1, 0, newItem);
        break;
    }
  }
  /**
   * Copy the item in the data structure.
   * @param contextNode - The node to copy
   * @param targetNode - Destination node
   * @param position - ('AFTER'|'BEFORE'|'CHILD')
   */
  private copyItem(contextNode: ITreeNode, targetNode: ITreeNode, position: ('AFTER' | 'BEFORE' | 'CHILD') = 'AFTER') {
    const nodeData = contextNode.data;
    const newItem = copy(nodeData);
    newItem.text = 'Copy of ' + newItem.text;
    traverse(newItem).forEach(node => {
      if (node && node.linkId) {
        node.linkId = Math.floor(100000000000 + Math.random() * 900000000000);
      }
    });
    this.addNewItem(position, newItem, targetNode);
    this.treeComponent.treeModel.update();
    const result = this.formService.getTreeNodeByLinkId(newItem.linkId);
    if (result) {
      this.treeComponent.treeModel.setFocusedNode(result);
    }
  }
}
