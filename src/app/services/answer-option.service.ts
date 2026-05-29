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

export interface EnableWhenAnswerOptionsState {
  hasAnswerOptions: boolean;
  answerOptionItemLinkId?: string;
  answerOptionType: string;
  answerOptions: any[];
  answerConstraint: string;
  codingAnswerOptionsHash: { [code: string]: any };
  codingAnswerOptionsCodes: any[];
  codingAnswerOptionsBySystem: { [system: string]: any[] };
  codingAnswerOptionsByAutocompleteItem: { [display: string]: any };
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
  codingAnswerOptionsBySystem: { [system: string]: any } = {};
  answerOptions: any[] = [];
  answerConstraint = "optionsOnly";
  answerOptionItemLinkId;
  answerOptionType = "string";

  radioSelection$ = this.radioSelection.asObservable();
  checkboxSelection$ = this.checkboxSelection.asObservable();

  /**
   * Emits the selected answer option index for radio-style option controls.
   *
   * @param index - Selected answer option index.
   */
  setRadioSelection(index: number) {
    this.radioSelection.next(index);
  }

  /**
   * Emits the selected answer option states for checkbox-style option controls.
   *
   * @param options - Boolean selection states for answer options.
   */
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

  /**
   * Sets the form property used by the legacy hasAnswerOptions$ observable.
   *
   * @param fp - Form property for an enableWhen answer[x] field.
   */
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
      const state = this.getEnableWhenAnswerOptionsState(fp as FormProperty);
      this.applyEnableWhenAnswerOptionsState(state);
      return state.hasAnswerOptions;
    }),
    distinctUntilChanged()
  );

  /**
   * Checks whether an enableWhen answer field references a question with answer options.
   *
   * @param formProperty - Form property for an enableWhen answer[x] field.
   * @returns True when the referenced question has answer options.
   */
  hasAnswerOptions(formProperty: FormProperty): boolean {
    return this.getEnableWhenAnswerOptionsState(formProperty).hasAnswerOptions;
  }

  /**
   * Builds a local answer-option state snapshot for an enableWhen answer field.
   *
   * @param formProperty - Form property for an enableWhen answer[x] field.
   * @returns Answer-option state containing display values and coding lookup maps.
   */
  getEnableWhenAnswerOptionsState(formProperty: FormProperty): EnableWhenAnswerOptionsState {
    const state: EnableWhenAnswerOptionsState = {
      hasAnswerOptions: false,
      answerOptionType: 'string',
      answerOptions: [],
      answerConstraint: 'optionsOnly',
      codingAnswerOptionsHash: {},
      codingAnswerOptionsCodes: [],
      codingAnswerOptionsBySystem: {},
      codingAnswerOptionsByAutocompleteItem: {}
    };

    const canonicalPath = (formProperty as any)?.__canonicalPathNotation || '';
    const match = canonicalPath.match(/^enableWhen\.(\d+)\.answer(\w+).*$/);

    if (!match || !formProperty?.parent) {
      return state;
    }

    state.answerOptionItemLinkId = formProperty.parent.getProperty('question').value;
    const node = this.formService.getTreeNodeByLinkId(state.answerOptionItemLinkId);
    if (!node?.data) {
      return state;
    }

    state.answerOptionType = this.getAnswerOptionType(node.data.type);
    const valueName = Util.getValueFieldName(state.answerOptionType);
    state.hasAnswerOptions = Array.isArray(node.data.answerOption);

    if (!state.hasAnswerOptions) {
      return state;
    }

    if (valueName === 'valueCoding') {
      node.data.answerOption.forEach((obj, index) => {
        const coding = obj[valueName];

        if (coding) {
          const key = `ansOpt_${index}`;
          state.codingAnswerOptionsHash[key] = coding;

          if (coding.code != null) {
            state.codingAnswerOptionsCodes.push(key);
          }

          if (coding.system) {
            if (!state.codingAnswerOptionsBySystem[coding.system]) {
              state.codingAnswerOptionsBySystem[coding.system] = [];
            }
            state.codingAnswerOptionsBySystem[coding.system].push(coding);
          }

          const autocompleteItem = this.getEnableWhenAutocompleteItemFromCoding(coding, state);
          state.codingAnswerOptionsByAutocompleteItem[autocompleteItem] = coding;
          if (coding.display) {
            state.codingAnswerOptionsByAutocompleteItem[coding.display] = coding;
          }
        }
      });
    }

    const answerOptions = node.data.answerOption
      .map(ao => ao[valueName])
      .filter(v => v !== null && v !== undefined)
      .map(v => {
        if (typeof v === 'string') {
          return v;
        }
        if (typeof v === 'number') {
          return String(v);
        }
        if (typeof v === 'object' && valueName === 'valueCoding') {
          return this.getEnableWhenAutocompleteItemFromCoding(v, state);
        }
        return undefined;
      })
      .filter(v => v !== undefined);

    state.answerOptions = [...new Set(answerOptions)];

    if ('answerConstraint' in node.data) {
      state.answerConstraint = node.data.answerConstraint;
    }

    return state;
  }

  /**
   * Applies a local enableWhen answer-options state to the service's legacy public fields.
   *
   * @param state - Answer-option state to expose through the service fields.
   */
  private applyEnableWhenAnswerOptionsState(state: EnableWhenAnswerOptionsState): void {
    this.answerOptionItemLinkId = state.answerOptionItemLinkId;
    this.answerOptionType = state.answerOptionType;
    this.answerOptions = state.answerOptions;
    this.answerConstraint = state.answerConstraint;
    this.codingAnswerOptionsHash = state.codingAnswerOptionsHash;
    this.codingAnswerOptionsCodes = state.codingAnswerOptionsCodes;
    this.codingAnswerOptionsBySystem = state.codingAnswerOptionsBySystem;
  }

  /**
   * Normalizes questionnaire item types to the answer option value type used by answerOption.
   *
   * @param itemType - Questionnaire item type from the referenced enableWhen question.
   * @returns The type used to resolve value[x] and answer[x] fields.
   */
  private getAnswerOptionType(itemType: string): string {
    return itemType === 'choice' || itemType === 'open-choice' ? 'coding' : itemType;
  }

  /**
   * Returns the enableWhen answer coding label used by the autocomplete UI.
   * If both display and code are present, returns "display (code)".
   * If only display is present, returns display.
   * If only code is present, returns "(code)".
   * If display is missing, attempts to look up the display value from the codingAnswerOptionsHash
   * using the code and matching system.
   *
   * @param coding - The coding object containing code, display, and system.
   * @param state - Optional answer-options state used for display lookup.
   * @returns A formatted string that includes system when available.
   */
  getEnableWhenAutocompleteItemFromCoding(coding: any, state?: EnableWhenAnswerOptionsState): string {
    const code = coding.code ?? '';
    const system = coding.system ?? '';
    const display = coding.display || this.findEnableWhenAnswerOptionDisplay(coding, state);

    const codePart = [code, system].filter(Boolean).join(' : ');
    return [display, codePart && `(${codePart})`].filter(Boolean).join(' ');
  }

  /**
   * Finds display text for an enableWhen answer coding from the referenced question's answer options.
   *
   * @param coding - The enableWhen answer coding being displayed.
   * @param state - Answer-options state for the referenced enableWhen question.
   * @returns Matching answerOption display text, or undefined when no safe match exists.
   */
  private findEnableWhenAnswerOptionDisplay(coding: any, state?: EnableWhenAnswerOptionsState): string | undefined {
    const answerOptionCodings = Object.values(state?.codingAnswerOptionsHash || {});
    const matches = answerOptionCodings.filter((answerOptionCoding) => {
      if (!answerOptionCoding?.display) {
        return false;
      }

      const sameCode = coding.code && answerOptionCoding.code === coding.code;
      const sameSystem = coding.system && answerOptionCoding.system === coding.system;

      if (coding.code && coding.system) {
        return sameCode && sameSystem;
      }

      return sameCode;
    });

    return matches.length === 1 ? matches[0].display : undefined;
  }
}
