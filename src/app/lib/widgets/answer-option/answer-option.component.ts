import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {TableComponent} from '../table/table.component';
import fhir from 'fhir/r4';
import {PropertyGroup} from '@lhncbc/ngx-schema-form/lib/model';
import {TreeService} from '../../../services/tree.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lfb-answer-option',
  templateUrl: '../table/table.component.html',
  styleUrls: ['../table/table.component.css', './answer-option.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnswerOptionComponent extends TableComponent implements AfterViewInit, OnInit, OnDestroy {

  static ORDINAL_URI = 'http://hl7.org/fhir/StructureDefinition/ordinalValue';

  constructor(private treeService: TreeService, private elementRef: ElementRef, private cdr: ChangeDetectorRef) {
    super(elementRef, cdr);
  }

  /**
   * Angular life cycle event - Initialize attributes.
   */
  ngOnInit() {
    super.ngOnInit();
    const repeatProp = this.formProperty.findRoot().getProperty('repeats');
    this.setSelectionType(repeatProp.value);
    const aOptions = this.formProperty.value;
    const initials = this.formProperty.findRoot().getProperty('initial').value;
    this.setDefaultSelections(initials || [], aOptions || []);
    if(this.setAnswerOptions(aOptions)) {
      this.formProperty.setValue(aOptions, true);
    }
  }


  /**
   * Set row selection type, i.e multiple selections or single selection
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
      if(this.updateScoreExtensions(newValue)) {
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.push(sub);
    const repeatProp = this.formProperty.findRoot().getProperty('repeats');
    sub = repeatProp.valueChanges.subscribe((isRepeating) => {
      this.setSelectionType(isRepeating);
      if(isRepeating) {
        this.updateWithCheckboxSelections();
      }
      else {
        this.updateWithRadioSelection();
      }
      this.cdr.markForCheck();
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
        const scoreExt = option.extension?.find(ext => ext.url === AnswerOptionComponent.ORDINAL_URI);
        const score = option.valueCoding.__$score !== undefined ? option.valueCoding.__$score : null;
        const newVal = scoreExt && scoreExt.valueDecimal !== undefined ? scoreExt.valueDecimal : null;
        if(score !== newVal) {
          option.valueCoding.__$score = newVal;
          changed = true;
        }
      }
    });
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


  /**
   * Set up defaults column reading 'initial' form properties.
   */
  setDefaultSelections(initialArray: any [], answerOptionArray: any []) {
    answerOptionArray.forEach((prop, index) => {
      const rowFromInitial = initialArray.find(initial => this.isEqualCoding(initial.valueCoding, prop.valueCoding));
      if(rowFromInitial) {
        if(this.rowSelectionType === 'radio')
          this.selectionRadio = index;
        else if(this.rowSelectionType === 'checkbox')
          this.selectionCheckbox[index] = true;
      }
      if(prop.initialSelected) {
        if(this.rowSelectionType === 'radio') {
          this.selectionRadio = index;
        }
        else if(this.rowSelectionType === 'checkbox') {
          this.selectionCheckbox[index] = true;
        }
      }
    });
    this.radioSelection(null);
  }


  /**
   * Update extensions representing score column.
   *
   * @param options - answerOption objects
   */
  updateScoreExtensions(options) {
    let changed = false;
    options?.forEach((option, index) => {
      const i = option.extension?.findIndex((ext) => ext.url === AnswerOptionComponent.ORDINAL_URI);
      const valueDecimal = i >= 0 ? option.extension[i].valueDecimal : null;
      const score = option.valueCoding?.__$score !== undefined ? option.valueCoding?.__$score : null;
      let updated = false;
      if(valueDecimal !== score) {
        const isAdd = score !== null; // True is add, false is remove.
        if(isAdd && i < 0) {
          const scoreExt = {url: AnswerOptionComponent.ORDINAL_URI, valueDecimal: score};
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
        const extProp = this.formProperty.getProperty(`${index}/extension`);
        extProp.setValue(option.extension, true);
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
    super.radioSelection(event);
    if(this.rowSelectionType === 'radio') {
      if(event !== undefined && event !== null && !Number.isNaN(event)) {
        this.selectionRadio = event;
      }
      if(this.selectionRadio >= 0) {
        this.updateWithRadioSelection();
      }
    }
  }


  /**
   * Update model with radio button changes for answerOption[x].initialSelected.
   */
  updateWithRadioSelection() {
    const currentValue = this.formProperty.value;
    currentValue?.forEach((option, index) => {
      if(index === this.selectionRadio) {
        option.initialSelected = true;
      }
      else {
        delete option.initialSelected;
      }
    });

    this.formProperty.setValue(currentValue, false);
  }

  /**
   * Update model with checkbox selection for answerOption[x].initialSelected
   */
  updateWithCheckboxSelections() {
    const currentValue = this.formProperty.value;
    currentValue?.forEach((option, index) => {
      if(this.selectionCheckbox[index]) {
        option.initialSelected = true;
      }
      else {
        delete option.initialSelected;
      }
    });

    this.formProperty.setValue(currentValue, false);
  }

  /**
   * Override method.
   * Handle user input for checkboxes selection. Set initial form property value.
   */
  checkboxSelection(event) {
    super.checkboxSelection(event);
    this.updateWithCheckboxSelections();
  }
}
