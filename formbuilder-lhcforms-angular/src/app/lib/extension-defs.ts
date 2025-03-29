/**
 * Defines some known FHIR extensions, such as an extension's uri and associated value[x] etc.
 */

export interface ExtensionDef {
  url: string;
  valueX?: string;
  multiple?: boolean;
}

/**
 * Include all the known extensions here.
 */
export class ExtensionDefs {
  static preferredTerminologyServer: ExtensionDef = {
    url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-preferredTerminologyServer',
    valueX: 'valueUrl'
  }
}

