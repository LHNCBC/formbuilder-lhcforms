import {AfterViewInit, Component, inject, OnDestroy, OnInit} from '@angular/core';
import {StringComponent} from '../string/string.component';
import {Subscription} from 'rxjs';
import {FetchService, SNOMEDEditions} from '../../../services/fetch.service';
import {FormService} from '../../../services/form.service';


@Component({
  selector: 'lfb-answer-value-set',
  templateUrl: './answer-value-set.component.html',
  styleUrls: ['./answer-value-set.component.css']
})
export class AnswerValueSetComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {

  static snomedBaseUri = 'http://snomed.info/sct';
  snomedEditions: SNOMEDEditions = null;
  snomedEdition = '900000000000207008'; // Default international edition.
  snomedVersion = '' // Empty implies latest version.
  snomedUrl = '';
  nonSnomedUrl = '';
  valueSetType = 'snomed-value-set';
  snomedFhirVS = '';
  url = new URL(AnswerValueSetComponent.snomedBaseUri);
  subscriptions: Subscription[] = [];
  eclPrefixRE = /^ecl\s*\//i;
  parseEditionRE = /sct\/([^\/]+)?(\/version\/([^\/]+))?/;

  fetchService = inject(FetchService);
  formService = inject(FormService);

  ngOnInit() {
    super.ngOnInit();
    this.snomedEditions = this.fetchService.snomedEditions;
    this.updateUI(this.formProperty.value);
    const sub = this.formService.formReset$.subscribe(() => {
      this.updateUI(this.formProperty.value);
    });
    this.subscriptions.push(sub);
  }
  ngAfterViewInit() {
    super.ngAfterViewInit();
    const asMethodsProp = this.formProperty.searchProperty('__$answerOptionMethods');
    const sub = asMethodsProp.valueChanges.subscribe((newVal) => {
      this.valueSetType = newVal;
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
    if(answerValueSetURI) {
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
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      if(sub) {
        sub.unsubscribe();
      }
    });
  }
}
