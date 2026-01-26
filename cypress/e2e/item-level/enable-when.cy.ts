/// <reference types="cypress" />

const snomedEclText = '< 429019009 |Finding related to biological sex|';

describe('Home page', () => {
  beforeEach(() => {
    cy.loadHomePage();
  });

  describe('Item level fields: advanced', () => {
    beforeEach(() => {
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.get('button').contains('Continue').click();
      cy.contains('button', 'Create questions').click();

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
      cy.get('[id^="enableWhen.0.answerCoding"]').type('d1 (c1)').type('{downarrow}{enter}');

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
      cy.readFile('cypress/fixtures/' + sampleFile).should((json) => { fixtureJson = json });
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

      const answer4El = '[id^="enableWhen.3.answer"]';
      cy.get(errorIcon4El)
        .find('small')
        .should('contain.text', ' Answer field is required when you choose an operator other than \'Not empty\' or \'Empty\' for enableWhen condition 4. ');

      // Although four enableWhen conditions are displayed on the screen, three contain errors. The JSON should inlcude only the valid condition.
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[5].enableWhen.length).to.equal(1);
        expect(qJson.item[5].enableWhen[0].question).to.equal('/itm4');
        expect(qJson.item[5].enableWhen[0].operator).to.equal('=');
        expect(qJson.item[5].enableWhen[0].answerInteger).to.equal(5);
      });

      // Clear the answer field to invalidate the enableWhen condition.
      cy.get(answer1El).click().clear();
      cy.get(errorIcon1El).should('exist');
      cy.get(errorIcon1El)
        .find('small')
        .should('contain.text', ' Answer field is required when you choose an operator other than \'Not empty\' or \'Empty\' for enableWhen condition 1. ');

      // As there are no valid enableWhen conditions, enableWhen is omitted from the JSON data.
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[5].enableWhen).to.be.undefined
      });

      // Fix the 1st and the 4th conditions.
      cy.get(answer1El).click().type('5');
      cy.get(answer4El).click().type('15');
      cy.get(errorIcon1El).should('not.exist');
      cy.get(errorIcon4El).should('not.exist');

      // The JSON data should contains two enableWhen conditions.
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[5].enableWhen.length).to.equal(2);
        expect(qJson.item[5].enableWhen[0].question).to.equal('/itm4');
        expect(qJson.item[5].enableWhen[0].operator).to.equal('=');
        expect(qJson.item[5].enableWhen[0].answerInteger).to.equal(5);

        expect(qJson.item[5].enableWhen[1].question).to.equal('/itm4');
        expect(qJson.item[5].enableWhen[1].operator).to.equal('=');
        expect(qJson.item[5].enableWhen[1].answerInteger).to.equal(15);
      });
    });

    it('should clear invalid question field on focusout for new enableWhen condition', () => {
      const sampleFile = 'items-validation-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/' + sampleFile).should((json) => { fixtureJson = json });
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
      cy.get('[id^="enableWhen.1.question"]').trigger('keyup', { key: 'Tab' });

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
      cy.readFile('cypress/fixtures/' + sampleFile).should((json) => { fixtureJson = json });
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
      cy.get('[id^="enableWhen.2.answerCoding"]').type('Street clothes, no shoes (LA11872-1)').type('{downarrow}{enter}');
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
      cy.selectDataType('coding');
      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
      cy.enterAnswerOptions([
        { display: 'display 1', code: 'c1', system: 's1', __$score: 1 },
        { display: 'display 2', code: 'c2', system: 's2', __$score: 2 }
      ]);
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().should('have.value', 'New item 1');
      cy.enterAnswerOptions([
        { display: 'display 1', code: 'c1', system: 's1', __$score: 1 },
        { display: 'display 2', code: 'c2', system: 's2', __$score: 2 },
        { display: 'display 3', code: 'c3', system: 's3', __$score: 3 }
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
      cy.get('[id^="enableWhen.1.answerCoding"]').as('r2Answer').type('display 3 (c3)').type('{downarrow}{enter}');

      cy.get('[id^="enableWhen.0.answerCoding"]').should('not.exist');

      cy.get('@r2Operator').select('Empty');
      cy.get('@r2Answer').should('not.exist');
      cy.get('@r1Operator').select('=');
      cy.get('[id^="enableWhen.0.answerCoding"]').as('r1Answer').should('be.visible');
      cy.get('@r1Answer').type('display 1 (c1)').type('{downarrow}{enter}');
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
      cy.get(r2Answer).should('have.value', '2');

      cy.get(r2Operator).select('Empty');
      cy.get(r1Answer).should('have.value', '1');
      cy.get(r2Answer).should('not.exist');
    });

    it('should work with operator exists value in conditional display', () => {
      cy.enterAnswerOptions([
        { display: 'display 1', code: 'c1', system: 's1', __$score: 1 },
        { display: 'display 2', code: 'c2', system: 's2', __$score: 2 }
      ]);
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().should('have.value', 'New item 1');
      cy.enterAnswerOptions([
        { display: 'display 1', code: 'c1', system: 's1', __$score: 1 },
        { display: 'display 2', code: 'c2', system: 's2', __$score: 2 },
        { display: 'display 3', code: 'c3', system: 's3', __$score: 3 }
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
      cy.readFile('cypress/fixtures/' + sampleFile).should((json) => { fixtureJson = json });
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
        .find('option:selected').should('have.text', '=');
      cy.get('[id^="enableWhen.0.answerCoding"]')
        .should('have.value', 'Yes (LA33-6)');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].item[0].enableWhen)
          .to.deep.equal(fixtureJson.item[0].item[0].item[0].enableWhen);
      });
    });
  });


  describe('enableWhen answer pointing to answerOptions validation', () => {
    // The R4 Questionnaire does not include answerConstraint, but its behavior is equivalent to 'optionsOnly'.
    // Except for the type 'open-choice' which will behave like 'optionOrString'
    it('should display a validation error if the answer does not match any of the answerOptions for R4 questionnaire', () => {
      const sampleFile = 'enable-when-answer-options-R4-sample.json';
      cy.uploadFile(sampleFile);
      cy.getFormTitleField().should('have.value', 'R4 enableWhen AnswerOptions');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');

      // -------- INTEGER ANSWER OPTIONS --------
      // integer answerOptions
      cy.getItemTypeField().should('contain.value', 'integer');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerOption[0].valueInteger).equal(1);
        expect(q.item[0].answerOption[1].valueInteger).equal(2);
        expect(q.item[0].answerOption[2].valueInteger).equal(3);
      });

      // enableWhen referencing integer answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen integer on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible');
      // Should have answer value = 2 which exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerInteger"]').should('have.value', 2);

      // enableWhen referencing integer answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen integer off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = 4 which does not exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerInteger"]').should('have.value', 4);
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('integer answerOptions', '779085650305'));

      // -------- DATE ANSWER OPTIONS --------
      // date answerOptions
      cy.getTreeNode('date answerOptions').click();
      cy.getItemTypeField().should('contain.value', 'date');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[3].answerOption[0].valueDate).equal("2025-11-03");
        expect(q.item[3].answerOption[1].valueDate).equal("2025-11-04");
        expect(q.item[3].answerOption[2].valueDate).equal("2025-11-05");
      });

      // enableWhen referencing date answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen date on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      //cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible');
      // Should have answer value = "2025-11-04" which exists in the answerOptions
      cy.get('[id^="enableWhen.0.answerDate"]').should('have.value', "2025-11-04");

      // enableWhen referencing date answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen date off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = "2025-11-20" which does not exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerDate"]').should('have.value', "2025-11-20");
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('date answerOptions', '759608001746'));

      // -------- TIME ANSWER OPTIONS --------
      // time answerOptions
      cy.getTreeNode('time answerOptions').click();
      cy.getItemTypeField().should('contain.value', 'time');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[6].answerOption[0].valueTime).equal("16:00:00");
        expect(q.item[6].answerOption[1].valueTime).equal("17:00:00");
        expect(q.item[6].answerOption[2].valueTime).equal("18:00:00");
      });

      // enableWhen referencing time answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen time on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      //cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible');
      // Should have answer value = "17:00:00" which exists in the answerOptions
      cy.get('[id^="enableWhen.0.answerTime"]').should('have.value', "17:00:00");

      // enableWhen referencing time answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen time off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = "08:00:00" which does not exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerTime"]').should('have.value', "08:00:00");
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('time answerOptions', '657367236699'));

      // -------- STRING ANSWER OPTIONS --------
      // string answerOptions
      cy.getTreeNode('string answerOptions').click();
      cy.getItemTypeField().should('contain.value', 'string');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[9].answerOption[0].valueString).equal("A");
        expect(q.item[9].answerOption[1].valueString).equal("B");
        expect(q.item[9].answerOption[2].valueString).equal("C");
      });

      // enableWhen referencing string answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen string on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      //cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible');
      // Should have answer value = "B" which exists in the answerOptions
      cy.get('[id^="enableWhen.0.answerString"]').should('have.value', "B");

      // enableWhen referencing string answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen string off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = "Z" which does not exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerString"]').should('have.value', "Z");
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('string answerOptions', '820906264719'));

      // -------- TEXT ANSWER OPTIONS --------
      // text answerOptions
      cy.getTreeNode('text answerOptions').click();
      cy.getItemTypeField().should('contain.value', 'text');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[12].answerOption[0].valueString).equal("AAAAAAAA");
        expect(q.item[12].answerOption[1].valueString).equal("BBBBBBBBB");
        expect(q.item[12].answerOption[2].valueString).equal("CCCCCCCCC");
      });

      // enableWhen referencing text answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen text on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = "BBBBBBBBB" which exists in the answerOptions
      cy.get('[id^="enableWhen.0.answerString"]').should('have.value', "BBBBBBBBB");

      // enableWhen referencing text answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen text off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = "ZZZZZZZZZ" which does not exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerString"]').should('have.value', "ZZZZZZZZZ");
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('text answerOptions', '174788656639'));

      // -------- CODING ANSWER OPTIONS - CHOICE --------
      // text answerOptions
      cy.getTreeNode('coding answerOptions restricted').click();
      cy.getItemTypeField().should('contain.value', 'coding');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.get('[id^="labelRadio_"][id$="_optionsOnly"]').should('not.be.checked');
      cy.get('[id^="labelRadio_"][id$="_optionsOrType"]').should('not.be.checked');
      cy.get('[id^="labelRadio_"][id$="_optionsOrString"]').should('not.be.checked');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[15].answerOption[0].valueCoding.system).equal('a');
        expect(qJson.item[15].answerOption[0].valueCoding.code).equal('a1');
        expect(qJson.item[15].answerOption[0].valueCoding.display).equal('a1');

        expect(qJson.item[15].answerOption[1].valueCoding.system).equal('b');
        expect(qJson.item[15].answerOption[1].valueCoding.code).equal('b1');
        expect(qJson.item[15].answerOption[1].valueCoding.display).equal('b1');

        expect(qJson.item[15].answerOption[2].valueCoding.system).equal('c');
        expect(qJson.item[15].answerOption[2].valueCoding.code).equal('c1');
        expect(qJson.item[15].answerOption[2].valueCoding.display).equal('c1');
      });

      // enableWhen referencing coding answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen coding on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.tsUrl().should('be.visible');
      cy.questionnaireJSON().should((qJson) => {
        // Verify enableWhen construct.
        expect(qJson.item[16].enableWhen[0].answerCoding.display).equal(qJson.item[15].answerOption[1].valueCoding.display);
        expect(qJson.item[16].enableWhen[0].answerCoding.code).equal(qJson.item[15].answerOption[1].valueCoding.code);
        expect(qJson.item[16].enableWhen[0].answerCoding.system).equal(qJson.item[15].answerOption[1].valueCoding.system);
      });

      // enableWhen referencing coding answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen coding off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[17].enableWhen[0].answerCoding.display).not.equal(qJson.item[15].answerOption[1].valueCoding.display);
        expect(qJson.item[17].enableWhen[0].answerCoding.code).not.equal(qJson.item[15].answerOption[1].valueCoding.code);
        expect(qJson.item[17].enableWhen[0].answerCoding.system).not.equal(qJson.item[15].answerOption[1].valueCoding.system);
      });
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('coding answerOptions restricted', '264603036166'));

      // -------- CODING ANSWER OPTIONS - OPEN-CHOICE --------
      // open-choice behaves like 'optionsOrString'
      // text answerOptions
      cy.getTreeNode('coding answerOptions optionsOrString').click();
      cy.getItemTypeField().should('contain.value', 'coding');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');

      cy.get('[id^="labelRadio_"][id$="_optionsOnly"]').should('not.be.checked');
      cy.get('[id^="labelRadio_"][id$="_optionsOrType"]').should('not.be.checked');
      cy.get('[id^="labelRadio_"][id$="_optionsOrString"]').should('be.checked');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[15].answerOption[0].valueCoding.system).equal('a');
        expect(qJson.item[15].answerOption[0].valueCoding.code).equal('a1');
        expect(qJson.item[15].answerOption[0].valueCoding.display).equal('a1');

        expect(qJson.item[15].answerOption[1].valueCoding.system).equal('b');
        expect(qJson.item[15].answerOption[1].valueCoding.code).equal('b1');
        expect(qJson.item[15].answerOption[1].valueCoding.display).equal('b1');

        expect(qJson.item[15].answerOption[2].valueCoding.system).equal('c');
        expect(qJson.item[15].answerOption[2].valueCoding.code).equal('c1');
        expect(qJson.item[15].answerOption[2].valueCoding.display).equal('c1');
      });

      // enableWhen referencing coding answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen coding on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.tsUrl().should('be.visible');
      cy.questionnaireJSON().should((qJson) => {
        // Verify enableWhen construct.
        expect(qJson.item[19].enableWhen[0].answerCoding.display).equal(qJson.item[18].answerOption[1].valueCoding.display);
        expect(qJson.item[19].enableWhen[0].answerCoding.code).equal(qJson.item[18].answerOption[1].valueCoding.code);
        expect(qJson.item[19].enableWhen[0].answerCoding.system).equal(qJson.item[18].answerOption[1].valueCoding.system);
      });

      // enableWhen referencing coding answerOptions
      // B/c the answer value does not match any of the answerOptions and it is not answerString either,
      // there should still be error.
      cy.getTreeNode('enableWhen coding off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[20].enableWhen[0].answerCoding.display).not.equal(qJson.item[18].answerOption[1].valueCoding.display);
        expect(qJson.item[20].enableWhen[0].answerCoding.code).not.equal(qJson.item[18].answerOption[1].valueCoding.code);
        expect(qJson.item[20].enableWhen[0].answerCoding.system).not.equal(qJson.item[18].answerOption[1].valueCoding.system);
      });
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('coding answerOptions restricted', '264603036166'));
    });



    // R5 Questionnaire without answerConstraint is default to 'optionsOnly'.
    // So the behavior should be similar to R4.
    it('should display a validation error if the answer does not match any of the answerOptions for R5 questionnaire', () => {
      const sampleFile = 'enable-when-answer-options-R5-sample.json';
      cy.uploadFile(sampleFile);
      cy.getFormTitleField().should('have.value', 'R5 enableWhen AnswerOptions optionsOnly');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');

      // -------- INTEGER ANSWER OPTIONS --------
      // integer answerOptions
      cy.getItemTypeField().should('contain.value', 'integer');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerOption[0].valueInteger).equal(1);
        expect(q.item[0].answerOption[1].valueInteger).equal(2);
        expect(q.item[0].answerOption[2].valueInteger).equal(3);
      });

      // enableWhen referencing integer answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen integer on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible');
      // Should have answer value = 2 which exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerInteger"]').should('have.value', 2);

      // enableWhen referencing integer answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen integer off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = 4 which does not exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerInteger"]').should('have.value', 4);
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('integer answerOptions', '779085650305'));

      // Switch the answerConstraint to 'optionsOrType'
      cy.getTreeNode('integer answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow off list').click();

      // The error on the 'enableWhen integer off-list' is gone because an answer is now treated as valid
      // as long as its value matches the expected type.
      cy.getTreeNode('enableWhen integer off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // Switch the answerConstraint to 'optionsOrString'
      cy.getTreeNode('integer answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow free text').click();

      // The error should not reappeared because the answer value is valid.
      cy.getTreeNode('enableWhen integer off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // -------- DATE ANSWER OPTIONS --------
      // date answerOptions
      cy.getTreeNode('date answerOptions').click();
      cy.getItemTypeField().should('contain.value', 'date');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[3].answerOption[0].valueDate).equal("2025-11-03");
        expect(q.item[3].answerOption[1].valueDate).equal("2025-11-04");
        expect(q.item[3].answerOption[2].valueDate).equal("2025-11-05");
      });

      // enableWhen referencing date answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen date on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      //cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible');
      // Should have answer value = "2025-11-04" which exists in the answerOptions
      cy.get('[id^="enableWhen.0.answerDate"]').should('have.value', "2025-11-04");

      // enableWhen referencing date answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen date off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = "2025-11-20" which does not exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerDate"]').should('have.value', "2025-11-20");
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('date answerOptions', '759608001746'));

      // Switch the answerConstraint to 'optionsOrType'
      cy.getTreeNode('date answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow off list').click();

      // The error on the 'enableWhen date off-list' is gone because an answer is now treated as valid
      // as long as its value matches the expected type.
      cy.getTreeNode('enableWhen date off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // Switch the answerConstraint to 'optionsOrString'
      cy.getTreeNode('date answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow free text').click();

      // The error should not reappeared because the answer value is valid.
      cy.getTreeNode('enableWhen date off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // -------- TIME ANSWER OPTIONS --------
      // time answerOptions
      cy.getTreeNode('time answerOptions').click();
      cy.getItemTypeField().should('contain.value', 'time');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[6].answerOption[0].valueTime).equal("16:00:00");
        expect(q.item[6].answerOption[1].valueTime).equal("17:00:00");
        expect(q.item[6].answerOption[2].valueTime).equal("18:00:00");
      });

      // enableWhen referencing time answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen time on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      //cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible');
      // Should have answer value = "17:00:00" which exists in the answerOptions
      cy.get('[id^="enableWhen.0.answerTime"]').should('have.value', "17:00:00");

      // enableWhen referencing time answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen time off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = "08:00:00" which does not exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerTime"]').should('have.value', "08:00:00");
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('time answerOptions', '657367236699'));

      // Switch the answerConstraint to 'optionsOrType'
      cy.getTreeNode('time answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow off list').click();

      // The error on the 'enableWhen time off-list' is gone because an answer is now treated as valid
      // as long as its value matches the expected type.
      cy.getTreeNode('enableWhen time off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // Switch the answerConstraint to 'optionsOrString'
      cy.getTreeNode('time answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow free text').click();

      // The error should not reappeared because the answer value is valid.
      cy.getTreeNode('enableWhen time off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // -------- STRING ANSWER OPTIONS --------
      // string answerOptions
      cy.getTreeNode('string answerOptions').click();
      cy.getItemTypeField().should('contain.value', 'string');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[9].answerOption[0].valueString).equal("A");
        expect(q.item[9].answerOption[1].valueString).equal("B");
        expect(q.item[9].answerOption[2].valueString).equal("C");
      });

      // enableWhen referencing string answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen string on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      //cy.expandAdvancedFields();
      cy.tsUrl().should('be.visible');
      // Should have answer value = "B" which exists in the answerOptions
      cy.get('[id^="enableWhen.0.answerString"]').should('have.value', "B");

      // enableWhen referencing string answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen string off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = "Z" which does not exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerString"]').should('have.value', "Z");
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('string answerOptions', '820906264719'));

      // Switch the answerConstraint to 'optionsOrType'
      cy.getTreeNode('string answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow off list').click();

      // The error on the 'enableWhen string off-list' is gone because an answer is now treated as valid
      // as long as its value matches the expected type.
      cy.getTreeNode('enableWhen string off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // Switch the answerConstraint to 'optionsOrString'
      cy.getTreeNode('string answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow free text').click();

      // The error does not reappeared because the answer value matches with the string type.
      cy.getTreeNode('enableWhen string off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');


      // -------- TEXT ANSWER OPTIONS --------
      // text answerOptions
      cy.getTreeNode('text answerOptions').click();
      cy.getItemTypeField().should('contain.value', 'text');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[12].answerOption[0].valueString).equal("AAAAAAAA");
        expect(q.item[12].answerOption[1].valueString).equal("BBBBBBBBB");
        expect(q.item[12].answerOption[2].valueString).equal("CCCCCCCCC");
      });

      // enableWhen referencing text answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen text on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = "BBBBBBBBB" which exists in the answerOptions
      cy.get('[id^="enableWhen.0.answerString"]').should('have.value', "BBBBBBBBB");

      // enableWhen referencing text answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen text off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      // Should have answer value = "ZZZZZZZZZ" which does not exists in the answerOptions.
      cy.get('[id^="enableWhen.0.answerString"]').should('have.value', "ZZZZZZZZZ");
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('text answerOptions', '174788656639'));

      // Switch the answerConstraint to 'optionsOrType'
      cy.getTreeNode('text answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow off list').click();

      // The error on the 'enableWhen text off-list' is gone because an answer is now treated as valid
      // as long as its value matches the expected type.
      cy.getTreeNode('enableWhen text off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // Switch the answerConstraint to 'optionsOrString'
      cy.getTreeNode('text answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow free text').click();

      // The error does not reappeared because the answer value matches with the string type.
      cy.getTreeNode('enableWhen text off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');


      // -------- CODING ANSWER OPTIONS --------
      // coding answerOptions
      cy.getTreeNode('coding answerOptions').click();
      cy.getItemTypeField().should('contain.value', 'coding');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      cy.get('[id^="labelRadio_"][id$="_optionsOnly"]').should('be.checked');
      cy.get('[id^="labelRadio_"][id$="_optionsOrType"]').should('not.be.checked');
      cy.get('[id^="labelRadio_"][id$="_optionsOrString"]').should('not.be.checked');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[15].answerOption[0].valueCoding.system).equal('a');
        expect(qJson.item[15].answerOption[0].valueCoding.code).equal('a1');
        expect(qJson.item[15].answerOption[0].valueCoding.display).equal('a1');

        expect(qJson.item[15].answerOption[1].valueCoding.system).equal('b');
        expect(qJson.item[15].answerOption[1].valueCoding.code).equal('b1');
        expect(qJson.item[15].answerOption[1].valueCoding.display).equal('b1');

        expect(qJson.item[15].answerOption[2].valueCoding.system).equal('c');
        expect(qJson.item[15].answerOption[2].valueCoding.code).equal('c1');
        expect(qJson.item[15].answerOption[2].valueCoding.display).equal('c1');
      });

      // enableWhen referencing coding answerOptions
      // There should be no error.
      cy.getTreeNode('enableWhen coding on-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.tsUrl().should('be.visible');
      cy.questionnaireJSON().should((qJson) => {
        // Verify enableWhen construct.
        expect(qJson.item[16].enableWhen[0].answerCoding.display).equal(qJson.item[15].answerOption[1].valueCoding.display);
        expect(qJson.item[16].enableWhen[0].answerCoding.code).equal(qJson.item[15].answerOption[1].valueCoding.code);
        expect(qJson.item[16].enableWhen[0].answerCoding.system).equal(qJson.item[15].answerOption[1].valueCoding.system);
      });

      // enableWhen referencing coding answerOptions
      // B/c the answer value does not match any of the answerOptions, there should be error.
      cy.getTreeNode('enableWhen coding off-list')
        .click()
        .find('fa-icon#error')
        .should('exist');
      cy.tsUrl().should('be.visible');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[17].enableWhen[0].answerCoding.display).not.equal(qJson.item[15].answerOption[1].valueCoding.display);
        expect(qJson.item[17].enableWhen[0].answerCoding.code).not.equal(qJson.item[15].answerOption[1].valueCoding.code);
        expect(qJson.item[17].enableWhen[0].answerCoding.system).not.equal(qJson.item[15].answerOption[1].valueCoding.system);
      });
      cy.get('[id^="enableWhen.0_err"]')
        .find('small')
        .should('contain.text', enableWhenErrorMsg('coding answerOptions', '264603036166'));

      // Switch the answerConstraint to 'optionsOrType'
      cy.getTreeNode('coding answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow off list').click();

      // The error on the 'enableWhen coding off-list' is gone because an answer is now treated as valid
      // as long as its value matches the expected type.
      cy.getTreeNode('enableWhen coding off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');

      // Switch the answerConstraint to 'optionsOrString'
      cy.getTreeNode('coding answerOptions').click();
      cy.getRadioButtonLabel('Answer constraint', 'Allow free text').click();

      // The error should not reappeared because the answer value is valid.
      cy.getTreeNode('enableWhen coding off-list')
        .click()
        .find('fa-icon#error')
        .should('not.exist');
      cy.get('[id^="enableWhen.0_err"]').should('not.exist');
    });
  });
});


/**
 * Generates a standardized error message for enableWhen answer option validation.
 * @param itemName - The name of the item or answerOptions group.
 * @param linkId - The linkId associated with the item.
 * @param optionsOrString - If true, includes additional text for constraints like "optionsOrString" (e.g., "or the answer constraint of type string").
 * @param conditionNum - The enableWhen condition number (default is 1).
 * @returns The formatted error message string for assertion in Cypress tests.
 */
function enableWhenErrorMsg(itemName, linkId, optionsOrString = false, conditionNum = 1) {
  if (optionsOrString) {
    return ` The answer value does not match any answer option in the '${itemName}' (linkId: '${linkId}') or the answer constraint of type string for enableWhen condition ${conditionNum}.`;
  } else {
    return ` The answer value does not match any answer option in the '${itemName}' (linkId: '${linkId}') for enableWhen condition ${conditionNum}.`;
  }
}
