import { ComponentFixture, TestBed } from '@angular/core/testing';

import {ISchema} from '@lhncbc/ngx-schema-form';
import {CommonTestingModule, TestComponent} from '../../../testing/common-testing.module';
import {By} from '@angular/platform-browser';

const schema: ISchema = {
  type: 'object',
  properties: {
    fieldA: {
      type: 'integer',
      title: 'Field A',
      minimum: 0,
      widget: {id: 'positive-integer'}
    }
  }
};
const model: any = {fieldA: 2};
describe('IntegerComponent', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  CommonTestingModule.setUpTestBed(TestComponent, true);

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    component.schema = schema;
    component.model = model;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    const input = fixture.debugElement.query(By.css('input'));
    // TODO - expect(input.nativeElement.value).toBe(2);
  });

  it('should mark zero invalid for positive integer fields even when schema minimum is zero', async () => {
    await fixture.whenStable();
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;

    input.value = '0';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input.getAttribute('min')).toBe('1');
    expect(input.classList).toContain('ng-invalid');
    const error = fixture.debugElement.query(By.css('small.text-danger')).nativeElement as HTMLElement;
    expect(error.parentElement).toBe(input.parentElement);
    expect(error.textContent)
      .toContain('minimum 1');
  });
});
