import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit
} from '@angular/core';
import {TableComponent} from '../table/table.component';
import fhir from 'fhir/r4';
import {TreeService} from '../../../services/tree.service';
import {Subscription} from 'rxjs';
import { FormService } from 'src/app/services/form.service';

@Component({
  standalone: false,
  selector: 'lfb-answer-option',
  templateUrl: '../table/table.component.html',
  styleUrls: ['../table/table.component.css', './answer-option.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnswerOptionComponent extends TableComponent implements AfterViewInit, OnInit, OnDestroy {

  static ORDINAL_URI = 'http://hl7.org/fhir/StructureDefinition/ordinalValue';
  static ITEM_WEIGHT_URI = 'http://hl7.org/fhir/StructureDefinition/itemWeight';

  // Flag to indicate when to update score extensions reading changes in *.valueCoding.__$score.
  initializing = false;

  constructor(private treeService: TreeService,
              private formService: FormService) {
    super();
  }

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
  }


  /**
   * Setup answer options along with score column by reading scores from its extensions.
   * @param answerOptions - answerOption array as defined in FHIR.
   */
  setAnswerOptions(answerOptions: any []) {
    let changed = false;
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
    if(changed) {
      // This triggers valueChanges event on all observers.
      this.formProperty.setValue(answerOptions, false);
    }
    return changed;
  }


  /**
   * Compare two FHIR Coding objects.
   * Matching rules:
   *   1. When only code exists, match code
   *   2. When only display exists, match display
   *   2. When code and system exists, match both
   *   3. When code and display exists, match both
   *   4. When code, display and system exists, match all three.
   * @param coding1 - First coding object
   * @param coding2 - second coding object
   */
/*
  isEqualCoding(coding1: fhir.Coding, coding2: fhir.Coding) {
    if(!coding1 && !coding2) {
      return true; // Match if both are undefined
    }

    if(!coding1 || !coding2) {
       return false; // null vs non-null;
    }

    let ret = false;
    if(coding1.code || coding2.code) {
      ret = coding1.code === coding2.code;
    }
    else if(coding1.display || coding2.display) {
      ret = coding1.display === coding2.display;
    }

    if(ret && (coding1.system || coding2.system)) {
      ret = coding1.system === coding2.system; // code/display and system are match
    }

    if (ret && (coding1.display || coding2.display)) {
      ret = coding1.display === coding2.display; // code and display are match
    }

    return ret;
  }
*/


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
}
