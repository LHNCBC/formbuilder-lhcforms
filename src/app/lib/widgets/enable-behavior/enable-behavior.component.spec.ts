import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnableBehaviorComponent } from './enable-behavior.component';

xdescribe('EnableBehaviorComponent', () => {
  let component: EnableBehaviorComponent;
  let fixture: ComponentFixture<EnableBehaviorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ EnableBehaviorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnableBehaviorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
