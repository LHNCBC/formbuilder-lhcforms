/**
 * Handle layout and editing of item level fields
 */
import {
  AfterViewInit, ChangeDetectorRef,
  Component, ComponentFactoryResolver,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild, ViewContainerRef
} from '@angular/core';
import {ShareObjectService} from '../share-object.service';
import {Binding, FormComponent, FormProperty, Validator} from '@lhncbc/ngx-schema-form';
import {LinkIdCollection} from '../item/item.component';
import {map, switchMap, timeout} from 'rxjs/operators';
import * as traverse from 'json-schema-traverse';
import {FormService} from '../services/form.service';
import {SfFormWrapperComponent} from '../sf-form-wrapper/sf-form-wrapper.component';

@Component({
  selector: 'lfb-ngx-schema-form',
  template: `
    <div class="container">
     <ng-container #viewContainer></ng-container>
      <!--
      <sf-form #itemForm *ngIf="model" [schema]="mySchema"
               [(model)]="model"
               [bindings]="myFieldBindings"
      ></sf-form>
      -->
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
export class NgxSchemaFormComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  static ID = 0;
  _id = ++NgxSchemaFormComponent.ID;
  // @ViewChild('itemForm') itemForm: FormComponent;
  @ViewChild('viewContainer', {read: ViewContainerRef}) containerRef: ViewContainerRef;

  mySchema: any = {properties: {}};
  myTestSchema: any;
  @Output()
  setLinkId = new EventEmitter();
  @Input()
  model: any;
  @Output()
  modelChange = new EventEmitter<any>();
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

  constructor(private modelService: ShareObjectService, private formService: FormService,
              private cfr: ComponentFactoryResolver, private cd: ChangeDetectorRef) {
    this.mySchema = formService.getItemSchema();
  }

  /**
   * Merge schema and layout jsons
   */
  ngOnInit() {
    this.mySchema = this.formService.getItemSchema();
  }

  ngAfterViewInit() {
    // this.resetForm(this.model);
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.model) {
      this.resetForm(changes.model.currentValue);
    }
    /*
    if(changes.model.currentValue !== changes.model.previousValue) {
      if(this.itemForm) {
        this.itemForm.reset();
        this.itemForm.writeValue(changes.model.currentValue);
      }
    }
    */
  }


  /**
   * The model is changed, emit the event.
   * @param value - Event value.
   */
  updateValue(value: any) {
    this.valueChange.emit(value);
    this.modelService.currentItem = value;
  }

  updateModel(model: any) {
    this.modelChange.emit(model);
    this.modelService.currentItem = model;
  }

  /**
   * Reset ngx- form with new model
   */
  resetForm(model: any): void {
    if(!this.containerRef) {
      return;
    }

    const resolver = this.cfr.resolveComponentFactory(SfFormWrapperComponent);
    this.containerRef.clear();
    const componentRef = this.containerRef.createComponent(resolver);
    this.model = model;
    componentRef.instance.model = this.model;
    componentRef.instance.valueChange.subscribe((value) => {
      this.updateValue(value);
    })
  }

  ngOnDestroy() {
  }

}
