import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnableWhenComponent } from './enable-when.component';

describe('EnableWhenComponent', () => {
  let component: EnableWhenComponent;
  let fixture: ComponentFixture<EnableWhenComponent>;

  beforeEach( () => {
    TestBed.configureTestingModule({
      declarations: [ EnableWhenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnableWhenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
