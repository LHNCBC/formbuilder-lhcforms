import copy from 'fast-copy';
import fhir from 'fhir/r4';
import {EXTENSION_URL_TEMPLATE_EXTRACT, EXTENSION_URL_TEMPLATE_EXTRACT_BUNDLE} from '../../constants/constants';
import {
  buildTemplateExtractExtension,
  findDuplicateTemplateExtractGroups,
  formatRowNumbers,
  getContainedResourceOptions,
  getDuplicateTemplateExtractDialogWarning,
  getDuplicateTemplateExtractTableWarning,
  getTemplateExtractSignature,
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
      valueReference: {reference: '#replacement'}
    });
    expect(rebuilt.extension.some(child => child.url === 'ifMatch')).toBeFalse();
  });

  it('keeps the template valueReference details only when the reference is unchanged', () => {
    const extension: fhir.Extension = {
      url: EXTENSION_URL_TEMPLATE_EXTRACT,
      extension: [{
        url: 'template',
        valueReference: {reference: '#pt', display: 'Patient template', type: 'Patient'}
      }]
    };

    const unchanged = buildTemplateExtractExtension(parseTemplateExtractExtension(extension));
    expect(unchanged.extension[0].valueReference).toEqual(
      {reference: '#pt', display: 'Patient template', type: 'Patient'}
    );

    const model = parseTemplateExtractExtension(extension);
    model.templateReference = '#obs';
    const changed = buildTemplateExtractExtension(model);
    expect(changed.extension[0].valueReference).toEqual({reference: '#obs'});
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

  it('finds templateExtractBundle references at the root and on items', () => {
    /**
     * Build a templateExtractBundle extension.
     *
     * @param reference - Local reference to the Bundle template, e.g. '#root-bundle'.
     * @returns The templateExtractBundle extension.
     */
    const bundleExtension = (reference: string): fhir.Extension => ({
      url: EXTENSION_URL_TEMPLATE_EXTRACT_BUNDLE,
      valueReference: {reference}
    });
    const questionnaire: fhir.Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      extension: [bundleExtension('#root-bundle')],
      item: [{linkId: 'q', text: 'Question', type: 'string', extension: [bundleExtension('#item-bundle')]}]
    };

    expect(hasTemplateExtractReference(questionnaire, 'root-bundle')).toBeTrue();
    expect(hasTemplateExtractReference(questionnaire, 'item-bundle')).toBeTrue();
    expect(hasTemplateExtractReference(questionnaire, 'other')).toBeFalse();
  });

  describe('expression children without expression text', () => {
    const dataAbsentReason: fhir.Element = {
      extension: [{url: 'http://hl7.org/fhir/StructureDefinition/data-absent-reason', valueCode: 'unknown'}]
    };
    const metadataOnlyChild = {url: 'fullUrl', id: 'full-url', _valueString: dataAbsentReason} as fhir.Extension;

    /**
     * Build a templateExtract extension with a metadata-only fullUrl child.
     *
     * @returns The templateExtract extension.
     */
    const createExtension = (): fhir.Extension => ({
      url: EXTENSION_URL_TEMPLATE_EXTRACT,
      extension: [
        {url: 'template', valueReference: {reference: '#patient'}},
        copy(metadataOnlyChild),
        {url: 'resourceId', valueString: "'patient-1'"}
      ]
    });

    it('keeps an unchanged metadata-only child', () => {
      const extension = createExtension();
      const model = parseTemplateExtractExtension(extension);
      expect(model.fullUrl).toBe('');

      expect(buildTemplateExtractExtension(model)).toEqual(extension);
    });

    it('keeps the metadata when an expression is added to the child', () => {
      const model = parseTemplateExtractExtension(createExtension());
      model.fullUrl = '%patientId';

      expect(buildTemplateExtractExtension(model).extension[1]).toEqual({
        ...metadataOnlyChild,
        valueString: '%patientId'
      } as fhir.Extension);
    });

    it('removes a cleared child that had an expression, with its metadata', () => {
      const extension = createExtension();
      (extension.extension[2] as any)._valueString = dataAbsentReason;
      const model = parseTemplateExtractExtension(extension);
      model.resourceId = '';

      const rebuilt = buildTemplateExtractExtension(model);
      expect(rebuilt.extension.map(child => child.url)).toEqual(['template', 'fullUrl']);
    });
  });

  describe('duplicate detection', () => {
    /**
     * Build a templateExtract extension with a template and optional expression children.
     *
     * @param reference - Local template reference.
     * @param children - Additional child extensions.
     * @returns The templateExtract extension.
     */
    const occurrence = (reference: string, children: fhir.Extension[] = []): fhir.Extension => ({
      url: EXTENSION_URL_TEMPLATE_EXTRACT,
      extension: [{url: 'template', valueReference: {reference}}, ...children]
    });

    it('groups rows with the same template and identical trimmed expressions', () => {
      const extensions = [
        occurrence('#a', [{url: 'fullUrl', valueString: '%id'}]),
        occurrence('#a', [{url: 'fullUrl', valueString: '%other'}]),
        occurrence('#b', [{url: 'fullUrl', valueString: '%id'}]),
        // Whitespace and unknown child extensions do not change the extraction instruction.
        occurrence('#a', [
          {url: 'fullUrl', valueString: ' %id '},
          {url: 'http://example.org/custom', valueCode: 'x'}
        ]),
        occurrence('#b'),
        occurrence('#b', [{url: 'resourceId', valueString: '   '}])
      ];

      expect(findDuplicateTemplateExtractGroups(extensions)).toEqual([[0, 3], [4, 5]]);
    });

    it('reports no duplicates for distinct rows or an empty list', () => {
      expect(findDuplicateTemplateExtractGroups([occurrence('#a'), occurrence('#b')])).toEqual([]);
      expect(findDuplicateTemplateExtractGroups([])).toEqual([]);
      expect(getDuplicateTemplateExtractTableWarning([])).toBe('');
      expect(getDuplicateTemplateExtractDialogWarning([])).toBe('');
    });

    it('distinguishes the same expression in different fields', () => {
      const fullUrl = occurrence('#a', [{url: 'fullUrl', valueString: '%id'}]);
      const resourceId = occurrence('#a', [{url: 'resourceId', valueString: '%id'}]);
      expect(getTemplateExtractSignature(parseTemplateExtractExtension(fullUrl)))
        .not.toBe(getTemplateExtractSignature(parseTemplateExtractExtension(resourceId)));
    });

    it('formats row numbers', () => {
      expect(formatRowNumbers([2])).toBe('Row 2');
      expect(formatRowNumbers([1, 3])).toBe('Rows 1 and 3');
      expect(formatRowNumbers([1, 2, 4])).toBe('Rows 1, 2, and 4');
    });

    it('builds the table and dialog warnings', () => {
      const consequence =
        'Each occurrence is extracted separately, which may create duplicate or conflicting Bundle entries.';
      expect(getDuplicateTemplateExtractTableWarning([[0, 2], [1, 3, 4]])).toBe(
        'Rows 1 and 3 use the same template with identical expressions. ' +
        'Rows 2, 4, and 5 use the same template with identical expressions. ' + consequence
      );
      expect(getDuplicateTemplateExtractDialogWarning([2])).toBe(
        'Row 2 at this level already uses the same template with identical expressions. ' + consequence
      );
      expect(getDuplicateTemplateExtractDialogWarning([1, 3])).toBe(
        'Rows 1 and 3 at this level already use the same template with identical expressions. ' + consequence
      );
    });
  });
});
