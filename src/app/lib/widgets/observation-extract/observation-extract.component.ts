import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import fhir from 'fhir/r4';
import {ExtensionsService} from '../../../services/extensions.service';
import {BooleanRadioComponent} from '../boolean-radio/boolean-radio.component';
import {fhirPrimitives} from '../../../fhir';
import {CommonModule} from "@angular/common";
import {LabelComponent} from "../label/label.component";
import {FormsModule} from "@angular/forms";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {FormService} from "../../../services/form.service";

type ValueXType = 'valueBoolean' | 'valueCode';
type ValueCodeType = 'component' | 'derived' | 'independent' | 'member' | null;

@Component({
  selector: 'lfb-observation-extract',
  imports: [LabelComponent, FormsModule, CommonModule, FontAwesomeModule],
  templateUrl: `./observation-extract.component.html`,
  styleUrls: []
})
export class ObservationExtractComponent extends BooleanRadioComponent implements OnInit, AfterViewInit {
  static extUrl: fhirPrimitives.url = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationExtract';
  static seqNum = 0;
  static obExtractRelationshipOptions: {value: ValueCodeType, label: string}[] = [
    {value: null, label: 'None'},
    {value: 'component', label: 'Component'},
    {value: 'member', label: 'Member'},
    {value: 'derived', label: 'Derived'},
    {value: 'independent', label: 'Independent'}
  ];

  elementId: string;
  use: boolean = false;
  valueCode: ValueCodeType = null;
  codePresent: boolean;
  adjustVAlignClass = 'd-flex';
  extensionsService: ExtensionsService = inject(ExtensionsService);
  formService = inject(FormService);
  ObservationExtractComponent = ObservationExtractComponent;
  faWarning = faExclamationTriangle;

  constructor() {
    super();
    this.elementId = 'observationExtract_'+ObservationExtractComponent.seqNum++;
    this.subscriptions = [];
  }

  /**
   * Read extension and initialize properties.
   */
  ngOnInit() {
    super.ngOnInit();
    this.init();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.extensionsService.extensionsObservable.subscribe(() => {
      this.init();
    });
    // Watch code for warning.
    this.formProperty.root.getProperty('code').valueChanges.subscribe((code) => {
      const visible = this.formProperty.root.getProperty('code').visible;
      this.codePresent = visible && code?.length > 0 && code[0]?.code?.trim().length > 0;
      this.adjustVAlignClass = !this.codePresent && this.use ? '' : 'd-flex';
    });
  }

  /**
   * Initialize component properties based on extension.
   */
  init() {
    const obsExt = this.getExtension();
    if(obsExt?.valueBoolean || obsExt?.valueCode) {
      this.use = true;
    }
    if(obsExt?.valueCode) {
      this.valueCode = obsExt.valueCode as ValueCodeType;
    }
  }

  /**
   * Get extension object.
   */
  getExtension(): fhir.Extension {
    const ext = this.extensionsService.getExtensionsByUrl(ObservationExtractComponent.extUrl);
    return ext && ext.length > 0 ? ext[0] : null;
  }

  /**
   * Handle radio buttons for yes/no.
   * @param event - Angular event.
   */
  onUseChange(event: boolean) {
    this.use = event;
    this.adjustVAlignClass = !this.codePresent && this.use ? '' : 'd-flex';
    this.updateExtension();
  }

  /**
   * Handle relationship type change.
   * @param event
   */
  onRelationshipChange(event: ValueCodeType) {
    this.valueCode = event;
    this.updateExtension();
  }

  /**
   * Handle scroll to code field link click.
   */
  onScrollToCode() {
    this.formService.scrollToCodeField();
  }
  /**
   * Update extension in the form property.
   */
  updateExtension() {
    const ext = this.getExtension();
    const newExt = this.createExtension();
    if(!(newExt?.valueCode === ext?.valueCode && newExt?.valueBoolean === ext?.valueBoolean)) {
      this.reset(this.createExtension());
    }
  }


  /**
   * Set the extension if the input has a value, otherwise remove if exists.
   * @param ext - fhir.Extension object representing observation extract.
   */
  reset(ext: fhir.Extension) {
    if(ext && (ext.valueBoolean || ext.valueCode)) {
      this.extensionsService.updateOrAppendExtensionByUrl(ObservationExtractComponent.extUrl, ext);
    }
    else {
      this.extensionsService.removeExtensionsByUrl(ObservationExtractComponent.extUrl);
    }
  }


  /**
   * Create observation link period extension object
   *
   */
  createExtension(): fhir.Extension {
    if(!this.use) {
      return null;
    }
    const ret: fhir.Extension = {
      url: ObservationExtractComponent.extUrl
    };
    if(this.valueCode) {
      ret.valueCode = this.valueCode;
    }
    else {
      ret.valueBoolean = true;
    }
    return ret;
  }

}
