import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnableOperatorComponent } from './enable-operator.component';

xdescribe('EnableOperatorComponent', () => {
  let component: EnableOperatorComponent;
  let fixture: ComponentFixture<EnableOperatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ EnableOperatorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnableOperatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
