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

import {AfterViewInit, Component, DoCheck, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {ArrayWidget, FormProperty} from 'ngx-schema-form';
import {faPlusCircle} from '@fortawesome/free-solid-svg-icons';
import {faTrash} from '@fortawesome/free-solid-svg-icons';
import {faAngleDown} from '@fortawesome/free-solid-svg-icons';
import {faAngleRight} from '@fortawesome/free-solid-svg-icons';
import {PropertyGroup} from 'ngx-schema-form/lib/model';
import {Util} from '../../util';
import {LfbArrayWidgetComponent} from '../lfb-array-widget/lfb-array-widget.component';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lfb-table',
  templateUrl: './table.component.html', // Use separate files for possible reuse from a derived class
  styleUrls: ['./table.component.css']
})
export class TableComponent extends LfbArrayWidgetComponent implements AfterViewInit, DoCheck, OnDestroy {

  static seqNum = 0;
  // Icons for buttons.
  faAdd = faPlusCircle;
  faRemove = faTrash;
  faRight = faAngleRight;
  faDown = faAngleDown;

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

  subscriptions: Subscription [] = [];
  /**
   * Make sure at least one row is present for zero length array?
   */
  ngDoCheck(): void {
    if(this.booleanControlled) {
      this.booleanControlledOption = this.booleanControlledOption || !Util.isEmpty(this.formProperty.value);
    }
    if (this.formProperty.value.length === 0 && this.booleanControlledOption) {
      this.addItem();
    }
    /*
    // If a single radio item, change it checkbox.
    if (this.rowSelection && this.rowSelectionType === 'radio' && this.formProperty.value.length === 1) {
      this.rowSelectionType = 'checkbox';
      // If single radio was selected, transfer the selection to checkbox.
      if(this.selectionRadio === 0) {
        this.selectionCheckbox[0] = true;
      }
    }
    */
  }


  /**
   * Initialize
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
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
    let subsciption: Subscription;
    if (prop) {
      subsciption = prop.valueChanges.subscribe((newValue) => {
        if (newValue === false) {
          // If already has multiple items in the array, remove all items except first one.
          if (this.formProperty.properties.length > 1) {
            this.formProperty.properties = (this.formProperty.properties as FormProperty[]).slice(0, 1);
            this.formProperty.updateValueAndValidity(false, true);
          }
        }
        this.singleItem = !newValue;
        this.noCollapseButton = this.singleItem;
        if(this.rowSelection) {
          this.rowSelectionType = this.singleItem ? 'radio' : 'checkbox';
        }
      });
      this.subscriptions.push(subsciption);
    }

    prop = multipleSelectionEnableSource ? this.formProperty.searchProperty(multipleSelectionEnableSource) : null;
    if (prop) {
      subsciption = prop.valueChanges.subscribe((newValue) => {
        this.selectionRadio = -1;
        this.selectionCheckbox = [];
        if (newValue === false && this.rowSelection) {
          this.rowSelectionType = 'radio';
        }
        else if(newValue && this.rowSelection) {
          this.rowSelectionType = 'checkbox';
        }
        if(newValue === false && this.rowSelection && this.formProperty.properties.length === 1) {
          this.rowSelectionType = 'checkbox';
        }
      });
      this.subscriptions.push(subsciption);
    }

    const keyField = this.formProperty.findRoot().schema.widget.keyField;
    if (keyField) {
      this.keyField = keyField;
    }
    // Lookout for any changes to key field
    subsciption = this.formProperty.searchProperty(this.keyField).valueChanges.subscribe((newValue) => {
      const showFields = this.getShowFields();
      this.noHeader = showFields.some((f) => f.noHeader);
    });

    this.subscriptions.push(subsciption);
  }

  /**
   * Get fields to show.
   */
  getShowFields(): any [] {
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
    if (this.formProperty.properties.length > 0) {
      ret = Util.isVisible(this.formProperty.properties[0], propertyId);
    }
    return ret;
  }

  /**
   * Search for formProperty based on '.' delimited property ids.
   *
   * @param parentProperty -
   * @param propertyId -
   */
  getProperty(parentProperty: PropertyGroup, propertyId: string) {
    const path = propertyId.split('.');
    let p = parentProperty;
    for (const id of path) {
      p = p.getProperty(id);
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
    const elements = this.formProperty.value as [];
    if(elements.length > 0) {
      const lastItem = elements[elements.length - 1];
      if(!Util.isEmpty(lastItem)) {
        this.addItem();
      }
      else {
        popoverRef.open();
      }
    }
  }


  /**
   * Remove a given item, i.e. a row in the table.
   *
   * Before calling parent class api to remove the item, we need to do some house keeping with respect to table's
   * selection (radio/checkbox) indexes.
   *
   * @param formProperty - The row represented by its form property.
   */
  removeItem(formProperty) {
    const props = this.formProperty.properties as FormProperty [];

    const propIndex = props.findIndex((e) => e === formProperty);
    if(propIndex >= 0) {
      if(this.selectionCheckbox.length > 0) {
        this.selectionCheckbox.splice(propIndex, 1);
      }
      if(this.selectionRadio >= 0) {
        if(this.selectionRadio === propIndex) {
          this.selectionRadio = -1; // selected row is deleted. No selected radio button.
        }
        else if (this.selectionRadio > propIndex) {
          this.selectionRadio--;
        }
      }
    }
    super.removeItem(formProperty);
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

  ngOnDestroy() {
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }
}
