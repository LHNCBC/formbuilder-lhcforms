import fhir from 'fhir/r4';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../../constants/constants';
import {
  buildTemplateExtractExtension,
  getContainedResourceOptions,
  hasTemplateExtractReference,
  parseTemplateExtractExtension
} from './template-extract.util';

describe('templateExtract utilities', () => {
  it('parses and rebuilds all standard child slices', () => {
    const extension: fhir.Extension = {
      id: 'outer-id',
      url: EXTENSION_URL_TEMPLATE_EXTRACT,
      extension: [
        {id: 'template-id', url: 'template', valueReference: {reference: '#patient', display: 'Patient template'}},
        {url: 'fullUrl', valueString: '%patientId'},
        {url: 'resourceId', valueString: "'patient-1'"},
        {url: 'ifNoneMatch', valueString: "'*'"},
        {url: 'ifModifiedSince', valueString: '%resource.authored'},
        {url: 'ifMatch', valueString: "'W/1'"},
        {url: 'ifNoneExist', valueString: "'identifier=123'"}
      ]
    };

    const model = parseTemplateExtractExtension(extension);
    expect(model.templateReference).toBe('#patient');
    expect(model.fullUrl).toBe('%patientId');
    expect(model.ifNoneExist).toBe("'identifier=123'");

    model.templateReference = '#replacement';
    model.ifMatch = '';
    const rebuilt = buildTemplateExtractExtension(model);
    expect(rebuilt.id).toBe('outer-id');
    expect(rebuilt.valueReference).toBeUndefined();
    expect(rebuilt.extension.find(child => child.url === 'template')).toEqual({
      id: 'template-id',
      url: 'template',
      valueReference: {reference: '#replacement', display: 'Patient template'}
    });
    expect(rebuilt.extension.some(child => child.url === 'ifMatch')).toBeFalse();
  });

  it('preserves open-slice child extensions when editing known fields', () => {
    const extension: fhir.Extension = {
      url: EXTENSION_URL_TEMPLATE_EXTRACT,
      extension: [
        {url: 'template', valueReference: {reference: '#patient'}},
        {url: 'http://example.org/custom', valueCode: 'custom'}
      ]
    };

    const rebuilt = buildTemplateExtractExtension(parseTemplateExtractExtension(extension));
    expect(rebuilt.extension).toContain(jasmine.objectContaining({
      url: 'http://example.org/custom',
      valueCode: 'custom'
    }));
  });

  it('lists every existing contained resource that has an id', () => {
    const questionnaire: fhir.Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      contained: [
        {resourceType: 'ValueSet', id: 'vs1', status: 'draft'},
        {resourceType: 'Patient', id: 'patient-template'},
        {resourceType: 'Observation', status: 'final', code: {text: 'No id'}}
      ]
    };

    expect(getContainedResourceOptions(questionnaire)).toEqual([
      {reference: '#vs1', label: 'ValueSet #vs1'},
      {reference: '#patient-template', label: 'Patient #patient-template'}
    ]);
  });

  it('finds references at the root and in nested items', () => {
    /**
     * Build a templateExtract extension with only a template child.
     *
     * @param reference - Local reference to the template resource, e.g. '#root-template'.
     * @returns The templateExtract extension.
     */
    const templateExtension = (reference: string): fhir.Extension => ({
      url: EXTENSION_URL_TEMPLATE_EXTRACT,
      extension: [{url: 'template', valueReference: {reference}}]
    });
    const questionnaire: fhir.Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      extension: [templateExtension('#root-template')],
      item: [{
        linkId: 'group',
        text: 'Group',
        type: 'group',
        item: [{
          linkId: 'question',
          text: 'Question',
          type: 'string',
          extension: [templateExtension('#item-template')]
        }]
      }]
    };

    expect(hasTemplateExtractReference(questionnaire, 'root-template')).toBeTrue();
    expect(hasTemplateExtractReference(questionnaire, 'item-template')).toBeTrue();
    expect(hasTemplateExtractReference(questionnaire, 'other')).toBeFalse();
  });
});
