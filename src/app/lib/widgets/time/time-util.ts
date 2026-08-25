import { FHIR_TIME_PATTERN, WidgetValidationError } from '../../validation-utils';

const fhirTimeRegex = new RegExp(FHIR_TIME_PATTERN);

/**
 * Removes a stale time-pattern error only when the current value independently
 * satisfies the FHIR time format. Genuine format errors remain visible.
 */
export function filterSpuriousTimePatternErrors(
  errors: WidgetValidationError[] | null,
  value: unknown
): WidgetValidationError[] | null {
  if (!errors?.length || typeof value !== 'string' || !fhirTimeRegex.test(value)) {
    return errors;
  }

  return errors.filter((error) => error.code !== 'PATTERN');
}
