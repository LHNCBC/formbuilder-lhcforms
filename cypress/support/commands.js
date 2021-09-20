// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
import 'cypress-file-upload';
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('uploadFile',(fileName) => {
  // cy.get('[data-cy="file-input"]').attachFile(fileName, {force: true});
  cy.get('input[type="file"]').attachFile(fileName, {force: true});
});

Cypress.Commands.add('questionnaireJSON', () => {
  cy.contains('View Questionnaire JSON').scrollIntoView().click();cy.get('.modal-footer > .btn')
  return cy.get('ngb-modal-window div.modal-body pre').invoke('text').then((text) => {
    cy.get('.modal-footer > .btn').scrollIntoView().click();
    return cy.wrap(JSON.parse(text));
  });
});
