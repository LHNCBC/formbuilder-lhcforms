import fhir from 'fhir/r4';
import {fhirPrimitives} from '../../../fhir';

/**
 * Create an updated integer extension while retaining its existing metadata.
 *
 * @param currentExtension - Existing extension, if one has already been persisted.
 * @param extUrl - URI of the extension to update.
 * @param value - New integer value for the extension.
 * @returns The updated extension.
 */
export function mergeIntegerExtension(
  currentExtension: fhir.Extension | null,
  extUrl: fhirPrimitives.url,
  value: number
): fhir.Extension {
  return {
    ...currentExtension,
    url: extUrl,
    valueInteger: value
  };
}
