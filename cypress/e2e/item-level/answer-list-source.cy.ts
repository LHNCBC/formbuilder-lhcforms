/// <reference types="cypress" />

import {CypressUtil} from '../../support/cypress-util';

const snomedEclText =
  '< 429019009 |Finding related to biological sex|';
const snomedEclTextDiseaseDisorder =
  '< 64572001 |Disease (disorder)|';
const snomedEclEncodedTextDiseaseDisorder =
  'ecl/http://snomed.info/sct/900000000000207008/version/20231001?fhir_vs=ecl/%3C+64572001+%7CDisease+%28disorder%29%7C';


describe('Home page', () => {
  beforeEach(CypressUtil.mockSnomedEditions);

  beforeEach(() => {
    cy.loadHomePage();
  });

  describe('Item level fields', () => {
    beforeEach(() => {
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.get('button').contains('Continue').click();
      cy.contains('button', 'Create questions').click();
      cy.getItemTextField().should('have.value', 'Item 0', { timeout: 10000 });
      cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');
    });

    it('should add answer-option', () => {
      cy.addAnswerOptions();
    });

    it('should add initial values', () => {
      cy.selectDataType('string');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="initial.0.valueString"]').type('initial string');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('string');
        expect(qJson.item[0].initial[0].valueString).equal('initial string');
      });
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="initial.0.valueDecimal"]').type('100.1');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].initial[0].valueDecimal).equal(100.1);
      });

      cy.selectDataType('integer');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="initial.0.valueInteger"]').as('initialInteger');
      cy.get('@initialInteger').type('100');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('integer');
        expect(qJson.item[0].initial[0].valueDecimal).undefined;
        expect(qJson.item[0].initial[0].valueInteger).equal(100);
      });

      cy.get('@initialInteger').clear().type('1.1');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('integer');
        expect(qJson.item[0].initial[0].valueDecimal).undefined;
        expect(qJson.item[0].initial[0].valueInteger).not.undefined;
        // TODO -
        //  There is a bug in IntegerComponent, which moves the cursor to starting position
        // when '.' is entered, although
        // Refer to issue LF-2485.
        expect(qJson.item[0].initial[0].valueInteger).not.undefined;
      });

      cy.selectDataType('coding');
      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
      cy.get('[id^="initial"]').should('not.exist');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('coding');
        expect(qJson.item[0].answerConstraint).equal('optionsOnly');
        expect(qJson.item[0].initial).to.be.undefined;
      });

    });

    it('should add initial values for the SNOMED answer value set option', () => {
      cy.selectDataType('coding');

      // Select 'Allow repeating question' option to 'Yes'.
      cy.contains('div', 'Allow repeating question').as('repeatOption').should('be.visible');
      cy.get('@repeatOption').find('[for^="booleanRadio_true"]').as('repeatYes'); // Radio label for clicking
      cy.get('@repeatYes').click();

      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();

      // Click the 'Answer list source - SNOMED answer value set' radion option.
      cy.get('[for^="__\\$answerOptionMethods_snomed-value-set"]').click();

      // Click the 'Value method - Pick initial value' radio option.
      cy.getPickInitialValueValueMethodClick();

      // The 'Initial value' field should be visible.
      cy.contains('div', 'Initial value').as('initialValue').should('be.visible');

      // There should be a warning message below the 'Initial value' table.
      cy.get('@initialValue')
        .siblings('div')
        .find('div > span')
        .should('contain.text', 'SNOMED ECL is not set. The lookup feature will not be available. Initial values can still be manually typed in.');

      // An initial value can still be typed in manually.
      cy.get('[id^="initial.0.valueCoding.display"]').type('example');
      cy.get('[id^="initial.0.valueCoding.code"]').type('123');
      cy.get('[id^="initial.0.valueCoding.system"]').type('http://example.org');

      // Enter the 'SNOMED answer value set' URI.
      cy.get('#answerValueSet_ecl').type("< 429019009 |Finding related to biological sex|");
      // < 429019009 |Finding related to biological sex|
      cy.get('#answerValueSet_edition').select('International Edition (900000000000207008)');
      cy.get('#answerValueSet_version').select('20231001');

      // The warning message should no longer show.
      cy.get('@initialValue')
        .siblings('div')
        .find('div > span')
        .should('not.exist');

      // Expand the Advance Fields
      cy.expandAdvancedFields();
      // The terminology server should have the default value.
      cy.tsUrl().scrollIntoView().should('be.visible').should('have.value', 'https://snowstorm.ihtsdotools.org/fhir');

      // Add another initial value.
      cy.contains('button', 'Add another value').as('addInitialValueButton');
      cy.get('@addInitialValueButton').click();

      // Use mock data for the SNOMED ECL expression request.
      cy.intercept('https://snowstorm.ihtsdotools.org/fhir/ValueSet/**', { fixture: 'snomed-ecl-expression-mock.json' }).as('snomedReq');
      cy.get('lfb-auto-complete[id^="initial.1.valueCoding.display"] > span > input').click().type('Intersex');
      cy.wait('@snomedReq');

      // Autocomplete should show options.
      cy.get('span#completionOptions > ul > li').should('have.length.greaterThan', 0);
      // Select 'Heart failure'
      cy.get('lfb-auto-complete[id^="initial.1.valueCoding.display"] > span > input').type('{downarrow}{enter}');
      // Verify that code and system are filled in.
      cy.get('[id^="initial.1.valueCoding.code"]').should('have.value', '32570691000036108');
      cy.get('[id^="initial.1.valueCoding.system"]').should('have.value', 'http://snomed.info/sct');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial[0].valueCoding.display).to.equal('example');
        expect(qJson.item[0].initial[0].valueCoding.code).to.equal('123');
        expect(qJson.item[0].initial[0].valueCoding.system).to.equal('http://example.org');

        expect(qJson.item[0].initial[1].valueCoding.display).to.equal('Intersex');
        expect(qJson.item[0].initial[1].valueCoding.code).to.equal('32570691000036108');
        expect(qJson.item[0].initial[1].valueCoding.system).to.equal('http://snomed.info/sct');
      });
    });

    it('should add initial values for the answer value set URI option', () => {
      cy.selectDataType('coding');

      // Select 'Allow repeating question' option to 'Yes'.
      cy.contains('div', 'Allow repeating question').as('repeatOption').should('be.visible');
      cy.get('@repeatOption').find('[for^="booleanRadio_true"]').as('repeatYes'); // Radio label for clicking
      cy.get('@repeatYes').click();

      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();

      // Click the 'Answer list source - Answer value set URI' radion option.
      cy.get('[for^="__\\$answerOptionMethods_value-set"]').click();

      // Click the 'Value method - Pick initial value' radio option.
      cy.getPickInitialValueValueMethodClick();

      // The 'Initial value' field should be visible.
      cy.contains('div', 'Initial value').as('initialValue').should('be.visible');

      // There should be a warning message below the 'Initial value' table.
      cy.get('@initialValue')
        .siblings('div')
        .find('div > span')
        .should('contain.text', 'The Answer value set URL is not set. The lookup feature will not be available. Initial values can still be manually typed in.');

      // An initial value can still be typed in manually.
      cy.get('[id^="initial.0.valueCoding.display"]').type('example');
      cy.get('[id^="initial.0.valueCoding.code"]').type('123');
      cy.get('[id^="initial.0.valueCoding.system"]').type('http://example.org');

      // Enter the 'Answer value set' URI.
      cy.get('#answerValueSet_non-snomed').type('http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions');

      // The warning message below the 'Initial value' table should change.
      cy.get('@initialValue')
        .siblings('div')
        .find('div > span')
        .should('contain.text', 'Preferred terminology server is not set. The lookup feature will not be available. Initial values can still be manually typed in.');

      // Expand the Advance Fields
      cy.expandAdvancedFields();
      // The terminology server should be blank
      cy.tsUrl().scrollIntoView().should('be.visible').should('have.value', '');
      cy.tsUrl().type('https://clinicaltables.nlm.nih.gov/fhir/R4');

      // The warning message should no longer show.
      cy.get('@initialValue')
        .siblings('div')
        .find('div > span')
        .should('not.exist');

      // Add another initial value.
      cy.contains('button', 'Add another value').as('addInitialValueButton');
      cy.get('@addInitialValueButton').click();
      cy.get('lfb-auto-complete[id^="initial.1.valueCoding.display"] > span > input').click().type('pain');

      // Autocomplete should show options.
      cy.get('span#completionOptions > ul > li').should('have.length.greaterThan', 0);
      // Select 'Back pain'
      cy.get('lfb-auto-complete[id^="initial.1.valueCoding.display"] > span > input').type('{downarrow}{enter}');
      // Verify that code and system are filled in.
      cy.get('[id^="initial.1.valueCoding.code"]').should('have.value', '2315');
      cy.get('[id^="initial.1.valueCoding.system"]').should('have.value', 'http://clinicaltables.nlm.nih.gov/fhir/CodeSystem/conditions');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial[0].valueCoding.display).to.equal('example');
        expect(qJson.item[0].initial[0].valueCoding.code).to.equal('123');
        expect(qJson.item[0].initial[0].valueCoding.system).to.equal('http://example.org');

        expect(qJson.item[0].initial[1].valueCoding.display).to.equal('Back pain');
        expect(qJson.item[0].initial[1].valueCoding.code).to.equal('2315');
        expect(qJson.item[0].initial[1].valueCoding.system).to.equal('http://clinicaltables.nlm.nih.gov/fhir/CodeSystem/conditions');
      });

    });

    it('should import item with answer option', () => {
      const sampleFile = 'answer-option-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.getFormTitleField().should('have.value', 'Answer options form');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(1)').as('firstOption');
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(2)').as('secondOption');

      cy.get('@firstOption').find('td:nth-child(1) input').should('have.value', 'd1');
      cy.get('@firstOption').find('td:nth-child(2) input').should('have.value', 'a');
      cy.get('@firstOption').find('td:nth-child(3) input').should('have.value', 's');
      cy.get('@firstOption').find('td:nth-child(4) input').should('have.value', '1');

      cy.get('@secondOption').find('td:nth-child(1) input').should('have.value', 'd2');
      cy.get('@secondOption').find('td:nth-child(2) input').should('have.value', 'b');
      cy.get('@secondOption').find('td:nth-child(3) input').should('have.value', 's');
      cy.get('@secondOption').find('td:nth-child(4) input').as('secondScore');
      cy.get('@secondScore').should('have.value', '2');
      cy.getPickInitialValueValueMethodClick();
      cy.get('[id^="pick-answer_"]').as('pickAnswer');
      cy.get('@pickAnswer').should('have.value', 'd2');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerOption).to.deep.equal(fixtureJson.item[0].answerOption);
      });
      cy.get('@secondScore').clear();
      cy.get('@secondScore').type('22{enter}');

      cy.get('lfb-answer-option table+button').click();
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(3)').as('thirdOption').should('be.visible');
      cy.get('@thirdOption').find('td:nth-child(1) input').type('d3');
      cy.get('@thirdOption').find('td:nth-child(2) input').type('c');
      cy.get('@thirdOption').find('td:nth-child(3) input').type('s');
      cy.get('@thirdOption').find('td:nth-child(4) input').type('33');
      cy.get('@pickAnswer').click();
      cy.get('#lhc-tools-searchResults ul > li').should('have.length', 3);
      cy.get('@pickAnswer').clear().type('d3{enter}');

      const SCORE_URI = 'http://hl7.org/fhir/StructureDefinition/itemWeight';
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerOption).to.deep.equal([
          {
            valueCoding: {display: 'd1', code: 'a', system: 's'},
            extension: [{url: SCORE_URI, valueDecimal: 1}]
          },
          {
            valueCoding: {display: 'd2', code: 'b', system: 's'},
            extension: [{url: SCORE_URI, valueDecimal: 22}]
          },
          {
            valueCoding: {display: 'd3', code: 'c', system: 's'},
            extension: [{url: SCORE_URI, valueDecimal: 33}],
            initialSelected: true
          },
       ]);
      });
    });

    it('should fix a bug in messing up default selections when switched to another node', () => {
      const sampleFile = 'answer-option-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.getFormTitleField().should('have.value', 'Answer options form');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');

      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(1)').as('firstOption');
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(2)').as('secondOption');

      // First item's default is second option
      cy.getPickInitialValueValueMethodClick();
      cy.get('[id^="pick-answer_"]').as('pickAnswer1');
      cy.get('@pickAnswer1').should('have.value', 'd2');

      // Switch to second item
      cy.clickTreeNode('Item 2 with answer option');
      cy.getPickInitialValueValueMethodClick();
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(3)').as('thirdOption');
      cy.get('[id^="pick-answer_"]').as('pickAnswer2');
      cy.get('@pickAnswer2').should('be.empty');

      // Select the first option in second item.
      cy.get('@pickAnswer2').then(($el: JQuery<HTMLInputElement>) => {
        // Search for invalid code, the expected list size should be 0
        cy.selectAutocompleteOption($el, true, 'invalidCode', 0, '{downarrow}{enter}', null);
        // Search for valid code
        cy.selectAutocompleteOption($el, true, 'd11', 1, '{downarrow}{enter}', 'd11');
      });

      // Switch to first item
      cy.clickTreeNode('Item with answer option');
      // First item's default should be intact.
      cy.getPickInitialValueValueMethodClick();
      cy.get('[id^="pick-answer_"]').as('pickAnswer1');
      cy.get('@pickAnswer1').should('have.value', 'd2');

      // Switch to second item
      cy.clickTreeNode('Item 2 with answer option');
      // Second item's default is first option.
      cy.getPickInitialValueValueMethodClick();
      cy.get('[id^="pick-answer_"]').as('pickAnswer2');
      cy.get('@pickAnswer2').should('have.value', 'd11');
    });

    it('should clear all default selections', () => {
      const repeatsLabel = 'Allow repeating question?';
      const sampleFile = 'answer-option-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.getFormTitleField().should('have.value', 'Answer options form');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');

      // Switch to second item
      cy.clickTreeNode('Item 2 with answer option');

      cy.getPickInitialValueValueMethodClick();
      cy.get('lfb-answer-option table > tbody > tr').should('have.length', 3);

      cy.get('#pick-answer_2').as('pickAnswer2');

      cy.get('@pickAnswer2').then(($el: JQuery<HTMLInputElement>) => {
        cy.selectAutocompleteOption($el, false, null, 3, '{downarrow}{downarrow}{downarrow}{enter}', 'd31');
      });

      cy.get('@pickAnswer2').then(($el: JQuery<HTMLInputElement>) => {
        cy.selectAutocompleteOption($el, true, null, 3, '{enter}', '');
      });

      // Items should be unselected.
      cy.get('#lhc-tools-searchResults ul > li').should('have.length', 3);

      // Set the 'Allow repeating question?' to 'Yes'.
      cy.getRadioButtonLabel(repeatsLabel, 'Yes').click();
      cy.getRadioButton(repeatsLabel, 'Yes').should('be.checked');

      // Items should be unchecked.
      cy.get('#lhc-tools-searchResults ul > li').should('have.length', 3);

      // Select second and third option in second item.
      cy.get('@pickAnswer2').then(($el: JQuery<HTMLInputElement>) => {
        cy.selectAutocompleteOptions($el, true, null, 3, '{downarrow}{downarrow}{enter}', ['×d21']);
        cy.selectAutocompleteOptions($el, true, null, 2, '{downarrow}{downarrow}{enter}', ['×d21', '×d31']);
      });
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[1].answerOption).to.deep.equal(
          [
            {
              "extension": [
                {
                  "url": "http://hl7.org/fhir/StructureDefinition/itemWeight",
                  "valueDecimal": 10
                }
              ],
              "valueCoding": {
                "system": "s1",
                "code": "a1",
                "display": "d11"
              }
            },
            {
              "extension": [
                {
                  "url": "http://hl7.org/fhir/StructureDefinition/itemWeight",
                  "valueDecimal": 20
                }
              ],
              "valueCoding": {
                "system": "s1",
                "code": "b1",
                "display": "d21"
              },
              "initialSelected": true
            },
            {
              "extension": [
                {
                  "url": "http://hl7.org/fhir/StructureDefinition/itemWeight",
                  "valueDecimal": 30
                }
              ],
              "valueCoding": {
                "system": "s1",
                "code": "c1",
                "display": "d31"
              },
              "initialSelected": true
            }
          ]
        );
      });
    });

    it('should fix initial input box when switched data type from coding to decimal', () => {
      const sampleFile = 'initial-component-bugfix.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.getFormTitleField().should('have.value', 'Sample to test initial component error');
      cy.contains('button', 'Edit questions').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].answerOption).to.deep.equal(fixtureJson.item[0].item[0].answerOption);
      });

      cy.toggleTreeNodeExpansion('Group item 1');
      cy.getTreeNode('Coding item 1.1').click();
      cy.getItemTypeField().should('contain.value', 'coding');
      cy.getRadioButton('Create answer list', 'Yes').should('be.checked');
      cy.get('[id^="answerOption."]').should('be.visible');
      cy.get('[id^="initial"]').should('not.exist');
      cy.get('[id^="pick-answer_"]').should('exist').should('be.visible').should('have.value', 'Answer 2');
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="answerOption."]').should('not.exist');
      cy.get('[id^="initial.0.valueDecimal"]').should('be.visible').type('1.2');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].initial[0].valueDecimal).equal(1.2);
      });
    });

    it('should create answerValueSet', () => {
      cy.selectDataType('coding');
      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
      cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('not.be.checked');
      cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('not.be.checked');
      // New default for 'Answer list source' is now 'None'
      cy.get('[id^="__\\$answerOptionMethods_none"]').should('be.checked');

      cy.get('#answerValueSet_non-snomed').should('not.exist');

      // Select the 'Answer Options' option
      cy.getRadioButtonLabel('Answer list source', 'Answer options').click();

      cy.get('lfb-answer-option').should('be.visible');

      cy.get('[for^="__\\$answerOptionMethods_value-set"]').click();
      cy.get('#answerValueSet_non-snomed').should('be.visible');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('#answerValueSet_non-snomed').type('http://example.org');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).equal('http://example.org');
        expect(q.item[0].answerOption).to.be.undefined;
      });

      cy.get('[for^="__\\$answerOptionMethods_none"]').click();
      cy.get('#answerValueSet_non-snomed').should('not.exist');
      //cy.get('lfb-answer-option').should('be.visible');
      const aOptions = [
        {display: 'display 1', code: 'c1', system: 's1'},
        {display: 'display 2', code: 'c2', system: 's2'}
      ];
      cy.enterAnswerOptions(aOptions);
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).to.be.undefined;
        expect(q.item[0].answerOption[0].valueCoding).to.deep.equal(aOptions[0]);
        expect(q.item[0].answerOption[1].valueCoding).to.deep.equal(aOptions[1]);
      });
    });

    it('should import a form with an item having answerValueSet', () => {
      cy.uploadFile('answer-value-set-sample.json', true);
      cy.getFormTitleField().should('have.value', 'Answer value set form');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
      cy.getItemTypeField().should('contain.value', 'coding');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('not.be.checked');
      cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('be.checked');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('#answerValueSet_non-snomed').should('have.value','http://example.org');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerValueSet).to.equal('http://example.org');
      });
    });

    it('should create SNOMED CT answerValueSet', () => {
      const eclSel = '#answerValueSet_ecl';
      cy.selectDataType('coding');
      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
      cy.get('[for^="__\\$answerOptionMethods_value-set"]').as('nonSnomedMethod');
      cy.get('[for^="__\\$answerOptionMethods_answer-option"]').as('answerOptionMethod');
      cy.get('[for^="__\\$answerOptionMethods_snomed-value-set"]').as('snomedMethod').click();

      cy.get(eclSel).should('be.visible');
      cy.get(eclSel).parent().parent().parent().as('controlDiv');

      // Expand the Advance Fields
      cy.expandAdvancedFields();
      // The terminology server should be blank
      cy.tsUrl().should('be.visible').should('have.value', '');

      cy.get('lfb-answer-option').should('not.exist');
      cy.get('@controlDiv').find('span.text-break').should('not.exist');
      cy.get(eclSel).type('123 456');
      cy.get('@controlDiv').click() // Change on eclSel
      cy.get('@controlDiv').find('span.text-break').should('contain.text', 'fhir_vs=ecl/123%20456');

      // The terminology server should now have value
      cy.tsUrl().should('have.value', 'https://snowstorm.ihtsdotools.org/fhir');

      // Preserve ecl edited in non-snomed input box
      cy.get('@nonSnomedMethod').click();
      cy.get('#answerValueSet_ecl').should('not.exist');
      cy.get('#answerValueSet_non-snomed').as('asInput').should('be.visible').should('contain.value', 'fhir_vs=ecl/123%20456');
      cy.get('@asInput').type('_extra_chars');
      cy.get('@snomedMethod').click();
      cy.get(eclSel).should('have.value', '123 456_extra_chars');

      // Preserve ECL after going to answerOption and coming back to snomed value set.
      cy.get('@answerOptionMethod').click();
      cy.get(eclSel).should('not.exist');
      cy.get('@snomedMethod').click();
      cy.get(eclSel).should('have.value', '123 456_extra_chars');

      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).contain('fhir_vs=ecl/123%20456_extra_chars');
        expect(q.item[0].answerOption).to.be.undefined;
        const extUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-preferredTerminologyServer';
        expect(CypressUtil.getExtensions(q.item[0], extUrl)).to.deep.equal([{
          url: extUrl,
          valueUrl: 'https://snowstorm.ihtsdotools.org/fhir'
        }]);
      });

      // The terminology server value will be cleared if it contains the default URL and
      // the ECL field is set to empty.
      // Set the terminology server to a non-default URL.
      cy.tsUrl().scrollIntoView().clear().type('https://clinicaltables.nlm.nih.gov/fhir/R4');

      // Clear the ECL
      cy.get(eclSel).clear();
      cy.get('@controlDiv').click() // Change on eclSel

      // The terminology server should not be removed
      cy.tsUrl().should('have.value', 'https://clinicaltables.nlm.nih.gov/fhir/R4');

      // Change the terminology server value back to the Snomed default URL
      cy.tsUrl().scrollIntoView().clear().type('https://snowstorm.ihtsdotools.org/fhir');

      cy.get(eclSel).type('123');
      cy.get('@controlDiv').click() // Change on eclSel
      cy.get(eclSel).clear();
      cy.get('@controlDiv').click() // Change on eclSel

      // The terminology server should now be blank
      cy.tsUrl().should('be.visible').should('have.value', '');

      cy.get('@controlDiv').find('span.text-break').should('not.exist');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).to.be.undefined;
        expect(q.item[0].answerOption).to.be.undefined;
      });
    });

    it('should import a form with an item having SNOMED CT answerValueSet', () => {
      const encodedUriPart = 'fhir_vs=ecl/' + encodeURIComponent(snomedEclText);

      cy.uploadFile('snomed-answer-value-set-sample.json', true);
      cy.getFormTitleField().should('have.value', 'SNOMED answer value set form');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');

      // First item is with SNOMED CT URI.
      cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('be.checked');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('#answerValueSet_non-snomed').should('not.exist');

      cy.get('#answerValueSet_ecl').as('ecl').should('contain.value',snomedEclText);
      cy.get('#answerValueSet_edition').as('edition')
        .find('option:selected').should('have.text', 'International Edition (900000000000207008)');
      cy.get('#answerValueSet_version').as('version')
        .find('option:selected').should('have.text', '20221231');
      cy.get('@ecl').parent().parent().parent().as('controlDiv');
      cy.get('@controlDiv').find('span').should('contain.text', encodedUriPart);

      // non-snomed answerValueSet
      cy.clickTreeNode('Item with non-snomed');
      cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('be.checked');
      cy.get('#answerValueSet_non-snomed').should('be.visible')
        .should('have.value', 'http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions');
      cy.get('@ecl').should('not.exist');
      cy.get('@edition').should('not.exist');
      cy.get('@version').should('not.exist');
      cy.get('lfb-answer-option').should('not.exist');

      cy.clickTreeNode('Item with answer option');
      // New default for 'Answer list source' is now 'None'
      cy.get('[id^="__\\$answerOptionMethods_none"]').should('be.checked');

      // Select the 'Answer Options' option
      cy.getRadioButtonLabel('Answer list source', 'Answer options').click();

      cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
      cy.get('lfb-answer-option').should('be.visible');
      cy.get('@ecl').should('not.exist');
      cy.get('@edition').should('not.exist');
      cy.get('@version').should('not.exist');
      cy.get('#answerValueSet_non-snomed').should('not.exist');

      cy.clickTreeNode('Item with SNOMED');
      cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('be.checked');
      cy.clickTreeNode('Item with answer option');
      cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');

      cy.get('lfb-answer-option').should('be.visible');
      cy.clickTreeNode('Item with non-snomed');
      cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('be.checked');

      cy.clickTreeNode('Item with SNOMED');
      cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('be.checked');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerValueSet).contain(encodedUriPart);
        expect(qJson.item[1].answerValueSet).contain('http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions');
        expect(qJson.item[2].answerValueSet).to.be.undefined;
      });

      cy.intercept('https://snowstorm.ihtsdotools.org/fhir/ValueSet/**',
        {fixture: 'snomed-ecl-expression-mock.json'}).as('snomedReq');

      // Assertions in preview.
      cy.contains('button', 'Preview').click();

      // SNOMED CT answers
      cy.contains('.mdc-tab.mat-mdc-tab', 'View Rendered Form').click();
      cy.get('#1\\/1').as('inputBox1').click();
      cy.wait('@snomedReq');
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.get('@inputBox1').type('{downarrow}{enter}', {force: true});
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@inputBox1').should('have.value', 'Intersex');

      // Non SNOMED CT answers
      cy.get('#2\\/1').as('inputBox2').click();
      cy.get('#lhc-tools-searchResults').should('be.visible');
      cy.get('@inputBox2').type('{downarrow}{enter}', {force: true});
      cy.get('#lhc-tools-searchResults').should('not.be.visible');
      cy.get('@inputBox2').should('have.value', 'Back pain');

      cy.contains('mat-dialog-actions button', 'Close').click();
    });

    it('should display the pre-defined SNOMED CT answerValueSet initial selection', () => {
      cy.uploadFile('snomed-answer-value-set-sample.json', true);
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'SNOMED answer value set form');
      cy.contains('button', 'Edit questions').click();

      // Select the 4th item.
      cy.clickTreeNode('Item with a single SNOMED answerValuetSet initial selection');
      cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('be.checked');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('#answerValueSet_non-snomed').should('not.exist');

      // The Answer value set section should be populated
      cy.get('#answerValueSet_ecl').as('ecl').should('contain.value', snomedEclTextDiseaseDisorder);
      cy.get('#answerValueSet_edition').as('edition')
        .find('option:selected').should('have.text', 'International Edition (900000000000207008)');
      cy.get('#answerValueSet_version').as('version')
        .find('option:selected').should('have.text', '20231001');
      cy.get('@ecl').parent().parent().parent().as('controlDiv');
      cy.get('@controlDiv').find('span').should('contain.text', snomedEclEncodedTextDiseaseDisorder);

      // Pick initial value should be selected for the Value method section.
      cy.contains('div', 'Value method').as('valueMethod').should('be.visible');
      cy.get('@valueMethod').find('[id^="__$valueMethod_pick-initial"]').as('pickInitialRadio');
      cy.get('@pickInitialRadio').should('be.visible').and('be.checked');

      // The Initial value section
      cy.get('lfb-auto-complete[id^="initial.0.valueCoding.display"] > span > input').should('have.value', 'Adenosine deaminase 2 deficiency');
      cy.get('[id^="initial.0.valueCoding.code"]').should('have.value', '987840791000119102');
      cy.get('[id^="initial.0.valueCoding.system"]').should('have.value', 'http://snomed.info/sct');

      // Select the 5th item.
      cy.clickTreeNode('Item with multiple SNOMED answerValueSet initial selections');
      cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('be.checked');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('#answerValueSet_non-snomed').should('not.exist');

      // The Answer value set section should be populated
      cy.get('#answerValueSet_ecl').as('ecl').should('contain.value', snomedEclTextDiseaseDisorder);
      cy.get('#answerValueSet_edition').as('edition')
        .find('option:selected').should('have.text', 'International Edition (900000000000207008)');
      cy.get('#answerValueSet_version').as('version')
        .find('option:selected').should('have.text', '20231001');
      cy.get('@ecl').parent().parent().parent().as('controlDiv');
      cy.get('@controlDiv').find('span').should('contain.text', snomedEclEncodedTextDiseaseDisorder);

      // Pick initial value should be selected for the Valuet method section.
      cy.get('@valueMethod').find('[id^="__$valueMethod_pick-initial"]').as('pickInitialRadio');
      cy.get('@pickInitialRadio').should('be.visible').and('be.checked');

      // The Initial value section
      cy.get('lfb-auto-complete[id^="initial.0.valueCoding.display"] > span > input').should('have.value', 'Adenosine deaminase 2 deficiency');
      cy.get('[id^="initial.0.valueCoding.code"]').should('have.value', '987840791000119102');
      cy.get('[id^="initial.0.valueCoding.system"]').should('have.value', 'http://snomed.info/sct');
      cy.get('lfb-auto-complete[id^="initial.1.valueCoding.display"] > span > input').should('have.value', 'Chronic gastric erosion');
      cy.get('[id^="initial.1.valueCoding.code"]').should('have.value', '956321981000119108');
      cy.get('[id^="initial.1.valueCoding.system"]').should('have.value', 'http://snomed.info/sct');
    });

    describe('Answer expression', () => {
      beforeEach(() => {
        cy.loadHomePage();
        const sampleFile = 'answer-expression-sample.json';
        cy.uploadFile(sampleFile, false);
        cy.getFormTitleField().should('have.value', 'answer-expression-sample');
        cy.contains('button', 'Edit questions').click();

        // cy.getItemTypeField() does not work in this case.
        cy.get('[id^="type"]').as('type');
        cy.contains('div', 'Value method').as('valueMethod');
      });

      it('should display the appropriate answer expression and initial value', () => {
        // Starts out with "What is the patient's full name?"
        cy.get('@type').contains('string');
        cy.getRadioButton('Create answer list', 'Yes').should('be.checked');
        cy.get('[id^="__\\$answerOptionMethods_answer-expression"]').should('be.checked');
        cy.get('[id^="__\\$answerExpression"]').should('have.value', "%patient.name.where(use = 'official').given.join(' ') + ' ' + %patient.name.where(use = 'official').family");

        cy.get('@valueMethod').find('[id^="__$valueMethod_"]').should('have.length', 4);
        cy.get('@valueMethod').find('[id^="__$valueMethod_type-initial"]').as('typeInitialRadio');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueString"]').should('have.value', 'Ann Anderson');

        cy.clickTreeNode("What is the patient's age?");
        cy.get('@type').contains('integer');
        cy.getRadioButton('Create answer list', 'Yes').should('be.checked');
        cy.get('[id^="__\\$answerOptionMethods_answer-expression"]').should('be.checked');
        cy.get('[id^="__\\$answerExpression"]').should('have.value', "today().toDate().difference(%patient.birthDate.toDate()).years()");

        cy.get('@valueMethod').find('[id^="__$valueMethod_"]').should('have.length', 4);
        cy.get('@valueMethod').find('[id^="__$valueMethod_type-initial"]').as('typeInitialRadio');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueInteger"]').should('have.value', '20');

        cy.clickTreeNode("What is the patient's gender?");
        cy.get('@type').contains('coding');
        cy.getRadioButton('Create answer list', 'Yes').should('be.checked');
        cy.get('[id^="__\\$answerOptionMethods_answer-expression"]').should('be.checked');
        cy.get('[id^="__\\$answerExpression"]').should('have.value', "%patient.gender");

        cy.get('@valueMethod').find('[id^="__$valueMethod_"]').should('have.length', 4);
        cy.get('@valueMethod').find('[id^="__$valueMethod_type-initial"]').as('typeInitialRadio');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueCoding.display"]').should('have.value', 'Male');
        cy.get('[id^="initial.0.valueCoding.code"]').should('have.value', 'male');
        cy.get('[id^="initial.0.valueCoding.system"]').should('have.value', 'http://hl7.org/fhir/administrative-gender');
      });

      it('should create and update Answer expression', () => {
        cy.clickTreeNode("What is the patient's gender?");
        cy.contains('Add new item').scrollIntoView().click();
        cy.get('#text').clear().type('Answer Expression');
        cy.selectDataType('integer');

        cy.get('button#editVariables').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 0);

          // Add a new variable 'a'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 1);
          cy.get('#variable-label-0').clear().type('a');
          cy.get('#variable-type-0').select('Easy Path Expression');
          cy.get('input#simple-expression-0').type("1");

          // Add a new variable 'b'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 2);
          cy.get('#variable-label-1').clear().type('b');
          cy.get('#variable-type-1').select('Easy Path Expression');
          cy.get('input#simple-expression-1').type("2");

          // Save the variables
          cy.get('#export').click();
        });

        cy.get('lfb-variable table > tbody > tr').should('have.length', 2);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(1)').as('firstVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(2)').as('secondVariable');

        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'a');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', '1');

        cy.get('@secondVariable').find('td:nth-child(1)').should('have.text', 'b');
        cy.get('@secondVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@secondVariable').find('td:nth-child(3)').should('have.text', '2');

        cy.getRadioButtonLabel('Create answer list', 'Yes').click();
        cy.getRadioButtonLabel('Answer list source', 'Answer expression').click();
        cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();

        // Click the 'Create/edit expression' for the Answer expression
        cy.get('[id^="edit__\\$answerExpression"]').click();

        cy.get('lhc-expression-editor').shadow().within(() => {
          // Update the Output expression
          cy.get('textarea#final-expression').clear().type('%a | %b');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });
        cy.get('[id^="__\\$answerExpression"]').should('have.value', '%a | %b');

        // Edit the Answer expression
        cy.get('[id^="edit__\\$answerExpression"]').click();

        cy.get('lhc-expression-editor').shadow().within(() => {
          // Update the Output expression
          cy.get('textarea#final-expression').clear().type('%a | %b | 999');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });
        cy.get('[id^="__\\$answerExpression"]').should('have.value', '%a | %b | 999');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[3].extension).to.deep.equal([
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "a",
                "language": "text/fhirpath",
                "expression": "1",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "1"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "b",
                "language": "text/fhirpath",
                "expression": "2",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "2"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-answerExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "%a | %b | 999"
              }
            }
          ]);
        });

        // Click the Preview
        cy.contains('button', 'Preview').click();

        cy.get('lhc-item').eq(3).find('lhc-item-question input').click();
        cy.get('span#completionOptions > ul > li').as('completionOptions').should('have.length', 3);
        cy.get('@completionOptions').eq(0).should('have.text', '1');
        cy.get('@completionOptions').eq(1).should('have.text', '2');
        cy.get('@completionOptions').eq(2).should('have.text', '999');

        // Close the Preview
        cy.contains('mat-dialog-actions button', 'Close').click();

        // Select the 'Compute initial value - Value method'
        cy.getComputeInitialValueValueMethodClick();
        // The expression for the Compute Initial Value should be blank. It should not
        // display the Answer expression.
        cy.get('[id^="__\\$initialExpression"]').should('be.empty');
      });
    });

    describe('Accepting only LOINC terms of use', () => {
      beforeEach(() => {
        cy.loadHomePageWithLoincOnly();
        cy.get('input[type="radio"][value="scratch"]').click();
        cy.get('button').contains('Continue').click();
        cy.get('button').contains('Create questions').click();
        cy.get('.spinner-border').should('not.exist');
      });
      it('should not display SNOMED option in answerValueSet', () => {
        cy.selectDataType('coding');
        cy.getRadioButtonLabel('Create answer list', 'Yes').click();
        cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
        cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('not.be.checked');
        cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('not.be.checked');
        // New default for 'Answer list source' is now 'None'
        cy.get('[id^="__\\$answerOptionMethods_none"]').should('be.checked');

        // Select the 'Answer Options' option
        cy.getRadioButtonLabel('Answer list source', 'Answer options').click();

        // SNOMED radio should not exist
        cy.get('[for^="__\\$answerOptionMethods_snomed-value-set"]').should('not.exist');
        cy.get('#answerValueSet_non-snomed').should('not.exist');
        cy.get('#answerValueSet_ecl').should('not.exist');
        cy.get('#answerValueSet_edition').should('not.exist');
        cy.get('#answerValueSet_version').should('not.exist');
        cy.get('lfb-answer-option').should('be.visible');

        cy.get('[for^="__\\$answerOptionMethods_value-set"]').click();
        cy.get('#answerValueSet_non-snomed').should('be.visible');
        cy.get('lfb-answer-option').should('not.exist');
      });
    });
  });
});
