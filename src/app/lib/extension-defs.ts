import {
  EXTENSION_URL_ANSWER_EXPRESSION,
  EXTENSION_URL_CALCULATED_EXPRESSION,
  EXTENSION_URL_CHOICE_ORIENTATION,
  EXTENSION_URL_COLUMN_COUNT,
  EXTENSION_URL_CUSTOM_VARIABLE_TYPE,
  EXTENSION_URL_ENABLEWHEN_EXPRESSION,
  EXTENSION_URL_ENTRY_FORMAT,
  EXTENSION_URL_INITIAL_EXPRESSION,
  EXTENSION_URL_ITEM_CONTROL,
  EXTENSION_URL_MIME_TYPE,
  EXTENSION_URL_QUESTIONNAIRE_UNIT,
  EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
  EXTENSION_URL_RENDERING_STYLE,
  EXTENSION_URL_RENDERING_XHTML,
  EXTENSION_URL_VARIABLE,
  PREFERRED_TERMINOLOGY_SERVER_URI
} from './constants/constants';

const FHIR_STRUCTURE_DEFINITION_BASE = 'http://hl7.org/fhir/StructureDefinition';

export type KnownExtensionMaxCardinality = '1' | '*';
export type ExtensionMaxCardinality = KnownExtensionMaxCardinality | 'unknown';

/**
 * Legacy extension metadata shape retained for compatibility with historical
 * consumers of ExtensionDefs.
 * @deprecated Use the exported extension URL constants instead.
 */
export interface ExtensionDef {
  url: string;
  valueX?: string;
  multiple?: boolean;
}

/**
 * Legacy extension definitions retained for compatibility with historical
 * Cypress sources and external consumers.
 * @deprecated Use PREFERRED_TERMINOLOGY_SERVER_URI instead.
 */
export class ExtensionDefs {
  static preferredTerminologyServer: ExtensionDef = {
    url: PREFERRED_TERMINOLOGY_SERVER_URI,
    valueX: 'valueUrl'
  };
}

/**
 * Root cardinalities from the extension definitions used directly by Form Builder.
 *
 * This is not intended to replace a version-specific StructureDefinition
 * registry. It records only definitions for which the application already has
 * local knowledge. URLs absent from this map must remain permissive because
 * standard and implementer-defined extensions may declare a root max of "*".
 */
export const EXTENSION_MAX_CARDINALITIES: ReadonlyMap<string, KnownExtensionMaxCardinality> =
  new Map<string, KnownExtensionMaxCardinality>([
    [EXTENSION_URL_ANSWER_EXPRESSION, '1'],
    [EXTENSION_URL_CALCULATED_EXPRESSION, '1'],
    [EXTENSION_URL_CHOICE_ORIENTATION, '1'],
    [EXTENSION_URL_COLUMN_COUNT, '1'],
    [EXTENSION_URL_CUSTOM_VARIABLE_TYPE, '1'],
    [EXTENSION_URL_ENABLEWHEN_EXPRESSION, '1'],
    [EXTENSION_URL_ENTRY_FORMAT, '1'],
    [EXTENSION_URL_INITIAL_EXPRESSION, '1'],
    [EXTENSION_URL_ITEM_CONTROL, '1'],
    [EXTENSION_URL_QUESTIONNAIRE_UNIT, '1'],
    [EXTENSION_URL_RENDERING_STYLE, '1'],
    [EXTENSION_URL_RENDERING_XHTML, '1'],
    [EXTENSION_URL_MIME_TYPE, '*'],
    [EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION, '*'],
    [EXTENSION_URL_VARIABLE, '*'],
    [`${FHIR_STRUCTURE_DEFINITION_BASE}/questionnaire-referenceProfile`, '*'],
    [`${FHIR_STRUCTURE_DEFINITION_BASE}/questionnaire-referenceResource`, '*'],
    [`${FHIR_STRUCTURE_DEFINITION_BASE}/questionnaire-supportLink`, '*'],
    [`${FHIR_STRUCTURE_DEFINITION_BASE}/replaces`, '*'],
    [PREFERRED_TERMINOLOGY_SERVER_URI, '*']
  ]);

/**
 * Get the known root maximum cardinality for an extension.
 * @param url - The extension URL whose cardinality should be checked.
 * @returns The known maximum, or "unknown" when no local metadata is available.
 */
export function getExtensionMaxCardinality(url: string): ExtensionMaxCardinality {
  return EXTENSION_MAX_CARDINALITIES.get(url?.trim()) ?? 'unknown';
}
