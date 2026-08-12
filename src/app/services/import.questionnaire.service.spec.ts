import { TestBed } from '@angular/core/testing';

import { ImportQuestionnaireService } from './import.questionnaire.service';
import {
  EXTENSION_URL_CHOICE_ORIENTATION,
  EXTENSION_URL_COLUMN_COUNT,
  EXTENSION_URL_COLUMN_COUNT_LEGACY
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
