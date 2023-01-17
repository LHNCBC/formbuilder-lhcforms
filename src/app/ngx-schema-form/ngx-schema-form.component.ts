/**
 * Handle layout and editing of item level fields
 */
import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {SharedObjectService} from '../services/shared-object.service';

@Component({
  selector: 'lfb-ngx-schema-form',
  template: `
    <div class="container">
      <lfb-sf-form-wrapper [model]="model" (valueChange)="updateValue($event)" (errorsChanged)="onErrorsChange($event)"></lfb-sf-form-wrapper>
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
export class NgxSchemaFormComponent {

  static ID = 0;
  _id = ++NgxSchemaFormComponent.ID;

  myTestSchema: any;
  @Output()
  setLinkId = new EventEmitter();
  @Input()
  model: any;
  @Output()
  valueChange = new EventEmitter<any>();
  @Output()
  errorsChanged = new EventEmitter<any[]>();

  constructor(private modelService: SharedObjectService) {
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
}
