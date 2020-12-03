import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFieldsComponent } from './form-fields.component';

describe('FormFieldsComponent', () => {
  let component: FormFieldsComponent;
  let fixture: ComponentFixture<FormFieldsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormFieldsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
