import {Component, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {FhirService} from '../../../services/fhir.service';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

/**
 * A size unit option used by the "Maximum size" restriction helper.
 */
interface SizeUnit {
  value: string;
  label: string;
  factor: number;
}

/**
 * Operator-aware value editor for a single restriction row.
 *
 * The restrictions table shares one schema definition for the `value` cell across
 * every operator (maxLength, minLength, regex, minValue, maxValue, maxSize, mimeType).
 * This widget inspects the sibling `operator` value and adapts its rendering:
 *
 *  - `maxSize`  -> a numeric input plus a Bytes/KB/MB/GB unit selector. The value is
 *                  always stored (and exported) in bytes, so authors can enter a size in
 *                  a friendly unit without having to compute the byte count themselves.
 *  - `mimeType` -> a text input backed by common suggestions and validated against the
 *                  IANA media type registry before it is stored.
 *  - anything else -> a plain text input, preserving the previous default behavior for
 *                  string/number restrictions.
 */
@Component({
  selector: 'lfb-restrictions-value',
  imports: [FormsModule],
  template: `
    @if (isMaxSize) {
      <div class="d-flex restrictions-value-size">
        <input type="number" min="0" step="any"
               name="{{name}}_size"
               [attr.id]="id"
               class="form-control form-control-sm restrictions-value-size__number"
               [attr.placeholder]="'Max size'"
               [class.is-invalid]="maxSizeInvalid"
               [attr.aria-invalid]="maxSizeInvalid ? 'true' : null"
               [attr.aria-describedby]="maxSizeInvalid ? id + '_max_size_error' : null"
               [disabled]="isValueDisabled"
               [ngModel]="sizeValue"
               [ngModelOptions]="{standalone: true}"
               (ngModelChange)="onSizeValueChange($event)"
               aria-label="Maximum size value">
        <select name="{{name}}_unit"
                class="form-select form-select-sm restrictions-value-size__unit"
                [disabled]="isValueDisabled"
                [ngModel]="sizeUnit"
                [ngModelOptions]="{standalone: true}"
                (ngModelChange)="onSizeUnitChange($event)"
                aria-label="Maximum size unit">
          @for (unit of sizeUnits; track unit.value) {
            <option [ngValue]="unit.value">{{unit.label}}</option>
          }
        </select>
        @if (maxSizeInvalid) {
          <div class="invalid-feedback d-block" [attr.id]="id + '_max_size_error'" role="alert">
            Enter a finite, non-negative maximum size.
          </div>
        }
      </div>
    } @else {
      <input type="text"
             name="{{name}}"
             [attr.id]="id"
             class="form-control form-control-sm"
             [class.is-invalid]="isMimeType && mimeTypeInvalid"
             [attr.placeholder]="schema.placeholder || null"
             [attr.list]="isMimeType ? id + '_mime' : null"
             [attr.aria-invalid]="isMimeType && mimeTypeInvalid ? 'true' : null"
             [attr.aria-describedby]="isMimeType && mimeTypeInvalid ? id + '_mime_error' : null"
             [disabled]="isValueDisabled"
             [ngModel]="textValue"
             [ngModelOptions]="{standalone: true}"
             (ngModelChange)="onTextChange($event)">
      @if (isMimeType) {
        <datalist [attr.id]="id + '_mime'">
          @for (mime of mimeTypeSuggestions; track mime) {
            <option [value]="mime"></option>
          }
        </datalist>
        @if (mimeTypeInvalid) {
          <div class="invalid-feedback" [attr.id]="id + '_mime_error'" role="alert">
            Enter a valid IANA-registered MIME type, such as application/pdf.
          </div>
        }
      }
    }
  `,
  styles: [`
    .restrictions-value-size { flex-wrap: wrap; gap: 0.25rem; }
    .restrictions-value-size__number { flex: 1 1 auto; min-width: 0; }
    .restrictions-value-size__unit { flex: 0 0 auto; width: auto; }
    .restrictions-value-size .invalid-feedback { flex-basis: 100%; }
  `]
})
export class RestrictionsValueComponent extends LfbControlWidgetComponent implements OnInit {

  private fhirService = inject(FhirService);

  static readonly SIZE_UNITS: SizeUnit[] = [
    {value: 'B', label: 'Bytes', factor: 1},
    {value: 'KB', label: 'KB', factor: 1024},
    {value: 'MB', label: 'MB', factor: 1024 * 1024},
    {value: 'GB', label: 'GB', factor: 1024 * 1024 * 1024}
  ];

  // A short list of frequently used MIME types offered as datalist suggestions.
  static readonly MIME_TYPES: string[] = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/tiff',
    'text/plain',
    'text/csv',
    'text/html',
    'application/json',
    'application/xml',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'audio/mpeg',
    'video/mp4',
    'application/dicom',
    'application/hl7-v3+xml'
  ];

  sizeUnits = RestrictionsValueComponent.SIZE_UNITS;
  mimeTypeSuggestions = RestrictionsValueComponent.MIME_TYPES;

  isMaxSize = false;
  isMimeType = false;
  sizeUnit = 'KB';
  sizeValue: number | null = null;
  textValue = '';
  maxSizeInvalid = false;
  mimeTypeInvalid = false;

  // Guard to avoid re-syncing the UI from value changes that this widget itself made.
  private selfUpdating = false;

  // The operator currently applied to this row. Used to distinguish a genuine operator
  // switch from the initial assignment so a stale value can be cleared appropriately.
  private currentOperator: string;
  private dataType: string;

  /**
   * A restriction value has no meaning until the operator control commits one
   * of its type-filtered options. This also avoids treating the select element's
   * visually displayed first option as a real selection.
   */
  get isValueDisabled(): boolean {
    const invalidAttachmentOperator = this.dataType === 'attachment' &&
      !this.isMaxSize && !this.isMimeType;
    return !!this.schema.readOnly || !this.currentOperator || invalidAttachmentOperator;
  }

  /** Initialize the operator-specific editor and keep it synchronized with the form model. */
  ngOnInit(): void {
    super.ngOnInit();

    const operatorProperty = this.formProperty.parent?.getProperty('operator');
    this.currentOperator = operatorProperty?.value;
    this.applyOperator(this.currentOperator);
    this.syncFromModel();

    const typeProperty = this.formProperty.root.getProperty('type');
    this.dataType = typeProperty?.value;
    if(typeProperty) {
      this.subscriptions.push(typeProperty.valueChanges.subscribe((type) => {
        this.dataType = type;
      }));
    }

    if (operatorProperty) {
      this.subscriptions.push(operatorProperty.valueChanges.subscribe((operator) => {
        const previousOperator = this.currentOperator;
        this.currentOperator = operator;
        this.applyOperator(operator);
        // The value's meaning differs per operator (a byte count for maxSize, free text
        // otherwise), so a value entered for the previous operator is not meaningful for
        // the new one. Clear it when the user switches operators. The `previousOperator`
        // guard skips the initial (undefined -> operator) assignment so values loaded
        // from an existing questionnaire are preserved.
        if (previousOperator && operator !== previousOperator) {
          this.setValueGuarded(null);
        }
        this.syncFromModel();
      }));
    }

    // Keep the UI in sync when the value changes externally (e.g. loading a questionnaire).
    this.subscriptions.push(this.formProperty.valueChanges.subscribe(() => {
      if (!this.selfUpdating) {
        this.syncFromModel();
      }
    }));
  }

  /**
   * Update the operator-related flags for the current row.
   * @param operator - The sibling `operator` value for this restriction row.
   */
  private applyOperator(operator: string): void {
    this.isMaxSize = operator === 'maxSize';
    this.isMimeType = operator === 'mimeType';
    if (!this.isMaxSize) {
      this.maxSizeInvalid = false;
    }
    if (!this.isMimeType) {
      this.mimeTypeInvalid = false;
    }
  }

  /**
   * Populate the local UI models from the current stored value.
   * For `maxSize`, the stored value is bytes; convert it to a friendly value + unit.
   */
  private syncFromModel(): void {
    const value = this.formProperty.value;
    if (this.isMaxSize) {
      if (value === null || value === undefined || value === '') {
        this.sizeValue = null;
        this.maxSizeInvalid = false;
        // Keep the currently selected unit so the dropdown does not jump around.
      }
      else {
        const bytes = Number(value);
        this.maxSizeInvalid = !Number.isFinite(bytes) || bytes < 0;
        if(this.maxSizeInvalid) {
          this.sizeValue = bytes;
          // Preserve the invalid value for correction, but do not retain it in
          // the restriction model or export it as a FHIR valueDecimal.
          this.setValueGuarded(null);
          return;
        }
        const best = RestrictionsValueComponent.bytesToBestUnit(bytes);
        this.sizeValue = best.value;
        this.sizeUnit = best.unit;
      }
    } else {
      this.textValue = value === null || value === undefined ? '' : `${value}`;
      if (this.isMimeType) {
        const normalizedValue = this.textValue.trim();
        this.mimeTypeInvalid = normalizedValue !== '' &&
          !this.fhirService.isValidMimeType(normalizedValue);
        if (this.mimeTypeInvalid) {
          // Preserve the invalid text for correction, but do not retain it in the
          // restriction model or export it as a FHIR valueCode.
          this.setValueGuarded(null);
        } else if (normalizedValue !== this.textValue) {
          this.textValue = normalizedValue;
          this.setValueGuarded(normalizedValue === '' ? null : normalizedValue);
        }
      }
    }
  }

  /**
   * Handle a change to the numeric size value (max size in the selected unit).
   * @param value - Numeric value entered by the user.
   */
  onSizeValueChange(value: number | null): void {
    this.sizeValue = value === null || value === undefined || (value as any) === '' ? null : Number(value);
    this.commitSize();
  }

  /**
   * Handle a change to the size unit (Bytes/KB/MB/GB). The displayed number is kept and
   * the stored byte count is recomputed for the new unit.
   * @param unit - The selected unit code.
   */
  onSizeUnitChange(unit: string): void {
    this.sizeUnit = unit;
    this.commitSize();
  }

  /**
   * Convert the current size value + unit to bytes and store it on the form property.
   */
  private commitSize(): void {
    let byteString: string | null = null;
    this.maxSizeInvalid = false;
    if (this.sizeValue !== null) {
      const factor = RestrictionsValueComponent.factorFor(this.sizeUnit);
      const bytes = this.sizeValue * factor;
      this.maxSizeInvalid = !Number.isFinite(this.sizeValue) || this.sizeValue < 0 || !Number.isFinite(bytes);
      if(!this.maxSizeInvalid) {
        byteString = `${Math.round(bytes)}`;
      }
    }
    this.setValueGuarded(byteString);
  }

  /**
   * Handle a change to the plain text value (all non-maxSize operators). MIME values
   * are normalized and committed only when they are registered and syntactically valid.
   * @param value - Text entered by the user.
   */
  onTextChange(value: string): void {
    this.textValue = value ?? '';
    if (this.isMimeType) {
      const normalizedValue = this.textValue.trim();
      this.mimeTypeInvalid = normalizedValue !== '' &&
        !this.fhirService.isValidMimeType(normalizedValue);
      this.setValueGuarded(
        normalizedValue === '' || this.mimeTypeInvalid ? null : normalizedValue
      );
    } else {
      this.mimeTypeInvalid = false;
      this.setValueGuarded(this.textValue === '' ? null : this.textValue);
    }
  }

  /**
   * Set the form property value while suppressing the self-triggered value-change resync.
   * @param value - The value to store (bytes as string for maxSize, raw text otherwise).
   */
  private setValueGuarded(value: string | null): void {
    this.selfUpdating = true;
    this.formProperty.setValue(value, false);
    this.selfUpdating = false;
  }

  /**
   * Return the byte multiplier for a unit code.
   * @param unit - One of 'B' | 'KB' | 'MB' | 'GB'.
   */
  static factorFor(unit: string): number {
    const found = RestrictionsValueComponent.SIZE_UNITS.find((u) => u.value === unit);
    return found ? found.factor : 1;
  }

  /**
   * Choose the largest unit that represents the given byte count exactly, so that a value
   * round-trips without loss. Falls back to Bytes when no larger unit divides evenly.
   * @param bytes - The size in bytes.
   */
  static bytesToBestUnit(bytes: number): {value: number, unit: string} {
    if (!bytes) {
      return {value: bytes, unit: 'B'};
    }
    for (let i = RestrictionsValueComponent.SIZE_UNITS.length - 1; i >= 0; i--) {
      const unit = RestrictionsValueComponent.SIZE_UNITS[i];
      if (bytes % unit.factor === 0) {
        return {value: bytes / unit.factor, unit: unit.value};
      }
    }
    return {value: bytes, unit: 'B'};
  }
}
