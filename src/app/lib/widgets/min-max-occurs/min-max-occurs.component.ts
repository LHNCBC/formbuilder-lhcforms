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

@Component({
  selector: 'lfb-min-max-occurs',
  imports: [LabelComponent, FormsModule, CommonModule],
  templateUrl: './min-max-occurs.component.html'
})
export class MinMaxOccursComponent extends StringComponent implements OnInit, AfterViewInit {
  private extensionsService = inject(ExtensionsService);

  static seqNum = 0;
  elementId: string;
  minOccurs: number | null = null;
  maxOccurs: number | null = null;
  validationError: string | null = null;

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
    this.extensionsService.extensionsObservable.subscribe(() => {
      this.initFromExtensions();
    });
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
   */
  onMinChange(value: string) {
    const parsed = value === '' || value == null ? null : parseInt(value, 10);
    this.minOccurs = (parsed != null && !isNaN(parsed)) ? parsed : null;
    this.validate();
    this.updateExtension(EXTENSION_URL_MIN_OCCURS, this.minOccurs);
  }

  /**
   * Handle max occurs input change.
   */
  onMaxChange(value: string) {
    const parsed = value === '' || value == null ? null : parseInt(value, 10);
    this.maxOccurs = (parsed != null && !isNaN(parsed)) ? parsed : null;
    this.validate();
    this.updateExtension(EXTENSION_URL_MAX_OCCURS, this.maxOccurs);
  }

  /**
   * Validate min <= max constraint.
   */
  validate() {
    if (this.minOccurs != null && this.maxOccurs != null && this.minOccurs > this.maxOccurs) {
      this.validationError = 'Min occurs must be ≤ Max occurs.';
    } else if (this.minOccurs != null && this.minOccurs < 0) {
      this.validationError = 'Min occurs must be ≥ 0.';
    } else if (this.maxOccurs != null && this.maxOccurs < 1) {
      this.validationError = 'Max occurs must be ≥ 1.';
    } else {
      this.validationError = null;
    }
  }

  /**
   * Update or remove a single extension by URL.
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

