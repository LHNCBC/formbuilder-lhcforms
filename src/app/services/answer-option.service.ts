import { Injectable } from '@angular/core';
import { FormProperty } from '@lhncbc/ngx-schema-form';
import { Subject } from 'rxjs';
import { Util } from '../lib/util';

export type ValidationResult = {
  valid: boolean;
  message?: string;
  enableWhenReference?: EnableWhenReference
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
  private enableWhenReferenceMap: { [linkId: string]: EnableWhenReference } = {};

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
    this.enableWhenReferenceMap[answerOptionsItemLinkId] = {
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

    if (type === "coding") {
      return linkId in this.enableWhenReferenceMap &&
             Util.areFhirCodingsEqual(this.enableWhenReferenceMap[linkId].enableWhenAnswerValue, answerOptionValue);
    } else {
      return linkId in this.enableWhenReferenceMap &&
             this.enableWhenReferenceMap[linkId].enableWhenAnswerValue === answerOptionValue;
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
    if (this.isOptionReferenced(formProperty, index)) {
      const ref = this.enableWhenReferenceMap[linkId];
      const actionVerb = action === 'delete' ? 'Deleting' : 'Modifying';
      return {
        valid: false,
        message: `This option is referenced by another item, '${ref.enableWhenItemName}' (linkId: ` +
                 `'${ref.enableWhenItemLinkId}'), for conditional display. ${actionVerb} this ` +
                 `option may affect that behavior.`,
        enableWhenReference: ref
      };
    }
    return { valid: true };
  }
}
