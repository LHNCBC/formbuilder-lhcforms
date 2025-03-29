import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextAreaComponent } from './textarea.component';

describe('TextAreaComponent', () => {
  let component: TextAreaComponent;
  let fixture: ComponentFixture<TextAreaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ TextAreaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
