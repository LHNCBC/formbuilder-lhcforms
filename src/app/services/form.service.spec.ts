import { TestBed } from '@angular/core/testing';

import { FormService } from './form.service';
import sampleJson from '../../../e2e/src/fixtures/help-text-sample.json';
import traverse from 'traverse';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

fdescribe('FormService', () => {
  let service: FormService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [NgbModal, HttpClient, HttpHandler]});
    service = TestBed.inject(FormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update _$helpText', () => {
    const clonedSample = traverse(sampleJson).clone();
    service.validateFhirQuestionnaire(clonedSample);
    expect(clonedSample.item[0].__$helpText).toBe(sampleJson.item[0].item[0].text);
    expect(clonedSample.item[0].item).toBeUndefined();
  });
});
