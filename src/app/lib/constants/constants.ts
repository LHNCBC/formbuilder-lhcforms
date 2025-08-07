// Data Type
export const TYPE_BOOLEAN = "boolean";
export const TYPE_DECIMAL = "decimal";
export const TYPE_INTEGER = "integer";
export const TYPE_DATE = "date";
export const TYPE_DATETIME = "dateTime";
export const TYPE_TIME = "time";
export const TYPE_STRING = "string";
export const TYPE_TEXT = "text";
export const TYPE_URL = "url";
export const TYPE_CODING = "coding";
export const TYPE_QUANTITY = "quantity";
export const TYPE_GROUP = "group";
export const TYPE_DISPLAY = "display";

// Answer Option Method
export const ANSWER_OPTION_METHOD_ANSWER_OPTION = "answer-option";
export const ANSWER_OPTION_METHOD_SNOMED_VALUE_SET = "snomed-value-set";
export const ANSWER_OPTION_METHOD_VALUE_SET = "value-set";
export const ANSWER_OPTION_METHOD_ANSWER_EXPRESSION = "answer-expression";

// Value Method
export const VALUE_METHOD_TYPE_INITIAL = "type-initial";
export const VALUE_METHOD_PICK_INITIAL = "pick-initial";
export const VALUE_METHOD_COMPUTE_INITIAL = "compute-initial";
export const VALUE_METHOD_COMPUTE_CONTINUOUSLY = "compute-continuously";
export const VALUE_METHOD_NONE = "none";


// Extension URL
// formerly ENTRY_FORMAT_URI
export const EXTENSION_URL_ENTRY_FORMAT = 'http://hl7.org/fhir/StructureDefinition/entryFormat';
// formerly VARIABLE
export const EXTENSION_URL_VARIABLE = 'http://hl7.org/fhir/StructureDefinition/variable';
// formerly CUSTOM_EXT_VARIABLE_TYPE
export const EXTENSION_URL_CUSTOM_VARIABLE_TYPE = 'http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type';
// formerly INITIAL_EXPRESSION
export const EXTENSION_URL_INITIAL_EXPRESSION = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression';
// formerly CALCULATED_EXPRESSION
export const EXTENSION_URL_CALCULATED_EXPRESSION = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression';
// formerly ANSWER_EXPRESSION
export const EXTENSION_URL_ANSWER_EXPRESSION = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-answerExpression';

// Unit
// formerly questionUnitExtUrl
export const EXTENSION_URL_QUESTIONNAIRE_UNIT = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit';
// formerly questionUnitOptionExtUrl
export const EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption';
// formerly ucumSystemUrl
export const EXTENSION_URL_UCUM_SYSTEM = 'http://unitsofmeasure.org'

// formerly ITEM_CONTROL_EXT_URL
export const EXTENSION_URL_ITEM_CONTROL = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl';
// formerly RENDERING_STYLE_EXT_URL
export const EXTENSION_URL_RENDERING_STYLE = 'http://hl7.org/fhir/StructureDefinition/rendering-style';
// formerly RENDERING_XHTML_EXT_URL
export const EXTENSION_URL_RENDERING_XHTML = 'http://hl7.org/fhir/StructureDefinition/rendering-xhtml';