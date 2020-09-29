var basicFormLevelFieldsDef = {
  "code": "basicFormLevelFields",
  "name": "Form Attributes - Basic",
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
      "questionCode": "shortName",
      "localQuestionCode": "string",
      "question": "Name",
      "dataType": "ST",
      "codingInstructions": "Name for this questionnaire (computer friendly). <br/><b>FHIR Type: string</b>",
      "codingInstructionsFormat": "html",
      "header": false,
      "linkId": "/shortName"
    },
    {
      "questionCode": "name",
      "localQuestionCode": "string",
      "question": "Title",
      "dataType": "ST",
      "codingInstructions": "Name for this questionnaire (human friendly). <br/><b>FHIR Type: string</b>",
      "codingInstructionsFormat": "html",
      "header": false,
      "linkId": "/name"
    },
    {
      "questionCode": "id",
      "localQuestionCode": "id",
      "question": "id",
      "dataType": "ST",
      "editable": "0",
      "restrictions": {
        "pattern": "/^[A-Za-z0-9\\-\\.]{1,64}$/"
      },
      "codingInstructions": "Logical id of this artifact.<br/><b>FHIR type: id</b>",
      "codingInstructionsFormat": "html",
      "header": false,
      "linkId": "/id"
    },
    {
      "questionCode": "status",
      "localQuestionCode": "code",
      "question": "Status*",
      "dataType": "CNE",
      "header": false,
      "answers": "statusCodes",
      "codingInstructions": "Answer is required: draft | active | retired | unknown.<br/><b>FHIR type: code</b>",
      "codingInstructionsFormat": "html",
      "defaultAnswer": {
        "text": "Draft",
        "code": "draft"
      },
      "linkId": "/status"
    },
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
              "defaultAnswer": {
                  "text": "Usual",
                  "code": "usual"
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
      "questionCode": "url",
      "localQuestionCode": "uri",
      "question": "URL",
      "dataType": "URL",
      "codingInstructions": "Canonical identifier for this questionnaire, represented as a URI (globally unique).<br/><b>FHIR type: uri</b>",
      "codingInstructionsFormat": "html",
      "header": false,
      "linkId": "/url"
    },
    {
      "questionCode": "version",
      "localQuestionCode": "string",
      "question": "Version",
      "dataType": "ST",
      "codingInstructions": "Business version of the questionnaire.<br/><b>FHIR type: string</b>",
      "codingInstructionsFormat": "html",
      "header": false,
      "linkId": "/version"
    },
    {
      "questionCode": "deriveFrom",
      "localQuestionCode": "canonical",
      "question": "Derived From",
      "dataType": "URL",
      "header": false,
      "codingInstructions": "Specify original URL if this is derived from another questionnaire.<br/><b>FHIR type: canonical</b>",
      "codingInstructionsFormat": "html",
      "questionCardinality": {
        "min": "0",
        "max": "*"
      },
      "linkId": "/deriveFrom"
    },
    {
      "questionCode": "experimental",
      "localQuestionCode": "boolean",
      "question": "Experimental",
      "dataType": "CNE",
      "header": false,
      "codingInstructions": "For testing purposes, not real usage.<br/><b>FHIR type: boolean</b>",
      "codingInstructionsFormat": "html",
      "answers": "boolean",
      "linkId": "/experimental"
    },
    {
      "questionCode": "subjectType",
      "localQuestionCode": "code",
      "question": "Subject Type",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "Resource that can be subject of QuestionnaireResponse.<br/><b>FHIR type: code</b>",
      "codingInstructionsFormat": "html",
      "questionCardinality": {
        "min": "0",
        "max": "*"
      },
      "linkId": "/subjectType"
    },
    {
      "questionCode": "date",
      "localQuestionCode": "dateTime",
      "question": "Date",
      "dataType": "DTM",
      "editable": "0",
      "header": false,
      "codingInstructions": "Date last changed.<br/><b>FHIR type: dateTime</b>",
      "codingInstructionsFormat": "html",
      "linkId": "/date"
    },
    {
      "questionCode": "publisher",
      "localQuestionCode": "string",
      "question": "Publisher",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "Name of the publisher (organization or individual).<br/><b>FHIR type: string</b>",
      "codingInstructionsFormat": "html",
      "linkId": "/publisher"
    },
    {
      "questionCode": "description",
      "localQuestionCode": "markdown",
      "question": "Description",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "Natural language description of the questionnaire.<br/><b>FHIR type: markdown</b>",
      "codingInstructionsFormat": "html",
      "linkId": "/description"
    },
    {
      "questionCode": "purpose",
      "localQuestionCode": "markdown",
      "question": "Purpose",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "Purpose of this questionnaire.<br/><b>FHIR type: markdown</b>",
      "codingInstructionsFormat": "html",
      "linkId": "/purpose"
    },
    {
      "questionCode": "copyright",
      "localQuestionCode": "markdown",
      "question": "Copyright Notice",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "Add any copy right notice text you wish to include for this item.<br/><b>FHIR type: markdown</b>",
      "codingInstructionsFormat": "html",
      "linkId": "/copyright"
    },
    {
      "questionCode": "approvalDate",
      "localQuestionCode": "date",
      "question": "Approved Date",
      "dataType": "DT",
      "header": false,
      "codingInstructions": "When the questionnaire was approved by publisher.<br/><b>FHIR type: date</b>",
      "codingInstructionsFormat": "html",
      "linkId": "/approvalDate"
    },
    {
      "questionCode": "lastReviewDate",
      "localQuestionCode": "date",
      "question": "Last Reviewed Date",
      "dataType": "DT",
      "header": false,
      "codingInstructions": "When the questionnaire was last reviewed.<br/><b>FHIR type: dateTime</b>",
      "codingInstructionsFormat": "html",
      "linkId": "/lastReviewDate"
    },
    {
      "questionCode": "effectivePeriod",
      "localQuestionCode": "Period",
      "question": "Effective Period",
      "header": true,
      "codingInstructions": "When the questionnaire is expected to be used.<br/><b>FHIR type: Period</b>",
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
          "linkId": "/effectivePeriod/start"
        },
        {
          "questionCode": "end",
          "localQuestionCode": "dateTime",
          "question": "End",
          "dataType": "DTM",
          "header": false,
          "codingInstructions": "End time with inclusive boundary, if not ongoing.<br/><b>FHIR type: dateTime</b>",
          "codingInstructionsFormat": "html",
          "linkId": "/effectivePeriod/end"
        }
      ],
      "linkId": "/effectivePeriod"
    }
  ],
  "lformsVersion": "24.0.0"
};
