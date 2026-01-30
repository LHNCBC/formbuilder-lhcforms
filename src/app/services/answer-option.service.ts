import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Subject } from 'rxjs';
import { FormService } from './form.service';
import { Util } from '../lib/util';
import { FormProperty, ObjectProperty } from '@lhncbc/ngx-schema-form';

type CodeMap<T> = { [code: string]: T };

@Injectable({
  providedIn: 'root'
})
export class AnswerOptionService {
  formService = inject(FormService);

  private radioSelection = new Subject<number>();
  private checkboxSelection = new Subject<boolean[]>();

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

  setRadioSelection(index: number) {
    this.radioSelection.next(index);
  }

  setCheckboxSelection(options: boolean[]) {
    this.checkboxSelection.next(options);
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

          this.codingAnswerOptionsHash = {};
          this.codingAnswerOptionsCodes = [];
          this.codingAnswerOptionsBySystem = {}; // New: index by system

          node.data.answerOption.forEach((obj, index) => {
            const coding = obj[valueName];

            if (coding) {
              // Use code if available, otherwise create a fallback key
              const key = `ansOpt_${index}`;//coding.code ?? `_no_code_${index}`;
              this.codingAnswerOptionsHash[key] = coding;

              // Only add real codes to the codes array
              if (coding.code != null) {
                this.codingAnswerOptionsCodes.push(key); //.push(coding.code);
              }

              // Index by system for better lookup
              if (coding.system) {
                if (!this.codingAnswerOptionsBySystem[coding.system]) {
                  this.codingAnswerOptionsBySystem[coding.system] = [];
                }
                this.codingAnswerOptionsBySystem[coding.system].push(coding);
              }
            }
          });
        }

        this.answerOptions = [...new Set(
          node.data.answerOption
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
            .filter(v => v !== undefined)
        )];
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
    let hashEntry = this.codingAnswerOptionsHash?.[code];
    let display = coding.display;

    // If not found by code, try finding by system match
    if (!display && !hashEntry && coding.system) {
      const systemMatches = this.codingAnswerOptionsBySystem?.[coding.system] || [];

      // Try to find exact match by display or other properties
      hashEntry = systemMatches.find(c =>
        (!code || c.code === code) &&
        (!coding.display || c.display === coding.display)
      );
    }

    // Use hash entry display if available and systems match
    if (!display && hashEntry && hashEntry.system === coding.system) {
      display = hashEntry.display;
    }

    // Format output
    const system = coding.system ?? '';
    const codePart = [code, system].filter(Boolean).join(' : ');
    return [display, codePart && `(${codePart})`].filter(Boolean).join(' ');
  }
}
