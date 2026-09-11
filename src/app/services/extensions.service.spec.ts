import { TestBed } from '@angular/core/testing';
import {
  ArrayProperty,
  DefaultLogService,
  FormPropertyFactory,
  JEXLExpressionCompilerFactory,
  PropertyBindingRegistry,
  PropertyGroup,
  ValidatorRegistry,
  ZSchemaValidatorFactory
} from '@lhncbc/ngx-schema-form';

import { ExtensionsService } from './extensions.service';
import { SchemaService } from './schema.service';

describe('ExtensionsService', () => {
  let service: ExtensionsService;
  let schemaService: SchemaService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [ExtensionsService, SchemaService]});
    service = TestBed.inject(ExtensionsService);
    schemaService = TestBed.inject(SchemaService);

    // Mock the valueXCategoryMap used by updateExtension
    schemaService._valueXCategoryMap = {
      valueString: '__$primitiveType',
      valueInteger: '__$primitiveType',
      valuePositiveInt: '__$primitiveType',
      valueCoding: '__$generalPurposeDatatype',
      valueCodeableConcept: '__$generalPurposeDatatype',
      valueBoolean: '__$primitiveType',
      valueDecimal: '__$primitiveType',
      valueId: '__$primitiveType',
      valueCode: '__$primitiveType',
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should preserve the value when changing the value type of a sparse imported extension', () => {
    const extensionUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-columnCount';
    const factory = new FormPropertyFactory(
      new ZSchemaValidatorFactory(),
      new ValidatorRegistry(),
      new PropertyBindingRegistry(),
      new JEXLExpressionCompilerFactory(),
      new DefaultLogService(3)
    );
    const extensionsProperty = factory.createProperty({
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          url: {type: 'string'},
          extension: {type: 'array', items: {type: 'object', properties: {}}},
          valueAddress: {type: 'object', properties: {}},
          valueAge: {type: 'object', properties: {}},
          valueInteger: {type: 'integer'},
          valuePositiveInt: {type: 'integer'},
          '__$isValueX': {type: 'boolean'},
          '__$valueType': {type: 'string'},
          '__$valueTypeCategory': {type: 'string'},
          '__$primitiveType': {type: 'string'},
          '__$stringify': {type: 'string'}
        }
      }
    }) as ArrayProperty;
    extensionsProperty.setValue([{url: extensionUrl, valueInteger: 2}], false);
    service.setExtensions(extensionsProperty);

    const importedProperty = service.getFirstExtensionFormPropertyByUrl(extensionUrl) as PropertyGroup;
    expect(importedProperty.getProperty('valuePositiveInt')).toBeUndefined();

    service.resetExtension(
      extensionUrl,
      {url: extensionUrl, valuePositiveInt: 2},
      'valuePositiveInt',
      false
    );

    expect(service.getFirstExtensionByUrl(extensionUrl).valuePositiveInt).toBe(2);
    expect(service.getFirstExtensionByUrl(extensionUrl).valueInteger).toBeUndefined();
    expect(
      (service.getFirstExtensionFormPropertyByUrl(extensionUrl) as PropertyGroup)
        .getProperty('valuePositiveInt')
    ).toBeDefined();
  });

  describe('updateExtension', () => {

    it('should return null/undefined for null or undefined input', () => {
      expect(service.updateExtension(null)).toBeNull();
      expect(service.updateExtension(undefined)).toBeUndefined();
    });

    it('should set __$isValueX=true and __$valueType for a primitive value type extension', () => {
      const ext: any = {
        url: 'http://example.org',
        valueString: 'Test value'
      };
      const result = service.updateExtension(ext);

      expect(result['__$isValueX']).toBe(true);
      expect(result['__$valueType']).toBe('valueString');
      expect(result['__$valueTypeCategory']).toBe('__$primitiveType');
      expect(result['__$primitiveType']).toBe('valueString');
      expect(result['__$stringify']).toBe(JSON.stringify('Test value', null, 2));
    });

    it('should set __$isValueX=true for a complex value type extension (valueCoding)', () => {
      const ext: any = {
        url: 'http://example.org',
        valueCoding: { system: 'http://loinc.org', code: '12345', display: 'Test' }
      };
      const result = service.updateExtension(ext);

      expect(result['__$isValueX']).toBe(true);
      expect(result['__$valueType']).toBe('valueCoding');
      expect(result['__$valueTypeCategory']).toBe('__$generalPurposeDatatype');
      expect(result['__$generalPurposeDatatype']).toBe('valueCoding');
      expect(result['__$stringify']).toBe(JSON.stringify(ext.valueCoding));
    });

    it('should set __$isValueX=false and __$valueType=extension for nested extensions', () => {
      const ext: any = {
        url: 'http://example.org/nested',
        extension: [
          { url: 'name', valueId: 'patient' },
          { url: 'type', valueCode: 'Patient' }
        ]
      };
      const result = service.updateExtension(ext);

      expect(result['__$isValueX']).toBe(false);
      expect(result['__$valueType']).toBe('extension');
      expect(result['__$valueTypeCategory']).toBeUndefined();
      // __$stringify should exclude __$ keys from nested extensions
      const parsed = JSON.parse(result['__$stringify']);
      expect(parsed.length).toBe(2);
      expect(parsed[0].url).toBe('name');
      expect(result['__$stringify']).not.toContain('\n');
    });

    it('should eliminate empty fields from the extension', () => {
      const ext: any = {
        url: 'http://example.org',
        valueString: 'hello',
        valueInteger: null,
        valueBoolean: undefined
      };
      const result = service.updateExtension(ext);

      expect(result['__$isValueX']).toBe(true);
      expect(result['__$valueType']).toBe('valueString');
      // null/undefined values should have been eliminated
      expect(result.valueInteger).toBeUndefined();
      expect(result.valueBoolean).toBeUndefined();
    });

    it('should handle extension with integer value type', () => {
      const ext: any = {
        url: 'http://example.org',
        valueInteger: 42
      };
      const result = service.updateExtension(ext);

      expect(result['__$isValueX']).toBe(true);
      expect(result['__$valueType']).toBe('valueInteger');
      expect(result['__$stringify']).toBe(JSON.stringify(42, null, 2));
    });

    it('should handle extension with positive integer value type', () => {
      const ext: any = {
        url: 'http://example.org',
        valuePositiveInt: 3
      };
      const result = service.updateExtension(ext);

      expect(result['__$isValueX']).toBe(true);
      expect(result['__$valueType']).toBe('valuePositiveInt');
      expect(result['__$valueTypeCategory']).toBe('__$primitiveType');
      expect(result['__$primitiveType']).toBe('valuePositiveInt');
      expect(result['__$stringify']).toBe(JSON.stringify(3, null, 2));
    });
  });
});
