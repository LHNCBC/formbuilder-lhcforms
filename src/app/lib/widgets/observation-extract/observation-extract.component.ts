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
  // Whether the selected relationship has no extracted ancestor item to relate to.
  relationshipWithoutParent = false;
  adjustVAlignClass = 'd-flex';
  extensionsService: ExtensionsService = inject(ExtensionsService);
  formService = inject(FormService);
  ObservationExtractComponent = ObservationExtractComponent;
  faWarning = faExclamationTriangle;

  /**
   * Get the observationExtract boolean of a questionnaire, item, or code. As in LHC-Forms,
   * only the first observationExtract extension is considered.
   * @param extensions - Extensions to inspect.
   * @returns The valueBoolean, or undefined if the extension is absent or uses valueCode.
   */
  static getExtractBoolean(extensions: fhir.Extension[] = []): boolean | undefined {
    const value = extensions.find(extension => extension.url === ObservationExtractComponent.extUrl)?.valueBoolean;
    return typeof value === 'boolean' ? value : undefined;
  }

  /**
   * Check whether an item whose observationExtract uses a relationship code (valueCode) is
   * extracted. LHC-Forms extracts it only when the nearest ancestor with an observationExtract
   * boolean has true, or when one of the item's codes is marked for extraction.
   * @param ancestorExtensions - Extension lists of the ancestors, from the parent item up to
   *   the questionnaire.
   * @param codes - Codes of the item.
   * @returns Whether the item is extracted.
   */
  static isRelationshipItemExtracted(ancestorExtensions: fhir.Extension[][], codes: fhir.Coding[] = []): boolean {
    const inherited = ancestorExtensions
      .map(extensions => ObservationExtractComponent.getExtractBoolean(extensions))
      .find(value => value !== undefined);
    return inherited === true ||
      codes.some(coding => ObservationExtractComponent.getExtractBoolean(coding.extension) === true);
  }

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
      this.updateRelationshipWarning();
    });
  }

  /**
   * Initialize component properties based on extension. The widget is reused when another
   * item is selected, so the state is always taken from that item's extension.
   */
  init() {
    const obsExt = this.getExtension();
    this.use = !!(obsExt?.valueBoolean || obsExt?.valueCode);
    this.valueCode = (obsExt?.valueCode as ValueCodeType) || null;
    this.adjustVAlignClass = !this.codePresent && this.use ? '' : 'd-flex';
    this.updateRelationshipWarning();
  }

  /**
   * Warn when a relationship is selected but no ancestor item (or the questionnaire) has
   * observation extraction set to Yes, because the item is then not extracted.
   */
  updateRelationshipWarning() {
    if(!this.use || !this.valueCode) {
      this.relationshipWithoutParent = false;
      return;
    }
    const ancestorExtensions: fhir.Extension[][] = [];
    // Walk up from the parent; the virtual root of the tree has no extensions. Util.traverseAncestors()
    // is not used, because importing Util here creates a circular import.
    for(let node = this.formService.treeModel?.getFocusedNode()?.parent; node; node = node.parent) {
      ancestorExtensions.push(node.data?.extension || []);
    }
    ancestorExtensions.push(this.formService.formLevelExtensionService.getExtensionsByUrl(ObservationExtractComponent.extUrl));
    const codes = this.formProperty?.root?.getProperty('code')?.value || [];
    this.relationshipWithoutParent = !ObservationExtractComponent.isRelationshipItemExtracted(ancestorExtensions, codes);
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
    this.updateRelationshipWarning();
  }

  /**
   * Handle relationship type change.
   * @param event
   */
  onRelationshipChange(event: ValueCodeType) {
    this.valueCode = event;
    this.updateExtension();
    this.updateRelationshipWarning();
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
      // Rebuild the extension property in place. Changing the extension array value directly can
      // be lost, for example when switching the relationship from Member back to None.
      this.extensionsService.replaceAllExtensionsByUrl(ObservationExtractComponent.extUrl, [ext]);
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
