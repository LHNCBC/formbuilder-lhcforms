import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AnswerOptionService, EnableWhenAnswerOptionsState } from './answer-option.service';
import { EnableWhenAnswerOptionsService } from './enable-when-answer-options.service';

describe('EnableWhenAnswerOptionsService', () => {
  let service: EnableWhenAnswerOptionsService;
  let answerOptionServiceSpy: jasmine.SpyObj<AnswerOptionService>;
  let formProperty: any;
  let valueChanges: Subject<any>;
  let questionValueChanges: Subject<any>;
  let control: any;
  let originalLForms: any;

  const baseState: EnableWhenAnswerOptionsState = {
    hasAnswerOptions: true,
    answerOptions: ['one', 'two'],
    answerOptionType: 'string',
    answerConstraint: 'optionsOnly',
    codingAnswerOptionsHash: {},
    codingAnswerOptionsCodes: [],
    codingAnswerOptionsBySystem: {},
    codingAnswerOptionsByAutocompleteItem: {}
  };

  beforeAll(() => {
    originalLForms = (window as any).LForms;
    const autocompleter = originalLForms?.Def?.Autocompleter;
    if (!autocompleter?.USE_STATISTICS || !autocompleter?.Prefetch || !autocompleter?.Event) {
      (window as any).LForms = {
        Def: {
          Autocompleter: {
            USE_STATISTICS: 'USE_STATISTICS',
            Prefetch: function() {},
            Event: {
              observeListSelections: () => {}
            }
          }
        }
      };
    }
  });

  afterAll(() => {
    (window as any).LForms = originalLForms;
  });

  beforeEach(() => {
    answerOptionServiceSpy = jasmine.createSpyObj('AnswerOptionService', [
      'getEnableWhenAnswerOptionsState',
      'getEnableWhenAutocompleteItemFromCoding'
    ]);
    answerOptionServiceSpy.getEnableWhenAnswerOptionsState.and.returnValue(baseState);

    valueChanges = new Subject<any>();
    questionValueChanges = new Subject<any>();
    control = {
      valueChanges,
      setValue: jasmine.createSpy('setValue')
    };
    formProperty = {
      __canonicalPathNotation: 'enableWhen.0.answerString',
      parent: {
        getProperty: jasmine.createSpy('getProperty').and.callFake((name: string) => {
          if (name === 'question') {
            return {
              value: 'q1',
              valueChanges: questionValueChanges
            };
          }
          return null;
        })
      },
      value: 'one',
      setValue: jasmine.createSpy('setValue').and.callFake((value) => formProperty.value = value),
      updateValueAndValidity: jasmine.createSpy('updateValueAndValidity')
    };

    TestBed.configureTestingModule({
      providers: [
        EnableWhenAnswerOptionsService,
        { provide: AnswerOptionService, useValue: answerOptionServiceSpy }
      ]
    });
    service = TestBed.inject(EnableWhenAnswerOptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize answer option state without syncing non-coding control values', () => {
    service.init(formProperty, control);

    expect(answerOptionServiceSpy.getEnableWhenAnswerOptionsState).toHaveBeenCalledWith(formProperty);
    expect(control.setValue).not.toHaveBeenCalled();
  });

  it('should write typed integer values back to the form property', fakeAsync(() => {
    answerOptionServiceSpy.getEnableWhenAnswerOptionsState.and.returnValue({
      ...baseState,
      answerOptionType: 'integer'
    });
    service.init(formProperty, control);

    service.onInput({ target: { value: '7' } } as any);
    tick();

    expect(formProperty.setValue).toHaveBeenCalledWith(7, true);
    expect(formProperty.updateValueAndValidity).toHaveBeenCalledWith(false, true);
  }));

  it('should keep coding onInput as no-op when answer constraint is optionsOnly', fakeAsync(() => {
    answerOptionServiceSpy.getEnableWhenAnswerOptionsState.and.returnValue({
      ...baseState,
      answerOptionType: 'coding',
      answerConstraint: 'optionsOnly'
    });
    service.init(formProperty, control);

    service.onInput({ target: { value: 'Other value' } } as any);
    tick();

    expect(formProperty.setValue).not.toHaveBeenCalledWith({
      system: null,
      display: 'Other value',
      code: null
    }, true);
  }));

  it('should write typed coding free text when answer constraint is not optionsOnly', fakeAsync(() => {
    answerOptionServiceSpy.getEnableWhenAnswerOptionsState.and.returnValue({
      ...baseState,
      answerOptionType: 'coding',
      answerConstraint: 'optionsOrString'
    });
    service.init(formProperty, control);

    service.onInput({ target: { value: 'Other value' } } as any);
    tick();

    expect(formProperty.setValue).toHaveBeenCalledWith({
      system: null,
      display: 'Other value',
      code: null
    }, true);
    expect(formProperty.updateValueAndValidity).toHaveBeenCalledWith(false, true);
  }));

  it('should honor updated coding answer constraint after init', fakeAsync(() => {
    answerOptionServiceSpy.getEnableWhenAnswerOptionsState.and.returnValues(
      {
        ...baseState,
        answerOptionType: 'coding',
        answerConstraint: 'optionsOnly'
      },
      {
        ...baseState,
        answerOptionType: 'coding',
        answerConstraint: 'optionsOrString'
      }
    );
    service.init(formProperty, control);

    service.onInput({ target: { value: 'Updated free text' } } as any);
    tick();

    expect(formProperty.setValue).toHaveBeenCalledWith({
      system: null,
      display: 'Updated free text',
      code: null
    }, true);
  }));

  it('should clear invalid values on blur', () => {
    service.init(formProperty, control);
    const input = document.createElement('input');
    input.classList.add('ng-invalid');

    service.suppressInvalidValue({ target: input } as any);

    expect(formProperty.setValue).toHaveBeenCalledWith(null, false);
  });

  it('should parse free-text coding values', () => {
    answerOptionServiceSpy.getEnableWhenAnswerOptionsState.and.returnValue({
      ...baseState,
      answerOptionType: 'coding'
    });
    service.init(formProperty, control);

    expect(service.parseCoding('Other')).toEqual({
      system: null,
      display: 'Other',
      code: null
    });
  });

  it('should return null for unmatched coding list selections', () => {
    answerOptionServiceSpy.getEnableWhenAnswerOptionsState.and.returnValue({
      ...baseState,
      answerOptionType: 'coding',
      codingAnswerOptionsHash: {},
      codingAnswerOptionsByAutocompleteItem: {}
    });
    service.init(formProperty, control);

    expect(service.parseCoding({
      on_list: true,
      final_val: 'Missing',
      list: ['Other']
    })).toBeNull();
  });

  it('should refresh hasAnswerOptions when source question changes', () => {
    const states: EnableWhenAnswerOptionsState[] = [
      {
        ...baseState,
        hasAnswerOptions: true,
        answerOptions: ['one', 'two']
      },
      {
        ...baseState,
        hasAnswerOptions: false,
        answerOptions: []
      }
    ];
    answerOptionServiceSpy.getEnableWhenAnswerOptionsState.and.callFake(() => states.shift() || {
      ...baseState,
      hasAnswerOptions: false,
      answerOptions: []
    });

    const values: boolean[] = [];
    service.hasAnswerOptions$.subscribe((v) => values.push(v));

    service.init(formProperty, control);
    questionValueChanges.next('q2');

    expect(values).toEqual([false, true, false]);
    expect(answerOptionServiceSpy.getEnableWhenAnswerOptionsState).toHaveBeenCalledTimes(2);
  });
});
