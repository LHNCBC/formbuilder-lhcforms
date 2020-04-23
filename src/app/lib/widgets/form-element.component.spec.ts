import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppFormElementComponent } from './form-element.component';

describe('FormElementComponent', () => {
  let component: AppFormElementComponent;
  let fixture: ComponentFixture<AppFormElementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppFormElementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppFormElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
