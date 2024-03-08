import { TestBed } from '@angular/core/testing';

import { FormService } from './form.service';
import sampleJson from '../../../cypress/fixtures/help-text-sample.json';
import traverse from 'traverse';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CommonTestingModule} from '../testing/common-testing.module';

describe('FormService', () => {
  let service: FormService;

  CommonTestingModule.setUpTestBedConfig({providers: [NgbModal, HttpClient, HttpHandler]});

  beforeEach(async () => {
    service = TestBed.inject(FormService);
    expect(window['LForms']).toBeDefined();
  });

  it('should be created', async () => {
    expect(service).toBeTruthy();
    expect(service.lformsVersion).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
  });

  it('should update __$helpText', () => {
    const clonedSample = traverse(sampleJson).clone();
    service.validateFhirQuestionnaire(clonedSample);
    expect(clonedSample.item[0].__$helpText).toBe(sampleJson.item[0].item[0].text);
    expect(clonedSample.item[0].item).toBeUndefined();
  });

});
