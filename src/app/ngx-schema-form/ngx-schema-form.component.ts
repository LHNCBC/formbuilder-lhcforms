import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import {Binding, FormProperty, Validator} from 'ngx-schema-form';
import {LinkIdCollection} from '../main-content/main-content.component';
import {Form} from '@angular/forms';
import {timeout} from 'rxjs/operators';

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
  node: any;
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
    '/linkId': {
        change: (event, formProperty: FormProperty) => {
          if (formProperty.valid) {
            this.setLinkId.emit(formProperty.value);
          }
        }
      }
  };

  constructor(private http: HttpClient, private modelService: ShareObjectService) {
  }

  ngOnInit() {
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

    this.modelService.object.subscribe((model) => {
      if (this.model !== model) {
        this.model = model;
      }
    });
  }

  updateModel(model) {
    this.modelService.setObject(model);
  }


}
