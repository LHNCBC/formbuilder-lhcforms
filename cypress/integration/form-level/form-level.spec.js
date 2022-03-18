/// <reference types="cypress" />
import * as fhirServerMocks from '../../support/mocks/fhir-server-mocks';
describe('Home page accept LOINC notice', () => {
  before(() => {
    cy.clearSession();
  });

  it('should accept LOINC notice', () => {
    cy.goToHomePage();
    cy.acceptLoinc();
    cy.loincAccepted().should('equal', 'true');
  });
});

describe('Home page', () => {
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    // loadHomePage() calls visit() with assertions for LForms object on window.
    // It also deals with loinc notice, if needed.
    cy.loadHomePage();
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

      cy.get('input[type="radio"][value="fhirServer"]').should('be.visible').click();
      cy.contains('button', 'Continue').click();
      cy.fhirSearch(titleSearchTerm);

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
      cy.resetForm();
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
    });
  });

  context('User specified FHIR server dialog', () => {
    before(() => {
      cy.loadHomePage();
      cy.contains('button', 'Continue').click();
      cy.contains('button', 'Import').click();
      cy.contains('button', 'Import from a FHIR server...').click();
    });

    beforeEach(() => {
      cy.contains('div.modal-footer button', 'Add your FHIR server').click();
      cy.get('input[type="url"]').as('inputUrl');
      cy.contains('button', 'Validate').as('validate');
      cy.contains('lfb-user-server-dlg button', 'Add').as('add');
      cy.contains('lfb-user-server-dlg button', 'Cancel').as('cancel');
    });

    it('should detect invalid FHIR url in user specified server dialog', () => {
      // Validate button is disabled for empty input.
      cy.get('@validate').should('have.attr', 'disabled');
      // Add button is enabled only when a validated url is recognized.
      cy.get('@add').should('have.attr', 'disabled');

      // Invalid url format
      cy.get('@inputUrl').type('xxx');
      cy.get('@validate').should('not.have.attr', 'disabled'); // Enabled.
      cy.get('@add').should('have.attr', 'disabled'); //
      cy.get('@validate').click();
      cy.contains('p.text-danger', 'You entered an invalid url: xxx').should('be.visible', true);
      cy.get('@add').should('have.attr', 'disabled');

      cy.get('@inputUrl').clear();
      cy.get('@inputUrl').type('http://localhost'); // Valid format, but a FHIR server.
      cy.get('@validate').click();
      cy.contains('p.text-danger', 'Unable to confirm that that URL is a FHIR server.').should('be.visible', true);
      cy.get('@add').should('have.attr', 'disabled');
      cy.get('@cancel').click();
    });

    it('should validate and select user specified FHIR server', () => {
      cy.get('@inputUrl').clear();
      cy.get('@inputUrl').type('https://dummyhost.com/baseR4'); // Valid FHIR server.
      cy.intercept('https://dummyhost.com/baseR4/metadata?*',
        {fixture: 'fhir-metadata-elements.json'}).as('metaFHIRServer');
      cy.get('@validate').click();
      cy.wait('@metaFHIRServer');
      cy.contains('p.text-success', 'https://dummyhost.com/baseR4 was verified to be a FHIR server.').should('be.visible', true);
      cy.get('@add').click();
      cy.get('input[type="radio"][name="fhirServer"]').first().should('be.checked');
      cy.get('lfb-fhir-servers-dlg table tr')
        .first().get('td')
        .first().should('have.text', 'https://dummyhost-1.com/baseR4');
    });

  });

  context('Warning dialog when replacing current form', () => {
    before(() => {
      cy.loadHomePage();
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.contains('button', 'Continue').click();
    })

    beforeEach(() => {
      cy.resetForm();
      cy.uploadFile('answer-option-sample.json');
    });

    it('should display warning dialog when replacing from local file', () => {
      cy.get('#title').should('have.value', 'Answer options form');

      cy.uploadFile('decimal-type-sample.json');
      cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
      cy.contains('div.modal-footer button', 'Cancel').click();
      cy.get('#title').should('have.value', 'Answer options form');

      cy.uploadFile('decimal-type-sample.json', true);
      cy.get('#title').should('have.value', 'Decimal type form');
    });

    it('should display warning dialog when replacing from FHIR server', () => {
      cy.get('#title').should('have.value', 'Answer options form');

      cy.contains('nav.navbar button.dropdown-toggle', 'Import ').click();
      cy.get('form > input[placeholder="Search LOINC"]').type('Vital signs with method details panel');
      cy.get('ngb-typeahead-window').should('be.visible');
      cy.get('ngb-typeahead-window button').first().click();
      cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
      cy.contains('div.modal-footer button', 'Cancel').click();
      cy.get('#title').should('have.value', 'Answer options form');

      cy.contains('nav.navbar button.dropdown-toggle', 'Import ').click();
      cy.get('form > input[placeholder="Search LOINC"]').type('Vital signs with method details panel');
      cy.get('ngb-typeahead-window').should('be.visible');
      cy.get('ngb-typeahead-window button').first().click();
      cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
      cy.contains('div.modal-footer button', 'Continue').click();

      cy.get('#title').should('have.value', 'Vital signs with method details panel');
    });

    it('should display warning dialog when replacing from FHIR server', () => {
      const titleSearchTerm = 'vital';
      cy.get('#title').should('have.value', 'Answer options form');
      cy.contains('button', 'Import').click();
      cy.contains('button', 'Import from a FHIR server...').click();
      cy.fhirSearch(titleSearchTerm);
      cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
      cy.contains('div.modal-footer button', 'Cancel').click();
      cy.get('#title').should('have.value', 'Answer options form');

      cy.contains('button', 'Import').click();
      cy.contains('button', 'Import from a FHIR server...').click();
      cy.fhirSearch(titleSearchTerm);
      cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
      cy.contains('div.modal-footer button', 'Continue').click();

      cy.get('#title').invoke('val').should('match', new RegExp(titleSearchTerm, 'i'));
      cy.get('#Yes_1').should('have.class', 'active');
      cy.get('[id="code.0.code"]').should('have.value', '88121-9');
    });
  });

})
