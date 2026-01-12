import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Subject } from 'rxjs';
import { FormProperty, ObjectProperty } from '@lhncbc/ngx-schema-form';
import { FormService } from './form.service';
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

//type CodeMap<T> = { [code: string]: T };

@Injectable({
  providedIn: 'root'
})
export class AnswerOptionService {
  formService = inject(FormService);

  private radioSelection = new Subject<number>();
  private checkboxSelection = new Subject<boolean[]>();
  private enableWhenReferenceMap: {
    [answerOptionsItemLinkId: string]: {
      [enableWhenItemLinkId: string]: EnableWhenReference
    }
  } = {};

  private formProperty$ = new BehaviorSubject<FormProperty | ObjectProperty | null>(null);
  codingAnswerOptionsHash: { [code: string]: any } = {};
  codingAnswerOptionsCodes: any[] = [];
  answerOptions: any[] = [];
  answerConstraint = "optionsOnly";
  answerOptionItemLinkId;
  answerOptionType = "string";

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
   * Validates an answer option to determine if it is referenced by other items’ enableWhen conditions.
   * Returns a ValidationResult containing a warning message if references exist.
   *
   * This function **does not block or allow any actions** (delete/modify); it only reports potential issues.
   * The decision to perform the action is handled elsewhere in the application logic.
   *
   * @param formProperty - The FormProperty containing the answer options.
   * @param index - The index of the answer option to validate.
   * @param action - The action being considered ('delete' or 'modify'), used to tailor the warning message.
   * @returns ValidationResult -
   *   - valid: true if no warnings (option not referenced)
   *   - valid: false if the option is referenced, with a warning message describing potential impact
   */
  validateAnswerOptionAction(formProperty: FormProperty, index: number, action: 'delete' | 'modify'): ValidationResult {
    // Validate formProperty
    if (!formProperty?.parent) {
      return { valid: false, message: 'Invalid form property structure.' };
    }

    const linkId = formProperty.parent.getProperty('linkId').value;
    // Get the answerOption object and its value for filtering
    const answerOptions = formProperty.value;

    if (!answerOptions) {
      return { valid: false, message: 'No answer options found.' };
    }

    if (!Array.isArray(answerOptions)) {
      return { valid: false, message: 'Answer options must be an array.' };
    }

    if (index >= answerOptions.length) {
      return { valid: false, message: 'Answer option not found.' };
    }
    const answerOption = Array.isArray(answerOptions) ? answerOptions[index] : undefined;

    if (!answerOption) {
      return { valid: false, message: 'Answer option not found.' };
    }

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

  setFormProperty(fp: FormProperty) {
    this.formProperty$.next(fp);
  }

  /**
   * Observable that determines if the current enableWhen answer references a question item's answerOption.
   * - Extracts the relevant question node and its answer options based on the canonical path.
   * - Populates answer option properties and coding hash for efficient lookup.
   * - Updates the answer constraint if present.
   * - Emits true if answer options are available for the referenced question, otherwise false.
   *
   * @returns Observable<boolean> indicating the presence of answer options for the enableWhen answer.
   */
  hasAnswerOptions$ = this.formProperty$.pipe(
    map(fp => {
      const match = fp.__canonicalPathNotation.match(/^enableWhen\.(\d+)\.answer(\w+).*$/);

      if (!match || !fp.parent) {
        return false;
      }

      this.answerOptionItemLinkId = fp.parent.getProperty('question').value;
      const node = this.formService.getTreeNodeByLinkId(this.answerOptionItemLinkId);
      this.answerOptionType = node.data.type;
      const valueName = Util.getValueFieldName(this.answerOptionType);

      const hasOptions = ('answerOption' in node.data);

      // Save answerOptions separately (we'll handle below)
      if (hasOptions) {
        if (valueName === "valueCoding") {
          this.codingAnswerOptionsHash = node.data.answerOption.reduce((acc, obj) => {
            acc[obj[valueName].code] = obj[valueName];
            return acc;
          }, {});
          this.codingAnswerOptionsCodes = node.data.answerOption.map(c => c[valueName].code);
        }

        this.answerOptions = node.data.answerOption
          .map(ao => ao[valueName])
          .filter(v => v !== null && v !== undefined)   // remove nulls
          .map(v => {
            if (typeof v === 'string') {
              return v;
            }
            if (typeof v === 'number') {
              return String(v);
            }
            if (typeof v === 'object' && valueName === "valueCoding") {
              return this.getAutocompleteItemFromCoding(v);
            }
            return undefined; // Explicitly return undefined for unsupported types
          })
          .filter(v => v !== undefined); // Remove undefined values
      }

      if (hasOptions && 'answerConstraint' in node.data) {
        this.answerConstraint = node.data.answerConstraint;
      }

      return hasOptions;
    }),
    distinctUntilChanged()
  );

  /**
   * Returns a display string for an answer option coding object.
   * If both display and code are present, returns "display (code)".
   * If only display is present, returns display.
   * If only code is present, returns code.
   * If display is missing, attempts to look up the display value from the codingAnswerOptionsHash
   * using the code and matching system.
   *
   * @param coding - The coding object containing code, display, and system.
   * @returns A formatted string for use in autocomplete UI.
   */
  getAutocompleteItemFromCoding(coding: any): string {
    const code = coding.code ?? '';
    const hashEntry = this.codingAnswerOptionsHash?.[code];
    let display = coding.display;
    if (!display && hashEntry && hashEntry.system === coding.system) {
      display = hashEntry.display;
    }
    if (display && code) return `${display} (${code})`;
    if (display) return display;
    return code;
  }
}
