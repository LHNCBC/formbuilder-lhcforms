/**
 * Customize layout of form-element from ngx-schema-form
 */
import {Component, Input} from '@angular/core';
import {FormElementComponent} from '@lhncbc/ngx-schema-form';
import { Widget } from '@lhncbc/ngx-schema-form';


@Component({
  standalone: false,
  selector: 'lfb-form-element',
  template: `
    <div *ngIf="formProperty.visible"
         [class.has-error]="!formProperty.valid"
         [class.has-success]="formProperty.valid">
      <lfb-element-chooser
        [nolabel]="nolabel"
        [layout]="layout"
        [labelWidthClass]="labelWidthClass"
        [booleanControlled]="booleanControlled"
        [booleanLabel]="booleanLabel"
        (widgetInstanciated)="onWidgetInstanciated($event)"
        [widgetInfo]="formProperty.schema.widget">
      </lfb-element-chooser>
      <sf-form-element-action *ngFor="let button of buttons" [button]="button"
                              [formProperty]="formProperty"></sf-form-element-action>
    </div>
  `,
  styles: []
})
export class AppFormElementComponent extends FormElementComponent {
  static seqNum = 0;
  // Input properties, typically read from layout schema json.
  @Input()
  nolabel = false;
  @Input()
  layout: string;
  @Input()
  labelWidthClass: string;
  @Input()
  controlWidthClass: string;
  @Input()
  booleanControlled = false;
  @Input()
  booleanLabel: string;

  /**
   * --- Used for debugging ----
   */
  /*
  ngOnChanges(changes: SimpleChanges): void {
    for (const prop in changes) {
      if (prop === 'formProperty') {
        console.log(
          `${prop}: ${changes[prop].previousValue ?
            changes[prop].previousValue.path +'(visible:'+changes[prop].previousValue.visible+')' : ''} /
            ${changes[prop].currentValue ? changes[prop].currentValue.path +'(visible:'+changes[prop].currentValue.visible+')' : ''} /
            ${changes[prop].firstChange}`);
      } else if (prop === 'control') {
        console.log(
          `${prop}: ${changes[prop].previousValue ? changes[prop].previousValue.valid : ''} /
          ${changes[prop].currentValue ? changes[prop].currentValue.valid : ''} / ${changes[prop].firstChange}`);
      } else {
        console.log(
          `${prop}: ${changes[prop].previousValue} / ${changes[prop].currentValue} / ${changes[prop].firstChange}`);
      }
    }
  }
  */

  /**
   * Override to add custom properties
   *
   * @param widget - Component widget
   */
  onWidgetInstanciated(widget: Widget<any>): void {
    super.onWidgetInstanciated(widget);
    this.setCanonicalId(); // Re-assign ids with canonical paths with proper indices.
    // @ts-ignore
    this.widget.nolabel = this.nolabel;
    // @ts-ignore
    this.widget.layout = this.layout;
    // @ts-ignore
    this.widget.labelWidthClass = this.labelWidthClass;
    // @ts-ignore
    this.widget.controlWidthClass = this.controlWidthClass;
  }


  /**
   * For some reason, the canonical path includes '*' for array items.
   * This method is to replace them with proper array indices. These ids are used for html element id
   */
  setCanonicalId(): void {
    // Parent path has proper index. Replace ancestral portion of the path with parent's path.
    const parentId = this.formProperty.parent?.canonicalPathNotation;
    if(parentId) {
      let id = parentId + this.formProperty.canonicalPathNotation.replace(/^.*\./, '.');
      id = `${id}_${AppFormElementComponent.seqNum++}`
      if (this.formProperty.root.rootName) {
        id = `${this.formProperty.root.rootName}:${id}`;
      }
      this.widget.name = id;
      this.widget.id = id;
    }
  }
}
