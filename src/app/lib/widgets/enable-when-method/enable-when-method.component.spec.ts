import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnableWhenMethodComponent } from './enable-when-method.component';
import { of, Subject } from 'rxjs';

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

});