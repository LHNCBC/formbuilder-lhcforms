/**
 * Handle layout and editing of item level fields
 */
import {
  ChangeDetectorRef,
  Component,
  EventEmitter, inject,
  Input, OnChanges,
  Output,
  SimpleChanges, ViewChild, ViewContainerRef,
} from '@angular/core';
import {SharedObjectService} from '../services/shared-object.service';
import {SfFormWrapperComponent} from "../sf-form-wrapper/sf-form-wrapper.component";

@Component({
  standalone: false,
  selector: 'lfb-ngx-schema-form',
  template: `
    <div class="container">
      <ng-container #sfFormWrapperHost></ng-container>
      <!--
      @if (instantiate) {
        <lfb-sf-form-wrapper [model]="model" (valueChange)="updateValue($event)" (errorsChanged)="onErrorsChange($event)" (validationErrorsChanged)="onValidationErrorsChange($event)"></lfb-sf-form-wrapper>
      }
      -->
    </div>
    `,
  styles: [`

    pre {
      padding: 02em;
      border: solid 1px black;
      background: #eee;
    }

    :host ::ng-deep sf-form-element > div {
      margin-top: 1em;
      margin-bottom: 1em;
    }

  `]
})
export class NgxSchemaFormComponent implements OnChanges {

  static ID = 0;
  _id = ++NgxSchemaFormComponent.ID;

  instantiate = true;
  myTestSchema: any;
  @Output()
  setLinkId = new EventEmitter();
  @Input()
  model: any;
  @Output()
  valueChange = new EventEmitter<any>();
  @Output()
  errorsChanged = new EventEmitter<any[]>();
  @Output()
  validationErrorsChanged = new EventEmitter<any[]>();

  @ViewChild('sfFormWrapperHost', {read: ViewContainerRef}) sfFormWrapperHost: ViewContainerRef;

  private modelService = inject(SharedObjectService);
  private cdr = inject(ChangeDetectorRef);
  constructor() {
  }

  ngOnChanges(changes: SimpleChanges) {
    // Destroy the current component and recreate new one.
    if(changes.model.firstChange && !changes.model.currentValue) {
      return;
    }
    this.createNewFormWrapper();
    /*
    this.instantiate = false;
    this.cdr.detectChanges();
    this.instantiate = true;
    this.cdr.detectChanges();
     */
  }

  private createNewFormWrapper() {
    this.sfFormWrapperHost.clear();
    const componentRef = this.sfFormWrapperHost.createComponent<SfFormWrapperComponent>(SfFormWrapperComponent);
    componentRef.instance.model = this.model;
    componentRef.instance.valueChange.subscribe((value: any) => this.updateValue(value));
    componentRef.instance.errorsChanged.subscribe((errors: any[]) => this.onErrorsChange(errors));
    componentRef.instance.validationErrorsChanged.subscribe((errors: any[]) => this.onValidationErrorsChange(errors));
  }
  /**
   * The model is changed, emit the event.
   * @param value - Event value.
   */
  updateValue(value: any) {
    this.valueChange.emit(value);
    this.modelService.currentItem = value;
  }


  /**
   * Handle errorsChanged event from <lfb-sf-form-wrapper>
   * @param errors - Event object from <lfb-sf-form-wrapper>
   */
  onErrorsChange(errors) {
    this.errorsChanged.next(errors);
  }

  /**
   * Handle linkId validationErrorsChanged event from <lfb-sf-form-wrapper>
   * @param errors - Event object from <lfb-sf-form-wrapper>
   */
   onValidationErrorsChange(errors) {
    this.validationErrorsChanged.next(errors);
  }
}
