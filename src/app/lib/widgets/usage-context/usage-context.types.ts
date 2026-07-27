import type fhir from 'fhir/r4';

export type UsageContextValueKey =
  'valueCodeableConcept' |
  'valueQuantity' |
  'valueRange' |
  'valueReference';

/**
 * Identifier shape accepted by the dialog.
 *
 * FHIR stores Reference.identifier as one Identifier. The schema-form table
 * temporarily wraps it in an array, including recursively nested assigner
 * identifiers, so the edit model deliberately represents both shapes.
 */
export type EditableIdentifier = Omit<fhir.Identifier, 'assigner'> & {
  assigner?: Omit<fhir.Reference, 'identifier'> & {
    identifier?: EditableIdentifier | EditableIdentifier[];
  };
};

export type EditableReference = Omit<fhir.Reference, 'identifier'> & {
  identifier?: EditableIdentifier | EditableIdentifier[];
};

/**
 * FHIR UsageContext augmented with fields and shapes used only while editing.
 */
export type UsageContextEditModel = Omit<fhir.UsageContext, 'valueReference'> & {
  valueReference?: EditableReference;
  __$valueType?: UsageContextValueKey;
  __$valueSummary?: string;
};

export type UsageContextTableField = {
  field?: string;
};
