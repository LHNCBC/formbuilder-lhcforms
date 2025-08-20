/// <reference types="cypress" />

describe('Home page', () => {

  beforeEach(() => {
    cy.loadHomePage();
  });

  describe('Item level fields', () => {
    beforeEach(() => {
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.get('button').contains('Continue').click();
      cy.contains('button', 'Create questions').click();
      cy.getItemTextField().should('have.value', 'Item 0', {timeout: 10000});
      cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');
    });

    it('should display quantity units', () => {
      cy.get('[id^="units"]').should('not.exist'); // looking for *units*
      cy.selectDataType('quantity');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');

      [['[in_i]', 'inch'], ['[in_br]', 'inch - British']].forEach((result, index) => {
        cy.get('[id^="units"]').eq(index).type('inch');
        cy.contains('#completionOptions tr', result[0]).click();

        cy.get('lfb-units table').within(() => {
          cy.get('tbody tr').eq(index).then($row => {
            cy.wrap($row).within(() => {
              cy.get('td input').as('unitCols');

              cy.get('@unitCols').eq(0).should('have.value', result[1]);
              cy.get('@unitCols').eq(1).should('have.value', result[0]);
              cy.get('@unitCols').eq(2).should('have.value', 'http://unitsofmeasure.org');
            });
          });
        });

        if (index < 1) {
          cy.get('lfb-units').contains('button', 'Add another unit').click();
        }
      });
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('quantity');
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('[in_i]');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('inch');
        expect(qJson.item[0].extension[1].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[1].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[1].valueCoding.code).equal('[in_br]');
        expect(qJson.item[0].extension[1].valueCoding.display).equal('inch - British');
      });
    });



    it('should display quantity units', () => {
      cy.get('[id^="units"]').should('not.exist'); // looking for *units*
      cy.selectDataType('quantity');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');

      [['[in_i]', 'inch'], ['[in_br]', 'inch - British']].forEach((result, index) => {
        cy.get('[id^="units"]').eq(index).type('inch');
        cy.contains('#completionOptions tr', result[0]).click();

        cy.get('lfb-units table').within(() => {
          cy.get('tbody tr').eq(index).then($row => {
            cy.wrap($row).within(() => {
              cy.get('td input').as('unitCols');

              cy.get('@unitCols').eq(0).should('have.value', result[1]);
              cy.get('@unitCols').eq(1).should('have.value', result[0]);
              cy.get('@unitCols').eq(2).should('have.value', 'http://unitsofmeasure.org');
            });
          });
        });

        if (index < 1) {
          cy.get('lfb-units').contains('button', 'Add another unit').click();
        }
      });
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('quantity');
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('[in_i]');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('inch');
        expect(qJson.item[0].extension[1].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[1].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[1].valueCoding.code).equal('[in_br]');
        expect(qJson.item[0].extension[1].valueCoding.display).equal('inch - British');
      });
    });

    it('should display decimal/integer units', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('inch');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', '[in_i]').click();
      cy.get('@units').should('have.value','inch');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('[in_i]');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('inch');
      });
      cy.get('@units').clear();
      // Invoke preview to trigger update.
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].extension).undefined;
      });
    });

    it('should support lookup with wordBoundaryChars (string tokenizer) for decimal/integer units', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('A');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', 'Ampere').click();
      cy.get('@units').should('have.value', 'Ampere');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.0.valueCoding.code"]').as('unitCode').should('have.value', 'A');
      cy.get('[id^="__$units.0.valueCoding.system"]').as('unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('A');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('Ampere');
      });

      cy.get('@units').type('/').type('kg');
      cy.contains('#completionOptions tr', 'kilogram').click();
      cy.get('@units').should('have.value', 'Ampere/kilogram');
      cy.get('@unitCode').should('have.value', 'A/kg');
      cy.get('@unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('A/kg');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('Ampere/kilogram');
      });
      cy.get('@units').type('.').type('st');
      cy.contains('#completionOptions tr', 'stere').click();
      cy.get('@units').should('have.value', '[Ampere/kilogram]*stere');
      cy.get('@unitCode').should('have.value', 'A/kg.st');
      cy.get('@unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('A/kg.st');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('[Ampere/kilogram]*stere');
      });

      // Now try display that have multiple words.
      cy.get('@units').clear().type('a');
      cy.contains('#completionOptions tr', 'a_g').click();
      cy.get('@units').should('have.value', 'mean Gregorian year');
      cy.get('@unitCode').should('have.value', 'a_g');
      cy.get('@unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('a_g');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('mean Gregorian year');
      });
      cy.get('@units').type('/').type('k');
      cy.contains('#completionOptions tr', 'kat/kg').click();
      cy.get('@units').should('have.value', '[mean Gregorian year]/[katal/kilogram]');
      cy.get('@unitCode').should('have.value', 'a_g/(kat/kg)');
      cy.get('@unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('a_g/(kat/kg)');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('[mean Gregorian year]/[katal/kilogram]');
      });

      cy.get('@units').type('/').type('m');
      cy.contains('#completionOptions tr', 'meter').click();
      cy.get('@units').should('have.value', '[mean Gregorian year]/[katal/kilogram]/meter');
      cy.get('@unitCode').should('have.value', '(a_g)/(kat/kg)/m');
      cy.get('@unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('(a_g)/(kat/kg)/m');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('[mean Gregorian year]/[katal/kilogram]/meter');
      });
    });

    it('should support lookup with wordBoundaryChars (string tokenizer) for quantity units', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('quantity');
      cy.getTypeInitialValueValueMethodClick();

      cy.get('[id^="initial.0.valueQuantity.value"]').as('value0').type('10');
      cy.get('[id^="initial.0.valueQuantity.unit"]').as('quantityUnit').type('l');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', 'Liters').click();
      cy.get('@quantityUnit').should('have.value', 'Liters');

      // The quantity unit should also now display the code and system.
      cy.get('[id^="initial.0.valueQuantity.code"]').should('have.value', 'L');
      cy.get('[id^="initial.0.valueQuantity.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial[0].valueQuantity.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].initial[0].valueQuantity.code).equal('L');
        expect(qJson.item[0].initial[0].valueQuantity.unit).equal('Liters');
      });
      cy.get('@quantityUnit').type('/').type('s');
      cy.contains('#completionOptions tr', 'second - time').click();
      cy.get('@quantityUnit').should('have.value', 'Liters per second');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial[0].valueQuantity.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].initial[0].valueQuantity.code).equal('L/s');
        expect(qJson.item[0].initial[0].valueQuantity.unit).equal('Liters per second');
      });

      cy.contains('button', 'Add another unit').as('addUnitButton');

      cy.get('[id^="units"]').should('have.length', 1);
      cy.get('[id^="units"]').first().as('unit1');
      cy.get('@unit1').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@unit1').type('l');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', 'Liters').click();
      cy.get('@unit1').should('have.value', 'Liters');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'L');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.get('@addUnitButton').click();

      cy.get('[id^="units"]').should('have.length', 2);
      cy.get('[id^="units"]').eq(1).as('unit2');
      cy.get('@unit2').should('be.visible');
      cy.get('@unit2').type('oz');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', 'standard unit used in the US and internationally').click();
      cy.get('@unit2').should('have.value', 'ounce');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.1.valueCoding.code"]').should('have.value', '[oz_av]');
      cy.get('[id^="__$units.1.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      // Add m/s/J
      cy.get('@addUnitButton').click();

      cy.get('[id^="units"]').should('have.length', 3);
      cy.get('[id^="units"]').eq(2).as('unit3');
      cy.get('@unit3').should('be.visible');
      cy.get('@unit3').type('m/s/J');
      cy.get('[id^="__$units.2.valueCoding.code"]').click();
      cy.get('@unit3').should('have.value', '[meter/[second - time]]/joule');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.2.valueCoding.code"]').should('have.value', 'm/s/J');
      cy.get('[id^="__$units.2.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      // Add kg.m/s2
      cy.get('@addUnitButton').click();

      cy.get('[id^="units"]').should('have.length', 4);
      cy.get('[id^="units"]').eq(3).as('unit4');
      cy.get('@unit4').should('be.visible');
      cy.get('@unit4').type('kg.m/s2');
      cy.get('[id^="__$units.3.valueCoding.code"]').click();
      cy.get('@unit4').should('have.value', '[kilogram*meter]/[second - time2]');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.3.valueCoding.code"]').should('have.value', 'kg.m/s2');
      cy.get('[id^="__$units.3.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      // Add kg/(m.s2)
      cy.get('@addUnitButton').click();

      cy.get('[id^="units"]').should('have.length', 5);
      cy.get('[id^="units"]').eq(4).as('unit5');
      cy.get('@unit5').should('be.visible');
      cy.get('@unit5').type('kg/(m.s2)');
      cy.get('[id^="__$units.4.valueCoding.code"]').click();
      cy.get('@unit5').should('have.value', 'kilogram/[meter*[second - time2]]');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.4.valueCoding.code"]').should('have.value', 'kg/(m.s2)');
      cy.get('[id^="__$units.4.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      // Add kg.m2/(s3.A)
      cy.get('@addUnitButton').click();

      cy.get('[id^="units"]').should('have.length', 6);
      cy.get('[id^="units"]').eq(5).as('unit6');
      cy.get('@unit6').should('be.visible');
      cy.get('@unit6').type('kg.m2/(s3.A)');
      cy.get('[id^="__$units.5.valueCoding.code"]').click();
      cy.get('@unit6').should('have.value', '[kilogram*[square meter]]/[[second - time3]*Ampere]');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.5.valueCoding.code"]').should('have.value', 'kg.m2/(s3.A)');
      cy.get('[id^="__$units.5.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');


      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('L');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('Liters');

        expect(qJson.item[0].extension[1].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[1].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[1].valueCoding.code).equal('[oz_av]');
        expect(qJson.item[0].extension[1].valueCoding.display).equal('ounce');

        expect(qJson.item[0].extension[2].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[2].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[2].valueCoding.code).equal('m/s/J');
        expect(qJson.item[0].extension[2].valueCoding.display).equal('[meter/[second - time]]/joule');

        expect(qJson.item[0].extension[3].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[3].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[3].valueCoding.code).equal('kg.m/s2');
        expect(qJson.item[0].extension[3].valueCoding.display).equal('[kilogram*meter]/[second - time2]');

        expect(qJson.item[0].extension[4].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[4].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[4].valueCoding.code).equal('kg/(m.s2)');
        expect(qJson.item[0].extension[4].valueCoding.display).equal('kilogram/[meter*[second - time2]]');

        expect(qJson.item[0].extension[5].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[5].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[5].valueCoding.code).equal('kg.m2/(s3.A)');
        expect(qJson.item[0].extension[5].valueCoding.display).equal('[kilogram*[square meter]]/[[second - time3]*Ampere]');
      });
    });

    it('should support lookup code string that contains wordBoundaryChars', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('a_g/kat/kg/m').type('{enter}');

      cy.get('@units').parentsUntil('tr').last().as('inputCell');
      cy.get('@inputCell').next().find('input').should('have.value', 'a_g/kat/kg/m');
      cy.get('@inputCell').next().next().find('input').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('a_g/kat/kg/m');
        // The display is, however, slightly different, as it is coming from UCUM instead of the autocompleter.
        // So instead of 'mean Gregorian year/katal per kilogram/meter', it is returned as
        // [[[mean Gregorian year]/katal]/kilogram]/meter.
        expect(qJson.item[0].extension[0].valueCoding.display).equal('[[[mean Gregorian year]/katal]/kilogram]/meter');
      });

      // Now try display that have multiple words.
      cy.get('@units').clear().type('m/s/J');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', 'joule per liter').click();
      // The result from the UCUM package for 'm/s/joule per liter' may not be correctly represented.
      // It is returning as 'm/s/J/L - [[meter/[second - time]]/joule]/liters'.
      // Therefore, Form Builder will submit the input as 'm/s/(J/L)' in this case to correct the order.
      // The corrected result will be 'm/s/(J/L)' - [meter/[second - time]]/[joule/liters].
      cy.get('@units').should('have.value', '[meter/[second - time]]/[joule/Liters]');
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'm/s/(J/L)');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

    });

    it('should support lookup display string that contains wordBoundaryChars and no spaces between words', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('Ampere/kilogram.stere').type('{enter}');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'A/kg.st');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('A/kg.st');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('[Ampere/kilogram]*stere');
      });
    });

    it('should support lookup display string that contains spaces between words', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('mean Gregorian year').type('{enter}');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'a_g');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('a_g');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('mean Gregorian year');
      });
    });

    it('should not reliably support lookup by typing keywords contain word boundary characters and spaces', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('mean Gregorian year/katal per kilogram').type('{enter}');
      cy.get('[id^="__$units.0.valueCoding.code').should('have.value', 'a_g/(kat/kg)', { timeout: 5000 });
      cy.get('[id^="__$units.0.valueCoding.system').should('have.value', 'http://unitsofmeasure.org');

      // Switching it around, and the result is not found.
      cy.get('@units').clear().type('katal per kilogram/mean Gregorian year').type('{enter}');
      cy.get('[id^="__$units.0.valueCoding.code').should('have.value', '');
      cy.get('[id^="__$units.0.valueCoding.system').should('have.value', '');


    });

    it('should allow users to create their own valueCoding', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('unknown unit').type('{enter}');
      cy.get('[id^="__$units.0.valueCoding.code"]').type('unknown').type('{enter}');
      cy.get('[id^="__$units.0.valueCoding.system"]').type('http://unknown.org').type('{enter}');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unknown.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('unknown');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('unknown unit');
      });
    });

    it('should display units when reading from existing questionnaire', () => {
      const sampleFile = 'units-and-quantity-sample.json';
      cy.uploadFile(sampleFile, true);
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Units and Quantity');
      cy.contains('button', 'Edit questions').click();

      cy.get('[id^="units"]').first().should('have.value', '[[katal/kilogram]/Ampere]*stere');
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'kat/kg/A.st');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.clickTreeNode('Integer data type');
      cy.get('[id^="units"]').first().should('have.value', '[[katal/kilogram]/Ampere]*stere');
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'kat/kg/A.st');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.clickTreeNode('Quantity data type');
      cy.get('[id^="initial.0.valueQuantity.value"]').should('have.value', '1');
      cy.get('[id^="initial.0.valueQuantity.unit"]').should('have.value', 'kilogram');
      cy.get('[id^="initial.0.valueQuantity.code"]').should('have.value', 'kg');
      cy.get('[id^="initial.0.valueQuantity.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.get('[id^="units"]').eq(0).should('have.value', 'kilogram');
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'kg');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');
      cy.get('[id^="units"]').eq(1).should('have.value', 'gram');
      cy.get('[id^="__$units.1.valueCoding.code"]').should('have.value', 'g');
      cy.get('[id^="__$units.1.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');
      cy.get('[id^="units"]').eq(2).should('have.value', 'milligram');
      cy.get('[id^="__$units.2.valueCoding.code"]').should('have.value', 'mg');
      cy.get('[id^="__$units.2.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

    });

    it('should import decimal/integer units', () => {
      const sampleFile = 'decimal-type-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/' + sampleFile).should((json) => {
        fixtureJson = json
      });
      cy.uploadFile(sampleFile, true);
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
      cy.getItemTypeField().should('contain.value', 'decimal');
      cy.get('[id^="initial.0.valueDecimal"]').should('have.value', '1.1')
      cy.get('[id^="units"]').first().as('units').should('have.value', 'inch');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson).to.deep.equal(fixtureJson);
      });

      cy.get('@units').clear();
      // Invoke preview to trigger update.
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0]).to.deep.equal(fixtureJson.item[0].extension[1]);
      });

      cy.get('@units').type('m');
      cy.contains('#completionOptions tr', 'meter').first().click();
      cy.get('@units').should('have.value', 'meter');
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0]).to.deep.equal(fixtureJson.item[0].extension[1]);
        expect(qJson.item[0].extension[1]).to.deep.equal({
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
          valueCoding: {
            system: 'http://unitsofmeasure.org',
            code: 'm',
            display: 'meter'
          }
        });
      });

      cy.clickTreeNode('Item with non-ucum units');
      cy.get('@units').should('have.value', 'X Y');
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[1].extension).to.deep.equal([{
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
          valueCoding: {
            system: 'http://x.y',
            code: 'XY',
            display: 'X Y'
          }
        }, {
          "url": "http://dummy.org",
          "valueInteger": 2
        }]);
      });
    });



















/*

    it('should display decimal/integer units', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('inch');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', '[in_i]').click();
      cy.get('@units').should('have.value','inch');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('[in_i]');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('inch');
      });
      cy.get('@units').clear();
      // Invoke preview to trigger update.
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].extension).undefined;
      });
    });

    it('should support lookup with wordBoundaryChars (string tokenizer) for decimal/integer units', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('A');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', 'Ampere').click();
      cy.get('@units').should('have.value', 'Ampere');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.0.valueCoding.code"]').as('unitCode').should('have.value', 'A');
      cy.get('[id^="__$units.0.valueCoding.system"]').as('unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('A');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('Ampere');
      });

      cy.get('@units').type('/').type('kg');
      cy.contains('#completionOptions tr', 'kilogram').click();
      cy.get('@units').should('have.value', 'Ampere/kilogram');
      cy.get('@unitCode').should('have.value', 'A/kg');
      cy.get('@unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('A/kg');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('Ampere/kilogram');
      });
      cy.get('@units').type('.').type('st');
      cy.contains('#completionOptions tr', 'stere').click();
      cy.get('@units').should('have.value', 'Ampere/kilogram.stere');
      cy.get('@unitCode').should('have.value', 'A/kg.st');
      cy.get('@unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('A/kg.st');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('[Ampere/kilogram]*stere');
      });

      // Now try display that have multiple words.
      cy.get('@units').clear().type('a');
      cy.contains('#completionOptions tr', 'a_g').click();
      cy.get('@units').should('have.value', 'mean Gregorian year');
      cy.get('@unitCode').should('have.value', 'a_g');
      cy.get('@unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('a_g');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('mean Gregorian year');
      });
      cy.get('@units').type('/').type('k');
      cy.contains('#completionOptions tr', 'kat/kg').click();
      cy.get('@units').should('have.value', 'mean Gregorian year/katal per kilogram');
      cy.get('@unitCode').should('have.value', 'a_g/kat/kg');
      cy.get('@unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('a_g/kat/kg');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('[[mean Gregorian year]/katal]/kilogram');
      });

      cy.get('@units').type('/').type('m');
      cy.contains('#completionOptions tr', 'meter').click();
      cy.get('@units').should('have.value', 'mean Gregorian year/katal per kilogram/meter');
      cy.get('@unitCode').should('have.value', 'a_g/kat/kg/m');
      cy.get('@unitSystem').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('a_g/kat/kg/m');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('[[[mean Gregorian year]/katal]/kilogram]/meter');
      });
    });

    it('should support lookup with wordBoundaryChars (string tokenizer) for quantity units', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('quantity');
      cy.getTypeInitialValueValueMethodClick();

      cy.get('[id^="initial.0.valueQuantity.value"]').as('value0').type('10');
      cy.get('[id^="initial.0.valueQuantity.unit"]').as('quantityUnit').type('l');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', 'Liters').click();
      cy.get('@quantityUnit').should('have.value', 'Liters');

      // The quantity unit should also now display the code and system.
      cy.get('[id^="initial.0.valueQuantity.code"]').should('have.value', 'L');
      cy.get('[id^="initial.0.valueQuantity.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial[0].valueQuantity.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].initial[0].valueQuantity.code).equal('L');
        expect(qJson.item[0].initial[0].valueQuantity.unit).equal('Liters');
      });
      cy.get('@quantityUnit').type('/').type('s');
      cy.contains('#completionOptions tr', 'second - time').click();
      cy.get('@quantityUnit').should('have.value', 'Liters per second');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial[0].valueQuantity.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].initial[0].valueQuantity.code).equal('L/s');
        expect(qJson.item[0].initial[0].valueQuantity.unit).equal('Liters per second');
      });

      cy.contains('button', 'Add another unit').as('addUnitButton');

      cy.get('[id^="units"]').should('have.length', 1);
      cy.get('[id^="units"]').first().as('unit1');
      cy.get('@unit1').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@unit1').type('l');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', 'Liters').click();
      cy.get('@unit1').should('have.value', 'Liters');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'L');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('L');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('Liters');
      });

      cy.get('@addUnitButton').click();

      cy.get('[id^="units"]').should('have.length', 2);
      cy.get('[id^="units"]').eq(1).as('unit2');
      cy.get('@unit2').should('be.visible');
      cy.get('@unit2').type('oz');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.contains('#completionOptions tr', 'standard unit used in the US and internationally').click();
      cy.get('@unit2').should('have.value', 'ounce');

      // The unit should also now display the code and system.
      cy.get('[id^="__$units.1.valueCoding.code"]').should('have.value', '[oz_av]');
      cy.get('[id^="__$units.1.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[1].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[1].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[1].valueCoding.code).equal('[oz_av]');
        expect(qJson.item[0].extension[1].valueCoding.display).equal('ounce');
      });
    });

    it('should support lookup code string that contains wordBoundaryChars', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('a_g/kat/kg/m').type('{enter}');

      cy.get('@units').parentsUntil('tr').last().as('inputCell');
      cy.get('@inputCell').next().find('input').should('have.value', 'a_g/kat/kg/m');
      cy.get('@inputCell').next().next().find('input').should('have.value', 'http://unitsofmeasure.org');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('a_g/kat/kg/m');
        // The display is however a little different as it is coming from the UCUM instead of autocompleter
        // So instead of 'mean Gregorian year/katal per kilogram/meter'
        expect(qJson.item[0].extension[0].valueCoding.display).equal('[[[mean Gregorian year]/katal]/kilogram]/meter');
      });
    });
    it('should support lookup display string that contains wordBoundaryChars and no spaces between words', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('Ampere/kilogram.stere').type('{enter}');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('A/kg.st');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('[Ampere/kilogram]*stere');
      });
    });
    it('should support lookup display string that contains spaces between words', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('mean Gregorian year').type('{enter}');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('a_g');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('mean Gregorian year');
      });
    });
    it('should NOT support lookup display string that contains wordBoundaryChars and spaces between words', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('mean Gregorian year/katal per kilogram').type('{enter}');
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', '');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', '');

    });
    it('should allow users to create their own valueCoding', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="units"]').first().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@units').type('unknown unit').type('{enter}');
      cy.get('[id^="__$units.0.valueCoding.code"]').type('unknown').type('{enter}');
      cy.get('[id^="__$units.0.valueCoding.system"]').type('http://unknown.org').type('{enter}');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unknown.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('unknown');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('unknown unit');
      });
    });

    it('should display units when reading from existing questionnaire', () => {
      const sampleFile = 'units-and-quantity-sample.json';
      cy.uploadFile(sampleFile, true);
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Units and Quantity');
      cy.contains('button', 'Edit questions').click();

      cy.get('[id^="units"]').first().should('have.value', '[[katal/kilogram]/Ampere]*stere');
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'kat/kg/A.st');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.clickTreeNode('Integer data type');
      cy.get('[id^="units"]').first().should('have.value', '[[katal/kilogram]/Ampere]*stere');
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'kat/kg/A.st');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.clickTreeNode('Quantity data type');
      cy.get('[id^="initial.0.valueQuantity.value"]').should('have.value', '1');
      cy.get('[id^="initial.0.valueQuantity.unit"]').should('have.value', 'kilogram');
      cy.get('[id^="initial.0.valueQuantity.code"]').should('have.value', 'kg');
      cy.get('[id^="initial.0.valueQuantity.system"]').should('have.value', 'http://unitsofmeasure.org');

      cy.get('[id^="units"]').eq(0).should('have.value', 'kilogram');
      cy.get('[id^="__$units.0.valueCoding.code"]').should('have.value', 'kg');
      cy.get('[id^="__$units.0.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');
      cy.get('[id^="units"]').eq(1).should('have.value', 'gram');
      cy.get('[id^="__$units.1.valueCoding.code"]').should('have.value', 'g');
      cy.get('[id^="__$units.1.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');
      cy.get('[id^="units"]').eq(2).should('have.value', 'milligram');
      cy.get('[id^="__$units.2.valueCoding.code"]').should('have.value', 'mg');
      cy.get('[id^="__$units.2.valueCoding.system"]').should('have.value', 'http://unitsofmeasure.org');

    });

    it('should import decimal/integer units', () => {
      const sampleFile = 'decimal-type-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/' + sampleFile).should((json) => {
        fixtureJson = json
      });
      cy.uploadFile(sampleFile, true);
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
      cy.getItemTypeField().should('contain.value', 'decimal');
      cy.get('[id^="initial.0.valueDecimal"]').should('have.value', '1.1')
      cy.get('[id^="units"]').first().as('units').should('have.value', 'inch');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson).to.deep.equal(fixtureJson);
      });

      cy.get('@units').clear();
      // Invoke preview to trigger update.
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0]).to.deep.equal(fixtureJson.item[0].extension[1]);
      });

      cy.get('@units').type('m');
      cy.contains('#completionOptions tr', 'meter').first().click();
      cy.get('@units').should('have.value', 'meter');
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0]).to.deep.equal(fixtureJson.item[0].extension[1]);
        expect(qJson.item[0].extension[1]).to.deep.equal({
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
          valueCoding: {
            system: 'http://unitsofmeasure.org',
            code: 'm',
            display: 'meter'
          }
        });
      });

      cy.clickTreeNode('Item with non-ucum units');
      cy.get('@units').should('have.value', 'X Y');
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[1].extension).to.deep.equal([{
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
          valueCoding: {
            system: 'http://x.y',
            code: 'XY',
            display: 'X Y'
          }
        }, {
          "url": "http://dummy.org",
          "valueInteger": 2
        }]);
      });
    }); */
  });
});
