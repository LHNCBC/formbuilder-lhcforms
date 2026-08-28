import { TestBed } from '@angular/core/testing';

import { ExtensionsService } from './extensions.service';
import { SchemaService } from './schema.service';
import {
  EXTENSION_URL_ANSWER_EXPRESSION,
  EXTENSION_URL_CALCULATED_EXPRESSION,
  EXTENSION_URL_CHOICE_ORIENTATION,
  EXTENSION_URL_COLUMN_COUNT,
  EXTENSION_URL_COLUMN_COUNT_LEGACY,
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

type TestEditorScope = 'form' | 'item';

interface DedicatedExtensionMessageExpectation {
  urls: ReadonlyArray<string>;
  fieldReference: string;
  itemFieldReference?: string;
  formLocation?: string;
  itemLocation?: string;
  registered?: boolean;
}

const itemLocation = ' on a questionnaire item';
const advancedItemLocation = ' under a questionnaire item’s Advanced fields';

/**
 * Expected user-facing guidance, kept independent of the production registry so
 * adding a managed URL requires explicitly choosing and testing its exact UI label.
 */
const dedicatedExtensionMessageExpectations: ReadonlyArray<DedicatedExtensionMessageExpectation> = [
  {
    urls: [EXTENSION_URL_ENTRY_FORMAT],
    fieldReference: 'the dedicated “Entry format” field',
    formLocation: itemLocation
  },
  {
    urls: [EXTENSION_URL_VARIABLE],
    fieldReference: 'the dedicated “Variables” field',
    itemFieldReference: 'the dedicated “Item variables” field'
  },
  {
    urls: [EXTENSION_URL_CUSTOM_VARIABLE_TYPE],
    fieldReference: 'the dedicated “Variable Type” field',
    formLocation: ' in the “Create/edit variables” dialog opened from the “Variables” section',
    itemLocation: ' in the “Create/edit variables” dialog opened from the “Item variables” section'
  },
  {
    urls: [EXTENSION_URL_INITIAL_EXPRESSION, EXTENSION_URL_CALCULATED_EXPRESSION],
    fieldReference: 'the dedicated “Value method” field',
    formLocation: itemLocation
  },
  {
    urls: [EXTENSION_URL_ANSWER_EXPRESSION],
    fieldReference: 'the dedicated “Answer list source” field',
    formLocation: itemLocation
  },
  {
    urls: [EXTENSION_URL_ENABLEWHEN_EXPRESSION],
    fieldReference: 'the dedicated “Conditional method” field',
    formLocation: advancedItemLocation
  },
  {
    urls: [EXTENSION_URL_ITEM_CONTROL],
    fieldReference: 'one of the dedicated “Answer list layout”, “Question item control”, '
      + '“Group Item Control”, or “Display Item Control” fields',
    formLocation: itemLocation
  },
  {
    urls: [EXTENSION_URL_CHOICE_ORIENTATION],
    fieldReference: 'the dedicated “Choice orientation” field',
    formLocation: itemLocation
  },
  {
    urls: [EXTENSION_URL_COLUMN_COUNT, EXTENSION_URL_COLUMN_COUNT_LEGACY],
    fieldReference: 'the dedicated “Column count” field',
    formLocation: itemLocation
  },
  {
    urls: [
      EXTENSION_URL_MIN_LENGTH,
      EXTENSION_URL_REGEX,
      EXTENSION_URL_MIN_VALUE,
      EXTENSION_URL_MAX_VALUE,
      EXTENSION_URL_MAX_SIZE,
      EXTENSION_URL_MIME_TYPE
    ],
    fieldReference: 'the dedicated “Restrictions” field',
    formLocation: itemLocation
  },
  {
    urls: [EXTENSION_URL_QUESTIONNAIRE_UNIT, EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION],
    fieldReference: 'the dedicated “Units” field',
    formLocation: itemLocation
  },
  {
    urls: [PREFERRED_TERMINOLOGY_SERVER_URI],
    fieldReference: 'the dedicated “Terminology server” field'
  },
  {
    urls: [ObservationLinkPeriodComponent.extUrl],
    fieldReference: 'the dedicated “Add link to pre-populate FHIR Observation?” field',
    formLocation: advancedItemLocation
  },
  {
    urls: [ObservationExtractComponent.extUrl],
    fieldReference: 'the dedicated “Use FHIR Observation extraction?” field',
    formLocation: advancedItemLocation
  },
  {
    // Metadata is ready for the questionnaire-hidden feature, which registers
    // this URL dynamically when that feature is present.
    urls: ['http://hl7.org/fhir/StructureDefinition/questionnaire-hidden'],
    fieldReference: 'the dedicated “Hide this item from users?” field',
    formLocation: itemLocation,
    registered: false
  }
];

const expectedDedicatedExtensionUrls = dedicatedExtensionMessageExpectations
  .filter(({registered}) => registered !== false)
  .flatMap(({urls}) => urls);

function expectedManagedExtensionMessage(
  expectation: DedicatedExtensionMessageExpectation,
  scope: TestEditorScope
): string {
  const fieldReference = scope === 'item' && expectation.itemFieldReference
    ? expectation.itemFieldReference
    : expectation.fieldReference;
  const location = scope === 'form'
    ? expectation.formLocation || ''
    : expectation.itemLocation || '';
  return `This extension cannot be added here. Use ${fieldReference}${location} instead.`;
}

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

  it('should normalize whitespace before finding dedicated-field guidance', () => {
    expect(service.getManagedExtensionValidationMessage(
      '  http://hl7.org/fhir/StructureDefinition/entryFormat  ',
      'form'
    )).toBe(
      'This extension cannot be added here. Use the dedicated “Entry format” field on a questionnaire item instead.'
    );
  });

  it('should point every dedicated extension to its exact field in both editor scopes', () => {
    expect(service.extensionsEditedInWidgets.size).toBe(expectedDedicatedExtensionUrls.length);

    for (const expectation of dedicatedExtensionMessageExpectations) {
      for (const url of expectation.urls) {
        if(expectation.registered !== false) {
          expect(service.extensionsEditedInWidgets.has(url)).withContext(url).toBeTrue();
          expect(service.isNotEditableInDlg(url)).withContext(url).toBeTrue();
        }

        for (const scope of ['form', 'item'] as const) {
          expect(service.getManagedExtensionValidationMessage(url, scope))
            .withContext(`${url} at ${scope} scope`)
            .toBe(expectedManagedExtensionMessage(expectation, scope));
        }
      }
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
