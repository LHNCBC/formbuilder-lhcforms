/// <reference types="cypress" />

describe('Home page', () => {
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('/');
    cy.wait(2000);
  })

  it('display home page title', () => {
    cy.get('.lead').first().should('have.text', 'How do you want to create your form?')
    cy.window().then((win) => {
      expect(win.LForms).to.exist;
      expect(win.LForms.FHIR).to.exist;
    });
  })

  context('Form level fields', () => {
    before(() => {
      cy.get('button').contains('Continue').click();
    });

    beforeEach(() => {
      cy.get('#Yes_1').find('[type="radio"]').as('codeYes');
      cy.get('#No_1').find('[type="radio"]').as('codeNo');
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

    it('should display preview widget', () => {
      cy.uploadFile('answer-option-sample.json');
      cy.get('#title').should('have.value', 'Answer options form', {timeout: 10000});

      cy.contains('nav.navbar button', 'Preview').scrollIntoView().click();
      cy.contains('.mat-tab-label-content', 'View Rendered Form').scrollIntoView().click();
      cy.get('wc-lhc-form').should('be.visible', true);
      cy.get('#1\\/1').should('have.value', 'd2 - 2');
      cy.get('#1\\/1').click();
      cy.get('#completionOptionsScroller ul > li').should('have.length', 2);
      cy.get('#completionOptionsScroller ul > li').first().click();
      cy.get('#1\\/1').should('have.value', 'd1 - 1');
      cy.contains('.mat-dialog-actions > .mat-focus-indicator', 'Close').click();
      cy.uploadFile('reset-form.json');
    });
  });
})
