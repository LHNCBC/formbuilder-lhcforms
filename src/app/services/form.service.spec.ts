import { TestBed } from '@angular/core/testing';

import { FormService } from './form.service';
import sampleJson from '../../../cypress/fixtures/help-text-sample.json';
import traverse from 'traverse';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

describe('FormService', () => {
  let service: FormService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [NgbModal, HttpClient, HttpHandler]});
    service = TestBed.inject(FormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update __$helpText', () => {
    const clonedSample = traverse(sampleJson).clone();
    service.validateFhirQuestionnaire(clonedSample);
    expect(clonedSample.item[0].__$helpText).toBe(sampleJson.item[0].item[0].text);
    expect(clonedSample.item[0].item).toBeUndefined();
  });

  it('should traverse to ancestors', () => {
    const e = 'x';
    const d: any = {e};
    const c: any = {d};
    const b: any = {c};
    const a: any = {b};
    b.parent = a;
    c.parent = b;
    d.parent = c;

    let reply = service.traverseAncestors(d, (n) => {return true});
    expect(reply).toEqual([d, c, b, a]);
    reply = service.traverseAncestors(d, (n) => {return n !== c});
    expect(reply).toEqual([d, c]);
    reply = service.traverseAncestors(b, (n) => {return true});
    expect(reply).toEqual([b, a]);
  });
});
