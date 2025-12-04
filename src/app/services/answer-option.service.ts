import { Injectable } from '@angular/core';
import { FormProperty } from '@lhncbc/ngx-schema-form';
import { Subject } from 'rxjs';
import { Util } from '../lib/util';

export type ValidationResult = {
  valid: boolean;
  message?: string;
  enableWhenReference?: EnableWhenReference | EnableWhenReference[];
};

export interface EnableWhenReference {
  answerOptionsItemLinkId: string;
  enableWhenItemLinkId: string;
  enableWhenItemName: string;
  enableWhenAnswerValue: any;
}

@Injectable({
  providedIn: 'root'
})
export class AnswerOptionService {
  private radioSelection = new Subject<number>();
  private checkboxSelection = new Subject<boolean[]>();
  private enableWhenReferenceMap: {
    [answerOptionsItemLinkId: string]: {
      [enableWhenItemLinkId: string]: EnableWhenReference
    }
  } = {};

  radioSelection$ = this.radioSelection.asObservable();
  checkboxSelection$ = this.checkboxSelection.asObservable();

  setRadioSelection(index: number) {
    this.radioSelection.next(index);
  }

  setCheckboxSelection(options: boolean[]) {
    this.checkboxSelection.next(options);
  }

  /**
   * Adds a reference indicating that an answer option is referenced by another item's enableWhen condition.
   * Stores the reference details in enableWhenReferenceMap for later validation checks.
   *
   * @param answerOptionsItemLinkId - The linkId of the answer options item being referenced.
   * @param enableWhenItemLinkId - The linkId of the item with the enableWhen condition.
   * @param enableWhenItemName - The display name of the referencing item.
   * @param enableWhenAnswerValue - The value used in the enableWhen condition.
   */
  addEnableWhenReference(answerOptionsItemLinkId: string, enableWhenItemLinkId: string,
                        enableWhenItemName: string, enableWhenAnswerValue: any) {
    if (!this.enableWhenReferenceMap[answerOptionsItemLinkId]) {
      this.enableWhenReferenceMap[answerOptionsItemLinkId] = {};
    }
    this.enableWhenReferenceMap[answerOptionsItemLinkId][enableWhenItemLinkId] = {
      answerOptionsItemLinkId,
      enableWhenItemLinkId,
      enableWhenItemName,
      enableWhenAnswerValue
    };
  }

  /**
   * Checks if the answer option at the given index is referenced by another item's enableWhen condition.
   * For 'coding' types, compares using FHIR coding equality; for other types, compares values directly.
   *
   * @param formProperty - The FormProperty containing the answer options.
   * @param index - The index of the answer option to check.
   * @returns boolean - true if referenced, false otherwise.
   */
  isOptionReferenced(formProperty: FormProperty, index: number): boolean {
    const linkId = formProperty.parent.getProperty('linkId').value;
    const type = formProperty.parent.getProperty('type').value;

    const valueKey = Util.getValueDataTypeName(type);
    const answerOptionValue = formProperty.value[index][valueKey];

    const refsObj = this.enableWhenReferenceMap[linkId];
    if (!refsObj) return false;
    const refs: EnableWhenReference[] = Object.values(refsObj);
    if (type === "coding") {
      return refs.some(ref => Util.areFhirCodingsEqual(ref.enableWhenAnswerValue, answerOptionValue));
    } else {
      return refs.some(ref => ref.enableWhenAnswerValue === answerOptionValue);
    }
  }


  /**
   * Determines if an action (delete or modify) can be performed on an answer option.
   * Checks if the option is referenced by another item's enableWhen condition.
   * Returns a ValidationResult indicating validity and a message if blocked.
   *
   * @param formProperty - The FormProperty containing the answer options.
   * @param index - The index of the answer option to check.
   * @param action - The action to perform ('delete' or 'modify').
   * @returns ValidationResult - valid: true if allowed, false with message if blocked.
   */
  canPerformActionOnOption(formProperty: FormProperty, index: number, action: 'delete' | 'modify'): ValidationResult {
    const linkId = formProperty.parent.getProperty('linkId').value;
    // Get the answerOption object and its value for filtering
    const answerOptions = formProperty.value;
    const answerOption = Array.isArray(answerOptions) ? answerOptions[index] : undefined;
    const dataType = formProperty.parent.getProperty('type').value;
    const valueField = Util.getValueFieldName(dataType);
    const optionValue = answerOption ? answerOption[valueField] : undefined;

    if (this.isOptionReferenced(formProperty, index)) {
      const refsObj = this.enableWhenReferenceMap[linkId];
      let refs: EnableWhenReference[] = refsObj ? Object.values(refsObj) : [];
      // Filter refs to only those referencing the specific answerOption value
      if (dataType === "coding") {
        refs = refs.filter(ref => Util.areFhirCodingsEqual(ref.enableWhenAnswerValue, optionValue));
      } else {
        refs = refs.filter(ref => ref.enableWhenAnswerValue === optionValue);
      }
      const actionVerb = action === 'delete' ? 'Deleting' : 'Modifying';
      let message = '';
      if (refs.length === 1) {
        const ref = refs[0];
        message = `This option is referenced by another item, '${ref.enableWhenItemName}' (linkId: ` +
                  `'${ref.enableWhenItemLinkId}'), for conditional display. ${actionVerb} this ` +
                  `option may affect that behavior.`;
      } else if (refs.length > 1) {
        message = `This option is referenced by multiple items:<br>` +
          refs.map(ref => `&nbsp;&nbsp;&nbsp;&nbsp;&bull; '${ref.enableWhenItemName}' (linkId: '${ref.enableWhenItemLinkId}')`).join('<br>') +
                          `<br>for conditional display. ${actionVerb} this option may affect their behavior.`;
      }
      return {
        valid: false,
        message,
        enableWhenReference: refs
      };
    }
    return { valid: true };
  }
}
