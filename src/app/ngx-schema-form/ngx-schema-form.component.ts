/**
 * Handle layout and editing of item level fields
 */
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import {Binding, FormProperty, Validator} from 'ngx-schema-form';
import {LinkIdCollection} from '../item/item.component';
import {map, switchMap, timeout} from 'rxjs/operators';

@Component({
  selector: 'lfb-ngx-schema-form',
  template: `
    <div class="container">
      <!--  <div class="title">{{model ? model.text : 'Questionnaire Item'}}</div> -->
      <sf-form [schema]="mySchema"
               [(model)]="model" (onChange)="updateModel($event.value)"
               [bindings]="myFieldBindings"
      ></sf-form>
    </div>
  `,
  styles: [`

    pre {
      padding: 02em;
      border: solid 1px black;
      background: #eee;
    }

    /* label */
    :host /deep/ .formHelp {
      display: block;
      font-size: 0.7em;
    }

    :host /deep/ sf-form-element > div {
      margin-top: 1em;
      margin-bottom: 1em;
    }

    :host ::ng-deep .form-control {
      height: calc(1.0em + .75rem + 2px);
      padding: 0 3px 0 3px;
    }

    :host /deep/ fieldset {
      border: 0;
    }

    .title {
      margin-top: 10px;
      font-size: 20px;
      font-weight: bold;
    }

  `]
})
export class NgxSchemaFormComponent implements OnInit {
  mySchema: any = {properties: {}};
  myTestSchema: any;
  @Output()
  setLinkId = new EventEmitter();
  @Input()
  model: any;
  @Output()
  modelChange = new EventEmitter<any>();
  @Input()
  linkIdCollection = new LinkIdCollection();

  /**
   * Setup form validators
   * TODO - link id is hidden for time being.
   */
  myValidators: { [path: string]: Validator } = {
    // Should have a value and should not exist in the form.
    '/linkId': (value, property, form) => {
      if (value.trim().length === 0 || this.linkIdCollection.hasLinkId(value)) {
        return [{
          linkId: {expectedValue: 'Unique linkId in the form'}
        }];
      }
      return null;
    }
  };

  /**
   * Field bindings
   */
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

  /**
   * Merge schema and layout jsons
   */
  ngOnInit() {
    this.http.get('/assets/ngx-item.schema.json', {responseType: 'json'}).pipe(
      switchMap((schema: any) => this.http.get('/assets/items-layout.json', {responseType: 'json'}).pipe(
        map((layout: any) => {
          schema.layout = layout;
          return schema;
        })
      ))
    ).subscribe((schema) => {
      this.mySchema = schema;
      // console.log(JSON.stringify(this.mySchema.layout, null, 2));
    });
  }

  updateModel(model) {
    this.modelChange.emit(model);
  }

}
