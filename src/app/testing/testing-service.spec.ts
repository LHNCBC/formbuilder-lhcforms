import { TestBed } from '@angular/core/testing';

import { TestingService } from './testing.service';
import {
  ExpressionCompilerFactory,
  FormPropertyFactory, LogService, SchemaFormModule,
  SchemaValidatorFactory,
  ValidatorRegistry
} from '@lhncbc/ngx-schema-form';
import {FormService} from '../services/form.service';
// import {PropertyBindings} from '@lhncbc/ngx-schema-form/lib/property-binding-registry';

xdescribe('TestingService', () => {
  let service: TestingService;
  beforeEach(() => {
    const propertyBindingRegistrySpyObj =
      jasmine.createSpyObj(
        'PropertyBindingRegistry',
        ['getPropertyBindings', 'getPropertyBindingsVisibility']);
    propertyBindingRegistrySpyObj.getPropertyBindings.and.returnValue({});
    propertyBindingRegistrySpyObj.getPropertyBindingsVisibility.and.returnValue({});
    /*
    propertyBindingRegistrySpyObj.getPropertyBindings.and.returnValue(new PropertyBindings());
    propertyBindingRegistrySpyObj.getPropertyBindingsVisibility.and.returnValue(new PropertyBindings());
    */
    TestBed.configureTestingModule({
      providers: [
        SchemaFormModule.forRoot(),
        FormPropertyFactory,
        FormService,
        SchemaValidatorFactory,
        ValidatorRegistry,
        ExpressionCompilerFactory
      ]
    });
    service = TestBed.inject(TestingService);
  });

  it('should create TestingService', () => {
    expect(service).toBeTruthy();
  });
});
