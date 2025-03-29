import {AfterViewInit, Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation} from '@angular/core';
import {StringComponent} from '../string/string.component';
import {Subscription} from 'rxjs';
import {FetchService, SNOMEDEditions} from '../../../services/fetch.service';
import {FormService} from '../../../services/form.service';
import {ExtensionsService} from '../../../services/extensions.service';
import {TerminologyServerComponent} from '../terminology-server/terminology-server.component';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import {NgbTooltip} from '@ng-bootstrap/ng-bootstrap';
import {Util} from '../../util';

@Component({
  standalone: false,
  selector: 'lfb-answer-value-set',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './answer-value-set.component.html',
  styleUrls: ['./answer-value-set.component.css']
})
export class AnswerValueSetComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {

  static snomedBaseUri = 'http://snomed.info/sct';
  static snomedTerminologyServer = 'https://snowstorm.ihtsdotools.org/fhir';
  static snomedTSHint = 'Note that this option also sets the terminology server option below (under "Advanced fields").';
  static nonSnomedTSHint = 'Make sure that you provide a valid URL for a supporting terminology server below (under Advanced fields).';

  eclHelpContent = `See the <a class="lfb-ngb-tooltip-link" target="_blank" (click)="eclTooltipClose($event)" ` +
                   `href="https://confluence.ihtsdotools.org/display/DOCECL">ECL documentation</a> for more information, or ` +
                   `try the ECL Builder in the <a class="lfb-ngb-tooltip-link" target="_blank" (click)="eclTooltipClose($event)" ` +
                   `href="https://browser.ihtsdotools.org/?perspective=full&languages=en">SNOMED CT Browser</a>. ` +
                   `In the browser, under the 'Expression Constraint Queries' tab, click the 'ECL Builder' button.`
  faInfo = faInfoCircle;
  @ViewChild('eclTooltip', {read: NgbTooltip}) eclTooltip: NgbTooltip;
  snomedEditions: SNOMEDEditions = null;
  snomedEdition = '900000000000207008'; // Default international edition.
  snomedVersion = '' // Empty implies latest version.
  snomedUrl = '';
  nonSnomedUrl = '';
  snomedFhirVS = '';
  url = new URL(AnswerValueSetComponent.snomedBaseUri);
  subscriptions: Subscription[] = [];
  eclPrefixRE = /^ecl\s*\//i;
  parseEditionRE = /sct\/([^\/]+)?(\/version\/([^\/]+))?/;

  fetchService = inject(FetchService);
  formService = inject(FormService);
  extensionService = inject(ExtensionsService);
  valueSetType = 'value-set';
  tsHint = AnswerValueSetComponent.nonSnomedTSHint;
  eclHelp = '';

  tooltipOpen = false;

  ngOnInit() {
    super.ngOnInit();
    this.snomedEditions = this.fetchService.snomedEditions;
    const asMethod = this.formProperty.searchProperty('__$answerOptionMethods').value;
    this.valueSetType = asMethod ? asMethod : this.valueSetType;
    this.updateUI(this.formProperty.value);
    const sub = this.formService.formReset$.subscribe(() => {
      const asmValue = this.formProperty.searchProperty('__$answerOptionMethods').value;
      this.valueSetType = asmValue ? asmValue : this.valueSetType;
      this.updateUI(this.formProperty.value);
    });
    this.subscriptions.push(sub);
  }
  ngAfterViewInit() {
    super.ngAfterViewInit();
    const asMethodsProp = this.formProperty.searchProperty('__$answerOptionMethods');
    const sub = asMethodsProp.valueChanges.subscribe((newVal) => {
      this.valueSetType = newVal;
      switch (this.valueSetType) {
        case 'snomed-value-set':
          this.tsHint = AnswerValueSetComponent.snomedTSHint;
          break;
        case 'value-set':
          this.tsHint = AnswerValueSetComponent.nonSnomedTSHint;
      }
      this.updateUI(this.formProperty.value);
    });
    this.subscriptions.push(sub);
  }

  /**
   * Update UI elements based on initial model value. Read the value of URI to figure out which radio button to select.
   * @param answerValueSetValue - Value of answerValueSet. Checks if its snomed URI and sets appropriate radio button.
   */
  updateUI(answerValueSetValue: string) {
    if(this.valueSetType === 'snomed-value-set') {
      if(answerValueSetValue) {
        this.updateSnomedFields(answerValueSetValue);
        this.snomedUrl = answerValueSetValue;
      }
      else {
        this.snomedUrl = '';
      }
    }
    else if(this.valueSetType === 'value-set') {
      if(answerValueSetValue) {
        this.nonSnomedUrl = answerValueSetValue;
      }
    }
  }


  /**
   * Format snomed URI based on UI actions.
   *
   */
  updateUrl() {
    let snomedUrl = '';
    this.url.pathname = '/sct/'
    this.url.pathname += this.snomedEdition ? this.snomedEdition : '';
    this.url.pathname += this.snomedVersion ? '/version/' + this.snomedVersion : '';
    // this.snomedFhirVS = args.ecl;
    if(this.snomedFhirVS && this.snomedEdition) {
      const ecl = this.eclPrefixRE.test(this.snomedFhirVS) ? this.snomedFhirVS : 'ecl/' + this.snomedFhirVS;
      this.url.searchParams.set('fhir_vs', ecl);
      snomedUrl = this.url.toString();
    }
    this.snomedUrl = snomedUrl;
    this.formProperty.setValue(snomedUrl, false);
  }

  /**
   * Handle onChange event.
   * @param event - DOM event object
   */
  onEclChange(event: Event) {
    this.setSNOMEDTerminologyServer(!!this.snomedUrl);
  }

  /**
   * Set SNOMED terminology server if the user enter ECL.
   *
   * @param isAdd - True is add, false is remove
   */
  setSNOMEDTerminologyServer(isAdd: boolean) {
    if(isAdd) {
      if(!this.extensionService.getFirstExtensionByUrl(TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI)) {
        this.extensionService.addExtension({
          url: TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI,
          valueUrl: AnswerValueSetComponent.snomedTerminologyServer
        }, 'valueUrl')
      }
    } else {
      this.extensionService.removeExtension((ext) => {
        return ext.value.url === TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI
                  && ext.value.valueUrl === AnswerValueSetComponent.snomedTerminologyServer;
      });
    }
  }

  /**
   * Handler for ECL field
   * @param ecl - ECL expression from input box.
   */
  onEclUpdate(ecl: string) {
    this.snomedFhirVS = ecl;
    this.updateUrl();
  }

  /**
   * Handler for snomed edition field.
   * @param id - Id of the snomed edition
   */
  onEditionUpdate(id: string) {
    this.snomedEdition = id;
    this.snomedVersion = ''; // Reset version when edition is changed.
    this.updateUrl();
  }

  /**
   * Handler for snomed version field.
   * @param version - Version of selected snomed edition.
   */
  onVersionUpdate(version: string) {
    this.snomedVersion = version;
    this.updateUrl();
  }

  /**
   * Parse answerValueSet URI to extract fhirVS, edition and version fields.
   */
  updateSnomedFields(answerValueSetURI: string) {
    if(answerValueSetURI && answerValueSetURI.startsWith(AnswerValueSetComponent.snomedBaseUri)) {
      const uri = new URL(answerValueSetURI);
      let ecl = uri.searchParams.get('fhir_vs') || '';
      ecl = ecl.replace(this.eclPrefixRE, '');
      this.snomedFhirVS = ecl;
      const matches = uri.pathname.match(this.parseEditionRE);
      if(matches) {
        this.snomedEdition = matches[1] ? matches[1] : '';
        this.snomedVersion = matches[3] ? matches[3] : '';
      }
    }
    else {
      this.snomedFhirVS = '';
      this.snomedEdition = '';
      this.snomedVersion = '';
    }
  }

  eclTooltipClose(evt: MouseEvent) {
    const relatedTarget = evt.relatedTarget as HTMLElement;

    if (!this.tooltipOpen || !relatedTarget)
      return;
    this.eclTooltip.close();
    this.tooltipOpen = false;
  }

  /**
   * Open ecl tooltip manually
   */
  eclTooltipOpen() {
    this.eclTooltip.open();
    this.tooltipOpen = true;
  }

  /**
   * Close ecl tooltip manually
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      if(sub) {
        sub.unsubscribe();
      }
    });
  }

  /**
   * Clean up the ARIA label by removing the anchor tags (<a> and </a>) from a given string and replacing them with a specified string.
   * @param input - the input string potentially including anchor tags.
   * @returns - string with the anchor tags removed.
   */
  getURLFreeAriaLabel(input: string): string {
    return Util.removeAnchorTagFromString(input, 'Link:', 'before');
  }
}
