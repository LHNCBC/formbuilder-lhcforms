import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnableWhenMethodComponent } from './enable-when-method.component';
import { of, Subject } from 'rxjs';
import {
  CONDITIONAL_METHOD_ENABLEWHEN_EXPRESSION, CONDITIONAL_METHOD_NONE, EXTENSION_URL_ENABLEWHEN_EXPRESSION
} from '../../constants/constants';

describe('EnableWhenMethodComponent', () => {
  let component: EnableWhenMethodComponent;
  let fixture: ComponentFixture<EnableWhenMethodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnableWhenMethodComponent]
    })
    .overrideComponent(EnableWhenMethodComponent, {
      set: { template: '<div>Mock Template</div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnableWhenMethodComponent);
    component = fixture.componentInstance;

    // Spy on parent's ngAfterViewInit to prevent it from running
    const parentClass = Object.getPrototypeOf(Object.getPrototypeOf(component));
    spyOn(parentClass, 'ngAfterViewInit').and.stub();

    // Mock formProperty with all required properties
    // This is what the parent class (from ngx-schema-form) needs
    component.formProperty = {
      valueChanges: new Subject(),
      value: null,
      schema: {
        widget: {
          showEmptyError: false,
          labelPosition: 'top',
          labelWidthClass: 'col-sm',
          controlWidthClass: 'col-sm',
          labelClasses: '',
          controlClasses: '',
          booleanControlled: false,
          booleanControlledInitial: false
        },

        value: ''
      },
      path: '/',
      root: null,
      parent: null,
      setValue: jasmine.createSpy('setValue'),
      searchProperty: jasmine.createSpy().and.returnValue({
        value: null
      })
    } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    // Now trigger lifecycle hooks with mocked dependencies in place
    fixture.detectChanges();
  });

  describe('switching to enableWhen expression', () => {
    let expressionValue: any;
    let extensionsService: jasmine.SpyObj<any>;

    beforeEach(() => {
      expressionValue = null;
      (component.formProperty as any).findRoot = () => ({
        getProperty: () => ({value: expressionValue})
      });
      extensionsService = jasmine.createSpyObj('ExtensionsService',
        ['updateOrAppendExtensionByUrl', 'removeExtensionsByUrl']);
      component.extensionsService = extensionsService;
      component.modelService = {modelInitialized$: new Subject()} as any;
      component.ngAfterViewInit();
    });

    it('should not add an extension without expression text', () => {
      expressionValue = {valueExpression: {language: 'text/fhirpath'}};
      (component.formProperty.valueChanges as Subject<any>).next(CONDITIONAL_METHOD_ENABLEWHEN_EXPRESSION);
      expect(extensionsService.updateOrAppendExtensionByUrl).not.toHaveBeenCalled();

      (component.formProperty.valueChanges as Subject<any>).next(CONDITIONAL_METHOD_NONE);
      expressionValue = {valueExpression: {language: 'text/fhirpath', expression: '  '}};
      (component.formProperty.valueChanges as Subject<any>).next(CONDITIONAL_METHOD_ENABLEWHEN_EXPRESSION);
      expect(extensionsService.updateOrAppendExtensionByUrl).not.toHaveBeenCalled();
    });

    it('should add the extension with its url when the expression is present', () => {
      expressionValue = {valueExpression: {language: 'text/fhirpath', expression: '%a > 1'}};
      (component.formProperty.valueChanges as Subject<any>).next(CONDITIONAL_METHOD_ENABLEWHEN_EXPRESSION);
      expect(extensionsService.updateOrAppendExtensionByUrl).toHaveBeenCalledOnceWith(
        EXTENSION_URL_ENABLEWHEN_EXPRESSION,
        {
          url: EXTENSION_URL_ENABLEWHEN_EXPRESSION,
          valueExpression: {language: 'text/fhirpath', expression: '%a > 1'}
        }
      );
    });
  });

});