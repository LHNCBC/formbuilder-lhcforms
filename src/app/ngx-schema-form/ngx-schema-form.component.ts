/**
 * Handle layout and editing of item level fields
 */
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import {Binding, FormComponent, FormProperty, Validator} from 'ngx-schema-form';
import {LinkIdCollection} from '../item/item.component';
import {map, switchMap, timeout} from 'rxjs/operators';
import * as traverse from 'json-schema-traverse';
import {FormService} from '../services/form.service';

@Component({
  selector: 'lfb-ngx-schema-form',
  template: `
    <div class="container">
      <sf-form #itemForm *ngIf="model" [schema]="mySchema"
               [(model)]="model" (onChange)="updateValue($event.value)"
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
export class NgxSchemaFormComponent implements OnInit, OnChanges, OnDestroy {

  static _id = 0;
  id = NgxSchemaFormComponent._id++;
  @ViewChild('itemForm') itemForm: FormComponent;

  mySchema: any = {properties: {}};
  myTestSchema: any;
  @Output()
  setLinkId = new EventEmitter();
  @Input()
  model: any;
  // @Output()
  // modelChange = new EventEmitter<any>();
  @Output()
  valueChange = new EventEmitter<any>();
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

  constructor(private http: HttpClient, private modelService: ShareObjectService, private formService: FormService) {
    this.mySchema = formService.getItemSchema();
  }

  /**
   * Merge schema and layout jsons
   */
  ngOnInit() {
    this.mySchema = this.formService.getItemSchema();
  }



  ngOnChanges(changes: SimpleChanges) {
    console.log('ngx-comp:'+this.id+':ngOnChanges(): this.model is previous = '+(this.model === changes.model.previousValue));
    console.log('ngx-comp:'+this.id+':ngOnChanges(): this.model is current = '+(this.model === changes.model.currentValue));
    console.log('ngx-comp:'+this.id+':ngOnChanges(): this.model.text = '+this.model?.text);
    console.log('ngx-comp:'+this.id+':ngOnChanges(): changes.model.previous.text = '+changes.model?.previousValue?.text);
    console.log('ngx-comp:'+this.id+':ngOnChanges(): changes.model.current.text = '+changes.model?.currentValue?.text);
    /*
    if(changes.model.currentValue !== this.model) {
      console.log('ngx-comp:'+this.id+':ngOnChanges(): 6 changes.model.currentValue.text = '+changes.model?.currentValue?.text);
      if(this.itemForm) {
        // this.itemForm.reset();
        console.log('ngx-comp:'+this.id+':ngOnChanges(): 7');
        // this.itemForm.writeValue(changes.model.currentValue);
      }
    }
    */
  }



  /**
   * The model is changed, emit the event.
   * @param model - Event value.
   */
  updateValue(value) {
    // this.modelChange.emit(value);
    this.valueChange.emit(value);
    console.log('ngx-comp:'+this.id+':updateValue(): 1 value.text = '+value?.text);
    console.log('ngx-comp:'+this.id+':updateValue(): 2 this.model.text = '+this.model?.text);
    console.log('ngx-comp:'+this.id+':updateValue(): 3 this.model.answerOption.length = '+this.model?.answerOption?.length);
    if(this.model?.answerOption?.length > 0) {
      console.log('ngx-comp:'+this.id
        +':updateValue(): 4 this.model.answerOption[0].valueCoding.code = '
        +this.model?.answerOption[0]?.valueCoding?.code);
    }

    this.modelService.currentItem = value;
//    console.log('ngx-comp:'+this.id+':updateValue(): 2 this.model.text = '+this.model?.text);
  }

  /**
   * Reset ngx- form with new model
   */
  resetForm(model: any): void {
    console.log('ngx-comp:'+this.id+':resetForm(): 1');
    this.model = model;
  }

  ngOnDestroy() {
    console.log('ngx-comp:'+this.id+':ngOnDestroy() 1');
  }
}
