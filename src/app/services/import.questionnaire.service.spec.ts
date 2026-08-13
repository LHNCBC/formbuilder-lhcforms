import { TestBed } from '@angular/core/testing';

import { ImportQuestionnaireService } from './import.questionnaire.service';
import fhir from 'fhir/r4';

describe('ImportQuestionnaireService', () => {
  let service: ImportQuestionnaireService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportQuestionnaireService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should infer the source type for imported Attachment existence conditions', () => {
    const questionnaire: fhir.Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      item: [
        {linkId: 'source', text: 'Attachment source', type: 'attachment'},
        {
          linkId: 'dependent',
          text: 'Dependent',
          type: 'string',
          enableWhen: [{
            question: 'source',
            operator: 'exists',
            answerBoolean: false
          } as any]
        }
      ]
    };

    service.updateRawQuestionnaire(questionnaire, {} as any);
    expect((questionnaire.item[1].enableWhen[0] as any).__$answerType).toBe('attachment');
    expect(questionnaire.item[1].enableWhen[0].answerBoolean).toBeFalse();
  });
});
