import {OnInit, AfterViewInit, Component, ViewChild, ElementRef} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { TreeComponent, TreeModel, TreeNode, ITreeOptions } from 'angular-tree-component';
import {FetchService} from '../fetch.service';
import {MatInput} from '@angular/material';
import {JsonEditorComponent} from '../json-editor/json-editor.component';
import {ShareObjectService} from '../share-object.service';
import {ITreeNode} from 'angular-tree-component/dist/defs/api';

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
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css']
})
export class MainContentComponent implements OnInit, AfterViewInit {
  @ViewChild('tree', {static: false}) treeComponent: TreeComponent;
  @ViewChild('editor', {static: false}) jsonEditorComponent: JsonEditorComponent;
  @ViewChild('formSearch', {static: false}) sInput: MatInput;
  @ViewChild('drawer', {static: false, read: ElementRef}) sidenavEl: ElementRef;
  // qItem: any;
  focusNode: any = {path: []};
  options: ITreeOptions;
  form: any = {item: []};
  exportForm: any;
  isTreeExpanded = false;
  showType = 'item';
  itemEditorSchema: any;
  editor = 'ngx';
  ajsfFramwork  = 'material-design';

  acOptions = {
    searchUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire',
    httpOptions: {
      observe: 'body' as const,
      responseType: 'json' as const
    }
  };

  linkIdCollection = new LinkIdCollection();

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver, private dataSrv: FetchService, private selectedNodeSrv: ShareObjectService) {
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
    this.selectedNodeSrv.object.subscribe((itemData) => {
      this.focusNode.data = itemData;
    });
    this.options.scrollContainer = this.sidenavEl.nativeElement;
  }

  onFocus(event) {
    this.focusNode = event.node;
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
    console.log('event.index: ' + event.index + ' :: event.tab: ' + event.tab);
    if (event.index > 0) {
      this.updatedForm();
    }
  }

  registerLinkId(linkId) {
    this.linkIdCollection.addLinkId(linkId, this.focusNode.path.join('/'));
  }
}
