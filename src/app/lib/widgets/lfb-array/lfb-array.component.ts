import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AppFormElementComponent} from "../form-element/form-element.component";
import {LabelComponent} from "../label/label.component";
import {NgClass, NgStyle} from "@angular/common";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
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
    FormsModule,
    NgbPopoverModule,
    ReactiveFormsModule,
    NgClass,
    NgStyle,
    LfbPopoverDirective
  ],
  templateUrl: './lfb-array.component.html'
})
export class LfbArrayComponent extends TableComponent implements OnInit {
  @ViewChild('addButton', {static: false}) addButton: ElementRef;
  @ViewChild('lfbPopover', {static: false, read: LfbPopoverDirective}) lfbPopover: LfbPopoverDirective;

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
