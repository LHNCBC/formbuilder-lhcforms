import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import {MatDialogActions, MatDialogContent, MatDialogTitle} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import {UsageContextObjComponent} from '../usage-context-obj/usage-context-obj.component';
import {TableRowDialogBase} from '../table-row-dialog-base/table-row-dialog-base';
import {Util} from '../../util';
import {RawValueStoreService} from '../../../services/raw-value-store.service';
import type fhir from 'fhir/r4';
import type {
  EditableIdentifier,
  EditableReference,
  UsageContextEditModel,
  UsageContextValueKey
} from '../usage-context/usage-context.types';
import {FHIR_R5_REFERENCE_RESOURCE_TYPES} from '../usage-context/fhir-r5-resource-types';

type RangeUnitField = 'unit' | 'system' | 'code';
type QuantitySystemPath = 'valueQuantity' | 'valueRange.low' | 'valueRange.high';

const VALUE_KEYS: UsageContextValueKey[] = [
  'valueCodeableConcept',
  'valueQuantity',
  'valueRange',
  'valueReference'
];
const RANGE_UNIT_FIELDS: RangeUnitField[] = ['unit', 'system', 'code'];
const QUANTITY_SYSTEM_PATHS: QuantitySystemPath[] = [
  'valueQuantity',
  'valueRange.low',
  'valueRange.high'
];
const RANGE_ORDER_ERROR = 'High value must be greater than or equal to low value.';
const RANGE_UNIT_ERROR = 'Low and high unit, system, and code must match.';
const QUANTITY_SYSTEM_ERROR = 'System is required when Code is provided.';
const LOCAL_REFERENCE_ERROR = 'Local reference must match the id of a contained resource.';
const REFERENCE_TYPE_ERROR = 'Reference type must match the referenced resource type.';
const REFERENCE_RESOURCE_TYPE_ERROR = 'Type must be a valid FHIR R5 resource type.';

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
export class UsageContextDlgComponent extends TableRowDialogBase<UsageContextEditModel> implements OnInit, AfterViewInit {
  @ViewChild('dlgContent', {static: false, read: ElementRef}) declare dlgContent: ElementRef<HTMLElement>;
  @ViewChild('dlgContainer', {static: false, read: ElementRef}) declare dlgContainer: ElementRef<HTMLElement>;
  @ViewChild(UsageContextObjComponent) usageContextObj!: UsageContextObjComponent;

  saveDisabledReason = signal('');
  validationError = signal('');

  private rawValueStore = inject(RawValueStoreService);
  // Fail closed until schema-form reports the validity of the initialized model.
  private schemaFormValid = false;

  /**
   * Create an empty UsageContext row model for the add-new flow.
   *
   * @returns Empty UsageContext model.
   */
  protected createNewModel(): UsageContextEditModel {
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
  protected override beforeSave(value: UsageContextEditModel): UsageContextEditModel {
    const currentValue = this.usageContextObj?.sfFormRootProperty
      ? this.getCurrentValueForChangeDetection()
      : value;
    return this.normalizeValueForSave(currentValue || this.createNewModel());
  }

  /**
   * Use the live form-property tree so nested Identifier edits are included in
   * the dirty check.
   *
   * @returns Current UsageContext value used for change detection.
   */
  protected override getCurrentValueForChangeDetection(): UsageContextEditModel {
    return (this.usageContextObj?.sfFormRootProperty
      ? this.getCurrentFormPropertyValue(this.usageContextObj.sfFormRootProperty)
      : this.changedValue) as UsageContextEditModel;
  }

  /**
   * Handle changes emitted by the UsageContext object form.
   *
   * @param event - Changed UsageContext value.
   */
  override onChange(event: UsageContextEditModel) {
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
  static getValueSummary(value: UsageContextEditModel | null | undefined): string {
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
  private normalizeValueForSave(value: UsageContextEditModel): UsageContextEditModel {
    const nextValue = this.cloneValue(value);
    this.removeRangeComparators(nextValue);
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
    const missingQuantitySystemPaths = this.getMissingQuantitySystemPaths(currentValue);
    const rangeValidationError = this.getRangeValidationError(currentValue);
    const referenceValidationError = this.getReferenceValidationError(currentValue);
    const validationError = missingQuantitySystemPaths.length
      ? QUANTITY_SYSTEM_ERROR
      : rangeValidationError || referenceValidationError;
    const modelChanged = this.hasModelChanged(currentValue);
    const hasRequiredValue = this.hasRequiredValue(currentValue);
    const hasRequiredCode = this.hasRequiredCode(currentValue);

    this.validationError.set(validationError);
    QUANTITY_SYSTEM_PATHS.forEach((path) => {
      this.setInputInvalidStyle(
        `input[id*="${path}.system"]`,
        missingQuantitySystemPaths.includes(path)
      );
    });
    this.setInputInvalidStyle(
      'input[id*="valueRange.high.value"]',
      rangeValidationError === RANGE_ORDER_ERROR
    );
    this.setInputInvalidStyle(
      'input[id*="valueReference.reference"]',
      referenceValidationError === LOCAL_REFERENCE_ERROR || referenceValidationError === REFERENCE_TYPE_ERROR
    );
    this.setInputInvalidStyle(
      'input[id*="valueReference.type"]',
      referenceValidationError === REFERENCE_TYPE_ERROR || referenceValidationError === REFERENCE_RESOURCE_TYPE_ERROR
    );
    const mismatchedUnitFields = missingQuantitySystemPaths.length
      ? []
      : this.getMismatchedRangeUnitFields(currentValue);
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
      validationError,
      this.schemaFormValid
    ));
    this.disableSave.set(
      !modelChanged ||
      !hasRequiredCode ||
      !hasRequiredValue ||
      !this.schemaFormValid ||
      !!validationError
    );
  }

  /**
   * Check whether the model has one populated UsageContext value[x].
   *
   * @param currentValue - Current UsageContext form value.
   * @returns True when a selected value[x] has non-empty content.
   */
  private hasRequiredValue(currentValue: UsageContextEditModel): boolean {
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
   * FHIR Reference requires at least one of reference, identifier, display, or
   * extension; type alone does not identify the target.
   *
   * @param reference - UsageContext valueReference.
   * @returns True when the Reference satisfies the FHIR ref-2 content rule.
   */
  private hasReferenceContent(reference: EditableReference | undefined): boolean {
    return !Util.isEmpty(reference?.reference) ||
      !Util.isEmpty(reference?.identifier) ||
      !Util.isEmpty(reference?.display) ||
      !Util.isEmpty(reference?.extension);
  }

  /**
   * Validate a fragment Reference against the current Questionnaire's contained resources.
   *
   * FHIR ref-1 requires a Reference beginning with "#" to resolve to an id in
   * the root resource's contained collection. When a literal target type can
   * be determined, FHIR also requires Reference.type to agree with it.
   *
   * @param currentValue - Current UsageContext form value.
   * @returns A validation error for an unresolved local reference, otherwise an empty string.
   */
  private getReferenceValidationError(currentValue: UsageContextEditModel): string {
    const selectedKey = currentValue?.__$valueType || VALUE_KEYS.find((key) => !Util.isEmpty(currentValue?.[key]));
    const reference = currentValue?.valueReference;
    if(selectedKey !== 'valueReference') {
      return '';
    }

    const declaredType = reference?.type?.trim();
    const declaredResourceType = this.getDeclaredReferenceResourceType(declaredType);
    if(declaredType && !FHIR_R5_REFERENCE_RESOURCE_TYPES.has(declaredResourceType)) {
      return REFERENCE_RESOURCE_TYPE_ERROR;
    }

    const literalReference = reference?.reference?.trim();
    if(!literalReference) {
      return '';
    }

    let referencedResourceType = '';
    if(literalReference.startsWith('#')) {
      const containedId = literalReference.substring(1);
      const containedResources = this.data?.arrayProperty
        ?.findRoot()
        ?.getProperty('contained')
        ?.value as fhir.Resource[] | undefined;
      const target = containedId
        ? containedResources?.find((resource) => resource?.id === containedId)
        : undefined;
      if(!target) {
        return LOCAL_REFERENCE_ERROR;
      }
      referencedResourceType = target.resourceType;
    }
    else {
      referencedResourceType = this.getLiteralReferenceResourceType(literalReference);
    }

    return declaredResourceType && referencedResourceType && declaredResourceType !== referencedResourceType
      ? REFERENCE_TYPE_ERROR
      : '';
  }

  /**
   * Extract the resource type from a relative FHIR REST reference.
   *
   * An arbitrary absolute URL can resemble a FHIR type/id path without being a
   * FHIR REST endpoint, so its target type must be left to external resolution.
   *
   * @param reference - Literal Reference.reference value.
   * @returns Resource type when a relative reference has a recognizable type/id shape.
   */
  private getLiteralReferenceResourceType(reference: string): string {
    if(/^[a-z][a-z0-9+.-]*:/i.test(reference) || reference.startsWith('//')) {
      return '';
    }

    const path = reference.split(/[?#]/, 1)[0];
    const segments = path.split('/').filter(Boolean);
    let resourceType = '';
    if(segments.length === 2) {
      resourceType = segments[0];
    }
    else if(segments.length === 4 && segments[2] === '_history') {
      resourceType = segments[0];
    }
    return FHIR_R5_REFERENCE_RESOURCE_TYPES.has(resourceType) ? resourceType : '';
  }

  /**
   * Validate Reference.type as a relative FHIR resource name.
   *
   * In a resource, Reference.type is relative to the FHIR StructureDefinition
   * base URL. Absolute URLs are reserved for references in logical models.
   *
   * @param referenceType - Reference.type value.
   * @returns Comparable FHIR resource type, or an empty string when absent.
   */
  private getDeclaredReferenceResourceType(referenceType: string | undefined): string {
    const normalizedType = referenceType?.trim() || '';
    if(!normalizedType) {
      return '';
    }
    return /^[A-Z][A-Za-z0-9]*$/.test(normalizedType) ? normalizedType : '';
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
  private hasRequiredCode(currentValue: UsageContextEditModel): boolean {
    return !Util.isEmpty(currentValue?.code);
  }

  /**
   * Get the validation error for an invalid valueRange.
   *
   * @param currentValue - Current UsageContext form value.
   * @returns Error for reversed bounds or incompatible units, otherwise an empty string.
   */
  private getRangeValidationError(currentValue: UsageContextEditModel): string {
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
  private getMismatchedRangeUnitFields(currentValue: UsageContextEditModel): RangeUnitField[] {
    const selectedKey = currentValue?.__$valueType || VALUE_KEYS.find((key) => !Util.isEmpty(currentValue?.[key]));
    const low = currentValue?.valueRange?.low;
    const high = currentValue?.valueRange?.high;
    if(selectedKey !== 'valueRange' || Util.isEmpty(low) || Util.isEmpty(high)) {
      return [];
    }
    return RANGE_UNIT_FIELDS.filter((field) => (low?.[field] ?? '') !== (high?.[field] ?? ''));
  }

  /**
   * Find Quantity values that violate FHIR qty-3.
   *
   * A coded unit must identify the terminology system that defines its code.
   * This applies independently to valueQuantity and both Range bounds.
   *
   * @param currentValue - Current UsageContext form value.
   * @returns Paths whose Quantity has a code but no system.
   */
  private getMissingQuantitySystemPaths(currentValue: UsageContextEditModel): QuantitySystemPath[] {
    const selectedKey = currentValue?.__$valueType || VALUE_KEYS.find((key) => !Util.isEmpty(currentValue?.[key]));
    if(selectedKey === 'valueQuantity') {
      return this.isQuantitySystemMissing(currentValue.valueQuantity)
        ? ['valueQuantity']
        : [];
    }
    if(selectedKey !== 'valueRange') {
      return [];
    }

    const missingPaths: QuantitySystemPath[] = [];
    if(this.isQuantitySystemMissing(currentValue.valueRange?.low)) {
      missingPaths.push('valueRange.low');
    }
    if(this.isQuantitySystemMissing(currentValue.valueRange?.high)) {
      missingPaths.push('valueRange.high');
    }
    return missingPaths;
  }

  /**
   * Check the FHIR qty-3 invariant for one Quantity.
   */
  private isQuantitySystemMissing(quantity: fhir.Quantity | undefined): boolean {
    return !Util.isEmpty(quantity?.code) && Util.isEmpty(quantity?.system);
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
  private pruneExtraValueChoices(value: UsageContextEditModel): void {
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
  protected override getCurrentFormPropertyValue(property: FormProperty): unknown {
    const tableProperty = property as FormProperty & {
      properties?: FormProperty[];
      schema?: {widget?: {id?: string}};
    };
    if(tableProperty
        && Array.isArray(tableProperty.properties)
        && tableProperty.schema?.widget?.id === 'identifier'
        && Array.isArray(tableProperty.value)) {
      const storedRows = this.rawValueStore.getIdentifierTable(tableProperty);
      if(storedRows) {
        const value = storedRows
          .map((row) => this.wrapAssignerIdentifierForUi(this.cloneValue(row)))
          .filter((row) => !Util.isEmpty(row));
        return value.length ? value : undefined;
      }
      const originalRows = this.getOriginalIdentifierRows(tableProperty);
      const value = tableProperty.properties
        .map((child: FormProperty, index: number) => {
          if(this.rawValueStore.isIdentifierDeleted(child)) {
            return undefined;
          }
          const rawValue = this.rawValueStore.getIdentifier(child);
          if(!Util.isEmpty(rawValue)) {
            return rawValue;
          }
          const originalRow = originalRows?.[index];
          if(!Util.isEmpty(originalRow)) {
            return originalRow;
          }
          return super.getCurrentFormPropertyValue(child);
        })
        .map((childValue) =>
          this.wrapAssignerIdentifierForUi(this.cloneValue(childValue as EditableIdentifier))
        )
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
  private cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value ?? null)) as T;
  }

  /**
   * Resolve imported Identifier rows directly from the input model.
   *
   * This fallback deliberately does not depend on ngAfterViewInit seeding:
   * schema-form may materialize its row properties after that lifecycle hook.
   *
   * @param property - Identifier table property being rebuilt.
   * @returns Original rows for valueReference.identifier, when applicable.
   */
  private getOriginalIdentifierRows(property: FormProperty): EditableIdentifier[] | undefined {
    const identifiers = this.inputModel?.valueReference?.identifier;
    if(!property.path?.endsWith('/valueReference/identifier') || !Array.isArray(identifiers)) {
      return undefined;
    }
    return identifiers;
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
        const identifier = this.unwrapAssignerIdentifierForFhir(this.cloneValue(identifiers[index]));
        this.rawValueStore.setIdentifier(rowProperty, identifier);
      }
    });
  }

  /**
   * Prepare an existing UsageContext value for dialog editing.
   *
   * @param value - UsageContext value from the parent table.
   * @returns Dialog model with selected value type and UI-wrapped identifiers.
   */
  protected override prepareInputModel(value: UsageContextEditModel): UsageContextEditModel {
    const model = this.cloneValue(value);
    this.removeRangeComparators(model);
    model.__$valueType = VALUE_KEYS.find((key) => !Util.isEmpty(model[key]));
    this.wrapValueReferenceIdentifier(model);
    return model;
  }

  /**
   * Remove comparator fields that are invalid on FHIR Range endpoints.
   *
   * The generated schema models Range endpoints as Quantity, where comparator
   * exists, even though the FHIR Range datatype prohibits it.
   *
   * @param model - UsageContext edit or save model.
   */
  private removeRangeComparators(model: UsageContextEditModel): void {
    delete model.valueRange?.low?.comparator;
    delete model.valueRange?.high?.comparator;
  }

  /**
   * Wrap valueReference.identifier in an array for table editing.
   *
   * @param model - UsageContext dialog model to mutate.
   */
  private wrapValueReferenceIdentifier(model: UsageContextEditModel): void {
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
  private unwrapValueReferenceIdentifier(model: UsageContextEditModel): void {
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
  private unwrapAssignerIdentifierForFhir(identifier: EditableIdentifier): fhir.Identifier {
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
    // Recursive array wrappers have been removed, so the result now satisfies
    // the FHIR Identifier shape even though the input edit type allowed both.
    return identifier as fhir.Identifier;
  }

  /**
   * Recursively wrap assigner.identifier objects for table editing.
   *
   * @param identifier - Identifier value to wrap.
   * @returns Identifier value with nested assigner.identifier arrays.
   */
  private wrapAssignerIdentifierForUi(identifier: EditableIdentifier): EditableIdentifier {
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
  private static codeableConceptSummary(value: fhir.CodeableConcept | undefined): string {
    if(value?.text) {
      return value.text;
    }
    const coding = value?.coding?.find((entry: fhir.Coding) => !Util.isEmpty(entry));
    return [coding?.display, coding?.code, coding?.system].filter(Boolean).join(' | ');
  }

  /**
   * Build a display summary for Quantity.
   *
   * @param value - Quantity value.
   * @returns Human-readable Quantity summary.
   */
  private static quantitySummary(value: fhir.Quantity | undefined): string {
    const amount = [value?.comparator, value?.value].filter((entry) => entry !== undefined && entry !== null).join('');
    return [amount, value?.unit || value?.code, value?.system].filter((entry) => entry !== undefined && entry !== null && entry !== '').join(' ');
  }

  /**
   * Build a display summary for Range.
   *
   * @param value - Range value.
   * @returns Human-readable Range summary.
   */
  private static rangeSummary(value: fhir.Range | undefined): string {
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
  private static referenceSummary(value: EditableReference | undefined): string {
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
  private static identifierSummary(value: EditableIdentifier | undefined): string {
    return [value?.value, value?.system, value?.use].filter(Boolean).join(' | ');
  }
}
