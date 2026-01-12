import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import {TableComponent} from '../table/table.component';
import { Subscription } from 'rxjs';
import { FormService } from 'src/app/services/form.service';
import { AnswerOptionService } from 'src/app/services/answer-option.service';
import { DialogService } from 'src/app/services/dialog.service';
import { MessageType } from '../message-dlg/message-dlg.component';
import { ValidationService } from 'src/app/services/validation.service';
import { TreeNode } from '@bugsplat/angular-tree-component';

@Component({
  standalone: false,
  selector: 'lfb-answer-option',
  templateUrl: '../table/table.component.html',
  styleUrls: ['../table/table.component.css', './answer-option.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnswerOptionComponent extends TableComponent implements AfterViewInit, OnInit, OnDestroy {
  private formService = inject(FormService);
  private answerOptionService = inject(AnswerOptionService);
  dialogService = inject(DialogService);
  validationService = inject(ValidationService);

  static ORDINAL_URI = 'http://hl7.org/fhir/StructureDefinition/ordinalValue';
  static ITEM_WEIGHT_URI = 'http://hl7.org/fhir/StructureDefinition/itemWeight';

  // Flag to indicate when to update score extensions reading changes in *.valueCoding.__$score.
  initializing = false;
  isDialogOpen = false;
  ignoreNextFocus = false;

  buttons = [
    { label: 'Continue', value: 'continue' },
    { label: 'Cancel', value: 'cancel' }
  ];

  buttonOk = [
    { label: 'Ok', value: 'ok' }
  ]

  hasReferenced: any;

  /**
   * Angular life cycle event - Initialize attributes.
   */
  ngOnInit() {
    super.ngOnInit();
    this.initializing = true;
    this.init();
    this.initializing = false;
  }

  init() {
    this.selectionRadio = -1;
    this.selectionCheckbox = [];
    const repeatProp = this.formProperty.findRoot().getProperty('repeats');
    this.setSelectionType(repeatProp.value);
    const aOptions = this.formProperty.value;
    this.updateDefaultSelections(aOptions || []);
    this.setAnswerOptions(aOptions);
    this.cdr.markForCheck();
  }

  /**
   * Set row selection type, i.e. multiple selections or single selection
   * @param isRepeat - Repeat indicates multiple selections, set in 'repeat' field.
   */
  setSelectionType(isRepeat: boolean) {
    if(isRepeat) {
      this.rowSelectionType = 'checkbox';
    }
    else {
      this.rowSelectionType = 'radio';
    }
  }


  /**
   * Setup required observers
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub: Subscription;

    sub = this.formProperty.valueChanges.subscribe((newValue) => {
      // Avoid updating score extensions during initialization.
      if(!this.initializing) {
        this.updateScoreExtensions(newValue);

        if (this.hasReferenced) {
          const refs = Array.isArray(this.hasReferenced)
            ? this.hasReferenced
            : [this.hasReferenced];
          const nodes = refs
            .map(ref => ref && ref.enableWhenItemLinkId ? this.formService.getTreeNodeByLinkId(ref.enableWhenItemLinkId) : null)
            .filter((node): node is TreeNode => !!node);
          if (nodes.length > 0) {
            this.validationService.validateAllItems(nodes, 0, true, '/enableWhen');
          }
          this.cdr.detectChanges();
        }
      }
    });
    this.subscriptions.push(sub);

    sub = this.formService.formReset$.subscribe(() => {
      // Flag valueChanges observer to avoid updating score extensions.
      this.initializing = true;
      // Updates *.valueCoding.__$score and *.initialSelected.
      this.init();
      this.initializing = false;
     });
    this.subscriptions.push(sub);

    const repeatProp = this.formProperty.findRoot().getProperty('repeats');
    sub = repeatProp.valueChanges.subscribe((isRepeating) => {
      this.setSelectionType(isRepeating);
      if(!this.initializing) {
        const firstCheckbox = this.selectionCheckbox.findIndex((e) => {return e});
        // When flipping DEFAULT TYPE from radio to checkbox or vice versa, and if no selections are made on
        // the current type, assign first selection of previous type to the current type.
        if(isRepeating) {
          // If no checkboxes selected, pick the radio selection as current checkbox selection.
          if(firstCheckbox < 0 && this.selectionRadio >= 0) {
            this.selectionCheckbox[this.selectionRadio] = true;
          }
          this.updateWithCheckboxSelections();
         }
        else {
          // If no radio buttons are selected, pick the first checkbox as radio selection.
          if(this.selectionRadio < 0 && firstCheckbox >= 0) {
            this.selectionRadio = firstCheckbox;
          }
          this.updateWithRadioSelection();
        }
      }
      this.cdr.markForCheck();
    });
    this.subscriptions.push(sub);

    sub = this.formService.formChanged$.subscribe(() => {
      // New form is to be loaded, mark initialization.
      this.initializing = true;
    });
    this.subscriptions.push(sub);

    // Subscribe to single selection (repeats = false) by the "Pick Initial" field.
    sub = this.answerOptionService.radioSelection$.subscribe((selection) => {
      this.selectionRadio = selection;
      this.updateWithRadioSelection();
    });
    this.subscriptions.push(sub);

    // Subscribe to multiple selections (repeats = true) by the "Pick Initial" field.
    sub = this.answerOptionService.checkboxSelection$.subscribe((selection) => {
      this.selectionCheckbox = selection;
      this.updateWithCheckboxSelections();
    });
    this.subscriptions.push(sub);

    // The schema.widget.labelPosition is not populated after the 'Default' column in the table.component.html
    // has been excluded.
    this.cdr.detectChanges();
  }


  /**
   * Setup answer options along with score column by reading scores from its extensions.
   * @param answerOptions - answerOption array as defined in FHIR.
   */
  setAnswerOptions(answerOptions: any []) {
    let changed = false;

    const type = this.formProperty.findRoot().getProperty('type').value;

    // Answer options can now be of different data types. Scoring is only applicable
    // to 'valueCoding' (data type = coding).
    if (type === "coding") {
      answerOptions?.forEach((option) => {
        if(option.valueCoding) {
          const scoreExt = option.extension?.find((ext) => {
            return ext.url === AnswerOptionComponent.ORDINAL_URI ||
              ext.url === AnswerOptionComponent.ITEM_WEIGHT_URI;
          });
          const score = option.valueCoding.__$score !== undefined ? option.valueCoding.__$score : null;
          const newVal = scoreExt && scoreExt.valueDecimal !== undefined ? scoreExt.valueDecimal : null;
          if(score !== newVal) {
            option.valueCoding.__$score = newVal;
            changed = true;
          }
        }
      });
    }

    if(changed) {
      // This triggers valueChanges event on all observers.
      this.formProperty.setValue(answerOptions, false);
    }
    return changed;
  }



  /**
   * Set up defaults column reading 'initialSelected' flag.
   */
  updateDefaultSelections(answerOptionArray: any []) {
    if(this.rowSelectionType === 'radio') {
      this.selectionRadio = -1;
      answerOptionArray.some((prop, index) => {
        if(prop.initialSelected) {
          this.selectionRadio = index;
        }
        return this.selectionRadio >= 0;
      });
    }
    else if(this.rowSelectionType === 'checkbox') {
      answerOptionArray.forEach((prop, index) => {
        this.selectionCheckbox[index] = !!prop.initialSelected;
      });
    }
  }


  /**
   * Update extensions representing score column.
   *
   * @param options - answerOption objects
   */
  updateScoreExtensions(options) {
    let changed = false;
    options?.forEach((option) => {
      const i = option.extension?.findIndex((ext) => {
        return ext.url === AnswerOptionComponent.ORDINAL_URI ||
          ext.url === AnswerOptionComponent.ITEM_WEIGHT_URI;
      });
      const valueDecimal = i >= 0 ? option.extension[i].valueDecimal : null;
      const score = option.valueCoding?.__$score !== undefined ? option.valueCoding?.__$score : null;
      let updated = false;
      if(valueDecimal !== score) {
        const isAdd = score !== null; // True is add, false is remove.
        if(isAdd && i < 0) {
          const scoreExt = {url: AnswerOptionComponent.ITEM_WEIGHT_URI, valueDecimal: score};
          option.extension = option.extension || [];
          option.extension.push(scoreExt);
          updated = true;
        }
        else if(isAdd && i >= 0) {
          option.extension[i].valueDecimal = score;
          updated = true;
        }
        else if(i >= 0) {
          option.extension.splice(i, 1);
          updated = true;
        }
      }
      if(updated) {
        changed = true;
      }
    });
    return changed;
  }

  /**
   * Override method.
   * Handle user input for radio selection. Set initial form property value.
   */
  radioSelection(event) {
    this.selectionRadio = event;
    this.updateWithRadioSelection();
  }


  /**
   * Update model with radio button changes for answerOption[x].initialSelected.
   */
  updateWithRadioSelection() {
    const currentValue = this.formProperty.value;
    let updated = false;
    currentValue?.forEach((option, index) => {
      if(index === this.selectionRadio) {
        if(!option.initialSelected) {
          option.initialSelected = true;
          updated = true;
        }
      }
      else if(option.initialSelected) {
        delete option.initialSelected;
        updated = true;
      }
    });

    if(updated) {
      this.formProperty.updateValueAndValidity();
    }
  }

  /**
   * Update model with checkbox selection for answerOption[x].initialSelected
   */
  updateWithCheckboxSelections() {
    const currentValue = this.formProperty.value;
    let updated = false;
    currentValue?.forEach((option, index) => {
      if(this.selectionCheckbox[index]) {
        if(!option.initialSelected) {
          option.initialSelected = true;
          updated = true;
        }
      }
      else if(option.initialSelected) {
        delete option.initialSelected;
        updated = true;
      }
    });

    if(updated) {
      this.formProperty.updateValueAndValidity();
    }
  }

  /**
   * Override method.
   * Handle user input for checkboxes selection. Set initial form property value.
   */
  checkboxSelection(event) {
    this.updateWithCheckboxSelections();
  }

  /**
   * Clear all selections for the 'Answer Option' checkbox and radio options.
   */
  clearSelections() {
    this.selectionRadio = -1;
    this.updateWithRadioSelection();
    this.selectionCheckbox = [];
    this.updateWithCheckboxSelections();
  }

  /**
   * Overriding parent method.
   * Remove a given item, i.e. a row in the table.
   *
   * Before calling parent class api to remove the item, we need to do some housekeeping with respect to table's
   * selection (radio/checkbox) indexes.
   *
   * @param index - Index of the formProperty to be removed from the array.
   */
  removeProperty(index: number) {
    const actionResult = this.answerOptionService.validateAnswerOptionAction(this.formProperty, index, 'delete');
    if (!actionResult.valid) {
      const modalRef = this.dialogService.showDialog(MessageType.WARNING, 'Option referenced by other item\'s text and linkId.', actionResult.message, this.buttons);
      modalRef.closed.subscribe(result => {
        if (result === 'continue') {
          // Optionally re-focus the select element
          setTimeout(() => {
            super.removeProperty(index);
          }, 0);
          // Collect all referenced TreeNodes and validate them in batch
          const refs = Array.isArray(actionResult.enableWhenReference)
            ? actionResult.enableWhenReference
            : [actionResult.enableWhenReference];
          const nodes = refs
            .map(ref => ref && ref.enableWhenItemLinkId ? this.formService.getTreeNodeByLinkId(ref.enableWhenItemLinkId) : null)
            .filter((node): node is TreeNode => !!node);
          if (nodes.length > 0) {
            this.validationService.validateAllItems(nodes, 0, true, '/enableWhen');
          }
          this.cdr.detectChanges();
        } else {
          setTimeout(() => {
            this.isDialogOpen = false;
          }, 300);
        }
      });
    } else {
      super.removeProperty(index);
    }
  }

  /**
   * Handles the edit action for an answer option at the specified index.
   * Checks if the option is referenced by another item's enableWhen condition and, if so,
   * displays a warning dialog to prevent unintended modifications. If not referenced,
   * proceeds with the edit logic (to be implemented as needed).
   *
   * @param event - The DOM event triggered by the edit action.
   * @param index - The index of the answer option to edit.
   */
  onEdit(event: Event, index: number) {
    if (this.isReordering) {
      return;
    }

    const result = this.answerOptionService.validateAnswerOptionAction(this.formProperty, index, 'modify');
    if (!result.valid) {
      this.hasReferenced = result.enableWhenReference;
      if (!this.isDialogOpen) {
        this.isDialogOpen = true;

        const modalRef = this.dialogService.showDialog(MessageType.WARNING, 'Option referenced by other item\'s text and linkId.', result.message, this.buttonOk);
        if (modalRef && modalRef.closed) {
          modalRef.closed.subscribe(() => {
            setTimeout(() => {
              this.isDialogOpen = false;
            }, 300);
          });

        } else {
          // fallback: reset after a short timeout
          setTimeout(() => this.isDialogOpen = false, 500);
        }
      }
      return;
    }
  }

  /**
   * Checks if the answer option at the specified index is referenced by another item via an enableWhen condition.
   * This is used to determine if the option is involved in conditional logic elsewhere in the form,
   * which may restrict modification or deletion.
   *
   * @param index - The index of the answer option to check.
   * @returns True if the option is referenced by another item's enableWhen; otherwise, false.
   */
  isReferencedByOtherItem(index: number): boolean {
    return this.answerOptionService.isOptionReferenced(this.formProperty, index);
  }
}
