/// <reference types="cypress" />

import {CypressUtil} from '../../support/cypress-util'
import {ExtensionDefs} from "../../../src/app/lib/extension-defs";

describe('Home page accept Terms of Use notices', () => {
  beforeEach(CypressUtil.mockSnomedEditions);

  afterEach(() => {
    cy.clearSession();
  });

  describe('Loading LForms', () => {
    it('should display error message on lforms loading error', () => {
      // Simulate error condition.
      cy.intercept({method: 'GET', url: /^https:\/\/lhcforms-static.nlm.nih.gov\/lforms-versions\//},
        (req) => {
          console.log(`Intercepted in 'loadingError' request url: ${req.url}`);
          req.reply(404, 'File not found!');
        }).as('loadingError');

      cy.visit('/'); // Avoid goToHomePage(), which intercepts lforms loading calls of its own.
      cy.wait("@loadingError");
      cy.acceptAllTermsOfUse();
      cy.get('.card').as('errorCard').contains('.card-header', 'Error', {timeout: 10000});
      cy.get('@errorCard').find('.card-body').should('include.text', 'Encountered an error which causes');
    });

    it('should not display error after loading LForms', () => {
      cy.goToHomePage();
      cy.acceptAllTermsOfUse();
      cy.window().should('have.property', 'LForms');
      cy.window().its('LForms.lformsVersion').should('match', /^[0-9]+\.[0-9]+\.[0-9]+$/);
      cy.get('.card.bg-danger-subtle').should('not.exist');
    });
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

    cy.getLocalStorageItem('acceptedTermsOfUse')
      .should((x) => {
        const acceptedTermsOfUse = JSON.parse(x);
        expect(acceptedTermsOfUse.acceptedLoinc).to.be.true;
        expect(acceptedTermsOfUse.acceptedSnomed).to.be.true;
      });

    cy.get('input[type="radio"][value="scratch"]').click();
    cy.get('button').contains('Continue').click();
    cy.get('button').contains('Create questions').click();
    cy.selectDataType('coding');
    cy.getRadioButtonLabel('Create answer list', 'Yes').click();
    cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
    cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
    cy.get('[id^="__\\$answerOptionMethods_value-set"]')
      .should('be.visible').and('not.be.checked');
    cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]')
      .should('be.visible').and('not.be.checked');
  });

  it('should not find SNOMED CT functionality after accepting only LOINC terms of use.', () => {
    cy.goToHomePage();
    cy.acceptLoincOnly();
    cy.getSessionStorageItem('acceptedLoinc')
      .should('equal', 'true');
    cy.getSessionStorageItem('acceptedSnomed')
      .should('equal', 'false');
    cy.get('input[type="radio"][value="scratch"]').click();
    cy.get('button').contains('Continue').click();
    cy.get('button').contains('Create questions').click();
    cy.get('.spinner-border').should('not.exist');
    cy.selectDataType('coding');
    cy.getRadioButtonLabel('Create answer list', 'Yes').click();
    cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
    cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
    cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('be.visible').and('not.be.checked');
    cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('not.exist');
  });
});

describe('Home page', () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    // loadHomePage() calls visit() with assertions for LForms object on window.
    // It also deals with loinc notice, if needed.
    CypressUtil.mockSnomedEditions();
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
      cy.get('input[type="radio"][value="existing"]').click();
    });

    it('should import local file', () => {
      cy.get('input[type="radio"][value="local"]').should('be.visible').click();
      cy.readFile('cypress/fixtures/answer-option-sample.json').then((json) => {
        cy.uploadFile('answer-option-sample.json');
        cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Answer options form');
        cy.questionnaireJSON().then((previewJson) => {
          expect(previewJson.item.length).equal(2);
        });
      });
    });

    it('should import LOINC form', () => {
      cy.get('input[type="radio"][value="loinc"]').should('be.visible').click();
      cy.contains('button', 'Continue').click();
      cy.get('#loincSearch').type('vital signs with');
      cy.get('ngb-typeahead-window').should('be.visible');
      cy.get('ngb-typeahead-window button').first().click();
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Vital signs with method details panel');
      cy.get('[id^="booleanRadio_true"]').should('be.checked');
      cy.get('[id^="code.0.code"]').should('have.value', '34566-0');
    });

    it('should import form from FHIR server', () => {
      const titleSearchTerm = 'vital';

      cy.get('input[type="radio"][value="fhirServer"]').should('be.visible').click();
      cy.contains('button', 'Continue').click();
      cy.fhirSearch(titleSearchTerm);

      cy.getByLabel('lfb-form-fields', 'Title').invoke('val').should('match', new RegExp(titleSearchTerm, 'i'));
      cy.get('[id^="booleanRadio_true"]').should('be.checked');
      cy.get('[id^="code.0.code"]').should('have.value', '85353-1');
    });
  });

  describe('Home page export options', () => {
    beforeEach(() => {
      cy.get('input[type="radio"][value="existing"]').click();
      CypressUtil.deleteDownloadsFolder();
    });

    it('should export to local file in R4 format', () => {
      cy.uploadFile('sample.STU3.json');
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Sample STU3 form');
      cy.contains('button.dropdown-toggle', 'Export').click();
      cy.contains('button.dropdown-item', 'Export to file in FHIR R4 format').click();
      cy.readFile('cypress/downloads/Sample-STU3-form.R4.json').then((json) => {
        cy.contains('#resizableMiddle .navbar button', 'Preview').scrollIntoView().click();
        cy.contains('.mat-mdc-tab-labels span', 'View/Validate Questionnaire JSON').scrollIntoView().click();
        cy.contains('.preview-json-tabs .mat-mdc-tab-labels span', 'R4').scrollIntoView().click();
        cy.get('button[title="Copy questionnaire to clipboard"]').first().focus().realClick();
        CypressUtil.getClipboardContent((text) => {
          const form = JSON.parse(text);
          expect(form.item[0].answerOption.length).to.be.equal(3);
          expect(form).to.be.deep.equal(json);
        });
        cy.contains('mat-dialog-actions > button', 'Close').scrollIntoView().click();
      });
    });

    it('should export to local file in STU3 format', () => {
      cy.uploadFile('sample.R4.json');
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Sample R4 form');

      cy.contains('div', 'Code').find('[id^="booleanRadio_true"]').should('be.checked');
      cy.contains('table > thead', 'Code').parent().parent().as('codeField');
      cy.get('@codeField').find('tbody').as('codeTable');
      cy.get('@codeTable').find('tr:nth-child(1)').as('firstRow');
      cy.get('@firstRow').find('[id^="code.0.code_"]').should('have.value', '34565-2');

      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
      cy.contains('div', 'Question code').find('[id^="booleanRadio_true"]').should('be.checked');
      cy.contains('table > thead', 'Code').parent().parent().as('codeField');
      cy.get('@codeField').find('tbody').as('codeTable');
      cy.get('@codeTable').find('tr:nth-child(1)').as('firstRow');
      cy.get('@firstRow').find('[id^="code.0.code_"]').should('have.value', '8358-4');

      cy.contains('button.dropdown-toggle', 'Export').click();
      cy.contains('button.dropdown-item', 'Export to file in FHIR STU3 format').click();
      cy.readFile('cypress/downloads/Sample-R4-form.STU3.json').then((json) => {
        cy.contains('#resizableMiddle .navbar button', 'Preview').scrollIntoView().click();
        cy.contains('.mat-mdc-tab-labels span', 'View/Validate Questionnaire JSON').scrollIntoView().click();
        cy.contains('.preview-json-tabs .mat-mdc-tab-labels span', 'STU3').scrollIntoView().click();
        cy.get('button[title="Copy questionnaire to clipboard"]').first().focus().realClick();
        CypressUtil.getClipboardContent((text) => {
          const form = JSON.parse(text);
          expect(form.item[0].option.length).to.be.equal(3);
          expect(form).to.be.deep.equal(json);
          cy.contains('mat-dialog-actions > button', 'Close').scrollIntoView().click();
        });
      });
    });

    it('should export to local file in LHC-FORMS format', () => {
      cy.uploadFile('sample.R4.json');
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Sample R4 form');
      cy.contains('button.dropdown-toggle', 'Export').click();
      cy.contains('button.dropdown-item', 'Export to file in LHC-Forms internal (and volatile) format').click();
      cy.readFile('cypress/downloads/Sample-R4-form.LHC-Forms.json').then((json) => {
        cy.contains('#resizableMiddle .navbar button', 'Preview').scrollIntoView().click();
        cy.contains('.mat-mdc-tab-labels span', 'View/Validate Questionnaire JSON').scrollIntoView().click();
        cy.contains('.preview-json-tabs .mat-mdc-tab-labels span', 'R4').scrollIntoView().click();
        cy.get('button[title="Copy questionnaire to clipboard"]').first().focus().realClick();
        CypressUtil.getClipboardContent((text) => {
          const form = JSON.parse(text);
          expect(form.title).to.be.equal(json.name);
          expect(form.item[0].text).to.be.equal(json.items[0].question);
          expect(form.item[0].code[0].code).to.be.equal(json.items[0].codeList[0].code);
          expect(form.item[0].answerOption.length).to.be.equal(json.items[0].answers.length);
        });
        cy.contains('mat-dialog-actions > button', 'Close').scrollIntoView().click();
      });
    });
  });

  describe('Form level fields', () => {
    beforeEach(() => {
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.get('button').contains('Continue').click();
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
      cy.getByLabel('lfb-form-fields', 'URL').as('url').type('http://example.com/1');
      cy.questionnaireJSON().should((json) => {
        expect(json.url).equal('http://example.com/1');
      });
      cy.get('@url').clear().type('a a');
      cy.get('@url').next('ul').find('small')
        .should('be.visible')
        .contains('Spaces and other whitespace characters are not allowed in this field.');
      cy.get('@url').clear();
      cy.get('@url').siblings('ul').should('not.exist');
    });

    it('should retain title edits', () => {
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'New Form').clear();
      cy.getByLabel('lfb-form-fields', 'Title').type('Dummy title');
      cy.contains('button', 'Create questions').click();
      cy.questionnaireJSON().should((json) => {
        expect(json.title).equal('Dummy title');
      });
      cy.contains('button', 'Edit form attributes').click();
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value','Dummy title');
    });

    it('should display default title', () => {
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'New Form').clear();
      cy.contains('button', 'Create questions').click();
      cy.get('div#resizableMiddle button')
        .should('contain.text', 'Untitled Form')
        .should('contain.class', 'attention');
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
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Answer options form', {timeout: 10000});

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
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'US Surgeon General family health portrait', {timeout: 10000});
      cy.contains('nav.navbar button', 'Preview').click();
      cy.contains('div[role="tab"]', 'View Rendered Form').click();
      cy.get('wc-lhc-form').should('exist', true, {timeout: 10000});
      cy.get('#\\/54126-8\\/54133-4\\/1\\/1').as('ethnicity');
      cy.get('@ethnicity').type('l');
      cy.get('#completionOptions').scrollIntoView();
      cy.get('#completionOptions').should('be.visible', true);
      cy.get('@ethnicity').type('{downarrow}{enter}', {force: true});
      cy.get('span.autocomp_selected').contains('La Raza');
      cy.contains('mat-dialog-actions > button', 'Close').click();
    });

    describe('Upload questionnaires to FHIR server', () => {


      [
        {
          fixtureFile: 'initial-sample.R5.json',
          serverBaseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR5',
          version: 'R5',
        },
        {
          fixtureFile: 'initial-sample.R4.json',
          serverBaseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4',
          version: 'R4',
        },
        {
          fixtureFile: 'initial-sample.STU3.json',
          serverBaseUrl: 'https://hapi.fhir.org/baseDstu3',
          version: 'STU3',
        }
      ].forEach((testConfig) => {
        let responseStub;
        beforeEach(() => {
          CypressUtil.setupStub(testConfig.fixtureFile, {
            // Use the following fields in the server response.
            id: '1111',
            meta: {
              versionId: "1",
              lastUpdated: "2020-02-22T22:22:22.222-00:00"
            }
          }).then((resp) => {
            responseStub = resp.responseStub;
          });
        });

        it('should create/update questionnaire on the fhir server - ' + testConfig.version, () => {
          cy.uploadFile(testConfig.fixtureFile);
          cy.contains('button.dropdown-toggle.btn', 'Export').as('exportMenu');
          cy.get('@exportMenu').click(); // Open menu
          cy.contains('button.dropdown-item', 'Update the questionnaire').as('updateMenuItem');
          cy.get('@updateMenuItem').should('have.class', 'disabled');
          cy.get('@exportMenu').click();  // Close the menu
          cy.intercept('POST', testConfig.serverBaseUrl+'/Questionnaire', {
            statusCode: 201,
            body: responseStub
          }).as('create');
          cy.FHIRServerResponse('Create a new questionnaire', testConfig.serverBaseUrl).should((json) => {
            expect(json).to.deep.equal(responseStub);
          });
          cy.wait('@create');

          // Update
          responseStub.title = 'Modified title';
          cy.getByLabel('lfb-form-fields', 'Title').clear().type(responseStub.title);
          cy.get('@exportMenu').click();
          cy.get('@updateMenuItem').should('be.visible');
          cy.get('@updateMenuItem').should('not.have.class', 'disabled');
          cy.get('@exportMenu').click();
          cy.intercept('PUT', testConfig.serverBaseUrl+'/Questionnaire/'+responseStub.id, {
            statusCode: 200,
            body: responseStub
          }).as('update');
          cy.FHIRServerResponse('Update').should((json) => {
            expect(json).to.deep.equal(responseStub);
          });
          cy.wait('@update');
        });
      });
    });

    it('should expand/collapse advanced fields panel', () => {
      cy.tsUrl().should('not.be.visible');
      cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible');
      cy.collapseAdvancedFields();
      cy.tsUrl().should('not.be.visible');
    });

    describe('Form level fields: Advanced', () => {
      beforeEach(() => {
        cy.expandAdvancedFields();
        cy.tsUrl().should('be.visible');
      });

      afterEach(() => {
        cy.collapseAdvancedFields();
        cy.tsUrl().should('not.be.visible');
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
        cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Terminology server sample form');
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

      describe('Import date fields', () => {
        const fileToFieldsMap = {
          'form-level-advanced-fields.json': [
            {field: 'implicitRules', title: 'Implicit rules'},
            {field: 'version', title: 'Version'},
            {field: 'name', title: 'Questionnaire name'},
            {field: 'date', title: 'Revision date'},
            {field: 'publisher', title: 'Publisher'},
            {field: 'copyright', title: 'Copyright'},
            {field: 'approvalDate', title: 'Approval date'},
            {field: 'lastReviewDate', title: 'Last review date'}
          ],
          'datetime-1.json': [
            {field: 'date', title: 'Revision date'},
            {field: 'approvalDate', title: 'Approval date'},
            {field: 'lastReviewDate', title: 'Last review date'}
          ],
          'datetime-2.json': [
            {field: 'date', title: 'Revision date'},
            {field: 'approvalDate', title: 'Approval date'},
            {field: 'lastReviewDate', title: 'Last review date'}
          ]
        };

        Object.keys(fileToFieldsMap).forEach((file, index) => {
          it('should import with advanced fields from: ' + file, () => {
            cy.fixture(file).then((json) => {
              cy.uploadFile(file);
              const fieldList = fileToFieldsMap[file];

              cy.getByLabel('lfb-form-fields', 'Title').should('have.value', json.title); // Wait until fields are loaded.
              fieldList.forEach((fieldObj) => {
                let expVal = json[fieldObj.field];
                // Any datetime with zulu time included should be translated to local time.
                if (file === 'form-level-advanced-fields.json' && fieldObj.field === 'date') {
                  expVal = CypressUtil.getLocalTime(json[fieldObj.field]);
                }
                cy.getByLabel('lfb-form-fields', fieldObj.title).should((fieldEl) => {
                  expect(fieldEl.val()).to.equal(expVal);
                });
              });

              cy.questionnaireJSON().then((previewJson) => {
                fieldList.forEach((f) => {
                  expect(previewJson[f.field]).to.be.deep.equal(json[f.field]);
                });
              });
            });
          });
        });
      });

      describe('Date and Datetime related fields.', () => {
        const dateRE = /^\d{4}-\d{2}-\d{2}$/;
        const dateTimeRE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} (AM|PM)$/;
        const dateTimeZuluRE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

        it('should test revised date (date time picker)', () => {
          cy.getByLabel('lfb-form-fields', 'Revision date').as('dateInput');
          cy.get('@dateInput').next('button').as('dateBtn').click();
          cy.get('@dateInput').next('ngb-datepicker').as('datepicker');
          cy.getByLabel('@datepicker', 'Include time').as('includeTime');
          cy.get('@includeTime').should('be.checked');
          cy.contains('ngb-datepicker button', 'Today').click();
          cy.get('@dateInput').should('have.prop', 'value').should('match', dateRE);
          cy.contains('ngb-datepicker button', 'Now').as('now').click();
          cy.get('@dateInput').should('have.prop', 'value').should('match', dateTimeRE);
          cy.get('@includeTime').next('label').click();
          cy.get('ngb-timepicker fieldset').should('be.disabled');
          cy.get('@dateInput').should('have.prop', 'value').should('match', dateRE);
          cy.get('@now').click();
          cy.get('@dateInput').should('have.prop', 'value').should('match', dateTimeRE);
          cy.questionnaireJSON().then((previewJson) => {
            expect(previewJson.date).to.match(dateTimeZuluRE);
          });
        });

        it('should test approval date (date picker)', () => {
          cy.getByLabel('lfb-form-fields', 'Approval date').as("approvalDtInput");
          cy.get('@approvalDtInput').next('button').as('approvalDtBtn').click();
          cy.get('@approvalDtInput').next('ngb-datepicker').as('datepicker');

          cy.get('@datepicker').should('be.visible');
          cy.get('@datepicker').contains('Today').click();
          cy.get('@approvalDtInput').should('have.prop', 'value').should('match', dateRE);
          cy.get('@approvalDtInput').clear().type('2021-01-01');
          cy.questionnaireJSON().then((previewJson) => {
            expect(previewJson.approvalDate).to.be.equal('2021-01-01');
          });
        });

        it('should accept valid but not invalid dates', () => {
          // Pick a sample datetime and date widgets; date is datetime widget and approvalDate is date widget.
          [
            {widgetId: 'date', widgetLabel: 'Revision date'},
            {widgetId:'approvalDate', widgetLabel: 'Approval date'},
            {widgetId: 'lastReviewDate', widgetLabel: 'Last review date'}
          ].forEach(({widgetId,widgetLabel}) => {
            cy.getByLabel('lfb-form-fields', widgetLabel).as('dateInput');
            const widgetSel = '@dateInput';
            ['2020', '2020-06', '2020-06-23'].forEach((validDate) => {
              cy.get(widgetSel).clear().type(validDate).blur();

              cy.questionnaireJSON().then((q) => {
                expect(q[widgetId]).to.be.equal(validDate);
              });
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

          [
            {widgetId: 'date', widgetLabel: 'Revision date'},
            {widgetId:'approvalDate', widgetLabel: 'Approval date'},
            {widgetId: 'lastReviewDate', widgetLabel: 'Last review date'}
          ].forEach(({widgetId,widgetLabel}) => {
            cy.getByLabel('lfb-form-fields', widgetLabel).as('dateInput');
            const widgetSel = '@dateInput';
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

            ['2023-11-31', '2023-02-29', '2023-02-30', '2023-02-31'].forEach((input) => {
              cy.get(widgetSel).clear().type(input);
              cy.get(widgetSel).parent().next('small.text-danger').should('have.text', 'Invalid date.');
              cy.get(widgetSel).blur();
              cy.questionnaireJSON().then((q) => {
                expect(q[widgetId]).to.be.undefined;
              });
            });
          });
          [
            {widgetId: 'date', widgetLabel: 'Revision date'}
          ].forEach(({widgetId,widgetLabel}) => {
            cy.getByLabel('lfb-form-fields', widgetLabel).as('dateInput');
            const widgetSel = '@dateInput';
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

      it('should create variables at the Questionnaire level', () => {
        cy.get('button#editVariables').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 0);

          // Add a new variable 'a_fhir_exp'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 1);
          cy.get('#variable-label-0').clear().type('a_fhir_exp');
          cy.get('#variable-type-0').select('FHIRPath Expression');
          cy.get('input#variable-expression-0').type("%resource.item.where(linkId='/29453-7').answer.value");
          cy.get('input#variable-expression-0').should('not.have.class', 'field-error');

          // Add a new variable 'b_fhir_query'
          cy.get('#add-variable').click();
          cy.get('#variable-label-1').clear().type('b_fhir_query');
          cy.get('#variable-type-1').select('FHIR Query');
          cy.get('input#variable-expression-1')
            .type("Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))");
          cy.get('input#variable-expression-1').should('not.have.class', 'field-error');

          // Add a new variable 'c_fhir_query_obs'
          cy.get('#add-variable').click();
          cy.get('#variable-label-2').clear().type('c_fhir_query_obs');
          cy.get('#variable-type-2').select('FHIR Query (Observation)');

          cy.get('lhc-query-observation').shadow().find('#autocomplete-2').as('queryObs');

          cy.get('@queryObs').then(($el: JQuery<HTMLInputElement>) => {
            // Search for invalid code, should return empty array
            cy.selectAutocompleteOptions($el, false, 'invalidCode', null, '{downarrow}{enter}', []);

            // Search for 'weight', should return selected result
            cy.selectAutocompleteOptions($el, true, 'weight', null, '{downarrow}{enter}', ['×Weight - 29463-7']);
          });

          // Add a new variable 'e_easy_path_exp'
          cy.get('#add-variable').click();
          cy.get('#variable-label-3').clear().type('d_easy_path_exp');
          cy.get('#variable-type-3').select('Easy Path Expression');
          cy.get('input#simple-expression-3').type('1');

          // Save the variables
          cy.get('#export').click();
        });

        cy.get('lfb-variable tbody > tr').as('variables');
        cy.get('@variables').should('have.length', 4);

        cy.get('@variables').eq(0).find('td').as('variable1');
        cy.get('@variable1').eq(0).should('have.text', 'a_fhir_exp');
        cy.get('@variable1').eq(1).should('have.text', 'FHIRPath Expression');
        cy.get('@variable1').eq(2).should('have.text', "%resource.item.where(linkId='/29453-7').answer.value");

        cy.get('@variables').eq(1).find('td').as('variable2');
        cy.get('@variable2').eq(0).should('have.text', 'b_fhir_query');
        cy.get('@variable2').eq(1).should('have.text', 'FHIR Query');
        cy.get('@variable2').eq(2).should('have.text', "Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))");

        cy.get('@variables').eq(2).find('td').as('variable3');
        cy.get('@variable3').eq(0).should('have.text', 'c_fhir_query_obs');
        cy.get('@variable3').eq(1).should('have.text', 'FHIR Query (Observation)');
        cy.get('@variable3').eq(2).should('have.text', "Observation?code=http%3A%2F%2Floinc.org%7C29463-7&date=gt{{today()-1 months}}&patient={{%patient.id}}&_sort=-date&_count=1");

        cy.get('@variables').eq(3).find('td').as('variable4');
        cy.get('@variable4').eq(0).should('have.text', 'd_easy_path_exp');
        cy.get('@variable4').eq(1).should('have.text', 'Easy Path Expression');
        cy.get('@variable4').eq(2).should('have.text', "1");
      });
    });
  });

  it('should display variables at the Questionnaire level', () => {
    cy.get('input[type="radio"][value="existing"]').click();
    cy.get('input[type="radio"][value="local"]').click();
    // Note, the cypress upload works regardless of the file extension.
    cy.uploadFile('questionnaire_level_variables.json');

    cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Weight & Height tracking panel', { timeout: 10000 });

    cy.expandAdvancedFields();

    cy.get('lfb-variable tbody > tr').as('variables');
    cy.get('@variables').should('have.length', 5);

    cy.get('@variables').eq(0).find('td').as('variable1');
    cy.get('@variable1').eq(0).should('have.text', 'a_fhirpath_exp');
    cy.get('@variable1').eq(1).should('have.text', 'FHIRPath Expression');
    cy.get('@variable1').eq(2).should('have.text', "%resource.item.where(linkId='/8302-2').answer.value");

    cy.get('@variables').eq(1).find('td').as('variable2');
    cy.get('@variable2').eq(0).should('have.text', 'b_fhir_query');
    cy.get('@variable2').eq(1).should('have.text', 'FHIR Query');
    cy.get('@variable2').eq(2).should('have.text', "%resource.item.where(linkId='/8352-7').answer.value");

    cy.get('@variables').eq(2).find('td').as('variable3');
    cy.get('@variable3').eq(0).should('have.text', 'c_fhir_obs');
    cy.get('@variable3').eq(1).should('have.text', 'FHIR Query (Observation)');
    cy.get('@variable3').eq(2).should('have.text', "Observation?code=http%3A%2F%2Floinc.org%7C29463-7&date=gt{{today()-1 months}}&patient={{%patient.id}}&_sort=-date&_count=1");

    cy.get('@variables').eq(3).find('td').as('variable4');
    cy.get('@variable4').eq(0).should('have.text', 'd_question');
    cy.get('@variable4').eq(1).should('have.text', 'Question');
    cy.get('@variable4').eq(2).should('have.text', "%resource.item.where(linkId='/29463-7').answer.value");

    cy.get('@variables').eq(4).find('td').as('variable5');
    cy.get('@variable5').eq(0).should('have.text', 'e_simple');
    cy.get('@variable5').eq(1).should('have.text', 'Easy Path Expression');
    cy.get('@variable5').eq(2).should('have.text', "1 + 1");

    cy.collapseAdvancedFields();
  });

  describe('User specified FHIR server dialog', () => {
    beforeEach(() => {
      cy.contains('button', 'Continue').click();
      cy.contains('button', 'Import').click();
      cy.contains('button', 'Import from a FHIR server...').click();
      cy.contains('div.modal-footer button', 'Add your FHIR server').click();
      cy.get('#urlInputId').as('inputUrl');
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
      cy.contains('p.text-danger', 'Unable to confirm the URL is a FHIR server.').should('be.visible', true);
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
      cy.get('lfb-fhir-servers-dlg table tbody tr')
        .first().find('td')
        .first().find('label').should('have.text', 'https://dummyhost-1.com/baseR4');
    });

  });

  describe('Warning dialog when replacing current form', () => {
    beforeEach(() => {
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.contains('button', 'Continue').click();
      cy.uploadFile('answer-option-sample.json');
    });

    it('should display warning dialog when replacing from local file', () => {
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Answer options form');

      cy.uploadFile('decimal-type-sample.json');
      cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
      cy.contains('div.modal-footer button', 'Cancel').click();
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Answer options form');

      cy.uploadFile('decimal-type-sample.json', true);
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Decimal type form');
    });

    it('should display warning dialog when replacing form from LOINC', () => {
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Answer options form');

      cy.contains('nav.navbar button.dropdown-toggle', 'Import ').click();
      cy.get('form > input[placeholder="Search LOINC"]').type('Vital signs with method details panel');
      cy.get('ngb-typeahead-window').should('be.visible');
      cy.get('ngb-typeahead-window button').first().click();
      cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
      cy.contains('div.modal-footer button', 'Cancel').click();
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Answer options form');

      cy.contains('nav.navbar button.dropdown-toggle', 'Import ').click();
      cy.get('form > input[placeholder="Search LOINC"]').type('Vital signs with method details panel');
      cy.get('ngb-typeahead-window').should('be.visible');
      cy.get('ngb-typeahead-window button').first().click();
      cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
      cy.contains('div.modal-footer button', 'Continue').click();

      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Vital signs with method details panel');
    });

    it('should display warning dialog when replacing form from FHIR server', () => {
      const titleSearchTerm = 'vital';
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Answer options form');
      cy.contains('button', 'Import').click();
      cy.contains('button', 'Import from a FHIR server...').click();
      cy.fhirSearch(titleSearchTerm);
      cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
      cy.contains('div.modal-footer button', 'Cancel').click();
      cy.getByLabel('lfb-form-fields', 'Title').should('have.value', 'Answer options form');

      cy.contains('button', 'Import').click();
      cy.contains('button', 'Import from a FHIR server...').click();
      cy.fhirSearch(titleSearchTerm);
      cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
      cy.contains('div.modal-footer button', 'Continue').click();

      cy.getByLabel('lfb-form-fields', 'Title').invoke('val').should('match', new RegExp(titleSearchTerm, 'i'));
      cy.get('[id^="booleanRadio_true"]').should('be.checked');
      cy.get('[id^="code.0.code"]').should('have.value', '85353-1');
    });
  });

});
