/**
 * Handle side bar tree, item level fields editing in ui and editing in json
 */
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  OnChanges,
  SimpleChanges, AfterViewChecked, NgZone
} from '@angular/core';
import {ITreeOptions, TreeComponent} from '@circlon/angular-tree-component';
import {FetchService, LoincItemType} from '../fetch.service';
import {MatInput} from '@angular/material/input';
import {ITreeNode} from '@circlon/angular-tree-component/lib/defs/api';
import {FormService} from '../services/form.service';
import {NgxSchemaFormComponent} from '../ngx-schema-form/ngx-schema-form.component';
import {ItemJsonEditorComponent} from '../lib/widgets/item-json-editor/item-json-editor.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {BehaviorSubject, interval, Observable, of, Subject, Subscription} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';
import {fhir} from '../fhir';
import {TreeService} from '../services/tree.service';
import {Util} from '../lib/util';

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
export class ItemComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  id = 1;
  @ViewChild('tree') treeComponent: TreeComponent;
  @ViewChild('jsonEditor') jsonItemEditor: ItemJsonEditorComponent;
  @ViewChild('uiEditor') uiItemEditor: NgxSchemaFormComponent;
  @ViewChild('formSearch') sInput: MatInput;
  @ViewChild('drawer', { read: ElementRef }) sidenavEl: ElementRef;
  // qItem: any;
  focusNode: ITreeNode;
  itemData: fhir.QuestionnaireItem = null;
  treeOptions: ITreeOptions;
  @Input()
  questionnaire: fhir.Questionnaire = {status: 'draft', item: []};
  itemList: any [];
  @Output()
  itemChange = new EventEmitter<any []>();
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
  ];

  loincItem: any;

  linkIdCollection = new LinkIdCollection();
  itemLoading$ = new BehaviorSubject<boolean>(false);
  itemLoading = false;

  treeReloaded$ = new BehaviorSubject<fhir.Questionnaire>(null);

  subscriptions: Subscription [] = [];

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
              private zone: NgZone,
              public dialog: MatDialog,
              private modalService: NgbModal,
              private treeService: TreeService,
              private formService: FormService,
              private dataSrv: FetchService) {
    this.treeOptions = this.dataSrv.getTreeOptions();
    const subscription = this.dataSrv.getItemEditorSchema().subscribe((data) => {
      this.itemEditorSchema = data;
    });
    this.subscriptions.push(subscription);
  }

  ngOnInit() {
    /*
    this.zone.runOutsideAngular(() => {
      // Check very regularly to see if the pending macrotasks have all cleared
      interval(10)
        .pipe(
          startWith(0), // So that we don't initially wait
          takeUntil(this.itemLoading$),
          // Turn the interval number into the current state of the zone
          map(() => !this.zone.hasPendingMacrotasks),
          // Don't emit until the zone state actually flips from `false` to `true`
          distinctUntilChanged(),
          // Filter out unstable event. Only emit once the state is stable again
          filter(stateStable => stateStable === true),
          // Complete the observable after it emits the first result
          take(1),
          tap(stateStable => {
            // FULLY RENDERED!!!!
            this.itemLoading$.next(false);
            // Add code here to report Fully Rendered
          })
        ).subscribe();
    });
*/

    const sub = this.itemLoading$.subscribe((isLoading) => {
      this.itemLoading = isLoading;
    });
    this.subscriptions.push(sub);
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
    Util.mirrorObject(this.focusNode.data, Util.pruneEmptyValues(item));
    this.itemChange.emit(this.itemList);
  }

  /**
   * Tree initialization
   */
  onTreeInitialized() {
    const node = this.treeComponent?.treeModel?.getFirstRoot();
    if(node) {
      this.treeComponent.treeModel.setFocusedNode(node);
      this.setNode(node);
    }
  }


  /**
   * Handles tree update event
   * @param event - Event
   */
  onTreeUpdated() {
    if(!this.treeComponent.treeModel.getFocusedNode()) {
      const node = this.treeComponent.treeModel.getFirstRoot();
      this.treeComponent.treeModel.setFocusedNode(node);
      this.setNode(node);
    }
  }


  /**
   * Handle tree's on focus event
   * @param event - Focus event.
   */
  onFocus(event) {
    // this.itemLoading$.next(true);
    this.setNode(event.node);
  }

  /**
   * Set selected node, typically invoked when user clicks a node on the tree.
   * @param node - Selected node.
   */
  setNode(node: ITreeNode): void {
    // this.item = node && node.data || null;
    this.focusNode = node;
    this.itemData = this.focusNode.data;
    // Not sure why new item is having some fields from prev item. Nonetheless reset the form.
    // Resetting has side effects. Revisit -- TODO
    // this.uiItemEditor.resetForm(this.item);
    if(this.focusNode && this.focusNode.data && !this.focusNode.data.linkId) {
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
    const ret: number [] = [];
    if (node) {
      ret.push(node.index + 1);
      while (node?.level > 1) {
        node = node.parent;
        const index = node ? node.index : 0;
        ret.push(index + 1);
      }
    }
    return ret.reverse();
  }


  /**
   * Handle add item button
   */
  addItem(event): void {
    this.insertAnItem({text: 'New item ' + this.id++});
  }

  insertAnItem(item, index?: number) {
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
    setTimeout(() => {
      document.getElementById('text').focus();
    });
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
    // this.setNode(this.treeComponent.treeModel.getFocusedNode());
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
        subscription.unsubscribe();
      });
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
   * Unsubscribe any subscriptions.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
