import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestrictionsComponent } from './restrictions.component';

xdescribe('RestrictionsComponent', () => {
  let component: RestrictionsComponent;
  let fixture: ComponentFixture<RestrictionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ RestrictionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RestrictionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
