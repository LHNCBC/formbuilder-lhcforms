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

  // TODO - Uncomment after conversion is fixed.
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

  it('should load JSON5 files', async () => {
    TestBed.configureTestingModule({providers: [provideHttpClient()]});
    const httpClient = TestBed.inject(HttpClient);
    const json5Files = ['/assets/ngx-item.schema.json5', '/assets/ngx-fl.schema.json5'];

    const results = await Util.loadJson5Assets(httpClient, json5Files);
    const itemSchema = results[json5Files[0]];
    const flSchema = results[json5Files[1]];
    expect(itemSchema.properties.linkId.type).toBe('string');
    expect(flSchema.properties.resourceType.enum).toEqual(['Questionnaire']);
  });
});
