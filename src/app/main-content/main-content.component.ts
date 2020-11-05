import {OnInit, AfterViewInit, Component, ViewChild, ElementRef, AfterContentInit} from '@angular/core';
// import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { TreeComponent, TreeModel, TreeNode, ITreeOptions } from 'angular-tree-component';
import {FetchService} from '../fetch.service';
import {MatInput} from '@angular/material/input';
import {JsonEditorComponent} from '../json-editor/json-editor.component';
import {ShareObjectService} from '../share-object.service';
import {ITreeNode} from 'angular-tree-component/dist/defs/api';
import { Panel, Toolbar, Header, Footer } from 'primeng';
import {FormService} from '../services/form.service';

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
  selector: 'app-item-component',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css']
})
export class MainContentComponent implements OnInit, AfterViewInit {
  @ViewChild('tree') treeComponent: TreeComponent;
  @ViewChild('editor') jsonEditorComponent: JsonEditorComponent;
  @ViewChild('formSearch') sInput: MatInput;
  @ViewChild('drawer', { read: ElementRef }) sidenavEl: ElementRef;
  // qItem: any;
  focusNode: ITreeNode;
  options: ITreeOptions;
  form: any = {item: [{text: 'Item 1'}]};
  exportForm: any;
  isTreeExpanded = false;
  showType = 'item';
  itemEditorSchema: any;
  editor = 'ngx';

  acOptions = {
    searchUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire',
    httpOptions: {
      observe: 'body' as const,
      responseType: 'json' as const
    }
  };

  linkIdCollection = new LinkIdCollection();

  constructor(
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

  getForm(term: string) {
    if (!term) {
      this.form = {};
    } else {
      this.dataSrv.getFormData(term).subscribe((data) => {
        this.form = data;
      });
    }
  }

  ngAfterViewInit() {
   // this.onFocus();
    this.selectedNodeSrv.object$.subscribe((itemData) => {
      if (this.focusNode && this.focusNode.data !== itemData) {
        this.focusNode.data = itemData;
      }
    });
    this.options.scrollContainer = this.sidenavEl.nativeElement;
    this.formService.setTreeModel(this.treeComponent.treeModel);
  }

  onTreeInitialized(event) {
    const node = this.treeComponent.treeModel.getFirstRoot();
    this.treeComponent.treeModel.setFocusedNode(node);
    this.setNode(node);
  }

  onFocus(event) {
    this.setNode(event.node);
  }

  setNode(node: ITreeNode): void {
    this.focusNode = node;
    this.selectedNodeSrv.setNode(this.focusNode);
    if (this.focusNode.data && !this.focusNode.data.linkId) {
      this.focusNode.data.linkId = this.defaultLinkId(this.focusNode);
    }
    this.selectedNodeSrv.setObject(this.focusNode.data);
  }

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

  defaultLinkId(node: ITreeNode): string {
    return '' + node.id;
  }

  updatedForm() {
    const items: any = [];
    if (this.treeComponent) {
      const roots = this.treeComponent.treeModel.roots;
      if (roots && roots.length > 0) {
        this.extractDataFromTree(roots, items);
      }
    }
    this.exportForm = this.form;
    this.exportForm.item = items;
    return this.exportForm;
  }

  showJson(event) {
    if (event.index > 0) {
      this.updatedForm();
    }
  }

  registerLinkId(linkId) {
    this.linkIdCollection.addLinkId(linkId, this.focusNode.path.join('/'));
  }
}
