/// <reference types="cypress" />

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress

import {Util} from '../../../src/app/lib/util';

describe('Home page', () => {
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('/')
    cy.get('button').contains('Continue').click();
  })

  beforeEach(() => {
    cy.get('#Yes_1').find(':radio').as('codeYes');
    cy.get('#No_1').find(':radio').as('codeNo');
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
      cy.get('#__\\$helpText').as('helpText');
    });
    it('should display item editor page', () => {
      cy.get('tree-root tree-viewport tree-node-collection tree-node').first().should('be.visible');
      cy.get('@codeYes').check({force: true});
      cy.get('#code\\.0\\.code').as('code');
      cy.get('@code').should('be.visible');
      cy.get('@codeNo').check({force: true});
      cy.get('@code').should('not.exist');
    });

    it('should add a new item', () => {
      cy.contains('Add new item').scrollIntoView().click();
      cy.get('tree-root tree-viewport tree-node-collection tree-node span').last().should('have.text', 'New item 1');
      cy.contains('Delete this item').scrollIntoView().click();
      cy.get('tree-root tree-viewport tree-node-collection tree-node span').last().should('have.text', 'Item 0');
    });

    it('should add help text', () => {
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
      cy.get('@helpText').should('have.value', helpString);
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].text).equal(helpString);
        expect(qJson.item[0].item[0].type).equal('display');
        expect(qJson.item[0].item[0].extension).to.deep.equal(helpTextExtension);
      });
    });

    it('should display quantity units', () => {
      cy.get('#type').select('string');
      cy.get('[id^="units"]').should('not.exist');
      cy.get('#type').select('quantity');
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
      cy.get('#type').select('string');
      cy.get('[id^="units"]').should('not.exist');
      cy.get('#type').select('decimal');
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
  });
})
