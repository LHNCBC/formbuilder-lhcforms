import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import {Binding, FormProperty, Validator} from 'ngx-schema-form';
import {LinkIdCollection} from '../item/item.component';
import {Form} from '@angular/forms';
import {map, switchMap, timeout} from 'rxjs/operators';
import {ITreeNode} from '@circlon/angular-tree-component/lib/defs/api';
import {TreeModel} from '@circlon/angular-tree-component';

@Component({
  selector: 'app-ngx-schema-form',
  templateUrl: './ngx-schema-form.component.html',
  styleUrls: ['./ngx-schema-form.component.css']
})
export class NgxSchemaFormComponent implements OnInit {
  mySchema: any = {properties: {}};
  myTestSchema: any;
  @Output()
  setLinkId = new EventEmitter();
  @Input()
  node: ITreeNode;
  @Input()
  treeModel: TreeModel;
  model: any;
  @Input()
  linkIdCollection = new LinkIdCollection();

  myValidators: { [path: string]: Validator } = {
    '/linkId': (value, property, form) => {
      if (value.trim().length === 0 || this.linkIdCollection.hasLinkId(value)) {
        return [{
          linkId: {expectedValue: 'Unique linkId in the form'}
        }];
      }
      return null;
    }
  };

  myFieldBindings: { [path: string]: Binding } = {
    /*
    '/linkId': {
        change: (event, formProperty: FormProperty) => {
          if (!formProperty.value && this.node) {
            formProperty.setValue(this.node.id, true);
          }
          if (formProperty.valid) {
            this.setLinkId.emit(formProperty.value);
          }
        }
      }
      */
  };

  constructor(private http: HttpClient, private modelService: ShareObjectService) {
  }

  ngOnInit() {
    this.http.get('/assets/ngx-item.schema.json', { responseType: 'json' }).pipe(
      switchMap((schema: any) => this.http.get('/assets/items-layout.json', { responseType: 'json' }).pipe(
        map((layout: any) => {
          schema.layout = layout;
          return schema;
        })
      ))
    ).subscribe((schema) => {
      this.mySchema = schema;
      // console.log(JSON.stringify(this.mySchema.layout, null, 2));
    });
    /*
    this.http
      .get('/assets/ngx-item.schema.json', { responseType: 'json' })
      .subscribe(schema => {
        this.mySchema = schema;
      });
    this.http
      .get('/assets/test.schema.json', { responseType: 'json' })
      .subscribe(schema => {
        this.myTestSchema = schema;
      });
*/
    this.modelService.object$.subscribe((model) => {
      if (this.model !== model) {
        this.model = model;
      }
    });

    this.modelService.node$.subscribe((node) => {
      if (this.node !== node) {
        this.node = node;
        this.model = node ? node.data : null;
        if (this.model && !this.model.linkId) {
          this.model.linkId = '' + node.id;
        }
      }
    });
  }

  updateModel(model) {
    this.modelService.setObject(model);
  }

}
