/**
 * Component for questionnaire-minOccurs and questionnaire-maxOccurs extensions.
 * Displays two side-by-side integer inputs for min and max occurrence counts.
 * Visible only when 'repeats' is true. Min is enabled only when 'required' is true.
 */
import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import {StringComponent} from '../string/string.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {EXTENSION_URL_MIN_OCCURS, EXTENSION_URL_MAX_OCCURS} from '../../constants/constants';
import {fhirPrimitives} from '../../../fhir';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {LabelComponent} from '../label/label.component';
import {IntegerDirective} from '../../directives/integer.directive';
import {mergeIntegerExtension} from './min-max-occurs.utils';

@Component({
  selector: 'lfb-min-max-occurs',
  imports: [LabelComponent, IntegerDirective, FormsModule, CommonModule],
  templateUrl: './min-max-occurs.component.html'
})
export class MinMaxOccursComponent extends StringComponent implements OnInit, AfterViewInit {
  private extensionsService = inject(ExtensionsService);

  static seqNum = 0;
  readonly fhirIntegerMax = 2147483647;
  elementId: string;
  minOccurs: number | null = null;
  maxOccurs: number | null = null;
  minOccursAllowed = false;
  validationError: string | null = null;
  private syncingExtensions = false;
  private minOccursDirty = false;
  private maxOccursDirty = false;

  constructor() {
    super();
    this.elementId = 'minMaxOccurs_' + MinMaxOccursComponent.seqNum++;
    this.subscriptions = [];
  }

  /**
   * Read extensions and initialize properties.
   */
  ngOnInit() {
    super.ngOnInit();
    this.initFromExtensions();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub = this.extensionsService.extensionsObservable.subscribe(() => {
      if (!this.syncingExtensions) {
        this.initFromExtensions();
      }
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.findRoot().getProperty('repeats').valueChanges.subscribe((repeats) => {
      if (repeats !== true) {
        this.minOccurs = 0;
        this.maxOccurs = null;
        this.validationError = null;
        this.minOccursDirty = false;
        this.maxOccursDirty = false;
        this.removeOccursExtensions();
      } else {
        this.initFromExtensions();
      }
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.findRoot().getProperty('required').valueChanges.subscribe((required) => {
      this.minOccursAllowed = required === true;
      if (this.minOccursAllowed) {
        this.minOccurs = this.minOccurs && this.minOccurs > 0 ? this.minOccurs : 1;
        this.validate();
      } else {
        this.minOccurs = 0;
        this.minOccursDirty = false;
        this.removeMinOccursExtension();
        this.validate();
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Initialize component state from existing extensions.
   */
  initFromExtensions() {
    const minExt = this.extensionsService.getFirstExtensionByUrl(EXTENSION_URL_MIN_OCCURS);
    const maxExt = this.extensionsService.getFirstExtensionByUrl(EXTENSION_URL_MAX_OCCURS);
    this.minOccursAllowed = this.formProperty.findRoot().getProperty('required').value === true;
    this.minOccurs = this.minOccursAllowed ? minExt?.valueInteger ?? 1 : 0;
    this.maxOccurs = maxExt?.valueInteger ?? null;
    this.minOccursDirty = false;
    this.maxOccursDirty = false;
    if (minExt && (!this.minOccursAllowed || minExt.valueInteger === 1)) {
      this.removeMinOccursExtension();
    }
    this.validate();
  }

  /**
   * Handle min occurs input change.
   * @param value - Value from the control.
   */
  onMinChange(value: string) {
    if (!this.minOccursAllowed) {
      this.minOccurs = 0;
      this.removeMinOccursExtension();
      return;
    }
    this.minOccurs = this.parseInteger(value) ?? 1;
    this.minOccursDirty = true;
    this.syncExtensions();
  }

  /**
   * Handle max occurs input change.
   * @param value - Value from the control.
   */
  onMaxChange(value: string) {
    this.maxOccurs = this.parseInteger(value);
    this.maxOccursDirty = true;
    this.syncExtensions();
  }

  /**
   * Parse integer input. Empty or non-integer values are treated as no extension value.
   *
   * @param value - Value to parse for integer.
   * @return - A valid integer or null if the value is empty, non-integer, or null/undefined.
   */
  parseInteger(value: string): number | null {
    if (value === '' || value == null) {
      return null;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
  }

  /**
   * Validate occurrence values against the FHIR integer range and min/max constraints.
   *
   * @return - Return true if valid, false if invalid. Sets validationError message if invalid.
   */
  validate(): boolean {
    if (this.minOccurs != null && !this.isFhirInteger(this.minOccurs)) {
      this.validationError = 'Min occurs must be a signed 32-bit integer.';
    } else if (this.maxOccurs != null && !this.isFhirInteger(this.maxOccurs)) {
      this.validationError = 'Max occurs must be a signed 32-bit integer.';
    } else if (this.minOccursAllowed && this.minOccurs != null && this.minOccurs < 1) {
      this.validationError = 'Min occurs must be greater than or equal to 1 when the answer is required.';
    } else if (this.maxOccurs != null && this.maxOccurs <= 1) {
      this.validationError = 'Max occurs must be greater than 1.';
    } else if (this.minOccurs != null && this.maxOccurs != null && this.minOccurs > this.maxOccurs) {
      this.validationError = 'Min occurs must be less than or equal to Max occurs.';
    } else {
      this.validationError = null;
    }

    return this.validationError === null;
  }

  /**
   * Check whether a value is within the range of the FHIR integer primitive.
   *
   * @param value - Integer value to check.
   * @return - True when the value is a signed 32-bit integer.
   */
  private isFhirInteger(value: number): boolean {
    return Number.isInteger(value) && value >= -2147483648 && value <= this.fhirIntegerMax;
  }

  /**
   * Persist edited min/max extensions only when the current UI values are valid.
   * Invalid edited values remain visible while the last valid extensions are retained.
   */
  syncExtensions() {
    if (!this.validate()) {
      return;
    }

    this.syncingExtensions = true;
    try {
      const minExtensionValue = this.minOccursAllowed && this.minOccurs != null && this.minOccurs > 1
        ? this.minOccurs
        : null;
      if (this.minOccursDirty) {
        this.updateExtension(EXTENSION_URL_MIN_OCCURS, minExtensionValue);
      }
      if (this.maxOccursDirty) {
        this.updateExtension(EXTENSION_URL_MAX_OCCURS, this.maxOccurs);
      }
      this.minOccursDirty = false;
      this.maxOccursDirty = false;
    } finally {
      this.syncingExtensions = false;
    }
  }

  /**
   * Remove both occurrence extensions.
   */
  removeOccursExtensions() {
    this.syncingExtensions = true;
    try {
      this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_MIN_OCCURS);
      this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_MAX_OCCURS);
    } finally {
      this.syncingExtensions = false;
    }
  }

  /**
   * Remove the minimum occurrence extension while preserving maxOccurs.
   */
  removeMinOccursExtension() {
    const wasSyncingExtensions = this.syncingExtensions;
    this.syncingExtensions = true;
    try {
      this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_MIN_OCCURS);
    } finally {
      this.syncingExtensions = wasSyncingExtensions;
    }
  }

  /**
   * Update or remove a single extension by URL while retaining its metadata.
   *
   * @param extUrl - URI of the extension to update, either min occurs or max occurs.
   * @param value - Integer value to set for the extension. If null, the extension will be removed.
   */
  updateExtension(extUrl: fhirPrimitives.url, value: number | null) {
    if (value != null) {
      const currentExtension = this.extensionsService.getFirstExtensionByUrl(extUrl);
      const ext = mergeIntegerExtension(currentExtension, extUrl, value);
      this.extensionsService.resetExtension(extUrl, this.extensionsService.updateExtension(ext), 'valueInteger', false);
    } else {
      this.extensionsService.removeExtensionsByUrl(extUrl);
    }
  }
}
