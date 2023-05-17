/// <reference types="cypress" />

import {Util} from '../../../src/app/lib/util';
import {CypressUtil} from '../../support/cypress-util';
import {ExtensionDefs} from "../../../src/app/lib/extension-defs";

const olpExtUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationLinkPeriod';
const observationExtractExtUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationExtract';
const ucumUrl = 'http://unitsofmeasure.org';

describe('Home page', () => {
  before(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.loadHomePage();
    cy.get('input[type="radio"][value="scratch"]').click();
    cy.get('button').contains('Continue').click();
  })

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

    before(() => {
      cy.get('button').contains('Create questions').click();
    });

    beforeEach(() => {
      cy.resetForm();
      cy.contains('button', 'Create questions').click();
      cy.get('#text').should('have.value', 'Item 0', {timeout: 10000});
      cy.get('#type').as('type');
      cy.contains('.node-content-wrapper', 'Item 0').as('item0');
      cy.get('.btn-toolbar').contains('button', 'Add new item').as('addNewItem');
      cy.get('#__\\$helpText').as('helpText');
      cy.contains('div', 'Question code').should('be.visible').as('codeOption');
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

    it('should import item from CTSS with answer option', () => {
      cy.contains('Add new item from LOINC').scrollIntoView().click();
      cy.contains('ngb-modal-window label', 'Question').click();
      cy.get('#acSearchBoxId').type('vital signs assess');
      cy.get('ngb-typeahead-window button').first().click();
      cy.contains('ngb-modal-window div.modal-dialog button', 'Add').click();
      cy.get('#type option:selected').should('have.text', 'choice');

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
        cy.get('lfb-node-dialog').find('#moveTarget1').click().type('{downarrow}{downarrow}{enter}');

      });

      afterEach(() => {
        cy.resetForm();
        cy.contains('button', 'Create questions').click();
      });

      it('should move before a target node', () => {
        cy.get('input[type="radio"][value="AFTER"]').should('be.checked');
        cy.get('@moveBtn').should('not.be.disabled').click();
        cy.getTreeNode('New item 1').find('span.node-display-prefix').should('have.text', '1');
        cy.getTreeNode('New item 2').find('span.node-display-prefix').should('have.text', '2');
        cy.getTreeNode('Item 0').find('span.node-display-prefix').should('have.text', '3');
        cy.getTreeNode('New item 3').find('span.node-display-prefix').should('have.text', '4');
      });

      it('should move after a target node', () => {
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

    it('should import help text item', () => {
      const helpTextFormFilename = 'help-text-sample.json';
      const helpString = 'testing help text from import';
      cy.uploadFile(helpTextFormFilename, true);
      cy.contains('button', 'Edit questions').click();
      cy.get('@helpText').should('have.value', helpString);
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].text).equal(helpString);
        expect(qJson.item[0].item[0].type).equal('display');
        expect(qJson.item[0].item[0].extension).to.deep.equal(helpTextExtension);
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

      cy.selectDataType('choice');
      cy.get('[id^="initial"]').should('not.be.visible');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('choice');
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
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerOption).to.deep.equal(fixtureJson.item[0].answerOption);
        expect(qJson.item[0].initial).to.deep.equal(fixtureJson.item[0].initial);
      });
    });

    it('should fix initial input box when switched data type from choice to decimal', () => {
      const sampleFile = 'initial-component-bugfix.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.uploadFile(sampleFile, true);
      cy.get('#title').should('have.value', 'Sample to test initial component error');
      cy.contains('button', 'Edit questions').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].answerOption).to.deep.equal(fixtureJson.item[0].item[0].answerOption);
        expect(qJson.item[0].item[0].initial).to.deep.equal(fixtureJson.item[0].item[0].initial);
      });

      cy.toggleTreeNodeExpansion('Group item 1');
      cy.getTreeNode('Choice item 1.1').click();
      cy.get('@type').find(':selected').should('have.text', 'choice');
      cy.get('[id^="answerOption."]').should('be.visible');
      cy.get('[id^="initial"]').should('not.be.visible');
      cy.get('[id^="radio_answerOption.1"]').should('be.checked', true);
      cy.selectDataType('decimal');
      cy.get('[id^="answerOption."]').should('not.exist');
      cy.get('[id^="initial.0.valueDecimal"]').should('be.visible').type('1.2');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].initial[0].valueDecimal).equal(1.2);
      });
    });

    it('should create answerValueSet', () => {
      cy.selectDataType('choice');
      cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('be.checked');
      cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('not.be.checked');
      cy.get('#answerValueSet').should('not.exist');
      cy.get('lfb-answer-option').should('be.visible');

      cy.get('[for^="__\\$answerOptionMethods_value-set"]').click();
      cy.get('#answerValueSet').should('be.visible').as('vsInput');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('@vsInput').type('http://example.org');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).equal('http://example.org');
        expect(q.item[0].answerOption).to.be.undefined;
      });

      cy.get('[for^="__\\$answerOptionMethods_answer-option"]').click();
      cy.get('#answerValueSet').should('not.exist');
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
      cy.get('#type option:selected').should('have.text', 'choice');
      cy.get('[id^="__\\$answerOptionMethods_answer-option"]').should('not.be.checked');
      cy.get('[id^="__\\$answerOptionMethods_value-set"]').should('be.checked');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('#answerValueSet').should('have.value','http://example.org');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerValueSet).to.equal('http://example.org');
      });
    });

    it('should create SNOMED CT answerValueSet', () => {
      cy.selectDataType('choice');
      cy.get('[for^="__\\$answerOptionMethods_snomed-value-set"]').click();

      cy.get('#answerValueSet_ecl').should('be.visible').as('ecl');
      cy.get('@ecl').parent().parent().as('controlDiv');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('@controlDiv').find('span').should('not.exist');
      cy.get('@ecl').type('123');
      cy.get('@controlDiv').find('span').should('contain.text', '&ecl=123');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).contain('&ecl=123');
        expect(q.item[0].answerOption).to.be.undefined;
      });
      cy.get('@ecl').clear();
      cy.get('@controlDiv').find('span').should('not.exist');
      cy.questionnaireJSON().should((q) => {
        expect(q.item[0].answerValueSet).to.be.undefined;
        expect(q.item[0].answerOption).to.be.undefined;
      });
    });

    it('should import a form with an item having SNOMED CT answerValueSet', () => {
      cy.uploadFile('snomed-answer-value-set-sample.json', true);
      cy.get('#title').should('have.value', 'SNOMED answer value set form');
      cy.contains('button', 'Edit questions').click();
      cy.get('#type option:selected').should('have.text', 'choice');
      cy.get('[id^="__\\$answerOptionMethods_snomed-value-set"]').should('be.checked');
      cy.get('lfb-answer-option').should('not.exist');
      cy.get('#answerValueSet_ecl').should('have.value','1234').as('ecl');
      cy.get('@ecl').parent().parent().as('controlDiv');
      cy.get('@controlDiv').find('span').should('contain.text', '&ecl=1234');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].answerValueSet).contain('&ecl=1234');
      });
    });

    it('should display quantity units', () => {
      cy.get('[id^="units"]').should('not.exist'); // looking for *units*
      cy.selectDataType('quantity');
      cy.get('[id^="units"]').last().as('units');
      cy.get('@units').should('be.visible');
      cy.get('#searchResults').should('not.be.visible');
      cy.get('@units').type('inch');
      ['[in_i]', '[in_br]'].forEach((result) => {
        cy.contains('#completionOptions tr', result).click();
        cy.contains('span.autocomp_selected li', result).should('be.visible');
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
      cy.get('@units').last().should('have.value','[in_i]');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('decimal');
        expect(qJson.item[0].extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).equal('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).equal('[in_i]');
        expect(qJson.item[0].extension[0].valueCoding.display).equal('inch');
      });
    });

    it('should add/edit css to text and prefix fields', () => {
      ['#text', '#prefix'].forEach((field) => {
        cy.get(field+'dropdownButton').as('cssButton');
        cy.get(field+'css').as('cssInput');
        cy.contains(field+'dropdownForm button', 'Close').as('closeButton')
        cy.get('@cssButton').click();

        cy.get('@cssInput').should('be.visible');
        cy.get('@cssInput').type('font-weight: bold;');
        cy.get('@closeButton').click();
      });

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0]._text.extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/rendering-style');
        expect(qJson.item[0]._text.extension[0].valueString).equal('font-weight: bold;');
        expect(qJson.item[0]._prefix.extension[0].url).equal('http://hl7.org/fhir/StructureDefinition/rendering-style');
        expect(qJson.item[0]._prefix.extension[0].valueString).equal('font-weight: bold;');
      });

      ['#text', '#prefix'].forEach((field) => {
        cy.get(field+'dropdownButton').as('cssButton');
        cy.get(field+'css').as('cssInput');
        cy.contains(field+'dropdownForm button', 'Close').as('closeButton')
        cy.get('@cssButton').click();

        cy.get('@cssInput').should('be.visible');
        cy.get('@cssInput').should('have.value', 'font-weight: bold;');
        cy.get('@cssInput').clear();
        cy.get('@closeButton').click();
      });

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0]._text).to.be.undefined;
        expect(qJson.item[0]._prefix).to.be.undefined;
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
      cy.selectDataType('header (group/display)');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('display');
      });
      cy.get('@addNewItem').click();

      cy.contains('.node-content-wrapper span', 'New item 1').as('item1');

      cy.dragAndDropNode('New item 1', 'Item 0'); // TODO - Not working, revisit.

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('group');
      });
      cy.get('@item0').dblclick();
      cy.get('@item1').click();
      cy.get('.btn-toolbar').contains('button', 'Delete this item').click();
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('display');
      });
    });

    it('should retain header type after switching to another item and switching back', () => {
      cy.get('@type').contains('string');
      cy.selectDataType('header (group/display)');
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].type).equal('display');
      });
      cy.get('@addNewItem').click();
      cy.get('@type').contains('string');
      cy.get('@item0').click();
      cy.get('@type').contains('header (group/display)');
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
      cy.questionnaireJSON().should((qJson) => {
        expect(qJson).to.deep.equal(fixtureJson);
      });
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
        cy.advancedFields().click();
        cy.tsUrl().should('be.visible'); // Proof of advanced panel expansion
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

      it('should show answer column if there is an answer option in any row of conditional display', () => {
        cy.selectDataType('choice');
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

      it('should work with operator exists value conditional display', () => {
        // cy.selectDataType('choice');
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

      it('should import form with conditional display field', () => {
        const sampleFile = 'enable-when-sample.json';
        let fixtureJson;
        cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
        cy.uploadFile(sampleFile, true);
        cy.get('#title').should('have.value', 'US Surgeon General family health portrait');

        cy.contains('button', 'Edit questions').click();
        cy.advancedFields().click();
        cy.toggleTreeNodeExpansion('Family member health history');
        cy.toggleTreeNodeExpansion('Living?');
        cy.clickTreeNode('Living?');
        cy.get('lfb-answer-option table > tbody > tr').should('have.length', 3);
        cy.get('[id^="answerOption.0.valueCoding.display"]').should('have.value', 'Yes');
        cy.get('[id^="answerOption.0.valueCoding.code"]').should('have.value', 'LA33-6');
        cy.clickTreeNode('Date of Birth');
        cy.get('[id^="enableWhen.0.question"]').should('have.value', 'Living?');
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
        cy.advancedFields().click();
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
        cy.advancedFields().click();
        cy.get('@codeYesRadio').should('be.checked');
        cy.get('[id^="code.0.code"]').should('have.value', 'Code1');
        cy.get('[id^="observationLinkPeriod"]').as('timeWindow')
          .should('exist')
          .should('be.visible')
          .should('have.value', '200');
        // Unit selection.
        cy.get('[id^="select_observationLinkPeriod"] option:selected').should('have.text', 'days');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson).to.deep.equal(fixtureJson);
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
          cy.advancedFields().click();
          cy.get('@codeYesRadio').should('be.checked');
          cy.get('[id^="code.0.code"]').should('have.value', 'Code1');

          cy.get('[id^="radio_Yes_observationExtract"]').should('be.checked');

          cy.questionnaireJSON().should((qJson) => {
            expect(qJson).to.deep.equal(fixtureJson);
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

  describe('Test descendant items and display/group type changes', () => {
    beforeEach(() => {
      const sampleFile = 'USSG-family-portrait.json';
      let fixtureJson;
      cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
      cy.resetForm();
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
      cy.get('#type').select('header (group/display)');

      cy.clickTreeNode('My health history');
      cy.getTreeNode('xxx').click({force: true}); // Force through tooltip.
      cy.get('#text').should('have.value', 'xxx');
      cy.get('#type').should('have.value', '12: group');

      cy.questionnaireJSON().should((qJson) => {
        expect(qJson.item[0].item[0].text).to.equal('xxx');
        expect(qJson.item[0].item[0].type).to.equal('display');
      });
    });
  });
});
