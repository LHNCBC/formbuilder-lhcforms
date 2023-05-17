import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {StringComponent} from '../string/string.component';
import {Subscription} from 'rxjs';

@Component({
  selector: 'lfb-answer-value-set',
  templateUrl: './answer-value-set.component.html',
  styleUrls: ['./answer-value-set.component.css']
})
export class AnswerValueSetComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {

  static snomedBaseUrl = 'https://snowstorm.ihtsdotools.org/fhir/ValueSet/';
  snomedUrl = '';
  nonSnomedUrl = '';
  valueSetType = 'snomed-value-set';
  ecl = '';
  searchParams = new URLSearchParams('url=http://snomed.info/sct/900000000000207008/version/20221231?fhir_vs=ecl/%3C%20404684003%20%7CClinical%20finding%20(finding)%7C&count=20&offset=0&filter=&language=en');
  subscriptions: Subscription[] = [];

  ngOnInit() {
    super.ngOnInit();
    const val = this.formProperty.value;
    if(val && val.startsWith(AnswerValueSetComponent.snomedBaseUrl)) {
      this.snomedUrl = val;
      this.ecl = this.parseECL(val);
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
        if(val && val.startsWith(AnswerValueSetComponent.snomedBaseUrl)) {
          this.snomedUrl = val;
          this.ecl = this.parseECL(val);
        }
        else {
          this.snomedUrl = '';
        }
      }
      else if(newVal === 'value-set') {
        if(val && !val.startsWith(AnswerValueSetComponent.snomedBaseUrl)) {
          this.nonSnomedUrl = val;
        }
      }
    });
    this.subscriptions.push(sub);
  }

  updateUrl(ecl: string) {
    let snomedUrl = '';
    this.ecl = ecl;
    if(ecl) {
      this.searchParams.set('ecl', ecl);
      const searchParams = this.searchParams.toString();
      snomedUrl = new URL('$expand?'+searchParams, AnswerValueSetComponent.snomedBaseUrl).toString();
    }
    this.snomedUrl = snomedUrl;
    this.formProperty.setValue(snomedUrl, false);
  }

  parseECL(url: string): string {
    let ret = '';
    if(url) {
      ret = new URL(url).searchParams.get('ecl') || '';
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
