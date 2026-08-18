import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ArrayProperty, PropertyGroup} from '@lhncbc/ngx-schema-form';
import {of} from 'rxjs';
import {FormService} from '../../../services/form.service';
import {TableService} from '../../../services/table.service';
import {CommonTestingModule} from '../../../testing/common-testing.module';
import {UsageContextComponent} from './usage-context.component';
import type {UsageContextEditModel, UsageContextTableField} from './usage-context.types';

describe('UsageContextComponent', () => {
  let component: UsageContextComponent;
  let fixture: ComponentFixture<UsageContextComponent>;

  CommonTestingModule.setUpTestBedConfig({
    imports: [UsageContextComponent],
    providers: [TableService]
  });

  beforeEach(() => {
    const formService = TestBed.inject(FormService);
    const rootProperty = CommonTestingModule.createProperty(
      formService.getFormLevelSchema(),
      {
        useContext: [{
          code: {code: 'focus'},
          valueCodeableConcept: {text: 'Cardiology'}
        }]
      }
    ) as PropertyGroup;

    fixture = TestBed.createComponent(UsageContextComponent);
    component = fixture.componentInstance;
    component.formProperty = rootProperty.getProperty('useContext') as ArrayProperty;
  });

  it('should create the dependency-injected table component and build its summary', () => {
    const summaryField: UsageContextTableField = {field: '__$valueSummary'};

    expect(component).toBeTruthy();
    expect(component.useDisplayRenderer(summaryField)).toBeTrue();
    expect(component.getDisplayValue(component.formProperty.properties[0], summaryField))
      .toBe('Cardiology');
  });

  it('should handle a synchronously closing edit dialog', () => {
    const submittedValue: UsageContextEditModel = {
      code: {code: 'focus'},
      valueCodeableConcept: {text: 'Neurology'},
      __$valueSummary: 'Neurology'
    };
    spyOn(component, 'openDialog').and.returnValue({
      afterClosed: () => of(submittedValue)
    } as any);

    expect(() => component.onEditProperty(0)).not.toThrow();
    expect(component.formProperty.properties[0].value.valueCodeableConcept.text)
      .toBe('Neurology');
  });

  it('should handle a synchronously closing add dialog', () => {
    const submittedValue: UsageContextEditModel = {
      code: {code: 'task'},
      valueReference: {display: 'Example plan'},
      __$valueSummary: 'Example plan'
    };
    spyOn(component, 'openDialog').and.returnValue({
      afterClosed: () => of(submittedValue)
    } as any);

    expect(() => component.addItemWithAlert(null)).not.toThrow();
    expect(component.formProperty.properties.length).toBe(2);
    expect(component.formProperty.properties[1].value.valueReference.display)
      .toBe('Example plan');
  });
});
