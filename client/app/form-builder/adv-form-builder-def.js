var advFormBuilderDef = {
  "type": "LOINC",
  "code": "advancedItemLevelFields",
  "name": "Advanced",
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
      "questionCode": "_isHeader",
      "question": "You should never see this!",
      "dataType": "ST",
      "header": false,
      "displayControl": {
        "css": [
          {
            "name": "display",
            "value": "none"
          }
        ]
      },
      "value": "No",
      "linkId": "/_isHeader"
    },
    {
      "questionCode": "_dataType",
      "question": "You should never see this!",
      "dataType": "ST",
      "header": false,
      "displayControl": {
        "css": [
          {
            "name": "display",
            "value": "none"
          }
        ]
      },
      "linkId": "/_dataType"
    },
    {
      "questionCode": "_externallyDefined",
      "question": "You should never see this!",
      "dataType": "BL",
      "header": false,
      "displayControl": {
        "css": [
          {
            "name": "display",
            "value": "none"
          }
        ]
      },
      "linkId": "/_externallyDefined"
    },
    {
      "questionCode": "_linkId",
      "question": "You should never see this!",
      "dataType": "ST",
      "header": false,
      "displayControl": {
        "css": [
          {
            "name": "display",
            "value": "none"
          }
        ]
      },
      "linkId": "/_linkId"
    },
    {
      "questionCode": "_questionCode",
      "question": "You should never see this!",
      "dataType": "ST",
      "header": false,
      "displayControl": {
        "css": [
          {
            "name": "display",
            "value": "none"
          }
        ]
      },
      "linkId": "/_questionCode"
    },
    {
      "questionCode": "__itemTypeRef",
      "question": "You should never see this!",
      "dataType": "ST",
      "header": false,
      "displayControl": {
        "css": [
          {
            "name": "display",
            "value": "none"
          }
        ]
      },
      "linkId": "/__itemTypeRef"
    },
    {
      "questionCode": "_calculationMethod",
      "question": "Calculation [2]",
      "dataType": "CNE",
      "header": false,
      "answers": "_calculationMethod",
      "codingInstructions": "Applies if siblings have answer list with scores. Contains the calculation method (formula) in human readable form, for calculating the value of any measure that is based on an algebraic or other formula.",
      "skipLogic": {
        "conditions": [
          {
            "source": "/_dataType",
            "trigger": {
              "value": "QTY"
            }
          },
          {
            "source": "/_dataType",
            "trigger": {
              "value": "REAL"
            }
          },
          {
            "source": "/_dataType",
            "trigger": {
              "value": "INT"
            }
          }
        ],
        "action": "show",
        "logic": "ANY"
      },
      "answerCardinality": {
        "min": "0",
        "max": "1"
      },
      "value": {
        "text": "None",
        "code": "none"
      },
      "linkId": "/_calculationMethod"
    },
    {
      "questionCode": "calculatedExpression",
      "question": "FHIRPath calculated expression [2]",
      "dataType": "TX",
      "header": false,
      "codingInstructions": "Calculated value for a question answer as determined by an FHIRPath evaluated expression. The expression is not validated for syntax or semantics. It is author's responsibility to enter correct expression.",
      "skipLogic": {
        "conditions": [
          {
            "source": "/__itemTypeRef",
            "trigger": {
              "value": "question"
            }
          },
          {
            "source": "/_calculationMethod",
            "trigger": {
              "value": {
                "code": "calculatedExpression"
              }
            }
          }
        ],
        "action": "show",
        "logic": "ALL"
      },
      "linkId": "/calculatedExpression"
    },
    {
      "questionCode": "useRestrictions",
      "question": "Add restrictions",
      "dataType": "CNE",
      "answers": "boolean",
      "header": false,
      "codingInstructions": "Choose to add value restrictions to the input.",
      "value": {
        "text": "No",
        "code": false
      },
      "skipLogic": {
        "conditions": [
          {
            "source": "/__itemTypeRef",
            "trigger": {
              "value": "question"
            }
          },
          {
            "source": "/_dataType",
            "trigger": {
              "notEqual": "__CNE_OR_CWE__"
            }
          }
        ],
        "action": "show",
        "logic": "ALL"
      },
      "items": [
        {
          "questionCode": "restrictions",
          "question": "Restriction",
          "header": true,
          "codingInstructions": "Choose to add restriction to the input of this item.",
          "skipLogic": {
            "action": "show",
            "logic": "ALL",
            "conditions": [
              {
                "source": "/useRestrictions",
                "trigger": {
                  "value": {
                    "code": true
                  }
                }
              }
            ]
          },
          "questionCardinality": {
            "min": "1",
            "max": "*"
          },
          "items": [
            {
              "questionCode": "name",
              "question": "Type",
              "dataType": "CNE",
              "displayControl": {
                "answerLayout": {
                  "type": "COMBO_BOX"
                }
              },
              "answers": "restrictionName",
              "header": false,
              "codingInstructions": "Pick a restriction from the supported list of types",
              "linkId": "/useRestrictions/restrictions/name"
            },
            {
              "questionCode": "value",
              "question": "Value",
              "dataType": "ST",
              "header": false,
              "codingInstructions": "Enter value for the selected restriction",
              "linkId": "/useRestrictions/restrictions/value"
            }
          ],
          "linkId": "/useRestrictions/restrictions"
        }
      ],
      "linkId": "/useRestrictions"
    },
    {
      "questionCode": "useSkipLogic",
      "question": "Add conditional show logic?",
      "dataType": "CNE",
      "answers": "boolean",
      "header": false,
      "codingInstructions": "Choose to add show logic to conditionally include this item.",
      "value": {
        "text": "No",
        "code": false
      },
      "items": [
        {
          "questionCode": "skipLogic",
          "question": "Criteria to show this item",
          "header": true,
          "codingInstructions": "Choose to add skip logic to conditionally display this item.",
          "skipLogic": {
            "action": "show",
            "logic": "ALL",
            "conditions": [
              {
                "source": "/useSkipLogic",
                "trigger": {
                  "value": {
                    "code": true
                  }
                }
              }
            ]
          },
          "items": [
            {
              "questionCode": "action",
              "question": "Show or hide?",
              "dataType": "CNE",
              "answers": "skipLogicAction",
              "header": false,
              "codingInstructions": "Pick an action to perform if the conditions are satisfied. If the condition is NOT satisfied, opposite action is implied.",
              "skipLogic": {
                "conditions": [
                  {
                    "source": "/_isHeader",
                    "trigger": {
                      "value": "notThisString"
                    }
                  }
                ],
                "action": "show"
              },
              "value": {
                "text": "Show",
                "code": "show"
              },
              "linkId": "/useSkipLogic/skipLogic/action"
            },
            {
              "questionCode": "logic",
              "question": "Show this item when",
              "dataType": "CNE",
              "answers": "skipLogicLogic",
              "header": false,
              "codingInstructions": "Choose how the conditions should satisfy. Choose 'Any' to satisfy any one condition (boolean OR), 'All' to satisfy all conditions (boolean AND).",
              "displayControl": {
                "answerLayout": {
                  "type": "RADIO_CHECKBOX",
                  "columns": "1"
                }
              },
              "value": {
                "text": "Any condition is true",
                "code": "ANY"
              },
              "linkId": "/useSkipLogic/skipLogic/logic"
            },
            {
              "questionCode": "conditions",
              "question": "Condition",
              "header": true,
              "codingInstructions": "Specify conditions",
              "questionCardinality": {
                "min": "1",
                "max": "*"
              },
              "items": [
                {
                  "questionCode": "source",
                  "question": "Select Source Field",
                  "dataType": "CNE",
                  "answers": [],
                  "header": false,
                  "codingInstructions": "Choose a source field to apply a condition.",
                  "displayControl": {
                    "answerLayout": {
                      "type": "COMBO_BOX"
                    }
                  },
                  "linkId": "/useSkipLogic/skipLogic/conditions/source"
                },
                {
                  "questionCode": "hiddenItemForSourceType",
                  "question": "You shouldn't see this (hiddenItemForSourceType)",
                  "header": false,
                  "dataType": "ST",
                  "displayControl": {"css": [{"name": "display","value": "none"}]},
                  "dataControl": [
                    {
                      "source": {
                        "sourceType": "INTERNAL",
                        "sourceLinkId": "/useSkipLogic/skipLogic/conditions/source"
                      },
                      "construction": "SIMPLE",
                      "dataFormat": "value.dataType",
                      "onAttribute": "value"
                    }
                  ],
                  "linkId": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType"
                },
                {
                  "questionCode": "_conditionOperatorNumeric",
                  "question": "Specify how to compare",
                  "header": false,
                  "dataType": "CNE",
                  "answers": "_conditionOperatorNumeric",
                  "defaultAnswer": {
                    "value": {"code": "value"}
                  },
                  "skipLogic": {
                    "logic": "ANY",
                    "conditions": [
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "value": "REAL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "value": "INT"
                        }
                      }
                    ],
                  },
                  "linkId": "/useSkipLogic/skipLogic/conditions/_conditionOperatorNumeric"
                },
                {
                  "questionCode": "_conditionOperatorBool",
                  "question": "Specify boolean value",
                  "header": false,
                  "dataType": "CNE",
                  "answers": "_conditionOperatorBool",
                  "skipLogic": {
                    "logic": "ALL",
                    "conditions": [
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "value": "BL"
                        }
                      }
                    ],
                  },
                  "linkId": "/useSkipLogic/skipLogic/conditions/_conditionOperatorBool"
                },
                {
                  "questionCode": "_conditionOperatorOther",
                  "question": "Specify how to compare",
                  "header": false,
                  "dataType": "CNE",
                  "answers": "_conditionOperatorOther",
                  "defaultAnswer": {
                    "value": {"code": "value"}
                  },
                  "skipLogic": {
                    "logic": "ALL",
                    "conditions": [
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "exists": true
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "BL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "REAL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "INT"
                        }
                      }
                    ],
                  },
                  "linkId": "/useSkipLogic/skipLogic/conditions/_conditionOperatorOther"
                },
                {
                  "questionCode": "triggerCNECWE",
                  "question": "Select value to satisfy the condition",
                  "header": false,
                  "codingInstructions": "Specify a source field value to satisfy the condition.",
                  "displayControl": {
                    "answerLayout": {
                      "type": "COMBO_BOX"
                    }
                  },
                  "skipLogic": {
                    "logic": "ALL",
                    "conditions": [
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "BL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "ST"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "TX"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "URL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "EMAIL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "RTO"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "PHONE"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "YEAR"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "TM"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "DTM"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "DT"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "REAL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "INT"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "QTY"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/source",
                        "trigger": {
                          "exists": true
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/_conditionOperatorOther",
                        "trigger": {
                          "value": {"code": "value"}
                        }
                      }
                    ],
                    "action": "show"
                  },
                  "dataControl": [
                    {
                      "source": {
                        "sourceType": "INTERNAL",
                        "sourceLinkId": "/useSkipLogic/skipLogic/conditions/source"
                      },
                      "construction": "SIMPLE",
                      "dataFormat": "value.dataType",
                      "onAttribute": "dataType"
                    },
                    {
                      "source": {
                        "sourceType": "INTERNAL",
                        "sourceLinkId": "/useSkipLogic/skipLogic/conditions/source"
                      },
                      "construction": "SIMPLE",
                      "dataFormat": "value.answers",
                      "onAttribute": "answers"
                    }
                  ],
                  "linkId": "/useSkipLogic/skipLogic/conditions/triggerCNECWE"
                },
                {
                  "questionCode": "triggerOther",
                  "question": "Select value to satisfy the condition",
                  "header": false,
                  "codingInstructions": "Specify a source field value to satisfy the condition.",
                  "skipLogic": {
                    "logic": "ALL",
                    "conditions": [
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "BL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "REAL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "INT"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "QTY"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "CNE"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "CWE"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/source",
                        "trigger": {
                          "exists": true
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/_conditionOperatorOther",
                        "trigger": {
                          "exists": true
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/_conditionOperatorOther",
                        "trigger": {
                          "notEqual": {"code": true}
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/_conditionOperatorOther",
                        "trigger": {
                          "notEqual": {"code": false}
                        }
                      }
                    ],
                    "action": "show"
                  },
                  "dataControl": [
                    {
                      "source": {
                        "sourceType": "INTERNAL",
                        "sourceLinkId": "/useSkipLogic/skipLogic/conditions/source"
                      },
                      "construction": "SIMPLE",
                      "dataFormat": "value.dataType",
                      "onAttribute": "dataType"
                    }
                  ],
                  "linkId": "/useSkipLogic/skipLogic/conditions/triggerOther"
                },
                {
                  "questionCode": "triggerNumeric",
                  "question": "Select value to satisfy the condition",
                  "header": false,
                  "codingInstructions": "Specify a source field value to satisfy the condition.",
                  "skipLogic": {
                    "logic": "ALL",
                    "conditions": [
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "CNE"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "CWE"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "BL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "ST"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "TX"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "URL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "EMAIL"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "RTO"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "PHONE"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "YEAR"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "TM"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "DTM"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/hiddenItemForSourceType",
                        "trigger": {
                          "notEqual": "DT"
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/source",
                        "trigger": {
                          "exists": true
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/_conditionOperatorNumeric",
                        "trigger": {
                          "exists": true
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/_conditionOperatorNumeric",
                        "trigger": {
                          "notEqual": {"code": true}
                        }
                      },
                      {
                        "source": "/useSkipLogic/skipLogic/conditions/_conditionOperatorNumeric",
                        "trigger": {
                          "notEqual": {"code": false}
                        }
                      }
                    ],
                    "action": "show"
                  },
                  "dataControl": [
                    {
                      "source": {
                        "sourceType": "INTERNAL",
                        "sourceLinkId": "/useSkipLogic/skipLogic/conditions/source"
                      },
                      "construction": "SIMPLE",
                      "dataFormat": "value.dataType",
                      "onAttribute": "dataType"
                    }
                  ],
                  "linkId": "/useSkipLogic/skipLogic/conditions/triggerNumeric"
                }
              ],
              "linkId": "/useSkipLogic/skipLogic/conditions"
            }
          ],
          "linkId": "/useSkipLogic/skipLogic"
        }
      ],
      "linkId": "/useSkipLogic"
    },
    {
      "questionCode": "useDataControl",
      "question": "Create data from other items? [2]",
      "dataType": "CNE",
      "answers": "boolean",
      "header": false,
      "codingInstructions": "Choose to create data from other items (build dataControl).",
      "value": {
        "text": "No",
        "code": false
      },
      "skipLogic": {
        "conditions": [
          {
            "source": "/_isHeader",
            "trigger": {
              "value": "No"
            }
          }
        ],
        "action": "show"
      },
      "items": [
        {
          "questionCode": "dataControl",
          "question": "Create data using data from other item",
          "header": true,
          "questionCardinality": {
            "min": "1",
            "max": "*"
          },
          "codingInstructions": "Create data using data from other items.",
          "skipLogic": {
            "action": "show",
            "logic": "ALL",
            "conditions": [
              {
                "source": "/useDataControl",
                "trigger": {
                  "value": {
                    "code": true
                  }
                }
              }
            ]
          },
          "items": [
            {
              "questionCode": "construction",
              "question": "Type",
              "header": false,
              "answers": "dataControlConstruction",
              "dataType": "CNE",
              "displayControl": {
                "answerLayout": {
                  "type": "RADIO_CHECKBOX",
                  "columns": "3"
                }
              },
              "value": {
                "text": "Simple",
                "code": "SIMPLE"
              },
              "linkId": "/useDataControl/dataControl/construction"
            },
            {
              "questionCode": "source",
              "question": "Other item",
              "header": false,
              "answers": [],
              "dataType": "CNE",
              "displayControl": {
                "answerLayout": {
                  "type": "COMBO_BOX"
                }
              },
              "linkId": "/useDataControl/dataControl/source"
            },
            {
              "questionCode": "dataFormat",
              "question": "Specify data format using other item",
              "header": false,
              "answers": "dataControlFormat",
              "dataType": "CWE",
              "displayControl": {
                "answerLayout": {
                  "type": "COMBO_BOX"
                }
              },
              "value": {
                "text": "Value",
                "code": "value"
              },
              "linkId": "/useDataControl/dataControl/dataFormat"
            },
            {
              "questionCode": "onAttribute",
              "question": "Assign to",
              "header": false,
              "answers": "itemFields",
              "dataType": "CNE",
              "displayControl": {
                "answerLayout": {
                  "type": "COMBO_BOX"
                }
              },
              "value": {
                "text": "Value",
                "code": "value"
              },
              "linkId": "/useDataControl/dataControl/onAttribute"
            }
          ],
          "linkId": "/useDataControl/dataControl"
        }
      ],
      "linkId": "/useDataControl"
    },
    {
      "questionCode": "displayControl",
      "question": "Customize display? [2]",
      "dataType": "CNE",
      "answers": "boolean",
      "header": false,
      "codingInstructions": "Specify layout of answers for CNE/CWE data type or layout of questions under a section.",
      "value": {
        "text": "No",
        "code": false
      },
      "skipLogic": {
        "action": "show",
        "logic": "ANY",
        "conditions": [
          {
            "source": "/_isHeader",
            "trigger": {
              "value": "Yes"
            }
          },
          {
            "source": "/_dataType",
            "trigger": {
              "value": "__CNE_OR_CWE__"
            }
          }
        ]
      },
      "items": [
        {
          "questionCode": "questionLayout",
          "question": "Specify layout of child items",
          "header": false,
          "dataType": "CNE",
          "answers": "displayControlQuestionLayout",
          "defaultAnswer": {
            "code": "vertical"
          },
          "skipLogic": {
            "action": "show",
            "logic": "ALL",
            "conditions": [
              {
                "source": "/displayControl",
                "trigger": {
                  "value": {
                    "code": true
                  }
                }
              },
              {
                "source": "/_isHeader",
                "trigger": {
                  "value": "Yes"
                }
              }
            ]
          },
          "linkId": "/displayControl/questionLayout"
        },
        {
          "questionCode": "answerLayout",
          "question": "Specify layout of answer list",
          "header": true,
          "skipLogic": {
            "action": "show",
            "logic": "ALL",
            "conditions": [
              {
                "source": "/displayControl",
                "trigger": {
                  "value": {
                    "code": true
                  }
                }
              },
              {
                "source": "/_dataType",
                "trigger": {
                  "value": "__CNE_OR_CWE__"
                }
              },
              {
                "source": "/_externallyDefined",
                "trigger": {
                  "value": false
                }
              }
            ]
          },
          "items": [
            {
              "questionCode": "type",
              "question": "Specify layout type",
              "header": false,
              "answers": "displayControlAnswerLayoutType",
              "dataType": "CNE",
              "displayControl": {
                "answerLayout": {
                  "type": "RADIO_CHECKBOX",
                  "columns": "1"
                }
              },
              "defaultAnswer": {
                "code": "COMBO_BOX"
              },
              "linkId": "/displayControl/answerLayout/type"
            },
            {
              "questionCode": "columns",
              "question": "Specify number of columns",
              "header": false,
              "dataType": "INT",
              "skipLogic": {
                "action": "show",
                "logic": "ALL",
                "conditions": [
                  {
                    "source": "/displayControl/answerLayout/type",
                    "trigger": {
                      "value": {
                        "code": "RADIO_CHECKBOX"
                      }
                    }
                  }
                ]
              },
              "restrictions": [
                {
                  "name": "minInclusive",
                  "value": "0"
                },
                {
                  "name": "maxInclusive",
                  "value": "6"
                }
              ],
              "linkId": "/displayControl/answerLayout/columns"
            }
          ],
          "linkId": "/displayControl/answerLayout"
        },
        {
          "questionCode": "listColHeaders",
          "question": "Column Header for answer list",
          "codingInstructions": "Specify column headers for this auto completion list. Make sure to match number of headers to number of fields in the search results.",
          "header": false,
          "dataType": "ST",
          "questionCardinality": {
            "min": "1",
            "max": "*"
          },
          "skipLogic": {
            "action": "show",
            "logic": "ALL",
            "conditions": [
              {
                "source": "/displayControl",
                "trigger": {
                  "value": {
                    "code": true
                  }
                }
              },
              {
                "source": "/_externallyDefined",
                "trigger": {
                  "value": true
                }
              }
            ]
          },
          "linkId": "/displayControl/listColHeaders"
        }
      ],
      "linkId": "/displayControl"
    },
    {
      "questionCode": "copyrightNotice",
      "question": "Copyright Notice",
      "dataType": "ST",
      "header": false,
      "codingInstructions": "Add any copyright notice text you wish to include for this item.",
      "linkId": "/copyrightNotice"
    },
    {
      "questionCode": "_observationLinkPeriod",
      "question": "Add link to FHIR Observations?",
      "dataType": "CNE",
      "answers": "boolean",
      "value": {
        "text": "No",
        "code": false
      },
      "skipLogic": {
        "conditions": [
          {
            "source": "/__itemTypeRef",
            "trigger": {
              "notEqual": "display"
            }
          }
        ],
        "action": "show"
      },
      "items": [
        {
          "questionCode": "duration",
          "question": "Time window*",
          "required": true,
          "dataType": "INT",
          "linkId": "/_observationLinkPeriod/duration",
          "skipLogic": {
            "conditions": [
              {
                "source": "/_observationLinkPeriod",
                "trigger": {
                  "value": {"code": true}
                }
              },
              {
                "source": "/_questionCode",
                "trigger": {
                  "exists": true
                }
              }
            ],
            "action": "show",
            "logic": "ALL"
          }
        },
        {
          "questionCode": "unit",
          "question": "Unit*",
          "required": true,
          "dataType": "CNE",
          "answers": "observationLinkPeriodUnits",
          "displayControl": {
            "answerLayout": {
              "type": "COMBO_BOX"
            }
          },
          "linkId": "/_observationLinkPeriod/unit",
          "skipLogic": {
            "conditions": [
              {
                "source": "/_observationLinkPeriod",
                "trigger": {
                  "value": {"code": true}
                }
              },
              {
                "source": "/_questionCode",
                "trigger": {
                  "exists": true
                }
              }
            ],
            "action": "show",
            "logic": "ALL"
          }
        },
        {
          "questionCode": "linkIdWarning",
          "question": "Please enter a code for the question in the Basic Properties tab.",
          "dataType": "TITLE",
          "linkId": "/_observationLinkPeriod/linkIdWarning",
          "skipLogic": {
            "conditions": [
              {
                "source": "/_observationLinkPeriod",
                "trigger": {
                  "value": {"code": true}
                }
              },
              {
                "source": "/_questionCode",
                "trigger": {
                  "exists": false
                }
              }
            ],
            "action": "show",
            "logic": "ALL"
          }
        }
      ],
      "linkId": "/_observationLinkPeriod"
    },
    {
      "questionCode": "_fhirVariables",
      "question": "FHIR Variable",
      "header": true,
      "questionCardinality": {
        "min": "1",
        "max": "*"
      },
      "skipLogic": {
        "conditions": [
          {
            "source": "/__itemTypeRef",
            "trigger": {
              "notEqual": "display"
            }
          }
        ],
        "action": "show"
      },
      "items": [
        {
          "questionCode": "name",
          "question": "Name*",
          "dataType": "ST",
          "linkId": "/_fhirVariables/name"
        },
        {
          "questionCode": "expression",
          "question": "FHIR Path expression",
          "dataType": "TX",
          "linkId": "/_fhirVariables/expression"
        },
        {
          "questionCode": "description",
          "question": "Description",
          "dataType": "TX",
          "linkId": "/_fhirVariables/description"
        }
      ],
      "linkId": "/_fhirVariables"
    }
  ],
  "lformsVersion": "24.0.0"
};
