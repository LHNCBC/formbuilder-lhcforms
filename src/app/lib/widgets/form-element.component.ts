import { Component, OnInit, Input } from '@angular/core';
import { FormElementComponent} from 'ngx-schema-form';
import { Widget } from 'ngx-schema-form';

@Component({
  selector: 'app-form-element',
  template: `
    <div *ngIf="formProperty.visible"
         [class.has-error]="!control.valid"
         [class.has-success]="control.valid">
      <app-element-chooser
        [nolabel]="nolabel"
        (widgetInstanciated)="onWidgetInstanciated($event)"
        [widgetInfo]="formProperty.schema.widget">
      </app-element-chooser>
      <sf-form-element-action *ngFor="let button of buttons" [button]="button" [formProperty]="formProperty"></sf-form-element-action>
    </div>
  `,
  styles: []
})
export class AppFormElementComponent extends FormElementComponent {
  @Input()
  nolabel = false;

  onWidgetInstanciated(widget: Widget<any>): void {
    super.onWidgetInstanciated(widget);
    // @ts-ignore
    this.widget.nolabel = this.nolabel;
  }
}
