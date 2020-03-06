var formBuilderDef = {
  "type": "LOINC",
  "code": "basicItemLevelFields",
  "name": "Define Question ",
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
      /*
      ******** item type: 'group' determines item.header=true, 'display' determines item.dataType=TITLE, and
      * 'question' will show dataType pull down to get other item.dataType values
      */
      "questionCode": "__itemType",
      "question": "Item type*",
      "dataType": "CNE",
      "header": false,
      "answers": "itemType",
      "codingInstructions": "Choose the type item you want to create",
      "answerCardinality": {
        "min": "1",
        "max": "1"
      },
      "value": {
        "code": "question",
        "text": "Question"
      }
    },
    {
      // *********** Data type ************************,
      "questionCode": "dataType",
      "question": "Data type*",
      "dataType": "CNE",
      "header": false,
      "answers": "dataType",
      "codingInstructions": "Enter the data type of the answer. Valid data types are:",
      "displayControl": {
        "answerLayout": {
          "type": "COMBO_BOX"
        }
      },
      "answerCardinality": {
        "min": "1",
        "max": "1"
      },
      "value": {
        "text": "String",
        "code": "ST"
      },
      "skipLogic": {
        "conditions": [
          {
            "source": "__itemType",
            "trigger": {"value": {"code": "question"}}
          }
        ],
        "action": "show"
      }
    },
    {
      // *********** question ************************,
      "questionCode": "question",
      "question": "Item name*",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "This is required: Enter the section header or question text exactly as it is displayed on your form."
    },
    {
      "questionCode": "questionCodeSystem",
      "question": "Item coding system",
      "dataType": "CNE",
      "answers": "questionCodeSystem",
      "header": false,
      "answerCardinality": {
        "min": "1",
        "max": "1"
      },
      "editable": "0",
      "codingInstructions": "Select \"LOINC\" to use LOINC codes, or create your own coding system by selecting \"Custom.\"",
      "value": {
        "text": "Custom",
        "code": "Custom"
      }
    },
    {
      // *********** questionCode ************************,
      "questionCode": "questionCode",
      "question": "Item code*",
      "dataType": "ST",
      "header": false,
      "answerCardinality": {
        "min": "1",
        "max": "1"
      },
      "editable": "1",
      "codingInstructions": "This is required: Enter the unique question code for the question or section header given in the Text field. <p>If a question or section header is not available, enter any unique identifier in square brackets, e.g., [Q1], [Q2], [H1].</p>"
    },
    {
      // *********** prefix ************************,
      "questionCode": "prefix",
      "question": "Prefix",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "A short label for a particular group, question or set of display text within the questionnaire used for reference by the individual completing the questionnaire."
    },
    {
      // *********** localQuestionCode ************************,
      "questionCode": "localQuestionCode",
      "question": "Local code",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "Enter a unique code for the question you are creating. Exmples are 1 or A1."
    },
    {
      // *********** codingInstructions ************************,
      "questionCode": "codingInstructions",
      "question": "Help text for the item [1]",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "Instructions for the person completing the form on how to answer a specific item. This could include additional explanatory text that supplements the question or the number of expected responses."
    },
    // ************* repeatQuestion ***************************,
    {
      "questionCode": "questionCardinality",
      "question": "Repeat this item? [1]",
      "header": false,
      "codingInstructions": "Choose 'Yes' if this question should be repeated multiple times.",
      "dataType": "CNE",
      "answers": "boolean",
      "value": {
        "text": "No",
        "code": false
      }
    },
    {
      "questionCode": "answerRequired",
      "question": "Answer required?",
      "codingInstructions": "Choose 'Yes' to allow selection of multiple answers from the the answer list.",
      "header": false,
      "dataType": "CNE",
      "answers": "boolean",
      "value": {
        "text": "No",
        "code": false
      },
      "skipLogic": {
        "conditions": [
          {
            "source": "__itemType",
            "trigger": {"value": {"code": "question"}}
          }
        ],
        "action": "show"
      }
    },
    {
      "questionCode": "editable",
      "question": "Editable",
      "dataType": "CNE",
      "header": false,
      "answerCardinality": {
        "min": "0",
        "max": "1"
      },
      "answers": "editable",
      "codingInstructions": "Select one of the options to determine whether user data that is entered for this question can be edited.",
      "skipLogic": {
        "conditions": [
          {
            "source": "__itemType",
            "trigger": {"value": {"code": "question"}}
          }
        ],
        "action": "show"
      },
      "displayControl": {
        "answerLayout": {
          "type": "RADIO_CHECKBOX",
          "columns": "1"
        }
      },
      "value": {
        "text": "Editable",
        "code": "1"
      }
    },
    {
      "questionCode": "answers",
      "question": "Answer item",
      "header": true,
      "codingInstructions": "If using the data type CWE or CNE, enter the answer list here using the format LABEL:CODE:TEXT:FORMAT:OTHER.",
      "questionCardinality": {
        "min": "1",
        "max": "*"
      },
      "skipLogic": {
        "logic": "ANY",
        "conditions": [
          {
            "source": "dataType",
            "trigger": {
              "value": {
                "code": "CNE"
              }
            }
          },
          {
            "source": "dataType",
            "trigger": {
              "value": {
                "code": "CWE"
              }
            }
          }
        ],
        "action": "show"
      },
      "items": [
        {
          "questionCode": "text",
          "question": "Answer text*",
          "dataType": "ST",
          "answerCardinality": {
            "min": "1",
            "max": "1"
          },
          "codingInstructions": "Enter the text of the answer here.",
          "header": false
        },
        {
          "questionCode": "code",
          "question": "Answer code",
          "dataType": "ST",
          "codingInstructions": "If desired, enter an answer code.",
          "header": false
        },
        {
          "questionCode": "system",
          "question": "Answer code system",
          "dataType": "ST",
          "codingInstructions": "If desired, enter a your coding system.",
          "header": false
        },
        {
          "questionCode": "label",
          "question": "Answer label",
          "dataType": "ST",
          "codingInstructions": "Enter a label such as \"A\" or \"1\" or \"T\" if you wish to assign a label to each answer.",
          "header": false
        },
        {
          "questionCode": "score",
          "question": "Score",
          "dataType": "INT",
          "codingInstructions": "If desired, enter a number to assign a numerical value to this answer for scoring purposes.",
          "header": false
        },
        {
          "questionCode": "other",
          "question": "Specify with free text",
          "dataType": "CNE",
          "answers": "boolean",
          "codingInstructions": "Choose to add additional field for other. Enter the text of an additional question in the Answer text above.",
          "header": false,
          "value": {
            "text": "No",
            "code": false
          }
        },
        {
          "questionCode": "otherValue",
          "question": "Hint to show in 'other' input",
          "dataType": "ST",
          "codingInstructions": "Enter the text to prompt in 'other' input.",
          "header": false,
          "skipLogic": {
            "logic": "ANY",
            "conditions": [
              {
                "source": "other",
                "trigger": {"value": {"code": true}}
              }
            ],
            "action": "show"
          }
        }
      ]
    },
    {
      "questionCode": "multipleAnswers",
      "question": "Allow multiple answers? [2]",
      "codingInstructions": "Choose 'Yes' to allow selection of multiple answers from the the answer list.",
      "header": false,
      "dataType": "CNE",
      "answers": "boolean",
      "value": {
        "text": "No",
        "code": false
      },
      "skipLogic": {
        "logic": "ANY",
        "conditions": [
          {
            "source": "dataType",
            "trigger": {
              "value": {
                "code": "CNE"
              }
            }
          },
          {
            "source": "dataType",
            "trigger": {
              "value": {
                "code": "CWE"
              }
            }
          }
        ],
        "action": "show"
      }
    },
    {
      // *********** Default answer ************************,
      "questionCode": "defaultAnswer",
      "question": "Default answer",
      "dataType": "ST",
      "codingInstructions": "If desired, enter a default answer for the question. If you are using the answer LABEL or CODE fields, enter the default LABEL or CODE.",
      "header": false,
      "skipLogic": {
        "conditions": [
          {
            "source": "__itemType",
            "trigger": {"value": {"code": "question"}}
          }
        ],
        "action": "show"
      },
      "answerCardinality": {
        "min": "0",
        "max": "1"
      }
    },
    {
      // *********** Externally defined Answer list ************************,
      "questionCode": "externallyDefined",
      "question": "URL for externally defined answer list",
      "dataType": "URL",
      "header": false,
      "codingInstructions": "If using an externally defined list of answers to the question, enter it here.",
      "skipLogic": {
        "logic": "ANY",
        "conditions": [
          {
            "source": "dataType",
            "trigger": {
              "value": {
                "code": "CWE"
              }
            }
          },
          {
            "source": "dataType",
            "trigger": {
              "value": {
                "code": "CNE"
              }
            }
          }
        ],
        "action": "show"
      },
      "answerCardinality": {
        "min": "0",
        "max": "1"
      }
    },
    {
      "questionCode": "units",
      "question": "Units [1]",
      "dataType": "CWE",
      "header": false,
      "answerCardinality": {
        "min": "0",
        "max": "*"
      },
      "codingInstructions": "Example units (e.g., #/day) are provided in a dropdown list in each field. You can use one of these if appropriate or enter other units. Units of measure are not necessary for terms with fixed answer lists or free text answers.",
      "skipLogic": {
        "logic": "ANY",
        "conditions": [
          {
            "source": "dataType",
            "trigger": {
              "value": {
                "code": "INT"
              }
            }
          },
          {
            "source": "dataType",
            "trigger": {
              "value": {
                "code": "REAL"
              }
            }
          },
          {
            "source": "dataType",
            "trigger": {
              "value": {
                "code": "RTO"
              }
            }
          }
        ],
        "action": "show"
      },
      "externallyDefined": "https://clinicaltables.nlm.nih.gov/api/ucum/v3/search?df=cs_code,name,guidance",
      "displayControl": {
        "answerLayout": {
          "type": "COMBO_BOX"
        },
        "listColHeaders": ["Unit", "Name", "Guidance"]
      }
    },
  ]
};
