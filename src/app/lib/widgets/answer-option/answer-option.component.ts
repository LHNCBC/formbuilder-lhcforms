import {AfterViewInit, Component, DoCheck, OnDestroy, OnInit} from '@angular/core';
import {TableComponent} from '../table/table.component';
import {Util} from '../../util';
import {ArrayProperty, FormProperty, ObjectProperty} from 'ngx-schema-form';
import {fhir} from '../../../fhir';
import {PropertyGroup} from 'ngx-schema-form/lib/model';
import {A} from '@angular/cdk/keycodes';
import {timeout} from 'rxjs/operators';
import {AppJsonPipe} from '../../pipes/app-json.pipe';
import {TreeService} from '../../../services/tree.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lfb-answer-option',
  templateUrl: '../table/table.component.html',
  styleUrls: ['../table/table.component.css', './answer-option.component.css']
})
export class AnswerOptionComponent extends TableComponent implements AfterViewInit, DoCheck, OnDestroy {

  static ORDINAL_URI = 'http://hl7.org/fhir/StructureDefinition/ordinalValue';

  subscriptions: Subscription [] = [];
  constructor(private treeService: TreeService) {
    super();
  }
  /**
   * Make sure at least one row is present for zero length array?
   */
  ngDoCheck(): void {
    super.ngDoCheck();
  }


  /**
   * Initialize
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub = this.formProperty.valueChanges.subscribe((newValue) => {
      setTimeout(() => {
        this.formProperty.value.forEach((row, index) => {
          if(row.valueCoding) {
            this.updateScoreExtensions(row.valueCoding.__$score, index);
          }
        });
      });
    });
    this.subscriptions.push(sub);

    sub = this.treeService.nodeFocus.subscribe((node) => {
      this.updateDefaultSelections();
      this.updateScoreColumnFromFormProperties();
    })

    this.subscriptions.push(sub);
  }


  /**
   * Setup score column by reading scores form properties
   */
  updateScoreColumnFromFormProperties() {
    const formProperties = this.formProperty.properties as FormProperty[];
    formProperties.forEach((prop, index) => {
      const row = prop.value;
      if(row && row.extension && row.extension.length > 0) {
        const scoreExt = row.extension.find(ext => ext.url === AnswerOptionComponent.ORDINAL_URI);
        const scoreProp = (prop as ObjectProperty).getProperty('valueCoding/__$score');
        if(scoreExt) {
          scoreProp.setValue(scoreExt.valueDecimal);
        }
        else {
          scoreProp.reset();
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
   * Set up defaults column reading 'initial' form properties.
   */
  updateDefaultSelections() {
    const initialFormProperties = (this.formProperty.searchProperty('/initial') as ArrayProperty).properties as FormProperty [];
    const formProperties = this.formProperty.properties as FormProperty[];
    formProperties.forEach((prop, index) => {
      const row = prop.value;
      const rowFromInitial = initialFormProperties
        .find(initial => initial.value && this.isEqualCoding(initial.value.valueCoding, row.valueCoding));
      if(rowFromInitial) {
        if(this.rowSelectionType === 'radio')
          this.selectionRadio = index;
        else if(this.rowSelectionType === 'checkbox')
          this.selectionCheckbox[index] = true;
      }
    });
  }


  /**
   * Update extension form property with user input.
   *
   * @param score - Score from widget
   * @param index - Index of the row
   */
  updateScoreExtensions(score, index) {
      const answerOptionExtProperties = this.formProperty.properties[index].getProperty('extension');
      const answerOptionExtensions = answerOptionExtProperties.value;
      const i = answerOptionExtensions.findIndex((ext) => ext.url === AnswerOptionComponent.ORDINAL_URI);
      const isAdd = score !== null && score !== undefined; // True is add, false is remove.
      if(isAdd && i < 0) {
        const scoreExt = {url: AnswerOptionComponent.ORDINAL_URI, valueDecimal: score};
        answerOptionExtensions.push(scoreExt);
      }
      else if(isAdd && i >= 0) {
        answerOptionExtensions[i].valueDecimal = score;
      }
      else if(i >= 0) {
        answerOptionExtensions.removeExtension(answerOptionExtensions[i]);
      }
      answerOptionExtProperties.reset(answerOptionExtensions, true);
  }


  /**
   * Override method.
   * Handle user input for radio selection. Set initial form property value.
   */
  radioSelection(event) {
    super.radioSelection(event);
    if(this.rowSelectionType === 'radio') {
      if(this.selectionRadio >= 0) {
        const initialProperty = this.formProperty.searchProperty('/initial') as PropertyGroup;
        const valueCoding = JSON.parse(JSON.stringify(this.formProperty.value[this.selectionRadio].valueCoding));
        initialProperty.setValue([{valueCoding}], false);
      }
    }
  }


  /**
   * Override method.
   * Handle user input for checkboxes selection. Set initial form property value.
   */
  checkboxSelection(event) {
    super.checkboxSelection(event);
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
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
