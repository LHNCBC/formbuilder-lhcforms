import { Component, OnInit } from '@angular/core';
import { faPlusCircle, faTrash, faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FormProperty } from '@lhncbc/ngx-schema-form';
import { LfbArrayWidgetComponent } from '../lfb-array-widget/lfb-array-widget.component';

@Component({
  standalone: false,
  selector: 'lfb-meta-profile',
  template: `
    <div class="widget form-group m-0" [ngClass]="{'row': labelPosition === 'left'}">
      <div [ngClass]="labelClasses">
        @if (!noCollapseButton) {
          <button href="#" type="button"
            [ngClass]="{'float-sm-end': labelPosition === 'left'}"
            class="btn btn-sm m-0 btn-default collapse-button"
            (click)="isCollapsed = !isCollapsed"
            [attr.aria-expanded]="!isCollapsed"
            [attr.aria-controls]="tableId">
            <fa-icon [icon]="isCollapsed ? faRight : faDown" aria-hidden="true"></fa-icon>
          </button>
        }
        @if (!noTableLabel) {
          <lfb-label [title]="schema.title" [helpMessage]="schema.description" [for]="tableId"></lfb-label>
        }
      </div>

      <div class="p-0 card bg-transparent border-0 m-auto {{controlClasses}}" [attr.id]="tableId">
        <div [ngbCollapse]="isCollapsed">
          @for (itemProperty of (formProperty.properties ?? []); track itemProperty; let ind = $index) {
            <div class="d-flex align-items-center mb-1">
              <div class="flex-grow-1 pe-1">
                <lfb-form-element [nolabel]="true" [formProperty]="itemProperty"></lfb-form-element>
              </div>
              <button type="button"
                class="btn btn-link btn-sm array-remove-button p-0 rounded-0"
                [attr.disabled]="isRemoveButtonDisabled() ? '' : null"
                matTooltip="Remove this row"
                aria-label="Remove this row"
                (click)="removeProperty(ind)">
                <fa-icon [icon]="faRemove" aria-hidden="true"></fa-icon>
              </button>
            </div>
          }
        </div>

        <button
          (click)="addItem()"
          class="btn btn-sm btn-light text-primary shadow-sm array-add-button"
          [attr.disabled]="isAddButtonDisabled() ? '' : null">
          <fa-icon [icon]="faAdd" aria-hidden="true"></fa-icon> {{addButtonLabel}}
        </button>
      </div>
    </div>
  `
})
export class MetaProfileComponent extends LfbArrayWidgetComponent implements OnInit {
  static seqNum = 0;

  faAdd = faPlusCircle;
  faRemove = faTrash;
  faRight = faAngleRight;
  faDown = faAngleDown;

  isCollapsed = false;
  noCollapseButton = false;
  noTableLabel = false;
  addButtonLabel = 'Add';
  tableId = 'metaProfileComponent' + MetaProfileComponent.seqNum++;

  ngOnInit() {
    // Note: Skip parent's ngOnInit which calls formProperty.addItem() if array is empty
    // This prevents creating an empty item that interferes with the default profile value
    
    this.addDefaultItemIfEmpty = false;
    super.ngOnInit();
    const widget = this.formProperty.schema.widget;
    this.addButtonLabel = widget && widget.addButtonLabel ? widget.addButtonLabel : 'Add';
    this.noCollapseButton = !!(widget && widget.noCollapseButton);
    this.noTableLabel = !!(widget && widget.noTableLabel);
  }

  removeProperty(index: number) {
    const props = this.formProperty.properties as FormProperty[];
    if (index < 0 || index >= props.length) {
      return;
    }
    super.removeItem(props[index]);
  }
}
