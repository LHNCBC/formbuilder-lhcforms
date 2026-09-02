import { TestBed } from '@angular/core/testing';

import { ImportQuestionnaireService } from './import.questionnaire.service';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../lib/constants/constants';

describe('ImportQuestionnaireService', () => {
  let service: ImportQuestionnaireService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportQuestionnaireService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('copies repeatable templateExtract extensions into the widget field', () => {
    const extension = (reference: string) => ({
      url: EXTENSION_URL_TEMPLATE_EXTRACT,
      extension: [{url: 'template', valueReference: {reference}}]
    });
    const parent: any = {extension: [extension('#one'), extension('#two')]};

    service.updateExtensionRelatedCustomFields(parent);

    expect(parent.__$templateExtract.length).toBe(2);
    expect(parent.__$templateExtract[0].extension[0].valueReference.reference).toBe('#one');
    expect(parent.__$templateExtract[1].extension[0].valueReference.reference).toBe('#two');
  });
});
