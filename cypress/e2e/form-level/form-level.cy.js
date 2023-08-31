/// <reference types="cypress" />

import {CypressUtil} from '../../support/cypress-util'
import {ExtensionDefs} from "../../../src/app/lib/extension-defs";

describe('Home page accept Terms of Use notices', () => {
  before(() => {
    cy.clearSession();
  });
  afterEach(() => {
    cy.clearSession();
  });

  it('should make SNOMED CT available after accepting SNOMED notice', () => {
    cy.goToHomePage();
    cy.contains('lfb-loinc-notice button', 'Accept').as('accept').should('not.be.enabled');
    cy.get('#acceptLoinc').as('loinc').click();
    cy.get('@loinc').should('be.checked');
    cy.get('@accept').should('be.enabled');
    cy.get('#useSnomed').click();
    cy.get('@accept').should('not.be.enabled');
    cy.get('#acceptSnomed').as('snomed').click();
    cy.get('@snomed').should('be.checked');
    cy.get('@accept').should('be.enabled');
    cy.get('@loinc').click();
    cy.get('@accept').should('not.be.enabled');
    cy.get('@loinc').click();
    cy.get('@accept').should('be.enabled').click();

    cy.loincAccepted().should('equal', 'true');
    cy.snomedAccepted().should('equal', 'true');

    cy.get('input[type="radio"][value="scratch"]').click();
    cy.get('button').contains('Continue').click();
    cy.get('button').contains('Create questions').click();
    cy.selectDataType('choice');
    cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
    cy.get('[id^="__\\$answerOptionMethods_value-set"]')
      .should('be.visible').and('not.be.checked');
    cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]')
      .should('be.visible').and('not.be.checked');
  });

  it('should not find SNOMED CT functionality after accepting only LOINC terms of use.', () => {
    cy.goToHomePage();
    cy.acceptLoincOnly();
    cy.loincAccepted().should('equal', 'true');
    cy.snomedAccepted().should('equal', 'false');
    cy.get('input[type="radio"][value="scratch"]').click();
    cy.get('button').contains('Continue').click();
    cy.get('button').contains('Create questions').click();
    cy.selectDataType('choice');
    cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
    cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('be.visible').and('not.be.checked');
    cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('not.exist');
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

  it('should display version info', () => {
    cy.get('.version-info').find('a').should('have.attr', 'href',
      'https://github.com/lhncbc/formbuilder-lhcforms/blob/master/CHANGELOG.md').contains(/^\d+\.\d+\.\d+/);
  });

  describe('Home page import options', () => {
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
      cy.get('#loincSearch').type('vital signs with');
      cy.get('ngb-typeahead-window').should('be.visible');
      cy.get('ngb-typeahead-window button').first().click();
      cy.get('#title').should('have.value', 'Vital signs with method details panel');
      cy.get('[id^="booleanRadio_true"]').should('be.checked');
      cy.get('[id^="code.0.code"]').should('have.value', '34566-0');
    });

    it('should import form from FHIR server', () => {
      const titleSearchTerm = 'vital';

      cy.get('input[type="radio"][value="fhirServer"]').should('be.visible').click();
      cy.contains('button', 'Continue').click();
      cy.fhirSearch(titleSearchTerm);

      cy.get('#title').invoke('val').should('match', new RegExp(titleSearchTerm, 'i'));
      cy.get('[id^="booleanRadio_true"]').should('be.checked');
      cy.get('[id^="code.0.code"]').should('have.value', '88121-9');
    });
  });

  describe('Form level fields', () => {
    before(() => {
      cy.loadHomePage();
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.get('button').contains('Continue').click();
    });

    beforeEach(() => {
      cy.resetForm();
      cy.get('[id^="booleanRadio_true"]').as('codeYes');
      cy.get('[id^="booleanRadio_false"]').as('codeNo');
    });

    it('should include code only when use question code is yes (form level)', () => {
      cy.contains('div', 'Code').should('be.visible').includeExcludeCodeField('form');
    });

    it('should create codes at form level', () => {
      CypressUtil.assertCodeField('/code');
    });

    it('should display Questionnaire.url', () => {
      cy.get('#url').as('url').type('http://example.com/1');
      cy.questionnaireJSON().should((json) => {
        expect(json.url).equal('http://example.com/1');
      });
      cy.get('@url').clear().type('a a');
      cy.get('@url').next('small')
        .should('be.visible')
        .contains('Spaces and other whitespace characters are not allowed in this field.');
      cy.get('@url').clear();
      cy.get('@url').siblings('small').should('not.exist');
    });

    it('should retain title edits', () => {
      cy.get('#title').should('have.value', 'New Form').clear();
      cy.get('#title').type('Dummy title');
      cy.contains('button', 'Create questions').click();
      cy.questionnaireJSON().should((json) => {
        expect(json.title).equal('Dummy title');
      });
      cy.contains('button', 'Edit form attributes').click();
      cy.get('#title').should('have.value','Dummy title');
    });

    it('should move to form level fields', () => {
      cy.get('lfb-form-fields > div > div > p').should('have.text', 'Enter basic information about the form.');
    })

    it('should hide/display code field', () => {
      cy.get('@codeYes').check({force: true});
      cy.get('[id^="code.0.code"]').as('code');
      cy.get('@code').should('be.visible');
      cy.get('@codeNo').check({force: true});
      cy.get('@code').should('not.exist');
    });

    it('should display preview widget', () => {
      cy.uploadFile('answer-option-sample.json');
      cy.get('#title').should('have.value', 'Answer options form', {timeout: 10000});

      cy.contains('nav.navbar button', 'Preview').scrollIntoView().click();
      cy.contains('div[role="tab"]', 'View Rendered Form').scrollIntoView().click();
      cy.get('wc-lhc-form').should('be.visible', true);
      cy.get('#1\\/1').as('acInput').should('have.value', 'd2');
      cy.get('@acInput').focus();
      cy.get('#completionOptionsScroller').as('acResults').should('be.visible');
      cy.get('@acResults').find('ul > li').as('acListItems').should('have.length', 2);
      cy.get('@acListItems').first().click();
      cy.get('@acInput').should('have.value', 'd1');
      cy.contains('mat-dialog-actions > button', 'Close').click();
    });

    it('should work with ethnicity ValueSet in preview', () => {
      cy.uploadFile('USSG-family-portrait.json');
      cy.get('#title').should('have.value', 'US Surgeon General family health portrait', {timeout: 10000});
      cy.contains('nav.navbar button', 'Preview').scrollIntoView().click();
      cy.contains('div[role="tab"]', 'View Rendered Form').scrollIntoView().click();
      cy.get('wc-lhc-form').should('exist', true, {timeout: 10000});
      cy.get('#\\/54126-8\\/54133-4\\/1\\/1').as('ethnicity');
      cy.get('@ethnicity').scrollIntoView().type('l');
      cy.get('#completionOptions').should('be.visible', true);
      cy.get('@ethnicity').type('{downarrow}');
      cy.get('@ethnicity').type('{enter}');
      cy.get('span.autocomp_selected').contains('La Raza');
      cy.contains('mat-dialog-actions > button', 'Close').click();
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

    it('should expand/collapse advanced fields panel', () => {
      cy.tsUrl().should('not.be.visible');
      cy.advancedFields().click();
      cy.tsUrl().should('be.visible');
      cy.advancedFields().click();
      cy.tsUrl().should('not.be.visible');
    });

    describe('Form level fields: Advanced', () => {
      beforeEach(() => {
        cy.advancedFields().click();
        cy.tsUrl().should('be.visible');
      });

      it('should create terminology server extension', () => {
        cy.tsUrl().next('small.text-danger').should('not.exist');
        cy.tsUrl().type('ab');
        cy.tsUrl().next('small.text-danger').should('have.text', 'Please enter a valid URL.');
        cy.tsUrl().clear();
        cy.tsUrl().next('small.text-danger').should('not.exist');
        cy.tsUrl().type('http://example.org/fhir');
        CypressUtil.assertValueInQuestionnaire('/extension',
          [{
            valueUrl: 'http://example.org/fhir',
            url: ExtensionDefs.preferredTerminologyServer.url
          }]);
        cy.tsUrl().clear();
        CypressUtil.assertValueInQuestionnaire('/extension', undefined);
        cy.tsUrl().type('http://example.com/r4');
        CypressUtil.assertValueInQuestionnaire('/extension',
          [{
            url: ExtensionDefs.preferredTerminologyServer.url,
            valueUrl: 'http://example.com/r4'
          }]);
      });

      it('should import form with terminology server extension at form level', () => {
        const sampleFile = 'terminology-server-sample.json';
        cy.uploadFile(sampleFile, false); // Avoid warning form loading based on item or form
        cy.get('#title').should('have.value', 'Terminology server sample form');
        cy.tsUrl().should('be.visible');
        cy.tsUrl().should('have.value', 'https://example.org/fhir');
        CypressUtil.assertExtensionsInQuestionnaire(
          '/extension',
          ExtensionDefs.preferredTerminologyServer.url,
          [{
            url: ExtensionDefs.preferredTerminologyServer.url,
            valueUrl: 'https://example.org/fhir'
          }]
        );

        cy.tsUrl().clear();
        CypressUtil.assertExtensionsInQuestionnaire(
          '/extension', ExtensionDefs.preferredTerminologyServer.url,[]);

        cy.tsUrl().type('http://a.b');
        CypressUtil.assertExtensionsInQuestionnaire(
          '/extension',
          ExtensionDefs.preferredTerminologyServer.url,
          [{
            url: ExtensionDefs.preferredTerminologyServer.url,
            valueUrl: 'http://a.b'
          }]
        );
      });

      it('should import with advanced fields', () => {
        cy.readFile('cypress/fixtures/form-level-advanced-fields.json').then((json) => {
          cy.uploadFile('form-level-advanced-fields.json');
          cy.get('#title').should('have.value', 'Advanced fields sample');
          cy.questionnaireJSON().then((previewJson) => {
            ['implicitRules', 'version', 'name', 'date', 'publisher', 'copyright', 'approvalDate', 'lastReviewDate']
              .forEach((f) => {
                expect(previewJson[f]).to.be.deep.equal(json[f]);
              })
          });
        });
      });

      describe('Date and Datetime related fields.', () => {
        const dateRE = /^\d{4}-\d{2}-\d{2}$/;
        const dateTimeRE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} (AM|PM)$/;
        const dateTimeZuluRE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

        it('should test revised date (date time picker)', () => {
          cy.get('#date+button').as('dateBtn').click();
          cy.get('#date').as('dateInput');
          cy.get('ngb-datepicker').should('be.visible');
          cy.get('#ignoreTimeCheckBox').as('includeTime').should('be.checked');
          cy.contains('ngb-datepicker button', 'Today').click();
          cy.get('@dateInput').should('have.prop', 'value').should('match', dateRE);
          cy.contains('ngb-datepicker button', 'Now').as('now').click();
          cy.get('@dateInput').should('have.prop', 'value').should('match', dateTimeRE);
          cy.get('@includeTime').click();
          cy.get('ngb-timepicker fieldset').should('be.disabled');
          cy.get('@dateInput').should('have.prop', 'value').should('match', dateRE);
          cy.get('@now').click();
          cy.get('@dateInput').should('have.prop', 'value').should('match', dateTimeRE);
          cy.questionnaireJSON().then((previewJson) => {
            expect(previewJson.date).to.match(dateTimeZuluRE);
          });
        });

        it('should test approval date (date picker)', () => {
          cy.get('#approvalDate+button').as('approvalDt').click();
          cy.get('ngb-datepicker').should('be.visible');
          cy.contains('ngb-datepicker button', 'Today').click();
          cy.get('#approvalDate').as('approvalDtInput').should('have.prop', 'value').should('match', dateRE);
          cy.get('@approvalDtInput').clear().type('2021-01-01');
          cy.questionnaireJSON().then((previewJson) => {
            expect(previewJson.approvalDate).to.be.equal('2021-01-01');
          });
        });

        it('should not accept invalid dates', () => {
          // Pick a sample datetime and date widgets; date is datetime widget and approvalDate is date widget.
          ['date', 'approvalDate', 'lastReviewDate'].forEach((widgetId) => {
            const widgetSel = '#'+widgetId;
            cy.get(widgetSel).clear().type('2020-01-23').blur();

            cy.questionnaireJSON().then((q) => {
              expect(q[widgetId]).to.be.equal('2020-01-23');
            });
            cy.get(widgetSel).clear().type('abc').blur();
            cy.questionnaireJSON().then((q) => {
              expect(q[widgetId]).to.be.undefined;
            });
            cy.get(widgetSel).clear().type('202').blur();
            cy.questionnaireJSON().then((q) => {
              expect(q[widgetId]).to.be.undefined;
            });
          });

          ['date', 'approvalDate', 'lastReviewDate'].forEach((widgetId) => {
            const widgetSel = '#'+widgetId;
            cy.get(widgetSel).clear().type('2020-01-02 10:');
            cy.get(widgetSel).parent().next('small.text-danger').should('be.visible');
            cy.get(widgetSel).type('{backspace}');
            cy.get(widgetSel).parent().next('small.text-danger').should('be.visible');
            cy.get(widgetSel).type('{backspace}');
            cy.get(widgetSel).parent().next('small.text-danger').should('be.visible');
            cy.get(widgetSel).type('{backspace}');
            cy.get(widgetSel).parent().next('small.text-danger').should('not.exist');
            cy.get(widgetSel).type('ab');
            cy.get(widgetSel).parent().next('small.text-danger').should('be.visible');
            cy.get(widgetSel).blur();
            cy.questionnaireJSON().then((q) => {
              expect(q[widgetId]).to.be.undefined;
            });
          });
          ['date'].forEach((widgetId) => {
            const widgetSel = '#'+widgetId;
            cy.get(widgetSel).clear().type('2020-01-02 100');
            cy.get(widgetSel).parent().next('small.text-danger').should('be.visible');
            cy.get(widgetSel).blur();
            cy.questionnaireJSON().then((q) => {
              expect(q[widgetId]).to.be.undefined;
            });
            cy.get(widgetSel).clear().type('2020-01-02 100');
            cy.get(widgetSel).parent().next('small.text-danger').should('be.visible');
            cy.get(widgetSel).type('{backspace}:10:10.1 am');
            cy.get(widgetSel).parent().next('small.text-danger').should('not.exist');
            cy.questionnaireJSON().then((q) => {
              expect(q[widgetId]).match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            });
          });
        });

      });
    });
  });

  describe('User specified FHIR server dialog', () => {
    before(() => {
      cy.loadHomePage();
      cy.contains('button', 'Continue').click();
      cy.contains('button', 'Import').click();
      cy.contains('button', 'Import from a FHIR server...').click();
    });

    beforeEach(() => {
      cy.contains('div.modal-footer button', 'Add your FHIR server').click();
      cy.get('#urlInput').as('inputUrl');
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
      cy.get('@inputUrl').type('http://localhost'); // Valid format, but not a FHIR server.
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

  describe('Warning dialog when replacing current form', () => {
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

    it('should display warning dialog when replacing form from LOINC', () => {
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

    it('should display warning dialog when replacing form from FHIR server', () => {
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
      cy.get('[id^="booleanRadio_true"]').should('be.checked');
      cy.get('[id^="code.0.code"]').should('have.value', '88121-9');
    });
  });

})
