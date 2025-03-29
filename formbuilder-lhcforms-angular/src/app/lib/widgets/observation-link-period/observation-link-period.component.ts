/**
 * This component represents observation link period, handling updates to its corresponding extension object
 * in extensions array.
 *
 */

import {AfterViewInit, Component, OnInit} from '@angular/core';
import {UnitsComponent} from '../units/units.component';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';
import {ExtensionsService} from '../../../services/extensions.service';
import {StringComponent} from '../string/string.component';
import {fhirPrimitives} from '../../../fhir';

interface ObservationLinkPeriodExtension {
  url: fhirPrimitives.url,
  valueDuration: {
    value: number,
    system?: string,
    code?: string,
    unit?: string
  }
}


@Component({
  standalone: false,
  selector: 'lfb-observation-link-period',
  templateUrl: './observation-link-period.component.html'
})
export class ObservationLinkPeriodComponent extends StringComponent implements OnInit {
  static extUrl: fhirPrimitives.url = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationLinkPeriod';
  static seqNum = 0;
  elementId: string;
  subscriptions: Subscription [];
  unitIndex: fhirPrimitives.integer = 0;
  value: string;
  adjustVAlignClass = 'd-flex';

  showOlp = false;
  unitOptions = [
    {code: 'a', unit: 'years'},
    {code: 'mo', unit: 'months'},
    {code: 'wk', unit: 'weeks'},
    {code: 'd', unit: 'days'},
    {code: 'h', unit: 'hours'},
    {code: 'min', unit: 'minutes'},
    {code: 's', unit: 'seconds'},
    {code: 'ms', unit: 'milliseconds'}
  ];

  constructor(private extensionsService: ExtensionsService) {
    super();
    this.elementId = 'observationLinkPeriod_'+ObservationLinkPeriodComponent.seqNum++;
    this.subscriptions = [];
  }

  /**
   * Read extension and initialize properties.
   */
  ngOnInit() {
    super.ngOnInit();
    this.setOlp();
    this.extensionsService.extensionsObservable.subscribe(() => {
      this.setOlp();
    });
  }

  /**
   * Setup Observation link period
   */
  setOlp() {
    const ext = this.getExtension();
    if(ext) {
      this.showOlp = true;
      this.adjustVAlignClass = '';
      this.setUnitIndex(ext);
      this.value = ''+ext.valueDuration.value;
    }
  }


  /**
   * Get extension object representing observation link period.
   */
  getExtension(): fhir.Extension {
    const ext = this.extensionsService.getExtensionsByUrl(ObservationLinkPeriodComponent.extUrl);
    return ext && ext.length > 0 ? ext[0] : null;
  }


  /**
   * Check to see if an item.code is set.
   */
  isCodePresent(): boolean {
    const code = this.formProperty.root.getProperty('code').value;
    return code?.length > 0 && code[0]?.code?.trim().length > 0;
  }

  /**
   * Set unit index based on the input extension. The unit is read either from code or unit field.
   * @param extension - fhir.Extension object
   */
  setUnitIndex(extension: fhir.Extension) {
    let index = -1;
    const code = extension.valueDuration.code;
    // Look for either code or unit in that order.
    ['code', 'unit'].some((field) => {
      const fieldVal = extension.valueDuration[field];
      if(fieldVal) {
        index = this.unitOptions.findIndex((opt) => {
          return opt[field] === fieldVal;
        });
      }
      return index >= 0;
    });
    this.unitIndex =  index > 0 ? index : 0;
  }


  /**
   * Use for yes/no.
   * @param show - Angular event.
   */
  onBooleanChange(show) {
    this.showOlp = show;
    this.adjustVAlignClass = show ? '' : 'd-flex';
    if(show) {
      this.updateExtension();
    }
    else {
      this.extensionsService.removeExtensionsByUrl(ObservationLinkPeriodComponent.extUrl);
    }
  }

  /**
   * Use for unit selection.
   * @param event - Angular event.
   */
  onUnitChange(event) {
    this.unitIndex = event;
    this.updateExtension();
  }


  /**
   * Use for input change event
   * @param event - DOM event
   */
  onValueChange(event) {
    this.value = event.target.value;
    this.updateExtension();
  }


  /**
   * Update extension in the form property.
   */
  updateExtension() {
    this.reset(this.createExtension(this.value, this.unitOptions[this.unitIndex].code, this.unitOptions[this.unitIndex].unit));
  }


  /**
   * Set the extension if the input has a value, otherwise remove if exists.
   * @param ext - fhir.Extension object representing observation link period.
   */
  reset(ext: fhir.Extension) {
    if(ext?.valueDuration?.value) {
      this.extensionsService.resetExtension(ObservationLinkPeriodComponent.extUrl, ext, 'valueDuration', false);
    }
    else {
      this.extensionsService.removeExtensionsByUrl(ext.url);
    }
  }


  /**
   * Create observation link period extension object
   *
   * @param value - value in valueDuration.
   * @param unitCode - UCUM unit code in valueDuration.
   * @param unitText - unit text in valueDuration.
   */
  createExtension(value: string, unitCode?: string, unitText?: string): fhir.Extension {
    const ret: ObservationLinkPeriodExtension =
      {
        url: ObservationLinkPeriodComponent.extUrl,
        valueDuration: {value: parseFloat(value)}
      };

    ret.valueDuration.system = UnitsComponent.ucumSystemUrl;
    if(unitCode) {
      ret.valueDuration.code = unitCode;
    }
    if(unitText) {
      ret.valueDuration.unit = unitText;
    }
    return ret;
  }
}
