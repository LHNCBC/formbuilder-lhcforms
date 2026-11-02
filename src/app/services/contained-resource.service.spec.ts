import fhir from 'fhir/r4';
import {ContainedResourceService, DuplicateContainedResourceIdError} from './contained-resource.service';

describe('ContainedResourceService', () => {
  let service: ContainedResourceService;

  beforeEach(() => {
    service = new ContainedResourceService();
  });

  it('imports an arbitrary resource without dropping unknown nested fields', () => {
    const prepared = service.prepareImportedResource(JSON.stringify({
      resourceType: 'Observation',
      id: 'observation-1',
      meta: {
        profile: ['http://hl7.org/fhir/4.0/StructureDefinition/Observation']
      },
      status: 'final',
      component: [{
        code: {text: 'Opaque component'},
        valueString: 'preserve me'
      }]
    }));

    expect((prepared.resource as any).component).toEqual([{
      code: {text: 'Opaque component'},
      valueString: 'preserve me'
    }]);
    expect(prepared.versionInfo).toEqual({
      version: 'R4',
      confidence: 'inferred',
      source: 'meta.profile'
    });
  });

  it('uses MIME fhirVersion as authoritative evidence', () => {
    const info = service.detectVersion(
      {resourceType: 'Patient'} as fhir.Resource,
      'application/fhir+json; fhirVersion=5.0'
    );

    expect(info).toEqual({version: 'R5', confidence: 'authoritative', source: 'content-type'});
  });

  it('imports a copied server resource with authoritative server-version provenance', () => {
    const serverResource = {
      resourceType: 'Practitioner',
      id: 'p2',
      meta: {lastUpdated: '2026-09-02T12:00:00Z'},
      active: true
    } as fhir.Practitioner;

    const prepared = service.prepareImportedResource(serverResource, [], '', 'R4');

    expect(prepared.resource).not.toBe(serverResource);
    expect(serverResource.meta.lastUpdated).toBe('2026-09-02T12:00:00Z');
    expect(prepared.resource.meta).toBeUndefined();
    expect(prepared.removedMetadata).toEqual(['meta.lastUpdated']);
    expect(prepared.versionInfo).toEqual({
      version: 'R4',
      confidence: 'authoritative',
      source: 'fhir-server'
    });
  });

  it('reports conflicting MIME and profile evidence as ambiguous', () => {
    const info = service.detectVersion({
      resourceType: 'Patient',
      meta: {profile: ['http://hl7.org/fhir/4.0/StructureDefinition/Patient']}
    } as fhir.Patient, 'application/fhir+json; fhirVersion=5.0');

    expect(info.version).toBeNull();
    expect(info.confidence).toBe('ambiguous');
    expect(info.details).toContain('R4');
    expect(info.details).toContain('R5');
  });

  it('falls back to the known Questionnaire version', () => {
    expect(service.detectVersion({resourceType: 'Patient'} as fhir.Resource, '', 'STU3'))
      .toEqual({version: 'STU3', confidence: 'inferred', source: 'questionnaire'});
  });

  it('generates an id and removes metadata prohibited on contained resources', () => {
    const prepared = service.prepareImportedResource(JSON.stringify({
      resourceType: 'Patient',
      meta: {
        versionId: '2',
        lastUpdated: '2026-01-01T00:00:00Z',
        security: [{code: 'R'}],
        tag: [{code: 'preserve'}]
      }
    }), [{resourceType: 'Patient', id: 'Patient-1'} as fhir.Resource]);

    expect(prepared.generatedId).toBeTrue();
    expect(prepared.resource.id).toBe('Patient-2');
    expect(prepared.removedMetadata).toEqual(['meta.versionId', 'meta.lastUpdated', 'meta.security']);
    expect((prepared.resource as any).meta).toEqual({tag: [{code: 'preserve'}]});
  });

  it('rejects malformed input, arrays, missing resourceType, nested resources, and duplicate ids', () => {
    expect(() => service.prepareImportedResource('{')).toThrowError('The selected file is not valid JSON.');
    expect(() => service.prepareImportedResource('[]'))
      .toThrowError('The selected file must contain one FHIR resource JSON object.');
    expect(() => service.prepareImportedResource('{}'))
      .toThrowError('The selected JSON does not have a valid resourceType.');
    expect(() => service.prepareImportedResource(JSON.stringify({
      resourceType: 'Patient',
      contained: [{resourceType: 'Observation'}]
    }))).toThrowError('A contained resource cannot contain nested resources.');
    expect(() => service.prepareImportedResource(
      JSON.stringify({resourceType: 'Patient', id: 'same-id'}),
      [{resourceType: 'Observation', id: 'same-id'} as fhir.Resource]
    )).toThrowError('A contained resource with id "same-id" already exists.');
  });

  it('rejects explicitly supplied non-string and empty ids instead of generating one', () => {
    [123, 0, true, false, null, ['abc'], {value: 'abc'}].forEach((id) => {
      expect(() => service.prepareImportedResource(JSON.stringify({resourceType: 'Patient', id})))
        .withContext(JSON.stringify(id))
        .toThrowError(`The resource id ${JSON.stringify(id)} must be a JSON string.`);
    });
    expect(() => service.prepareImportedResource(JSON.stringify({resourceType: 'Patient', id: ''})))
      .toThrowError('The resource id "" is not a valid FHIR id.');
  });

  it('detects a duplicate of an existing string id', () => {
    expect(() => service.prepareImportedResource(
      JSON.stringify({resourceType: 'Patient', id: '123'}),
      [{resourceType: 'Patient', id: '123'} as fhir.Resource]
    )).toThrowError('A contained resource with id "123" already exists.');
  });

  it('identifies the existing resource that uses a duplicate id', () => {
    let thrown: unknown;
    try {
      service.prepareImportedResource(
        JSON.stringify({resourceType: 'Patient', id: 'patient-1'}),
        [{resourceType: 'ValueSet', id: 'vs1'}, {resourceType: 'Patient', id: 'patient-1'}] as fhir.Resource[]
      );
    }
    catch(error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(DuplicateContainedResourceIdError);
    expect((thrown as DuplicateContainedResourceIdError).resourceId).toBe('patient-1');
    expect((thrown as DuplicateContainedResourceIdError).existingIndex).toBe(1);
  });

  it('does not report version issues for ValueSets, whether created or imported', () => {
    const records = [
      {
        resourceType: 'ValueSet',
        id: 'created-vs',
        info: {version: 'R5' as const, confidence: 'authoritative' as const, source: 'editor' as const}
      },
      {
        resourceType: 'ValueSet',
        id: 'imported-vs',
        info: {version: 'R4' as const, confidence: 'inferred' as const, source: 'questionnaire' as const}
      },
      {
        resourceType: 'ValueSet',
        id: 'unknown-vs',
        info: {version: null, confidence: 'unknown' as const, source: 'unknown' as const}
      }
    ];

    ['STU3', 'R4', 'R5'].forEach((target) => {
      expect(service.getCompatibilityIssues(records, target)).withContext(target).toEqual([]);
      expect(service.getCompatibilityWarning(records, target)).withContext(target).toBe('');
    });
  });

  it('describes how each resource version was recorded', () => {
    const warning = service.getCompatibilityWarning([
      {
        resourceType: 'Patient',
        id: 'created',
        info: {version: 'R5', confidence: 'authoritative', source: 'editor'}
      },
      {
        resourceType: 'Patient',
        id: 'imported',
        info: {version: 'R5', confidence: 'inferred', source: 'questionnaire'}
      },
      {
        resourceType: 'Patient',
        id: 'unknown',
        info: {version: null, confidence: 'unknown', source: 'unknown'}
      }
    ], 'R4');

    expect(warning).toContain('<li>Patient #created was created in Form Builder as FHIR R5.</li>');
    expect(warning).toContain('<li>Patient #imported was imported as FHIR R5.</li>');
    expect(warning).toContain('<li>Patient #unknown has an unknown FHIR version.</li>');
  });

  it('finds mismatched and unknown versions while accepting matching versions', () => {
    const records = [
      {
        resourceType: 'Patient',
        id: 'r4-patient',
        info: {version: 'R4' as const, confidence: 'inferred' as const, source: 'meta.profile' as const}
      },
      {
        resourceType: 'Observation',
        id: 'unknown-observation',
        info: {version: null, confidence: 'unknown' as const, source: 'unknown' as const}
      }
    ];

    expect(service.getCompatibilityIssues(records, 'R4').map((issue) => issue.kind))
      .toEqual(['unknown']);
    expect(service.getCompatibilityIssues(records, 'R5').map((issue) => issue.kind))
      .toEqual(['mismatch', 'unknown']);
    expect(service.getCompatibilityIssues(records, 'LHC-Forms')).toEqual([]);
  });

  it('restores autosaved provenance only to the matching contained resource', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      contained: [
        {resourceType: 'Patient', id: 'patient-1'},
        {resourceType: 'Observation', id: 'observation-1'}
      ]
    } as unknown as fhir.Questionnaire;
    const records = [{
      resourceType: 'Patient',
      id: 'patient-1',
      info: {version: 'R4' as const, confidence: 'inferred' as const, source: 'questionnaire' as const}
    }];

    service.applyVersionRecords(questionnaire, records);

    expect(service.getVersionInfo(questionnaire.contained[0])?.version).toBe('R4');
    expect(service.getVersionInfo(questionnaire.contained[1])).toBeNull();
  });

  it('escapes imported identifiers in compatibility warning HTML', () => {
    const warning = service.getCompatibilityWarning([{
      resourceType: '<Patient>',
      id: 'unsafe&value',
      info: {version: 'R4', confidence: 'inferred', source: 'questionnaire'}
    }], 'R5');

    expect(warning).toContain('&lt;Patient&gt; #unsafe&amp;value');
    expect(warning).not.toContain('<Patient>');
  });
});
