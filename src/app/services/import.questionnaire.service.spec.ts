import { TestBed } from '@angular/core/testing';

import { ImportQuestionnaireService } from './import.questionnaire.service';
import {
  EXTENSION_URL_CHOICE_ORIENTATION,
  EXTENSION_URL_COLUMN_COUNT,
  EXTENSION_URL_COLUMN_COUNT_LEGACY,
  EXTENSION_URL_QUESTIONNAIRE_HIDDEN
} from '../lib/constants/constants';

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

  it('should map horizontal choice orientation and canonical column count extensions to custom fields', () => {
    const item: any = {
      extension: [
        {
          url: EXTENSION_URL_CHOICE_ORIENTATION,
          valueCode: 'horizontal'
        },
        {
          url: EXTENSION_URL_COLUMN_COUNT,
          valuePositiveInt: 3
        }
      ]
    };

    service.updateExtensionRelatedCustomFields(item);

    expect(item.__$choiceOrientation).toBe('horizontal');
    expect(item.__$columnCount).toBe(3);
  });

  it('should map vertical choice orientation extension to custom field', () => {
    const item: any = {
      extension: [
        {
          url: EXTENSION_URL_CHOICE_ORIENTATION,
          valueCode: 'vertical'
        }
      ]
    };

    service.updateExtensionRelatedCustomFields(item);

    expect(item.__$choiceOrientation).toBe('vertical');
  });

  it('should map legacy column count extension to custom field', () => {
    const item: any = {
      extension: [
        {
          url: EXTENSION_URL_COLUMN_COUNT_LEGACY,
          valueInteger: 2
        }
      ]
    };

    service.updateExtensionRelatedCustomFields(item);

    expect(item.__$columnCount).toBe(2);
  });

  [
    {
      description: 'canonical extension first',
      extensions: [
        {
          url: EXTENSION_URL_COLUMN_COUNT,
          valuePositiveInt: 3
        },
        {
          url: EXTENSION_URL_COLUMN_COUNT_LEGACY,
          valueInteger: 2
        }
      ]
    },
    {
      description: 'legacy extension first',
      extensions: [
        {
          url: EXTENSION_URL_COLUMN_COUNT_LEGACY,
          valueInteger: 2
        },
        {
          url: EXTENSION_URL_COLUMN_COUNT,
          valuePositiveInt: 3
        }
      ]
    }
  ].forEach(({description, extensions}) => {
    it(`should prefer canonical column count when the ${description}`, () => {
      const item: any = {extension: extensions};

      service.updateExtensionRelatedCustomFields(item);

      expect(item.__$columnCount).toBe(3);
    });
  });
});
