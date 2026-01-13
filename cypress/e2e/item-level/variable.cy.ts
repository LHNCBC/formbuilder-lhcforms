/// <reference types="cypress" />

describe('Home page', () => {

  beforeEach(() => {
    cy.loadHomePage();
  });

  describe('Item level fields', () => {
    describe('Variable', () => {
      beforeEach(() => {
        const sampleFile = 'value-methods-sample.json';
        cy.uploadFile(sampleFile, false);
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

      it('should create various types of variables', () => {
        // Add a new item under the 'Race' item of data type 'display'.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Variables');
        cy.selectDataType('integer');

        // Click the 'Create/edit variables' button and add five different types of variables
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

          // Add a new variable 'd_question'
          cy.get('#add-variable').click();
          cy.get('#variable-label-3').clear().type('d_question');
          cy.get('#variable-type-3').should('have.value', 'question');
          cy.get('#question-3')
            .should('exist')
            .should('be.visible')
            .type('Pick Initial Value (Single)')
            .type('{downarrow}{enter}');

          // Add a new variable 'e_easy_path_exp'
          cy.get('#add-variable').click();
          cy.get('#variable-label-4').clear().type('e_easy_path_exp');
          cy.get('#variable-type-4').select('Easy Path Expression');
          cy.get('input#simple-expression-4').type('1');

          // Save the variables
          cy.get('#export').click();
        });

        // Item Variables section should now show 5 variables
        cy.get('lfb-variable table > tbody > tr').should('have.length', 5);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(1)').as('firstVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(2)').as('secondVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(3)').as('thirdVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(4)').as('fourthVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(5)').as('fifthVariable');

        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'a_fhir_exp');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'FHIRPath Expression');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', "%resource.item.where(linkId='/29453-7').answer.value");

        cy.get('@secondVariable').find('td:nth-child(1)').should('have.text', 'b_fhir_query');
        cy.get('@secondVariable').find('td:nth-child(2)').should('have.text', 'FHIR Query');
        cy.get('@secondVariable').find('td:nth-child(3)').should('have.text', "Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))");

        cy.get('@thirdVariable').find('td:nth-child(1)').should('have.text', 'c_fhir_query_obs');
        cy.get('@thirdVariable').find('td:nth-child(2)').should('have.text', 'FHIR Query (Observation)');
        cy.get('@thirdVariable').find('td:nth-child(3)').should('have.text', "Observation?code=http%3A%2F%2Floinc.org%7C29463-7&date=gt{{today()-1 months}}&patient={{%patient.id}}&_sort=-date&_count=1");

        cy.get('@fourthVariable').find('td:nth-child(1)').should('have.text', 'd_question');
        cy.get('@fourthVariable').find('td:nth-child(2)').should('have.text', 'Question');
        cy.get('@fourthVariable').find('td:nth-child(3)').should('have.text', "%resource.item.where(linkId='/itm3').answer.value");

        cy.get('@fifthVariable').find('td:nth-child(1)').should('have.text', 'e_easy_path_exp');
        cy.get('@fifthVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@fifthVariable').find('td:nth-child(3)').should('have.text', '1');
      });

      it('should create, edit, and delete variables', () => {
        // Add a new item under the 'Race' item of data type 'display'.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Variables');
        cy.selectDataType('integer');

        // Click the 'Create/edit variables' button and add three new variables
        cy.get('button#editVariables').click();
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
          cy.get('input#simple-expression-0').type('10');

          // Add a new variable 'b'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 2);
          cy.get('#variable-label-1').clear().type('b');
          cy.get('#variable-type-1').select('Easy Path Expression');
          cy.get('input#simple-expression-1').type('11');

          // Add a new variable 'c'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 3);
          cy.get('#variable-label-2').clear().type('c');
          cy.get('#variable-type-2').select('Easy Path Expression');
          cy.get('input#simple-expression-2').type('12');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });

        // Item Variables section should now show 3 variables
        cy.get('lfb-variable table > tbody > tr').should('have.length', 3);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(1)').as('firstVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(2)').as('secondVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(3)').as('thirdVariable');

        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'a');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', '10');

        cy.get('@secondVariable').find('td:nth-child(1)').should('have.text', 'b');
        cy.get('@secondVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@secondVariable').find('td:nth-child(3)').should('have.text', '11');

        cy.get('@thirdVariable').find('td:nth-child(1)').should('have.text', 'c');
        cy.get('@thirdVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@thirdVariable').find('td:nth-child(3)').should('have.text', '12');

        // Click the 'Create/edit variables' button again to edit variables
        cy.get('button#editVariables').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('#variables-section .variable-row').should('have.length', 3);

          // Rename variable 'a' to 'a1' and assign new value
          cy.get('#variable-label-0').clear().type('a1');
          cy.get('input#simple-expression-0').clear().type('100');

          // Save the changes
          cy.get('#export').click();
        });

        // Check the updated variable
        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'a1');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', '100');

        // Delete second and third variables
        cy.get('@secondVariable').find('td:nth-child(4) button').click();
        // Third variable became second
        cy.get('@secondVariable').find('td:nth-child(4) button').click();

        cy.get('lfb-variable table > tbody > tr').should('have.length', 1);
      });

      it('should display variables correctly on both Item Variables field and when editing expression in Expression Editor', () => {
        // Add a new item under the 'Race' item of data type 'display'.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Compute initial value expression');
        cy.selectDataType('integer');

        cy.get('@computeInitial').should('be.visible').click();
        cy.get('[id^="__\\$initialExpression"]').should('be.empty');
        cy.get('[id^="edit__\\$initialExpression"]').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.expandExpressionItemVariablesSection();

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
        cy.get('[id^="__\\$initialExpression"]').should('have.value', '%a + %b');

        // Item Variables section should now show 2 variables that were created in the Expression Editor
        cy.get('lfb-variable table > tbody > tr').should('have.length', 2);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(1)').as('firstVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(2)').as('secondVariable');

        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'a');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', '1');

        cy.get('@secondVariable').find('td:nth-child(1)').should('have.text', 'b');
        cy.get('@secondVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@secondVariable').find('td:nth-child(3)').should('have.text', '2');

        // Add a new variable from the 'Item Variables' section
        cy.get('button#editVariables').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // Add a new variable 'c'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 3);
          cy.get('#variable-label-2').clear().type('c');
          cy.get('#variable-type-2').select('Easy Path Expression');
          cy.get('input#simple-expression-2').type('3');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });

        // Item Variables section should now show 3 variables
        cy.get('lfb-variable table > tbody > tr').should('have.length', 3);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(3)').as('thirdVariable');

        cy.get('@thirdVariable').find('td:nth-child(1)').should('have.text', 'c');
        cy.get('@thirdVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@thirdVariable').find('td:nth-child(3)').should('have.text', '3');

        // Go back to the Expression Editor to check that the settings are still correct.
        cy.get('[id^="edit__\\$initialExpression"]').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.expandExpressionItemVariablesSection();

          cy.get('#variables-section .variable-row').should('have.length', 3);

          cy.get('#variable-label-0').should('have.value', 'a');
          cy.get('#variable-type-0').should('have.value', 'simple');
          cy.get('input#simple-expression-0').should('have.value', '1');

          cy.get('#variable-label-1').should('have.value', 'b');
          cy.get('#variable-type-1').should('have.value', 'simple');
          cy.get('input#simple-expression-1').should('have.value', '2');

          cy.get('#variable-label-2').should('have.value', 'c');
          cy.get('#variable-type-2').should('have.value', 'simple');
          cy.get('input#simple-expression-2').should('have.value', '3');
        });
      });

      it('should display variables that were added indepently from the expression', () => {
        cy.clickTreeNode('Type Initial Value (Single)');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Compute initial value expression');
        cy.selectDataType('integer');

        cy.get('@computeInitial').should('be.visible').click();
        cy.get('[id^="__\\$initialExpression"]').should('be.empty');
        cy.get('[id^="edit__\\$initialExpression"]').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 0);

          // Output expression
          cy.get('textarea#final-expression').clear().type('1 + 2');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });
        cy.get('[id^="__\\$initialExpression"]').should('have.value', '1 + 2');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[1].extension).to.deep.equal([
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "1 + 2"
              }
            }
          ]);
        });

        // Add variable 'a' via the 'Item Variables' section
        cy.get('button#editVariables').click();
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
          cy.get('input#simple-expression-0').type('30');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });

        // Item Variables section should now show 2 variables that were created in the Expression Editor
        cy.get('lfb-variable table > tbody > tr').should('have.length', 1);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(1)').as('firstVariable');
        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'a');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', '30');

        // Click the 'Create/edit expression' again
        cy.get('[id^="edit__\\$initialExpression"]').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          // Variables section should show variable 'a' that was created prior.
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.expandExpressionItemVariablesSection();

          cy.get('#variables-section .variable-row').should('have.length', 1);

          cy.get('#variable-label-0').should('have.value', 'a');
          cy.get('#variable-type-0').should('have.value', 'simple');
          cy.get('input#simple-expression-0').should('have.value', '30');

          // Update the Output expression to include variable 'a'
          cy.get('textarea#final-expression').clear().type('1 + 2 + %a');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });

        cy.get('[id^="__\\$initialExpression"]').should('have.value', '1 + 2 + %a');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[1].extension).to.deep.equal([
            {
              "url": "http://hl7.org/fhir/StructureDefinition/variable",
              "valueExpression": {
                "name": "a",
                "language": "text/fhirpath",
                "expression": "30",
                "extension": [
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
                    "valueString": "simple"
                  },
                  {
                    "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
                    "valueString": "30"
                  }
                ]
              }
            },
            {
              "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression",
              "valueExpression": {
                "language": "text/fhirpath",
                "expression": "1 + 2 + %a"
              }
            }
          ]);
        });

        // Click the 'Preview' button to see the initial value
        cy.contains('button', 'Preview').click();
        cy.get('wc-lhc-form').should('exist')
          .within(() => {
            // The initial value should show 33
            cy.get('lhc-input > input')
              .eq(1)
              .should('have.value', '33');

          });
      });

      it('should not allow saving an item variable with a missing value and display validation error', () => {
        // Add a new item under the 'None'.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Variable validation');
        cy.selectDataType('integer');

        // Click the 'Create/edit variables' button and add two new variables
        cy.get('button#editVariables').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 0);
          cy.get('lhc-variables div.no-variables').should('contain.text', 'There are currently no variables for this item.');

          // Add a new variable 'a'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 1);
          cy.get('#variable-label-0').clear().type('a');
          cy.get('#variable-type-0').select('Easy Path Expression');
          cy.get('input#simple-expression-0').type('10');

          // Add a new variable 'b'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 2);
          cy.get('#variable-label-1').clear().type('b');
          cy.get('#variable-type-1').select('Easy Path Expression');
          // Intentionally not filling the value

          // Save (Export)
          cy.get('#export').click();

          // The validation should fail and display the error.
          cy.get('input#simple-expression-1')
            .should('have.class', 'field-error')
            .should('have.class', 'ng-invalid');

          // Check for error message in lhc-question with ng-reflect-index="1"
          cy.get('lhc-syntax-converter#variable-expression-1').within(() => {
            cy.get('div#expression-error > p').should('contain.text', 'Expression is required.');
          });

          // The Save button should be disabled
          cy.get('button#export').should('have.class', 'disabled');
        });
      });

      it('should display type as blank if the item does not contains custom variable type extension', () => {
        cy.clickTreeNode('Compute Initial Value with variables without custom expression-editor-variable-type');

        // Item Variables section should now show 2 variables
        cy.get('lfb-variable table > tbody > tr').should('have.length', 2);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(1)').as('firstVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(2)').as('secondVariable');

        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'a');
        // The type column should be blank.
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', '');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', "1");

        cy.get('@secondVariable').find('td:nth-child(1)').should('have.text', 'b');
        // The type column should be blank.
        cy.get('@secondVariable').find('td:nth-child(2)').should('have.text', '');
        cy.get('@secondVariable').find('td:nth-child(3)').should('have.text', "2");

        // Click the 'Create/edit variables' button
        cy.get('button#editVariables').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 2);

          cy.get('#variable-label-0').should('have.value', 'a');
          cy.get('#variable-type-0').should('have.value', 'simple');
          cy.get('input#simple-expression-0').should('have.value', '1');

          cy.get('#variable-label-1').should('have.value', 'b');
          cy.get('#variable-type-1').should('have.value', 'simple');
          cy.get('input#simple-expression-1').should('have.value', '2');

          // Save (Export) should output the questionnaire for the given Variable Type
          cy.get('#export').click();
        });

        // Clicking export results in the custom expression-editor-variable-type to be added into the extension.
        // As a result, the type will now show in the Type column.
        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'a');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', "1");

        cy.get('@secondVariable').find('td:nth-child(1)').should('have.text', 'b');
        cy.get('@secondVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@secondVariable').find('td:nth-child(3)').should('have.text', "2");

      });

      it('should delete all variables and verify none remain', () => {
        // Add a new item under the 'None'.
        cy.clickTreeNode('None');
        cy.contains('Add new item').scrollIntoView().click();
        cy.getItemTextField().clear().type('Deleting Variables');
        cy.selectDataType('integer');

        // Click the 'Create/edit variables' button and add three new variables
        cy.get('button#editVariables').click();
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
          cy.get('input#simple-expression-0').type('10');

          // Add a new variable 'b'
          cy.get('#add-variable').click();
          cy.get('#variables-section .variable-row').should('have.length', 2);
          cy.get('#variable-label-1').clear().type('b');
          cy.get('#variable-type-1').select('Easy Path Expression');
          cy.get('input#simple-expression-1').type('11');

          // Save (Export)
          cy.get('#export').click();
        });

        // Item Variables section should now show 2 variables
        cy.get('lfb-variable table > tbody > tr').should('have.length', 2);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(1)').as('firstVariable');
        cy.get('lfb-variable table > tbody > tr:nth-of-type(2)').as('secondVariable');

        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'a');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', '10');

        cy.get('@secondVariable').find('td:nth-child(1)').should('have.text', 'b');
        cy.get('@secondVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@secondVariable').find('td:nth-child(3)').should('have.text', '11');

        // Click the 'Create/edit variables' button again
        cy.get('button#editVariables').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 2);

          // Delete the 1st variable
          cy.get('button#remove-variable-0').click();
          cy.get('#variables-section .variable-row').should('have.length', 1);

          // Save (Export)
          cy.get('#export').click();
        });

        // Item Variables section should now show 1 variable
        cy.get('lfb-variable table > tbody > tr').should('have.length', 1);
        cy.get('lfb-variable table > tbody > tr:nth-of-type(1)').as('firstVariable');

        cy.get('@firstVariable').find('td:nth-child(1)').should('have.text', 'b');
        cy.get('@firstVariable').find('td:nth-child(2)').should('have.text', 'Easy Path Expression');
        cy.get('@firstVariable').find('td:nth-child(3)').should('have.text', '11');

        // Click the 'Create/edit variables' button again
        cy.get('button#editVariables').click();
        cy.get('lhc-expression-editor').shadow().within(() => {
          cy.get('#expression-editor-base-dialog').should('exist');

          // Variables section
          cy.get('lhc-variables > h2').should('contain', 'Item Variables');
          cy.get('#variables-section .variable-row').should('have.length', 1);

          // Delete the variable
          cy.get('button#remove-variable-0').click();
          cy.get('#variables-section .variable-row').should('have.length', 0);

          // Save (Export)
          cy.get('#export').click();
        });

        // Item Variables section should now be empty
        cy.get('lfb-variable table > tbody > tr').should('not.exist');
      });
    });
  });
});