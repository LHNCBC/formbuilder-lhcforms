import {Component, OnInit, ViewChild} from '@angular/core';
import {AppFormElementComponent} from "../form-element/form-element.component";
import {LabelComponent} from "../label/label.component";
import {NgClass, NgStyle, NgTemplateOutlet} from "@angular/common";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {ReactiveFormsModule} from "@angular/forms";
import {TableComponent} from "../table/table.component";
import {NgbPopoverModule} from "@ng-bootstrap/ng-bootstrap";
import {FormProperty} from "@lhncbc/ngx-schema-form";
import {Util} from "../../util";
import {LfbPopoverDirective} from "../../directives/lfb-popover.directive";

@Component({
  selector: 'lfb-array',
  imports: [
    AppFormElementComponent,
    LabelComponent,
    FaIconComponent,
    NgbPopoverModule,
    ReactiveFormsModule,
    NgClass,
    NgStyle,
    NgTemplateOutlet,
    LfbPopoverDirective
  ],
  templateUrl: './lfb-array.component.html',
  styles: [`
    .lfb-array-item-gutter {
      flex: 0 0 3.5rem;
      width: 3.5rem;
      max-width: 3.5rem;
    }

    .lfb-array-item-gutter-narrow {
      flex: 0 0 1.75rem;
      width: 1.75rem;
      max-width: 1.75rem;
    }

    .lfb-array-item-delete {
      flex: 0 0 1.75rem;
      width: 1.75rem;
      max-width: 1.75rem;
    }

    :host ::ng-deep .lfb-array-item-control > lfb-form-element > div > lfb-element-chooser > lfb-object > div {
      padding-left: .5rem !important;
    }
  `]
})
export class LfbArrayComponent extends TableComponent implements OnInit {
  @ViewChild('lfbPopover', {static: false, read: LfbPopoverDirective}) lfbPopover: LfbPopoverDirective;
  arrayBodyClasses = 'ps-4 col-sm-12 mb-1';
  arrayItemLabelClasses = 'col-sm-2 d-flex justify-content-end pe-0 pt-1';
  arrayItemControlClasses = 'col-sm-10 p-0';
  arrayItemRowClasses = 'col-sm-12 row m-0 p-0 lfb-hover-scope';
  arrayItemLabelSpacerClasses = 'col-sm-2';
  arrayAddButtonClasses = 'col-sm-10 p-0 my-1';
  arrayAddButtonControlOffsetClasses = '';
  arrayAddButtonControlClasses = '';
  arrayItemDeleteClasses = 'lfb-array-item-delete d-flex justify-content-center p-1';
  arrayAddButtonActionSpacerClasses = 'lfb-array-item-delete';
  deleteButtonAfterControl = false;
  collapseButtonClasses = {};

  override ngOnInit(): void {
    super.ngOnInit();
    const widget = this.formProperty.schema.widget || {};
    this.arrayBodyClasses = [
      widget.childOffsetClass || 'ps-4',
      widget.arrayBodyClasses || 'col-sm-12 mb-1'
    ].filter((className) => !!className).join(' ');
    this.arrayItemLabelClasses = widget.arrayItemLabelClasses || this.arrayItemLabelClasses;
    this.arrayItemControlClasses = widget.arrayItemControlClasses || this.arrayItemControlClasses;
    this.arrayItemRowClasses = widget.arrayItemRowClasses || this.arrayItemRowClasses;
    this.arrayItemLabelSpacerClasses = widget.arrayItemLabelSpacerClasses || this.arrayItemLabelSpacerClasses;
    this.arrayAddButtonClasses = widget.arrayAddButtonClasses || this.arrayAddButtonClasses;
    this.arrayAddButtonControlOffsetClasses = widget.arrayAddButtonControlOffsetClasses || '';
    this.arrayAddButtonControlClasses = widget.arrayAddButtonControlClasses || '';
    this.arrayItemDeleteClasses = widget.arrayItemDeleteClasses || this.arrayItemDeleteClasses;
    this.arrayAddButtonActionSpacerClasses = widget.arrayAddButtonActionSpacerClasses || this.arrayAddButtonActionSpacerClasses;
    this.deleteButtonAfterControl = !!widget.deleteButtonAfterControl;
    this.collapseButtonClasses = {'float-sm-end': this.labelPosition === 'left' && !widget.collapseButtonNextToLabel};
  }

  /**
   * Add an item with alert if the last item is empty.
   * @param popoverRef
   * @param event
   */
  addItemWithAlert1(popoverRef: LfbPopoverDirective, event: MouseEvent) {
    this.isCollapsed = false;
    const properties = this.formProperty.properties as FormProperty[];
    const lastItem = properties.length ? properties[properties.length - 1] : null;
    if(!lastItem || !Util.isEmpty(lastItem.value)) { // If no lastItem or be not empty.
      this.addItem();
    }
    else {
      popoverRef.toggle(event);
    }

  }

  /**
   *  Get the iterable properties of the array.
   */
  iterableProperties(): FormProperty[] {
    return this.formProperty.properties as FormProperty[] || [];
  }
}
