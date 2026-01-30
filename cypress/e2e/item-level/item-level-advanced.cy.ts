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