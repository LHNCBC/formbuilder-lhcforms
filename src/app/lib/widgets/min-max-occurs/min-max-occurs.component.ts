/**
 * Component for questionnaire-minOccurs and questionnaire-maxOccurs extensions.
 * Displays two side-by-side integer inputs for min and max occurrence counts.
 * Visible only when 'repeats' is true.
 */
import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import {StringComponent} from '../string/string.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {EXTENSION_URL_MIN_OCCURS, EXTENSION_URL_MAX_OCCURS} from '../../constants/constants';
import fhir from 'fhir/r4';
import {fhirPrimitives} from '../../../fhir';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {LabelComponent} from '../label/label.component';
import {IntegerDirective} from '../../directives/integer.directive';

@Component({
  selector: 'lfb-min-max-occurs',
  imports: [LabelComponent, IntegerDirective, FormsModule, CommonModule],
  templateUrl: './min-max-occurs.component.html'
})
export class MinMaxOccursComponent extends StringComponent implements OnInit, AfterViewInit {
  private extensionsService = inject(ExtensionsService);

  static seqNum = 0;
  elementId: string;
  minOccurs: number | null = null;
  maxOccurs: number | null = null;
  validationError: string | null = null;
  private syncingExtensions = false;

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
        this.minOccurs = null;
        this.maxOccurs = null;
        this.validationError = null;
        this.removeOccursExtensions();
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
    this.minOccurs = minExt?.valueInteger ?? null;
    this.maxOccurs = maxExt?.valueInteger ?? null;
    this.validate();
  }

  /**
   * Handle min occurs input change.
   * @param value - Value from the control.
   */
  onMinChange(value: string) {
    this.minOccurs = this.parseInteger(value);
    this.validate();
    this.syncExtensions();
  }

  /**
   * Handle max occurs input change.
   * @param value - Value from the control.
   */
  onMaxChange(value: string) {
    this.maxOccurs = this.parseInteger(value);
    this.validate();
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
   * Validate min <= max constraint.
   *
   * @return - Return true if valid, false if invalid. Sets validationError message if invalid.
   */
  validate(): boolean {
    if (this.minOccurs != null && this.maxOccurs != null && this.minOccurs > this.maxOccurs) {
      this.validationError = 'Min occurs must be less than or equal to Max occurs.';
    } else if (this.minOccurs != null && this.minOccurs < 0) {
      this.validationError = 'Min occurs must be greater than or equal to 0.';
    } else if (this.maxOccurs != null && this.maxOccurs < 1) {
      this.validationError = 'Max occurs must be greater than or equal to 1.';
    } else {
      this.validationError = null;
    }

    return this.validationError === null;
  }

  /**
   * Persist min/max extensions only when the current UI values are valid.
   * Invalid edited values remain visible in the UI but remove both extensions from output.
   */
  syncExtensions() {
    if (!this.validate()) {
      this.removeOccursExtensions();
      return;
    }

    this.syncingExtensions = true;
    try {
      this.updateExtension(EXTENSION_URL_MIN_OCCURS, this.minOccurs);
      this.updateExtension(EXTENSION_URL_MAX_OCCURS, this.maxOccurs);
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
   * Update or remove a single extension by URL.
   *
   * @param extUrl - URI of the extension to update, either min occurs or max occurs.
   * @param value - Integer value to set for the extension. If null, the extension will be removed.
   */
  updateExtension(extUrl: fhirPrimitives.url, value: number | null) {
    if (value != null) {
      const ext: fhir.Extension = {
        url: extUrl,
        valueInteger: value
      };
      this.extensionsService.resetExtension(extUrl, this.extensionsService.updateExtension(ext), 'valueInteger', false);
    } else {
      this.extensionsService.removeExtensionsByUrl(extUrl);
    }
  }
}

