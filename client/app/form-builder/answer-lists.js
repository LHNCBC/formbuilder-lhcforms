/**
 * Answer lists to be used in form builder. The form-builder-data.js has references here
 * to include them in form builder data model.
 *
 * @type {{minCardinality: *[], maxCardinality: *[], boolean: *[], template: *[], questionCodeSystem: *[], calculationMethod: *[], dataType: *[], editable: *[], testUnits: *[], ucumUnits: *[]}}
 *
 *
 */
var answerLists = {

  "displayControlQuestionLayout": [
    {
      "text": "Vertical layout",
      "code": "vertical"
    },
    {
      "text": "Horizontal layout",
      "code": "horizontal"
    },
    {
      "text": "Matrix layout",
      "code": "matrix"
    }
  ],

  "displayControlAnswerLayoutType": [
    {
      "text": "Combo box",
      "code": "COMBO_BOX"
    },
    {
      "text": "Radio/check boxes",
      "code": "RADIO_CHECKBOX"
    }
  ],

  "dataControlConstruction": [
    {
      "text": "Simple",
      "code": "SIMPLE"
    },
    {
      "text": "Object",
      "code": "OBJECT"
    },
    {
      "text": "Array",
      "code": "ARRAY"
    }
  ],

  "itemFields": [
    {
      "text": "Value",
      "code": "value"
    },
    {
      "text": "Answer list",
      "code": "answers"
    },
    {
      "text": "Default answer",
      "code": "defaultAnswer"
    },
    {
      "text": "URL for externally defined answer list",
      "code": "externallyDefined"
    },
    {
      "text": "Units",
      "code": "units"
    }
  ],

  "dataControlFormat": [
    {
      "text": "Value",
      "code": "value"
    },
    {
      "text": "Answer list",
      "code": "answers"
    },
    {
      "text": "Default answer",
      "code": "defaultAnswer"
    },
    {
      "text": "URL for externally defined answer list",
      "code": "externallyDefined"
    },
    {
      "text": "Units",
      "code": "units"
    }
  ],

  "numericalRange": [
    {
      "text": ">",
      "code": "minExclusive"
    },
    {
      "text": ">=",
      "code": "minInclusive"
    },


    {
      "text": "<",
      "code": "maxExclusive"
    },
    {
      "text": "<=",
      "code": "maxInclusive"
    },
    {
      "text": "=",
      "code": "equal"
    }
  ],
  
  "restrictionName": [
    {
      "text": ">",
      "code": "minExclusive"
    },
    {
      "text": ">=",
      "code": "minInclusive"
    },


    {
      "text": "<",
      "code": "maxExclusive"
    },
    {
      "text": "<=",
      "code": "maxInclusive"
    },
    {
      "text": "Length",
      "code": "length"
    },
    {
      "text": "Minimum length",
      "code": "minLength"
    },
    {
      "text": "Maximum length",
      "code": "maxLength"
    },
    {
      "text": "Pattern",
      "code": "pattern"
    }
  ],

  "skipLogicAction": [
    {
      "text": "Show",
      "code": "show"
    },
    {
      "text": "Hide",
      "code": "hide"
    }
  ],
  "skipLogicLogic": [
    {
      "text": "Any condition is true",
      "code": "ANY"
    },
    {
      "text": "All conditions are true",
      "code": "ALL"
    }
  ],
  "minCardinality": [
    {
      "text": "0",
      "code": "0"
    },
    {
      "text": "1",
      "code": "1"
    },
    {
      "text": "2",
      "code": "2"
    },
    {
      "text": "3",
      "code": "3"
    },
    {
      "text": "4",
      "code": "4"
    },
    {
      "text": "5",
      "code": "5"
    },
    {
      "text": "*",
      "code": "*"
    }
  ],
  "maxCardinality": [
    {
      "text": "0",
      "code": "0"
    },
    {
      "text": "1",
      "code": "1"
    },
    {
      "text": "2",
      "code": "2"
    },
    {
      "text": "3",
      "code": "3"
    },
    {
      "text": "4",
      "code": "4"
    },
    {
      "text": "5",
      "code": "5"
    },
    {
      "text": "*",
      "code": "*"
    }
  ],
  "boolean": [
    {
      "text": "Yes",
      "code": true
    },
    {
      "text": "No",
      "code": false
    }
  ],
  "template": [
    {
      "text": "Vertical Panel Table",
      "code": "panelTableV"
    },
    {
      "text": "Horizontal Panel Table",
      "code": "panelTableH"
    }
  ],
  "questionCodeSystem": [
    {
      "text": "LOINC",
      "code": "LOINC"
    },
    {
      "text": "Custom",
      "code": "Custom"
    }
  ],
  "calculationMethod": [
    {
      "text": "None",
      "code": "none"
    },
    {
      "text": "TOTAL SCORE",
      "code": "TOTALSCORE"
    },
    {
      "text": "BMI",
      "code": "BMI"
    }
  ],
  "dataType": [
    {
      "text": "Boolean (Yes/No)",
      "code": "BL"
    },
    {
      "text": "Clock time",
      "code": "TM"
    },
    {
      "text": "Date",
      "code": "DT"
    },
    {
      "text": "Date time",
      "code": "DTM"
    },
    {
      "text": "Decimal",
      "code": "REAL"
    },
    {
      "text": "Email",
      "code": "EMAIL"
    },
    {
      "text": "Integer",
      "code": "INT"
    },
    {
      "text": "List with no exceptions (CNE)",
      "code": "CNE"
    },
    {
      "text": "List with exception (CWE)",
      "code": "CWE"
    },
    {
      "text": "Phone",
      "code": "PHONE"
    },
    {
      "text": "Ratio",
      "code": "RTO"
    },
    {
      "text": "String",
      "code": "ST"
    },
    {
      "text": "URL",
      "code": "URL"
    },
    {
      "text": "Year",
      "code": "YEAR"
    }
  ],
  "editable": [
    {
      "text": "Read only",
      "code": "0"
    },
    {
      "text": "Editable",
      "code": "1"
    },
    {
      "text": "Read only for existing data, otherwise editable",
      "code": "2"
    }
  ],
  "testUnits": [
    {
      "code": "10.L/min",
      "text": "10 liter per minute"
    },
    {
      "code": "10.L/(min.m2)",
      "text": "10 liter per minute per square meter"
    },
    {
      "code": "10.uN.s/(cm5.m2)",
      "text": "10 micronewton second per centimeter to the fifth power per square meter"
    },
    {
      "code": "10*4/uL",
      "text": "10 thousand per microliter"
    }
  ]
};