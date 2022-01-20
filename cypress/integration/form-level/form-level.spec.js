/// <reference types="cypress" />
import * as fhirServerMocks from '../../support/mocks/fhir-server-mocks';

describe('Home page', () => {
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    // loadHomePage() calls visit() with assertions for LForms object on window.
    cy.loadHomePage();
    cy.contains('lfb-loinc-notice button', 'Accept').click();
  });

  it('display home page title', () => {
    cy.get('.lead').first().should('have.text', 'How do you want to create your form?')
  });

  context('Home page import options', () => {
    beforeEach(() => {
      cy.loadHomePage();
      cy.get('input[type="radio"][value="existing"]').click();
    });

    it('should import local file', () => {
      cy.get('input[type="radio"][value="local"]').should('be.visible').click();
      cy.readFile('cypress/fixtures/answer-option-sample.json').then((json) => {
        cy.uploadFile('answer-option-sample.json');
        cy.get('#title').should('have.value', 'Answer options form');
        cy.questionnaireJSON().then((previewJson) => {
          expect(previewJson).to.be.deep.equal(previewJson);
        });
      });
    });

    it('should import LOINC form', () => {
      cy.get('input[type="radio"][value="loinc"]').should('be.visible').click();
      cy.contains('button', 'Continue').click();
      cy.get('#loincSearch').type('vital');
      cy.get('ngb-typeahead-window').should('be.visible');
      cy.get('ngb-typeahead-window button').first().click();
      cy.get('#title').should('have.value', 'Vital signs with method details panel');
      cy.get('#Yes_1').should('have.class', 'active');
      cy.get('[id="code.0.code"]').should('have.value', '34566-0');
    });

    it('should import form from FHIR server', () => {
      const titleSearchTerm = 'vital';

      fhirServerMocks.searchFHIRServer(titleSearchTerm,
        `fhir-server-mock-response-${titleSearchTerm}.json`);
      cy.get('input[type="radio"][value="fhirServer"]').should('be.visible').click();
      cy.contains('button', 'Continue').click();
      cy.get('input[type="radio"][name="fhirServer"]').first().click();
      cy.contains('div.modal-footer button', 'Continue').click();
      cy.get('input[type="text"]').type(titleSearchTerm);
      cy.get('#searchField1').select('Form title only');
      cy.get('#button-addon2').click();
      cy.wait('@searchFHIRServer');
      cy.get('div.list-group').should('be.visible');
      cy.get('a.result-item').first().click();
      cy.get('#title').invoke('val').should('match', new RegExp(titleSearchTerm, 'i'));
      cy.get('#Yes_1').should('have.class', 'active');
      cy.get('[id="code.0.code"]').should('have.value', '88121-9');
    });
  });

  context('Form level fields', () => {
    before(() => {
      cy.loadHomePage();
      cy.get('input[type="radio"][value="scratch"]').click();
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

    it('should work with ethnicity ValueSet in preview', () => {
      cy.uploadFile('USSG-family-portrait.json');
      cy.get('#title').should('have.value', 'US Surgeon General family health portrait', {timeout: 10000});
      cy.contains('nav.navbar button', 'Preview').scrollIntoView().click();
      cy.contains('.mat-tab-label-content', 'View Rendered Form').scrollIntoView().click();
      cy.get('wc-lhc-form').should('exist', true, {timeout: 10000});
      cy.get('#\\/54126-8\\/54133-4\\/1\\/1').as('ethnicity');
      cy.get('@ethnicity').scrollIntoView().type('latin');
      cy.get('#completionOptions').should('be.visible', true);
      cy.get('@ethnicity').type('{downarrow}');
      cy.get('@ethnicity').type('{enter}');
      cy.get('span.autocomp_selected').contains('Latin American');
      cy.contains('.mat-dialog-actions > .mat-focus-indicator', 'Close').click();
      cy.uploadFile('reset-form.json');
    });

    it('should create questionnaire on the fhir server', () => {
      cy.uploadFile('answer-option-sample.json');
      cy.contains('button.dropdown-toggle.btn', 'Export').as('exportMenu');
      cy.get('@exportMenu').click(); // Open menu
      cy.contains('button.dropdown-item', 'Update the questionnaire').as('updateMenuItem');
      cy.get('@updateMenuItem').should('have.class', 'disabled');
      cy.get('@exportMenu').click();  // Close the menu
      cy.FHIRServerResponse('Create a new questionnaire').should((json) => {
        expect(json.id).not.undefined;
        expect(json.meta).not.undefined;
      });

      // Update
      cy.get('#title').clear().type('Modified title');
      cy.get('@exportMenu').click();
      cy.get('@updateMenuItem').should('be.visible');
      cy.get('@updateMenuItem').should('not.have.class', 'disabled');
      cy.get('@exportMenu').click();
      cy.FHIRServerResponse('Update').should((json) => {
        expect(json.title).equal('Modified title');
      });

      // Reset changes
      cy.uploadFile('reset-form.json');
    });
  });
})
