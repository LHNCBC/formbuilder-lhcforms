import { TestBed } from '@angular/core/testing';

import { FormService } from './form.service';
import sampleJson from '../../../tests/fixtures/help-text-sample1.json';
import traverse from 'traverse';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CommonTestingModule} from '../testing/common-testing.module';

describe('FormService', () => {
  let service: FormService;

  CommonTestingModule.setUpTestBedConfig({providers: [NgbModal, HttpClient, HttpHandler]});

  beforeEach(async () => {
    service = await TestBed.inject(FormService);
    await expect(window['LForms']).toBeDefined();
  });

  it('should be created', async () => {
    expect(service).toBeTruthy();
    expect(service.lformsVersion).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
  });

  it('should update __$helpText', () => {
    const clonedSample = traverse(sampleJson).clone();
    service.updateFhirQuestionnaire(clonedSample);
    expect(clonedSample.item[0].__$helpText).toEqual(sampleJson.item[0].item[2]);
    expect(clonedSample.item[0].item[2]).toBeUndefined();
  });

});
