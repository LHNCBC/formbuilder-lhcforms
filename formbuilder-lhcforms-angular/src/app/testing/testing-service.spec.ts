import { TestBed } from '@angular/core/testing';

import { TestingService } from './testing.service';
import {
  ExpressionCompilerFactory,
  FormPropertyFactory, LogService, SchemaFormModule,
  SchemaValidatorFactory,
  ValidatorRegistry
} from '@lhncbc/ngx-schema-form';
import {FormService} from '../services/form.service';

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
      imports: [SchemaFormModule.forRoot()],
      providers: [
        FormPropertyFactory,
        FormService,
        SchemaValidatorFactory,
        ValidatorRegistry,
        ExpressionCompilerFactory,
        LogService
      ]
    });
    service = TestBed.inject<TestingService>(TestingService);
  });

  it('should create TestingService', () => {
    expect(service).toBeTruthy();
  });
});
