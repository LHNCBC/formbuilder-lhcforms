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

/**
 * Command to upload a file.
 * @param fileName - Name of the file to upload
 */
Cypress.Commands.add('uploadFile',(fileName) => {
  cy.get('input[type="file"]').attachFile(fileName, {force: true});
});

/**
 * Command to get json from 'Preview'
 */
Cypress.Commands.add('questionnaireJSON', () => {
  cy.contains('nav.navbar button', 'Preview').scrollIntoView().click();
  cy.contains('.mat-tab-label-content', 'View Questionnaire JSON').scrollIntoView().click();
  return cy.get('mat-tab-body div.mat-tab-body-content pre').invoke('text').then((text) => {
    cy.get('mat-dialog-actions > button').scrollIntoView().click();
    return cy.wrap(JSON.parse(text));
  });
});

Cypress.Commands.add('selectDataType', (type) => {
  cy.get('#type').select(type);
});
