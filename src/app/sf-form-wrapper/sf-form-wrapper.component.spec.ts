import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SfFormWrapperComponent } from './sf-form-wrapper.component';
import {HttpClient, HttpHandler} from '@angular/common/http';
import {ExtensionsService} from '../services/extensions.service';
import {FormComponent, LogService} from '@lhncbc/ngx-schema-form';
import { TableService } from '../services/table.service';

xdescribe('SfFormWrapperComponent', () => {
  let component: SfFormWrapperComponent;
  let fixture: ComponentFixture<SfFormWrapperComponent>;
  let tableService: TableService;
  let logService: LogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ SfFormWrapperComponent, FormComponent ],
      providers: [
        HttpClient, HttpHandler,
        ExtensionsService, TableService, LogService
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SfFormWrapperComponent);
    component = fixture.componentInstance;
    tableService = TestBed.inject(TableService);
    logService = TestBed.inject(LogService);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
