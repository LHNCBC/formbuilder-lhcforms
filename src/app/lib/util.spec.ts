import {Util} from './util';

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
});
