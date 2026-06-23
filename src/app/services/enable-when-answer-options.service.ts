import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { FormProperty } from '@lhncbc/ngx-schema-form';
import { AnswerOptionService, EnableWhenAnswerOptionsState } from './answer-option.service';

declare var LForms: any;

@Injectable()
export class EnableWhenAnswerOptionsService {
  hasAnswerOptions$: Observable<boolean>;

  private formProperty!: FormProperty;
  private initialized = false;
  private enableWhenAnswerProperty: RegExpMatchArray | null = null;
  private subscriptions: Subscription[] = [];
  private autoComp: any;
  private answerOptionsState!: EnableWhenAnswerOptionsState;
  private hasAnswerOptionsSubject = new BehaviorSubject<boolean>(false);
  private sourceQuestionSubscription: Subscription | null = null;
  private sourceQuestionProperty: any;

  enableWhenAutocompleteOptions: any = {
    matchListValue: true,
    maxSelect: 1,
    suggestionMode: LForms.Def.Autocompleter.USE_STATISTICS,
    showLoadingIndicator: false,
    autocomp: true
  };

  constructor(private answerOptionService: AnswerOptionService) {
    this.hasAnswerOptions$ = this.hasAnswerOptionsSubject.asObservable();
  }

  /**
   * Initializes enableWhen answer-option state for a widget instance.
   *
   * @param formProperty - Form property for an enableWhen answer[x] field.
   * @param control - Angular control backing the visible input.
   */
  init(formProperty: FormProperty, control: any): void {
    this.destroyAutocomplete();
    this.formProperty = formProperty;
    const canonicalPath = (this.formProperty as any).__canonicalPathNotation || '';
    this.enableWhenAnswerProperty = canonicalPath.match(/^enableWhen\.(\d+)\.answer(\w+).*$/);

    if (!this.enableWhenAnswerProperty) {
      this.hasAnswerOptionsSubject.next(false);
      return;
    }

    this.refreshState();

    this.subscribeToSourceQuestionChanges();
  }

  /**
   * Refreshes enableWhen answer-option state and resets autocomplete so it can rebind with latest options.
   */
  private refreshState(): void {
    this.answerOptionsState = this.answerOptionService.getEnableWhenAnswerOptionsState(this.formProperty);
    this.hasAnswerOptionsSubject.next(this.answerOptionsState.hasAnswerOptions);
    this.destroyAutocomplete();
  }

  /**
   * Subscribes to source question changes for this enableWhen answer field.
   */
  private subscribeToSourceQuestionChanges(): void {
    const questionProperty = this.formProperty?.parent?.getProperty?.('question');

    if (this.sourceQuestionProperty === questionProperty && this.sourceQuestionSubscription) {
      return;
    }

    this.sourceQuestionSubscription?.unsubscribe();
    this.sourceQuestionProperty = questionProperty;

    if (questionProperty?.valueChanges?.subscribe) {
      const sourceQuestionSub: Subscription = questionProperty.valueChanges.subscribe(() => {
        if (!this.enableWhenAnswerProperty) {
          return;
        }
        this.refreshState();
      });
      this.sourceQuestionSubscription = sourceQuestionSub;
      this.subscriptions.push(sourceQuestionSub);
    }
  }

  /**
   * Creates and attaches the LForms autocomplete widget once the input element exists.
   *
   * @param input - ElementRef for the answer input.
   * @param id - Fallback input id used when the element id is not available.
   */
  initAutocomplete(input: ElementRef, id: string): void {
    if (!this.enableWhenAnswerProperty || this.initialized) {
      return;
    }

    const answerOptions = this.answerOptionsState?.answerOptions;
    if (!answerOptions?.length) {
      return;
    }

    const inputEl = input?.nativeElement;
    const inputId = inputEl?.id || id;
    if (!inputEl || !inputId || inputId === '"' || inputId.trim() === '') {
      return;
    }

    this.initialized = true;
    this.enableWhenAutocompleteOptions.matchListValue = this.answerOptionsState.answerConstraint === 'optionsOnly';

    if (this.answerOptionsState.answerOptionType === 'coding') {
      this.enableWhenAutocompleteOptions.codes = this.answerOptionsState.codingAnswerOptionsCodes;
      this.autoComp = new LForms.Def.Autocompleter.Prefetch(inputId, answerOptions, this.enableWhenAutocompleteOptions);

      if (this.formProperty.value && typeof this.formProperty.value === 'object') {
        this.autoComp.setFieldVal(
          this.answerOptionService.getEnableWhenAutocompleteItemFromCoding(this.formProperty.value, this.answerOptionsState),
          false
        );
      }
    } else {
      this.autoComp = new LForms.Def.Autocompleter.Prefetch(inputId, answerOptions, this.enableWhenAutocompleteOptions);

      if (this.answerOptionsState.answerOptionType === 'integer') {
        this.autoComp.setFieldVal(this.formProperty.value ? String(this.formProperty.value) : '', false);
      } else if (typeof this.formProperty.value !== 'string') {
        this.autoComp.setFieldVal(String(this.formProperty.value), false);
      } else {
        this.autoComp.setFieldVal(this.formProperty.value, false);
      }
    }

    LForms.Def.Autocompleter.Event.observeListSelections(inputId, (data: any) => this.handleListSelection(data));
  }

  /**
   * Synchronizes typed input back to the form property using the referenced answer option type.
   *
   * @param event - Input event from the answer field.
   */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    setTimeout(() => {
      if (this.answerOptionsState?.answerOptionType === 'integer') {
        const intValue = Number(input.value);
        this.formProperty.setValue(Number.isInteger(intValue) ? intValue : '', true);
      } else if (this.answerOptionsState?.answerOptionType === 'coding') {
        return;
      } else {
        this.formProperty.setValue(input.value, true);
      }
      this.formProperty.updateValueAndValidity(false, true);
    }, 0);
  }

  /**
   * Clears invalid values when the input or its containing enableWhen row is marked invalid.
   *
   * @param event - Blur event from the answer input.
   */
  suppressInvalidValue(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.classList.contains('ng-invalid')) {
      this.formProperty.setValue(null, false);
    } else if (this.findParentTdWithInvalid(inputEl)) {
      inputEl.value = '';
      this.formProperty.setValue(this.answerOptionsState?.answerOptionType === 'coding' ? null : '', false);
    }
  }

  /**
   * Checks whether an input is inside a table cell marked invalid.
   *
   * @param inputEl - Input element where the blur event originated.
   * @returns True if the nearest parent table cell has the invalid marker class.
   */
  findParentTdWithInvalid(inputEl: HTMLElement): boolean {
    let el: HTMLElement | null = inputEl;
    while (el && el.tagName !== 'TD') {
      el = el.parentElement;
    }
    return !!el && el.classList.contains('invalid');
  }

  /**
   * Converts typed or selected autocomplete data into a FHIR Coding value.
   *
   * @param data - Raw input text or LForms autocomplete selection data.
   * @returns A Coding-like object, or null when a coding cannot be resolved.
   */
  parseCoding(data: any): { system: string | null; display: string; code: string | null } | null {
    if (typeof data === 'string') {
      const selectedCoding = this.getCodingFromAutocompleteValue(data);
      if (selectedCoding) {
        return selectedCoding;
      }

      return {
        system: null,
        display: data,
        code: null
      };
    }

    if (data.on_list) {
      const selectedCoding = this.getCodingFromAutocompleteValue(data.final_val);
      if (selectedCoding) {
        return selectedCoding;
      }

      const idx = data.list.indexOf(data.final_val);
      if (idx > -1) {
        const keyName = `ansOpt_${idx}`;
        if (keyName in this.answerOptionsState.codingAnswerOptionsHash) {
          return this.answerOptionsState.codingAnswerOptionsHash[keyName];
        }
      }
    } else {
      return {
        system: null,
        display: data.final_val,
        code: null
      };
    }

    return null;
  }

  /**
   * Destroys the LForms autocomplete widget.
   *
   */
  destroyAutocomplete(): void {
    if (this.autoComp) {
      this.autoComp.setFieldVal('', false);
      this.autoComp.destroy();
      this.autoComp = null;
    }

    this.initialized = false;
  }

  /**
   * Destroys the LForms autocomplete widget and unsubscribes from control changes.
   *
   */
  destroy(): void {
    this.destroyAutocomplete();
    this.hasAnswerOptionsSubject.next(false);
    this.sourceQuestionSubscription = null;
    this.sourceQuestionProperty = null;

    this.subscriptions.forEach((s) => s?.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Handles LForms autocomplete selection events and writes the selected value to the form property.
   *
   * @param data - LForms autocomplete selection payload.
   */
  private handleListSelection(data: any): void {
    if (!data || typeof data.final_val !== 'string' || !this.formProperty || this.formProperty.value === data) {
      return;
    }

    if (this.answerOptionsState.answerOptionType === 'coding') {
      const code = this.autoComp.getItemCode(data.final_val);
      const selectedCoding = this.answerOptionsState.codingAnswerOptionsHash[code] ||
        this.getCodingFromAutocompleteValue(data.final_val);
      if (selectedCoding) {
        this.formProperty.setValue(selectedCoding, false);
        this.autoComp.setFieldVal(data.final_val, false);
        this.formProperty.updateValueAndValidity(false, true);
        return;
      }

      const newCoding = this.parseCoding(data);
      if (newCoding?.code && newCoding.code in this.answerOptionsState.codingAnswerOptionsHash &&
        this.answerOptionsState.codingAnswerOptionsHash[newCoding.code].display === newCoding.display) {
        this.formProperty.setValue(this.answerOptionsState.codingAnswerOptionsHash[newCoding.code], false);
      } else {
        this.formProperty.setValue(newCoding, false);
      }

      this.autoComp.setFieldVal(newCoding
        ? this.answerOptionService.getEnableWhenAutocompleteItemFromCoding(newCoding, this.answerOptionsState)
        : data.final_val, false);
    } else {
      this.formProperty.setValue(data.final_val, false);

      if (this.answerOptionsState.answerOptionType === 'integer' && data.final_val !== this.formProperty.value) {
        this.autoComp.setFieldVal(this.formProperty.value ? String(this.formProperty.value) : '', false);
      }
    }

    this.formProperty.updateValueAndValidity(false, true);
  }

  /**
   * Resolves autocomplete display text back to the original answerOption Coding.
   *
   * @param value - Display text returned by LForms autocomplete.
   * @returns Matching Coding from answer options, or undefined when no option matches.
   */
  private getCodingFromAutocompleteValue(value: string): any {
    return this.answerOptionsState?.codingAnswerOptionsByAutocompleteItem?.[value];
  }
}
