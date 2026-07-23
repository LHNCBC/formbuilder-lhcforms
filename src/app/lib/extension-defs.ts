import {
  EXTENSION_URL_MIME_TYPE,
  EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
  EXTENSION_URL_VARIABLE,
  PREFERRED_TERMINOLOGY_SERVER_URI
} from './constants/constants';

/**
 * Extension URLs that permit more than one occurrence at the same location.
 *
 * This is intentionally an allowlist rather than a complete extension registry.
 * Duplicate validation only needs to know the exceptions that are repeatable;
 * every URL not listed here—including known singleton and custom extensions—
 * safely defaults to a maximum of one occurrence. This keeps the cardinality
 * rule explicit and avoids maintaining unused value[x] metadata for singleton
 * extensions.
 */
export const REPEATABLE_EXTENSION_URLS: ReadonlySet<string> = new Set([
  EXTENSION_URL_MIME_TYPE,
  EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
  EXTENSION_URL_VARIABLE,
  PREFERRED_TERMINOLOGY_SERVER_URI
]);

/**
 * Whether an extension may occur more than once at the same location.
 * Unknown/custom extensions default to a maximum of one occurrence.
 * @param url - The extension URL whose cardinality should be checked.
 * @returns True when the extension URL is in the repeatable allowlist.
 */
export function extensionAllowsMultiple(url: string): boolean {
  return REPEATABLE_EXTENSION_URLS.has(url?.trim());
}
