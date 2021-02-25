import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BooleanControlledComponent } from './boolean-controlled.component';

describe('BooleanControlledComponent', () => {
  let component: BooleanControlledComponent;
  let fixture: ComponentFixture<BooleanControlledComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BooleanControlledComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanControlledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
