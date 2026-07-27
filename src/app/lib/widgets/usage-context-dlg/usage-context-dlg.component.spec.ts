import {UsageContextDlgComponent} from './usage-context-dlg.component';
import type {UsageContextEditModel} from '../usage-context/usage-context.types';

type DialogInternals = {
  normalizeValueForSave(value: UsageContextEditModel): UsageContextEditModel;
  getRangeValidationError(value: UsageContextEditModel): string;
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
    expect(Array.isArray(normalized.valueReference?.identifier)).toBeFalse();
    expect(normalized.valueReference?.identifier).toEqual(jasmine.objectContaining({
      value: 'plan-123',
      assigner: jasmine.objectContaining({
        identifier: jasmine.objectContaining({value: 'assigner-456'})
      })
    }));
    expect(normalized.__$valueSummary).toBe('plan-123');
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
});
