import {
  EXTENSION_URL_CHOICE_ORIENTATION,
  EXTENSION_URL_COLUMN_COUNT,
  EXTENSION_URL_CUSTOM_VARIABLE_TYPE,
  EXTENSION_URL_ENTRY_FORMAT,
  EXTENSION_URL_MIME_TYPE,
  EXTENSION_URL_QUESTIONNAIRE_UNIT,
  EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
  EXTENSION_URL_VARIABLE,
  PREFERRED_TERMINOLOGY_SERVER_URI
} from './constants/constants';
import {
  ExtensionDefs,
  EXTENSION_MAX_CARDINALITIES,
  getExtensionMaxCardinality
} from './extension-defs';

describe('extension cardinality', () => {
  it('should retain the legacy preferred terminology server definition', () => {
    expect(ExtensionDefs.preferredTerminologyServer).toEqual({
      url: PREFERRED_TERMINOLOGY_SERVER_URI,
      valueX: 'valueUrl'
    });
  });

  it('should contain locally known singleton and repeatable cardinalities', () => {
    expect(EXTENSION_MAX_CARDINALITIES.get(EXTENSION_URL_ENTRY_FORMAT)).toBe('1');
    expect(EXTENSION_MAX_CARDINALITIES.get(EXTENSION_URL_QUESTIONNAIRE_UNIT)).toBe('1');
    expect(EXTENSION_MAX_CARDINALITIES.get(EXTENSION_URL_CHOICE_ORIENTATION)).toBe('1');
    expect(EXTENSION_MAX_CARDINALITIES.get(EXTENSION_URL_COLUMN_COUNT)).toBe('1');
    expect(EXTENSION_MAX_CARDINALITIES.get(EXTENSION_URL_CUSTOM_VARIABLE_TYPE)).toBe('1');
    expect(EXTENSION_MAX_CARDINALITIES.get(EXTENSION_URL_MIME_TYPE)).toBe('*');
    expect(EXTENSION_MAX_CARDINALITIES.get(EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION)).toBe('*');
    expect(EXTENSION_MAX_CARDINALITIES.get(EXTENSION_URL_VARIABLE)).toBe('*');
    expect(EXTENSION_MAX_CARDINALITIES.get(PREFERRED_TERMINOLOGY_SERVER_URI)).toBe('*');
  });

  it('should distinguish single and repeatable cardinalities', () => {
    expect(getExtensionMaxCardinality(EXTENSION_URL_ENTRY_FORMAT)).toBe('1');
    expect(getExtensionMaxCardinality(EXTENSION_URL_MIME_TYPE)).toBe('*');
    expect(getExtensionMaxCardinality('http://hl7.org/fhir/StructureDefinition/replaces')).toBe('*');
    expect(getExtensionMaxCardinality(
      'http://hl7.org/fhir/StructureDefinition/questionnaire-referenceProfile'
    )).toBe('*');
  });

  it('should trim URLs before checking the cardinality metadata', () => {
    expect(getExtensionMaxCardinality(`  ${EXTENSION_URL_ENTRY_FORMAT}  `)).toBe('1');
  });

  it('should preserve unknown standard, custom, and relative extension URLs as unknown', () => {
    expect(getExtensionMaxCardinality('http://hl7.org/fhir/StructureDefinition/unlisted-extension')).toBe('unknown');
    expect(getExtensionMaxCardinality('http://example.org/custom-extension')).toBe('unknown');
    expect(getExtensionMaxCardinality('child-slice')).toBe('unknown');
  });
});
