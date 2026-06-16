import {TestBed} from '@angular/core/testing';
import {FormService} from './form.service';
import {
  SUBJECT_TYPE_COMPATIBILITY_DIALOG,
  SubjectTypeService
} from './subject-type.service';

describe('SubjectTypeService', () => {
  let service: SubjectTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SubjectTypeService,
        {
          provide: FormService,
          useValue: {
            flSchema: {
              properties: {
                subjectType: {
                  items: {
                    oneOf: [
                      {enum: ['Patient'], versions: ['R3', 'R4', 'R5', 'R6']},
                      {enum: ['CatalogEntry'], versions: ['R4']},
                      {enum: ['ActorDefinition'], versions: ['R5', 'R6']},
                      {enum: ['ChargeItem'], versions: ['R4', 'R5']},
                      {enum: ['MedicinalProductIndication'], versions: ['R4']}
                    ]
                  }
                }
              }
            }
          }
        }
      ]
    });
    service = TestBed.inject(SubjectTypeService);
  });

  it('should identify subjectType values that are not valid for a target FHIR version', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      subjectType: ['Patient', 'CatalogEntry', 'ActorDefinition']
    };

    expect(service.getInvalidSubjectTypesForVersion(questionnaire, 'R4')).toEqual(['ActorDefinition']);
    expect(service.getInvalidSubjectTypesForVersion(questionnaire, 'R5')).toEqual(['CatalogEntry']);
    expect(service.getInvalidSubjectTypesForVersion(questionnaire, 'R6')).toEqual(['CatalogEntry']);
    expect(service.getInvalidSubjectTypesForVersion(questionnaire, 'STU3')).toEqual(['CatalogEntry', 'ActorDefinition']);
  });

  it('should treat ChargeItem and MedicinalProductIndication as invalid in STU3 output', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      subjectType: ['Patient', 'ChargeItem', 'MedicinalProductIndication']
    };

    expect(service.getInvalidSubjectTypesForVersion(questionnaire, 'STU3'))
      .toEqual(['ChargeItem', 'MedicinalProductIndication']);
  });

  it('should skip subjectType compatibility checks for unsupported FHIR versions', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      subjectType: ['Patient', 'CatalogEntry', 'ActorDefinition']
    };

    expect(service.getInvalidSubjectTypesForVersion(questionnaire, 'not-a-version')).toEqual([]);
  });

  it('should build subjectType preview warning messages for STU3 using compatibility checks', () => {
    const warning = service.getSubjectTypeCompatibilityWarning(
      {subjectType: ['Patient', 'ActorDefinition']},
      'STU3',
      'preview'
    );

    expect(warning).toContain('not valid in FHIR STU3');
    expect(warning).toContain('<ul><li>ActorDefinition</li></ul>');
    expect(warning).toContain('STU3 output may fail validation');
  });

  it('should build subjectType compatibility warning messages', () => {
    const warning = service.getSubjectTypeCompatibilityWarning(
      {subjectType: ['Patient', 'CatalogEntry']},
      'R5',
      'import'
    );

    expect(warning).toContain('CatalogEntry');
    expect(warning).toContain('<ul><li>CatalogEntry</li></ul>');
    expect(warning).toContain('preserved');
  });

  it('should build subjectType import dialog messages', () => {
    const message = SUBJECT_TYPE_COMPATIBILITY_DIALOG.importMessage(
      'R5',
      service.formatSubjectTypeList(['CatalogEntry'])
    );

    expect(message).toContain('Some imported subject types are not valid in FHIR R5');
    expect(message).toContain('<ul><li>CatalogEntry</li></ul>');
    expect(message).toContain('What would you like to do?');
  });

  it('should build subjectType export dialog messages', () => {
    const message = SUBJECT_TYPE_COMPATIBILITY_DIALOG.exportMessage(
      'R4',
      service.formatSubjectTypeList(['ActorDefinition'])
    );

    expect(message).toContain('Some subject types are not valid in FHIR R4');
    expect(message).toContain('<ul><li>ActorDefinition</li></ul>');
    expect(message).toContain('only affects this export');
  });

  it('should remove subjectType values that are not valid for a target FHIR version from a copy', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      subjectType: ['Patient', 'ActorDefinition']
    };

    const exportQuestionnaire = service.removeInvalidSubjectTypesForVersion(questionnaire, 'R4');

    expect(exportQuestionnaire.subjectType).toEqual(['Patient']);
    expect(questionnaire.subjectType).toEqual(['Patient', 'ActorDefinition']);
  });

  it('should remove subjectType values incompatible with STU3 from a copy', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      subjectType: ['Patient', 'ActorDefinition']
    };

    const exportQuestionnaire = service.removeInvalidSubjectTypesForVersion(questionnaire, 'STU3');

    expect(exportQuestionnaire.subjectType).toEqual(['Patient']);
    expect(questionnaire.subjectType).toEqual(['Patient', 'ActorDefinition']);
  });

  it('should return versions from subjectType schema options', () => {
    expect(service.getSubjectTypeVersions('ActorDefinition')).toEqual(['R5', 'R6']);
  });

  it('should resolve with the original questionnaire when the user keeps invalid subjectType values', async () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      subjectType: ['Patient', 'ActorDefinition']
    };

    const resolvedQuestionnaire = await service.resolveSubjectTypeQuestionnaire(
      questionnaire,
      'R4',
      async () => 'keep'
    );

    expect(resolvedQuestionnaire).toBe(questionnaire);
  });

  it('should resolve with a copy after dropping invalid subjectType values', async () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      subjectType: ['Patient', 'ActorDefinition']
    };

    const resolvedQuestionnaire = await service.resolveSubjectTypeQuestionnaire(
      questionnaire,
      'R4',
      async () => 'drop'
    );

    expect(resolvedQuestionnaire.subjectType).toEqual(['Patient']);
    expect(questionnaire.subjectType).toEqual(['Patient', 'ActorDefinition']);
  });

  it('should resolve with null when the user cancels subjectType compatibility handling', async () => {
    const resolvedQuestionnaire = await service.resolveSubjectTypeQuestionnaire(
      {subjectType: ['ActorDefinition']},
      'R4',
      async () => 'cancel'
    );

    expect(resolvedQuestionnaire).toBeNull();
  });
});
