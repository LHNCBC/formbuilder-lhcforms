/// <reference types="cypress" />

import {Util} from '../../../src/app/lib/util';
import {CypressUtil} from '../../support/cypress-util';
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

  describe('Item level fields', () => {
    const helpTextExtension = [{
      url: EXTENSION_URL_ITEM_CONTROL,
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
    });

    it('should display item editor page', () => {
      cy.get('tree-root tree-viewport tree-node-collection tree-node').first().should('be.visible');
      cy.get('@codeYes').click();
      cy.get('[id^="code.0.code"]').as('code');
      cy.get('@code').should('be.visible');
      cy.get('@codeNo').click();
      cy.get('@code').should('not.exist');

      cy.contains('Add new item').as("addItemBtn").scrollIntoView();
      cy.get('@addItemBtn').click();
      cy.get('tree-root tree-viewport tree-node-collection tree-node').last()
        .find('tree-node-content div span').eq(1).should('have.text', 'New item 1');
      cy.contains('Delete this item').as('deleteItemBtn').scrollIntoView();
      cy.get('@deleteItemBtn').click();
      cy.contains('button', 'Yes').click();
      cy.get('tree-root tree-viewport tree-node-collection tree-node').last()
        .find('tree-node-content div span').eq(1).should('have.text', 'Item 0');

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
      cy.get('@codeOption').includeExcludeCodeField('item');
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
      cy.contains('Add new item from LOINC').as('addLoincItemBtn').scrollIntoView();
      cy.get('@addLoincItemBtn').click();
      cy.contains('ngb-modal-window label', 'Question').click();
      cy.get('#acSearchBoxId').type('vital signs assess');
      cy.get('ngb-typeahead-window button').first().click();
      cy.contains('ngb-modal-window div.modal-dialog button', 'Add').click();
      cy.getItemTypeField().should('contain.value', 'coding');
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

      cy.getItemTextField().should('have.value', 'Resp rate'); // Bugfix - Should not be Heart rate
      cy.getTreeNode('Heart rate').click();
      cy.getItemTextField().should('have.value', 'Heart rate'); // This node should still exist.
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
      cy.get('.spinner-border').should('not.exist');
      cy.clickTreeNode('Second item'); // Load other than first item.

      cy.FHIRServerResponse('Create a new questionnaire', fhirServer).should((json) => {
        expect(json).to.deep.equal(responseStub);
      });
      cy.wait('@create');
      // The fix should load the same item as selected before, i.e. second item.
      cy.getItemTextField().should('have.value', 'Second item');
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
      cy.get('.spinner-border').should('not.exist');
      cy.getItemTextField().should('have.value', 'One (group)');

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
        cy.getItemTextField().should('have.value', itemText);
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
        cy.getBooleanInput(readOnlyLabel, null).should('be.checked');
        cy.getBooleanInput(readOnlyLabel, false).should('not.be.checked');

        cy.booleanFieldClick(readOnlyLabel, false);

        cy.getBooleanInput(readOnlyLabel, null).should('not.be.checked');
        cy.getBooleanInput(readOnlyLabel, false).should('be.checked');
        cy.getBooleanInput(repeatsLabel, null).should('be.checked');
        cy.getBooleanInput(repeatsLabel, false).should('not.be.checked');

        cy.questionnaireJSON().should((json) => {
          expect(json.item[0].readOnly).to.be.false;
          expect(json.item[0].repeats).to.be.undefined;
        });
        cy.booleanFieldClick(readOnlyLabel, null);
        cy.questionnaireJSON().should((json) => {
          expect(json.item[0].readOnly).to.be.undefined;
          expect(json.item[0].repeats).to.be.undefined;
        });
        cy.booleanFieldClick(readOnlyLabel, false);
        cy.questionnaireJSON().should((json) => {
          expect(json.item[0].readOnly).to.be.false;
          expect(json.item[0].repeats).to.be.undefined;
        });
      });

      it('should import items with boolean fields', () => {
        const importFile = 'boolean-fields-sample.json';
        cy.uploadFile(importFile, true);
        cy.contains('button', 'Edit questions').click();
        cy.get('.spinner-border').should('not.exist');

        cy.getPickInitialValueValueMethodClick();
        cy.getInitialValueBooleanInput(null).should('be.checked');
        cy.getBooleanInput(readOnlyLabel, true).should('be.checked');
        cy.getBooleanInput(requiredLabel, false).should('be.checked');
        cy.getBooleanInput(repeatsLabel, null).should('be.checked');

        cy.getTreeNode('Item 1').click();

        cy.getInitialValueBooleanInput(true).should('be.checked');
        cy.getBooleanInput(readOnlyLabel, false).should('be.checked');
        cy.getBooleanInput(requiredLabel, true).should('be.checked');
        cy.getBooleanInput(repeatsLabel, false).should('be.checked');

        cy.getTreeNode('Item 2').click();

        cy.getInitialValueBooleanInput(false).should('be.checked');
        cy.getBooleanInput(readOnlyLabel, null).should('be.checked');
        cy.getBooleanInput(requiredLabel, null).should('be.checked');
        cy.getBooleanInput(repeatsLabel, true).should('be.checked');

        cy.questionnaireJSON().should((json) => {
          expect(json.item[0].initial).to.be.undefined;
          expect(json.item[0].readOnly).to.be.true;
          expect(json.item[0].required).to.be.false;
          expect(json.item[0].repeats).to.be.undefined;
          expect(json.item[1].initial[0].valueBoolean).to.be.true;
          expect(json.item[1].readOnly).to.be.false;
          expect(json.item[1].required).to.be.true;
          expect(json.item[1].repeats).to.be.false;
          expect(json.item[2].initial[0].valueBoolean).to.be.false;
          expect(json.item[2].readOnly).to.be.undefined;
          expect(json.item[2].required).to.undefined;
          expect(json.item[2].repeats).to.be.true;
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
        cy.getItemTextField().should('have.value', 'New item 1');
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '1');
      });

      it('should insert after context node using sidebar tree node context menu', () => {
        cy.contains('button.dropdown-item', 'Insert a new item after').click();
        cy.getItemTextField().should('have.value', 'New item 1');
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '2');
      });

      it('should insert a child of context node using sidebar tree node context menu', () => {
        cy.contains('button.dropdown-item', 'Insert a new child item').click();
        cy.getItemTextField().should('have.value', 'New item 1');
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '1.1');
      });
    });

    describe('Move context node using sidebar tree node context menu', () => {
      beforeEach(() => {
        cy.contains('button', 'Add new item').click();
        cy.contains('button', 'Add new item').click();
        cy.contains('button', 'Add new item').click();
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
        cy.getTreeNode('Copy of Item 0').find('span.node-display-prefix').should('have.text', '3');
        cy.getTreeNode('New item 2').find('span.node-display-prefix').should('have.text', '4');
        cy.getTreeNode('New item 3').find('span.node-display-prefix').should('have.text', '5');
      });

      it('should copy before a target node', () => {
        cy.get('input[type="radio"][value="BEFORE"]').click();
        cy.get('@copyBtn').should('not.be.disabled').click();
        cy.getTreeNode('Copy of Item 0').find('span.node-display-prefix').should('have.text', '2');
      });

      it('should copy as a child of a target', () => {
        cy.get('input[type="radio"][value="CHILD"]').click();
        cy.get('@copyBtn').should('not.be.disabled').click();
        cy.getTreeNode('Item 0').find('span.node-display-prefix').should('have.text', '1');
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '2');
        cy.toggleTreeNodeExpansion('New item 1');
        cy.getTreeNode('Copy of Item 0').find('span.node-display-prefix').should('have.text', '2.1');
        cy.getTreeNode('New item 2').find('span.node-display-prefix').should('have.text', '3');
        cy.getTreeNode('New item 3').find('span.node-display-prefix').should('have.text', '4');
      });
    });

    it('should copy a single item', () => {
      // Select the 'Relationship to patient' item and select the 'More options'.
      cy.get('div.node-content-wrapper-active button.dropdown-toggle').as('contextMoreBtn');
      cy.get('@contextMoreBtn').click();

      // Select the 'Copy this item' option.
      cy.get('div.dropdown-menu.show').contains('button.dropdown-item', 'Copy this item').click();

      cy.get('lfb-node-dialog #moveTarget1').as('dlgInput');
      cy.get('@dlgInput').click();
      cy.get('lfb-node-dialog [role="listbox"]').find('button.dropdown-item').should('contain.text', 'Item 0');
      cy.get('@dlgInput').type('{downArrow}{enter}');
      cy.get('lfb-node-dialog').contains('button', 'Copy').click();

      cy.getTreeNode('Copy of Item 0').click();
    });

    it('should restrict to integer input in integer field', () => {
      cy.selectDataType('integer');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="initial.0.valueInteger"]').as('initIntField');
      cy.get('@initIntField').clear().type('abc').should('have.value', '');
      cy.get('@initIntField').clear().type('12abc').should('have.value', '12');
      cy.get('@initIntField').clear().type('3.4').should('have.value', '34');
      cy.get('@initIntField').clear().type('-5.6').should('have.value', '-56');
      cy.get('@initIntField').clear().type('-0').should('have.value', '-0');
      cy.get('@initIntField').clear().type('-2-4-').should('have.value', '-24');

      cy.get('@initIntField').clear().type('24e1').should('have.value', '241');
      cy.get('@initIntField').clear().type('-24E1').should('have.value', '-241');

      // Value should be stored as integer -241 (not string) in the JSON
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial).to.deep.equal(
          [
            {
              "valueInteger": -241
            }
          ]
        )
      });
    });

    it('should restrict to decimal input in number field', () => {
      cy.selectDataType('decimal');
      cy.getTypeInitialValueValueMethodClick();
      cy.get('[id^="initial.0.valueDecimal"]').as('initNumberField');
      cy.get('@initNumberField').clear().type('abc').should('have.value', '');
      cy.get('@initNumberField').clear().type('12abc').should('have.value', '12');
      cy.get('@initNumberField').clear().type('3.4').should('have.value', '3.4');
      cy.get('@initNumberField').clear().type('-5.6').should('have.value', '-5.6');
      cy.get('@initNumberField').clear().type('-7.8ab').should('have.value', '-7.8');
      cy.get('@initNumberField').clear().type('-xy0.9ab').should('have.value', '-0.9');

      cy.get('@initNumberField').clear().type('-').should('have.value', '-');
      cy.get('lfb-initial-number input[id^="initial.0.valueDecimal"]').should('contain.class', 'invalid');
      cy.get('span[id="initial.0.err"] > small').should('contain.text', 'Invalid decimal value.');

      cy.get('@initNumberField').clear().type('.').should('have.value', '.');
      cy.get('lfb-initial-number input[id^="initial.0.valueDecimal"]').should('contain.class', 'invalid');
      cy.get('span[id="initial.0.err"] > small').should('contain.text', 'Invalid decimal value.');

      cy.get('@initNumberField').clear().type('e').should('have.value', 'e');
      cy.get('lfb-initial-number input[id^="initial.0.valueDecimal"]').should('contain.class', 'invalid');
      cy.get('span[id="initial.0.err"] > small').should('contain.text', 'Invalid decimal value.');

      // Value should be stored as decimal -0.9 in the JSON
      cy.get('@initNumberField').clear().type('-xy0.9ab').should('have.value', '-0.9');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial).to.deep.equal(
          [
            {
              "valueDecimal": -0.9
            }
          ]
        )
      });

      // Value should be stored as decimal 0.9 in the JSON
      cy.get('@initNumberField').clear().type('.9').should('have.value', '.9');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial).to.deep.equal(
          [
            {
              "valueDecimal": 0.9
            }
          ]
        )
      });

      // Value should be stored as decimal -0.9 in the JSON
      cy.get('@initNumberField').clear().type('-.9').should('have.value', '-.9');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial).to.deep.equal(
          [
            {
              "valueDecimal": -0.9
            }
          ]
        )
      });

      // Value should be stored as decimal 200 in the JSON
      cy.get('@initNumberField').clear().type('2e2').should('have.value', '2e2');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial).to.deep.equal(
          [
            {
              "valueDecimal": 200
            }
          ]
        )
      });

      // Value should be stored as decimal 2.1 in the JSON
      cy.get('@initNumberField').clear().type('2.100').should('have.value', '2.100');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial).to.deep.equal(
          [
            {
              "valueDecimal": 2.1
            }
          ]
        )
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
      cy.getFormTitleField().should('have.value', 'Form with restrictions');
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
      cy.getFormTitleField().should('have.value', 'Dummy Form');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
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
      cy.getItemTypeField().contains('string');
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
      cy.getItemTypeField().contains('string');
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
      cy.getItemTypeField().contains('string');
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
      cy.getItemTypeField().find(':selected').contains('string');

      cy.getItemTypeField().then($dataTypeSelect => {
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
      cy.getItemTextField().should('have.value', 'New item 1');
      cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '1.1');

      cy.get('@contextNode').click();
      cy.getItemTypeField().focus().then($dataTypeSelect => {
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
      cy.getItemTypeField().find(':selected').contains('string');
      cy.selectDataType('display');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('display');
      });
      cy.get('@addNewItem').click();
      cy.getItemTypeField().find(':selected').contains('string');
      cy.get('@item0').click();
      cy.getItemTypeField().find(':selected').contains('display');
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
      cy.getFormTitleField().should('have.value', 'New Form');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
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
      cy.getFormTitleField().should('have.value', 'Quantity Sample');
      cy.contains('button', 'Edit questions').click();
      cy.get('.spinner-border').should('not.exist');
      cy.getItemTypeField().find(':selected').contains('quantity');
      cy.get('[id^="units"]').as('units').should('be.visible');
      cy.get('lfb-units table tbody').as('selectedUnits');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].initial).to.deep.equal(fixtureJson.item[0].initial);
      });
    });

    it('should create quantity type with initial quantity unit', () => {
      cy.selectDataType('quantity');
      cy.getTypeInitialValueValueMethodClick();
      cy.getItemTypeField().find(':selected').contains('quantity');
      cy.get('[id^="initial.0.valueQuantity.value"]').as('value0').type('123');
      cy.get('[id^="initial.0.valueQuantity.unit"]')
        .as('unit0').type('f');
      cy.get('#lhc-tools-searchResults').as('unitSuggestions').should('be.visible', true);
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
        let oeNoRadio, oeYesRadio, oeNoLabel, oeYesLabel;
        let oeNoneRadio, oeCompRadio, oeMemberRadio, oeDerivedRadio, oeIndRadio;
        let oeNoneLabel, oeCompLabel, oeMemberLabel, oeDerivedLabel, oeIndLabel;
        let oeCodeGroup, warningMsg, firstCodeInput;

        beforeEach(() => {
          oeNoRadio = '[id^="radio_No_observationExtract"]';
          oeYesRadio = '[id^="radio_Yes_observationExtract"]';
          oeNoLabel = '[for^="radio_No_observationExtract"]';
          oeYesLabel = '[for^="radio_Yes_observationExtract"]';
          firstCodeInput = '[id^="code.0.code"]';
          warningMsg = 'lfb-observation-extract p';
          oeNoneRadio = '[id^="radio_obs_relation_null_observationExtract"]';
          oeCompRadio ='[id^="radio_obs_relation_component_observationExtract"]';
          oeMemberRadio = '[id^="radio_obs_relation_member_observationExtract"]';
          oeDerivedRadio = '[id^="radio_obs_relation_derived_observationExtract"]';
          oeIndRadio = '[id^="radio_obs_relation_independent_observationExtract"]';
          oeNoneLabel = '[for^="radio_obs_relation_null_observationExtract"]';
          oeCompLabel = '[for^="radio_obs_relation_component_observationExtract"]';
          oeMemberLabel = '[for^="radio_obs_relation_member_observationExtract"]';
          oeDerivedLabel = '[for^="radio_obs_relation_derived_observationExtract"]';
          oeIndLabel = '[for^="radio_obs_relation_independent_observationExtract"]';
          oeCodeGroup ='[aria-labelledby^="label_rg_obs_relation_"]';
        });

        it('should create observation extraction', () => {
          // Yes/no option
          cy.get(oeNoRadio).should('be.checked');
          cy.get(oeCodeGroup).should('not.exist');
          cy.get(oeYesLabel).click();
          cy.get(oeCodeGroup).should('be.visible');
          // Code missing message.
          cy.get(warningMsg).should('contain.text', 'Extraction to FHIR Observations requires');
          cy.get(oeNoLabel).click();
          cy.get(warningMsg).should('not.exist');
          cy.get(oeYesLabel).click();
          cy.get(warningMsg).should('be.visible');
          cy.get(warningMsg).contains('Question code').click();
          cy.get(firstCodeInput).type('C1');
          // Should default to none relationship.
          // None should change the extension to valueBoolean: true.
          cy.get(oeNoneRadio).should('be.checked');
          cy.get(warningMsg).should('not.exist');
          cy.get(firstCodeInput).clear();
          cy.get(warningMsg).should('be.visible');
          cy.get(firstCodeInput).type('C1');
          cy.get(warningMsg).should('not.exist');

          cy.questionnaireJSON().should((qJson) => {
            expect(qJson.item[0].code[0].code).to.equal('C1');
            expect(qJson.item[0].extension[0]).to.deep.equal({
              url: observationExtractExtUrl,
              valueBoolean: true
            });
          });

          cy.get(oeNoLabel).click();
          cy.questionnaireJSON().should((qJson) => {
            expect(qJson.item[0].code[0].code).to.equal('C1');
            expect(qJson.item[0].extension).to.be.undefined;
          });

          cy.get(oeYesLabel).click();
          // Selecting any relationship should reflect it in the valueCode.
          cy.get(oeCompLabel).click();
          cy.questionnaireJSON().should((qJson) => {
            expect(qJson.item[0].code[0].code).to.equal('C1');
            expect(qJson.item[0].extension[0]).to.deep.equal({
              url: observationExtractExtUrl,
              valueCode: 'component'
            });
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
          cy.get(firstCodeInput).should('have.value', 'Code1');

          cy.get(oeYesRadio).should('be.checked');

          cy.getTreeNode('Observation relationship - valueCode member').click();
          cy.get('@codeYesRadio').should('be.checked');
          cy.get(firstCodeInput).should('have.value', 'Code1');

          cy.get(oeYesRadio).should('be.checked');
          cy.get(oeMemberRadio).should('be.checked');

          cy.questionnaireJSON().should((qJson) => {
            expect(qJson.item).to.deep.equal(fixtureJson.item);
          });

          // Remove
          cy.get(oeNoLabel).click();
          cy.questionnaireJSON().should((qJson) => {
            expect(qJson.item[1].extension.length).to.equal(2); // Other than oe extension.
            const extExists = qJson.item[1].extension.some((ext) => {
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

  describe('Test descendant items and display/group type changes', () => {
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
      cy.getItemTextField().clear().type('xxx');
      cy.getItemTypeField().select('display');

      cy.clickTreeNode('My health history');
      cy.getTreeNode('xxx').click({force: true}); // Force through tooltip.
      cy.getItemTextField().should('have.value', 'xxx');
      cy.getItemTypeField().should('contain.value', 'display');

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
      cy.getItemTextField().clear().type('Display Data Type');
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
        cy.get('li').should('have.length', 3);
        cy.get('li').eq(2).should('contain.text', 'As a child of target item.')
          .find('input[type="radio"').check();

      });

      cy.get('lfb-node-dialog').contains('button', 'Move').as('moveBtn').click();

      // The modal is displayed.
      cy.get('lfb-confirm-dlg > div.modal-header').should('contain.text', 'Move Not Allowed');
      cy.get('lfb-confirm-dlg > div.modal-body')
        .invoke('text')
        .should('match', /Cannot drop into item 'Display Data Type' \(linkId: [^)]+\) of type 'display' because it cannot contain children\./);

      // Close the modal by clicking the close button
      cy.get('lfb-confirm-dlg').contains('button', 'Close').click();
    });

    it('should not be able to insert a new child item to an item of type "display"', () => {
      cy.toggleTreeNodeExpansion('Family member health history');
      cy.getTreeNode('Race').click();

      // Add a new item under the 'Race' item of data type 'display'.
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().clear().type('Display Data Type');
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

    it('should show "display" data type if the last child is removed from the item', () => {
      cy.toggleTreeNodeExpansion('Family member health history');
      cy.getTreeNode('Race').click();

      // Add a new item under the 'Race' item.
      cy.contains('Add new item').scrollIntoView().click();
      cy.getItemTextField().clear().type('Item with child');
      cy.getItemTypeField().as('dataTypes');
      // Confirm that the data type 'display' is included in the list.
      cy.get('@dataTypes').find('option').should('contain.text', 'display');

      // Create a chid item.
      cy.getTreeNode('Item with child').as('contextNode');
      cy.get('@contextNode').find('button.dropdown-toggle').click();
      cy.get('div.dropdown-menu.show').contains('button.dropdown-item', 'Insert a new child item').click();
      cy.getItemTextField().should('have.value', 'New item 2');

      // Click back to the parent item 'Item with child'.
      cy.getTreeNode('Item with child').click();
      // The data type 'display' should no longer be on the list.
      cy.getItemTypeField().as('dataTypes');
      cy.get('@dataTypes').find('option').should('not.contain.text', 'display');

      // Delete the child item
      cy.getTreeNode('New item 2').as('childItem').click();
      cy.get('@childItem').find('button.dropdown-toggle').click();
      cy.get('div.dropdown-menu.show').contains('button.dropdown-item', 'Remove this item').click();
      cy.contains('button', 'Yes').click();

      // The parent item 'Item with child' should now be the focused node.
      cy.get('#text').should('contain.value', 'Item with child');
      // As the item 'Item with child' no longer has any children, the data type 'display' should once again be available.
      cy.getItemTypeField().as('dataTypes');
      cy.get('@dataTypes').find('option').should('contain.text', 'display');
    });

  });
});

