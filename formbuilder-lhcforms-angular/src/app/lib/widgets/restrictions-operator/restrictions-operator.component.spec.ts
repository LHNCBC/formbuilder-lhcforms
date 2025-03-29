import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestrictionsOperatorComponent } from './restrictions-operator.component';

xdescribe('RestrictionsOperatorComponent', () => {
  let component: RestrictionsOperatorComponent;
  let fixture: ComponentFixture<RestrictionsOperatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ RestrictionsOperatorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RestrictionsOperatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
