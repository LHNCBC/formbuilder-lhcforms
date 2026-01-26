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
