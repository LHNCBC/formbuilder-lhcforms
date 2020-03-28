import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AjsfFormComponent } from './ajsf-form.component';

describe('AjsfFormComponent', () => {
  let component: AjsfFormComponent;
  let fixture: ComponentFixture<AjsfFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AjsfFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AjsfFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
