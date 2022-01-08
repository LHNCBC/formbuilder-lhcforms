import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SfFormWrapperComponent } from './sf-form-wrapper.component';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

describe('SfFormWrapperComponent', () => {
  let component: SfFormWrapperComponent;
  let fixture: ComponentFixture<SfFormWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SfFormWrapperComponent ],
      providers: [HttpClient, HttpHandler]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SfFormWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
