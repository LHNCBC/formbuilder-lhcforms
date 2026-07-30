import type {FormProperty} from '@lhncbc/ngx-schema-form';
import {BehaviorSubject} from 'rxjs';
import {
  CUSTOM_USAGE_CONTEXT_TYPE,
  USAGE_CONTEXT_TYPE_SYSTEM,
  USAGE_CONTEXT_TYPE_VALUE_SET,
  UsageContextCodeComponent
} from './usage-context-code.component';

type FormPropertyStub = {
  value: unknown;
  schema: {widget: Record<string, unknown>};
  properties: Record<string, FormProperty>;
  valueChanges: BehaviorSubject<unknown>;
  reset: jasmine.Spy;
};

describe('UsageContextCodeComponent', () => {
  const createComponent = (value: unknown) => {
    const component = new UsageContextCodeComponent();
    const formProperty: FormPropertyStub = {
      value,
      schema: {widget: {}},
      properties: {},
      valueChanges: new BehaviorSubject(value),
      reset: jasmine.createSpy('reset')
    };
    component.formProperty = formProperty as never;
    component.ngOnInit();
    return {component, formProperty};
  };

  it('should expose the canonical UsageContextType value set', () => {
    const {component} = createComponent({});

    expect(USAGE_CONTEXT_TYPE_VALUE_SET)
      .toBe('http://terminology.hl7.org/ValueSet/usage-context-type');
    expect(component.codeHelpMessage)
      .toContain('Standard choices come from the UsageContextType value set.');
    expect(component.typeOptions.map(({code}) => code)).toEqual([
      'gender',
      'age',
      'focus',
      'user',
      'workflow',
      'task',
      'venue',
      'species',
      'program'
    ]);
  });

  it('should recognize an imported standard UsageContextType coding', () => {
    const {component} = createComponent({
      system: USAGE_CONTEXT_TYPE_SYSTEM,
      code: 'focus',
      display: 'Clinical Focus'
    });

    expect(component.selectedType()).toBe('focus');
  });

  it('should treat a materialized Coding with only empty child values as unselected', () => {
    const {component} = createComponent({
      display: '',
      code: null,
      system: undefined
    });

    expect(component.selectedType()).toBe('');
  });

  it('should recognize a standard Coding materialized after widget initialization', () => {
    const {component, formProperty} = createComponent({});

    formProperty.valueChanges.next({
      system: USAGE_CONTEXT_TYPE_SYSTEM,
      code: 'gender',
      display: 'Gender'
    });

    expect(component.selectedType()).toBe('gender');
  });

  it('should preserve an imported coding outside the extensible value set', () => {
    const {component, formProperty} = createComponent({
      system: 'http://example.org/context-types',
      code: 'local-context',
      display: 'Local context'
    });

    expect(component.selectedType()).toBe(CUSTOM_USAGE_CONTEXT_TYPE);
    component.setType(CUSTOM_USAGE_CONTEXT_TYPE);
    expect(formProperty.reset).not.toHaveBeenCalled();
  });

  it('should populate a complete Coding when a standard type is selected', () => {
    const {component, formProperty} = createComponent({});

    component.setType('task');

    expect(formProperty.reset).toHaveBeenCalledWith({
      system: USAGE_CONTEXT_TYPE_SYSTEM,
      code: 'task',
      display: 'Workflow Task'
    }, false);
  });

  it('should clear a standard Coding when switching to custom entry', () => {
    const {component, formProperty} = createComponent({
      system: USAGE_CONTEXT_TYPE_SYSTEM,
      code: 'task',
      display: 'Workflow Task'
    });

    component.setType(CUSTOM_USAGE_CONTEXT_TYPE);

    expect(formProperty.reset).toHaveBeenCalledWith({}, false);
  });
});
