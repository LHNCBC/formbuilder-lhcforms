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
      widget: {id: 'integer'}
    }
  }
};
const model: any = {fieldA: 2};
xdescribe('IntegerComponent', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  CommonTestingModule.setUpTestBed(TestComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    const input = fixture.debugElement.query(By.css('input'));
    // TODO - expect(input.nativeElement.value).toBe(2);
  });
});
