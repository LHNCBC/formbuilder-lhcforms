/// <reference types="cypress" />
/*
import {Util} from '../../../src/app/lib/util'; */
import { CypressUtil } from '../../support/cypress-util';


import { ExtensionDefs } from "../../../src/app/lib/extension-defs";
import { EXTENSION_URL_ITEM_CONTROL } from 'src/app/lib/constants/constants';

const entryFormatUrl = 'http://hl7.org/fhir/StructureDefinition/entryFormat';
const olpExtUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationLinkPeriod';

const observationExtractExtUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationExtract';

const ucumUrl = 'http://unitsofmeasure.org';
const snomedEclText =
  '< 429019009 |Finding related to biological sex|';
const snomedEclTextDiseaseDisorder =
  '< 64572001 |Disease (disorder)|';
const snomedEclEncodedTextDiseaseDisorder =
  'ecl/http://snomed.info/sct/900000000000207008/version/20231001?fhir_vs=ecl/%3C+64572001+%7CDisease+%28disorder%29%7C';

describe('Home page', () => {
  beforeEach(CypressUtil.mockSnomedEditions);

  beforeEach(() => {
    cy.loadHomePage();
  });


  describe('Item level fields: advanced', () => {

    beforeEach(() => {
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.get('button').contains('Continue').click();
      cy.contains('button', 'Create questions').click();
      cy.getItemTextField().should('have.value', 'Item 0', {timeout: 10000});
      cy.contains('.node-content-wrapper', 'Item 0').as('item0');
      cy.get('.btn-toolbar').contains('button', 'Add new item').as('addNewItem');
      cy.get('input[id^="__\\$helpText\\.text"]').as('helpText');
      cy.contains('div', 'Question code').as('codeOption').should('be.visible');
      cy.get('@codeOption').find('[for^="booleanRadio_true"]').as('codeYes'); // Radio label for clicking
      cy.get('@codeOption').find('[for^="booleanRadio_false"]').as('codeNo'); // Radio label for clicking
      cy.get('@codeOption').find('[id^="booleanRadio_true"]').as('codeYesRadio'); // Radio input for assertions
      cy.get('@codeOption').find('[id^="booleanRadio_false"]').as('codeNoRadio'); // Radio input for assertions

      cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');
      cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible'); // Proof of advanced panel expansion
    });

    afterEach(() => {
      cy.collapseAdvancedFields();
    });

    it('should support conditional display with answer coding source', () => {
      cy.addAnswerOptions();
      cy.contains('Add new item').scrollIntoView().click();

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      cy.get('[id^="enableWhen.0.question"]').type('{downarrow}{enter}');
      cy.get('[id^="enableWhen.0.operator"]').select('=');
      cy.get('[id^="enableWhen.0.answerCoding"]').select('d1 (c1)');

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
    });

    it('should display error message for invalid answer in conditional display', () => {
      cy.contains('Add new item').scrollIntoView().click();

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      const errorMessageEl = 'mat-sidenav-content ul > li.text-danger.list-group-item-warning';
      const question1El = '[id^="enableWhen.0.question"]';
      const operator1El = '[id^="enableWhen.0.operator"]';
      const answer1El = '[id^="enableWhen.0.answer"]';
      const errorIcon1El = '[id^="enableWhen.0_err"]';
      const question2El = '[id^="enableWhen.1.question"]';
      const operator2El = '[id^="enableWhen.1.operator"]';
      const answer2El = '[id^="enableWhen.1.answer"]';
      const errorIcon2El = '[id^="enableWhen.1_err"]';

      cy.get(question1El).type('{downarrow}{enter}');
      cy.get(errorIcon1El).should('not.exist');
      cy.get(errorMessageEl).should('not.exist');

      cy.get(operator1El).select('=');
      cy.get(errorIcon1El).should('be.visible');
      cy.get(errorMessageEl).should('have.length', 2);
      cy.get(operator1El).select('Empty');
      cy.get(errorIcon1El).should('not.exist');
      cy.get(errorMessageEl).should('not.exist');

      cy.get(operator1El).select('>');
      cy.get(errorIcon1El).should('be.visible');
      cy.get(errorMessageEl).should('have.length', 2);
      cy.get(answer1El).type('1');
      cy.get(errorIcon1El).should('not.exist');
      cy.get(errorMessageEl).should('not.exist');

      cy.contains('button', 'Add another condition').click();

      cy.get(question2El).type('{downarrow}{enter}');
      cy.get(errorIcon2El).should('not.exist');
      cy.get(errorMessageEl).should('not.exist');
      cy.get(operator2El).select('<');
      cy.get(errorIcon2El).should('be.visible');
      cy.get(errorMessageEl).should('have.length', 2);
      cy.get('[id^="enableWhen.1_remove"]').click();
      cy.get(errorMessageEl).should('not.exist');

    });

    it('should display validation error message for each of the enableWhen fields', () => {
      const sampleFile = 'items-validation-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');

      const errorMessageEl = 'mat-sidenav-content ul > li.text-danger.list-group-item-warning';
      const question1El = '[id^="enableWhen.0.question"]';
      const operator1El = '[id^="enableWhen.0.operator"]';
      const answer1El = '[id^="enableWhen.0.answer"]';
      const errorIcon1El = '[id^="enableWhen.0_err"]';

      const question2El = '[id^="enableWhen.1.question"]';
      const errorIcon2El = '[id^="enableWhen.1_err"]';

      const errorIcon3El = '[id^="enableWhen.2_err"]';

      const errorIcon4El = '[id^="enableWhen.3_err"]';

      cy.clickTreeNode('EnableWhen');

      cy.get(errorMessageEl).should('exist');

      cy.get(question1El).should('contain.value', '4 - Integer Type');
      cy.get(operator1El).should('contain.value', '=');
      cy.get(answer1El).should('contain.value', '5');
      cy.get(errorIcon1El).should('not.exist');

      cy.get(question2El).should('be.empty');
      cy.get(errorIcon2El)
        .find('small')
        .should('contain.text', ' Question not found for the linkId \'q11\' for enableWhen condition 2. ');

      cy.get(errorIcon3El)
        .find('small')
        .should('contain.text', ' Invalid operator \'>\' for type \'coding\' for enableWhen condition 3. ');

      cy.get(errorIcon4El)
        .find('small')
        .should('contain.text', ' Answer field is required when you choose an operator other than \'Not empty\' or \'Empty\' for enableWhen condition 4. ');
    });

    it('should clear invalid question field on focusout for new enableWhen condition', () => {
      const sampleFile = 'items-validation-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');

      const errorMessageEl = 'mat-sidenav-content ul > li.text-danger.list-group-item-warning';

      cy.clickTreeNode('Integer Type');

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      // Insert a valid enableWhen condition
      // Select question '3.1 Name'
      cy.get('[id^="enableWhen.0.question"]').type('{enter}');
      cy.get('[id^="enableWhen.0.operator"]').select('=');
      cy.get('[id^="enableWhen.0.answerString"]').type('Joe');
      // There should be no error
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // Add another enableWhen condition
      cy.contains('button', 'Add another condition').click();

      cy.get('[id^="enableWhen.1.question"]').type('invalid question');
      cy.get('ngb-typeahead-window').should('not.exist');
      // Hit the tab key from the question field. Validation should be triggered, but
      // no error should occur, as this represents a new condition where the 'enableWhen'
      // condition has not yet been added to the item.
      cy.get('[id^="enableWhen.1.question"]').trigger('keyup', {key: 'Tab'});

      // B/c the question is invalid, it should be cleared out
      cy.get('[id^="enableWhen.1.question"]').should('be.empty');
      cy.get('[id^="enableWhen.1_err"]').should('not.exist');

      // Verify the questionnaire JSON.
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item.length).equal(12);
        // Verify enableWhen construct.
        expect(qJson.item[3].enableWhen.length).equal(1);
        expect(qJson.item[3].enableWhen[0].question).equal(qJson.item[2].item[0].linkId);
        expect(qJson.item[3].enableWhen[0].operator).equal('=');
        expect(qJson.item[3].enableWhen[0].answerString).equal('Joe');
      });
    });

    it('should display an error on invalid question field on focusout for an existing enableWhen condition', () => {
      const sampleFile = 'items-validation-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');

      const errorMessageEl = 'mat-sidenav-content ul > li.text-danger.list-group-item-warning';

      cy.clickTreeNode('Integer Type');

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      // Insert a valid enableWhen condition
      // Select question '3.1 Name'
      cy.get('[id^="enableWhen.0.question"]').type('{enter}');
      cy.get('[id^="enableWhen.0.operator"]').select('=');
      cy.get('[id^="enableWhen.0.answerString"]').type('Joe');
      // There should be no error
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // Add another enableWhen condition
      cy.contains('button', 'Add another condition').click();

      cy.get('[id^="enableWhen.1.question"]').type('{enter}');
      cy.get('[id^="enableWhen.1.operator"]').select('=');
      cy.get('[id^="enableWhen.1.answerString"]').type('David');

      // Add another enableWhen condition (different type)
      cy.contains('button', 'Add another condition').click();

      cy.get('[id^="enableWhen.2.question"]').type('{downarrow}{enter}');
      cy.get('[id^="enableWhen.2.operator"]').select('=');
      cy.get('[id^="enableWhen.2.answerCoding"]').select('Street clothes, no shoes (LA11872-1)');
      // Verify the questionnaire JSON.
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item.length).equal(12);
        // Verify enableWhen construct.
        expect(qJson.item[3].enableWhen.length).equal(3);
        expect(qJson.item[3].enableWhen[0].question).equal(qJson.item[2].item[0].linkId);
        expect(qJson.item[3].enableWhen[0].operator).equal('=');
        expect(qJson.item[3].enableWhen[0].answerString).equal('Joe');

        expect(qJson.item[3].enableWhen[1].question).equal(qJson.item[2].item[0].linkId);
        expect(qJson.item[3].enableWhen[1].operator).equal('=');
        expect(qJson.item[3].enableWhen[1].answerString).equal('David');

        expect(qJson.item[3].enableWhen[2].question).equal(qJson.item[4].linkId);
        expect(qJson.item[3].enableWhen[2].operator).equal('=');
        expect(qJson.item[3].enableWhen[2].answerCoding.display).equal('Street clothes, no shoes');
      });

      // Change the 2nd enableWhen Question to an invalid one.
      cy.get('[id^="enableWhen.1.question"]').clear().type('invalid question');
      cy.get('ngb-typeahead-window').should('not.exist');
      cy.get('[id^="enableWhen.1.operator"]').focus();
      // B/c the question is invalid, it should be cleared out
      cy.get('[id^="enableWhen.1.question"]').should('be.empty');
      // Since this enableWhen condition is in the item, the error message should be displayed
      cy.get('[id^="enableWhen.1_err"]').should('exist');
      cy.get('[id^="enableWhen.1_err"]')
        .find('small')
        .should('contain.text', ' Question not found for the linkId \'\' for enableWhen condition 2. ');

      // Change the 3rd enableWhen Question to an invalid one.
      cy.get('[id^="enableWhen.2.question"]').clear().type('invalid question2');
      cy.get('ngb-typeahead-window').should('not.exist');
      cy.get('[id^="enableWhen.2.operator"]').focus();
      // B/c the question is invalid, it should be cleared out
      cy.get('[id^="enableWhen.2.question"]').should('be.empty');
      // Since this enableWhen condition is in the item, the error message should be displayed
      cy.get('[id^="enableWhen.2_err"]').should('exist');
      cy.get('[id^="enableWhen.2_err"]')
        .find('small')
        .should('contain.text', ' Question not found for the linkId \'\' for enableWhen condition 3. ');

      // Verify the questionnaire JSON.
      cy.questionnaireJSON().should((qJson) => {
        // There should be only one enableWhen condition in the JSON. The two invalid conditions
        // should be excluded.
        expect(qJson.item[3].enableWhen.length).equal(1);
        expect(qJson.item[3].enableWhen[0].question).equal(qJson.item[2].item[0].linkId);
        expect(qJson.item[3].enableWhen[0].operator).equal('=');
      });

      // Click on another item
      cy.clickTreeNode('Valid LinkId');

      // Click back to the 'Interger Type' item
      cy.clickTreeNode('Integer Type');

      // Confirm that the 2nd enableWhen question does not get reverted back to the original value
      cy.get('[id^="enableWhen.1.question"]').should('be.empty');
      // Since this enableWhen condition is in the item, the error message should be displayed
      cy.get('[id^="enableWhen.1_err"]').should('exist');
      cy.get('[id^="enableWhen.1_err"]')
        .find('small')
        .should('contain.text', ' Question not found for the linkId \'\' for enableWhen condition 2. ');

      // Confirm that the 3rd enableWhen question does not get reverted back to the original value
      cy.get('[id^="enableWhen.2.question"]').should('be.empty');
      // Since this enableWhen condition is in the item, the error message should be displayed
      cy.get('[id^="enableWhen.2_err"]').should('exist');
      cy.get('[id^="enableWhen.2_err"]')
        .find('small')
        .should('contain.text', ' Question not found for the linkId \'\' for enableWhen condition 3. ');
    });

    it('should display lforms errors in preview', () => {
      const sampleFile = 'questionnaire-enableWhen-missing-linkId.json';
      cy.uploadFile(sampleFile, true);
      cy.getFormTitleField().should('have.value', 'Questionnaire where enableWhen contains an invalid linkId');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
      cy.contains('button', 'Preview').click();
      cy.get('wc-lhc-form').should('exist').parent().as('tabBody');
      cy.get('@tabBody').find('.card.bg-danger-subtle').should('be.visible')
        .within(() => {
          // Error message returns from LForms.
          cy.get('.lforms-validation')
            .should('have.text', 'Question with linkId \'q3\' contains enableWhen pointing to a question with linkId \'q11\' that does not exist.');

          // The FHIR validation message is shown when an error is detected by LForms. It informs users
          // that additional validation can be performed against the FHIR server found in the
          // 'View/Validate Questionnaire JSON tab'.
          cy.get('.fhir-validation-msg')
            .should('have.text', 'Select the \'View/Validate Questionnaire JSON\' tab to access a feature that validates your Questionnaire against a supplied FHIR server, offering more detailed error insights.');
        });
      cy.contains('mat-dialog-actions button', 'Close').click();

      // Delete offending item and assert the error does not exist
      cy.getTreeNode('enableWhen item with an invalid linkId').click();
      cy.contains('button', 'Delete this item').click();
      cy.contains('lfb-confirm-dlg button', 'Yes').click();
      cy.contains('button', 'Preview').click();
      cy.get('wc-lhc-form').should('exist').parent().as('tabBody');
      cy.get('@tabBody').find('.card.bg-danger-subtle').should('not.exist');
      cy.contains('mat-dialog-actions button', 'Close').click();
    });

    it('should show answer column if there is an answer option in any row of conditional display', () => {
      cy.enterAnswerOptions([
        {display: 'display 1', code: 'c1', system: 's1', __$score: 1},
        {display: 'display 2', code: 'c2', system: 's2', __$score: 2}
      ]);
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().should('have.value', 'New item 1');
      cy.enterAnswerOptions([
        {display: 'display 1', code: 'c1', system: 's1', __$score: 1},
        {display: 'display 2', code: 'c2', system: 's2', __$score: 2},
        {display: 'display 3', code: 'c3', system: 's3', __$score: 3}
      ]);
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().should('have.value', 'New item 2');

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      cy.get('[id^="enableWhen.0.question"]').as('r1Question').type('{enter}');
      cy.get('[id^="enableWhen.0.operator"]').as('r1Operator').select('Not empty');
      cy.get('[id^="enableWhen.0.answerCoding"]').should('not.exist');

      cy.contains('button', 'Add another condition').click();

      cy.get('[id^="enableWhen.1.question"]').as('r2Question').type('{downarrow}{enter}');
      cy.get('[id^="enableWhen.1.operator"]').as('r2Operator').select('=');
      cy.get('[id^="enableWhen.1.answerCoding"]').as('r2Answer').select('display 3 (c3)');

      cy.get('[id^="enableWhen.0.answerCoding"]').should('not.exist');

      cy.get('@r2Operator').select('Empty');
      cy.get('@r2Answer').should('not.exist');
      cy.get('@r1Operator').select('=');
      cy.get('[id^="enableWhen.0.answerCoding"]').as('r1Answer').should('be.visible');
      cy.get('@r1Answer').select('display 1 (c1)');
    });

    it('should show answer column if there is an answer in any row of conditional display', () => {
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().should('have.value', 'New item 1');

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      const r1Question = '[id^="enableWhen.0.question"]';
      const r1Operator = '[id^="enableWhen.0.operator"]';
      const r1Answer = '[id^="enableWhen.0.answer"]';
      const r2Question = '[id^="enableWhen.1.question"]';
      const r2Operator = '[id^="enableWhen.1.operator"]';
      const r2Answer = '[id^="enableWhen.1.answer"]';
      // First row operator='exist'
      cy.get(r1Question).as('r1Question').type('{enter}');
      cy.get(r1Operator).as('r1Operator').select('Not empty');
      cy.get(r1Answer).should('not.exist');

      cy.contains('button', 'Add another condition').click();

      // Second row other than 'exist'
      cy.get(r2Question).type('{downarrow}{enter}');
      cy.get(r2Operator).select('=');
      cy.get(r2Answer).type('2');
      cy.get(r1Answer).should('not.exist');

      // Flip the first and second row operators
      cy.get(r1Operator).select('=');
      cy.get(r1Answer).type('1');
      cy.get(r2Answer).should('have.value','2');

      cy.get(r2Operator).select('Empty');
      cy.get(r1Answer).should('have.value', '1');
      cy.get(r2Answer).should('not.exist');
    });

    it('should work with operator exists value in conditional display', () => {
      cy.enterAnswerOptions([
        {display: 'display 1', code: 'c1', system: 's1', __$score: 1},
        {display: 'display 2', code: 'c2', system: 's2', __$score: 2}
      ]);
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().should('have.value', 'New item 1');
      cy.enterAnswerOptions([
        {display: 'display 1', code: 'c1', system: 's1', __$score: 1},
        {display: 'display 2', code: 'c2', system: 's2', __$score: 2},
        {display: 'display 3', code: 'c3', system: 's3', __$score: 3}
      ]);
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().should('have.value', 'New item 2');

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      cy.get('[id^="enableWhen.0.question"]').as('r1Question').type('{enter}');
      cy.get('[id^="enableWhen.0.operator"]').as('r1Operator').select('Not empty');

      cy.contains('button', 'Add another condition').click();

      cy.get('[id^="enableWhen.1.question"]').as('r2Question').type('{downarrow}{enter}');
      cy.get('[id^="enableWhen.1.operator"]').as('r2Operator').select('Empty');
      cy.get('@r2Operator').should('have.value', '1: notexists');

      cy.questionnaireJSON().should((json) => {
        expect(json.item[2].enableWhen).to.deep.equal([
          {
            question: json.item[0].linkId,
            operator: 'exists',
            answerBoolean: true
          },
          {
            question: json.item[1].linkId,
            operator: 'exists',
            answerBoolean: false
          }
        ]);
      });

    });

    it('should display the tree hierarchy sequence number concatenated with the item text ', () => {
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().should('have.value', 'New item 1');

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      const r1Question = '[id^="enableWhen.0.question"]';
      // First row operator='exist'
      cy.get(r1Question).type('{enter}');
      cy.get(r1Question).should('have.value', '1 - Item 0');

    });

    it('should fix a bug showing answer field when source item is decimal and operator is other than exists', () => {
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().should('have.value', 'New item 1');

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      const r1Question = '[id^="enableWhen.0.question"]';
      const r1Operator = '[id^="enableWhen.0.operator"]';
      const r1Answer = '[id^="enableWhen.0.answer"]';
      const r1DecimalAnswer = '[id^="enableWhen.0.answerDecimal"]';
      const errorIcon1El = '[id^="enableWhen.0_err"]';
      // First row operator='exist'
      cy.get(r1Question).type('{enter}');
      cy.get(r1Operator).should('be.visible');
      cy.get(r1Answer).should('not.exist');
      cy.get(errorIcon1El).should('not.exist');

      cy.get(r1Operator).select('>');
      cy.get(r1DecimalAnswer).should('be.visible');
      cy.get(errorIcon1El).should('be.visible');
      cy.get(r1DecimalAnswer).type('2.3');
      cy.get(errorIcon1El).should('not.exist');
    });

    it('should support source item with answerValueSet in conditional display', () => {
      cy.selectDataType('coding');
      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
      cy.get('label[for^="__\\$answerOptionMethods_value-set"]').click();
      cy.get('#answerValueSet_non-snomed').type('http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions');
      cy.tsUrl().scrollIntoView().type('https://clinicaltables.nlm.nih.gov/fhir/R4');
      cy.get('label[for^="__\\$itemControl.autocomplete"]').click();
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().should('have.value', 'New item 1');

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      const r1Question = '[id^="enableWhen.0.question"]';
      const r1Operator = '[id^="enableWhen.0.operator"]';
      const r1Answer = 'lfb-enable-when table tbody tr:nth-child(1) lfb-enablewhen-answer-coding lfb-auto-complete input';
      cy.get(r1Question).as('r1Question').type('{enter}');
      cy.get(r1Operator).as('r1Operator').select('=');
      cy.get(r1Answer).click();
      cy.get(r1Answer).type('dia');
      cy.get('#lhc-tools-searchResults').contains('Diabetes mellitus').click();

      cy.questionnaireJSON().should((json) => {
        expect(json.item[1].enableWhen).to.deep.equal([
          {
            question: json.item[0].linkId,
            operator: '=',
            answerCoding: {
              system: 'http://clinicaltables.nlm.nih.gov/fhir/CodeSystem/conditions',
              code: '2143',
              display: 'Diabetes mellitus'
            }
          }
        ]);
      });
    });

    it('should support source item with SNOMED answerValueSet in conditional display', () => {
      cy.selectDataType('coding');
      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
      cy.get('label[for^="__\\$answerOptionMethods_snomed-value-set"]').click();
      cy.get('#answerValueSet_ecl').type(snomedEclText);
      cy.get('label[for^="__\\$itemControl.autocomplete"]').click();
      cy.contains('Add new item').scrollIntoView().click();

      // New default for 'Conditional method' is now 'None'
      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'none').should('be.checked');

      // Select the 'enableWhen condition and behavior' option
      cy.getRadioButtonLabel('Conditional method', 'enableWhen condition and behavior').click();

      const r1Question = '[id^="enableWhen.0.question"]';
      const r1Operator = '[id^="enableWhen.0.operator"]';
      const r1Answer = 'lfb-enable-when table tbody tr:nth-child(1) lfb-enablewhen-answer-coding lfb-auto-complete input';
      cy.get(r1Question).as('r1Question').type('{enter}');
      cy.get(r1Operator).as('r1Operator').select('=');
      cy.get(r1Answer).click();
      cy.intercept(
        {
          method: 'GET',
          https: true,
          hostname: 'snowstorm.ihtsdotools.org',
          pathname: '/fhir/ValueSet/$expand',
          query: {
            url: /^http:\/\/snomed.info\/sct\/900000000000207008\?fhir_vs=ecl\//,
            filter: /m(a(le?)?)?/,
            _format: 'application/json',
            count: '7'
          },
          times: 4
        },
        {
          fixture: 'snomed-ecl-expression-mock.json'
        }).as('snomedReq');


      cy.get(r1Answer).type('male');
      cy.wait('@snomedReq');
      cy.get('#lhc-tools-searchResults li:nth-child(1)').click();
      cy.get(r1Answer).should('have.value', 'Intersex');

      cy.questionnaireJSON().should((json) => {
        expect(json.item[1].enableWhen).to.deep.equal([
          {
            question: json.item[0].linkId,
            operator: '=',
            answerCoding: {
              system: 'http://snomed.info/sct',
              code: '32570691000036108',
              display: 'Intersex'
            }
          }
        ]);
      });
    });

    it('should import form with conditional display field', () => {
      const sampleFile = 'enable-when-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.getFormTitleField().should('have.value', 'US Surgeon General family health portrait');

      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
      cy.toggleTreeNodeExpansion('Family member health history');
      cy.toggleTreeNodeExpansion('Living?');
      cy.clickTreeNode('Living?');
      cy.get('lfb-answer-option table > tbody > tr').should('have.length', 3);
      cy.get('[id^="answerOption.0.valueCoding.display"]').should('have.value', 'Yes');
      cy.get('[id^="answerOption.0.valueCoding.code"]').should('have.value', 'LA33-6');
      cy.clickTreeNode('Date of Birth');
      cy.get('[id^="enableWhen.0.question"]').should('have.value', '1.1 - Living?');
      cy.get('[id^="enableWhen.0.operator"]')
        .find('option:selected').should('have.text','=');
      cy.get('[id^="enableWhen.0.answerCoding"]')
        .find('option:selected').should('have.text','Yes (LA33-6)');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].item[0].enableWhen)
          .to.deep.equal(fixtureJson.item[0].item[0].item[0].enableWhen);
      });
    });

    it('should create terminology server extension', () => {
      cy.tsUrl().should('be.visible').type('http://example.org/fhir');
      CypressUtil.assertValueInQuestionnaire('/item/0/extension',
        [{
          valueUrl: 'http://example.org/fhir',
          url: ExtensionDefs.preferredTerminologyServer.url
        }]);
      cy.tsUrl().clear();
      CypressUtil.assertValueInQuestionnaire('/item/0/extension', undefined);
      cy.tsUrl().type('http://example.com/r4');
      CypressUtil.assertValueInQuestionnaire('/item/0/extension',
        [{
          url: ExtensionDefs.preferredTerminologyServer.url,
          valueUrl: 'http://example.com/r4'
        }]);
    });

    it('should import a form with terminology server extension', () => {
      const sampleFile = 'terminology-server-sample.json';
      cy.uploadFile(sampleFile, true); // Avoid warning form loading based on item or form
      cy.getFormTitleField().should('have.value', 'Terminology server sample form');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
      cy.tsUrl().should('be.visible').should('have.value', 'http://example.com/r4');
      CypressUtil.assertExtensionsInQuestionnaire(
        '/item/0/extension',
        ExtensionDefs.preferredTerminologyServer.url,
        [{
          url: ExtensionDefs.preferredTerminologyServer.url,
          valueUrl: 'http://example.com/r4'
        }]
      );

      cy.tsUrl().clear();
      CypressUtil.assertExtensionsInQuestionnaire(
        '/item/0/extension',ExtensionDefs.preferredTerminologyServer.url,[]);

      cy.tsUrl().type('http://a.b');
      CypressUtil.assertExtensionsInQuestionnaire(
        '/item/0/extension',
        ExtensionDefs.preferredTerminologyServer.url,
        [{
          url: ExtensionDefs.preferredTerminologyServer.url,
          valueUrl: 'http://a.b'
        }]
      );
    });

    it('should create observation link period', () => {
      // Yes/no option
      cy.get('[id^="radio_No_observationLinkPeriod"]').as('olpNo');
      cy.get('[id^="radio_Yes_observationLinkPeriod"]').as('olpYes');
      cy.get('@olpNo').should('be.visible').should('be.checked');
      cy.get('@olpYes').should('be.visible').should('not.be.checked');
      cy.get('[for^="radio_Yes_observationLinkPeriod"]').click();
      // Code missing message.
      cy.get('lfb-observation-link-period > div > div > div > p').as('olpMsg')
        .should('contain.text', 'Linking to FHIR Observation');
      cy.get('[id^="observationLinkPeriod"]').should('not.exist');
      cy.get('@codeYes').click();
      cy.get('[id^="code.0.code"]').type('C1');
      cy.get('@olpMsg').should('not.exist');
      cy.get('[id^="observationLinkPeriod"]').as('timeWindow')
        .should('exist').should('be.visible');
      // Time window input.
      cy.get('@timeWindow').type('2');
      // Unit selection.
      cy.get('[id^="select_observationLinkPeriod"] option:selected').should('have.text', 'years');
      cy.get('[id^="select_observationLinkPeriod"]').select('months');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].code[0].code).to.equal('C1');
        expect(qJson.item[0].extension[0]).to.deep.equal({
          url: olpExtUrl,
          valueDuration: {
            value: 2,
            unit: 'months',
            system: ucumUrl,
            code: 'mo'
          }
        });
      });
    });

    it('should import item with observation link period extension', () => {
      // Display of time window when item with extension is imported.
      const sampleFile = 'olp-sample.json';
      let fixtureJson, originalExtension;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {
        fixtureJson = json;
        originalExtension = JSON.parse(JSON.stringify(json.item[0].extension));
      });
      cy.uploadFile(sampleFile, true);
      cy.getFormTitleField().should('have.value', 'Form with observation link period');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
      cy.get('@codeYesRadio').should('be.checked');
      cy.get('[id^="code.0.code"]').should('have.value', 'Code1');
      cy.get('[id^="observationLinkPeriod"]').as('timeWindow')
        .should('exist')
        .should('be.visible')
        .should('have.value', '200');
      // Unit selection.
      cy.get('[id^="select_observationLinkPeriod"] option:selected').should('have.text', 'days');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item).to.deep.equal(fixtureJson.item);
      });

      // Remove
      cy.get('@timeWindow').clear().blur();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension.length).to.equal(2); // Other than olp extension.
        const extExists = qJson.item[0].extension.some((ext) => {
          return ext.url === olpExtUrl;
        });
        expect(extExists).to.equal(false);
      });

    });

    describe('Use FHIR Observation extraction?', () => {

      it('should create observation extraction', () => {
        // Yes/no option
        cy.get('[for^="radio_No_observationExtract"]').as('oeNoLabel');
        cy.get('[for^="radio_Yes_observationExtract"]').as('oeYesLabel').click();
        // Code missing message.
        cy.get('lfb-observation-extract p').as('warningMsg')
          .should('contain.text', 'Extraction to FHIR Observations requires');
        cy.get('@oeNoLabel').click();
        cy.get('@warningMsg').should('not.exist');
        cy.get('@oeYesLabel').click();
        cy.get('@warningMsg').should('be.visible');
        cy.get('@codeYes').click();
        cy.get('[id^="code.0.code"]').type('C1');
        cy.get('@warningMsg').should('not.exist');
        cy.get('[id^="code.0.code"]').clear();
        cy.get('@warningMsg').should('be.visible');
        cy.get('[id^="code.0.code"]').type('C1');
        cy.get('@warningMsg').should('not.exist');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].code[0].code).to.equal('C1');
          expect(qJson.item[0].extension[0]).to.deep.equal({
            url: observationExtractExtUrl,
            valueBoolean: true
          });
        });

        cy.get('@oeNoLabel').click();
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].code[0].code).to.equal('C1');
          expect(qJson.item[0].extension).to.be.undefined;
        });
      });

      it('should import item with observation-extract extension', () => {
        const sampleFile = 'observation-extract.json';
        let fixtureJson, originalExtension;
        cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {
          fixtureJson = json;
          originalExtension = JSON.parse(JSON.stringify(json.item[0].extension));
        });
        cy.uploadFile(sampleFile, true);
        cy.getFormTitleField().should('have.value', 'Form with observation extract');
        cy.contains('button', 'Edit questions').click();
        cy.get('.spinner-border').should('not.exist');
        cy.get('@codeYesRadio').should('be.checked');
        cy.get('[id^="code.0.code"]').should('have.value', 'Code1');

        cy.get('[id^="radio_Yes_observationExtract"]').should('be.checked');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item).to.deep.equal(fixtureJson.item);
        });

        // Remove
        cy.get('[for^="radio_No_observationExtract"]').click();
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension.length).to.equal(2); // Other than oe extension.
          const extExists = qJson.item[0].extension.some((ext) => {
            return ext.url === observationExtractExtUrl;
          });
          expect(extExists).to.equal(false);
        });
      });
    });
  });

  describe('Item level fields: advanced - Editable Link Id', () => {
    const REQUIRED = 'Link Id is required.';
    const DUPLICATE_LINK_ID =  'Entered linkId is already used.';
    const MAX_LENGTH = 'LinkId cannot exceed 255 characters.';
    const PATTERN = 'Spaces are not allowed at the beginning or end, and only a single space is allowed between words.';

    beforeEach(() => {
      const sampleFile = 'USSG-family-portrait.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.get('button').contains('Continue').click();
      cy.uploadFile(sampleFile, false);
      cy.getFormTitleField().should('have.value', 'US Surgeon General family health portrait');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');

      cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible'); // Proof of advanced panel expansion
    });

    afterEach(() => {
      cy.collapseAdvancedFields();
    });

    it('should update the link id', () => {
      // 300 characters long
      const longLinkId = "/sQbMAgt9SavZxxL63WIFBju6Hdwjp3JHyFzXnBKVdLEtCJ71u6TNMhXt" +
                          "znjw9HV9b7N6kY33bLiZMEy7nSCJupWu3MIzFg2PfT4JEEa5VFXk3KgaZ" +
                          "ypvFH8EGDlxe9bpLoZqbXgxBCQ0iFmG6FKyA1FiuMMtZYoaXHPpJ0M6kZ" +
                          "bjBbTbmOSrtufcLu1SrN0MN0h30lxak1yNfCjqqlsxdGescju0nu0nJvg" +
                          "6K1Vd5rhBGavjkrBnbDXLrOglYT0gf1HaIBbGGM4C9kO8dTxqBOqg1KHn" +
                          "ctpWOL3vc0PIiXB";
      const linkIdSizeLimit = 255;

      cy.editableLinkId()
        .should('be.visible')
        .should('have.value', '/54126-8');

      cy.editableLinkId()
        .clear()
        .type(longLinkId);

      // Because of size limit, the linkId was truncated
      // to 255 characters
      cy.editableLinkId()
        .invoke('val')
        .should('not.equal', longLinkId)
        .its('length')
        .should('eq', linkIdSizeLimit);

      cy.editableLinkId()
        .invoke('val')
        .should('equal', longLinkId.substring(0, linkIdSizeLimit));
    });

    it('should validate the linkId pattern', () => {
      const invalidPatternError = `Spaces are not allowed at the beginning or end, and only a single space is allowed between words.`;

      // Click on 2 Family member health history
      cy.toggleTreeNodeExpansion('Family member health history');

      // Click on the '2.2 Name'
      cy.getTreeNode('Name').click();

      // Go to the link id section
      cy.editableLinkId().as('linkId');

      cy.get('@linkId')
        .scrollIntoView()
        .should('be.visible')
        .should('have.value', '/54114-4/54138-3');

      // There should not be an error
      cy.checkLinkIdErrorIsNotDisplayed();

      // Enter '/test' as linkId
      cy.get('@linkId')
        .clear()
        .type('/test');

      // There should not be an error
      cy.checkLinkIdErrorIsNotDisplayed();

      // Enter ' /test' as linkId (with leading space)
      cy.get('@linkId')
        .clear()
        .type(' /test');

      // Should contain PATTER error
      cy.checkLinkIdErrorIsDisplayed(PATTERN);

      // Enter '/test ' as linkId (with trailing space)
      cy.get('@linkId')
        .clear()
        .type('/test ');

      // Should contain PATTER error
      cy.checkLinkIdErrorIsDisplayed(PATTERN);

      // Enter ' /test ' as linkId (with leading and trailing spaces)
      cy.get('@linkId')
        .clear()
        .type(' /test ');

      // Should contain PATTER error
      cy.checkLinkIdErrorIsDisplayed(PATTERN);

      // Enter '/te st' as linkId (single space between words)
      cy.get('@linkId')
        .clear()
        .type('/test abc');

      // There should not be an error
      cy.checkLinkIdErrorIsNotDisplayed();

      // Enter '/test  abc' as linkId (two spaces between words)
      cy.get('@linkId')
        .clear()
        .type('/test  abc');

      // Should contain PATTER error
      cy.checkLinkIdErrorIsDisplayed(PATTERN);
    });

    it('should required linkId', () => {
      // Click on 2 Family member health history
      cy.toggleTreeNodeExpansion('Family member health history');

      // Click on the '2.4 Living?'
      cy.toggleTreeNodeExpansion('Living?');

      // Now go to the grandchild node
      cy.getTreeNode('Current Age').click();

      // Go to the link id section and enter the duplicate link id
      cy.editableLinkId()
        .scrollIntoView()
        .should('be.visible')
        .should('have.value', '/54114-4/54139-1/54141-7');
      cy.editableLinkId()
        .clear()
        .type('{backspace}');

      cy.checkLinkIdErrorIsDisplayed(REQUIRED);

      cy.getTreeNode('Current Age')
        .find('fa-icon#error')
        .should('exist');
      cy.getTreeNode('Living?')
        .find('fa-icon#error')
        .should('exist');
      cy.getTreeNode('Family member health history')
        .find('fa-icon#error')
        .should('exist');
    });

    it('should detect duplicate link id and display error', () => {
      // Click on 2 Family member health history
      cy.toggleTreeNodeExpansion('Family member health history');

      // Click on the '2.4 Living?'
      cy.toggleTreeNodeExpansion('Living?');
      cy.getTreeNode('Living?').click();

      // Go to the link id section and enter the duplicate link id
      cy.editableLinkId()
        .scrollIntoView()
        .should('be.visible')
        .should('have.value', '/54114-4/54139-1');

      cy.editableLinkId()
        .clear()
        .type('/54114-4');

      cy.checkLinkIdErrorIsDisplayed(DUPLICATE_LINK_ID);

      // The node 'Living?' should display a red triangle icon (error)
      cy.getTreeNode('Living?')
        .find('fa-icon#error')
        .should('exist');
      // In addition, the parent node should also display the red triangle icon as well.
      cy.getTreeNode('Family member health history')
        .find('fa-icon#error')
        .should('exist');

      // Now go to the grandchild node
      cy.getTreeNode('Current Age').click();

      // The 'Conditional display' field needs to be filled in to prevent an error.
      // (ENABLEWHEN_ANSWER_REQUIRED)
      cy.get('[id^="enableWhen.0.question"]').type('{downarrow}{enter}');
      cy.get('[id^="enableWhen.0.operator"]').select('Not empty');

      // Go to the link id section and enter the duplicate link id
      cy.editableLinkId()
        .scrollIntoView()
        .should('be.visible')
        .should('have.value', '/54114-4/54139-1/54141-7');
      cy.editableLinkId()
        .clear()
        .type('/54114-4');

      cy.checkLinkIdErrorIsDisplayed(DUPLICATE_LINK_ID);

      cy.getTreeNode('Current Age')
        .find('fa-icon#error')
        .should('exist');

      // Fix the duplicate link id for the child node.
      cy.getTreeNode('Living?').click();
      cy.editableLinkId()
        .scrollIntoView()
        .clear()
        .type('/54114-4/54139-1');

      // The red triangle icons on the tree panel for the child and parent nodes
      // should remained since there is still error at the grandchild node.
      cy.getTreeNode('Living?')
        .find('fa-icon#error')
        .should('exist');
      cy.getTreeNode('Living?')
        .find('fa-icon#error')
        .should('exist');
      cy.getTreeNode('Family member health history')
        .find('fa-icon#error')
        .should('exist');

      // Fix the duplicate link id for the grandchild node.
      cy.getTreeNode('Current Age').click();
      cy.editableLinkId()
        .scrollIntoView()
        .clear()
        .type('/54114-4/54139-1/54141-7');

      // Error messages on the content panel should go away
      cy.checkLinkIdErrorIsNotDisplayed();

      // The red triangle icons on the tree panel for the grandchild, child
      // and parent nodes should now be hidden.
      cy.getTreeNode('Current Age')
        .find('fa-icon#error')
        .should('not.exist');
      cy.getTreeNode('Living?')
        .find('fa-icon#error')
        .should('not.exist');
      cy.getTreeNode('Family member health history')
        .find('fa-icon#error')
        .should('not.exist');
    });

    it('should check siblings for error before clearing out errors from ancestor', () => {
      // Click on 2 Family member health history
      cy.toggleTreeNodeExpansion('Family member health history');

      // Expand the '2.4 Living?'
      cy.toggleTreeNodeExpansion('Living?');

      // Go to the grandchild node '2.4.2 Current Age'
      cy.getTreeNode('Current Age').click();

      // Go to the link id section and enter the duplicate link id
      cy.editableLinkId()
        .scrollIntoView()
        .should('be.visible')
        .should('have.value', '/54114-4/54139-1/54141-7');
      cy.editableLinkId()
        .clear()
        .type('/54114-4/54139-1');

      cy.checkLinkIdErrorIsDisplayed(DUPLICATE_LINK_ID);

      // On the Tree panel, the error icon should display on the parent, child, and grandchild
      cy.getTreeNode('Current Age')
        .find('fa-icon#error')
        .should('exist');
      cy.getTreeNode('Living?')
        .find('fa-icon#error')
        .should('exist');
      cy.getTreeNode('Family member health history')
        .find('fa-icon#error')
        .should('exist');

      // Go to the sibling node '2.4.1 Date of Birth' and enter the duplicate link id
      cy.getTreeNode('Date of Birth').click();

      cy.editableLinkId()
        .scrollIntoView()
        .should('be.visible')
        .should('have.value', '/54114-4/54139-1/54124-3');
      cy.editableLinkId()
        .clear()
        .type('/54114-4/54139-1');

      cy.checkLinkIdErrorIsDisplayed(DUPLICATE_LINK_ID);

      // Fix the duplicate link id for the node '2.4.2 Current Age'.
      cy.getTreeNode('Current Age').click();
      cy.editableLinkId()
        .scrollIntoView()
        .clear()
        .type('/54114-4/54139-1/54141-7');

      // Error messages on the content panel should go away
      cy.checkLinkIdErrorIsNotDisplayed();

      // The red triangle icons on the tree panel for the node '2.4.2 Current Age' should be hidden.
      cy.getTreeNode('Current Age')
        .find('fa-icon#error')
        .should('not.exist');

      // However, the parent node '2.4 Living?' and grandparent node '2 Family member health history'
      // should still showing error icon because there is still an error with the node
      // '2.4.3 Cause of Death'
      cy.getTreeNode('Living?')
        .find('fa-icon#error')
        .should('exist');
      cy.getTreeNode('Family member health history')
        .find('fa-icon#error')
        .should('exist');

      // Fix the duplicate link id for the node '2.4.1 Date of Birth'.
      cy.getTreeNode('Date of Birth').click();
      cy.editableLinkId()
        .scrollIntoView()
        .type('/54124-3');

      // Error messages on the content panel should go away
      cy.checkLinkIdErrorIsNotDisplayed();

      // The red triangle icons on the tree panel for the grandchild, child
      // and parent nodes should now be hidden.
      cy.getTreeNode('Date of Birth')
        .find('fa-icon#error')
        .should('not.exist');
      cy.getTreeNode('Living?')
        .find('fa-icon#error')
        .should('not.exist');
      cy.getTreeNode('Family member health history')
        .find('fa-icon#error')
        .should('not.exist');
    });

    it('should allow the linkId to be set to empty and remain empty upon gaining focus', () => {
      // Click on '2 Family member health history'
      cy.getTreeNode('Family member health history').click();

      // Click the 'Add new item'
      cy.contains('button', 'Add new item').click();
      // Click on the new added item
      cy.getTreeNode('New item 1').click();

      // Go to the link id section and enter 1
      cy.editableLinkId()
        .scrollIntoView()
        .should('be.visible')
        .clear()
        .type('1');

      // Click the 'Add new item'
      cy.contains('button', 'Add new item').click();

      // Click back to 'New item 1'
      cy.getTreeNode('New item 1').click();

      // The linkId should be 1
      cy.editableLinkId()
        .scrollIntoView()
        .should('have.value', '1');

      // Clear the value
      cy.editableLinkId()
        .clear();

      // Click back to 'New item 2'
      cy.getTreeNode('New item 2').click();

      // Click back to 'New item 1'
      cy.getTreeNode('New item 1').click();

      // The linkId should remain empty. It should not get populate with the default linkId.
      cy.editableLinkId()
        .scrollIntoView()
        .should('have.value', '');
    });


    /*
     * Verifies that when a new item is created after a focused item that has expanded children, the new item's
     * linkId is properly populated. This ensures that the fix correctly assigns a linkId even when the previous
     * node is expanded and has children.
     */
    it('should populate linkId when creating a new item after a focused item with expanded children', () => {
      // Click on '2 Family member health history'
      cy.getTreeNode('Family member health history').click();

      cy.toggleTreeNodeExpansion('Family member health history');

      // Click the 'Add new item'
      cy.contains('button', 'Add new item').click();
      // Click on the new added item
      cy.getTreeNode('New item 1').click();

      // Go to the link id section
      cy.editableLinkId()
        .scrollIntoView()
        .should('be.visible')
        .invoke('val')
        .should('not.be.empty');
    });

  });

  describe('Item level fields: advanced - Condition expression', () => {
    let fixtureJson;
    beforeEach(() => {
      const sampleFile = 'enable-when-expression-sample.json';
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, false);
      cy.getFormTitleField().should('have.value', 'enableWhen expression');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');
    });

    afterEach(() => {
      cy.collapseAdvancedFields();
    });

    it('should display enableWhen condition', () => {
      cy.clickTreeNode('enableWhen condition');
      cy.expandAdvancedFields();

      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'enablewhen-cond').should('be.checked');
      cy.get('[id^="enableWhen.0.question"]').should('have.value', '1 - Item 0');
      cy.get('[id^="enableWhen.0.operator"]')
        .find('option:selected').should('have.text', '>');
      cy.get('[id^="enableWhen.0.answerInteger"]').should('have.value', '5');
      cy.get('[id^="enableWhen.1.question"]').should('have.value', '2 - Item 1');
      cy.get('[id^="enableWhen.1.operator"]')
        .find('option:selected').should('have.text', '>');
      cy.get('[id^="enableWhen.1.answerInteger"]').should('have.value', '5');

      cy.get('input#enableBehavior\\.all').should('be.checked');
      cy.get('input#disabledDisplay\\.hidden').should('be.checked');
    });

    it('should display enableWhen expression', () => {
      cy.clickTreeNode('enableWhen expression');
      cy.expandAdvancedFields();

      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'enablewhen-expression').should('be.checked');
      cy.get('[id^="__\\$enableWhenExpression"]').should('exist').should('have.value', '%a > 5 and %b > 5');
    });

    it('should display enableWhen and initial expressions', () => {
      cy.clickTreeNode('enableWhen and initial expressions');
      cy.expandAdvancedFields();

      cy.contains('div', 'Value method').as('valueMethod').should('be.visible');
      cy.get('@valueMethod').find('[id^="__$valueMethod_compute-initial"]').as('computeInitialRadio');
      cy.get('@computeInitialRadio').should('be.visible').and('be.checked');
      cy.get('[id^="__\\$initialExpression"]').should('have.value', "%a + %b");

      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'enablewhen-expression').should('be.checked');
      cy.get('[id^="__\\$enableWhenExpression"]').should('exist').should('have.value', '%a < 5 and %b < 5');
    });

    it('should display enableWhen and calculated expressions', () => {
      cy.clickTreeNode('enableWhen and calculated expressions');
      cy.expandAdvancedFields();

      cy.contains('div', 'Value method').as('valueMethod').should('be.visible');
      cy.get('@valueMethod').find('[id^="__$valueMethod_compute-continuously"]').as('computeContinuously');
      cy.get('@computeContinuously').should('be.visible').and('be.checked');
      cy.get('[id^="__\\$calculatedExpression"]').should('have.value', "%a * %b");

      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'enablewhen-expression').should('be.checked');
      cy.get('[id^="__\\$enableWhenExpression"]').should('exist').should('have.value', '%a < 5 and %b < 5');
    });

    it('should display enableWhen and answer expressions', () => {
      cy.clickTreeNode('enableWhen and answer expressions');
      cy.expandAdvancedFields();

      cy.getRadioButton('Create answer list', 'Yes').should('be.checked');
      cy.get('[id^="__\\$answerOptionMethods_answer-expression"]').should('be.checked');
      cy.get('[id^="__\\$answerExpression"]').should('have.value', "1");

      cy.getLabelRadioInputByValue('lfb-enable-when-method', 'enablewhen-expression').should('be.checked');
      cy.get('[id^="__\\$enableWhenExpression"]').should('exist').should('have.value', '%a < 5 and %b < 5');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[6].extension).to.deep.equal(fixtureJson.item[6].extension);
      });
    });

    it('should show/hide questions based on enableWhen condition and expression', () => {
      cy.expandAdvancedFields();

      // Assertions in preview.
      cy.contains('button', 'Preview').click();
      cy.get('lhc-item').as('lhc-item');

      // There should be 5 items
      cy.get('div.lhc-form-body > lhc-item').should('have.length', 5);

      // The first lhc-item
      cy.get('@lhc-item').first().within(() => {
        // Check for element label
        cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
          .should('have.text', 'Item 0');
        // Check for element value
        cy.get('.lhc-de-input-unit').within(() => {
          cy.get('lhc-item-simple-type > lhc-input > input')
            .should('have.value', '2');
        });
      });

      // The 2nd lhc-item
      cy.get('@lhc-item').eq(1).within(() => {
        // Check for element label
        cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
          .should('have.text', 'Item 1');
        // Check for element value
        cy.get('.lhc-de-input-unit').within(() => {
          cy.get('lhc-item-simple-type > lhc-input > input')
            .should('have.value', '3');
        });
      });

      // The 3rd lhc-item
      cy.get('@lhc-item').eq(2).within(() => {
        // Check for element label
        cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
          .should('have.text', 'enableWhen and initial expressions');
        // Check for element value
        cy.get('.lhc-de-input-unit').within(() => {
          cy.get('lhc-item-simple-type > lhc-input > input')
            .should('have.value', '5');
        });
      });

      // The 4th lhc-item
      cy.get('@lhc-item').eq(3).within(() => {
        // Check for element label
        cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
          .should('have.text', 'enableWhen and calculated expressions');
        // Check for element value
        cy.get('.lhc-de-input-unit').within(() => {
          cy.get('lhc-item-simple-type > lhc-input > input')
            .should('have.value', '6');
        });
      });

      // The 5th lhc-item
      cy.get('@lhc-item').eq(4).within(() => {
        // Check for element label
        cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
          .should('have.text', 'enableWhen and answer expressions');
        // Check for element value
        cy.get('.lhc-de-input-unit').within(() => {
          cy.get('lhc-item-choice-autocomplete lhc-autocomplete input')
            .should('have.value', '');
        });
      });

      // Change the value of the first lhc-item
      cy.get('@lhc-item').first().within(() => {
        cy.get('.lhc-de-input-unit').within(() => {
          cy.get('lhc-item-simple-type > lhc-input > input')
            .clear()
            .type('6');
        });
      });

      // Only 2 items are displayed b/c of the enableWhen expression
      cy.get('div.lhc-form-body > lhc-item').should('have.length', 2);

      // Change the value of the second lhc-item
      cy.get('@lhc-item').eq(1).within(() => {
        cy.get('.lhc-de-input-unit').within(() => {
          cy.get('lhc-item-simple-type > lhc-input > input')
            .clear()
            .type('6');
        });
      });

      // 4 items are displayed b/c of the enableWhen condition and expression
      cy.get('div.lhc-form-body > lhc-item').should('have.length', 4);

      // The 3rd lhc-item
      cy.get('@lhc-item').eq(2).within(() => {
        // Check for element label
        cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
          .should('have.text', 'enableWhen condition');
      });

      // The 4th lhc-item
      cy.get('@lhc-item').eq(3).within(() => {
        // Check for element label
        cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
          .should('have.text', 'enableWhen expression');
      });

      cy.contains('mat-dialog-actions button', 'Close').click();
    });

  });
});