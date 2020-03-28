import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import { forkJoin } from 'rxjs';
import {UtilService} from '../services/util.service';

@Component({
  selector: 'app-ajsf-form',
  templateUrl: './ajsf-form.component.html',
  styleUrls: ['./ajsf-form.component.css']
})
export class AjsfFormComponent implements OnInit {
  @Input()
  framework = 'material-design';
  schema: any;
  options: any = {
    addSubmit: false
  };
  layout: any;
  modelValue: any = {};
  isValid: boolean;
  errors: any;
  constructor(private http: HttpClient, private modelService: ShareObjectService, private util: UtilService) { }

  ngOnInit() {
    forkJoin(
      {
        schema: this.http.get('/assets/ajsf-item.schema.json', {responseType: 'json'}),
        layout: this.http.get('/assets/ajsf-item.layout.json', {responseType: 'json'})
      }
    )
      .subscribe((formObject) => {
        this.util.processLayout(formObject.layout);
        this.schema = formObject.schema;
        this.layout = formObject.layout;
      });



    this.modelService.object.subscribe((model) => {
      this.modelValue = model;
    });
  }

  traverse(obj, prop, cb) {
    const keys = obj.keys();
    keys.forEach((key) => {
      const val = obj[key];
      if (key === prop) {
        cb(val);
      }
      if (typeof val === 'object' && val !== null) {
        this.traverse(val, prop, cb);
      }

    });
  }

  get model() {
    return this.modelValue;
  }

  set model(model) {
    this.modelService.setObject(model);
  }

  onValid(isValid) {
    this.isValid = isValid;
  }

  validationErrors(errors) {
    this.errors = errors;
  }


  onSubmit(value) {
    console.log('Submitted form' + JSON.stringify(value, null, 2));
  }

  showJson(json) {
    console.log(JSON.stringify(json, null, 2));
  }
}
