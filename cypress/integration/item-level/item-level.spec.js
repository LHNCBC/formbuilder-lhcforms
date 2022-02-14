/// <reference types="cypress" />

import {Util} from '../../../src/app/lib/util';

describe('Home page', () => {
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('/');
    cy.contains('lfb-loinc-notice button', 'Accept').click();
    cy.get('input[type="radio"][value="scratch"]').click();
    cy.get('button').contains('Continue').click();
  })

  beforeEach(() => {
    cy.get('#Yes_1').find('[type="radio"]').as('codeYes');
    cy.get('#No_1').find('[type="radio"]').as('codeNo');
  });

  context('Item level fields', () => {
    const helpTextExtension = [{
      url: Util.ITEM_CONTROL_EXT_URL,
      valueCodeableConcept: {
        text: 'Help-Button',
        coding: [{
          code: 'help',
          display: 'Help-Button',
          system: 'http://hl7.org/fhir/questionnaire-item-control'
        }]
      }
    }];

    before(() => {
      cy.get('button').contains('Create questions').click();
    });

    beforeEach(() => {
      cy.uploadFile('reset-form.json');
      cy.contains('button', 'Edit questions').click();
      cy.get('#text').should('have.value', 'Item 0', {timeout: 10000});
      cy.get('#__\\$helpText').as('helpText');
      cy.wait(1000);
    });

    it('should display item editor page', () => {
      cy.get('tree-root tree-viewport tree-node-collection tree-node').first().should('be.visible');
      cy.get('@codeYes').check({force: true});
      cy.get('#code\\.0\\.code').as('code');
      cy.get('@code').should('be.visible');
      cy.get('@codeNo').check({force: true});
      cy.get('@code').should('not.exist');

      cy.contains('Add new item').scrollIntoView().click();
      cy.get('tree-root tree-viewport tree-node-collection tree-node span').last().should('have.text', 'New item 1');
      cy.contains('Delete this item').scrollIntoView().click();
      cy.get('tree-root tree-viewport tree-node-collection tree-node span').last().should('have.text', 'Item 0');

      const helpString = 'Test help text!';
      cy.get('@helpText').click();
      cy.get('@helpText').type(helpString);
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].text).equal(helpString);
        expect(qJson.item[0].item[0].type).equal('display');
        expect(qJson.item[0].item[0].extension).to.deep.equal(helpTextExtension);
      });

    });

    it('should import help text item', () => {
      const helpTextFormFilename = 'help-text-sample.json';
      const helpString = 'testing help text from import';
      cy.uploadFile(helpTextFormFilename);
      cy.contains('button', 'Edit questions').click();
      cy.get('@helpText').should('have.value', helpString);
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].text).equal(helpString);
        expect(qJson.item[0].item[0].type).equal('display');
        expect(qJson.item[0].item[0].extension).to.deep.equal(helpTextExtension);
      });
    });

    it('should add answer-option', () => {
      cy.addAnswerOptions();
    });

    it('should add initial values', () => {
      cy.selectDataType('string');
      cy.get('[id="initial.0.valueString"]').type('initial string');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('string');
        expect(qJson.item[0].initial[0].valueString).equal('initial string');
      });
      cy.selectDataType('decimal');
      cy.get('[id="initial.0.valueDecimal"]').type('100');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].initial[0].valueDecimal).equal(100);
      });

      cy.selectDataType('choice');
      cy.get('[id^="initial"]').should('not.be.visible');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('choice');
        expect(qJson.item[0].initial).to.be.undefined;
      });

    });

    it('should import item with answer option', () => {
      const sampleFile = 'answer-option-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile);
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerOption).to.deep.equal(fixtureJson.item[0].answerOption);
        expect(qJson.item[0].initial).to.deep.equal(fixtureJson.item[0].initial);
      });
    });

    it('should display quantity units', () => {
      cy.get('[id^="units"]').should('not.exist'); // looking for *units*
      cy.selectDataType('quantity');
      cy.get('[id^="units"]').last().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#searchResults').should('not.be.visible');
      cy.get('@units').type('inch');
      ['[in_i]', '[in_br]'].forEach((result) => {
        cy.contains('#completionOptions tr', result).click();
        cy.contains('span.autocomp_selected li', result).should('be.visible');
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
      cy.get('[id^="units"]').last().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#searchResults').should('not.be.visible');
      cy.get('@units').type('inch');
      cy.contains('#completionOptions tr', '[in_i]').click();
      cy.get('@units').last().should('have.value','[in_i]');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('[in_i]');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('inch');
      });
    });

    it('should add/edit css to text and prefix fields', () => {
      ['#text', '#prefix'].forEach((field) => {
        cy.get(field+'dropdownButton').as('cssButton');
        cy.get(field+'css').as('cssInput');
        cy.contains(field+'dropdownForm button', 'Close').as('closeButton')
        cy.get('@cssButton').click();

        cy.get('@cssInput').should('be.visible');
        cy.get('@cssInput').type('font-weight: bold;');
        cy.get('@closeButton').click();
      });

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0]._text.extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/rendering-style');
        expect(qJson.item[0]._text.extension[0].valueString).equal('font-weight: bold;');
        expect(qJson.item[0]._prefix.extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/rendering-style');
        expect(qJson.item[0]._prefix.extension[0].valueString).equal('font-weight: bold;');
      });

      ['#text', '#prefix'].forEach((field) => {
        cy.get(field+'dropdownButton').as('cssButton');
        cy.get(field+'css').as('cssInput');
        cy.contains(field+'dropdownForm button', 'Close').as('closeButton')
        cy.get('@cssButton').click();

        cy.get('@cssInput').should('be.visible');
        cy.get('@cssInput').should('have.value', 'font-weight: bold;');
        cy.get('@cssInput').clear();
        cy.get('@closeButton').click();
      });

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0]._text).to.be.undefined;
        expect(qJson.item[0]._prefix).to.be.undefined;
      });
    });

    it('should add restrictions', () => {
      cy.get('lfb-restrictions #Yes_1').click();

      cy.get('#__\\$restrictions\\.0\\.operator').select('Maximum length');
      cy.get('#__\\$restrictions\\.0\\.value').type('10');
      cy.contains('lfb-restrictions button', 'Add new restriction')
        .as('addRestrictionButton').click();
      cy.get('#__\\$restrictions\\.1\\.operator').select('Minimum length');
      cy.get('#__\\$restrictions\\.1\\.value').type('5');
      cy.get('@addRestrictionButton').click();
      cy.get('#__\\$restrictions\\.2\\.operator').select('Regex pattern');
      cy.get('#__\\$restrictions\\.2\\.value').type('xxx');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].maxLength).equal(10);
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/minLength');
        expect(qJson.item[0].extension[0].valueInteger).equal(5);
        expect(qJson.item[0].extension[1].url).equal('http://hl7.org/fhir/StructureDefinition/regex');
        expect(qJson.item[0].extension[1].valueString).equal('xxx');
      });
    });

    it('should import form with restrictions', () => {
      const sampleFile = 'restrictions-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile);
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0]).to.deep.equal(fixtureJson.item[0]);
      });
    });

    it('should work conditional display with answer coding source', () => {
      cy.addAnswerOptions();
      cy.contains('Add new item').scrollIntoView().click();
      cy.get('#enableWhen\\.0\\.question').type('{downarrow}{enter}');
      cy.get('#enableWhen\\.0\\.operator').select('=');
      cy.get('#enableWhen\\.0\\.answerCoding').select('d1 (c1)');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item.length).equal(2);
        // Verify enableWhen construct.
        expect(qJson.item[1].enableWhen.length).equal(1);
        expect(qJson.item[1].enableWhen[0].question).equal(qJson.item[0].linkId);
        expect(qJson.item[1].enableWhen[0].operator).equal('=');
        expect(qJson.item[1].enableWhen[0].answerCoding.display).equal(qJson.item[0].answerOption[0].valueCoding.display);
        expect(qJson.item[1].enableWhen[0].answerCoding.code).equal(qJson.item[0].answerOption[0].valueCoding.code);
        expect(qJson.item[1].enableWhen[0].answerCoding.system).equal(qJson.item[0].answerOption[0].valueCoding.system);
      });
    })
  });
})
