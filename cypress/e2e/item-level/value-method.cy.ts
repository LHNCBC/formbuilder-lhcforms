/// <reference types="cypress" />

describe('Home page', () => {
  beforeEach(() => {
    cy.loadHomePage();
  });

  describe('Item level fields', () => {
    beforeEach(() => {
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.get('button').contains('Continue').click();
      cy.contains('button', 'Create questions').click();
      cy.getItemTextField().should('have.value', 'Item 0', { timeout: 10000 });
      cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');
    });

    describe('Value method', () => {
      beforeEach(() => {
        const sampleFile = 'value-methods-sample.json';
        cy.uploadFile(sampleFile, true);
        cy.getFormTitleField().should('have.value', 'value-methods-sample');
        cy.contains('button', 'Edit questions').click();
        cy.get('.spinner-border').should('not.exist');

        cy.contains('div', 'Value method').as('valueMethod').should('be.visible');
        cy.get('@valueMethod').find('[for^="__$valueMethod_compute-initial"]').as('computeInitial'); // Radio label for clicking
        cy.get('@valueMethod').find('[for^="__$valueMethod_compute-continuously"]').as('computeContinuously'); // Radio label for clicking
        cy.get('@valueMethod').find('[for^="__$valueMethod_none"]').as('none'); // Radio label for clicking

        cy.get('@valueMethod').find('[id^="__$valueMethod_compute-initial"]').as('computeInitialRadio'); // Radio input for assertions
        cy.get('@valueMethod').find('[id^="__$valueMethod_compute-continuously"]').as('computeContinuouslyRadio'); // Radio input for assertions
        cy.get('@valueMethod').find('[id^="__$valueMethod_none"]').as('noneRadio'); // Radio input for assertions

        cy.contains('div', 'Allow repeating question').as('repeatOption').should('be.visible');
        cy.get('@repeatOption').find('[for^="booleanRadio_true"]').as('repeatYes'); // Radio label for clicking
        cy.get('@repeatOption').find('[for^="booleanRadio_false"]').as('repeatNo'); // Radio label for clicking
        cy.get('@repeatOption').find('[for^="booleanRadio_null"]').as('repeatUnspecified'); // Radio label for clicking

        cy.get('@repeatOption').find('[id^="booleanRadio_true"]').as('repeatYesRadio'); // Radio input for assertions
        cy.get('@repeatOption').find('[id^="booleanRadio_false"]').as('repeatNoRadio'); // Radio input for assertions
        cy.get('@repeatOption').find('[id^="booleanRadio_null"]').as('repeatUnspecifiedRadio'); // Radio input for assertions
      });

      it('should load and display correct value method options', () => {
        // Type Initial Value (Single)
        cy.get('@valueMethod').find('[id^="__$valueMethod_type-initial"]').as('typeInitialRadio');
        cy.getItemTypeField().should('have.value', '2: integer');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueInteger"]').should('exist').should('be.visible').should('have.value', 6);
        cy.get('@repeatNoRadio').should('be.visible').and('be.checked');

        // Type Initial Value (Multiple)
        cy.clickTreeNode('Type Initial Value (Multiple)');
        cy.getItemTypeField().should('have.value', '2: integer');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueInteger"]').should('exist').should('be.visible').should('have.value', 2);
        cy.get('[id^="initial.1.valueInteger"]').should('exist').should('be.visible').should('have.value', 6);
        cy.get('@repeatYesRadio').should('be.visible').and('be.checked');

        // Pick Initial Value (Single)
        cy.clickTreeNode('Pick Initial Value (Single)');
        cy.get('@valueMethod').find('[id^="__$valueMethod_pick-initial"]').as('pickInitialRadio');
        cy.getItemTypeField().should('have.value', '9: coding');
        cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
        cy.get('@pickInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="pick-answer_"]').should('exist').should('be.visible').should('have.value', 'Street clothes, no shoes');
        cy.get('@repeatNoRadio').should('be.visible').and('be.checked');

        // Pick Initial Value (Multiple)
        cy.clickTreeNode('Pick Initial Value (Multiple)');
        cy.getItemTypeField().should('have.value', '9: coding');
        cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
        cy.get('@pickInitialRadio').should('be.visible').and('be.checked');
        cy.get('lfb-pick-answer span.autocomp_selected li').as('pickInitialValues');
        cy.get("@pickInitialValues") .eq(0).should('contain.text', 'Street clothes, no shoes');
        cy.get("@pickInitialValues") .eq(1).should('contain.text', 'Street clothes & shoes');
        cy.get('@repeatYesRadio').should('be.visible').and('be.checked');

        // Compute Initial Value
        cy.clickTreeNode('Compute Initial Value');
        cy.getItemTypeField().should('have.value', '2: integer');
        cy.get('@computeInitialRadio').should('be.visible').and('be.checked');
        cy.get('lfb-expression-editor textarea#outputExpression').should('contain.value', '%a + %b');
        cy.get('@repeatUnspecifiedRadio').should('be.visible').and('be.checked');

        // Continuously Compute Value
        cy.clickTreeNode('Continuously Compute Value');
        cy.getItemTypeField().should('have.value', '2: integer');
        cy.get('@computeContinuouslyRadio').should('be.visible').and('be.checked');
        cy.get('lfb-expression-editor textarea#outputExpression').should('contain.value', '%a + %b + %c');
        cy.get('@repeatUnspecifiedRadio').should('be.visible').and('be.checked');

        cy.clickTreeNode('None');
        cy.getItemTypeField().should('have.value', '2: integer');
        cy.get('@noneRadio').should('be.visible').and('be.checked');

        // Compute Initial Value
        cy.clickTreeNode('Compute Initial Value with decimal data type');
        cy.getItemTypeField().should('have.value', '1: decimal');

        // Variables section
        cy.get('lfb-variable table > tbody > tr').should('have.length', 2);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(1)').as('firstVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(2)').as('secondVariable');

        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'normal_weight');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'Question');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', "%resource.item.where(linkId='normal_weight').answer.value");

        cy.get('@secondVariable').find('td:nth-child(1)').should('have.text', 'measured_weight');
        cy.get('@secondVariable').find('td:nth-child(2)').should('have.text', 'Question');
        cy.get('@secondVariable').find('td:nth-child(3)').should('have.text', "%resource.item.where(linkId='measured_weight').answer.value");

        cy.get('@computeInitialRadio').should('be.visible').and('be.checked');
        cy.get('lfb-expression-editor textarea#outputExpression').should('contain.value', '%measured_weight-%normal_weight');
        cy.get('@repeatUnspecifiedRadio').should('be.visible').and('be.checked');

        // Continuously Compute Value
        cy.clickTreeNode('Continuously Compute Value with decimal data type');
        cy.getItemTypeField().should('have.value', '1: decimal');

        // Variables section
        cy.get('lfb-variable table > tbody > tr').should('have.length', 2);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(1)').as('firstVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(2)').as('secondVariable');

        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'normal_weight');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'Question');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', "%resource.item.where(linkId='normal_weight').answer.value");

        cy.get('@secondVariable').find('td:nth-child(1)').should('have.text', 'weight_change');
        cy.get('@secondVariable').find('td:nth-child(2)').should('have.text', 'Question');
        cy.get('@secondVariable').find('td:nth-child(3)').should('have.text', "%resource.item.where(linkId='weight_change').answer.value");

        cy.get('@computeContinuouslyRadio').should('be.visible').and('be.checked');
        cy.get('lfb-expression-editor textarea#outputExpression').should('contain.value', '((%weight_change / %normal_weight).round(2))*100');
        cy.get('@repeatUnspecifiedRadio').should('be.visible').and('be.checked');
      });

      it('should type initial values', () => {
        // Add a new item under the 'None' item.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Type initial values');
        cy.selectDataType('integer');
        // Select 'Type Initial' option for 'Value method' field
        cy.getTypeInitialValueValueMethodClick();

        cy.get('[id^="initial.0.valueInteger"]').type('3{enter}');

        // Set the 'Repeats' option to yes.
        cy.get('@repeatYes').click();

        cy.contains('button', 'Add another value').as('addInitialValueButton');
        cy.get('@addInitialValueButton').click();
        cy.get('[id^="initial.1.valueInteger"]').type('4{enter}');
        cy.get('@addInitialValueButton').click();
        cy.get('[id^="initial.2.valueInteger"]').type('5{enter}');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[7].initial).to.deep.equal([
            {
              "valueInteger": 3
            },
            {
              "valueInteger": 4
            },
            {
              "valueInteger": 5
            }
          ]);
        });
      });

      it('should pick initial values', () => {
        // Add a new item under the 'None' item.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Pick initial values');
        cy.selectDataType('coding');
        cy.getRadioButtonLabel('Create answer list', 'Yes').click();
        cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();

        cy.getPickInitialValueValueMethodClick();
        cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
        cy.get('lfb-answer-option table > tbody > tr').should('have.length', 1);

        cy.get('[id^="pick-answer_"]').as('pickAnswer');
        cy.get('@pickAnswer').should('exist').should('be.visible');

        cy.get('@pickAnswer').should('have.class', 'invalid');
        // The error message should display at the bottom of the text input
        cy.get('lfb-pick-answer')
          .find('small.text-danger')
          .should('be.visible')
          .should('contain.text', "Answer choices must be populated.");

        // Error should display at the top of the content and at the bottom.
        cy.get('mat-sidenav-content > div.mt-1 > ul > li').should('have.class', 'text-danger');
        cy.get('mat-sidenav-content > ul > li').should('have.class', 'text-danger');

        // Answer Option field is empty. Add 3 options.
        cy.contains('button', 'Add another answer').as('addAnswerButton');
        cy.get('[id^="answerOption.0.valueCoding.display"]').type('Example 1');
        cy.get('[id^="answerOption.0.valueCoding.code"]').type('MD11871-1');
        cy.get('[id^="answerOption.0.valueCoding.system"]').type('http://loinc.org');
        cy.get('@addAnswerButton').click();
        cy.get('[id^="answerOption.1.valueCoding.display"]').type('Example 2');
        cy.get('[id^="answerOption.1.valueCoding.code"]').type('MD11871-2');
        cy.get('[id^="answerOption.1.valueCoding.system"]').type('http://loinc.org');
        cy.get('@addAnswerButton').click();
        cy.get('[id^="answerOption.2.valueCoding.display"]').type('Example 3');
        cy.get('[id^="answerOption.2.valueCoding.code"]').type('MD11871-3');
        cy.get('[id^="answerOption.2.valueCoding.system"]').type('http://loinc.org{enter}');
        cy.get('[id^="answerOption.2.valueCoding.__$score"]').click();

        // The error on the Pick Answer field should go away
        cy.get('@pickAnswer').should('not.have.class', 'invalid');

        cy.get('lfb-pick-answer')
          .find('small.text-danger')
          .should('not.exist');

        // Error display at the top of the content and at the bottom should go away.
        cy.get('mat-sidenav-content > div.mt-1 > ul > li').should('not.have.class', 'text-danger');
        cy.get('mat-sidenav-content > ul > li').should('not.exist');

        // Select 'Example 2' option
        cy.get('@pickAnswer').then(($el: JQuery<HTMLInputElement>) => {
          cy.selectAutocompleteOption($el, false, null, 3, '{downarrow}{downarrow}{enter}', 'Example 2');
        });

        // Set the 'Repeats' option to yes.
        cy.get('@repeatYes').click();

        // Select 1st and 3rd options
        cy.get('@pickAnswer').then(($el: JQuery<HTMLInputElement>) => {
          cy.selectAutocompleteOptions($el, true, 'Example 1', null, '{downarrow}{enter}', ['×Example 1']);

          cy.selectAutocompleteOptions($el, true, 'invalidCode', null, '{downarrow}{enter}', ['×Example 1']);

          cy.selectAutocompleteOptions($el, true, 'Example 3', null, '{downarrow}{enter}', ['×Example 1', '×Example 3']);
        });

        cy.get('lfb-pick-answer span.autocomp_selected > ul > li').as('pickAnswerSelection');
        cy.get('@pickAnswerSelection').should('have.length', 2);
        cy.get('@pickAnswerSelection').eq(0).should('contain.text', 'Example 1');
        cy.get('@pickAnswerSelection').eq(1).should('contain.text', 'Example 3');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[7].type).equal('coding');
          expect(qJson.item[7].answerOption[0].valueCoding.display).equal('Example 1');
          expect(qJson.item[7].answerOption[0].initialSelected).equal(true);
          expect(qJson.item[7].answerOption[2].valueCoding.display).equal('Example 3');
          expect(qJson.item[7].answerOption[2].initialSelected).equal(true);
        });
      });

      it('should retain valid state when toggling between "Pick initial value" and other value methods', () => {
        // Add a new item under the 'None' item.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.get('#text').clear().type('Test state');
        cy.selectDataType('coding');
        cy.getRadioButtonLabel('Create answer list', 'Yes').click();
        cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();

        cy.getPickInitialValueValueMethodClick();
        cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
        cy.get('lfb-answer-option table > tbody > tr').should('have.length', 1);

        // Answer Option field is empty. Add 3 options.
        cy.contains('button', 'Add another answer').as('addAnswerButton');
        cy.get('[id^="answerOption.0.valueCoding.display"]').type('Example 1');
        cy.get('[id^="answerOption.0.valueCoding.code"]').type('MD11871-1');
        cy.get('[id^="answerOption.0.valueCoding.system"]').type('http://loinc.org');
        cy.get('@addAnswerButton').click();
        cy.get('[id^="answerOption.1.valueCoding.display"]').type('Example 2');
        cy.get('[id^="answerOption.1.valueCoding.code"]').type('MD11871-2');
        cy.get('[id^="answerOption.1.valueCoding.system"]').type('http://loinc.org');
        cy.get('@addAnswerButton').click();
        cy.get('[id^="answerOption.2.valueCoding.display"]').type('Example 3');
        cy.get('[id^="answerOption.2.valueCoding.code"]').type('MD11871-3');
        cy.get('[id^="answerOption.2.valueCoding.system"]').type('http://loinc.org{enter}');
        cy.get('[id^="answerOption.2.valueCoding.__$score"]').click();

        cy.get('[id^="pick-answer_"]').as('pickAnswer');
        cy.get('@pickAnswer').should('exist').should('be.visible');

        // Select 'Example 2' option
        cy.get('@pickAnswer').click();
        cy.get('#lhc-tools-searchResults ul > li').should('have.length', 3);
        cy.get('@pickAnswer').type('{downarrow}{downarrow}{enter}');
        cy.get('@pickAnswer').should('have.value', 'Example 2');

        // Select the 'Compute initial value - Value method'
        cy.getComputeInitialValueValueMethodClick();

        // Then select the 'Pick initial value - Value method' again.
        cy.getPickInitialValueValueMethodClick();

        // The 'Pick initial value' field should not contain the 'no_match' class (darker yellow to represent )
        cy.get('@pickAnswer').should('not.have.class', 'no_match');
      });

      it('should remove the answer choices error when answer choices are added and selected for types other than "coding"', () => {
        // Add a new item under the 'None' item.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.get('#text').clear().type('Test answer choice error');
        cy.selectDataType('integer');
        cy.getRadioButtonLabel('Create answer list', 'Yes').click();
        cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();

        cy.getPickInitialValueValueMethodClick();
        cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
        cy.get('lfb-answer-option table > tbody > tr').should('have.length', 1);

        cy.get('[id^="pick-answer_"]').as('pickAnswer');
        cy.get('@pickAnswer').should('exist').should('be.visible');

        cy.get('@pickAnswer').should('have.class', 'invalid');
        // The error message should display at the bottom of the text input
        cy.get('lfb-pick-answer')
          .find('small.text-danger')
          .should('be.visible')
          .should('contain.text', "Answer choices must be populated.");

        // Answer Option field is empty. Add 3 options.
        cy.contains('button', 'Add another answer').as('addAnswerButton');
        cy.get('[id^="answerOption.0.valueInteger"]').type('100');
        cy.get('@addAnswerButton').click();
        cy.get('[id^="answerOption.1.valueInteger"]').type('200');
        cy.get('@addAnswerButton').click();
        cy.get('[id^="answerOption.2.valueInteger"]').type('300');
        cy.get('@addAnswerButton').click();

        // Select 'Example 2' option
        cy.get('@pickAnswer').click();
        cy.get('#lhc-tools-searchResults ul > li').should('have.length', 3);
        cy.get('@pickAnswer').type('{downarrow}{downarrow}{enter}');
        cy.get('@pickAnswer').should('have.value', '200');

        cy.get('@pickAnswer').should('not.have.class', 'invalid');

        cy.get('lfb-pick-answer')
          .find('small.text-danger')
          .should('not.exist');

        // Error display at the top of the content and at the bottom should go away.
        cy.get('mat-sidenav-content > div.mt-1 > ul > li').should('not.have.class', 'text-danger');
        cy.get('mat-sidenav-content > ul > li').should('not.exist');
      });

      it('should create Initial compute value expression', () => {
        // Add a new item under the 'None' item.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Compute initial value expression');
        cy.selectDataType('integer');

        cy.get('@computeInitial').should('be.visible').click();
        cy.get('lfb-expression-editor textarea#outputExpression').should('be.empty');
        cy.get('button#editInitialExpression').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 0);

          // Add a new variable 'a'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 1);
          cy.get('#variable-label-0').clear().type('a');
          cy.get('#variable-type-0').select('Easy Path Expression');
          cy.get('input#simple-expression-0').type('1');

          // Add a new variable 'b'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 2);
          cy.get('#variable-label-1').clear().type('b');
          cy.get('#variable-type-1').select('Easy Path Expression');
          cy.get('input#simple-expression-1').type('2');

          // Output expression
          cy.get('textarea#final-expression').clear().type('%a + %b');
          cy.get('lhc-syntax-preview>div>div>pre').should('not.have.text', 'Not valid');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });
        cy.get('lfb-expression-editor textarea#outputExpression').should('have.value', '%a + %b');

        // need to check the JSON
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[7].extension).to.deep.equal([
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "a",
                "language": "text/fhirpath",
                "expression": "1",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "1"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "b",
                "language": "text/fhirpath",
                "expression": "2",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "2"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "%a + %b"
              }
            }
          ]);
        });

        // Go back to the Expression Editor to check that the settings are still correct.
        cy.get('button#editInitialExpression').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 2);

          cy.get('#variable-label-0').should('have.value', 'a');
          cy.get('#variable-type-0').should('have.value', 'simple');
          cy.get('input#simple-expression-0').should('have.value', '1');

          cy.get('#variable-label-1').should('have.value', 'b');
          cy.get('#variable-type-1').should('have.value', 'simple');
          cy.get('input#simple-expression-1').should('have.value', '2');
        });
      });

      it('should create Continuously compute value expression', () => {
        // Add a new item under the 'None' item.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Continuously compute value expression');
        cy.selectDataType('integer');

        cy.get('@computeContinuously').should('be.visible').click();
        cy.get('lfb-expression-editor textarea#outputExpression').should('be.empty');
        cy.get('button#editCalculatedExpression').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 0);

          // Add a new variable 'a'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 1);
          cy.get('#variable-label-0').clear().type('a');
          cy.get('#variable-type-0').select('Easy Path Expression');
          cy.get('input#simple-expression-0').type('1');

          // Add a new variable 'b'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 2);
          cy.get('#variable-label-1').clear().type('b');
          cy.get('#variable-type-1').select('Easy Path Expression');
          cy.get('input#simple-expression-1').type('2');

          // Output expression
          cy.get('textarea#final-expression').clear().type('%a + %b');
          cy.get('lhc-syntax-preview>div>div>pre').should('not.have.text', 'Not valid');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });
        cy.get('lfb-expression-editor textarea#outputExpression').should('have.value', '%a + %b');

        // need to check the JSON
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[7].extension).to.deep.equal([
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "a",
                "language": "text/fhirpath",
                "expression": "1",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "1"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "b",
                "language": "text/fhirpath",
                "expression": "2",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "2"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "%a + %b"
              }
            }
          ]);
        });

        // Go back to the Expression Editor to check that the settings are still correct.
        cy.get('button#editCalculatedExpression').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 2);

          cy.get('#variable-label-0').should('have.value', 'a');
          cy.get('#variable-type-0').should('have.value', 'simple');
          cy.get('input#simple-expression-0').should('have.value', '1');

          cy.get('#variable-label-1').should('have.value', 'b');
          cy.get('#variable-type-1').should('have.value', 'simple');
          cy.get('input#simple-expression-1').should('have.value', '2');
        });
      });

      it('should keep "Type initial value" visible after populating "Initial compute value" expression and toggling "Create answer list"', () => {
        // Add a new item under the 'None' item.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Initial compute value');
        cy.selectDataType('integer');

        // Create Initial compute value
        cy.get('@computeInitial').should('be.visible').click();
        cy.get('lfb-expression-editor textarea#outputExpression').should('be.empty');
        cy.get('button#editExpression').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');
          cy.get('#add-variable').click();
          cy.get('#variable-label-0').clear().type('a');
          cy.get('#variable-type-0').select('Easy Path Expression');
          cy.get('input#simple-expression-0').type('1');
          cy.get('#add-variable').click();
          cy.get('#variable-label-1').clear().type('b');
          cy.get('#variable-type-1').select('Easy Path Expression');
          cy.get('input#simple-expression-1').type('2');
          cy.get('textarea#final-expression').clear().type('%a + %b');
          cy.get('#export').click();
        });
        cy.get('lfb-expression-editor textarea#outputExpression').should('have.value', '%a + %b');

        // Toggle 'Create answer list' from 'No' to 'Yes' and back
        cy.getRadioButtonLabel('Create answer list', 'Yes').click();
        cy.getRadioButtonLabel('Create answer list', 'No').click();

        // The 'Type initial value' field should be visible
        cy.get('[id^="__$valueMethod_type-initial"]').should('exist');
      });

      it('should keep "Type initial value" visible after populating "Continuously compute value" expression and switching to another item and back', () => {
        // Add a new item under the 'None' item.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Continuously compute value');
        cy.selectDataType('integer');

        // Create Continuously compute value
        cy.getComputeContinuouslyValueValueMethodClick();
        cy.get('lfb-expression-editor textarea#outputExpression').should('be.empty');
        cy.get('button#editExpression').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');
          cy.get('#add-variable').click();
          cy.get('#variable-label-0').clear().type('a');
          cy.get('#variable-type-0').select('Easy Path Expression');
          cy.get('input#simple-expression-0').type('1');
          cy.get('#add-variable').click();
          cy.get('#variable-label-1').clear().type('b');
          cy.get('#variable-type-1').select('Easy Path Expression');
          cy.get('input#simple-expression-1').type('2');
          cy.get('textarea#final-expression').clear().type('%a + %b');
          cy.get('lhc-syntax-preview>div>div>pre').should('not.have.text', 'Not valid');
          cy.get('#export').click();
        });
        cy.get('lfb-expression-editor textarea#outputExpression').should('have.value', '%a + %b');

        // Click on a different item in the tree (simulate navigation away)
        cy.clickTreeNode('None');

        // Click back to the newly created item
        cy.contains('Continuously compute value').click();

        // The 'Type initial value' field should be visible
        cy.get('[id^="__$valueMethod_type-initial"]').should('exist');
      });

      it('should retain value or expression when switching between value methods', () => {
        // Add a new item under the 'None' item.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Test switching value methods');
        cy.selectDataType('decimal');

        cy.get('@computeInitial').should('be.visible').click();
        cy.get('lfb-expression-editor textarea#outputExpression').should('be.empty');
        cy.get('button#editInitialExpression').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 0);

          // Add a new variable 'a'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 1);
          cy.get('#variable-label-0').clear().type('a');
          cy.get('#variable-type-0').select('Easy Path Expression');
          cy.get('input#simple-expression-0').type('1');

          // Add a new variable 'b'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 2);
          cy.get('#variable-label-1').clear().type('b');
          cy.get('#variable-type-1').select('Easy Path Expression');
          cy.get('input#simple-expression-1').type('2');

          // Output expression
          cy.get('textarea#final-expression').clear().type('%a + %b');
          cy.get('lhc-syntax-preview>div>div>pre').should('not.have.text', 'Not valid');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });
        cy.get('lfb-expression-editor textarea#outputExpression').should('have.value', '%a + %b');

        // need to check the JSON
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[7].extension).to.deep.equal([
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "a",
                "language": "text/fhirpath",
                "expression": "1",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "1"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "b",
                "language": "text/fhirpath",
                "expression": "2",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "2"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "%a + %b"
              }
            }
          ]);
        });

        // Select 'Type Initial' option for 'Value method' field
        // -----------------------------------------------------
        cy.getTypeInitialValueValueMethodClick();

        cy.get('[id^="initial.0.valueDecimal"]').type('33{enter}');

        cy.questionnaireJSON().should((qJson) => {
          // Initial value should have value 33
          expect(qJson.item[7].initial).to.deep.equal([
            {
              "valueDecimal": 33
            }
          ]);

          // The 'Initial expression' should be removed.
          expect(qJson.item[7].extension).to.deep.equal([
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "a",
                "language": "text/fhirpath",
                "expression": "1",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "1"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "b",
                "language": "text/fhirpath",
                "expression": "2",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "2"
                  }
                ]
              }
            }
          ]);
        });

        // Select 'Continuously compute value' option for 'Value method' field
        // -------------------------------------------------------------------
        cy.getComputeContinuouslyValueValueMethodClick();

        cy.get('lfb-expression-editor textarea#outputExpression').should('have.value', '%a + %b');


        cy.questionnaireJSON().should((qJson) => {
          // The 'initial' section should be removed.
          expect(qJson.item[7].initial).to.not.exist;

          // The output expression should get added back.
          // The output expression should show the URL as 'Calculated expression'
          expect(qJson.item[7].extension).to.deep.equal([
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "a",
                "language": "text/fhirpath",
                "expression": "1",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "1"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "b",
                "language": "text/fhirpath",
                "expression": "2",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "2"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "%a + %b"
              }
            }
          ]);
        });

        // Select 'Initial compute value' option for 'Value method' field
        // ---------------------------------------------------------------
        cy.getComputeInitialValueValueMethodClick();

        cy.get('lfb-expression-editor textarea#outputExpression').should('have.value', '%a + %b');


        cy.questionnaireJSON().should((qJson) => {
          // The output expression should show the URL as 'Initial expression'
          expect(qJson.item[7].extension[2]).to.deep.equal(
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "%a + %b"
              }
            }
          );
        });

        // Select 'None' option for 'Value method' field
        // ---------------------------------------------------------------
        cy.getNoneValueMethodClick();

        cy.questionnaireJSON().should((qJson) => {
          // The 'Initial expression' should be removed.
          expect(qJson.item[7].extension).to.deep.equal([
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "a",
                "language": "text/fhirpath",
                "expression": "1",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "1"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "b",
                "language": "text/fhirpath",
                "expression": "2",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "2"
                  }
                ]
              }
            }
          ]);
        });

        // Select 'Pick initial value' option for 'Value method' field
        // ---------------------------------------------------------------
        // Switch to data type 'coding'
        cy.selectDataType('coding');
        cy.getRadioButtonLabel('Create answer list', 'Yes').click();
        cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();

        // Default for the 'Answer list laytout' is now 'Unspecified'.  Have to manually select 'drop-down'.
        cy.getRadioButtonLabel('Answer list layout', 'Drop down').click();

        cy.getPickInitialValueValueMethodClick();

        cy.get('[id^="pick-answer_"]').as('pickAnswer');
        cy.get('@pickAnswer').should('exist').should('be.visible');

        cy.get('@pickAnswer').should('have.class', 'invalid');
        // The error message should display at the bottom of the text input
        cy.get('lfb-pick-answer')
          .find('small.text-danger')
          .should('be.visible')
          .should('contain.text', "Answer choices must be populated.");

        // Error should display at the top of the content and at the bottom.
        cy.get('mat-sidenav-content > div.mt-1 > ul > li').should('have.class', 'text-danger');
        cy.get('mat-sidenav-content > ul > li').should('have.class', 'text-danger');

        // Answer Option field is empty. Add 3 options.
        cy.contains('button', 'Add another answer').as('addAnswerButton');
        cy.get('[id^="answerOption.0.valueCoding.display"]').type('Example 1');
        cy.get('[id^="answerOption.0.valueCoding.code"]').type('MD11871-1');
        cy.get('[id^="answerOption.0.valueCoding.system"]').type('http://loinc.org');
        cy.get('@addAnswerButton').click();
        cy.get('[id^="answerOption.1.valueCoding.display"]').type('Example 2');
        cy.get('[id^="answerOption.1.valueCoding.code"]').type('MD11871-2');
        cy.get('[id^="answerOption.1.valueCoding.system"]').type('http://loinc.org');
        cy.get('@addAnswerButton').click();
        cy.get('[id^="answerOption.2.valueCoding.display"]').type('Example 3');
        cy.get('[id^="answerOption.2.valueCoding.code"]').type('MD11871-3');
        cy.get('[id^="answerOption.2.valueCoding.system"]').type('http://loinc.org{enter}');
        cy.get('[id^="answerOption.2.valueCoding.__$score"]').click();

        // The error on the Pick Answer field should go away
        cy.get('@pickAnswer').should('not.have.class', 'invalid');

        cy.get('lfb-pick-answer')
          .find('small.text-danger')
          .should('not.exist');

        // Error display at the top of the content and at the bottom should go away.
        cy.get('mat-sidenav-content > div.mt-1 > ul > li').should('not.have.class', 'text-danger');
        cy.get('mat-sidenav-content > ul > li').should('not.exist');

        // Select 'Example 2' option
        cy.get('@pickAnswer').then(($el: JQuery<HTMLInputElement>) => {
          cy.selectAutocompleteOption($el, true, null, 3, '{downarrow}{downarrow}{enter}', 'Example 2');
        });

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[7].type).equal('coding');
          expect(qJson.item[7].answerOption[0].valueCoding.display).equal('Example 1');
          expect(qJson.item[7].answerOption[0].initialSelected).to.not.exist;
          expect(qJson.item[7].answerOption[1].valueCoding.display).equal('Example 2');
          expect(qJson.item[7].answerOption[1].initialSelected).equal(true);
          expect(qJson.item[7].answerOption[2].valueCoding.display).equal('Example 3');
          expect(qJson.item[7].answerOption[2].initialSelected).to.not.exist;
        });

        // Select 'Continuously compute value' option for 'Value method' field
        // -------------------------------------------------------------------
        cy.getComputeContinuouslyValueValueMethodClick();

        cy.get('lfb-expression-editor textarea#outputExpression').should('have.value', '%a + %b');

        cy.questionnaireJSON().should((qJson) => {
          // The 'initial' section should be removed.
          expect(qJson.item[7].initial).to.not.exist;

          // The output expression should get added back.
          // The output expression should show the URL as 'Calculated expression'
          expect(qJson.item[7].extension).to.deep.equal([
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "a",
                "language": "text/fhirpath",
                "expression": "1",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "1"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "b",
                "language": "text/fhirpath",
                "expression": "2",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "2"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "%a + %b"
              }
            },
            {
              "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
              "valueCodeableConcept": {
                "coding": [
                  {
                    "system": "http://hl7.org/fhir/questionnaire-item-control",
                    "code": "drop-down",
                    "display": "Drop down"
                  }
                ]
              }
            }
          ]);
        });
      });
    });

    describe('Value method button selection', () => {
      beforeEach(() => {
        cy.loadHomePage();
        const sampleFile = 'value-methods-button-selection-sample.json';
        cy.uploadFile(sampleFile, false);
        cy.getFormTitleField().should('have.value', 'value-methods-button-selection-sample');
        cy.contains('button', 'Edit questions').click();
        cy.get('.spinner-border').should('not.exist');

        cy.contains('div', 'Value method').as('valueMethod').should('be.visible');
        cy.get('@valueMethod').find('[for^="__$valueMethod_compute-initial"]').as('computeInitial'); // Radio label for clicking
        cy.get('@valueMethod').find('[for^="__$valueMethod_compute-continuously"]').as('computeContinuously'); // Radio label for clicking
        cy.get('@valueMethod').find('[for^="__$valueMethod_none"]').as('none'); // Radio label for clicking

        cy.get('@valueMethod').find('[id^="__$valueMethod_compute-initial"]').as('computeInitialRadio'); // Radio input for assertions
        cy.get('@valueMethod').find('[id^="__$valueMethod_compute-continuously"]').as('computeContinuouslyRadio'); // Radio input for assertions
        cy.get('@valueMethod').find('[id^="__$valueMethod_none"]').as('noneRadio'); // Radio input for assertions
      });

      it('should display the appropriate value method option based on the data', () => {
        // Starts out with 'boolean' type
        cy.getItemTypeField().contains('boolean');
        cy.get('@valueMethod').find('[id^="__$valueMethod_pick-initial"]').as('pickInitialRadio');
        cy.get('@pickInitialRadio').should('be.visible').and('be.checked');
        cy.contains('div', 'Initial value').as('initialValue').should('be.visible');
        cy.get('@initialValue')
          .siblings('div')
          .find('[id^="booleanRadio_true"]')
          .should('be.visible').and('be.checked');

        cy.clickTreeNode('decimal_type');
        cy.getItemTypeField().contains('decimal');
        cy.get('@valueMethod').find('[id^="__$valueMethod_type-initial"]').as('typeInitialRadio');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueDecimal"]').should('have.value', '3.2');

        cy.clickTreeNode('integer_type-answerlist_no');
        cy.getItemTypeField().contains('integer');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueInteger"]').should('have.value', '5');

        cy.clickTreeNode('integer_type-answerlist_yes');
        cy.getItemTypeField().contains('integer');
        cy.get('@pickInitialRadio').should('be.visible').and('be.checked');
        cy.get('lfb-answer-option table > tbody > tr').should('have.length', 3);
        cy.get('[id^="pick-answer_"]').should('exist').should('be.visible').should('have.value', '2');

        cy.clickTreeNode('date_type-answerlist_no');
        cy.getItemTypeField().contains('date');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueDate"]').should('have.value', '2024-03-03');

        cy.clickTreeNode('date_type-answerlist_yes');
        cy.getItemTypeField().contains('date');
        cy.get('@pickInitialRadio').should('be.visible').and('be.checked');
        cy.get('lfb-answer-option table > tbody > tr').should('have.length', 2);
        cy.get('[id^="pick-answer_"]').should('exist').should('be.visible').should('have.value', '2024-01-02');

        cy.clickTreeNode('dateTime_type');
        cy.getItemTypeField().contains('dateTime');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueDateTime"]').should('have.value', '2024-03-03 07:01:01 AM');

        cy.clickTreeNode('time_type-answerlist_no');
        cy.getItemTypeField().contains('time');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueTime"]').should('have.value', '01:01:01');

        cy.clickTreeNode('time_type-answerlist_yes');
        cy.getItemTypeField().contains('time');
        cy.get('@pickInitialRadio').should('be.visible').and('be.checked');
        cy.get('lfb-answer-option table > tbody > tr').should('have.length', 2);
        cy.get('[id^="pick-answer_"]').should('exist').should('be.visible').should('have.value', '02:01:01');

        cy.clickTreeNode('string_type-answerlist_no');
        cy.getItemTypeField().contains('string');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueString"]').should('have.value', 'abcd');

        cy.clickTreeNode('string_type-answerlist_yes');
        cy.getItemTypeField().contains('string');
        cy.get('@pickInitialRadio').should('be.visible').and('be.checked');
        cy.get('lfb-answer-option table > tbody > tr').should('have.length', 2);
        cy.get('[id^="pick-answer_"]').should('exist').should('be.visible').should('have.value', 'def');

        cy.clickTreeNode('text_type-answerlist_no');
        cy.getItemTypeField().contains('text');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueString"]').should('have.value', 'abcd');

        cy.clickTreeNode('text_type-answerlist_yes');
        cy.getItemTypeField().contains('text');
        cy.get('@pickInitialRadio').should('be.visible').and('be.checked');
        cy.get('lfb-answer-option table > tbody > tr').should('have.length', 2);
        cy.get('[id^="pick-answer_"]').should('exist').should('be.visible').should('have.value', 'def');

        cy.clickTreeNode('url_type');
        cy.getItemTypeField().contains('url');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueUri"]').should('have.value', 'http://www.test.org');

        cy.clickTreeNode('coding_type-answerlist_no');
        cy.getItemTypeField().contains('coding');
        cy.get('@noneRadio').should('be.visible').and('be.checked');

        cy.clickTreeNode('coding_type-answerlist_yes');
        cy.getItemTypeField().contains('coding');
        cy.get('@pickInitialRadio').should('be.visible').and('be.checked');

        cy.get('lfb-answer-option table > tbody > tr').should('have.length', 3);
        cy.get('[id^="pick-answer_"]').should('exist').should('be.visible').should('have.value', 'a2');

        cy.clickTreeNode('quantity_type');
        cy.getItemTypeField().contains('quantity');
        cy.get('@typeInitialRadio').should('be.visible').and('be.checked');
        cy.get('[id^="initial.0.valueQuantity"]').should('have.value', '3');
      });
    });
  });
});