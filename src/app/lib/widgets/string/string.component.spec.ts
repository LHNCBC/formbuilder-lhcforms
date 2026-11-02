import { ComponentFixture, TestBed } from '@angular/core/testing';

// Load the testing module first: it imports StringComponent subclasses, which need
// StringComponent to finish loading before their class declarations are evaluated.
import {CommonTestingModule} from '../../../testing/common-testing.module';
import { StringComponent } from './string.component';
import {ElementRef} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ISchema} from '@lhncbc/ngx-schema-form';

xdescribe('StringComponent', () => {
  let component: StringComponent;
  let fixture: ComponentFixture<StringComponent>;

  CommonTestingModule.setUpTestBed(StringComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(StringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('StringComponent tooltip overflow', () => {
  let component: StringComponent;

  beforeEach(() => {
    component = Object.create(StringComponent.prototype);
  });

  it('should enable the tooltip for overflowing text without lifecycle deferral', () => {
    component.inputElRef = {
      nativeElement: {clientWidth: 100, scrollWidth: 150}
    } as ElementRef<HTMLInputElement>;

    component.updateTooltipVisibility();

    expect(component.hasOverflow()).toBeTrue();
    expect(component.showTooltip).toBeTrue();
  });

  it('should disable the tooltip when text fits inside the input', () => {
    component.inputElRef = {
      nativeElement: {clientWidth: 100, scrollWidth: 80}
    } as ElementRef<HTMLInputElement>;

    component.updateTooltipVisibility();

    expect(component.hasOverflow()).toBeFalse();
    expect(component.showTooltip).toBeFalse();
  });
});

describe('StringComponent rendered tooltip', () => {
  const longValue = 'A long string value that cannot fit inside the narrow input box. '.repeat(5).trim();
  let component: StringComponent;
  let fixture: ComponentFixture<StringComponent>;

  CommonTestingModule.setUpTestBed(StringComponent, true);

  /**
   * Create a narrow string widget bound to a real form property and form control.
   * @param value - Initial value of the field.
   * @param widget - Widget schema settings, e.g. suggestions to render the typeahead input.
   */
  function createNarrowStringWidget(value: string, widget: Record<string, unknown> = {id: 'string'}): void {
    fixture = TestBed.createComponent(StringComponent);
    component = fixture.componentInstance;
    const property = CommonTestingModule.createProperty({type: 'string', widget} as ISchema, value);
    component.formProperty = property;
    component.schema = property.schema;
    component.control = new FormControl(value);
    component.id = 'stringTooltipTest';
    component.name = 'stringTooltipTest';
    component.nolabel = true;
    fixture.nativeElement.style.display = 'block';
    fixture.nativeElement.style.width = '120px';
  }

  /**
   * Get the rendered text input.
   */
  function inputElement(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  const inputVariants: {description: string; widget: Record<string, unknown>}[] = [
    {description: 'plain', widget: {id: 'string'}},
    {description: 'suggestion typeahead', widget: {id: 'string', suggestions: ['first', 'second']}}
  ];

  inputVariants.forEach(({description, widget}) => {
    it(`should render overflowing ${description} input without NG0100`, () => {
      createNarrowStringWidget(longValue, widget);

      // detectChanges() also runs the development-mode no-changes check that reported NG0100.
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(inputElement().scrollWidth).toBeGreaterThan(inputElement().clientWidth);
      expect(component.getTooltipValue()).toBe('');
    });

    it(`should enable the ${description} input tooltip on hover, focus, and input`, () => {
      createNarrowStringWidget(longValue, widget);
      fixture.detectChanges();
      const input = inputElement();

      ['pointerenter', 'focusin'].forEach((eventName) => {
        component.showTooltip = false;
        input.dispatchEvent(new Event(eventName));
        expect(() => fixture.detectChanges()).not.toThrow();
        expect(component.getTooltipValue()).withContext(eventName).toBe(longValue);
      });

      input.value = 'short';
      input.dispatchEvent(new Event('input'));
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.showTooltip).toBeFalse();

      input.value = longValue;
      input.dispatchEvent(new Event('input'));
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.getTooltipValue()).toBe(longValue);
    });
  });
});

