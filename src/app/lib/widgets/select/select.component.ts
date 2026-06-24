/**
 * Customized pull down box.
 */
import {AfterViewInit, Component, ElementRef, inject, Input, OnDestroy, ViewChild} from '@angular/core';
import {faExclamationTriangle, faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import { StringComponent } from '../string/string.component';
import { FormService } from '../../../services/form.service';
import {Util} from '../../util';
import { Subject, Subscription, takeUntil } from 'rxjs';
import {SubjectTypeOption, SubjectTypeService} from '../../../services/subject-type.service';

import {SharedObjectService} from "../../../services/shared-object.service";

declare var LForms: any;

type SelectOption = SubjectTypeOption & {
  enum?: string[],
  description?: string,
  readOnly?: boolean
};

/**
 * A component for a select box with options.
 * It extends the StringComponent to inherit common string handling functionality.
 */

@Component({
  standalone: false,
  selector: 'lfb-select',
  templateUrl: './select.component.html',
  styles: [`
    select.invalid {
      outline:2px solid red;
    }
    #error {
      margin-right: 5px;
    }
    :host ::ng-deep .lfb-autocomp-selected,
    :host ::ng-deep .autocomp_selected {
      position: static !important;
      display: flex !important;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      border: 0;
      padding: 0;
      margin-top: 0;
      overflow: visible;
    }
    :host ::ng-deep .lfb-autocomp-selected:has(li),
    :host ::ng-deep .autocomp_selected:has(li) {
      margin-top: 0.25rem;
    }
    :host ::ng-deep .lfb-autocomp-selected ul,
    :host ::ng-deep .autocomp_selected ul {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin: 0 0 0.25rem 0;
      padding: 0;
    }
    :host ::ng-deep .lfb-autocomp-selected li,
    :host ::ng-deep .autocomp_selected li {
      float: none !important;
      list-style: none;
      margin: 0;
    }
    :host ::ng-deep .lfb-autocomp-selected input,
    :host ::ng-deep .autocomp_selected input {
      width: 100% !important;
      box-sizing: border-box;
    }
    .array-autocomplete-row {
      display: flex;
      gap: 0.25rem;
      align-items: flex-start;
      margin-bottom: 0.25rem;
    }
    .array-reset-btn {
      align-self: flex-start;
      margin-top: 3px;
      white-space: nowrap;
    }
    .array-autocomplete-row:has(.lfb-autocomp-selected li, .autocomp_selected li) .array-reset-btn {
      margin-top: 0.25rem;
    }
  `]
})
export class SelectComponent extends StringComponent implements AfterViewInit, OnDestroy {
  faInfo = faInfoCircle;
  nolabel = false;
  errorIcon = faExclamationTriangle;

  formService = inject(FormService);
  modelService = inject(SharedObjectService);
  subjectTypeService = inject(SubjectTypeService);

  // A mapping for options display string. Typically, the display strings are from schema definition.
  // This map helps to redefine the display string.
  @Input()
  selectOptionsMap: any = {};

  // Options list for the pull down
  allowedOptions: Array<{value: string | null, label: string}> = [];
  // Local filter text used for large multi-select lists.
  arraySearchTerm = '';
  @ViewChild('arrayAutocomplete') arrayAutocomplete!: ElementRef;
  arrayAutoComp: any;
  arrayAutocompleteEventsUnsubscribe: (() => void) | null = null;
  controlValueSub: Subscription | null = null;
  private destroy$ = new Subject<void>();
  arrayAutocompleteOptions = {
    matchListValue: true,
    maxSelect: '*',
    autocomp: true,
    sort: false,
    showListOnFocusIfEmpty: true
  };

  /**
   * Initialize options and autocomplete behavior after the view is rendered.
   */
  ngOnInit(): void {
    super.ngOnInit();
    this.init();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.modelService?.modelInitialized$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.init();
      });
  }

  init() {
    this.selectOptionsMap = this.schema.widget.selectOptionsMap || {};
    const enumValues = this.schema?.enum || [];
    const allowedOptions = enumValues.map((value: string | null) => {
      // If there is a map defined, use the map to get the display string.
      if (value !== null && this.selectOptionsMap?.map && this.selectOptionsMap.map[value]) {
        return this.mapOption(value);
      }
      // If null or empty string, use 'None' as the display string.
      let label = value === null || value === '' ? 'none' : value;
      // Do transformations.
      this.selectOptionsMap?.transform?.forEach((t: any) => {
        switch (t.method) {
          case 'regexReplace': {
            const regex = new RegExp(t.expression, t.flags || '');
            label = label.replace(regex, t.substitution);
            break;
          }
          case 'camelToTitleCase': {
            label = Util.titleFromCamelCase(label);
            break;
          }
          case 'lowerCaseFirstChar': {
            label = Util.lowerFirstChar(label);
            break;
          }
        }
      });
      return {value, label};
    });
    this.allowedOptions = allowedOptions.filter((e) => {
      return this.isIncluded(e.value) && this.isTypeAllowed(e.value);
    });
    if(this.schema.widget.addEmptyOption) {
      this.allowedOptions.unshift({value: null, label: 'None'});
    }

    if (this.schema?.type === 'array' && this.schema?.widget?.autocomplete) {
      this.resetArrayAutocomplete();
    }
  }
  /**
   * Clean up autocomplete resources.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyArrayAutocomplete();
    super.ngOnDestroy();
  }

  /**
   * Recreate the array autocomplete instance using current schema options and control values.
   */
  resetArrayAutocomplete(): void {
    this.destroyArrayAutocomplete();

    const inputEl = this.arrayAutocomplete?.nativeElement;
    const inputId = inputEl?.id;
    const options = this.getDisplayableArrayOptions();
    if (!inputEl || !inputEl.isConnected || !inputId || !options.length) {
      return;
    }

    const displayList = options.map((option) => this.getArrayOptionLabelFromOption(option)).filter((v) => !!v);
    const codeList = options.map((option) => option.enum?.[0]).filter((v) => !!v);
    const acOptions = {
      ...this.arrayAutocompleteOptions,
      ...this.schema?.widget?.autocompleteOptions,
      codes: codeList
    };

    this.arrayAutoComp = new LForms.Def.Autocompleter.Prefetch(inputId, displayList, acOptions);

    const wrapperEl = inputEl.parentElement;
    if (wrapperEl?.classList?.contains('autocomp_selected')) {
      wrapperEl.classList.add('lfb-autocomp-selected');
    }

    this.selectedArrayValues.forEach((value) => {
      const display = this.getArrayOptionLabel(value);
      this.arrayAutoComp.storeSelectedItem(display, value);
      this.arrayAutoComp.addToSelectedArea(display);
    });

    this.bindArrayControlValueChanges();

    this.arrayAutocompleteEventsUnsubscribe = LForms.Def.Autocompleter.Event.observeListSelections(inputId, (data: any) => {
      const code = data?.item_code || this.arrayAutoComp?.getItemCode?.(data?.final_val) || data?.final_val;
      if (!code) {
        return;
      }

      let updated = this.selectedArrayValues.slice();
      if (data?.removed) {
        updated = updated.filter((selected) => selected !== code);
      }
      else if ((data?.used_list || data?.on_list) && updated.indexOf(code) === -1) {
        updated.push(code);
      }
      else {
        return;
      }

      this.control.setValue(updated);
      this.control.markAsDirty();
      this.control.markAsTouched();
    });
  }

  /**
   * Destroy array autocomplete instance and listeners.
   */
  destroyArrayAutocomplete(): void {
    if (this.controlValueSub) {
      this.controlValueSub.unsubscribe();
      this.controlValueSub = null;
    }
    if (this.arrayAutocompleteEventsUnsubscribe) {
      this.arrayAutocompleteEventsUnsubscribe();
      this.arrayAutocompleteEventsUnsubscribe = null;
    }
    if (this.arrayAutoComp) {
      this.arrayAutoComp.setFieldVal('', false);
      this.arrayAutoComp.destroy();
      this.arrayAutoComp = null;
    }
  }

  /**
   * Rebuild selected chips when the form control value changes (e.g., loading an existing Questionnaire).
   */
  bindArrayControlValueChanges(): void {
    if (!this.arrayAutoComp || !this.control) {
      return;
    }
    this.syncSelectedAreaFromControl();
    this.controlValueSub = this.control.valueChanges.subscribe(() => {
      this.syncSelectedAreaFromControl();
    });
  }

  /**
   * Sync autocomplete selected-area chips from current control values.
   */
  syncSelectedAreaFromControl(): void {
    if (!this.arrayAutoComp) {
      return;
    }
    if (this.arrayAutoComp.clearStoredSelection) {
      this.arrayAutoComp.clearStoredSelection();
    }
    this.selectedArrayValues.forEach((value) => {
      const display = this.getArrayOptionLabel(value);
      this.arrayAutoComp.storeSelectedItem(display, value);
      this.arrayAutoComp.addToSelectedArea(display);
    });
  }

  /**
   * Map an option code to a display label, applying schema-level overrides when configured.
   * @param opt - Option code value.
   * @returns Option object used by select rendering.
   */
  mapOption(opt: string): {value: string, label: string} {
    const ret = {value: opt, label: opt};
    if (this.selectOptionsMap.map && this.selectOptionsMap.map[opt]) {
      ret.label = this.selectOptionsMap.map[opt];
    }
    return ret;
  }

  /**
   * Check whether an option should be included based on schema removal rules.
   * @param opt - Option code value.
   * @returns True when the option is allowed to appear.
   */
  isIncluded(opt: string | null): boolean {
    return !(this.selectOptionsMap.remove && this.selectOptionsMap.remove.indexOf(opt) >= 0);
  }

  /**
   * Allows the inclusion of the data type option based on the following conditions:
   *   - If the 'validateType' flag is not set.
   *   - If the 'validateType' flag is set and the option is not equal to 'display'.
   *   - If the 'validateType' flag is set, the option is equal to 'display', and the item does not
   *     have sub-items.
   * @param opt - data type option.
   * @returns True if the data type option should be included in the allowedOptions drop-down list
   */
  isTypeAllowed(opt: string | null): boolean {
    return (!this.selectOptionsMap.validateType ||
            opt !== 'display' ||
            !this.formService.hasSubItems()
           );
  }

  /**
   * Filters array options by code or description for searchable multi-select fields.
   * @returns Filtered oneOf options for array mode.
   */
  get filteredArrayOptions(): SelectOption[] {
    const options = this.getDisplayableArrayOptions();
    const term = (this.arraySearchTerm || '').trim().toLowerCase();
    if (!term) {
      return options;
    }
    return options.filter((option) => {
      const value = (option?.enum?.[0] || '').toLowerCase();
      const description = this.getArrayOptionLabelFromOption(option).toLowerCase();
      return value.indexOf(term) > -1 || description.indexOf(term) > -1;
    });
  }

  /**
   * Returns currently selected values for array-type select fields.
   * @returns Selected code values from the bound form control.
   */
  get selectedArrayValues(): string[] {
    const value = this.control?.value;
    return Array.isArray(value) ? value : [];
  }

  /**
   * Returns display label for the selected code.
   * @param value - Selected code value.
   * @returns Option description when found, otherwise the original code.
   */
  getArrayOptionLabel(value: string): string {
    const option = (this.schema?.items?.oneOf || []).find((opt) => opt?.enum?.[0] === value);
    return option ? this.getArrayOptionLabelFromOption(option) : value;
  }

  /**
   * Return schema array options that should be shown in the current UI.
   * Versioned options with no currently supported version remain in schema metadata,
   * but are hidden from selection until the app supports that FHIR release.
   * @returns Options available for display.
   */
  private getDisplayableArrayOptions(): SelectOption[] {
    return (this.schema?.items?.oneOf || [])
      .filter((option) => this.subjectTypeService.isSubjectTypeOptionDisplayable(option));
  }

  /**
   * Build the display label for an array option from its schema metadata.
   * @param option - Schema option.
   * @returns Display label.
   */
  private getArrayOptionLabelFromOption(option: SelectOption): string {
    return option.versions
      ? this.subjectTypeService.getSubjectTypeOptionLabel(option)
      : option.description || option.enum?.[0] || '';
  }

  /**
   * Remove a selected value from an array-type select control.
   * @param value - Selected code value to remove.
   * @param event - Optional click event used to prevent default button behavior.
   */
  removeSelectedValue(value: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const updated = this.selectedArrayValues.filter((selected) => selected !== value);
    this.control.setValue(updated);
    this.control.markAsDirty();
    this.control.markAsTouched();
  }

  /**
   * Clear all selected values for an array-type select control.
   * @param event - Optional click event used to prevent default button behavior.
   */
  clearAllSelectedValues(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.selectedArrayValues.length) {
      return;
    }
    this.control.setValue([]);
    this.control.markAsDirty();
    this.control.markAsTouched();
    this.arrayAutoComp?.setFieldVal?.('', false);
  }
}
