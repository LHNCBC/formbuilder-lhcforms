import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {CommonTestingModule} from '../../../testing/common-testing.module';
import {UsageContextObjComponent} from './usage-context-obj.component';
import type {UsageContextEditModel} from '../usage-context/usage-context.types';
import {
  USAGE_CONTEXT_TYPE_SYSTEM,
  UsageContextCodeComponent
} from '../usage-context-code/usage-context-code.component';

describe('UsageContextObjComponent', () => {
  let component: UsageContextObjComponent;
  let fixture: ComponentFixture<UsageContextObjComponent>;

  CommonTestingModule.setUpTestBedConfig({
    imports: [UsageContextObjComponent]
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(UsageContextObjComponent);
    component = fixture.componentInstance;
    component.model = {
      code: {
        system: USAGE_CONTEXT_TYPE_SYSTEM,
        code: 'focus',
        display: 'Clinical Focus'
      },
      __$valueType: 'valueCodeableConcept',
      valueCodeableConcept: {text: 'Cardiology'}
    };
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the schema form and capture its root property', () => {
    expect(component).toBeTruthy();
    expect(component.sfFormRootProperty).toBe(component.sfForm.rootProperty as typeof component.sfFormRootProperty);
  });

  it('should initialize the bound UsageContext type selector from the model', () => {
    const codeEditor = fixture.debugElement
      .query(By.directive(UsageContextCodeComponent))
      .componentInstance as UsageContextCodeComponent;

    expect(codeEditor.formProperty.value).toEqual(jasmine.objectContaining({
      system: USAGE_CONTEXT_TYPE_SYSTEM,
      code: 'focus'
    }));
    expect(codeEditor.selectedType()).toBe('focus');
    expect((fixture.nativeElement as HTMLElement)
      .querySelector<HTMLSelectElement>('select[name="usageContextType"]')?.value)
      .toBe('focus');
  });

  it('should align the Usage Context type selector with the other dialog fields', () => {
    const codeEditor = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('lfb-usage-context-code');
    const row = codeEditor?.querySelector<HTMLElement>(':scope > .row');

    expect(row).withContext('Code editor Bootstrap row').not.toBeNull();
    expect(row?.classList).toContain('m-0');
    expect(row?.querySelector<HTMLElement>(':scope > .col-sm-2')).not.toBeNull();
    expect(row?.querySelector<HTMLElement>(':scope > .col-sm-10')).not.toBeNull();
  });

  it('should forward schema-form value changes', () => {
    const value: UsageContextEditModel = {
      code: {code: 'focus'},
      valueCodeableConcept: {text: 'Neurology'}
    };
    spyOn(component.changed, 'emit');

    component.handleChange(value);

    expect(component.changed.emit).toHaveBeenCalledOnceWith(value);
  });

  it('should forward schema-form validity changes', () => {
    spyOn(component.validityChanged, 'emit');

    component.handleValidityChange(false);

    expect(component.validityChanged.emit).toHaveBeenCalledOnceWith(false);
  });
});
