import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftLabelFormGroupComponent } from './left-label-form-group.component';

xdescribe('LeftLabelFormGroupComponent', () => {
  let component: LeftLabelFormGroupComponent;
  let fixture: ComponentFixture<LeftLabelFormGroupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ LeftLabelFormGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeftLabelFormGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
