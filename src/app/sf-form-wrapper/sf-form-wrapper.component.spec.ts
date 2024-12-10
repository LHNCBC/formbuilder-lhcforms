import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SfFormWrapperComponent } from './sf-form-wrapper.component';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {ExtensionsService} from '../services/extensions.service';
import {FormComponent} from '@lhncbc/ngx-schema-form';

xdescribe('SfFormWrapperComponent', () => {
  let component: SfFormWrapperComponent;
  let fixture: ComponentFixture<SfFormWrapperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ SfFormWrapperComponent, FormComponent ],
      providers: [HttpClient, HttpHandler, ExtensionsService]
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
