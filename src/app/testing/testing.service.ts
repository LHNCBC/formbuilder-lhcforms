import {Injectable} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {FormService} from '../services/form.service';
import {
  ExpressionCompilerFactory,
  FormProperty,
  FormPropertyFactory, LogService,
  PropertyBindingRegistry,
  SchemaPreprocessor,
  SchemaValidatorFactory,
  ValidatorRegistry
} from '@lhncbc/ngx-schema-form';
import {CommonTestingModule} from './common-testing.module';

export function useFactory(schemaValidatorFactory: SchemaValidatorFactory,
                           validatorRegistry: ValidatorRegistry,
                           propertyBindingRegistry: PropertyBindingRegistry,
                           expressionCompilerFactory: ExpressionCompilerFactory,
                           logService: LogService) {
  return new FormPropertyFactory(schemaValidatorFactory, validatorRegistry, propertyBindingRegistry, expressionCompilerFactory, logService);
}

@Injectable({
  providedIn: 'root'
})
export class TestingService {
  rootProperty: FormProperty;
  formPropertyFactory = TestBed.inject<FormPropertyFactory>(FormPropertyFactory);
  TestBed = TestBed.overrideProvider(
    FormPropertyFactory,
    {
      useFactory: useFactory,
      deps: [SchemaValidatorFactory, ValidatorRegistry, PropertyBindingRegistry, ExpressionCompilerFactory, LogService],
      multi: true
    }
  );

  constructor(
    private formService: FormService
  ) {
    let schema = formService.itemSchema;
    schema = SchemaPreprocessor.preprocess(schema);
    this.rootProperty = this.formPropertyFactory.createProperty(schema);
  }

  beforeEachSetup(componentClass: any) {
    CommonTestingModule.setUpTestBed(componentClass);
  }

  createComponent(componentClass: any) {
    const fixture = TestBed.createComponent(componentClass);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  getProperty(propertyId: string) {
    return this.rootProperty.searchProperty(propertyId);
  }

}

