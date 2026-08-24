import { TestBed } from '@angular/core/testing';

import { ExtensionsService } from './extensions.service';
import { SchemaService } from './schema.service';
import {
  EXTENSION_URL_ANSWER_EXPRESSION,
  EXTENSION_URL_CALCULATED_EXPRESSION,
  EXTENSION_URL_CUSTOM_VARIABLE_TYPE,
  EXTENSION_URL_ENABLEWHEN_EXPRESSION,
  EXTENSION_URL_ENTRY_FORMAT,
  EXTENSION_URL_INITIAL_EXPRESSION,
  EXTENSION_URL_ITEM_CONTROL,
  EXTENSION_URL_MAX_SIZE,
  EXTENSION_URL_MAX_VALUE,
  EXTENSION_URL_MIME_TYPE,
  EXTENSION_URL_MIN_LENGTH,
  EXTENSION_URL_MIN_VALUE,
  EXTENSION_URL_QUESTIONNAIRE_UNIT,
  EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
  EXTENSION_URL_REGEX,
  EXTENSION_URL_VARIABLE,
  PREFERRED_TERMINOLOGY_SERVER_URI
} from '../lib/constants/constants';
import {
  ObservationLinkPeriodComponent
} from '../lib/widgets/observation-link-period/observation-link-period.component';
import {
  ObservationExtractComponent
} from '../lib/widgets/observation-extract/observation-extract.component';

const restrictionExtensionUrls = [
  EXTENSION_URL_MIN_LENGTH,
  EXTENSION_URL_REGEX,
  EXTENSION_URL_MIN_VALUE,
  EXTENSION_URL_MAX_VALUE,
  EXTENSION_URL_MAX_SIZE,
  EXTENSION_URL_MIME_TYPE
];

const itemOnlyExtensionUrls = [
  EXTENSION_URL_ENTRY_FORMAT,
  EXTENSION_URL_INITIAL_EXPRESSION,
  EXTENSION_URL_CALCULATED_EXPRESSION,
  EXTENSION_URL_ANSWER_EXPRESSION,
  EXTENSION_URL_ENABLEWHEN_EXPRESSION,
  EXTENSION_URL_ITEM_CONTROL,
  ...restrictionExtensionUrls,
  EXTENSION_URL_QUESTIONNAIRE_UNIT,
  EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
  ObservationLinkPeriodComponent.extUrl,
  ObservationExtractComponent.extUrl
];

const expectedDedicatedExtensionUrls = [
  EXTENSION_URL_ENTRY_FORMAT,
  EXTENSION_URL_VARIABLE,
  EXTENSION_URL_CUSTOM_VARIABLE_TYPE,
  EXTENSION_URL_INITIAL_EXPRESSION,
  EXTENSION_URL_CALCULATED_EXPRESSION,
  EXTENSION_URL_ANSWER_EXPRESSION,
  EXTENSION_URL_ENABLEWHEN_EXPRESSION,
  EXTENSION_URL_ITEM_CONTROL,
  ...restrictionExtensionUrls,
  EXTENSION_URL_QUESTIONNAIRE_UNIT,
  EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
  PREFERRED_TERMINOLOGY_SERVER_URI,
  ObservationLinkPeriodComponent.extUrl,
  ObservationExtractComponent.extUrl
];

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

  it('should identify the dedicated field in managed extension validation messages', () => {
    expect(service.getManagedExtensionValidationMessage(
      '  http://hl7.org/fhir/StructureDefinition/entryFormat  ',
      'form'
    )).toBe(
      'This extension cannot be added here. Use the dedicated “Entry format” field on a questionnaire item instead.'
    );
    expect(service.getManagedExtensionValidationMessage(
      'http://hl7.org/fhir/StructureDefinition/questionnaire-hidden'
    )).toContain('“Hide this item from users?”');
  });

  it('should include the other scope when the dedicated field is not available here', () => {
    expect(service.getManagedExtensionValidationMessage(EXTENSION_URL_ENTRY_FORMAT, 'form')).toBe(
      'This extension cannot be added here. Use the dedicated “Entry format” field on a questionnaire item instead.'
    );
    expect(service.getManagedExtensionValidationMessage(EXTENSION_URL_ENTRY_FORMAT, 'item')).toBe(
      'This extension cannot be added here. Use the dedicated “Entry format” field instead.'
    );
    expect(service.getManagedExtensionValidationMessage(ObservationExtractComponent.extUrl, 'form')).toBe(
      'This extension cannot be added here. Use the dedicated “Use FHIR Observation extraction?” field under a questionnaire item’s Advanced fields instead.'
    );
    expect(service.getManagedExtensionValidationMessage(PREFERRED_TERMINOLOGY_SERVER_URI, 'item')).toBe(
      'This extension cannot be added here. Use the dedicated “Terminology server” field instead.'
    );
  });

  it('should direct every item-only managed extension from form attributes to a questionnaire item', () => {
    for (const url of itemOnlyExtensionUrls) {
      expect(service.getManagedExtensionValidationMessage(url, 'form')).withContext(url).toContain(
        'questionnaire item'
      );
    }
  });

  it('should register both unit extensions as managed by the Units field', () => {
    for (const url of [EXTENSION_URL_QUESTIONNAIRE_UNIT, EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION]) {
      expect(service.extensionsEditedInWidgets.has(url)).withContext(url).toBeTrue();
      expect(service.getManagedExtensionValidationMessage(url)).withContext(url).toContain(
        'Use the dedicated “Units” field instead.'
      );
    }
  });

  it('should register every extension managed by the Restrictions field', () => {
    for (const url of restrictionExtensionUrls) {
      expect(service.extensionsEditedInWidgets.has(url)).withContext(url).toBeTrue();
      expect(service.getManagedExtensionValidationMessage(url)).withContext(url).toBe(
        'This extension cannot be added here. Use the dedicated “Restrictions” field instead.'
      );
    }
  });

  it('should provide field-specific guidance for every registered dedicated extension', () => {
    expect(service.extensionsEditedInWidgets.size).toBe(expectedDedicatedExtensionUrls.length);
    for (const url of expectedDedicatedExtensionUrls) {
      expect(service.extensionsEditedInWidgets.has(url)).withContext(url).toBeTrue();
      expect(service.isNotEditableInDlg(url)).withContext(url).toBeTrue();
      expect(service.getManagedExtensionValidationMessage(url)).withContext(url).toContain(
        'Use the dedicated “'
      );
    }
  });

  it('should use generic guidance when a managed extension has no registered field label', () => {
    const extensionUrl = 'http://example.org/managed-without-label';
    service.extensionsEditedInWidgets.add(extensionUrl);

    expect(service.getManagedExtensionValidationMessage(extensionUrl)).toBe(
      'This extension is managed by a dedicated Form Builder field and cannot be added here.'
    );
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
  });
});
