import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelRadioComponent } from './label-radio.component';
import {CommonTestingModule, TestComponent} from '../../../testing/common-testing.module';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';
import {ISchema} from 'ngx-schema-form';

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

const model: any = {fieldA: 'one'};

describe('formProperty: lb-radio', () => {
  let fixture: ComponentFixture<TestComponent>;

  CommonTestingModule.setupTestBedOne();

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.componentInstance.schema = schema;
    fixture.componentInstance.model = model;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
    const input = fixture.debugElement.query(By.css('input'));
    expect(input.nativeElement.value).toBe('one');
  });
});
