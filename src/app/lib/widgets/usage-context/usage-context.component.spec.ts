import {UsageContextComponent} from './usage-context.component';
import type {UsageContextTableField} from './usage-context.types';
import type {FormProperty} from '@lhncbc/ngx-schema-form';

describe('UsageContextComponent', () => {
  let component: UsageContextComponent;

  beforeEach(() => {
    component = Object.create(UsageContextComponent.prototype);
    (component as unknown as {valueSummaryField: string}).valueSummaryField = '__$valueSummary';
  });

  it('should use the display renderer only for the value summary column', () => {
    expect(component.useDisplayRenderer({field: '__$valueSummary'})).toBeTrue();
    expect(component.useDisplayRenderer({field: 'code'})).toBeFalse();
  });

  it('should render the selected UsageContext value summary', () => {
    const rowProperty = {
      value: {
        code: {code: 'focus'},
        valueCodeableConcept: {text: 'Cardiology'}
      }
    };
    const summaryField: UsageContextTableField = {field: '__$valueSummary'};

    expect(component.getDisplayValue(rowProperty as unknown as FormProperty, summaryField)).toBe('Cardiology');
  });
});
