import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableLinkIdComponent } from './editable-link-id.component';
import { HttpClient, HttpHandler } from '@angular/common/http';

describe('EditableLinkIdComponent', () => {
  let component: EditableLinkIdComponent;
  let fixture: ComponentFixture<EditableLinkIdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    //  providers: [ExtensionsService],
      providers:[ HttpClient, HttpHandler ],
      declarations: [ EditableLinkIdComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditableLinkIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
