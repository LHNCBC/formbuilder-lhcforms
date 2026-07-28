import {
  EXTENSION_URL_ENTRY_FORMAT,
  EXTENSION_URL_MIME_TYPE,
  EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
  EXTENSION_URL_VARIABLE,
  PREFERRED_TERMINOLOGY_SERVER_URI
} from './constants/constants';
import {ExtensionDefs, REPEATABLE_EXTENSION_URLS, extensionAllowsMultiple} from './extension-defs';

describe('repeatable extension URLs', () => {
  it('should retain the legacy preferred terminology server definition', () => {
    expect(ExtensionDefs.preferredTerminologyServer).toEqual({
      url: PREFERRED_TERMINOLOGY_SERVER_URI,
      valueX: 'valueUrl'
    });
  });

  it('should contain the known repeatable extension URLs', () => {
    expect(REPEATABLE_EXTENSION_URLS).toEqual(new Set([
      EXTENSION_URL_MIME_TYPE,
      EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
      EXTENSION_URL_VARIABLE,
      PREFERRED_TERMINOLOGY_SERVER_URI
    ]));
  });

  it('should allow duplicate URLs only for known repeatable extensions', () => {
    REPEATABLE_EXTENSION_URLS.forEach((url) => {
      expect(extensionAllowsMultiple(url)).toBeTrue();
    });
    expect(extensionAllowsMultiple(EXTENSION_URL_ENTRY_FORMAT)).toBeFalse();
  });

  it('should trim URLs before checking the allowlist', () => {
    expect(extensionAllowsMultiple(`  ${EXTENSION_URL_MIME_TYPE}  `)).toBeTrue();
  });

  it('should default unknown custom extensions to one occurrence', () => {
    expect(extensionAllowsMultiple('http://example.org/custom-extension')).toBeFalse();
  });
});
