import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooleanRadioComponent } from './boolean-radio.component';

xdescribe('BooleanRadioComponent', () => {
  let component: BooleanRadioComponent;
  let fixture: ComponentFixture<BooleanRadioComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ BooleanRadioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanRadioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
