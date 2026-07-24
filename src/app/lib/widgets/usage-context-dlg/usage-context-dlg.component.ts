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
import {MessageDlgComponent, MessageType} from '../message-dlg/message-dlg.component';
import {DialogData} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {UsageContextObjComponent} from '../usage-context-obj/usage-context-obj.component';
import {Util} from '../../util';
import {RawValueStoreService} from '../../../services/raw-value-store.service';

type UsageContextValueKey = 'valueCodeableConcept' | 'valueQuantity' | 'valueRange' | 'valueReference';

const VALUE_KEYS: UsageContextValueKey[] = [
  'valueCodeableConcept',
  'valueQuantity',
  'valueRange',
  'valueReference'
];

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
export class UsageContextDlgComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dlgContent', {static: false, read: ElementRef}) dlgContent: ElementRef;
  @ViewChild('dlgContainer', {static: false, read: ElementRef}) dlgContainer: ElementRef;
  @ViewChild(UsageContextObjComponent) usageContextObj!: UsageContextObjComponent;

  inputModel: any;
  changedValue: any;
  path = '';
  disableSave = signal(true);
  saveDisabledReason = signal('');
  validationError = signal('');

  dirtyObserver: MutationObserver;
  rowIndex = 0;
  previous_origin: {left: number, top: number};
  private initialValueJson = '';

  matDialogService = inject(MatDialog);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  matDialogRef = inject(MatDialogRef<DialogData>);
  ngbModalService = inject(NgbModal);
  private rawValueStore = inject(RawValueStoreService);

  constructor(private hostEl: ElementRef, private cdr: ChangeDetectorRef) {
  }

  /**
   * Ng OnInit lifecycle hook.
   */
  ngOnInit() {
    if(this.data.rowIndex >= 0) {
      this.inputModel = this.prepareInputModel(this.data.arrayProperty.properties[this.data.rowIndex].value);
    }
    else {
      this.inputModel = {code: {}};
    }
    this.changedValue = this.inputModel;
    this.initialValueJson = this.stringifyForChange(this.inputModel);
    this.rowIndex = this.data.rowIndex >= 0 ? this.data.rowIndex : 0;
    this.path = this.buildPath();
  }

  /**
   * Move this dialog to its current overlay origin.
   */
  movePosition(): void {
    const currentOrigin = this.hostEl.nativeElement.parentElement.getBoundingClientRect();
    this.matDialogRef.updatePosition({top: currentOrigin.top + 'px', left: currentOrigin.left + 'px'});
    this.previous_origin = currentOrigin;
  }

  /**
   * Ng AfterViewInit lifecycle hook.
   */
  ngAfterViewInit() {
    this.dirtyObserver = new MutationObserver((mutationsList) => {
      for(const mutation of mutationsList) {
        if (mutation.type === 'attributes' && (mutation.target as HTMLElement).classList?.contains('ng-dirty')) {
          this.updateDisableSave();
          this.cdr.markForCheck();
          return;
        }
      }
    });

    const formElement = this.dlgContent?.nativeElement.querySelector('form');
    if(formElement) {
      this.dirtyObserver.observe(
        formElement,
        {attributes: true, attributeFilter: ['class'], subtree: true}
      );
    }

    this.updateDisableSave();
    this.seedOriginalIdentifierRows();
    this.cdr.detectChanges();
  }

  /**
   * Handle the dialog save and close event.
   */
  save() {
    const currentValue = this.usageContextObj?.sfFormRootProperty
      ? this.getCurrentFormPropertyValue(this.usageContextObj.sfFormRootProperty)
      : this.changedValue;
    this.matDialogRef.close(this.prepareValue(currentValue || {}));
  }

  /**
   * Handle changes emitted by the UsageContext object form.
   *
   * @param event - Changed UsageContext value.
   */
  onChange(event: any) {
    this.changedValue = event;
    this.updateDisableSave();
    this.cdr.detectChanges();
  }

  /**
   * Handle the cancel button event.
   */
  cancel() {
    if (!this.hasModelChanged()) {
      this.matDialogRef.close(false);
      return;
    }

    const modalRef = this.ngbModalService.open(MessageDlgComponent, {scrollable: true});
    modalRef.componentInstance.options = {
      title: 'Confirm',
      message: 'Are you sure you want to discard the changes you made?',
      type: MessageType.INFO,
      buttons: [{
        label: 'Discard changes',
        value: 'yes'
      }, {
        label:  'Do not discard changes',
        value: 'no'
      }]};

    modalRef.closed.subscribe((result) => {
      if (result === 'yes') {
        this.matDialogRef.close(false);
      }
    });
  }

  /**
   * Clean up observers when the dialog is destroyed.
   */
  ngOnDestroy() {
    this.dirtyObserver?.disconnect();
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
  private updateDisableSave(): void {
    const currentValue = this.getCurrentUsageContextValue();
    const rangeValidationError = this.getRangeValidationError(currentValue);
    const modelChanged = this.hasModelChanged(currentValue);
    const hasRequiredValue = this.hasRequiredValue(currentValue);
    const hasRequiredCode = this.hasRequiredCode(currentValue);

    this.validationError.set(rangeValidationError);
    this.setInputInvalidStyle('input[id*="valueRange.high.value"]', !!rangeValidationError);
    this.saveDisabledReason.set(this.getSaveDisabledReason(
      modelChanged,
      hasRequiredCode,
      hasRequiredValue,
      rangeValidationError
    ));
    this.disableSave.set(
      !modelChanged ||
      !hasRequiredCode ||
      !hasRequiredValue ||
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
    return !!selectedKey && !Util.isEmpty(currentValue?.[selectedKey]);
  }

  /**
   * Check whether UsageContext code.code is populated.
   *
   * @param currentValue - Current UsageContext form value.
   * @returns True when code.code has a value.
   */
  private hasRequiredCode(currentValue: any): boolean {
    return !Util.isEmpty(currentValue?.code?.code);
  }

  /**
   * Get the current UsageContext value from the schema form when available.
   *
   * @returns Current UsageContext value.
   */
  private getCurrentUsageContextValue(): any {
    return this.usageContextObj?.sfFormRootProperty
      ? this.getCurrentFormPropertyValue(this.usageContextObj.sfFormRootProperty)
      : this.changedValue;
  }

  /**
   * Get the validation error for an invalid valueRange.
   *
   * @param currentValue - Current UsageContext form value.
   * @returns Error message when high is less than low, otherwise an empty string.
   */
  private getRangeValidationError(currentValue: any): string {
    const selectedKey = currentValue?.__$valueType || VALUE_KEYS.find((key) => !Util.isEmpty(currentValue?.[key]));
    if(selectedKey !== 'valueRange') {
      return '';
    }

    const low = this.getComparableNumber(currentValue?.valueRange?.low?.value);
    const high = this.getComparableNumber(currentValue?.valueRange?.high?.value);
    if(low === null || high === null) {
      return '';
    }
    return high < low ? 'High value must be greater than or equal to low value.' : '';
  }

  /**
   * Get the tooltip message explaining why Save is disabled.
   *
   * @param modelChanged - True when the model changed.
   * @param hasRequiredCode - True when code.code is populated.
   * @param hasRequiredValue - True when a value[x] is populated.
   * @param validationError - Current validation error message.
   * @returns Tooltip text for the disabled save button.
   */
  private getSaveDisabledReason(
    modelChanged: boolean,
    hasRequiredCode: boolean,
    hasRequiredValue: boolean,
    validationError: string
  ): string {
    if(validationError) {
      return validationError;
    }
    if(!hasRequiredCode || !hasRequiredValue) {
      return 'Code and value[x] are required.';
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
   * @param property - Form property to read.
   * @returns Current non-empty property value, or undefined when empty.
   */
  private getCurrentFormPropertyValue(property: any): any {
    if(!property) {
      return undefined;
    }

    if(Array.isArray(property.properties)) {
      if(property.schema?.widget?.id === 'identifier' && Array.isArray(property.value)) {
        const rawValue = property.properties
          .map((child: FormProperty) => this.rawValueStore.getIdentifier(child))
          .filter((childValue) => !Util.isEmpty(childValue));
        const sourceValue = rawValue.length
          ? rawValue
          : this.getOriginalIdentifierRows(property) || property.value;
        const value = this.cloneUsageContext(sourceValue)
          .filter((childValue) => !Util.isEmpty(childValue));
        return value.length ? value : undefined;
      }
      const value = property.properties
        .map((child) => this.getCurrentFormPropertyValue(child))
        .filter((childValue) => !Util.isEmpty(childValue));
      return value.length ? value : undefined;
    }

    if(property.properties && typeof property.properties === 'object') {
      const value: {[key: string]: any} = {};
      Object.keys(property.properties).forEach((key) => {
        const child = property.properties[key];
        if(child?.visible === false || key.startsWith('__$')) {
          return;
        }
        const childValue = this.getCurrentFormPropertyValue(child);
        if(!Util.isEmpty(childValue)) {
          value[key] = childValue;
        }
      });
      return Object.keys(value).length ? value : undefined;
    }

    return property.value;
  }

  /**
   * Build the dialog path shown in the header.
   *
   * @returns Display path for the UsageContext row being edited.
   */
  private buildPath(): string {
    const dialogRefs = this.matDialogService.openDialogs;
    const pathArray = dialogRefs.reduce((acc, dRef) => {
      const instance = dRef.componentInstance;
      if (instance instanceof UsageContextDlgComponent) {
        const data = instance.data;
        let index: number = data.rowIndex;
        if(index < 0) {
          index = (data.arrayProperty.properties as FormProperty []).length;
        }
        acc.push(`${data.arrayProperty.path.substring(1)}[${index}]`);
      }
      return acc;
    }, [] as string[]);
    return pathArray.join('.');
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
   * Check whether the edited model differs from the initial model.
   *
   * @returns True when the current model has changed.
   */
  private hasModelChanged(currentValue = this.getCurrentUsageContextValue()): boolean {
    return this.stringifyForChange(currentValue) !== this.initialValueJson;
  }

  /**
   * Normalize and stringify a value for change detection.
   *
   * @param value - Value to stringify.
   * @returns Stable JSON string for change comparison.
   */
  private stringifyForChange(value: any): string {
    return JSON.stringify(this.normalizeForChange(value) ?? null);
  }

  /**
   * Normalize a value by removing empty values and UI-only fields.
   *
   * @param value - Value to normalize.
   * @returns Normalized value, or undefined when the value is empty.
   */
  private normalizeForChange(value: any): any {
    if(Array.isArray(value)) {
      const normalized = value
        .map((entry) => this.normalizeForChange(entry))
        .filter((entry) => !Util.isEmpty(entry));
      return normalized.length ? normalized : undefined;
    }
    if(value && typeof value === 'object') {
      const normalized: {[key: string]: any} = {};
      Object.keys(value).sort().forEach((key) => {
        if(key.startsWith('__$')) {
          return;
        }
        const child = this.normalizeForChange(value[key]);
        if(!Util.isEmpty(child)) {
          normalized[key] = child;
        }
      });
      return Object.keys(normalized).length ? normalized : undefined;
    }
    return value;
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
        this.rawValueStore.setIdentifier(rowProperty, identifiers[index]);
      }
    });
  }

  /**
   * Get original UsageContext valueReference identifier rows for a form property.
   *
   * @param property - Identifier table form property.
   * @returns Original identifier rows when available, otherwise null.
   */
  private getOriginalIdentifierRows(property: any): any[] {
    if(property.path?.includes('/valueReference/identifier') && property.properties?.length) {
      return this.inputModel?.valueReference?.identifier;
    }
    return null;
  }

  /**
   * Prepare an existing UsageContext value for dialog editing.
   *
   * @param value - UsageContext value from the parent table.
   * @returns Dialog model with selected value type and UI-wrapped identifiers.
   */
  private prepareInputModel(value: any): any {
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
