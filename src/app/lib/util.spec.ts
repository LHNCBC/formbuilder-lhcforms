import {Util} from './util';
import {TestBed} from "@angular/core/testing";
import {HttpClient, provideHttpClient} from "@angular/common/http";

describe('Util', () => {
  it('should traverse to ancestors', () => {
    const e = 'x';
    const d: any = {e};
    const c: any = {d};
    const b: any = {c};
    const a: any = {b};
    b.parent = a;
    c.parent = b;
    d.parent = c;

    let reply = Util.traverseAncestors(d, (n) => {return true});
    expect(reply).toEqual([d, c, b, a]);
    reply = Util.traverseAncestors(d, (n) => {return n !== c});
    expect(reply).toEqual([d, c]);
    reply = Util.traverseAncestors(b, (n) => {return true});
    expect(reply).toEqual([b, a]);
  });

  it('should reject file names', () => {
    expect(Util.validateFile(<File>null)).toBeNull();
    expect(Util.validateFile(<File>{name: null})).toBeNull();
    expect(Util.validateFile(<File>{name: '~a.a'})).toBeNull();
    expect(Util.validateFile(<File>{name: '.a.a'})).toBeNull();
    expect(Util.validateFile(<File>{name: '/a.a'})).toBeNull();
    expect(Util.validateFile(<File>{name: 'a\\a'})).toBeNull();
  });

  it('should accept file names', () => {
    expect(Util.validateFile(<File>{name: 'a.a'})).toBeDefined();
    expect(Util.validateFile(<File>{name: 'aa'})).toBeDefined();
    expect(Util.validateFile(<File>{name: 'a a'})).toBeDefined();
    expect(Util.validateFile(<File>{name: 'A b.c'})).toBeDefined();
  });

  it('should replace anchor tags with replaceWith text', () => {
    const str = `See the <a class="lfb-ngb-tooltip-link" target="_blank" (click)="eclTooltipClose($event)" ` +
                `href="https://confluence.ihtsdotools.org/display/DOCECL">ECL documentation</a> for more information, or ` +
                `try the ECL Builder in the <a class="lfb-ngb-tooltip-link" target="_blank" (click)="eclTooltipClose($event)" ` +
                `href="https://browser.ihtsdotools.org/?perspective=full&languages=en">SNOMED CT Browser</a>. ` +
                `In the browser, under the 'Expression Constraint Queries' tab, click the 'ECL Builder' button.`
    const strNoAnchors = `Questions with the group should be listed sequentially`;

    const replaceWith1 = 'Link:';
    const replaceWith2 = ' link';
    const target1 = `See the Link:ECL documentation for more information, or try the ECL Builder in the Link:SNOMED CT Browser. ` +
                    `In the browser, under the 'Expression Constraint Queries' tab, click the 'ECL Builder' button.`;
    const target2 = `See the ECL documentation link for more information, or try the ECL Builder in the SNOMED CT Browser link. ` +
                    `In the browser, under the 'Expression Constraint Queries' tab, click the 'ECL Builder' button.`;

    expect(Util.removeAnchorTagFromString(str, replaceWith1, 'before')).toBe(target1);
    expect(Util.removeAnchorTagFromString(str, replaceWith2, 'after')).toBe(target2);
    expect(Util.removeAnchorTagFromString(strNoAnchors, replaceWith1, 'before')).toBe(strNoAnchors);

  });

  it('should convert lforms units to FHIR extensions', () => {
    const testCases = [{
      dataType: 'quantity',
      lformsUnits: [{unit: 'kg'}, {unit: '[lb_av]'}],
      fhirExtensions: [{
        url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption',
        valueCoding: {
          code: 'kg',
          system: 'http://unitsofmeasure.org',
          display: 'kilogram'
        }
      }, {
        url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption',
        valueCoding: {
          code: '[lb_av]',
          system: 'http://unitsofmeasure.org',
          display: 'pound'
        }
      }]
    }, {
      dataType: 'decimal',
      lformsUnits: [{unit: 'kg'}, {unit: '[lb_av]'}],
      fhirExtensions: [{
        url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
        valueCoding: {
          code: 'kg',
          system: 'http://unitsofmeasure.org',
          display: 'kilogram'
        }
      }]
    }, {
      dataType: 'integer',
      lformsUnits: [{unit: '[lb_av]'}, {unit: 'kg'}],
      fhirExtensions: [{
        url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
        valueCoding: {
          code: '[lb_av]',
          system: 'http://unitsofmeasure.org',
          display: 'pound'
        }
      }]
    }];

    testCases.forEach((tCase) => {
      expect(Util.convertUnitsToExtensions(tCase.lformsUnits, tCase.dataType)).toEqual(tCase.fhirExtensions);
    });
  });

  it('should convert R5 features to R4', () => {
    const testCases: any [] = [
      {
        convertTo: 'R4',
        questionnaire: {
          resourceType: 'Questionnaire',
          status: 'draft',
          meta: {
            tag: [
              {
                code: 'should-exist'
              }
            ]
          },
          item: [
            {
              linkId: '1',
              type: 'coding',
              answerOption: [
                {valueCoding: {code: 'c1', display: 'd1', system: 's1'}}
              ],
              answerConstraint: 'optionsOrType'
            }
          ]
        },
        assertions: {
          type: 'open-choice',
        }
      }
    ];

    testCases.forEach((tCase) => {
      const convertedQ = Util.convertQuestionnaire(tCase.questionnaire, tCase.convertTo);
      const assertions = Object.keys(tCase.assertions);
      assertions.forEach(assertion => {
        expect(convertedQ.item[0][assertion]).toEqual(tCase.assertions[assertion]);
      });

      expect(convertedQ.meta.tag.length).toEqual(1);
      expect(convertedQ.meta.tag[0].code).toEqual('should-exist');
    });
  });

  it('should check for empty answer options', () => {

    const answerOption = [
      {
        "extension": [
          {
            "url": "http://hl7.org/fhir/StructureDefinition/itemWeight",
            "valueDecimal": 1
          }
        ],
        "valueCoding": {
          "system": "1",
          "code": "1",
          "display": "a1"
        }
      },
      {
        "extension": [
          {
            "url": "http://hl7.org/fhir/StructureDefinition/itemWeight",
            "valueDecimal": 2
          }
        ],
        "valueCoding": {
          "system": "2",
          "code": "2",
          "display": "a2"
        }
      },
      {
        "extension": [
          {
            "url": "http://hl7.org/fhir/StructureDefinition/itemWeight",
            "valueDecimal": 3
          }
        ],
        "valueCoding": {
          "system": "3",
          "code": "3",
          "display": "a3"
        }
      }
    ];
    const emptyAnswerOption = [
      {
        "extension": [],
      }
    ];
    const emptyAnswerOption2 = [
      {
        "extension": [],
        "valueCoding": {}
      },
    ];
    const emptyAnswerOption3 = [
      {
        "extension": [],
        "valueCoding": {}
      },
      {
        "extension": [],
        "valueCoding": {}
      }
    ];
    const emptyAnswerOption4 = [
      {
        "extension": [],
        "valueCoding": {}
      },
      {
        "extension": [
          {
            "url": "http://hl7.org/fhir/StructureDefinition/itemWeight",
            "valueDecimal": 3
          }
        ],
        "valueCoding": {
          "system": "3",
          "code": "3",
          "display": "a3"
        }
      }
    ];
    expect(Util.isEmptyAnswerOptionForType(null, "coding")).toBe(true);
    expect(Util.isEmptyAnswerOptionForType([], "coding")).toBe(true);

    expect(Util.isEmptyAnswerOptionForType(answerOption, "coding")).toBe(false);
    expect(Util.isEmptyAnswerOptionForType(emptyAnswerOption, "coding")).toBe(true);
    expect(Util.isEmptyAnswerOptionForType(emptyAnswerOption2, "coding")).toBe(true);
    expect(Util.isEmptyAnswerOptionForType(emptyAnswerOption3, "coding")).toBe(true);
    expect(Util.isEmptyAnswerOptionForType(emptyAnswerOption4, "coding")).toBe(false);
  });

  it('should extract FHIR type from field name', () => {
    const testCases = [
      {prefix: 'value', primitive: true, fieldName: 'valueString', expectedType: 'string'},
      {prefix: 'answer', primitive: true, fieldName: 'answerDate', expectedType: 'date'},
      {prefix: 'answer', primitive: false, fieldName: 'answerCoding', expectedType: 'Coding'},
      {prefix: 'value', primitive: false, fieldName: 'valueAddress', expectedType: 'Address'},
      {prefix: '', primitive: false, fieldName: 'SomeType', expectedType: 'SomeType'},
      {prefix: '', primitive: true, fieldName: 'SomeType', expectedType: 'someType'},
      {prefix: '', primitive: true, fieldName: '', expectedType: ''},
      {prefix: 'xxx', primitive: true, fieldName: 'Xyz', expectedType: null},
      {prefix: 'xxx', primitive: false, fieldName: 'abc', expectedType: null},
      {prefix: '', primitive: true, fieldName: null, expectedType: null},
    ];

    testCases.forEach((testCase) => {
      expect(Util.extractFhirType(testCase.prefix, testCase.fieldName, testCase.primitive)).toBe(testCase.expectedType);
    });
  });

  it('should load JSON5 files', async () => {
    TestBed.configureTestingModule({providers: [provideHttpClient()]});
    const httpClient = TestBed.inject(HttpClient);
    const json5Files = ['assets/ngx-item.schema.json5', 'assets/ngx-fl.schema.json5'];

    const results = await Util.loadJson5Assets(httpClient, json5Files);
    const itemSchema = results[json5Files[0]];
    const flSchema = results[json5Files[1]];
    expect(itemSchema.properties.linkId.type).toBe('string');
    expect(flSchema.properties.resourceType.enum).toEqual(['Questionnaire']);
  });

  describe('FHIR Field Ordering', () => {
    it('should order root Questionnaire fields according to FHIR canonical order', () => {
      const unorderedQ = {
        item: [],
        title: 'Test Form',
        id: 'test-123',
        resourceType: 'Questionnaire',
        status: 'draft',
        version: '1.0.0',
        url: 'http://example.com/questionnaire',
        name: 'TestQuestionnaire',
        description: 'A test questionnaire'
      };

      const ordered = Util.orderQuestionnaireFields(unorderedQ);

      const keys = Object.keys(ordered);
      const expectedOrder = ['resourceType', 'id', 'url', 'version', 'name', 'title', 'status', 'description', 'item'];

      expectedOrder.forEach((key, index) => {
        expect(keys[index]).toBe(key);
      });
    });

    it('should order nested QuestionnaireItem fields according to canonical order', () => {
      const item = {
        item: [],
        initial: [],
        text: 'Question 1',
        linkId: 'q1',
        type: 'string',
        id: 'item-1',
        required: false,
        readOnly: false
      };

      const ordered = Util.orderQuestionnaireFields(item, 'QuestionnaireItem');

      const keys = Object.keys(ordered);
      const expectedOrder = ['id', 'linkId', 'text', 'type', 'required', 'readOnly', 'initial', 'item'];
      expectedOrder.forEach((key, index) => {
        expect(keys[index]).toBe(key);
      });
    });

    it('should order EnableWhen fields according to canonical order', () => {
      const enableWhen = {
        question: 'q1',
        operator: '=',
        answerString: 'yes',
        id: 'ew-1',
        extension: []
      };

      const ordered = Util.orderQuestionnaireFields(enableWhen, 'EnableWhen');

      const keys = Object.keys(ordered);
      const expectedOrder = ['id', 'extension', 'question', 'operator', 'answerString'];
      expectedOrder.forEach((key, index) => {
        expect(keys[index]).toBe(key);
      });
    });

    it('should order AnswerOption fields according to canonical order', () => {
      const answerOption = {
        valueCoding: { code: 'A', system: 'http://example.com', display: 'Option A' },
        initialSelected: true,
        id: 'ao-1',
        extension: []
      };

      const ordered = Util.orderQuestionnaireFields(answerOption, 'AnswerOption');

      const keys = Object.keys(ordered);
      const expectedOrder = ['id', 'extension', 'valueCoding', 'initialSelected'];
      expectedOrder.forEach((key, index) => {
        expect(keys[index]).toBe(key);
      });
    });

    it('should order Initial fields according to canonical order', () => {
      const initial = {
        valueString: 'default value',
        id: 'init-1',
        extension: []
      };

      const ordered = Util.orderQuestionnaireFields(initial, 'Initial');

      const keys = Object.keys(ordered);
      const expectedOrder = ['id', 'extension', 'valueString'];
      expectedOrder.forEach((key, index) => {
        expect(keys[index]).toBe(key);
      });
    });

    it('should append unknown fields at the end after known fields in alphabetical order', () => {
      const item = {
        'unknownField2': 'unknown',
        'customExtension': { url: 'http://custom.com', valueString: 'custom' },
        'linkId': 'q1',
        'unknownField1': 'unknown',
        'type': 'string',
        'text': 'Question 1'
      };

      const ordered = Util.orderQuestionnaireFields(item, 'QuestionnaireItem');

      const keys = Object.keys(ordered);
      const expectedOrder = ['linkId', 'text', 'type', 'customExtension', 'unknownField1', 'unknownField2'];
      expectedOrder.forEach((key, index) => {
        expect(keys[index]).toBe(key);
      });
    });

    it('should recursively order nested items in a Questionnaire', () => {
      const q = {
        resourceType: 'Questionnaire',
        title: 'Test',
        status: 'draft',
        item: [
          {
            type: 'group',
            text: 'Group 1',
            linkId: 'g1',
            item: [
              {
                type: 'string',
                text: 'Item 1.1',
                linkId: 'i1.1'
              }
            ]
          }
        ]
      };

      const ordered = Util.orderQuestionnaireFields(q);

      // Check root level ordering
      const rootKeys = Object.keys(ordered);
      ['resourceType', 'title', 'status', 'item'].forEach((key, index) => {
        expect(rootKeys[index]).toBe(key);
      });

      // Check nested item ordering
      const nestedKeys = Object.keys(ordered.item[0]);
      ['linkId', 'text', 'type', 'item'].forEach((key, index) => {
        expect(nestedKeys[index]).toBe(key);
      });

      // Check deeply nested item
      const deepKeys = Object.keys(ordered.item[0].item[0]);
      ['linkId', 'text', 'type'].forEach((key, index) => {
        expect(deepKeys[index]).toBe(key);
      });
    });

    it('should recursively order enableWhen in nested items', () => {
      const q = {
        resourceType: 'Questionnaire',
        title: 'Test',
        status: 'draft',
        item: [
          {
            linkId: 'q1',
            type: 'choice',
            text: 'Question 1',
            enableWhen: [
              {
                operator: '=',
                question: 'q0',
                answerString: 'yes',
                id: 'ew-1'
              }
            ]
          }
        ]
      };

      const ordered = Util.orderQuestionnaireFields(q);
      const ewKeys = Object.keys(ordered.item[0].enableWhen[0]);
      ['id', 'question', 'operator', 'answerString'].forEach((key, index) => {
        expect(ewKeys[index]).toBe(key);
      });
    });

    it('should recursively order answerOption in items', () => {
      const q = {
        resourceType: 'Questionnaire',
        title: 'Test',
        status: 'draft',
        item: [
          {
            linkId: 'q1',
            type: 'choice',
            text: 'Question 1',
            answerOption: [
              {
                initialSelected: true,
                valueCoding: { code: 'A', system: 'http://example.com' },
                id: 'ao-1'
              }
            ]
          }
        ]
      };

      const ordered = Util.orderQuestionnaireFields(q);
      const aoKeys = Object.keys(ordered.item[0].answerOption[0]);
      ['id', 'valueCoding', 'initialSelected'].forEach((key, index) => {
        expect(aoKeys[index]).toBe(key);
      });
    });

    it('should recursively order initial in items', () => {
      const q = {
        resourceType: 'Questionnaire',
        title: 'Test',
        status: 'draft',
        item: [
          {
            linkId: 'q1',
            type: 'string',
            text: 'Question 1',
            initial: [
              {
                valueString: 'default',
                id: 'init-1'
              }
            ]
          }
        ]
      };

      const ordered = Util.orderQuestionnaireFields(q);
      const initKeys = Object.keys(ordered.item[0].initial[0]);
      ['id', 'valueString'].forEach((key, index) => {
        expect(initKeys[index]).toBe(key);
      });
    });

    it('should handle empty objects gracefully', () => {
      const empty = {};
      const ordered = Util.orderQuestionnaireFields(empty);
      expect(ordered).toEqual({});
    });

    it('should handle null and non-object inputs gracefully', () => {
      expect(Util.orderQuestionnaireFields(null)).toBeNull();
      expect(Util.orderQuestionnaireFields(undefined)).toBeUndefined();
      expect(Util.orderQuestionnaireFields('string')).toBe('string');
      expect(Util.orderQuestionnaireFields(123)).toBe(123);
    });

    it('should handle unknown element types gracefully', () => {
      const obj = { field1: 'value1', field2: 'value2' };
      const ordered = Util.orderQuestionnaireFields(obj, 'UnknownType');
      expect(ordered).toEqual(obj);
    });
  });
});


