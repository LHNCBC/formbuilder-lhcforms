import { TestBed } from '@angular/core/testing';

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
      expect(result['__$stringify']).toBe(JSON.stringify(ext.valueCoding, null, 2));
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
  });
});
