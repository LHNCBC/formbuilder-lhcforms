/**
 * Customize layout of form-element from ngx-schema-form
 */
import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {FormElementComponent, SchemaFormModule} from '@lhncbc/ngx-schema-form';
import { Widget } from '@lhncbc/ngx-schema-form';
import { ElementChooserComponent } from '../element-chooser/element-chooser.component';



@Component({
  standalone: true,
  imports: [SchemaFormModule, ElementChooserComponent],
  selector: 'lfb-form-element',
  template: `
    @if (formProperty?.visible) {
      <div
        class="lfb-hover-scope"
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
        @for (button of buttons; track button) {
          <sf-form-element-action [button]="button"
          [formProperty]="formProperty"></sf-form-element-action>
        }
      </div>
    }
    `,
  styles: []
})
export class AppFormElementComponent extends FormElementComponent implements OnInit, OnChanges {
  static seqNum = 0;
  private baseInitialized = false;
  // Input properties, typically read from layout schema json.
  @Input()
  nolabel = false;
  @Input()
  layout: string;
  @Input()
  labelWidthClass: string;
  @Input()
  labelPosition: string;
  @Input()
  labelClasses: string;
  @Input()
  controlClasses: string;
  @Input()
  controlWidthClass: string;
  @Input()
  booleanControlled = false;
  @Input()
  booleanLabel: string;

  /**
   * Initialize when FormProperty is bound. This also completes initialization
   * deferred by ngOnInit when a conditional layout initially supplies no property.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.formProperty?.currentValue) {
      this.initializeBaseComponent();
    }
  }

  ngOnInit() {
    this.initializeBaseComponent();
  }

  /**
   * Initialize the schema-form base once if a bound FormProperty is available.
   */
  private initializeBaseComponent(): void {
    if (!this.baseInitialized && this.formProperty) {
      super.ngOnInit();
      this.baseInitialized = true;
    }
  }
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
    this.widget.labelPosition = this.labelPosition;
    // @ts-ignore
    this.widget.labelClasses = this.labelClasses;
    // @ts-ignore
    this.widget.labelWidthClass = this.labelWidthClass;
    // @ts-ignore
    this.widget.controlWidthClass = this.controlWidthClass;

    // @ts-ignore
    this.widget.controlClasses = this.controlClasses;
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
