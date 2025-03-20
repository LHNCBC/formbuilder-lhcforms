/// <reference types="cypress" />

import {Util} from '../../../src/app/lib/util';
import {CypressUtil} from '../../support/cypress-util';
import {ExtensionDefs} from "../../../src/app/lib/extension-defs";

const olpExtUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationLinkPeriod';
const observationExtractExtUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationExtract';
const ucumUrl = 'http://unitsofmeasure.org';
const snomedEclText =
  '< 429019009 |Finding related to biological sex|';

describe('Home page', () => {
  beforeEach(CypressUtil.mockSnomedEditions);

  beforeEach(() => {
    cy.loadHomePage();
  });

  describe('Item level fields', () => {
    const helpTextExtension = [{
      url: Util.ITEM_CONTROL_EXT_URL,
      valueCodeableConcept: {
        text: 'Help-Button',
        coding: [{
          code: 'help',
          display: 'Help-Button',
          system: 'http://hl7.org/fhir/questionnaire-item-control'
        }]
      }
    }];

    beforeEach(() => {
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.get('button').contains('Continue').click();
      cy.contains('button', 'Create questions').click();
      cy.get('#text').should('have.value', 'Item 0', {timeout: 10000});
      cy.get('#type').as('type');
      cy.contains('.node-content-wrapper', 'Item 0').as('item0');
      cy.get('.btn-toolbar').contains('button', 'Add new item').as('addNewItem');
      cy.get('input[id^="__\\$helpText\\.text"]').as('helpText');
      cy.contains('div', 'Question code').as('codeOption').should('be.visible');
      cy.get('@codeOption').find('[for^="booleanRadio_true"]').as('codeYes'); // Radio label for clicking
      cy.get('@codeOption').find('[for^="booleanRadio_false"]').as('codeNo'); // Radio label for clicking
      cy.get('@codeOption').find('[id^="booleanRadio_true"]').as('codeYesRadio'); // Radio input for assertions
      cy.get('@codeOption').find('[id^="booleanRadio_false"]').as('codeNoRadio'); // Radio input for assertions

      cy.get('.spinner-border').should('not.exist');
    });

    it('should display item editor page', () => {
      cy.get('tree-root tree-viewport tree-node-collection tree-node').first().should('be.visible');
      cy.get('@codeYes').click();
      cy.get('[id^="code.0.code"]').as('code');
      cy.get('@code').should('be.visible');
      cy.get('@codeNo').click();
      cy.get('@code').should('not.exist');

      cy.contains('Add new item').scrollIntoView().click();
      cy.get('tree-root tree-viewport tree-node-collection tree-node').last().find('tree-node-content div span').eq(1).should('have.text', 'New item 1');
      cy.contains('Delete this item').scrollIntoView().click();
      cy.contains('button', 'Yes').click();
      cy.get('tree-root tree-viewport tree-node-collection tree-node').last().find('tree-node-content div span').eq(1).should('have.text', 'Item 0');

      const helpString = 'Test help text!';
      cy.get('@helpText').click();
      cy.get('@helpText').type(helpString);
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].text).equal(helpString);
        expect(qJson.item[0].item[0].type).equal('display');
        expect(qJson.item[0].item[0].extension).to.deep.equal(helpTextExtension);
      });

    });

    it('should include code only when use question code is yes', () => {
      cy.get('@codeOption').includeExcludeCodeField();
    });

    it('should create codes at item level', () => {
      CypressUtil.assertCodeField('/item/0/code');
    });

    it('should import form with nested extensions', () => {
      const sampleFile = 'nested-extension-sample.json';
      let fixtureJson = null;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((json) => {
        expect(json.item[0].extension[0].extension[0].extension[0].valueDecimal).to.equal(1.1);
        expect(json.item[0].extension[0].extension[1].extension[0].valueString).to.equal('Nested item: 1/2/1');
        expect(json.item[0].extension[0].extension[1].extension[1].valueString).to.equal('Nested item: 1/2/2');
        expect(json.extension[0].extension[0].extension[0].valueString).to.equal('Form level extension: 1/1/1');
        expect(json).to.deep.equal(fixtureJson);
      });
    });

    it('should import item from CTSS with answer option', () => {
      cy.contains('Add new item from LOINC').scrollIntoView().click();
      cy.contains('ngb-modal-window label', 'Question').click();
      cy.get('#acSearchBoxId').type('vital signs assess');
      cy.get('ngb-typeahead-window button').first().click();
      cy.contains('ngb-modal-window div.modal-dialog button', 'Add').click();
      cy.get('#type option:selected').should('have.text', 'coding');
      cy.getRadioButton('Create answer list', 'Yes').should('be.checked');

      cy.get('[id^="answerOption.0.valueCoding.display"]').should('have.value', 'Within Defined Limits');
      cy.get('[id^="answerOption.0.valueCoding.code"]').should('have.value', 'LA25085-4');
      cy.get('[id^="answerOption.0.valueCoding.system"]').should('have.value', 'http://loinc.org');
      cy.get('[id^="answerOption.1.valueCoding.display"]').should('have.value', 'Other');
      cy.get('[id^="answerOption.1.valueCoding.code"]').should('have.value', 'LA46-8');
      cy.get('[id^="answerOption.1.valueCoding.system"]').should('have.value', 'http://loinc.org');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[1].answerOption).to.deep.equal([
          {
            valueCoding: {
              system: 'http://loinc.org',
              code: 'LA25085-4',
              display: 'Within Defined Limits'
            }
          },{
            valueCoding: {
              system: 'http://loinc.org',
              code: 'LA46-8',
              display: 'Other'
            }
          }]);
      });
    });

    it('should not overwrite previous tree node, when clicked before updating the editor', () => {
      const {_, $} = Cypress;
      cy.contains('button', 'Import').click();
      cy.get('form > input[placeholder="Search LOINC"]').type('vital signs, weight & height panel{downArrow}');
      cy.contains('ngb-typeahead-window button', /vital signs, weight & height panel/i).click();
      cy.get('div.spinner-border').should('not.exist');
      cy.contains('ngb-modal-window button', 'Continue').click();
      cy.contains('#itemContent span', 'Vital Signs Pnl');
      cy.toggleTreeNodeExpansion('Vital Signs Pnl'); // Expand node
      cy.get('tree-root tree-viewport tree-node-collection tree-node span').then(($spans) => {
        return _.filter($spans.get(), (el) => {
          return $(el).text().match(/Resp rate|Heart rate/i);
        });
      }).click({multiple: true, force: true});
      // Click the two nodes rapidly. Sometimes tooltip lingers, force through it.

      cy.get('#text').should('have.value', 'Resp rate'); // Bugfix - Should not be Heart rate
      cy.getTreeNode('Heart rate').click();
      cy.get('#text').should('have.value', 'Heart rate'); // This node should still exist.
    });

    it('should show correct focused node on the sidebar tree after updating the form from FHIR server', () => {
      const fixture = 'sidebar-node-highlighting-form.R4.json';
      const fhirServer = 'https://lforms-fhir.nlm.nih.gov/baseR4';
      let responseStub = null;
      CypressUtil.setupStub(fixture, {
        // Use the following fields in the server response.
        id: '1111',
        meta: {
          versionId: "1",
          lastUpdated: "2020-02-22T22:22:22.222-00:00"
        }
      }).then((resp) => {
        responseStub = resp.responseStub;
      });
      cy.intercept('POST', fhirServer+'/Questionnaire', (req) => {
        req.reply({statusCode: 201, body: responseStub});
      }).as('create');

      cy.uploadFile(fixture, true);

      cy.contains('button', 'Edit questions').click();
      cy.clickTreeNode('Second item'); // Load other than first item.

      cy.FHIRServerResponse('Create a new questionnaire', fhirServer).should((json) => {
        expect(json).to.deep.equal(responseStub);
      });
      cy.wait('@create');
      // The fix should load the same item as selected before, i.e. second item.
      cy.get('#text').should('have.value', 'Second item');
      cy.getTreeNode('First item').parents('div.node-content-wrapper').first().as('firstItem');
      cy.get('@firstItem').should('not.have.class', 'node-content-wrapper-focused');
      cy.get('@firstItem').should('not.have.class', 'node-content-wrapper-active');

      cy.getTreeNode('Second item').parents('div.node-content-wrapper').first().as('secondItem');
      cy.get('@secondItem').should('have.class', 'node-content-wrapper-active');
    });

    it('should delete items', () => {
      const nestedItemsFilename = 'nested-items-delete-sample.json';
      cy.uploadFile(nestedItemsFilename, true);
      cy.contains('button', 'Edit questions').click();
      cy.get('#text').should('have.value', 'One (group)');

      // Expand the tree
      cy.toggleTreeNodeExpansion('One (group)');
      cy.toggleTreeNodeExpansion('One dot seven (group): last sibling');
      cy.toggleTreeNodeExpansion('Two (group): last sibling');
      cy.toggleTreeNodeExpansion('Two dot four (group)');

      cy.getTreeNode('Two dot four dot two').click(); // Pick a starting point somewhere in the middle
      // Order of nodes loading into the editor after clicking the delete button.
      [
        'Two dot four dot two',
        'Two dot four dot three',
        'Two dot four dot four: last sibling',
        'Two dot four dot one',
        'Two dot four (group)',
        'Two dot five',
        'Two dot six',
        'Two dot seven',
        'Two dot eight',
        'Two dot nine (group): last sibling',
        'Two dot three',
        'Two dot two',
        'Two dot one',
        'Two (group): last sibling',
        'One (group)',
      ].forEach((itemText) => {
        cy.get('#text').should('have.value', itemText);
        cy.contains('button', 'Delete this item').click();
        cy.contains('button', 'Yes').click();
      });

      // All nodes are deleted.
      cy.get('lfb-sf-form-wrapper div.container-fluid p')
        .should('have.text', 'No items in the form. Add an item to continue.');
    });

    describe('Boolean fields', () => {
      const readOnlyLabel = 'Read only';
      const repeatsLabel = 'Allow repeating question?';
      const requiredLabel = 'Answer required';

      it('should test options for boolean field', () => {
        cy.getBooleanInput(readOnlyLabel, 'null').should('be.checked');
        cy.getBooleanInput(readOnlyLabel, 'false').should('not.be.checked');

        cy.booleanFieldClick(readOnlyLabel, 'false');

        cy.getBooleanInput(readOnlyLabel, 'null').should('not.be.checked');
        cy.getBooleanInput(readOnlyLabel, 'false').should('be.checked');
        cy.getBooleanInput(repeatsLabel, 'null').should('be.checked');
        cy.getBooleanInput(repeatsLabel, 'false').should('not.be.checked');

        cy.questionnaireJSON((json) => {
          expect(json.item[0].readOnly).toBeFalsy()
          expect(json.item[0].repeats).toBeUndefined();
        });
        cy.booleanFieldClick(readOnlyLabel, 'null');
        cy.questionnaireJSON((json) => {
          expect(json.item[0].readOnly).toBeUndefined();
          expect(json.item[0].repeats).toBeUndefined();
        });
        cy.booleanFieldClick(readOnlyLabel, 'false');
        cy.questionnaireJSON((json) => {
          expect(json.item[0].readOnly).toBeFalsy()
          expect(json.item[0].repeats).toBeUndefined();
        });
      });

      it('should import items with boolean fields', () => {
        const importFile = 'boolean-fields-sample.json';
        cy.uploadFile(importFile, true);
        cy.contains('button', 'Edit questions').click();

        cy.getInitialValueBooleanInput('null').should('be.checked');
        cy.getBooleanInput(readOnlyLabel, 'true').should('be.checked');
        cy.getBooleanInput(requiredLabel, 'false').should('be.checked');
        cy.getBooleanInput(repeatsLabel, 'null').should('be.checked');

        cy.getTreeNode('Item 1').click();

        cy.getInitialValueBooleanInput('true').should('be.checked');
        cy.getBooleanInput(readOnlyLabel, 'false').should('be.checked');
        cy.getBooleanInput(requiredLabel, 'true').should('be.checked');
        cy.getBooleanInput(repeatsLabel, 'false').should('be.checked');

        cy.getTreeNode('Item 2').click();

        cy.getInitialValueBooleanInput('false').should('be.checked');
        cy.getBooleanInput(readOnlyLabel, 'null').should('be.checked');
        cy.getBooleanInput(requiredLabel, 'null').should('be.checked');
        cy.getBooleanInput(repeatsLabel, 'true').should('be.checked');

        cy.questionnaireJSON((json) => {
          expect(json.item[0].initial[0].valueBoolean).toBeUndefined();
          expect(json.item[0].readOnly).toBeTruthy();
          expect(json.item[0].required).toBeFalsy();
          expect(json.item[0].repeats).toBeUndefined();
          expect(json.item[1].initial[0].valueBoolean).toBeTruthy();
          expect(json.item[1].readOnly).toBeFalsy();
          expect(json.item[1].required).toBeTruthy();
          expect(json.item[1].repeats).toBeFalsy();
          expect(json.item[2].initial[0].valueBoolean).toBeFalsy();
          expect(json.item[2].readOnly).toBeUndefined();
          expect(json.item[2].required).toBeUndefined();
          expect(json.item[2].repeats).toBeTruthy();
        });
      });
    });

    describe('Insert new item using sidebar tree node context menu', () => {
      beforeEach(() => {
        cy.getTreeNode('Item 0').as('contextNode');
        cy.get('@contextNode').find('span.node-display-prefix').should('have.text', '1');
        cy.get('@contextNode').find('button.dropdown-toggle').click();
      });

      afterEach(() => {
        cy.getTreeNode('New item 1').as('contextNode');
        cy.get('@contextNode').find('button.dropdown-toggle').click();
        cy.get('div.dropdown-menu.show').should('be.visible');
        cy.contains('button.dropdown-item', 'Remove this item').click({force: true});
        cy.contains('button', 'Yes').click();
      });

      it('should insert before context node using sidebar tree node context menu', () => {
        cy.contains('button.dropdown-item', 'Insert a new item before').click();
        cy.get('#text').should('have.value', 'New item 1');
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '1');
      });

      it('should insert after context node using sidebar tree node context menu', () => {
        cy.contains('button.dropdown-item', 'Insert a new item after').click();
        cy.get('#text').should('have.value', 'New item 1');
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '2');
      });

      it('should insert a child of context node using sidebar tree node context menu', () => {
        cy.contains('button.dropdown-item', 'Insert a new child item').click();
        cy.get('#text').should('have.value', 'New item 1');
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '1.1');
      });
    });

    describe('Move context node using sidebar tree node context menu', () => {
      beforeEach(() => {
        cy.contains('button', 'Add new item').click();
        cy.contains('button', 'Add new item').click();
        cy.contains('button', 'Add new item').click();
        cy.getTreeNode('New item 1').as('node1');
        cy.getTreeNode('New item 2').as('node2');
        cy.getTreeNode('New item 3').as('node3');
        cy.getTreeNode('Item 0').click();

        cy.getTreeNode('Item 0').find('span.node-display-prefix').should('have.text', '1');
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '2');
        cy.getTreeNode('New item 2').find('span.node-display-prefix').should('have.text', '3');
        cy.getTreeNode('New item 3').find('span.node-display-prefix').should('have.text', '4');

        cy.getTreeNode('Item 0').find('button.dropdown-toggle').click();
        cy.get('div.dropdown-menu.show').contains('button.dropdown-item', 'Move this item').click();
        cy.get('lfb-node-dialog').contains('button', 'Move').as('moveBtn');
        cy.get('@moveBtn').should('be.disabled');
        cy.get('lfb-node-dialog').find('#moveTarget1').click().type('{downarrow}{enter}');

      });

      afterEach(() => {
        cy.resetForm();
        cy.contains('button', 'Create questions').click();
      });

      it('should move after a target node', () => {
        cy.get('input[type="radio"][value="AFTER"]').should('be.checked');
        cy.get('@moveBtn').should('not.be.disabled').click();
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '1');
        cy.getTreeNode('New item 2').find('span.node-display-prefix').should('have.text', '2');
        cy.getTreeNode('Item 0').find('span.node-display-prefix').should('have.text', '3');
        cy.getTreeNode('New item 3').find('span.node-display-prefix').should('have.text', '4');
      });

      it('should move before a target node', () => {
        cy.get('input[type="radio"][value="BEFORE"]').click();
        cy.get('@moveBtn').should('not.be.disabled').click();
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '1');
        cy.getTreeNode('Item 0').find('span.node-display-prefix').should('have.text', '2');
        cy.getTreeNode('New item 2').find('span.node-display-prefix').should('have.text', '3');
        cy.getTreeNode('New item 3').find('span.node-display-prefix').should('have.text', '4');
      });

      it('should move as a child of a target', () => {
        cy.get('input[type="radio"][value="CHILD"]').click();
        cy.get('@moveBtn').should('not.be.disabled').click();
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '1');
        cy.getTreeNode('New item 2').find('span.node-display-prefix').should('have.text', '2');
        cy.getTreeNode('Item 0').find('span.node-display-prefix').should('have.text', '2.1');
        cy.getTreeNode('New item 3').find('span.node-display-prefix').should('have.text', '3');
      });
    });

    describe('Copy context node using sidebar tree node context menu', () => {
      beforeEach(() => {
        cy.contains('button', 'Add new item').click();
        cy.contains('button', 'Add new item').click();
        cy.contains('button', 'Add new item').click();
        cy.getTreeNode('New item 1').as('node1');
        cy.getTreeNode('New item 2').as('node2');
        cy.getTreeNode('New item 3').as('node3');
        cy.getTreeNode('Item 0').click();

        cy.getTreeNode('Item 0').find('span.node-display-prefix').should('have.text', '1');
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '2');
        cy.getTreeNode('New item 2').find('span.node-display-prefix').should('have.text', '3');
        cy.getTreeNode('New item 3').find('span.node-display-prefix').should('have.text', '4');

        cy.getTreeNode('Item 0').find('button.dropdown-toggle').click();
        cy.get('div.dropdown-menu.show').contains('button.dropdown-item', 'Copy this item').click();
        cy.get('lfb-node-dialog').contains('button', 'Copy').as('copyBtn');
        cy.get('@copyBtn').should('be.disabled');
        cy.get('lfb-node-dialog').find('#moveTarget1').click().type('{downarrow}{enter}');

      });

      afterEach(() => {
        cy.resetForm();
        cy.contains('button', 'Create questions').click();
      });

      it('should copy after a target node', () => {
        cy.get('input[type="radio"][value="AFTER"]').should('be.checked');
        cy.get('@copyBtn').should('not.be.disabled').click();
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '2');
        cy.getTreeNode('New item 2').find('span.node-display-prefix').should('have.text', '3');
        cy.getTreeNode('Copy of Item 0').find('span.node-display-prefix').should('have.text', '4');
        cy.getTreeNode('New item 3').find('span.node-display-prefix').should('have.text', '5');
      });

      it('should copy before a target node', () => {
        cy.get('input[type="radio"][value="BEFORE"]').click();
        cy.get('@copyBtn').should('not.be.disabled').click();
        cy.getTreeNode('Copy of Item 0').find('span.node-display-prefix').should('have.text', '3');
      });

      it('should copy as a child of a target', () => {
        cy.get('input[type="radio"][value="CHILD"]').click();
        cy.get('@copyBtn').should('not.be.disabled').click();
        cy.getTreeNode('Item 0').find('span.node-display-prefix').should('have.text', '1');
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '2');
        cy.getTreeNode('New item 2').find('span.node-display-prefix').should('have.text', '3');
        cy.getTreeNode('New item 3').find('span.node-display-prefix').should('have.text', '4');
      });
    });

    it('should restrict to integer input in integer field', () => {
      cy.selectDataType('integer');
      cy.get('[id^="initial.0.valueInteger"]').as('initIntField');
      cy.get('@initIntField').clear().type('abc').should('have.value', '');
      cy.get('@initIntField').clear().type('12abc').should('have.value', '12');
      cy.get('@initIntField').clear().type('3.4').should('have.value', '34');
      cy.get('@initIntField').clear().type('-5.6').should('have.value', '-56');
      cy.get('@initIntField').clear().type('-0').should('have.value', '-0');
      cy.get('@initIntField').clear().type('-2-4-').should('have.value', '-24');
      cy.get('@initIntField').clear().type('24e1').should('have.value', '241');
      cy.get('@initIntField').clear().type('-24E1').should('have.value', '-241');
    });

    it('should restrict to decimal input in number field', () => {
      cy.selectDataType('decimal');
      cy.get('[id^="initial.0.valueDecimal"]').as('initNumberField');
      cy.get('@initNumberField').clear().type('abc').should('have.value', '');
      cy.get('@initNumberField').clear().type('12abc').should('have.value', '12');
      cy.get('@initNumberField').clear().type('3.4').should('have.value', '3.4');
      cy.get('@initNumberField').clear().type('-5.6').should('have.value', '-5.6');
      cy.get('@initNumberField').clear().type('-7.8ab').should('have.value', '-7.8');
      cy.get('@initNumberField').clear().type('-xy0.9ab').should('have.value', '-0.9');
    });

    it('should add answer-option', () => {
      cy.addAnswerOptions();
    });

    it('should add initial values', () => {
      cy.selectDataType('string');
      cy.get('[id^="initial.0.valueString"]').type('initial string');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('string');
        expect(qJson.item[0].initial[0].valueString).equal('initial string');
      });
      cy.selectDataType('decimal');
      cy.get('[id^="initial.0.valueDecimal"]').type('100.1');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].initial[0].valueDecimal).equal(100.1);
      });

      cy.selectDataType('integer');
      cy.get('[id^="initial.0.valueInteger"]').as('initialInteger');
      cy.get('@initialInteger').type('100');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('integer');
        expect(qJson.item[0].initial[0].valueDecimal).undefined;
        expect(qJson.item[0].initial[0].valueInteger).equal(100);
      });

      cy.get('@initialInteger').clear().type('1.1');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('integer');
        expect(qJson.item[0].initial[0].valueDecimal).undefined;
        expect(qJson.item[0].initial[0].valueInteger).not.undefined;
        // TODO -
        //  There is a bug in IntegerComponent, which moves the cursor to starting position
        // when '.' is entered, although
        // Refer to issue LF-2485.
        expect(qJson.item[0].initial[0].valueInteger).not.undefined;
      });

      cy.selectDataType('coding');
      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
      cy.get('[id^="initial"]').should('not.exist');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('coding');
        expect(qJson.item[0].answerConstraint).equal('optionsOnly');
        expect(qJson.item[0].initial).to.be.undefined;
      });

    });

    it('should import item with answer option', () => {
      const sampleFile = 'answer-option-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.get('#title').should('have.value', 'Answer options form');
      cy.contains('button', 'Edit questions').click();
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(1)').as('firstOption');
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(2)').as('secondOption');

      cy.get('@firstOption').find('td:nth-child(1) input').should('have.value', 'd1');
      cy.get('@firstOption').find('td:nth-child(2) input').should('have.value', 'a');
      cy.get('@firstOption').find('td:nth-child(3) input').should('have.value', 's');
      cy.get('@firstOption').find('td:nth-child(4) input').should('have.value', '1');
      cy.get('@firstOption').find('td:nth-child(5) input').should('be.visible').and('not.be.checked');
      cy.get('@secondOption').find('td:nth-child(1) input').should('have.value', 'd2');
      cy.get('@secondOption').find('td:nth-child(2) input').should('have.value', 'b');
      cy.get('@secondOption').find('td:nth-child(3) input').should('have.value', 's');
      cy.get('@secondOption').find('td:nth-child(4) input').as('secondScore')
        .should('have.value', '2');
      cy.get('@secondOption').find('td:nth-child(5) input').as('secondDefaultRadio')
        .should('be.visible').and('be.checked');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerOption).to.deep.equal(fixtureJson.item[0].answerOption);
      });

      cy.get('@secondScore').clear().type('22');
      cy.get('lfb-answer-option table+button').click();
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(3)').as('thirdOption').should('be.visible');
      cy.get('@thirdOption').find('td:nth-child(1) input').type('d3');
      cy.get('@thirdOption').find('td:nth-child(2) input').type('c');
      cy.get('@thirdOption').find('td:nth-child(3) input').type('s');
      cy.get('@thirdOption').find('td:nth-child(4) input').type('33');
      cy.get('@thirdOption').find('td:nth-child(5) input').as('thirdDefaultRadio').click();

      const SCORE_URI = 'http://hl7.org/fhir/StructureDefinition/itemWeight';
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerOption).to.deep.equal([
          {
            valueCoding: {display: 'd1', code: 'a', system: 's'},
            extension: [{url: SCORE_URI, valueDecimal: 1}]
          },
          {
            valueCoding: {display: 'd2', code: 'b', system: 's'},
            extension: [{url: SCORE_URI, valueDecimal: 22}]
          },
          {
            valueCoding: {display: 'd3', code: 'c', system: 's'},
            extension: [{url: SCORE_URI, valueDecimal: 33}],
            initialSelected: true
          },
       ]);
      });
    });

    it('should fix a bug in messing up default selections when switched to another node', () => {
      const sampleFile = 'answer-option-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.get('#title').should('have.value', 'Answer options form');
      cy.contains('button', 'Edit questions').click();
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(1)').as('firstOption')
        .find('[id^="radio_answerOption."]').as('firstRadioDefault');
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(2)').as('secondOption')
        .find('[id^="radio_answerOption."]').as('secondRadioDefault');

      // First item's default is second option
      cy.get('@secondRadioDefault').should('be.checked');
      // Switch to second item
      cy.clickTreeNode('Item 2 with answer option');
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(3)').as('thirdOption')
        .find('[id^="radio_answerOption."]').as('thirdRadioDefault');
      // Second item has no defaults
      cy.get('@firstRadioDefault').should('not.be.checked');
      cy.get('@secondRadioDefault').should('not.be.checked');
      cy.get('@thirdRadioDefault').should('not.be.checked');

      // Select first option in second item.
      cy.get('@firstRadioDefault').click();
      // Switch to first item
      cy.clickTreeNode('Item with answer option');
      // First item's default should be intact.
      cy.get('@secondRadioDefault').should('be.checked');
      // Switch to second item
      cy.clickTreeNode('Item 2 with answer option');
      // Second item's default is first option.
      cy.get('@firstRadioDefault').should('be.checked');
    });

    it('should clear all default selections', () => {
      const repeatsLabel = 'Allow repeating question?';
      const sampleFile = 'answer-option-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.get('#title').should('have.value', 'Answer options form');
      cy.contains('button', 'Edit questions').click();

      // Switch to second item
      cy.clickTreeNode('Item 2 with answer option');
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(1)').as('firstOption')
        .find('[id^="radio_answerOption."]').as('firstRadioDefault');
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(2)').as('secondOption')
        .find('[id^="radio_answerOption."]').as('secondRadioDefault');
      cy.get('lfb-answer-option table > tbody > tr:nth-of-type(3)').as('thirdOption')
        .find('[id^="radio_answerOption."]').as('thirdRadioDefault');
      // Second item has no defaults
      cy.get('@firstRadioDefault').should('not.be.checked');
      cy.get('@secondRadioDefault').should('not.be.checked');
      cy.get('@thirdRadioDefault').should('not.be.checked');

      // Select third option in second item.
      cy.get('@thirdRadioDefault').click();
      cy.get('@thirdRadioDefault').should('be.checked');

      // Click the "Unselect" button to clear selection(s)
      cy.contains('button i', 'backspace').should('exist').click();

      // Items should be unselected.
      cy.get('@firstRadioDefault').should('not.be.checked');
      cy.get('@secondRadioDefault').should('not.be.checked');
      cy.get('@thirdRadioDefault').should('not.be.checked');

      // Set the 'Allow repeating question?' to 'Yes'.
      cy.getRadioButtonLabel(repeatsLabel, 'Yes').click();
      cy.getRadioButton(repeatsLabel, 'Yes').should('be.checked');

      cy.get('@firstOption')
        .find('[id^="checkbox_answerOption."]').as('firstCheckboxDefault');
      cy.get('@secondOption')
        .find('[id^="checkbox_answerOption."]').as('secondCheckboxDefault');
      cy.get('@thirdOption')
        .find('[id^="checkbox_answerOption."]').as('thirdCheckboxDefault');

      // Items should be unchecked.
      cy.get('@firstCheckboxDefault').should('not.be.checked');
      cy.get('@secondCheckboxDefault').should('not.be.checked');
      cy.get('@thirdCheckboxDefault').should('not.be.checked');

      // Select second and third option in second item.
      cy.get('@secondCheckboxDefault').click();
      cy.get('@secondCheckboxDefault').should('be.checked');
      cy.get('@thirdCheckboxDefault').click();
      cy.get('@thirdCheckboxDefault').should('be.checked');

      // Click the "Unselect" button to clear selection(s)
      cy.contains('button i', 'backspace').should('exist').click();

      // Items should be unchecked.
      cy.get('@firstCheckboxDefault').should('not.be.checked');
      cy.get('@secondCheckboxDefault').should('not.be.checked');
      cy.get('@thirdCheckboxDefault').should('not.be.checked');
    });

    it('should fix initial input box when switched data type from coding to decimal', () => {
      const sampleFile = 'initial-component-bugfix.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.get('#title').should('have.value', 'Sample to test initial component error');
      cy.contains('button', 'Edit questions').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].answerOption).to.deep.equal(fixtureJson.item[0].item[0].answerOption);
      });

      cy.toggleTreeNodeExpansion('Group item 1');
      cy.getTreeNode('Choice item 1.1').click();
      cy.get('@type').find(':selected').should('have.text', 'coding');
      cy.getRadioButton('Create answer list', 'Yes').should('be.checked');
      cy.get('[id^="answerOption."]').should('be.visible');
      cy.get('[id^="initial"]').should('not.exist');
      cy.get('[id^="radio_answerOption.1"]').should('be.checked', true);
      cy.selectDataType('decimal');
      cy.get('[id^="answerOption."]').should('not.exist');
      cy.get('[id^="initial.0.valueDecimal"]').should('be.visible').type('1.2');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].initial[0].valueDecimal).equal(1.2);
      });
    });

    it('should create answerValueSet', () => {
      cy.selectDataType('coding');
      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
      cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
      cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('not.be.checked');
      cy.get('#answerValueSet_non-snomed').should('not.exist');
      cy.get('lfb-answer-option').should('be.visible');

      cy.get('[for^="__\\$answerOptionMethods_value-set"]').click();
      cy.get('#answerValueSet_non-snomed').should('be.visible');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('#answerValueSet_non-snomed').type('http://example.org');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).equal('http://example.org');
        expect(q.item[0].answerOption).to.be.undefined;
      });

      cy.get('[for^="__\\$answerOptionMethods_answer-option"]').click();
      cy.get('#answerValueSet_non-snomed').should('not.exist');
      cy.get('lfb-answer-option').should('be.visible');
      const aOptions = [
        {display: 'display 1', code: 'c1', system: 's1'},
        {display: 'display 2', code: 'c2', system: 's2'}
      ];
      cy.enterAnswerOptions(aOptions);
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).to.be.undefined;
        expect(q.item[0].answerOption[0].valueCoding).to.deep.equal(aOptions[0]);
        expect(q.item[0].answerOption[1].valueCoding).to.deep.equal(aOptions[1]);
      });
    });

    it('should import a form with an item having answerValueSet', () => {
      cy.uploadFile('answer-value-set-sample.json', true);
      cy.get('#title').should('have.value', 'Answer value set form');
      cy.contains('button', 'Edit questions').click();
      cy.get('#type option:selected').should('have.text', 'coding');
      cy.get('lfb-label')
        .filter(':contains("Create answer list")')
        .parent()
        .find('label:contains("Yes")')
        .prev('input[type="radio"]')
        .should('be.checked');
      // cy.get('[id^="answerConstraint_optionsOnly"]').should('be.checked');
      cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('not.be.checked');
      cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('be.checked');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('#answerValueSet_non-snomed').should('have.value','http://example.org');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerValueSet).to.equal('http://example.org');
      });
    });

    it('should create SNOMED CT answerValueSet', () => {
      const eclSel = '#answerValueSet_ecl';
      cy.selectDataType('coding');
      cy.getRadioButtonLabel('Create answer list', 'Yes').click();
      cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
      cy.get('[for^="__\\$answerOptionMethods_value-set"]').as('nonSnomedMethod');
      cy.get('[for^="__\\$answerOptionMethods_answer-option"]').as('answerOptionMethod');
      cy.get('[for^="__\\$answerOptionMethods_snomed-value-set"]').as('snomedMethod').click();

      cy.get(eclSel).should('be.visible');
      cy.get(eclSel).parent().parent().parent().as('controlDiv');

      // Expand the Advance Fields
      cy.expandAdvancedFields();
      // The terminology server should be blank
      cy.tsUrl().should('be.visible').should('have.value', '');

      cy.get('lfb-answer-option').should('not.exist');
      cy.get('@controlDiv').find('span.text-break').should('not.exist');
      cy.get(eclSel).type('123');
      cy.get('@controlDiv').click() // Change on eclSel
      cy.get('@controlDiv').find('span.text-break').should('contain.text', 'fhir_vs=ecl%2F123');

      // The terminology server should now have value
      cy.tsUrl().should('have.value', 'https://snowstorm.ihtsdotools.org/fhir');

      // Preserve ecl edited in non-snomed input box
      cy.get('@nonSnomedMethod').click();
      cy.get('#answerValueSet_ecl').should('not.exist');
      cy.get('#answerValueSet_non-snomed').as('asInput').should('be.visible').should('contain.value', 'fhir_vs=ecl%2F123');
      cy.get('@asInput').type('_extra_chars');
      cy.get('@snomedMethod').click();
      cy.get(eclSel).should('have.value', '123_extra_chars');

      // Preserve ECL after going to answerOption and coming back to snomed value set.
      cy.get('@answerOptionMethod').click();
      cy.get(eclSel).should('not.exist');
      cy.get('@snomedMethod').click();
      cy.get(eclSel).should('have.value', '123_extra_chars');

      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).contain('fhir_vs=ecl%2F123_extra_chars');
        expect(q.item[0].answerOption).to.be.undefined;
        const extUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-preferredTerminologyServer';
        expect(CypressUtil.getExtensions(q.item[0], extUrl)).to.deep.equal([{
          url: extUrl,
          valueUrl: 'https://snowstorm.ihtsdotools.org/fhir'
        }]);
      });

      // The terminology server value will be cleared if it contains the default URL and
      // the ECL field is set to empty.
      // Set the terminology server to a non-default URL.
      cy.tsUrl().scrollIntoView().clear().type('https://clinicaltables.nlm.nih.gov/fhir/R4');

      // Clear the ECL
      cy.get(eclSel).clear();
      cy.get('@controlDiv').click() // Change on eclSel

      // The terminology server should not be removed
      cy.tsUrl().should('have.value', 'https://clinicaltables.nlm.nih.gov/fhir/R4');

      // Change the terminology server value back to the Snomed default URL
      cy.tsUrl().scrollIntoView().clear().type('https://snowstorm.ihtsdotools.org/fhir');

      cy.get(eclSel).type('123');
      cy.get('@controlDiv').click() // Change on eclSel
      cy.get(eclSel).clear();
      cy.get('@controlDiv').click() // Change on eclSel

      // The terminology server should now be blank
      cy.tsUrl().should('be.visible').should('have.value', '');

      cy.get('@controlDiv').find('span.text-break').should('not.exist');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).to.be.undefined;
        expect(q.item[0].answerOption).to.be.undefined;
      });
    });

    it('should import a form with an item having SNOMED CT answerValueSet', () => {
      const encodedUriPart = 'fhir_vs='+encodeURIComponent('ecl/' + snomedEclText);

      cy.uploadFile('snomed-answer-value-set-sample.json', true);
      cy.get('#title').should('have.value', 'SNOMED answer value set form');
      cy.contains('button', 'Edit questions').click();

      // First item is with SNOMED CT URI.
      cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('be.checked');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('#answerValueSet_non-snomed').should('not.exist');

      cy.get('#answerValueSet_ecl').as('ecl').should('contain.value',snomedEclText);
      cy.get('#answerValueSet_edition').as('edition')
        .find('option:selected').should('have.text', 'International Edition (900000000000207008)');
      cy.get('#answerValueSet_version').as('version')
        .find('option:selected').should('have.text', '20221231');
      cy.get('@ecl').parent().parent().parent().as('controlDiv');
      cy.get('@controlDiv').find('span').should('contain.text', encodedUriPart);

      // non-snomed answerValueSet
      cy.clickTreeNode('Item with non-snomed');
      cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('be.checked');
      cy.get('#answerValueSet_non-snomed').should('be.visible')
        .should('have.value', 'http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions');
      cy.get('@ecl').should('not.exist');
      cy.get('@edition').should('not.exist');
      cy.get('@version').should('not.exist');
      cy.get('lfb-answer-option').should('not.exist');

      cy.clickTreeNode('Item with answer option');
      cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
      cy.get('lfb-answer-option').should('be.visible');
      cy.get('@ecl').should('not.exist');
      cy.get('@edition').should('not.exist');
      cy.get('@version').should('not.exist');
      cy.get('#answerValueSet_non-snomed').should('not.exist');


      cy.clickTreeNode('Item with SNOMED');
      cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('be.checked');
      cy.clickTreeNode('Item with answer option');
      cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
      cy.get('lfb-answer-option').should('be.visible');
      cy.clickTreeNode('Item with non-snomed');
      cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('be.checked');

      cy.clickTreeNode('Item with SNOMED');
      cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('be.checked');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerValueSet).contain(encodedUriPart);
        expect(qJson.item[1].answerValueSet).contain('http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions');
        expect(qJson.item[2].answerValueSet).to.be.undefined;
      });

      cy.intercept('https://snowstorm.ihtsdotools.org/fhir/ValueSet/**',
        {fixture: 'snomed-ecl-expression-mock.json'}).as('snomedReq');

      // Assertions in preview.
      cy.contains('button', 'Preview').click();

      // SNOMED CT answers
      cy.contains('.mdc-tab.mat-mdc-tab', 'View Rendered Form').click();
      cy.get('#1\\/1').as('inputBox1').click();
      cy.wait('@snomedReq');
      cy.get('#searchResults').should('be.visible');
      cy.get('@inputBox1').type('{downarrow}{enter}', {force: true});
      cy.get('#searchResults').should('not.be.visible');
      cy.get('@inputBox1').should('have.value', 'Intersex');

      // Non SNOMED CT answers
      cy.get('#2\\/1').as('inputBox2').click();
      cy.get('#searchResults').should('be.visible');
      cy.get('@inputBox2').type('{downarrow}{enter}', {force: true});
      cy.get('#searchResults').should('not.be.visible');
      cy.get('@inputBox2').should('have.value', 'Back pain');

      cy.contains('mat-dialog-actions button', 'Close').click();
    });

    describe('Item control', () => {
      const itemControlExtensions = {
        'drop-down': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'drop-down',
              display: 'Drop down',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        autocomplete: {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'autocomplete',
              display: 'Auto-complete',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        'radio-button': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'radio-button',
              display: 'Radio Button',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        'check-box': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'check-box',
              display: 'Check-box',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        }
      };


      it('should create item-control extension with autocomplete option', () => {
        const icTag = 'lfb-item-control';
        const dropDownBtn = '[for^="__\\$itemControl\\.drop-down"]';
        const radioBtn = '[for^="__\\$itemControl\\.radio-button"]';
        const checkboxBtn = '[for^="__\\$itemControl\\.check-box"]';
        const acBtn = '[for^="__\\$itemControl\\.autocomplete"]';

        const dropDownRadio = '#__\\$itemControl\\.drop-down';
        const checkboxRadio = '#__\\$itemControl\\.check-box';

        cy.get(icTag).should('not.exist'); // Datatype is other than coding
        cy.selectDataType('coding');
        cy.getRadioButtonLabel('Create answer list', 'Yes').click();
        cy.getRadioButtonLabel('Answer constraint', 'Allow free text').click();
        cy.get('[for^="__\\$answerOptionMethods_value-set"]').as('nonSnomedMethod');
        cy.get('[for^="__\\$answerOptionMethods_answer-option"]').as('answerOptionMethod');
        cy.get('[for^="__\\$answerOptionMethods_snomed-value-set"]').as('snomedMethod');
        cy.get('@answerOptionMethod').click();
        cy.get(dropDownBtn).should('be.visible');
        cy.get(dropDownRadio).should('be.checked'); // Default is answer-option
        cy.get(radioBtn).should('be.visible'); // Radio option when repeats is false by default.
        cy.get(checkboxBtn).should('not.exist'); // Not visible when repeats is true
        cy.get(acBtn).should('not.exist'); // Not visible for answerOption.

        // For value set options.
        ['@snomedMethod', '@nonSnomedMethod'].forEach((vsMethod) => {
          cy.get(vsMethod).click();
          cy.get(dropDownBtn).should('be.visible');
          cy.get(dropDownRadio).should('be.checked'); // Default
          cy.get(radioBtn).should('be.visible');
          cy.get(checkboxBtn).should('not.exist');
          cy.get(acBtn).should('be.visible'); // Autocomplete should be visible.

          // No extension for drop-down
          cy.questionnaireJSON().should((qJson) => {
            expect(qJson.item[0].extension).to.deep.equal([itemControlExtensions['drop-down']]);
          });
        });

        cy.get('@snomedMethod').click();

        ['radio-button', 'autocomplete'].forEach((option) => {
          const optBtn = '[for^="__\\$itemControl\\.' + option + '"]';
          const optRadioId = '#__\\$itemControl\\.' + option;
          cy.get(optBtn).click();
          cy.get(optRadioId).should('be.checked');
          cy.questionnaireJSON().should((qJson) => {
            expect(qJson.item[0].extension).to.deep.equal([itemControlExtensions[option]]);
          });
        });

        cy.get(dropDownBtn).click();
        cy.get(dropDownRadio).should('be.checked');
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([itemControlExtensions['drop-down']]);
        });

        cy.contains('lfb-label', 'Allow repeating question?').siblings('div.btn-group').contains('Yes').click();
        cy.get(dropDownBtn).should('be.visible');
        cy.get(dropDownRadio).should('be.checked');
        cy.get(radioBtn).should('not.exist');
        cy.get(checkboxBtn).should('be.visible');
        cy.get(acBtn).should('be.visible');

        cy.get(checkboxBtn).click();
        cy.get(checkboxRadio).should('be.checked')

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([itemControlExtensions['check-box']]);
        });
      });

      it('should import with item having item-control extension', () => {
        const icTag = 'lfb-item-control';
        const dropDownBtn = '[for^="__\\$itemControl\\.drop-down"]';
        const radioBtn = '[for^="__\\$itemControl\\.radio-button"]';
        const checkboxBtn = '[for^="__\\$itemControl\\.check-box"]';
        const acBtn = '[for^="__\\$itemControl\\.autocomplete"]';

        const dropDownRadio = '#__\\$itemControl\\.drop-down';
        const checkRadio = '#__\\$itemControl\\.check-box';
        const radioRadio = '#__\\$itemControl\\.radio-button';
        const acRadio = '#__\\$itemControl\\.autocomplete';

        const answerMethodsAnswerOptionBtn = '[for^="__\\$answerOptionMethods_answer-option"]';
        const answerMethodsValueSetBtn = '[for^="__\\$answerOptionMethods_value-set"]';

        const answerMethodsAnswerOptionRadio = '#__\\$answerOptionMethods_answer-option';
        const answerMethodsValueSetRadio = '#__\\$answerOptionMethods_value-set';

        cy.uploadFile('item-control-sample.json', true);
        cy.get('#title').should('have.value', 'Item control sample form');
        cy.contains('button', 'Edit questions').click();

        cy.get(answerMethodsAnswerOptionRadio).should('be.checked');
        cy.get(dropDownRadio).should('be.visible').and('be.checked');
        cy.get(radioBtn).should('be.visible');
        cy.get(acBtn).should('not.exist');
        cy.get(checkboxBtn).should('not.exist');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].type).equal('coding');
          expect(qJson.item[0].text).equal('Answer option dropdown');
          expect(qJson.item[0].extension).to.deep.equal([itemControlExtensions['drop-down']]);
        });

        cy.clickTreeNode('Answer option radio-button');
        cy.get(answerMethodsAnswerOptionRadio).should('be.checked');
        cy.get(dropDownBtn).should('be.visible');
        cy.get(dropDownRadio).and('not.be.checked');
        cy.get(radioBtn).should('be.visible');
        cy.get(radioRadio).and('be.checked');
        cy.get(acBtn).should('not.exist');
        cy.get(checkboxBtn).should('not.exist');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[1].type).equal('coding');
          expect(qJson.item[1].text).equal('Answer option radio-button');
          expect(qJson.item[1].extension).to.deep.equal([itemControlExtensions['radio-button']]);
        });

        cy.clickTreeNode('Answer option check-box');
        cy.get(answerMethodsAnswerOptionRadio).should('be.checked');
        cy.get(dropDownBtn).should('be.visible');
        cy.get(dropDownRadio).and('not.be.checked');
        cy.get(checkboxBtn).should('be.visible');
        cy.get(checkRadio).should('be.checked');
        cy.get(radioBtn).should('not.exist');
        cy.get(acBtn).should('not.exist');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[2].type).equal('coding');
          expect(qJson.item[2].text).equal('Answer option check-box');
          expect(qJson.item[2].repeats).equal(true);
          expect(qJson.item[2].extension).to.deep.equal([itemControlExtensions['check-box']]);
        });

        cy.clickTreeNode('Valueset autocomplete');
        cy.get(answerMethodsValueSetRadio).should('be.checked');
        cy.get(dropDownBtn).should('be.visible');
        cy.get(dropDownRadio).should('not.be.checked');
        cy.get(acBtn).should('be.visible');
        cy.get(acRadio).should('be.checked');
        cy.get(radioBtn).should('be.visible');
        cy.get(radioRadio).should('not.be.checked');
        cy.get(checkboxBtn).should('not.exist');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[3].type).equal('coding');
          expect(qJson.item[3].text).equal('Valueset autocomplete');
          expect(qJson.item[3].extension[1]).to.deep.equal(itemControlExtensions.autocomplete);
        });

        cy.clickTreeNode('Valueset radio-button');
        cy.get(answerMethodsValueSetRadio).should('be.checked');
        cy.get(dropDownBtn).should('be.visible');
        cy.get(dropDownRadio).should('not.be.checked');
        cy.get(acBtn).should('be.visible');
        cy.get(acRadio).should('not.be.checked');
        cy.get(radioBtn).should('be.visible');
        cy.get(radioRadio).should('be.checked');
        cy.get(checkboxBtn).should('not.exist');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[4].type).equal('coding');
          expect(qJson.item[4].text).equal('Valueset radio-button');
          expect(qJson.item[4].extension[1]).to.deep.equal(itemControlExtensions['radio-button']);
        });

        cy.clickTreeNode('Valueset check-box');
        cy.get(answerMethodsValueSetRadio).should('be.checked');
        cy.get(dropDownBtn).should('be.visible');
        cy.get(dropDownRadio).should('not.be.checked');
        cy.get(acBtn).should('be.visible');
        cy.get(acRadio).should('not.be.checked');
        cy.get(checkboxBtn).should('be.visible');
        cy.get(checkRadio).should('be.checked');
        cy.get(radioBtn).should('not.exist');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[5].type).equal('coding');
          expect(qJson.item[5].text).equal('Valueset check-box');
          expect(qJson.item[5].repeats).equal(true);
          expect(qJson.item[5].extension[1]).to.deep.equal(itemControlExtensions['check-box']);
        });
      });
    });

    describe('Group item control', () => {
      beforeEach(() => {
        const sampleFile = 'USSG-family-portrait.json';
        let fixtureJson;
        cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
        cy.uploadFile(sampleFile, true);
        cy.get('#title').should('have.value', 'US Surgeon General family health portrait');
        cy.contains('button', 'Edit questions').click();
      });

      const groupItemControlExtensions = {
        'list': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'list',
              display: 'List',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        'table': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'table',
              display: 'Vertical Answer Table',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        'htable': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'htable',
              display: 'Horizontal Answer Table',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        'gtable': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'gtable',
              display: 'Group Table',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        'grid': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'grid',
              display: 'Group Grid',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        'header': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'header',
              display: 'Header',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        'footer': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'footer',
              display: 'Footer',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        'page': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'page',
              display: 'Page',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        },
        'tab-container': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              code: 'tab-container',
              display: 'Tab Container',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }]
          }
        }
      };

      it('should create group item-control extension with autocomplete option', () => {
        const icgTag = 'lfb-item-control-group';
        const listBtn = '[for^="__\\$itemControlGroup\\.list"]';
        const verticalAnsTblBtn = '[for^="__\\$itemControlGroup\\.table"]';
        const horizontalAnsTblBtn = '[for^="__\\$itemControlGroup\\.htable"]';
        const groupTblBtn = '[for^="__\\$itemControlGroup\\.gtable"]';
        const groupGridBtn = '[for^="__\\$itemControlGroup\\.grid"]';
        const headerBtn = '[for^="__\\$itemControlGroup\\.header"]';
        const footerBtn = '[for^="__\\$itemControlGroup\\.footer"]';
        const pageBtn = '[for^="__\\$itemControlGroup\\.page"]';
        const tabContainerBtn = '[for^="__\\$itemControlGroup\\.tab-container"]';

        const listRadio = '#__\\$itemControlGroup\\.list';
        const verticalAnsTblRadio = '#__\\$itemControlGroup\\.table';
        const horizontalAnsTblRadio = '#__\\$itemControlGroup\\.htable';
        const groupTblRadio = '#__\\$itemControlGroup\\.gtable';
        const groupGridRadio = '#__\\$itemControlGroup\\.grid';
        const headerRadio = '#__\\$itemControlGroup\\.header';
        const footerRadio = '#__\\$itemControlGroup\\.footer';
        const pageRadio = '#__\\$itemControlGroup\\.page';
        const tabContainerRadio = '#__\\$itemControlGroup\\.tab-container';

        // The Data type for the 1st question should be a group
        cy.get('#type').should('contain.value', 'group');
        // The Group Item Control should be visible but the default 'list' should no longer be set
        cy.get(listRadio).should('not.be.checked');

        // Select 'List' Group Item Control
        cy.get(listBtn).click();
        cy.get(listRadio).should('be.checked');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['list']]);
        });

        // Select 'Vertical Answer Table' Group Item Control
        cy.get(verticalAnsTblBtn).click();
        cy.get(verticalAnsTblRadio).should('be.checked');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['table']]);
        });

        // Select 'Horizontal Answer Table' Group Item Control
        cy.get(horizontalAnsTblBtn).click();
        cy.get(horizontalAnsTblRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not supported
        // by LForms Preview.
        cy.get(horizontalAnsTblBtn).find('sup').should('exist').should('contain.text', '(1)');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['htable']]);
        });

        // Select 'Group Table' Group Item Control
        cy.get(groupTblBtn).click();
        cy.get(groupTblRadio).should('be.checked');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['gtable']]);
        });

        // Select 'Group Grid' Group Item Control
        cy.get(groupGridBtn).click();
        cy.get(groupGridRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not supported
        // by LForms Preview.
        cy.get(groupGridBtn).find('sup').should('exist').should('contain.text', '(1)');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['grid']]);
        });

        // Select 'Header' Group Item Control
        cy.get(headerBtn).click();
        cy.get(headerRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not supported
        // by LForms Preview.
        cy.get(headerBtn).find('sup').should('exist').should('contain.text', '(1)');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['header']]);
        });

        // Select 'Footer' Group Item Control
        cy.get(footerBtn).click();
        cy.get(footerRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not supported
        // by LForms Preview.
        cy.get(footerBtn).find('sup').should('exist').should('contain.text', '(1)');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['footer']]);
        });

        // Select 'Page' Group Item Control
        cy.get(pageBtn).click();
        cy.get(pageRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not supported
        // by LForms Preview.
        cy.get(pageBtn).find('sup').should('exist').should('contain.text', '(1)');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['page']]);
        });

        // Select 'Tab Container' Group Item Control
        cy.get(tabContainerBtn).click();
        cy.get(tabContainerRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not supported
        // by LForms Preview.
        cy.get(tabContainerBtn).find('sup').should('exist').should('contain.text', '(1)');
        // Extension should be added
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['tab-container']]);
        });
      });

      it('should be able to clear group item control selection', () => {
        const listBtn = '[for^="__\\$itemControlGroup\\.list"]';
        const listRadio = '#__\\$itemControlGroup\\.list';
        const unspecifiedBtn = '[for^="__\\$itemControlGroup\\.unspecified"]';
        const unspecifiedRadio = '#__\\$itemControlGroup\\.unspecified';

        // The Data type for the 1st question should be a group
        cy.get('#type').should('contain.value', 'group');
        // The Group Item Control should be visible but there should be no default selection
        cy.get(listRadio).should('not.be.checked');

        // Select 'List' Group Item Control.
        cy.get(listBtn).click();
        cy.get(listRadio).should('be.checked');
        // Extension should be added.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['list']]);
        });

        // Clear the group item control selection
        cy.get(unspecifiedBtn).click();
        cy.get(unspecifiedRadio).should('be.checked');
        // Extension should be removed.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).undefined;
        });
      });

    });

    describe('Display item control', () => {
      beforeEach(() => {
        const sampleFile = 'display-item-control-sample.json';
        let fixtureJson;
        cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
        cy.uploadFile(sampleFile, true);
        cy.get('#title').should('have.value', 'Display item control sample form');
        cy.contains('button', 'Edit questions').click();
      });

      const displayItemControlExtensions = {
        'inline': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              "system": "http://hl7.org/fhir/questionnaire-item-control",
              "code": "inline",
              "display": "In-line"
            }]
          }
        },
        'prompt': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              "system": "http://hl7.org/fhir/questionnaire-item-control",
              "code": "prompt",
              "display": "Prompt"
            }]
          }
        },
        'unit': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              "system": "http://hl7.org/fhir/questionnaire-item-control",
              "code": "unit",
              "display": "Unit"
            }]
          }
        },
        'lower': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              "system": "http://hl7.org/fhir/questionnaire-item-control",
              "code": "lower",
              "display": "Lower-bound"
            }]
          }
        },
        'upper': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              "system": "http://hl7.org/fhir/questionnaire-item-control",
              "code": "upper",
              "display": "Upper-bound"
            }]
          }
        },
        'flyover': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              "system": "http://hl7.org/fhir/questionnaire-item-control",
              "code": "flyover",
              "display": "Fly-over"
            }]
          }
        },
        'legal': {
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            coding: [{
              "system": "http://hl7.org/fhir/questionnaire-item-control",
              "code": "legal",
              "display": "Legal-Button"
            }]
          }
        }
      };

      it('should display Display item-control extension', () => {
        const inlineBtn = '[for^="__\\$itemControlDisplay\\.inline"]';
        const lowerBtn = '[for^="__\\$itemControlDisplay\\.lower"]';
        const upperBtn = '[for^="__\\$itemControlDisplay\\.upper"]';
        const flyoverBtn = '[for^="__\\$itemControlDisplay\\.flyover"]';
        const legalBtn = '[for^="__\\$itemControlDisplay\\.legal"]';
        const unspecifiedBtn = '[for^="__\\$itemControlDisplay\\.unspecified"]';
        const inlineRadio = '#__\\$itemControlDisplay\\.inline';
        const promptRadio = '#__\\$itemControlDisplay\\.prompt';
        const unitRadio = '#__\\$itemControlDisplay\\.unit';
        const lowerRadio = '#__\\$itemControlDisplay\\.lower';
        const upperRadio = '#__\\$itemControlDisplay\\.upper';
        const flyoverRadio = '#__\\$itemControlDisplay\\.flyover';
        const legalRadio = '#__\\$itemControlDisplay\\.legal';
        const unspecifiedRadio = '#__\\$itemControlDisplay\\.unspecified';

        // The Data type should be a display.
        cy.get('#type').should('contain.value', 'display');
        // The 'In-line' Display Item Control should be selected.
        cy.get(inlineRadio).should('be.checked');
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([displayItemControlExtensions['inline']]);
        });
        // Clear the display item control selection
        cy.get(unspecifiedBtn).click();
        cy.get(unspecifiedRadio).should('be.checked');

        // Extension should be removed.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).undefined;
        });

        cy.clickTreeNode('Prompt display item control - deprecated');
        // The Data type should be a display.
        cy.get('#type').should('contain.value', 'display');
        // The 'Prompt' Display Item Control is deprecated and should not be visible.
        cy.get(promptRadio).should('not.exist');
        // Should display deprecated message.
        cy.get('p[id^="deprecated_hint___$itemControlDisplay"]')
          .should('exist')
          .should ('contain.text', '* \'Prompt\' item control is deprecated and is not presented in this list of item controls.');
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[1].extension).to.deep.equal([displayItemControlExtensions['prompt']]);
        });
        // Select 'inline' item control
        cy.get(inlineBtn).click();
        cy.get(inlineRadio).should('be.checked');
        // The deprecated warning message should not be visible.
        cy.get('p[id^="deprecated_hint___$itemControlDisplay"]')
          .should('not.exist');
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[1].extension).to.deep.equal([displayItemControlExtensions['inline']]);
        });

        cy.clickTreeNode('Unit display item control - deprecated');
        // The Data type should be a display.
        cy.get('#type').should('contain.value', 'display');
        // The 'Unit' Display Item Control is deprecated and should not be visible.
        cy.get(unitRadio).should('not.exist');
        // Should display deprecated message.
        cy.get('p[id^="deprecated_hint___$itemControlDisplay"]')
          .should('exist')
          .should ('contain.text', '* \'Unit\' item control is deprecated and is not presented in this list of item controls.');
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[2].extension).to.deep.equal([displayItemControlExtensions['unit']]);
        });
        // Clear the display item control selection
        cy.get(unspecifiedBtn).click();
        // Extension should be removed.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[2].extension).undefined;
        });

        cy.clickTreeNode('Lower-bound display item control');
        // The Data type should be a display.
        cy.get('#type').should('contain.value', 'display');
        // The 'Lower-bound' Display Item Control should be selected.
        cy.get(lowerRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not supported
        // by LForms Preview.
        cy.get(lowerBtn).find('sup').should('exist').should('contain.text', '(1)');
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[3].extension).to.deep.equal([displayItemControlExtensions['lower']]);
        });
        // Clear the display item control selection.
        cy.get(unspecifiedBtn).click();
        // The display item control selection should be unselected.
        cy.get(lowerRadio).should('not.be.checked');
        // Extension should be removed.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[3].extension).undefined;
        });

        cy.clickTreeNode('Upper-bound display item control');
        // The Data type should be a display.
        cy.get('#type').should('contain.value', 'display');
        // The 'Upper-bound' Display Item Control should be selected.
        cy.get(upperRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not supported
        // by LForms Preview.
        cy.get(upperBtn).find('sup').should('exist').should('contain.text', '(1)');
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[4].extension).to.deep.equal([displayItemControlExtensions['upper']]);
        });
        // Clear the display item control selection.
        cy.get(unspecifiedBtn).click();
        // The display item control selection should be unselected.
        cy.get(upperRadio).should('not.be.checked');
        // Extension should be removed.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[4].extension).undefined;
        });

        cy.clickTreeNode('Fly-over display item control');
        // The Data type should be a display.
        cy.get('#type').should('contain.value', 'display');
        // The 'Fly-over' Display Item Control should be selected.
        cy.get(flyoverRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not supported
        // by LForms Preview.
        cy.get(flyoverBtn).find('sup').should('exist').should('contain.text', '(1)');
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[5].extension).to.deep.equal([displayItemControlExtensions['flyover']]);
        });
        // Clear the display item control selection.
        cy.get(unspecifiedBtn).click();
        // The display item control selection should be unselected.
        cy.get(flyoverRadio).should('not.be.checked');
        // Extension should be removed.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[5].extension).undefined;
        });

        cy.clickTreeNode('Legal-button display item control');
        // The Data type should be a display.
        cy.get('#type').should('contain.value', 'display');
        // The 'Legal-button' Display Item Control should be selected.
        cy.get(legalRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not supported
        // by LForms Preview.
        cy.get(legalBtn).find('sup').should('exist').should('contain.text', '(1)');
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[6].extension).to.deep.equal([displayItemControlExtensions['legal']]);
        });
        // Clear the display item control selection.
        cy.get(unspecifiedBtn).click();
        // The display item control selection should be unselected.
        cy.get(legalRadio).should('not.be.checked');
        // Extension should be removed.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[6].extension).undefined;
        });
      });
    });

    it('should display quantity units', () => {
      cy.get('[id^="units"]').should('not.exist'); // looking for *units*
      cy.selectDataType('quantity');
      cy.get('[id^="units"]').last().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#searchResults').should('not.be.visible');
      cy.get('@units').type('inch');
      [['[in_i]', 'inch'], ['[in_br]', 'inch - British']].forEach((result) => {
        cy.contains('#completionOptions tr', result[0]).click();
        cy.contains('span.autocomp_selected li', result[1]).should('be.visible');
      });
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('quantity');
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('[in_i]');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('inch');
        expect(qJson.item[0].extension[1].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption');
        expect(qJson.item[0].extension[1].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[1].valueCoding.code).equal('[in_br]');
        expect(qJson.item[0].extension[1].valueCoding.display).equal('inch - British');
      });
    });

    it('should display decimal/integer units', () => {
      cy.get('[id^="units"]').should('not.exist');
      cy.selectDataType('decimal');
      cy.get('[id^="units"]').last().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#searchResults').should('not.be.visible');
      cy.get('@units').type('inch');
      cy.get('#searchResults').should('be.visible');
      cy.contains('#completionOptions tr', '[in_i]').click();
      cy.get('@units').should('have.value','inch');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('[in_i]');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('inch');
      });
      cy.get('@units').clear();
      // Invoke preview to trigger update.
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].extension).undefined;
      });
    });

    it('should import decimal/integer units', () => {
      const sampleFile = 'decimal-type-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/' + sampleFile).should((json) => {
        fixtureJson = json
      });
      cy.uploadFile(sampleFile, true);
      cy.contains('button', 'Edit questions').click();
      cy.get('#type option:selected').should('have.text', 'decimal');
      cy.get('[id^="initial.0.valueDecimal"]').should('have.value', '1.1')
      cy.get('[id^="units"]').last().as('units').should('have.value', 'inch');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson).to.deep.equal(fixtureJson);
      });

      cy.get('@units').clear();
      // Invoke preview to trigger update.
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0]).to.deep.equal(fixtureJson.item[0].extension[1]);
      });

      cy.get('@units').type('m');
      cy.contains('#completionOptions tr', 'meter').first().click();
      cy.get('@units').should('have.value', 'meter');
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].extension[0]).to.deep.equal(fixtureJson.item[0].extension[1]);
        expect(qJson.item[0].extension[1]).to.deep.equal({
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
          valueCoding: {
            system: 'http://unitsofmeasure.org',
            code: 'm',
            display: 'meter'
          }
        });
      });

      cy.clickTreeNode('Item with non-ucum units');
      cy.get('@units').should('have.value', 'X Y');
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[1].extension).to.deep.equal([{
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
          valueCoding: {
            system: 'http://x.y',
            code: 'XY',
            display: 'X Y'
          }
        }, {
          "url": "http://dummy.org",
          "valueInteger": 2
        }]);
      });
    });

    it('should add restrictions', () => {
      cy.get('lfb-restrictions [for^="booleanControlled_Yes"]').click();

      cy.get('[id^="__$restrictions.0.operator"]').select('Maximum length');
      cy.get('[id^="__$restrictions.0.value"]').type('10');
      cy.contains('lfb-restrictions button', 'Add new restriction')
        .as('addRestrictionButton').click();
      cy.get('[id^="__$restrictions.1.operator"]').select('Minimum length');
      cy.get('[id^="__$restrictions.1.value"]').type('5');
      cy.get('@addRestrictionButton').click();
      cy.get('[id^="__$restrictions.2.operator"]').select('Regex pattern');
      cy.get('[id^="__$restrictions.2.value"]').type('xxx');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].maxLength).equal(10);
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/minLength');
        expect(qJson.item[0].extension[0].valueInteger).equal(5);
        expect(qJson.item[0].extension[1].url).equal('http://hl7.org/fhir/StructureDefinition/regex');
        expect(qJson.item[0].extension[1].valueString).equal('xxx');
      });
    });

    it('should import form with restrictions', () => {
      const sampleFile = 'restrictions-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.get('#title').should('have.value', 'Form with restrictions');
      cy.contains('button', 'Edit questions').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0]).to.deep.equal(fixtureJson.item[0]);
      });
    });

    it('should import form in LForms format', () => {
      const sampleFile = 'sample.lforms.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.get('#title').should('have.value', 'Dummy Form');
      cy.contains('button', 'Edit questions').click();
      cy.questionnaireJSON().should((qJson) => {
        // Make some key assertions.
        expect(qJson.item.length).equal(1);
        expect(qJson.item[0].text).equal('Section 0');
        expect(qJson.item[0].type).equal('group');
        expect(qJson.item[0].code[0].code).equal('c0');
        expect(qJson.item[0].item.length).equal(1);
        expect(qJson.item[0].item[0].text).equal('Section 00');
        expect(qJson.item[0].item[0].type).equal('group');
        expect(qJson.item[0].item[0].code[0].code).equal('c00');

        expect(qJson.item[0].item[0].item[0].text).equal('Decimal question 000');
        expect(qJson.item[0].item[0].item[0].type).equal('decimal');
        expect(qJson.item[0].item[0].item[0].code[0].code).equal('c000');
      });
    });

    xit('should create display type', () => {
      cy.get('@type').contains('string');
      cy.selectDataType('display');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('display');
      });
      cy.get('@addNewItem').click();

      cy.contains('.node-content-wrapper span', 'New item 1').as('item1');

      cy.dragAndDropNode('New item 1', 'Item 0'); // TODO - Not working, revisit.

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('display');
      });
      cy.get('@item0').dblclick();
      cy.get('@item1').click();
      cy.get('.btn-toolbar').contains('button', 'Delete this item').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('display');
      });
    });

    // Skip this test for now as the dragAndDropNode command is not functioning
    xit('should not be able to drop item on display data type item', () => {
      cy.get('@type').contains('string');
      cy.selectDataType('display');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('display');
      });
      cy.get('@addNewItem').click();

      cy.contains('.node-content-wrapper span', 'New item 1').as('item1');

      cy.dragAndDropNode('New item 1', 'Item 0'); // TODO - Not working, revisit.

      cy.get('.tree-node').eq(1).should('have.class', 'tree-node-level-1');
    });

    // Skip this test for now as the dragAndDropNode command is not functioning
    xit('should be able to drop item on display data type item', () => {
      cy.get('@type').contains('string');
      cy.selectDataType('group');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('group');
      });
      cy.get('@addNewItem').click();

      cy.contains('.node-content-wrapper span', 'New item 1').as('item1');

      cy.dragAndDropNode('New item 1', 'Item 0'); // TODO - Not working, revisit.

      cy.get('.tree-node').eq(1).should('have.class', 'tree-node-level-2');
    });

    it('should not display header display data type if item has sub-item', () => {
      cy.get('@type').contains('string');

      cy.get('#type').then($dataTypeSelect => {
        cy.wrap($dataTypeSelect)
          .should('be.visible')
          .find('option')
          .contains('group')
          .should('exist');

        cy.wrap($dataTypeSelect)
          .find('option')
          .contains('display')
          .should('exist');
      });

      cy.getTreeNode('Item 0').as('contextNode');
      cy.get('@contextNode').find('span.node-display-prefix').should('have.text', '1');
      cy.get('@contextNode').find('button.dropdown-toggle').click();

      cy.contains('button.dropdown-item', 'Insert a new child item').click();
      cy.get('#text').should('have.value', 'New item 1');
      cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '1.1');

      cy.get('@contextNode').click();
      cy.get('#type').focus().then($dataTypeSelect => {
        cy.wrap($dataTypeSelect)
          .should('be.visible')
          .find('option')
          .contains('group')
          .should('exist');

        cy.wrap($dataTypeSelect)
          .find('option')
          .should('not.contain', 'display');
      });
    });

    it('should retain header type after switching to another item and switching back', () => {
      cy.get('@type').contains('string');
      cy.selectDataType('display');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('display');
      });
      cy.get('@addNewItem').click();
      cy.get('@type').contains('string');
      cy.get('@item0').click();
      cy.get('@type').contains('display');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('display');
        expect(qJson.item[1].type).equal('string');
      });
    });

    it('should import display type', () => {
      const sampleFile = 'group-display-type-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.get('#title').should('have.value', 'New Form');
      cy.contains('button', 'Edit questions').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).to.deep.equal(fixtureJson.item[0].type);
        expect(qJson.item[1].type).to.deep.equal(fixtureJson.item[1].type);
        expect(qJson.item[1].item[0].type).to.deep.equal(fixtureJson.item[1].item[0].type);
      });
    });

    it('should import quantity type', () => {
      const sampleFile = 'initial-quantity-sample.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.get('#title').should('have.value', 'Quantity Sample');
      cy.contains('button', 'Edit questions').click();
      cy.get('@type').contains('quantity');
      cy.get('[id^="units"]').as('units').should('be.visible');
      cy.get('@units').parent().prev('ul').as('selectedUnits');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial).to.deep.equal(fixtureJson.item[0].initial);
      });
      cy.get('@selectedUnits').find('li').contains('xx').as('nonUcum');
      cy.get('@selectedUnits').find('li').contains('meter').as('ucum');
      cy.get('@nonUcum').contains('button', '×').click();

    });

    it('should create quantity type with initial quantity unit', () => {
      cy.selectDataType('quantity');
      cy.get('@type').contains('quantity');
      cy.get('[id^="initial.0.valueQuantity.value"]').as('value0').type('123');
      cy.get('[id^="initial.0.valueQuantity.unit"]')
        .as('unit0').type('f');
      cy.get('#searchResults').as('unitSuggestions').should('be.visible', true);
      cy.get('@unitSuggestions').find('table tbody tr:first').click();
      cy.get('@unitSuggestions').should('not.be.visible');
      cy.get('@unit0').should('have.value', 'farad');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial[0]).to.deep.equal({
          valueQuantity: {
            value: 123,
            unit: 'farad',
            code: 'F',
            system: 'http://unitsofmeasure.org'
          }
        });
      });

      cy.get('@unit0').clear().type('xxxx').blur().should('have.value', 'xxxx');

      // The blur() event may not be enough to update the form. Use some UI events to trigger the update.
      cy.contains('button', 'Preview').click();
      cy.contains('mat-dialog-actions button', 'Close').click();

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial[0]).to.deep.equal({
          valueQuantity: {
            value: 123,
            unit: 'xxxx'
          }
        });
      });

    });

    describe('Item level fields: advanced', () => {
      beforeEach(() => {
        cy.expandAdvancedFields();
        cy.tsUrl().should('be.visible'); // Proof of advanced panel expansion
      });

      afterEach(() => {
        cy.collapseAdvancedFields();
      });

      it('should support conditional display with answer coding source', () => {
        cy.addAnswerOptions();
        cy.contains('Add new item').scrollIntoView().click();
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

        const errorMessageEl = 'mat-sidenav-content ul > li.text-danger.list-group-item-warning';

        cy.clickTreeNode('Integer Type');

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

        const errorMessageEl = 'mat-sidenav-content ul > li.text-danger.list-group-item-warning';

        cy.clickTreeNode('Integer Type');

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
          console.log('Questionnaire - ' + JSON.stringify(qJson, null, 5));
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
        cy.get('#title').should('have.value', 'Questionnaire where enableWhen contains an invalid linkId');
        cy.contains('button', 'Edit questions').click();
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
          {display: 'display 1', code: 'c1', system: 's1', __$score: 1},
          {display: 'display 2', code: 'c2', system: 's2', __$score: 2}
        ]);
        cy.contains('Add new item').scrollIntoView().click();
        cy.get('#text').should('have.value', 'New item 1');
        cy.enterAnswerOptions([
          {display: 'display 1', code: 'c1', system: 's1', __$score: 1},
          {display: 'display 2', code: 'c2', system: 's2', __$score: 2},
          {display: 'display 3', code: 'c3', system: 's3', __$score: 3}
        ]);
        cy.contains('Add new item').scrollIntoView().click();
        cy.get('#text').should('have.value', 'New item 2');

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
        cy.get('#text').should('have.value', 'New item 1');

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
        cy.get('#text').should('have.value', 'New item 1');
        cy.enterAnswerOptions([
          {display: 'display 1', code: 'c1', system: 's1', __$score: 1},
          {display: 'display 2', code: 'c2', system: 's2', __$score: 2},
          {display: 'display 3', code: 'c3', system: 's3', __$score: 3}
        ]);
        cy.contains('Add new item').scrollIntoView().click();
        cy.get('#text').should('have.value', 'New item 2');

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
        cy.contains('Add new item').scrollIntoView().click();
        cy.get('#text').should('have.value', 'New item 1');

        const r1Question = '[id^="enableWhen.0.question"]';
        // First row operator='exist'
        cy.get(r1Question).type('{enter}');
        cy.get(r1Question).should('have.value', '1 - Item 0');

      });

      it('should fix a bug showing answer field when source item is decimal and operator is other than exists', () => {
        cy.selectDataType('decimal');
        cy.contains('Add new item').scrollIntoView().click();
        cy.get('#text').should('have.value', 'New item 1');

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
        cy.get('#text').should('have.value', 'New item 1');

        const r1Question = '[id^="enableWhen.0.question"]';
        const r1Operator = '[id^="enableWhen.0.operator"]';
        const r1Answer = 'lfb-enable-when table tbody tr:nth-child(1) lfb-enablewhen-answer-coding lfb-auto-complete input';
        cy.get(r1Question).as('r1Question').type('{enter}');
        cy.get(r1Operator).as('r1Operator').select('=');
        cy.get(r1Answer).click();
        cy.get(r1Answer).type('dia');
        cy.get('#searchResults').contains('Diabetes mellitus').click();

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
        cy.get('#searchResults li:nth-child(1)').click();
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
        cy.get('#title').should('have.value', 'US Surgeon General family health portrait');

        cy.contains('button', 'Edit questions').click();
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
        cy.get('#title').should('have.value', 'Terminology server sample form');
        cy.contains('button', 'Edit questions').click();
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
        cy.get('#title').should('have.value', 'Form with observation link period');
        cy.contains('button', 'Edit questions').click();
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
          cy.get('#title').should('have.value', 'Form with observation extract');
          cy.contains('button', 'Edit questions').click();
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
      cy.get('#title').should('have.value', 'US Surgeon General family health portrait');
      cy.contains('button', 'Edit questions').click();

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
  });

  describe('Test descendant items and display/group type changes', () => {
    beforeEach(() => {
      const sampleFile = 'USSG-family-portrait.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.loadHomePage();
      cy.get('input[type="radio"][value="scratch"]').click();
      cy.get('button').contains('Continue').click();
      cy.uploadFile(sampleFile, false);
      cy.get('#title').should('have.value', 'US Surgeon General family health portrait');
      cy.contains('button', 'Edit questions').click();
    });

    it('should preserve descendant item array', () => {
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[10].item.length).to.equal(2);
      });
    });

    it('should preserve change of datatype display', () => {
      cy.toggleTreeNodeExpansion('My health history');
      cy.getTreeNode('Name').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].text).to.equal('Name');
        expect(qJson.item[0].item[0].type).to.equal('string');
      });
      cy.get('#text').clear().type('xxx');
      cy.get('#type').select('display');

      cy.clickTreeNode('My health history');
      cy.getTreeNode('xxx').click({force: true}); // Force through tooltip.
      cy.get('#text').should('have.value', 'xxx');
      cy.get('#type').should('have.value', '12: display');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].text).to.equal('xxx');
        expect(qJson.item[0].item[0].type).to.equal('display');
      });
    });

    it('should not display selected node in the target node list', () => {
      cy.toggleTreeNodeExpansion('Family member health history');
      // Select the 'Relationship to patient' item and select the 'More options'.
      cy.getTreeNode('Relationship to patient').as('contextNode');
      cy.get('@contextNode').click();
      cy.get('@contextNode').find('button.dropdown-toggle').click();

      // Select the 'Move this item' option.
      cy.get('div.dropdown-menu.show').contains('button.dropdown-item', 'Move this item').click();
      cy.get('lfb-node-dialog').contains('button', 'Move').as('moveBtn');

      // Search for 'Gender' in the target item. It should not be displayed.
      cy.get('lfb-node-dialog').find('#moveTarget1').click();
      cy.get('lfb-node-dialog [role="listbox"]').find('button.dropdown-item').should('not.contain.text', 'Relationship to patient');
    });

    it('should not be able to move an item to an item of type "display"', () => {
      cy.toggleTreeNodeExpansion('Family member health history');
      cy.getTreeNode('Race').click();

      // Add a new item under the 'Race' item of data type 'display'.
      cy.contains('Add new item').scrollIntoView().click();
      cy.get('#text').clear().type('Display Data Type');
      cy.selectDataType('display');
      cy.getTreeNode('Display Data Type').find('span.node-display-prefix').should('have.text', '2.8');

      // Select the 'Race' item and select the 'More options'.
      cy.getTreeNode('Race').as('contextNode');
      cy.get('@contextNode').find('button.dropdown-toggle').click();
      // Select the 'Move this item' option.
      cy.get('div.dropdown-menu.show').contains('button.dropdown-item', 'Move this item').click();
      cy.get('lfb-node-dialog').contains('button', 'Move').as('moveBtn');
      // Select target item to be 'Gender' item and it should present with 3 drop locations.
      cy.get('lfb-node-dialog').find('#moveTarget1').click().type('Gender').should('exist').type('{downarrow}{enter}');
      cy.get('lfb-node-dialog').find('ul').within(() => {
        cy.get('li').should('have.length', 3);
        cy.get('li').eq(0).should('contain.text', 'After the target item.');
        cy.get('li').eq(1).should('contain.text', 'Before the target item.');
        cy.get('li').eq(2).should('contain.text', 'As a child of target item.');
      });

      // Re-enter the target to be 'Display Data Type'. Due to the data type, it should
      // only present with 2 drop locations.
      cy.get('lfb-node-dialog').find('#moveTarget1').click().clear().type('Display Data Type');
      cy.get('lfb-node-dialog').find('button.dropdown-item').should('exist').should('have.length', 1).click();

      cy.get('lfb-node-dialog').find('ul').within(() => {
        cy.get('li').should('have.length', 2);
        cy.get('li').eq(0).should('contain.text', 'After the target item.');
        cy.get('li').eq(1).should('contain.text', 'Before the target item.');
      });

      // Clear the target again. 3 drop locations should be presented.
      cy.get('lfb-node-dialog').find('#moveTarget1').click().clear();
      cy.get('lfb-node-dialog form').click();
      cy.get('lfb-node-dialog').find('ul').within(() => {
        cy.get('li').should('have.length', 3);
        cy.get('li').eq(0).should('contain.text', 'After the target item.');
        cy.get('li').eq(1).should('contain.text', 'Before the target item.');
        cy.get('li').eq(2).should('contain.text', 'As a child of target item.');
        // Select the 'As a child of target item.' option.
        cy.get('li').eq(2).should('contain.text', 'As a child of target item.')
          .find('input[type="radio"').check();

      });
      // The 'Display Data Type' item should be excluded from the target item list.
      cy.get('lfb-node-dialog').find('#moveTarget1').click().clear().type('Display Data Type');
      cy.get('lfb-node-dialog').find('button.dropdown-item').should('not.exist');
    });

    it('should not be able to insert a new child item to an item of type "display"', () => {
      cy.toggleTreeNodeExpansion('Family member health history');
      cy.getTreeNode('Race').click();

      // Add a new item under the 'Race' item of data type 'display'.
      cy.contains('Add new item').scrollIntoView().click();
      cy.get('#text').clear().type('Display Data Type');
      cy.selectDataType('display');
      cy.getTreeNode('Display Data Type').find('span.node-display-prefix').should('have.text', '2.8');

      // Select the 'Race' item and select the 'More options'.
      cy.getTreeNode('Race').as('contextNode');
      cy.get('@contextNode').find('button.dropdown-toggle').click();
      // One of the option should be 'Insert a new child item.'
      cy.get('div.dropdown-menu.show').should('contain', 'Insert a new child item');

      // Select the 'Display Data Type' item and select the 'More options.'
      cy.getTreeNode('Display Data Type').as('contextNode').click();
      cy.get('@contextNode').find('button.dropdown-toggle').click();
      // Due to the data type 'display', the option 'Insert a new child item.' should be hidden.
      cy.get('div.dropdown-menu.show').should('not.contain', 'Insert a new child item');
    });
  });

});

describe('Accepting only LOINC terms of use', () => {
  beforeEach(() => {
    cy.loadHomePageWithLoincOnly();
    cy.get('input[type="radio"][value="scratch"]').click();
    cy.get('button').contains('Continue').click();
    cy.get('button').contains('Create questions').click();
    cy.resetForm()
    cy.get('button').contains('Create questions').click();
  });
  it('should not display SNOMED option in answerValueSet', () => {
    cy.selectDataType('coding');
    cy.getRadioButtonLabel('Create answer list', 'Yes').click();
    cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
    cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
    cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('not.be.checked');
    // SNOMED radio should not exist
    cy.get('[for^="__\\$answerOptionMethods_snomed-value-set"]').should('not.exist');
    cy.get('#answerValueSet_non-snomed').should('not.exist');
    cy.get('#answerValueSet_ecl').should('not.exist');
    cy.get('#answerValueSet_edition').should('not.exist');
    cy.get('#answerValueSet_version').should('not.exist');
    cy.get('lfb-answer-option').should('be.visible');

    cy.get('[for^="__\\$answerOptionMethods_value-set"]').click();
    cy.get('#answerValueSet_non-snomed').should('be.visible');
    cy.get('lfb-answer-option').should('not.exist');
  });
});
