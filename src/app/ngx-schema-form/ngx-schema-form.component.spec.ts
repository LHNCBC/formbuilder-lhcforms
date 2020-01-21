import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxSchemaFormComponent } from './ngx-schema-form.component';

describe('NgxSchemaFormComponent', () => {
  let component: NgxSchemaFormComponent;
  let fixture: ComponentFixture<NgxSchemaFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgxSchemaFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxSchemaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
