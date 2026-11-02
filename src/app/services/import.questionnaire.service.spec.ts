import { TestBed } from '@angular/core/testing';

import { ImportQuestionnaireService } from './import.questionnaire.service';
import {
  EXTENSION_URL_TEMPLATE_EXTRACT,
  EXTENSION_URL_CHOICE_ORIENTATION,
  EXTENSION_URL_COLUMN_COUNT,
  EXTENSION_URL_COLUMN_COUNT_LEGACY,
  EXTENSION_URL_QUESTIONNAIRE_HIDDEN
} from '../lib/constants/constants';
import fhir from 'fhir/r4';
import {Util} from '../lib/util';

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
    /**
     * Build a templateExtract extension with only a template child.
     *
     * @param reference - Local reference to the template resource, e.g. '#one'.
     * @returns The templateExtract extension.
     */
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

  it('leaves opaque contained resources, such as help items of a contained Questionnaire, unchanged', () => {
    /**
     * Build a string item with a help display item.
     *
     * @param linkId - linkId of the string item.
     * @returns The item.
     */
    const itemWithHelp = (linkId: string): fhir.QuestionnaireItem => ({
      linkId,
      type: 'string',
      text: 'Question',
      item: [{
        linkId: `${linkId}-help`,
        type: 'display',
        text: 'Help text',
        extension: [{
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{system: 'http://hl7.org/fhir/questionnaire-item-control', code: 'help'}]
          }
        }]
      }]
    });
    const contained: any[] = [
      {resourceType: 'Questionnaire', id: 'template', status: 'draft', item: [itemWithHelp('nested')]},
      {resourceType: 'Patient', id: 'pt', extension: [{url: 'http://example.org/x', valueString: 'x'}]}
    ];
    const questionnaire: fhir.Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      contained: JSON.parse(JSON.stringify(contained)),
      item: [itemWithHelp('root')]
    };

    service.updateRawQuestionnaire(questionnaire, {} as any);

    expect(questionnaire.contained).toEqual(contained);
    // The help item of the questionnaire itself is still converted for editing.
    expect((questionnaire.item[0] as any).__$helpText.linkId).toBe('root-help');
    expect(questionnaire.item[0].item).toBeUndefined();

    const exported = Util.convertToQuestionnaireJSON(questionnaire);
    expect(exported.contained).toEqual(contained);
    expect(exported.item[0].item.map((item) => item.linkId)).toEqual(['root-help']);
  });
});
