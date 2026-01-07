import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';
import { Observable } from 'rxjs';
import { AnswerOptionService } from 'src/app/services/answer-option.service';
import { Util } from '../../util';

declare var LForms: any;

@Component({
  standalone: false,
  selector: 'lfb-lfb-option-control-widget',
  template: ``,
  styles: [
  ]
})
export class LfbOptionControlWidgetComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy, AfterViewChecked {
  @ViewChild('enableWhenAnswerOptions', { static: false, read: ElementRef }) enableWhenAnswerOptions: ElementRef;

  hasAnswerOptions$!: Observable<boolean>;
  answerOptionService = inject(AnswerOptionService);
  autoComp: any;

  hasAnswerOptions = false;
  private initialized = false;
  enableWhenAnswerProperty;

  enableWhenAutocompleteOptions: any = {
    matchListValue: true,
    maxSelect: 1,
    suggestionMode: LForms.Def.Autocompleter.USE_STATISTICS,
    showLoadingIndicator: false,
    autocomp: true
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.enableWhenAnswerProperty = this.formProperty.__canonicalPathNotation.match(/^enableWhen\.(\d+)\.answer(\w+).*$/);
    if (this.enableWhenAnswerProperty) {

      // Pass the current formProperty to the service
      this.answerOptionService.setFormProperty(this.formProperty);

      // Assign the observable from the service to a component property
      this.hasAnswerOptions$ = this.answerOptionService.hasAnswerOptions$;

      this.hasAnswerOptions$.subscribe({
        next: fp => console.log('map called', fp),
        error: err => console.log('error ', err)
      });

      this.control.setValue(this.formProperty.value);

      this.control.valueChanges.subscribe(val => {

        if (val !== this.formProperty.value) {

          this.formProperty.setValue(val, false); // updates FormProperty automatically
        }
      });
    }

    this.formProperty.errorsChanges.subscribe((errors) => {
      this.errors = null;
      if(errors?.length) {
        const errorsObj = {};
        errors.reduce((acc, error) => {
          if(!acc[error.code]) {
            acc[error.code] = error;
          }

          return acc;
        }, errorsObj);

        this.errors = Object.values(errorsObj)
          .filter((e: any) =>
            !(e.code === 'PATTERN' && this.answerOptionService.answerOptionType === 'time')
          )
          .map((e: any) => {
          let ret = {code: e.code, originalMessage: e.message, modifiedMessage: null};

            if(!e.params[1]?.trim() && this.schema.widget.showEmptyError) {
              // If the error is caused by an empty value, use a generic message.
              ret.code = 'EMPTY_ERROR';
              ret.modifiedMessage = 'This field is required.';
            } else {

              const modifiedMessage = e.code === 'PATTERN'
                ? this.getModifiedErrorForPatternMismatch(e.params[0])
                : this.modifiedMessages[e.code];
              ret.code = e.code;
              ret.originalMessage = e.message;
              ret.modifiedMessage = modifiedMessage;
            }
            return ret;
        });
      }
    });
  }

  ngAfterViewChecked() {
    if (this.enableWhenAnswerProperty && !this.initialized) {
      this.initialized = true;
      // Guard: ensure input element and id are valid before initializing autocomplete
      const answerOptions = this.answerOptionService.answerOptions;
      if (answerOptions && answerOptions.length > 0) {
        const inputEl = this.enableWhenAnswerOptions?.nativeElement;
        const inputId = inputEl?.id || this.id;
        if (!inputEl || !inputId || inputId === '"' || inputId.trim() === '') {
          return;
        }
        this.enableWhenAutocompleteOptions['matchListValue'] = (this.answerOptionService.answerConstraint === "optionsOnly");

        if (this.answerOptionService.answerOptionType === "coding") {
          // matching codes to the display for autocomplete
          this.enableWhenAutocompleteOptions['codes'] = this.answerOptionService.codingAnswerOptionsCodes;

          this.autoComp = new LForms.Def.Autocompleter.Prefetch(
            inputId,
            answerOptions,
            this.enableWhenAutocompleteOptions
          );

          if (typeof this.formProperty.value === "object" &&
            Util.hasSystemAndCode(this.formProperty.value)) {
            this.autoComp.setFieldVal(this.answerOptionService.getAutocompleteItemFromCoding(this.formProperty.value), false);
          }
        } else {
          this.autoComp = new LForms.Def.Autocompleter.Prefetch(
            inputId,
            answerOptions,
            this.enableWhenAutocompleteOptions
          );

          if (this.answerOptionService.answerOptionType === "integer") {
            if (this.formProperty.value) {
              this.autoComp.setFieldVal(String(this.formProperty.value), false);
            } else {
              this.autoComp.setFieldVal('', false);
            }

          } else if (typeof this.formProperty.value !== "string") {
            this.autoComp.setFieldVal(String(this.formProperty.value), false);
          } else {
            this.autoComp.setFieldVal(this.formProperty.value, false);
          }
        }


        // Listen for autocomplete selection and update answerOption.valueCoding.system
        LForms.Def.Autocompleter.Event.observeListSelections(inputId, (data) => {
          console.log('observeListSelection ::inputId ', inputId, ' ',  data);
          if (data && typeof data.final_val === 'string') {
            if (this.formProperty && this.formProperty.value !== data) {
              const current = this.formProperty.value || {};

              if (this.answerOptionService.answerOptionType === "coding") {
                const code = this.autoComp.getItemCode(data.final_val);
                if (code) {
                  this.formProperty.setValue(this.answerOptionService.codingAnswerOptionsHash[code], false);
                } else {

                  const newCoding = this.parseCoding(data.final_val);
                  if (newCoding.code) {
                    if (newCoding.code in this.answerOptionService.codingAnswerOptionsHash && this.answerOptionService.codingAnswerOptionsHash[newCoding.code].display === newCoding.display) {
                      this.formProperty.setValue(this.answerOptionService.codingAnswerOptionsHash[newCoding.code], false);
                    } else {
                      this.formProperty.setValue(newCoding, false);
                    }
                  } else {

                    this.formProperty.setValue(newCoding, false);
                  }

                  this.autoComp.setFieldVal(this.answerOptionService.getAutocompleteItemFromCoding(newCoding), false);

                }
              } else {
                this.formProperty.setValue(data.final_val, false);

                if (this.answerOptionService.answerOptionType === "integer") {
                  if (data.final_val !== this.formProperty.value) {
                    if (this.formProperty.value) {
                      this.autoComp.setFieldVal(String(this.formProperty.value), false);
                    } else {
                      this.autoComp.setFieldVal('', false);
                    }
                  }
                }
              }
            }
          }
        });
      }
    }
  }

  /**
   * Parses a coding string into a structured object.
   *
   * - If the input matches the pattern: "Display Text (CODE)",
   *   the text before the parentheses is used as the display value
   *   (first word only), and the text inside the parentheses is used
   *   as the code.
   * - If the input does not match the pattern, the entire value is
   *   used as the display, and a normalized lowercase version
   *   (spaces replaced with underscores) is used as the code.
   *
   * @param value - The input string to parse.
   * @returns A coding object containing system, display, and code,
   *          or null if parsing fails.
   */
  parseCoding(value: string): { system: string;  display: string; code: string } | null {
    const match = value.match(/^(.+?)\s*\(([^)]*)\)/);
    if (!match) {
      return {
        system: null,
        display: value,
        code: value.toLowerCase().replace(/ /g, "_")
      };
    }

    const [, text1, text2] = match;
    return {
      system: null,
      display: text1.trim().split(' ')[0],
      code: text2.trim()
    };
  }


  /**
   * Destroy autocomplete.
   * Make sure to reset value
   */
  destroyAutocomplete() {
    if (this.autoComp) {
      this.autoComp.setFieldVal('', false);
      this.autoComp.destroy();
      this.autoComp = null;
    }
  }

  /**
   * Clean up before destroy.
   * Destroy autocomplete, unsubscribe all subscriptions.
   */
  ngOnDestroy() {
    this.destroyAutocomplete();
    this.subscriptions.forEach((s) => {
      if(s) {
        s.unsubscribe();
      }
    });
  }


  /*** specific to date and time components ***/

  /**
   * Reset formProperty if input box has invalid date format.
   * Intended to be invoked on blur event of an input box.
   * @param event - DOM event
   */
  suppressInvalidValue(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.classList.contains('ng-invalid')) {
      this.formProperty.setValue(null, false);
    } else if (this.findParentTdWithInvalid(inputEl)) {
      inputEl.value = '';
      this.formProperty.setValue('', false);
    }
  }

  /**
   * Handles the input event for the enableWhen date input field.
   * Updates the formProperty value to match the UI input, triggering standard validation.
   * Also triggers custom enableWhen validation after the value is set.
   *
   * @param event - The input event from the date input element.
   */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    setTimeout(() => {
      // Set the formProperty value to match the UI input.
      // This will trigger the standard validation.

      if (this.answerOptionService.answerOptionType === "integer") {
       const intValue = Number(input.value);

        if (Number.isInteger(intValue)) {
          this.formProperty.setValue(intValue, true);
        } else {
          this.formProperty.setValue('', true);
        }
      } else {
        this.formProperty.setValue(input.value, true);
      }
      // Trigger the custom enableWhen validation
      this.formProperty.updateValueAndValidity(false, true);
    }, 0);
  }

  /**
   * Traverses up the DOM tree from the given input element to find the nearest parent <td> element.
   * Checks if that <td> element has the 'invalid' CSS class, indicating a validation error state.
   *
   * @param inputEl - The input element from which to start the search.
   * @returns True if a parent <td> with the 'invalid' class is found, otherwise false.
   */
  findParentTdWithInvalid(inputEl: HTMLElement): boolean {
    let el: HTMLElement | null = inputEl;
    while (el && el.tagName !== 'TD') {
      el = el.parentElement;
    }
    return !!el && el.classList.contains('invalid');
  }

}
