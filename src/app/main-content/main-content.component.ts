import {OnInit, AfterViewInit, Component, ViewChild} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { TreeComponent, TreeModel, TreeNode, ITreeOptions } from 'angular-tree-component';
import {DataService} from '../data.service';
import {MatInput} from '@angular/material';
import {JsonEditorComponent} from '../json-editor/json-editor.component';


@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.css']
})
export class MainContentComponent implements OnInit, AfterViewInit {
  @ViewChild('tree', {static: false}) treeComponent: TreeComponent;
  @ViewChild('editor', {static: false}) jsonEditorComponent: JsonEditorComponent;
  @ViewChild('formSearch', {static: false}) sInput: MatInput;
  qItem: any;
  options: ITreeOptions;
  treeData: TreeNode[];

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver, private dataSrv: DataService) {}

  ngOnInit() {
    this.options = this.dataSrv.getOptions();
  }

  getForm(term: string) {
    if (!term) {
      this.treeData = null;
    } else {
      this.dataSrv.getFormData(term).subscribe((data) => {
        this.treeData = data.item;
      });
    }
  }

  ngAfterViewInit() {
   // this.onFocus();
  }

  onFocus(event) {
    this.jsonEditorComponent.getEditor().setValue(event.node.data);
  }

}
