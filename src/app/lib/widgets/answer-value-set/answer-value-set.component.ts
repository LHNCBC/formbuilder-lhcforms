import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {StringComponent} from '../string/string.component';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lfb-answer-value-set',
  templateUrl: './answer-value-set.component.html',
  styleUrls: ['./answer-value-set.component.css']
})
export class AnswerValueSetComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {

  static snomedBaseUri = 'http://snomed.info';
  static snomedPath = 'sct/900000000000207008/version/20221231';
  snomedUrl = '';
  nonSnomedUrl = '';
  valueSetType = 'snomed-value-set';
  snomedFhirVS = '';
  url = new URL(AnswerValueSetComponent.snomedPath, AnswerValueSetComponent.snomedBaseUri);
  subscriptions: Subscription[] = [];
  eclPrefixRE = /^ecl\s*\//i;

  ngOnInit() {
    super.ngOnInit();
    const val = this.formProperty.value;
    if(val && val.startsWith(AnswerValueSetComponent.snomedBaseUri)) {
      this.snomedUrl = val;
      this.snomedFhirVS = this.parseECL(val);
    }
    else {
      this.snomedUrl = '';
    }
    const asMethodsProp = this.formProperty.searchProperty('__$answerOptionMethods');
    this.valueSetType = asMethodsProp.value;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    const asMethodsProp = this.formProperty.searchProperty('__$answerOptionMethods');
    const sub = asMethodsProp.valueChanges.subscribe((newVal) => {
      this.valueSetType = newVal;
      const val = this.formProperty.value;
      if(newVal === 'snomed-value-set') {
        if(val && val.startsWith(AnswerValueSetComponent.snomedBaseUri)) {
          this.snomedUrl = val;
          this.snomedFhirVS = this.parseECL(val);
        }
        else {
          this.snomedUrl = '';
        }
      }
      else if(newVal === 'value-set') {
        if(val && !val.startsWith(AnswerValueSetComponent.snomedBaseUri)) {
          this.nonSnomedUrl = val;
        }
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * ECL input handler
   *
   * @param ecl - ECL value from input box.
   */
  updateUrl(ecl: string) {
    let snomedUrl = '';
    this.snomedFhirVS = ecl;
    if(ecl) {
      ecl = this.eclPrefixRE.test(ecl) ? ecl : 'ecl/' + ecl;
      this.url.searchParams.set('fhir_vs', ecl);
      snomedUrl = this.url.toString();
    }
    this.snomedUrl = snomedUrl;
    this.formProperty.setValue(snomedUrl, false);
  }

  /**
   * Extract ECL from the url.
   */
  parseECL(url: string): string {
    let ret = '';
    if(url) {
      ret = new URL(url).searchParams.get('fhir_vs') || '';
      ret = ret.replace(this.eclPrefixRE, '');
    }
    return ret;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      if(sub) {
        sub.unsubscribe();
      }
    });
  }
}
