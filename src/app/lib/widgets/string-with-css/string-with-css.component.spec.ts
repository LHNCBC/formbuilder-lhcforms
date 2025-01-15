import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringWithCssComponent } from './string-with-css.component';

describe('StringWithCssComponent', () => {
  let component: StringWithCssComponent;
  let fixture: ComponentFixture<StringWithCssComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ StringWithCssComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StringWithCssComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
