import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import {FormProperty} from 'ngx-schema-form';
import {LinkIdCollection} from '../main-content/main-content.component';
import {Form} from '@angular/forms';

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

  myValidators = {
    '/_itemType': (value, property, form) => {
      if (!property.valid) {
        return property.errors;
      } else if (!value || value.trim().length === 0) {
        return {_itemType: {expectedValue: 'group, display, or question'}};
      }
    },
    '/type': (value, property, form) => {
      if (!property.valid) {
        return property.errors;
      } else if (!value || value.trim().length === 0) {
        return {expectedValue: {type: 'One of ' + property.schema.enum.join(' ')}};
      }
    },
    '/linkId': (value, property, form) => {
      if (!property.valid) {
        return property.errors;
      } else if (value.trim().length === 0 || this.linkIdCollection.hasLinkId(value)) {
        return {
          linkId: {expectedValue: 'Unique linkId in the form'}
        };
      }
      return null;
    }
  };

  myFieldBindings = {
    '/linkId': [
      {
        change: (event, formProperty: FormProperty) => {
          if (formProperty.valid) {
            this.setLinkId.emit(formProperty.value);
          }
        }
      }
    ],
    '/type': [
      {
        change: (event, formProperty: FormProperty) => {
          const root = formProperty.findRoot();
          if (formProperty.value === 'group' || formProperty.value === 'display') {
            root.getProperty('_itemType').setValue(formProperty.value);
          } else {
            root.getProperty('_itemType').setValue('question');
          }
        }
      }
    ],
    '/_itemType': [
      {
        change: (event, formProperty: FormProperty) => {
          const type = formProperty.findRoot().getProperty('type');
          if (formProperty.value === 'group' || formProperty.value === 'display') {
            type.setValue(formProperty.value);
            type.schema.readOnly = true;
          } else {
            type.schema.readOnly = false;
            if (type.value === 'group' || type.value === 'display') {
              type.reset();
            }
          }
        }
      }
    ]
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
