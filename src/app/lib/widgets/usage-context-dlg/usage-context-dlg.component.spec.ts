import {UsageContextDlgComponent} from './usage-context-dlg.component';
import type {UsageContextEditModel} from '../usage-context/usage-context.types';
import type {FormProperty} from '@lhncbc/ngx-schema-form';

type DialogInternals = {
  normalizeValueForSave(value: UsageContextEditModel): UsageContextEditModel;
  getRangeValidationError(value: UsageContextEditModel): string;
  getMissingQuantitySystemPaths(value: UsageContextEditModel): string[];
  getReferenceValidationError(value: UsageContextEditModel): string;
  hasReferenceContent(reference: UsageContextEditModel['valueReference']): boolean;
  getCurrentFormPropertyValue(property: FormProperty): unknown;
  inputModel: UsageContextEditModel;
  rawValueStore: {
    getIdentifier: (property: FormProperty) => undefined;
    getIdentifierTable: (property: FormProperty) => undefined;
    isIdentifierDeleted: (property: FormProperty) => false;
  };
  data: {
    arrayProperty: {
      findRoot: () => {
        getProperty: (path: string) => {value: unknown};
      };
    };
  };
};

describe('UsageContextDlgComponent', () => {
  let component: UsageContextDlgComponent;
  let internals: DialogInternals;

  beforeEach(() => {
    component = Object.create(UsageContextDlgComponent.prototype);
    internals = component as unknown as DialogInternals;
  });

  it('should build summaries for every UsageContext value type', () => {
    expect(UsageContextDlgComponent.getValueSummary({
      code: {},
      valueCodeableConcept: {text: 'Clinical focus'}
    })).toBe('Clinical focus');
    expect(UsageContextDlgComponent.getValueSummary({
      code: {},
      valueQuantity: {
        comparator: '>=',
        value: 42,
        unit: 'score',
        system: 'http://example.org/score'
      }
    })).toBe('>=42 score http://example.org/score');
    expect(UsageContextDlgComponent.getValueSummary({
      code: {},
      valueRange: {
        low: {value: 18, unit: 'years'},
        high: {value: 65, unit: 'years'}
      }
    })).toBe('18 years - 65 years');
    expect(UsageContextDlgComponent.getValueSummary({
      code: {},
      valueReference: {
        identifier: {value: 'plan-123', system: 'http://example.org/plans'}
      }
    })).toBe('plan-123 | http://example.org/plans');
  });

  it('should normalize the selected value and recursively restore FHIR Identifier shape', () => {
    const normalized = internals.normalizeValueForSave({
      code: {code: 'task'},
      __$valueType: 'valueReference',
      valueQuantity: {value: 10},
      valueRange: {
        low: {value: 1, comparator: '>='},
        high: {value: 2, comparator: '<='}
      },
      valueReference: {
        identifier: [{
          value: 'plan-123',
          assigner: {
            identifier: [{
              value: 'assigner-456'
            }]
          }
        }]
      }
    });

    expect(normalized.__$valueType).toBeUndefined();
    expect(normalized.valueQuantity).toBeUndefined();
    expect(normalized.valueRange).toBeUndefined();
    expect(Array.isArray(normalized.valueReference?.identifier)).toBeFalse();
    expect(normalized.valueReference?.identifier).toEqual(jasmine.objectContaining({
      value: 'plan-123',
      assigner: jasmine.objectContaining({
        identifier: jasmine.objectContaining({value: 'assigner-456'})
      })
    }));
    expect(normalized.__$valueSummary).toBe('plan-123');
  });

  it('should remove invalid Range comparators during normalization', () => {
    const normalized = internals.normalizeValueForSave({
      code: {code: 'age'},
      __$valueType: 'valueRange',
      valueRange: {
        low: {value: 18, comparator: '>='},
        high: {value: 65, comparator: '<='}
      }
    });

    expect(normalized.valueRange?.low?.comparator).toBeUndefined();
    expect(normalized.valueRange?.high?.comparator).toBeUndefined();
  });

  it('should preserve an original Identifier row when lifecycle seeding did not run', () => {
    const liveChild = {
      value: {value: 'plan-123'},
      properties: {
        value: {value: 'plan-123'}
      }
    };
    const tableProperty = {
      path: '/valueReference/identifier',
      value: [{value: 'plan-123'}],
      properties: [liveChild],
      schema: {widget: {id: 'identifier'}}
    } as unknown as FormProperty;
    internals.inputModel = {
      code: {code: 'task'},
      valueReference: {
        identifier: [{
          value: 'plan-123',
          assigner: {
            identifier: [{
              value: 'deep-identifier'
            }]
          }
        }]
      }
    };
    internals.rawValueStore = {
      getIdentifier: () => undefined,
      getIdentifierTable: () => undefined,
      isIdentifierDeleted: () => false
    };

    const currentValue = internals.getCurrentFormPropertyValue(tableProperty) as Array<{
      assigner?: {identifier?: Array<{value?: string}>}
    }>;

    expect(currentValue[0].assigner?.identifier?.[0].value).toBe('deep-identifier');
  });

  it('should reject reversed Range bounds and incompatible units', () => {
    expect(internals.getRangeValidationError({
      code: {},
      __$valueType: 'valueRange',
      valueRange: {
        low: {value: 20, unit: 'years'},
        high: {value: 10, unit: 'years'}
      }
    })).toBe('High value must be greater than or equal to low value.');

    expect(internals.getRangeValidationError({
      code: {},
      __$valueType: 'valueRange',
      valueRange: {
        low: {value: 10, unit: 'years'},
        high: {value: 20, unit: 'months'}
      }
    })).toBe('Low and high unit, system, and code must match.');
  });

  it('should require system for coded Quantity values and Range bounds', () => {
    expect(internals.getMissingQuantitySystemPaths({
      code: {},
      __$valueType: 'valueQuantity',
      valueQuantity: {value: 1, code: 'mg'}
    })).toEqual(['valueQuantity']);

    expect(internals.getMissingQuantitySystemPaths({
      code: {},
      __$valueType: 'valueRange',
      valueRange: {
        low: {value: 1, code: 'mg'},
        high: {value: 5, code: 'mg'}
      }
    })).toEqual(['valueRange.low', 'valueRange.high']);
  });

  it('should allow a display unit without a code or a coded unit with its system', () => {
    expect(internals.getMissingQuantitySystemPaths({
      code: {},
      __$valueType: 'valueQuantity',
      valueQuantity: {value: 1, unit: 'mg'}
    })).toEqual([]);

    expect(internals.getMissingQuantitySystemPaths({
      code: {},
      __$valueType: 'valueQuantity',
      valueQuantity: {
        value: 1,
        code: 'mg',
        system: 'http://unitsofmeasure.org'
      }
    })).toEqual([]);
  });

  it('should accept an extension-only Reference but reject type-only content', () => {
    expect(internals.hasReferenceContent({
      extension: [{
        url: 'http://example.org/fhir/StructureDefinition/reference-note',
        valueString: 'Imported reference metadata'
      }]
    })).toBeTrue();

    expect(internals.hasReferenceContent({extension: []})).toBeFalse();
    expect(internals.hasReferenceContent({type: 'PlanDefinition'})).toBeFalse();
  });

  it('should require a local Reference to resolve to a contained resource', () => {
    internals.data = {
      arrayProperty: {
        findRoot: () => ({
          getProperty: () => ({
            value: [{resourceType: 'ValueSet', id: 'present'}]
          })
        })
      }
    };

    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: '#present', type: 'ValueSet'}
    })).toBe('');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: '#present', type: 'PlanDefinition'}
    })).toBe('Reference type must match the referenced resource type.');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: '#missing'}
    })).toBe('Local reference must match the id of a contained resource.');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: '#'}
    })).toBe('Local reference must match the id of a contained resource.');
  });

  it('should require Reference.type to name a concrete R5 resource', () => {
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {display: 'Target', type: 'NotAResource'}
    })).toBe('Type must be a valid FHIR R5 resource type.');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {display: 'Target', type: 'Parameters'}
    })).toBe('Type must be a valid FHIR R5 resource type.');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {display: 'Target', type: 'Observation'}
    })).toBe('');
  });

  it('should leave non-local References to external resolution', () => {
    internals.data = {
      arrayProperty: {
        findRoot: () => ({
          getProperty: () => ({value: []})
        })
      }
    };

    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: 'PlanDefinition/example', type: 'PlanDefinition'}
    })).toBe('');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {
        reference: 'https://example.org/fhir/PlanDefinition/example',
        type: 'http://hl7.org/fhir/StructureDefinition/PlanDefinition'
      }
    })).toBe('');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: 'Patient/123', type: 'Observation'}
    })).toBe('Reference type must match the referenced resource type.');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: 'Patient/123/_history/4', type: 'Observation'}
    })).toBe('Reference type must match the referenced resource type.');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: 'archive/Patient/123', type: 'Observation'}
    })).toBe('');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: 'archive/Patient/123/_history/4', type: 'Observation'}
    })).toBe('');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: 'Archive/123', type: 'Observation'}
    })).toBe('');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {
        reference: 'https://example.org/fhir/Patient/123/_history/4',
        type: 'Observation'
      }
    })).toBe('');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {
        reference: 'https://documents.example.org/archive/Patient/123',
        type: 'Observation'
      }
    })).toBe('');
    expect(internals.getReferenceValidationError({
      code: {},
      __$valueType: 'valueReference',
      valueReference: {reference: 'urn:uuid:1234', type: 'Observation'}
    })).toBe('');
  });
});
