/**
 * Component to display array of object fields in a table format with field names at the top,
 * add button at the bottom, delete button for each row, label for the table at the left etc.
 *
 * It is optionally controlled by a boolean widget above the table.
 *
 * An optional selection column is provided to select rows with either radio buttons or checkboxes. For example,
 * It could be used as selection of rows for defaults in answer options table.
 * The checkbox selections are captured in an array of boolean values, while index of radio selection is captured
 * in an integer variable.
 */

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef, inject,
  OnChanges,
  OnInit, Renderer2,
  SimpleChanges
} from '@angular/core';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import {faPlusCircle, faTrash, faAngleDown, faAngleRight, faUpLong, faDownLong} from '@fortawesome/free-solid-svg-icons';
import {PropertyGroup} from '@lhncbc/ngx-schema-form';
import {Util} from '../../util';
import {LfbArrayWidgetComponent} from '../lfb-array-widget/lfb-array-widget.component';
import {Subscription} from 'rxjs';

@Component({
  standalone: false,
  selector: 'lfb-table',
  templateUrl: './table.component.html', // Use separate files for possible reuse from a derived class
  styleUrls: ['./table.component.css']
})
export class TableComponent extends LfbArrayWidgetComponent implements OnInit, AfterViewInit, DoCheck, OnChanges {

  static seqNum = 0;
  // Icons for buttons.
  faAdd = faPlusCircle;
  faRemove = faTrash;
  faRight = faAngleRight;
  faDown = faAngleDown;
  faMoveDown = faDownLong;
  faMoveUp = faUpLong;

  includeActionColumn = false;
  isCollapsed = false;
  addButtonLabel = 'Add'; // Default label
  noCollapseButton = false;
  noTableLabel = false;
  noHeader = false;
  // Flag to control hiding of add/remove buttons.
  singleItem = false;
  keyField = 'type'; // Key property of the object, based on which some fields could be hidden/shown.
  booleanControlledOption = false;
  booleanControlled = false;
  tableId = 'tableComponent'+TableComponent.seqNum++;

  // Row selection variables. Selections can be checkboxes or radio buttons.
  selectionRadio = -1; // Store array index of the radio button selection.
  selectionCheckbox: boolean [] = []; // Store an array of selected rows. Unselected elements are nulls or false.
  rowSelectionType = null; // 'radio' or 'checkbox'
  rowSelection = false; // If a row selection column is displayed. Default is no column.

  hideHeaderAriaLabel = true;

  renderer = inject(Renderer2);
  cdr = inject(ChangeDetectorRef);
  elementRef = inject(ElementRef);

  constructor() {
    super();
  }
  /**
   * Make sure at least one row is present for zero length array?
   */
  ngDoCheck(): void {
    if (this.formProperty.properties.length === 0 && this.booleanControlledOption) {
      this.addItem();
    }
    this.includeActionColumn = (this.formProperty.properties as FormProperty[]).length > 1;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.booleanControlled) {
      this.booleanControlledOption = !Util.isEmpty(this.formProperty.value);
    }
  }


  /**
   * Initialize
   */
  ngOnInit() {
    super.ngOnInit();
    const widget = this.formProperty.schema.widget;
    this.addButtonLabel = widget && widget.addButtonLabel
      ? widget.addButtonLabel : 'Add';

    this.noTableLabel = !!widget.noTableLabel;
    this.noCollapseButton = !!widget.noCollapseButton;
    this.singleItem = !!widget.singleItem;
    this.booleanControlled = !!widget.booleanControlled;
    if(widget.booleanControlled) {
      this.booleanControlledOption = !!widget.booleanControlledOption;
    }

    this.booleanControlledOption = this.booleanControlledOption || !Util.isEmpty(this.formProperty.value);

    if(widget.rowSelection) {
      this.rowSelection = widget.rowSelection;
      this.rowSelectionType = widget.rowSelectionType || 'radio'; // Defaults to radio buttons.
    }
    this.selectionRadio = -1;
    this.selectionCheckbox = [];
  }


  /**
   * Initialize setting up observers.
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
    const singleItemEnableSource = this.formProperty.schema.widget ?
      this.formProperty.schema.widget.singleItemEnableSource : null;
    const multipleSelectionEnableSource = this.formProperty.schema.widget ?
      this.formProperty.schema.widget.multipleSelectionEnableSource : null;
    // Although intended to be source agnostic, it is mainly intended for 'repeats' field as source.
    // For example, when repeats is false, The initial field is only one row.
    // The requirement is:
    // . When source is false, hide add/remove buttons.
    // . Source if present and is true means show the buttons.
    // . Absence of source condition means the default behavior which is show the buttons.
    let prop = singleItemEnableSource ? this.formProperty.searchProperty(singleItemEnableSource) : null;
    let subscription: Subscription;
    if (prop) {
      subscription = prop.valueChanges.subscribe((newValue) => {
        if (newValue === false) {
          // If already has multiple items in the array, remove all items except first one.
          if (+this.formProperty.properties.length > 1) {
            this.formProperty.properties = (this.formProperty.properties as FormProperty[]).slice(0, 1);
            this.formProperty.updateValueAndValidity(false, true);
          }
        }
        this.singleItem = !newValue;
        this.noCollapseButton = this.singleItem;
        if(this.rowSelection) {
          this.rowSelectionType = this.singleItem ? 'radio' : 'checkbox';
        }
        this.cdr.markForCheck();
      });
      this.subscriptions.push(subscription);
    }

    prop = multipleSelectionEnableSource ? this.formProperty.searchProperty(multipleSelectionEnableSource) : null;
    if (prop) {
      subscription = prop.valueChanges.subscribe((newValue) => {
        if (newValue === false && this.rowSelection) {
          this.rowSelectionType = 'radio';
        }
        else if(newValue && this.rowSelection) {
          this.rowSelectionType = 'checkbox';
        }
        this.cdr.markForCheck();
      });
      this.subscriptions.push(subscription);
    }

    const keyField = this.formProperty.findRoot().schema.widget.keyField;
    if (keyField) {
      this.keyField = keyField;
    }
    // Lookout for any changes to key field
    subscription = this.formProperty.searchProperty(this.keyField).valueChanges.subscribe((newValue) => {
      const showFields = this.getShowTableFields();
      this.noHeader = showFields.some((f) => f.noHeader);
      this.cdr.markForCheck();
    });

    this.subscriptions.push(subscription);

    subscription = this.formProperty.valueChanges.subscribe((newValue) => {
      this.booleanControlledOption = this.booleanControlledOption || !Util.isEmpty(newValue);
    });
    this.subscriptions.push(subscription);
  }

  /**
   * Handle booleanControlled event.
   * @param event - Angular event emitted value.
   */
  onBooleanControlledChange(event: boolean) {
    this.booleanControlledOption = event;
  }

  /**
   * Get fields to show.
   */
  getShowTableFields(): any [] {
    let ret: any [] = [];
    if (this.formProperty.schema.widget && this.formProperty.schema.widget.showFields) {
      const showFields = this.formProperty.schema.widget.showFields;
      ret = showFields.filter((field) => {
        return this.isVisible(field.field);
      });
    }
    return ret;
  }

  /**
   * Check visibility i.e. based on visibleIf of ngx-schema-form
   * @param propertyId - property id
   */
  isVisible(propertyId) {
    let ret = true;
    if (+this.formProperty.properties.length > 0) {
      ret = Util.isVisible(this.formProperty.properties[0], propertyId);
    }
    return ret;
  }

  /**
   * Search for formProperty based on '.' delimited property ids, if
   *
   * @param property - Proper
   * @param descendantId - optional property id of a descendant property.
   */
  getProperty(property: FormProperty, descendantId?: string) {
    let p = property;
    if(p instanceof PropertyGroup && descendantId) {
      const path = descendantId?.split('.');
      for (const id of path) {
        p = (p as PropertyGroup).getProperty(id);
      }
    }
    return p;
  }

  /**
   * Get title of a field, given property id.
   * @param parentProperty -
   * @param propertyId -
   */
  getTitle(parentProperty, propertyId): string {
    const p = this.getProperty(parentProperty, propertyId);
    return p.schema && p.schema.title ? p.schema.title : Util.capitalize(propertyId);
  }


  /**
   * When clicking add button, prevent adding multiple empty rows. Alert the user with a popover message.
   * @param popoverRef - popover reference template.
   */
  addItemWithAlert(popoverRef) {
    this.isCollapsed = false;
    const items = this.formProperty.properties as [];
    const lastItem = items.length ? items[items.length - 1] : null;
    if(!lastItem || !Util.isEmpty(lastItem.value)) { // If no lastItem or be not empty.
      this.addItem();
      setTimeout(() => {
        const props = this.formProperty.properties as FormProperty [];
        this.getInputElementInTable(props.length - 1, 0).focus();
      });
    }
    else {
      popoverRef.open();
    }
  }


  /**
   * Get input element in the table.
   * Assumes one input or select element in a single cell.
   *
   * @param row - Row index of the cell
   * @param col - Column index of the cell.
   */
  getInputElementInTable(row, col) {
    return this.elementRef.nativeElement.querySelector('tbody')
      .querySelectorAll('tr')[row]
      .querySelectorAll('td')[col]
      .querySelector('input,select');
  }


  /**
   * Get canonical path of the control located in a cell in the table.
   *
   * @param arrayProperties - ArrayProperty of the table
   * @param row - Row index of the cell
   * @param col - Column index of the cell.
   */
  getCanonicalPath(arrayProperties, row, col) {
    return this.getPropertyFromTable(arrayProperties, row, col)?.canonicalPathNotation;
  }


  /**
   * Get form property of the control located in a table cell.
   * @param arrayProperties - ArrayProperty of the table.
   * @param row - Row index of the cell.
   * @param col - Col index of the cell.
   */
  getPropertyFromTable(arrayProperties, row, col): FormProperty {
    let prop = arrayProperties[row];
    const fieldPath = this.getShowTableFields()[col].field;
    fieldPath.split('.').forEach((field) => {
      prop = prop.getProperty(field);
    });
    return prop;
  }


  /**
   * Overriding parent method.
   *
   * Remove a given item, i.e. a row in the table.
   *
   * Before calling parent class api to remove the item, we need to do some housekeeping with respect to table's
   * selection (radio/checkbox) indexes.
   *
   * @param index - Index of the formProperty to be removed from the array.
   */
  removeProperty(index: number) {
    const props = this.formProperty.properties as FormProperty [];

    if(index < 0 || index >= props.length) {
      return;
    }

    if(index >= 0) {
      if(this.selectionCheckbox.length > 0) {
        this.selectionCheckbox.splice(index, 1);
      }
      if(this.selectionRadio >= 0) {
        if(this.selectionRadio === index) {
          this.selectionRadio = -1; // selected row is deleted. No selected radio button.
        }
        else if (this.selectionRadio > index) {
          this.selectionRadio--;
        }
      }
    }
    super.removeItem(props[index]);
  }


  /**
   * Possible method for handling row selections for radio buttons.
   */
  radioSelection(event) {
  }


  /**
   * Possible method for handling row selections for checkboxes.
   */
  checkboxSelection(event) {
  }

  /**
   * Possible method for handling clear selections for both radio buttons and checkboxes.
   */
  clearSelections() {
  }

  /**
   * Returns an aria-label string for the 'Clear Selection' button based on the 'rowSelectionType',
   * indicating whether it is a single selection (radio button) or a multi-selection (checkboxes).
   * @param col - table column where the button is located.
   * @returns - a descriptive string to be used as an aria-label for the 'Clear Selection' button.
   */
  getClearSelectionLabel(col: number): string {
    if (this.rowSelectionType === 'radio')
      return `Column ${col} Clear Selection button - used to clear Default radio button selection.`;
    else
      return `Column ${col} Clear Selection button - used to clear Default checkbox selections.`;
  }

  /**
   * Updates the aria-hidden attribute for the 'Clear Selection' button based on the provided status.
   * @param status - If true, set the aria-hidden attribute to true, which making the 'Clear Selection'
   *                 button aria-label unannounced by the screen reader.
   */
  onHideHeaderAriaLabel(status: boolean): void {
    this.hideHeaderAriaLabel = status;
  }

  /**
   * Handle moving the row up in the table.
   * @param index - Index of the row to be moved up.
   */
  onMoveUp(index) {
    const props = this.formProperty.properties as FormProperty [];
    if(props.length > 1) {
      this.changeSelectionOnMove(index, -1);
      const deletedProps = props.splice(index, 1);
      props.splice(index - 1, 0, deletedProps[0]);
      this.formProperty.updateValueAndValidity();
      setTimeout(() => {
        this.getInputElementInTable(index - 1, 0).focus();
      });
    }
  }

  /**
   * Handle moving the row down in the table.
   * @param index - Index of the row to be moved down.
   */
  onMoveDown(index) {
    const props = this.formProperty.properties as FormProperty [];
    if(props.length > 1) {
      this.changeSelectionOnMove(index, 1);
      const deletedProps = props.splice(index, 1);
      props.splice(index + 1, 0, deletedProps[0]);
      this.formProperty.updateValueAndValidity();
      setTimeout(() => {
        this.getInputElementInTable(index + 1, 0).focus();
      });
    }
  }

  /**
   * Change the selection on move up or down.
   * @param index - Index of the row.
   * @param direction - Relative position from the index i.e -1 for up and 1 for down.
   */
  changeSelectionOnMove(index: number, direction: number) {
    if(this.rowSelectionType === 'radio') {
      if(this.selectionRadio === index) {
        this.selectionRadio = index + direction;
      }
      else if(this.selectionRadio === index + direction) {
        this.selectionRadio = index;
      }
    }
    else {
      const thisValue = this.selectionCheckbox[index];
      this.selectionCheckbox[index] = this.selectionCheckbox[index + direction];
      this.selectionCheckbox[index + direction] = thisValue;
    }
  }

  /**
   * Check if the field is empty. Used to hide the delete button for the last row.
   * @param index - Index of the row.
   */
  isEmpty(index: number) {
    const ret = Util.isEmpty(this.formProperty.properties[index].value);
    return ret;
  }

  /**
   * Check if the next item is empty. Used to disable down arrow.
   * @param index - Index of the row.
   */
  isNextItemEmpty(index: number) {
    const count = (this.formProperty.properties as FormProperty []).length;
    let ret = false;
    if(index < count - 1) {
      ret = Util.isEmpty(this.formProperty.properties[index + 1].value);
    }
    return ret;
  }

  /**
   * Check if the previous item is empty. Used to disable up arrow.
   * @param event - Index of the row.
   */
  highlight(event: Event) {
    this.renderer.addClass(event.currentTarget, 'row-highlight');
  }

  /**
   * Check if the previous item is empty. Used to disable up arrow.
   * @param event - Index of the row.
   */
  unHighlight(event: Event) {
    this.renderer.removeClass(event.currentTarget, 'row-highlight');
  }
}
