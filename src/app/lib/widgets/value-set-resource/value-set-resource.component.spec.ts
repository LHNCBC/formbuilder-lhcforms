import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueSetResourceComponent } from './value-set-resource.component';
import {provideHttpClient} from "@angular/common/http";
import {provideHttpClientTesting} from "@angular/common/http/testing";
import {ExpressionCompilerFactory, LogService, SchemaValidatorFactory} from "@lhncbc/ngx-schema-form";
import {FormService} from "../../../services/form.service";
import {SharedObjectService} from "../../../services/shared-object.service";

describe('ValueSetResourceComponent', () => {
  let component: ValueSetResourceComponent;
  let fixture: ComponentFixture<ValueSetResourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValueSetResourceComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SchemaValidatorFactory,
        ExpressionCompilerFactory,
        { provide: LogService, useValue: {} },
        FormService, // Mock FormService
        SharedObjectService // Mock SharedObjectService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValueSetResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
