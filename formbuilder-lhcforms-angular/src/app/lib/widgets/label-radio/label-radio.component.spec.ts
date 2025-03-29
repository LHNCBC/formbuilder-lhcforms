import { ComponentFixture, TestBed } from '@angular/core/testing';

import {CommonTestingModule, TestComponent} from '../../../testing/common-testing.module';
import {By} from '@angular/platform-browser';
import {ISchema} from '@lhncbc/ngx-schema-form';

const schema: ISchema = {
  type: 'object',
  properties: {
    fieldA: {
      enum: [
        'one',
        'two',
        'three',
        'four'
      ],
      type: 'string',
      title: 'Field A',
      widget: {
        id: 'lb-radio',
        layout: 'row',
        labelPosition: 'left',
        labelWidthClass: 'col-sm-2',
        controlWidthClass: 'col-sm-6'
      }
    },
  }
};

const model: any = {fieldA: 'two'};

describe('formProperty: lb-radio', () => {
  let fixture: ComponentFixture<TestComponent>;

  CommonTestingModule.setUpTestBed(TestComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.componentInstance.schema = schema;
    fixture.componentInstance.model = model;
    fixture.detectChanges();
  });

  it('should create', () => {
    const instance = fixture.componentInstance;
    expect(instance).toBeTruthy();
    // expect(instance.formProperty.value).toBe('two');
    let radioEl = fixture.debugElement.queryAll(By.css('input'))[1].nativeElement;
    expect(radioEl.checked).toBe(true);
    expect(instance.model.fieldA).toBe('two');
    radioEl = fixture.debugElement.queryAll(By.css('input'))[0].nativeElement;
    expect(radioEl.checked).toBe(false);
    radioEl.click();
    expect(radioEl.checked).toBe(true);
    expect(instance.model.fieldA).toBe('one');
  });
});
