import { TestBed } from '@angular/core/testing';

import { ImportQuestionnaireService } from './import.questionnaire.service';
import {EXTENSION_URL_QUESTIONNAIRE_HIDDEN} from '../lib/constants/constants';

describe('ImportQuestionnaireService', () => {
  let service: ImportQuestionnaireService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportQuestionnaireService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should project a true questionnaire-hidden extension into the item editor state', () => {
    const extension = [{
      url: EXTENSION_URL_QUESTIONNAIRE_HIDDEN,
      valueBoolean: true
    }];
    const item: any = {extension};

    service.updateExtensionRelatedCustomFields(item);

    expect(item.__$hidden).toBeTrue();
    expect(item.extension).toBe(extension);
    expect(item.extension[0].valueBoolean).toBeTrue();
  });

  it('should show false as disabled without dropping the imported extension', () => {
    const extension = [{
      url: EXTENSION_URL_QUESTIONNAIRE_HIDDEN,
      valueBoolean: false
    }];
    const item: any = {extension};

    service.updateExtensionRelatedCustomFields(item);

    expect(item.__$hidden).toBeFalse();
    expect(item.extension).toBe(extension);
    expect(item.extension[0]).toEqual({
      url: EXTENSION_URL_QUESTIONNAIRE_HIDDEN,
      valueBoolean: false
    });
  });

  it('should treat any true extension as hidden without rewriting duplicate imports', () => {
    const extension = [
      {url: EXTENSION_URL_QUESTIONNAIRE_HIDDEN, valueBoolean: true},
      {url: EXTENSION_URL_QUESTIONNAIRE_HIDDEN, valueBoolean: false}
    ];
    const item: any = {extension};

    service.updateExtensionRelatedCustomFields(item);

    expect(item.__$hidden).toBeTrue();
    expect(item.extension).toBe(extension);
    expect(item.extension.length).toBe(2);
  });
});
