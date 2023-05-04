import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
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
export class AnswerOptionComponent extends TableComponent implements OnInit, OnDestroy {

  static ORDINAL_URI = 'http://hl7.org/fhir/StructureDefinition/ordinalValue';

  subscriptions: Subscription [] = [];
  constructor(private treeService: TreeService, private elementRef: ElementRef, private cdr: ChangeDetectorRef) {
    super(elementRef, cdr);
  }

  /**
   * Initialize
   */
  ngOnInit() {
    super.ngOnInit();
    const repeatProp = this.formProperty.findRoot().getProperty('repeats');
    this.setSelectionType(repeatProp.value);
    let sub = repeatProp.valueChanges.subscribe((isRepeating) => {
      this.setSelectionType(isRepeating);
      this.cdr.markForCheck();
    });
    this.subscriptions.push(sub);
    const aOptions = this.formProperty.value;
    this.setAnswerOptions(aOptions);
    this.formProperty.setValue(aOptions, true);
    sub = this.formProperty.valueChanges.subscribe((answerOptions) => {
      this.updateScoreExtensions(answerOptions);
      this.updateDefaultSelections(answerOptions);
    });
    this.subscriptions.push(sub);
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
   * Setup answer options along with score column by reading scores form properties
   */
  setAnswerOptions(answerOptions: any []) {
    answerOptions?.forEach((option) => {
      if(option.valueCoding) {
        const scoreExt = option.extension?.find(ext => ext.url === AnswerOptionComponent.ORDINAL_URI);
        if(scoreExt) {
          option.valueCoding.__$score = scoreExt.valueDecimal;
        }
      }
    });
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
      ret = coding1.display === coding1.display; // code and display are match
    }

    return ret;
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
   * Update extension form property with user input.
   *
   * @param answerOptions - FHIR item.answerOption array.
   */
  updateScoreExtensions(answerOptions) {
    answerOptions?.forEach((answerOption) => {
      const i = answerOption.extension?.findIndex((ext) => ext.url === AnswerOptionComponent.ORDINAL_URI);
      const score = answerOption.valueCoding?.__$score;
      const isAdd = score !== null && score !== undefined; // True is add, false is remove.
      if(isAdd && i < 0) {
        const scoreExt = {url: AnswerOptionComponent.ORDINAL_URI, valueDecimal: score};
        answerOption.extension = answerOption.extension || [];
        answerOption.extension.push(scoreExt);
      }
      else if(isAdd && i >= 0) {
        answerOption.extension[i].valueDecimal = score;
      }
      else if(i >= 0) {
        answerOption.extension.splice(i, 1);
      }
    });
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
      this.formProperty.forEachChild((opt, name) => {
        const v = opt.value;
        if(this.selectionRadio >= 0) {
          v.initialSelected = true;
        }
        else {
          delete v.initialSelected;
        }
        opt.setValue(v, true);
      });
    }
  }


  /**
   * Override method.
   * Handle user input for checkboxes selection. Set initial form property value.
   */
  checkboxSelection(event) {
    super.checkboxSelection(event);
    /*
    const selectedCodings = [];
    this.selectionCheckbox.forEach((selected, index) => {
      if(selected) {
        const valueCoding = JSON.parse(JSON.stringify(this.formProperty.value[index].valueCoding));
        selectedCodings.push({valueCoding});
      }
    });
    const initialProperty = this.formProperty.searchProperty('/initial') as PropertyGroup;
    initialProperty.setValue(selectedCodings, false);
    // console.log(new AppJsonPipe().transform(this.formProperty.root.value));
*/
    this.selectionCheckbox.forEach((selected, index) => {
      const optProperty = this.formProperty.properties[index];
      const val = optProperty.value;
      if(selected) {
        val.initialSelected = selected;
      } else {
        delete val.initialSelected;
      }
      optProperty.setValue(val, true);
    });

  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
