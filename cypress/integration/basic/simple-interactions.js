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

describe('Home page', () => {
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('/')
  })

  it('display home page title', () => {
    cy.get('.lead').first().should('have.text', 'How do you want to create your form?')
  })

  context('Form level fields', () => {
    before(() => {
      cy.get('button').contains('Continue').click();
    });

    beforeEach(() => {
      cy.get('#Yes_1').find(':radio').as('codeYes');
      cy.get('#No_1').find(':radio').as('codeNo');
    });

    it('should move to form level fields', () => {
      cy.get('p').should('have.text', 'Enter basic information about the form.');
    })

    it('should hide/display code field', () => {
      cy.get('@codeYes').check({force: true});
      cy.get('#code\\.0\\.code').as('code');
      cy.get('@code').should('be.visible');
      cy.get('@codeNo').check({force: true});
      cy.get('@code').should('not.exist');
    });

    context('Item level fields', () => {
      before(() => {
        cy.get('button').contains('Create questions').click();
      });

      beforeEach(() => {
        cy.get('#Yes_1').find(':radio').as('codeYes');
        cy.get('#No_1').find(':radio').as('codeNo');
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

      it('should display units', () => {
        cy.get('#type').select('string');
        cy.get('#units0').should('not.exist');
        cy.get('#type').select('decimal');
        cy.get('#units0').should('be.visible');
        cy.get('#searchResults').should('not.be.visible');
        cy.get('#units0').type('inch');
        cy.contains('#completionOptions tr', '[in_i]').click();
        cy.contains('span.autocomp_selected li', '[in_i]').should('be.visible');
        cy.contains('#completionOptions tr', '[in_br]').click();
        cy.contains('span.autocomp_selected li', '[in_br]').should('be.visible');
      });
    });
  })
})
