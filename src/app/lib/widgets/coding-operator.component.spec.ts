import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingOperatorComponent } from './coding-operator.component';

describe('CodingOperatorComponent', () => {
  let component: CodingOperatorComponent;
  let fixture: ComponentFixture<CodingOperatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CodingOperatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CodingOperatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
