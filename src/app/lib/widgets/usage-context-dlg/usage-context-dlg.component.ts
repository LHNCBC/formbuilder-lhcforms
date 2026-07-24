import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import {DialogData} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {UsageContextObjComponent} from '../usage-context-obj/usage-context-obj.component';
import {TableRowDialogBase} from '../table-row-dialog-base/table-row-dialog-base';
import {Util} from '../../util';
import {RawValueStoreService} from '../../../services/raw-value-store.service';

type UsageContextValueKey = 'valueCodeableConcept' | 'valueQuantity' | 'valueRange' | 'valueReference';
type RangeUnitField = 'unit' | 'system' | 'code';

const VALUE_KEYS: UsageContextValueKey[] = [
  'valueCodeableConcept',
  'valueQuantity',
  'valueRange',
  'valueReference'
];
const RANGE_UNIT_FIELDS: RangeUnitField[] = ['unit', 'system', 'code'];
const RANGE_ORDER_ERROR = 'High value must be greater than or equal to low value.';
const RANGE_UNIT_ERROR = 'Low and high unit, system, and code must match.';

/**
 * A dialog component to edit a FHIR UsageContext object.
 */
@Component({
  selector: 'lfb-usage-context-dlg',
  imports: [UsageContextObjComponent, MatDialogTitle, MatDialogContent, MatIconButton, MatDialogActions, MatIconModule, MatTooltip],
  templateUrl: './usage-context-dlg.component.html',
	  styles: [`
	    .close-button {
	      float: right;
	    }
	    .save-button-tooltip-wrapper {
	      display: inline-block;
	    }
	  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsageContextDlgComponent extends TableRowDialogBase<any> implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dlgContent', {static: false, read: ElementRef}) declare dlgContent: ElementRef;
  @ViewChild('dlgContainer', {static: false, read: ElementRef}) declare dlgContainer: ElementRef;
  @ViewChild(UsageContextObjComponent) usageContextObj!: UsageContextObjComponent;

  saveDisabledReason = signal('');
  validationError = signal('');

  private rawValueStore = inject(RawValueStoreService);
  private readonly originalIdentifierRows = new WeakMap<FormProperty, any>();
  // Fail closed until schema-form reports the validity of the initialized model.
  private schemaFormValid = false;

  constructor() {
    super(
      inject<DialogData>(MAT_DIALOG_DATA),
      inject(MatDialogRef<DialogData>),
      inject(MatDialog),
      inject(NgbModal),
      inject(ElementRef),
      inject(ChangeDetectorRef)
    );
  }

  /**
   * Create an empty UsageContext row model for the add-new flow.
   *
   * @returns Empty UsageContext model.
   */
  protected createNewModel(): any {
    return {code: {}};
  }

  /**
   * Ng AfterViewInit lifecycle hook.
   */
  override ngAfterViewInit() {
    // Seed complete Identifier rows before the first change calculation so the
    // parent recomputes its state from committed values, not the stale tree.
    this.seedOriginalIdentifierRows();
    this.updateDisableSave();
    this.cdr.detectChanges();
  }

  /**
   * Normalize the UsageContext value immediately before saving.
   *
   * @param value - Last emitted dialog value.
   * @returns UsageContext with one value[x] and a table summary.
   */
  protected override beforeSave(value: any): any {
    const currentValue = this.usageContextObj?.sfFormRootProperty
      ? this.getCurrentValueForChangeDetection()
      : value;
    return this.prepareValue(currentValue || {});
  }

  /**
   * Use the live form-property tree so nested Identifier edits are included in
   * the dirty check.
   *
   * @returns Current UsageContext value used for change detection.
   */
  protected override getCurrentValueForChangeDetection(): unknown {
    return this.usageContextObj?.sfFormRootProperty
      ? this.getCurrentFormPropertyValue(this.usageContextObj.sfFormRootProperty)
      : this.changedValue;
  }

  /**
   * Handle changes emitted by the UsageContext object form.
   *
   * @param event - Changed UsageContext value.
   */
  override onChange(event: any) {
    this.changedValue = event;
    this.updateDisableSave();
    this.cdr.detectChanges();
  }

  /**
   * Recalculate the save state when schema validation changes.
   *
   * Schema-form emits value changes before completing validation, so this
   * separate event ensures the dialog uses the validity of the latest value.
   *
   * @param valid - True when the complete UsageContext schema form is valid.
   */
  onValidityChange(valid: boolean): void {
    this.schemaFormValid = valid;
    this.updateDisableSave();
    this.cdr.detectChanges();
  }

  /**
   * Build the display summary used by the parent table.
   *
   * @param value - UsageContext value.
   * @returns Summary text for the selected value[x].
   */
  static getValueSummary(value: any): string {
    if(!value) {
      return '';
    }
    const valueKey = VALUE_KEYS.find((key) => !Util.isEmpty(value[key]));
    switch(valueKey) {
      case 'valueCodeableConcept':
        return UsageContextDlgComponent.codeableConceptSummary(value.valueCodeableConcept);
      case 'valueQuantity':
        return UsageContextDlgComponent.quantitySummary(value.valueQuantity);
      case 'valueRange':
        return UsageContextDlgComponent.rangeSummary(value.valueRange);
      case 'valueReference':
        return UsageContextDlgComponent.referenceSummary(value.valueReference);
      default:
        return '';
    }
  }

  /**
   * Normalize UsageContext before returning it to the table.
   *
   * @param value - UsageContext value to save.
   * @returns UsageContext with one value[x] and a table summary.
   */
  prepareValue(value: any): any {
    const nextValue = this.cloneUsageContext(value || {});
    this.unwrapValueReferenceIdentifier(nextValue);
    this.pruneExtraValueChoices(nextValue);
    nextValue.__$valueSummary = UsageContextDlgComponent.getValueSummary(nextValue);
    return nextValue;
  }

  /**
   * Update the save button state based on whether the model changed.
   */
  protected override updateDisableSave(): void {
    const currentValue = this.getCurrentValueForChangeDetection();
    const rangeValidationError = this.getRangeValidationError(currentValue);
    const modelChanged = this.hasModelChanged(currentValue);
    const hasRequiredValue = this.hasRequiredValue(currentValue);
    const hasRequiredCode = this.hasRequiredCode(currentValue);

    this.validationError.set(rangeValidationError);
    this.setInputInvalidStyle(
      'input[id*="valueRange.high.value"]',
      rangeValidationError === RANGE_ORDER_ERROR
    );
    const mismatchedUnitFields = this.getMismatchedRangeUnitFields(currentValue);
    RANGE_UNIT_FIELDS.forEach((field) => {
      this.setInputInvalidStyle(
        `input[id*="valueRange.high.${field}"]`,
        mismatchedUnitFields.includes(field)
      );
    });
    this.saveDisabledReason.set(this.getSaveDisabledReason(
      modelChanged,
      hasRequiredCode,
      hasRequiredValue,
      rangeValidationError,
      this.schemaFormValid
    ));
    this.disableSave.set(
      !modelChanged ||
      !hasRequiredCode ||
      !hasRequiredValue ||
      !this.schemaFormValid ||
      !!rangeValidationError
    );
  }

  /**
   * Check whether the model has one populated UsageContext value[x].
   *
   * @param currentValue - Current UsageContext form value.
   * @returns True when a selected value[x] has non-empty content.
   */
  private hasRequiredValue(currentValue: any): boolean {
    const selectedKey = currentValue?.__$valueType || VALUE_KEYS.find((key) => !Util.isEmpty(currentValue?.[key]));
    if(!selectedKey || Util.isEmpty(currentValue?.[selectedKey])) {
      return false;
    }
    if(selectedKey === 'valueReference') {
      return this.hasReferenceContent(currentValue.valueReference);
    }
    return true;
  }

  /**
   * Check whether a Reference contains content beyond its optional type hint.
   *
   * FHIR Reference requires at least one of reference, identifier, or display;
   * type alone does not identify the target.
   *
   * @param reference - UsageContext valueReference.
   * @returns True when the Reference has identifying or display content.
   */
  private hasReferenceContent(reference: any): boolean {
    return !Util.isEmpty(reference?.reference) ||
      !Util.isEmpty(reference?.identifier) ||
      !Util.isEmpty(reference?.display);
  }

  /**
   * Check whether the required UsageContext Coding object is populated.
   *
   * Coding.code is optional in FHIR, so any meaningful Coding field satisfies
   * this requirement.
   *
   * @param currentValue - Current UsageContext form value.
   * @returns True when the Coding object contains at least one value.
   */
  private hasRequiredCode(currentValue: any): boolean {
    return !Util.isEmpty(currentValue?.code);
  }

  /**
   * Get the validation error for an invalid valueRange.
   *
   * @param currentValue - Current UsageContext form value.
   * @returns Error for reversed bounds or incompatible units, otherwise an empty string.
   */
  private getRangeValidationError(currentValue: any): string {
    const selectedKey = currentValue?.__$valueType || VALUE_KEYS.find((key) => !Util.isEmpty(currentValue?.[key]));
    if(selectedKey !== 'valueRange') {
      return '';
    }

    const low = this.getComparableNumber(currentValue?.valueRange?.low?.value);
    const high = this.getComparableNumber(currentValue?.valueRange?.high?.value);
    if(low !== null && high !== null && high < low) {
      return RANGE_ORDER_ERROR;
    }
    return this.getMismatchedRangeUnitFields(currentValue).length ? RANGE_UNIT_ERROR : '';
  }

  /**
   * Find incompatible unit fields between populated Range bounds.
   *
   * FHIR requires the unit and code/system elements of low and high to match.
   *
   * @param currentValue - Current UsageContext form value.
   * @returns Unit field names whose low and high values differ.
   */
  private getMismatchedRangeUnitFields(currentValue: any): RangeUnitField[] {
    const selectedKey = currentValue?.__$valueType || VALUE_KEYS.find((key) => !Util.isEmpty(currentValue?.[key]));
    const low = currentValue?.valueRange?.low;
    const high = currentValue?.valueRange?.high;
    if(selectedKey !== 'valueRange' || Util.isEmpty(low) || Util.isEmpty(high)) {
      return [];
    }
    return RANGE_UNIT_FIELDS.filter((field) => (low?.[field] ?? '') !== (high?.[field] ?? ''));
  }

  /**
   * Get the tooltip message explaining why Save is disabled.
   *
   * @param modelChanged - True when the model changed.
   * @param hasRequiredCode - True when the required Coding object is populated.
   * @param hasRequiredValue - True when a value[x] is populated.
   * @param validationError - Current validation error message.
   * @param schemaFormValid - True when schema-form validation passes.
   * @returns Tooltip text for the disabled save button.
   */
  private getSaveDisabledReason(
    modelChanged: boolean,
    hasRequiredCode: boolean,
    hasRequiredValue: boolean,
    validationError: string,
    schemaFormValid: boolean
  ): string {
    if(validationError) {
      return validationError;
    }
    if(!hasRequiredCode || !hasRequiredValue) {
      return 'Code and value[x] are required.';
    }
    if(!schemaFormValid) {
      return 'Correct validation errors before saving.';
    }
    return modelChanged ? '' : 'Make changes before saving.';
  }

  /**
   * Convert a range endpoint into a finite number for comparison.
   *
   * @param value - Range endpoint value.
   * @returns Numeric value, or null when the endpoint is empty or not comparable.
   */
  private getComparableNumber(value: unknown): number | null {
    if(value === undefined || value === null || value === '') {
      return null;
    }
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  /**
   * Toggle invalid styling on a dialog input.
   *
   * @param selector - CSS selector for the input.
   * @param invalid - True when the input should be marked invalid.
   */
  private setInputInvalidStyle(selector: string, invalid: boolean): void {
    const input = this.dlgContent?.nativeElement.querySelector(selector);
    if(!input) {
      return;
    }
    input.classList.toggle('invalid', invalid);
    if(invalid) {
      input.setAttribute('aria-invalid', 'true');
    }
    else {
      input.removeAttribute('aria-invalid');
    }
  }

  /**
   * Remove UsageContext value[x] fields that are not selected.
   *
   * @param value - UsageContext value to mutate.
   */
  private pruneExtraValueChoices(value: any): void {
    const selectedKey = value.__$valueType || VALUE_KEYS.find((key) => !Util.isEmpty(value[key]));
    VALUE_KEYS.forEach((key) => {
      if(key !== selectedKey) {
        delete value[key];
      }
    });
    delete value.__$valueType;
  }

  /**
   * Build the current value from a form property tree.
   *
   * Identifier tables are resolved row-by-row so that complete nested Identifier
   * edits are never lost: each row falls back from the raw-value store, to the
   * originally imported row value, and finally to the live property value. This
   * avoids the all-or-nothing behavior that dropped un-seeded rows when the
   * table held a mix of edited and untouched Identifier rows.
   *
   * @param property - Form property to read.
   * @returns Current non-empty property value, or undefined when empty.
   */
  protected override getCurrentFormPropertyValue(property: any): any {
    if(property
        && Array.isArray(property.properties)
        && property.schema?.widget?.id === 'identifier'
        && Array.isArray(property.value)) {
      const value = property.properties
        .map((child: FormProperty) => {
          const rawValue = this.rawValueStore.getIdentifier(child);
          if(!Util.isEmpty(rawValue)) {
            return rawValue;
          }
          const originalRow = this.originalIdentifierRows.get(child);
          if(!Util.isEmpty(originalRow)) {
            return originalRow;
          }
          return super.getCurrentFormPropertyValue(child);
        })
        .map((childValue) => this.cloneUsageContext(childValue))
        .filter((childValue) => !Util.isEmpty(childValue));
      return value.length ? value : undefined;
    }

    return super.getCurrentFormPropertyValue(property);
  }

  /**
   * Deep clone a UsageContext value.
   *
   * @param value - Value to clone.
   * @returns Cloned UsageContext value.
   */
  private cloneUsageContext(value: any): any {
    return JSON.parse(JSON.stringify(value || {}));
  }

  /**
   * Preserve original identifier rows on form properties for nested dialog edits.
   */
  private seedOriginalIdentifierRows(): void {
    const identifierProperty = this.usageContextObj?.sfFormRootProperty?.getProperty?.('valueReference/identifier');
    const identifiers = this.inputModel?.valueReference?.identifier;
    if(!identifierProperty?.properties || !Array.isArray(identifiers)) {
      return;
    }
    identifierProperty.properties.forEach((rowProperty: FormProperty, index: number) => {
      if(!Util.isEmpty(identifiers[index])) {
        this.originalIdentifierRows.set(rowProperty, this.cloneUsageContext(identifiers[index]));
        this.rawValueStore.setIdentifier(rowProperty, identifiers[index]);
      }
    });
  }

  /**
   * Prepare an existing UsageContext value for dialog editing.
   *
   * @param value - UsageContext value from the parent table.
   * @returns Dialog model with selected value type and UI-wrapped identifiers.
   */
  protected override prepareInputModel(value: any): any {
    const model = this.cloneUsageContext(value);
    model.__$valueType = VALUE_KEYS.find((key) => !Util.isEmpty(model[key]));
    this.wrapValueReferenceIdentifier(model);
    return model;
  }

  /**
   * Wrap valueReference.identifier in an array for table editing.
   *
   * @param model - UsageContext dialog model to mutate.
   */
  private wrapValueReferenceIdentifier(model: any): void {
    const identifier = model?.valueReference?.identifier;
    if(identifier && !Array.isArray(identifier)) {
      this.wrapAssignerIdentifierForUi(identifier);
      model.valueReference.identifier = [identifier];
    }
  }

  /**
   * Unwrap valueReference.identifier from table shape back to FHIR object shape.
   *
   * @param model - UsageContext value to mutate before save.
   */
  private unwrapValueReferenceIdentifier(model: any): void {
    const identifier = model?.valueReference?.identifier;
    if(Array.isArray(identifier)) {
      if(identifier.length) {
        model.valueReference.identifier = this.unwrapAssignerIdentifierForFhir(identifier[0]);
      }
      else {
        delete model.valueReference.identifier;
      }
    }
    else if(identifier) {
      this.unwrapAssignerIdentifierForFhir(identifier);
    }
  }

  /**
   * Recursively unwrap assigner.identifier arrays to FHIR object shape.
   *
   * @param identifier - Identifier value to unwrap.
   * @returns Identifier value with nested assigner.identifier objects.
   */
  private unwrapAssignerIdentifierForFhir(identifier: any): any {
    const assignerIdentifier = identifier?.assigner?.identifier;
    if(Array.isArray(assignerIdentifier)) {
      if(assignerIdentifier.length) {
        identifier.assigner.identifier = this.unwrapAssignerIdentifierForFhir(assignerIdentifier[0]);
      }
      else {
        delete identifier.assigner.identifier;
      }
    }
    else if(assignerIdentifier) {
      this.unwrapAssignerIdentifierForFhir(assignerIdentifier);
    }
    return identifier;
  }

  /**
   * Recursively wrap assigner.identifier objects for table editing.
   *
   * @param identifier - Identifier value to wrap.
   * @returns Identifier value with nested assigner.identifier arrays.
   */
  private wrapAssignerIdentifierForUi(identifier: any): any {
    const assignerIdentifier = identifier?.assigner?.identifier;
    if(assignerIdentifier && !Array.isArray(assignerIdentifier)) {
      this.wrapAssignerIdentifierForUi(assignerIdentifier);
      identifier.assigner.identifier = [assignerIdentifier];
    }
    else if(Array.isArray(assignerIdentifier)) {
      assignerIdentifier.forEach((entry) => this.wrapAssignerIdentifierForUi(entry));
    }
    return identifier;
  }

  /**
   * Build a display summary for CodeableConcept.
   *
   * @param value - CodeableConcept value.
   * @returns Human-readable CodeableConcept summary.
   */
  private static codeableConceptSummary(value: any): string {
    if(value?.text) {
      return value.text;
    }
    const coding = value?.coding?.find((entry) => !Util.isEmpty(entry));
    return [coding?.display, coding?.code, coding?.system].filter(Boolean).join(' | ');
  }

  /**
   * Build a display summary for Quantity.
   *
   * @param value - Quantity value.
   * @returns Human-readable Quantity summary.
   */
  private static quantitySummary(value: any): string {
    const amount = [value?.comparator, value?.value].filter((entry) => entry !== undefined && entry !== null && entry !== '').join('');
    return [amount, value?.unit || value?.code, value?.system].filter((entry) => entry !== undefined && entry !== null && entry !== '').join(' ');
  }

  /**
   * Build a display summary for Range.
   *
   * @param value - Range value.
   * @returns Human-readable Range summary.
   */
  private static rangeSummary(value: any): string {
    const low = UsageContextDlgComponent.quantitySummary(value?.low);
    const high = UsageContextDlgComponent.quantitySummary(value?.high);
    return [low, high].filter(Boolean).join(' - ');
  }

  /**
   * Build a display summary for Reference.
   *
   * @param value - Reference value.
   * @returns Human-readable Reference summary.
   */
  private static referenceSummary(value: any): string {
    const referenceSummary = [value?.display, value?.reference, value?.type].filter(Boolean).join(' | ');
    if(referenceSummary) {
      return referenceSummary;
    }

    const identifier = Array.isArray(value?.identifier) ? value.identifier[0] : value?.identifier;
    return UsageContextDlgComponent.identifierSummary(identifier);
  }

  /**
   * Build a display summary for Identifier.
   *
   * @param value - Identifier value.
   * @returns Human-readable Identifier summary.
   */
  private static identifierSummary(value: any): string {
    return [value?.value, value?.system, value?.use].filter(Boolean).join(' | ');
  }
}
