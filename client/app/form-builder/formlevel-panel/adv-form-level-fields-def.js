var advFormLevelFieldsDef = {
  "code": "advFormLevelFields",
  "name": "Form Attributes - Advanced",
  "templateOptions": {
    "allowHTMLInInstructions": true,
    "hideFormControls": true,
    "showFormHeader": false,
    "hideUnits": true,
    "viewMode": "lg",
    "defaultAnswerLayout": {
      "answerLayout": {
        "type": "RADIO_CHECKBOX",
        "columns": "2"
      }
    }
  },
  "items": [
    {
      "questionCode": "identifier",
      "localQuestionCode": "Coding",
      "question": "Identifier",
      "header": true,
      "codingInstructions": "Typically, this is used for identifiers that can go in an HL7 V3 II (instance identifier) data type, and can then identify this questionnaire outside of FHIR, where it is not possible to use the logical URI.<br/><b>FHIR type: Identifier</b>",
      "codingInstructionsFormat": "html",
      "questionCardinality": {
        "min": "0",
        "max": "*"
      },
      "items": [
        {
          "questionCode": "system",
          "localQuestionCode": "uri",
          "question": "System",
          "dataType": "URL",
          "header": false,
          "codingInstructions": "Identity of the terminology system.<br/><b>FHIR type: uri</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/identifier/system"
        },
        {
          "questionCode": "value",
          "localQuestionCode": "string",
          "question": "value",
          "dataType": "ST",
          "header": false,
          "codingInstructions": "The value that is unique.<br/><b>FHIR type: string</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/identifier/value"
        },
        {
          "questionCode": "use",
          "localQuestionCode": "code",
          "question": "Use",
          "dataType": "CNE",
          "answers": "identifierUseCodes",
          "header": false,
          "codingInstructions": "Use: Usual | official | temp | secondary | old (If known)<br/><b>FHIR type: code</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/identifier/use",
          "displayControl": {
            "answerLayout": {
              "type": "COMBO_BOX"
            }
          },
        },
        {
          "questionCode": "period",
          "localQuestionCode": "Period",
          "question": "Identifier Period",
          "header": true,
          "codingInstructions": "Time period during which identifier is/was valid for use.<br/><b>FHIR type: Period</b>",
          "codingInstructionsFormat": "html",
          "items": [
            {
              "questionCode": "start",
              "localQuestionCode": "dateTime",
              "question": "Start",
              "dataType": "DTM",
              "header": false,
              "codingInstructions": "Starting time with inclusive boundary.<br/><b>FHIR type: dateTime</b>",
              "codingInstructionsFormat": "html",
              "linkId": "/identifier/period/start"
            },
            {
              "questionCode": "end",
              "localQuestionCode": "dateTime",
              "question": "End",
              "dataType": "DTM",
              "header": false,
              "codingInstructions": "End time with inclusive boundary, if not ongoing.<br/><b>FHIR type: dateTime</b>",
              "codingInstructionsFormat": "html",
              "linkId": "/identifier/period/end"
            }
          ],
          "linkId": "/identifier/period"
        }
      ],
      "linkId": "/identifier"
    },
    {
      "questionCode": "meta",
      "localQuestionCode": "Meta",
      "question": "Metadata",
      "header": true,
      "codingInstructions": "Metadata about the resource.<br/><b>FHIR type: Meta</b>",
      "codingInstructionsFormat": "html",
      "items": [
        {
          "questionCode": "versionId",
          "localQuestionCode": "id",
          "question": "Version Identifier",
          "dataType": "ST",
          "editable": "0",
          "restrictions": {
            "pattern": "/^[A-Za-z0-9\\-\\.]{1,64}$/"
          },
          "header": false,
          "codingInstructions": "Version specific identifier.<br/><b>FHIR type: id</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/meta/versionId"
        },
        {
          "questionCode": "lastUpdated",
          "localQuestionCode": "instant",
          "question": "Last Updated",
          "dataType": "DTM",
          "editable": "0",
          "header": false,
          "codingInstructions": "When the resource version last changed.<br/><b>FHIR type: instant</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/meta/lastUpdated"
        },
        {
          "questionCode": "source",
          "localQuestionCode": "uri",
          "question": "Source",
          "dataType": "URL",
          "header": false,
          "codingInstructions": "Identifies where the resource comes from.<br/><b>FHIR type: uri</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/meta/source"
        },
        {
          "questionCode": "profile",
          "localQuestionCode": "canonical",
          "question": "Profile",
          "dataType": "URL",
          "header": false,
          "codingInstructions": "Profiles this resource claims to conform to.<br/>Security labels from the Healthcare Privacy and Security Classification System.<br/><b>FHIR type: canonical</b>",
          "codingInstructionsFormat": "html",
          "questionCardinality": {
            "min": "0",
            "max": "*"
          },
          "linkId": "/meta/profile"
        },
        {
          "questionCode": "security",
          "localQuestionCode": "Coding",
          "question": "Security",
          "header": true,
          "codingInstructions": "Security Labels applied to this resource.<br/><b>FHIR type: Coding</b>",
          "codingInstructionsFormat": "html",
          "questionCardinality": {
            "min": "0",
            "max": "*"
          },
          "items": [
            {
              "questionCode": "system",
              "localQuestionCode": "uri",
              "question": "System",
              "dataType": "URL",
              "header": false,
              "codingInstructions": "Identity of the terminology system.<br/><b>FHIR type: uri</b>",
              "codingInstructionsFormat": "html",
              "linkId": "/meta/security/system"
            },
            {
              "questionCode": "version",
              "localQuestionCode": "string",
              "question": "Version",
              "dataType": "ST",
              "header": false,
              "codingInstructions": "Version of the system - if relevant.<br/><b>FHIR type: string</b>",
              "codingInstructionsFormat": "html",
              "linkId": "/meta/security/version"
            },
            {
              "questionCode": "code",
              "localQuestionCode": "code",
              "question": "Code",
              "dataType": "ST",
              "header": false,
              "codingInstructions": "Symbol in syntax defined by the system.<br/><b>FHIR type: code</b>",
              "codingInstructionsFormat": "html",
              "restrictions": {
                "pattern": "/^[A-Za-z0-9\\-\\.]{1,64}$/"
              },
              "linkId": "/meta/security/code"
            },
            {
              "questionCode": "display",
              "localQuestionCode": "string",
              "question": "Display",
              "dataType": "ST",
              "header": false,
              "codingInstructions": "Representation defined by the system.<br/><b>FHIR type: string</b>",
              "codingInstructionsFormat": "html",
              "linkId": "/meta/security/display"
            },
            {
              "questionCode": "userSelected",
              "localQuestionCode": "boolean",
              "question": "User Selected?",
              "dataType": "CNE",
              "answers": "boolean",
              "header": false,
              "codingInstructions": "If this coding was chosen directly by the user.<br/><b>FHIR type: boolean</b>",
              "codingInstructionsFormat": "html",
              "linkId": "/meta/security/userSelected"
            }
          ],
          "linkId": "/meta/security"
        },
        {
          "questionCode": "tag",
          "localQuestionCode": "Coding",
          "question": "Tag",
          "header": true,
          "codingInstructions": "Tags applied to this resource.<br/>Codes that represent various types of tags, commonly workflow-related; e.g. \"Needs review by Dr. Jones.\"<br/><b>FHIR type: Coding</b>",
          "codingInstructionsFormat": "html",
          "questionCardinality": {
            "min": "0",
            "max": "*"
          },
          "items": [
            {
              "questionCode": "system",
              "localQuestionCode": "uri",
              "question": "System",
              "dataType": "URL",
              "header": false,
              "codingInstructions": "Identity of the terminology system.<br/><b>FHIR type: uri</b>",
              "codingInstructionsFormat": "html",
              "linkId": "/meta/tag/system"
            },
            {
              "questionCode": "version",
              "localQuestionCode": "string",
              "question": "Version",
              "dataType": "ST",
              "header": false,
              "codingInstructions": "Version of the system - if relevant.<br/><b>FHIR type: string</b>",
              "codingInstructionsFormat": "html",
              "linkId": "/meta/tag/version"
            },
            {
              "questionCode": "code",
              "localQuestionCode": "code",
              "question": "Code",
              "dataType": "ST",
              "header": false,
              "codingInstructions": "Symbol in syntax defined by the system.<br/><b>FHIR type: code</b>",
              "codingInstructionsFormat": "html",
              "restrictions": {
                "pattern": "/^[A-Za-z0-9\\-\\.]{1,64}$/"
              },
              "linkId": "/meta/tag/code"
            },
            {
              "questionCode": "display",
              "localQuestionCode": "string",
              "question": "Display",
              "dataType": "ST",
              "header": false,
              "codingInstructions": "Representation defined by the system.<br/><b>FHIR type: string</b>",
              "codingInstructionsFormat": "html",
              "linkId": "/meta/tag/display"
            },
            {
              "questionCode": "userSelected",
              "localQuestionCode": "boolean",
              "question": "User Selected?",
              "dataType": "CNE",
              "answers": "boolean",
              "header": false,
              "codingInstructions": "If this coding was chosen directly by the user.<br/><b>FHIR type: boolean</b>",
              "codingInstructionsFormat": "html",
              "linkId": "/meta/tag/userSelected"
            }
          ],
          "linkId": "/meta/tag"
        }
      ],
      "linkId": "/meta"
    },
    {
      "questionCode": "implicitRules",
      "localQuestionCode": "uri",
      "question": "Implicit Rules",
      "dataType": "URL",
      "header": false,
      "codingInstructions": "A set of rules under which this content was created.<br/><b>FHIR type: uri</b>",
      "codingInstructionsFormat": "html",
      "linkId": "/implicitRules"
    },
    {
      "questionCode": "language",
      "localQuestionCode": "code",
      "question": "Language",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "Language of the resource content.<br/><b>FHIR type: code</b>",
      "codingInstructionsFormat": "html",
      "linkId": "/language"
    },
    {
      "questionCode": "codeList",
      "localQuestionCode": "Coding",
      "question": "Code",
      "header": true,
      "codingInstructions": "Concept that represents the overall questionnaire.<br/><b>FHIR type: Coding</b>",
      "codingInstructionsFormat": "html",
      "questionCardinality": {
        "min": "0",
        "max": "*"
      },
      "items": [
        {
          "questionCode": "system",
          "localQuestionCode": "uri",
          "question": "System",
          "dataType": "URL",
          "header": false,
          "codingInstructions": "Identity of the terminology system.<br/><b>FHIR type: uri</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/codeList/system"
        },
        {
          "questionCode": "version",
          "localQuestionCode": "string",
          "question": "Version",
          "dataType": "ST",
          "header": false,
          "codingInstructions": "Version of the system - if relevant.<br/><b>FHIR type: string</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/codeList/version"
        },
        {
          "questionCode": "code",
          "localQuestionCode": "code",
          "question": "Code",
          "dataType": "ST",
          "header": false,
          "codingInstructions": "Symbol in syntax defined by the system.<br/><b>FHIR type: code</b>",
          "codingInstructionsFormat": "html",
          "restrictions": {
            "pattern": "/^[A-Za-z0-9\\-\\.]{1,64}$/"
          },
          "linkId": "/codeList/code"
        },
        {
          "questionCode": "display",
          "localQuestionCode": "string",
          "question": "Display",
          "dataType": "ST",
          "header": false,
          "codingInstructions": "Representation defined by the system.<br/><b>FHIR type: string</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/codeList/display"
        },
        {
          "questionCode": "userSelected",
          "localQuestionCode": "boolean",
          "question": "User Selected?",
          "dataType": "CNE",
          "answers": "boolean",
          "header": false,
          "codingInstructions": "If this coding was chosen directly by the user.<br/><b>FHIR type: boolean</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/codeList/userSelected"
        }
      ],
      "linkId": "/codeList"
    },
    {
      "questionCode": "_fhirVariables",
      "localQuestionCode": "Expression",
      "question": "FHIRPath Variable",
      "header": true,
      "codingInstructions": "FHIRPath expression.<br/><b>FHIR type: Expression</b>",
      "codingInstructionsFormat": "html",
      "questionCardinality": {
        "min": "0",
        "max": "*"
      },
      "items": [
        {
          "questionCode": "name",
          "localQuestionCode": "id",
          "question": "Name*",
          "dataType": "ST",
          "header": false,
          "codingInstructions": "Name of the questionnaire-variable.<br/><b>FHIR type: id</b>",
          "codingInstructionsFormat": "html",
          "restrictions": {
            "pattern": "/^[A-Za-z0-9\\-\\.]{1,64}$/"
          },
          "linkId": "/_fhirVariables/name"
        },
        {
          "questionCode": "expression",
          "localQuestionCode": "string",
          "question": "FHIRPath Expression",
          "dataType": "TX",
          "header": false,
          "codingInstructions": "No syntax or semantic checks are performed. It is assumed the expression is correct. Please verify in the preview whether it is working as expected.<br/><b>FHIR type: string</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/_fhirVariables/expression"
        },
        {
          "questionCode": "description",
          "localQuestionCode": "string",
          "question": "Description",
          "dataType": "TX",
          "header": false,
          "codingInstructions": "A brief, natural language description of the condition that effectively communicates the intended semantics.<br/><b>FHIR type: string</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/_fhirVariables/description"
        }
      ],
      "linkId": "/_fhirVariables"
    }
  ],
  "lformsVersion": "24.0.0"
};
