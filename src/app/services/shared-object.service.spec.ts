import { TestBed } from '@angular/core/testing';
import fhir from 'fhir/r4';

import { SharedObjectService } from './shared-object.service';

describe('ShareService', () => {
  let service: SharedObjectService;
  let currentQuestionnaire: fhir.Questionnaire;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedObjectService);
    currentQuestionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      title: 'Current title',
      item: [{linkId: 'q1', type: 'string', text: 'Question 1'}]
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('composeQuestionnaire', () => {
    it('combines form-level values with the current items', () => {
      service.currentQuestionnaire = currentQuestionnaire;
      const formLevelValue: fhir.Questionnaire = {resourceType: 'Questionnaire', status: 'draft', title: 'Edited title'};

      const composed = service.composeQuestionnaire(formLevelValue);

      expect(composed.title).toBe('Edited title');
      expect(composed.item).toBe(currentQuestionnaire.item);
      expect(formLevelValue).toEqual({resourceType: 'Questionnaire', status: 'draft', title: 'Edited title'});
    });

    it('returns the current Questionnaire for a value that is not form-level', () => {
      service.currentQuestionnaire = currentQuestionnaire;

      expect(service.composeQuestionnaire({linkId: 'q1', type: 'string'})).toBe(currentQuestionnaire);
      expect(service.composeQuestionnaire()).toBe(currentQuestionnaire);
    });

    it('keeps the form-level value as is when no Questionnaire is loaded', () => {
      const formLevelValue: fhir.Questionnaire = {resourceType: 'Questionnaire', status: 'draft'};

      expect(service.composeQuestionnaire(formLevelValue)).toEqual(formLevelValue);
      expect(service.composeQuestionnaire()).toBeNull();
    });
  });
});
