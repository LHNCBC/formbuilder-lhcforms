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
      cy.getItemTextField().should('have.value', 'Item 0', {timeout: 10000});
      cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');
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
        const dropDownBtn = '[for^="__\\$itemControl\\.drop-down"]';
        const radioBtn = '[for^="__\\$itemControl\\.radio-button"]';
        const checkboxBtn = '[for^="__\\$itemControl\\.check-box"]';
        const acBtn = '[for^="__\\$itemControl\\.autocomplete"]';

        const dropDownRadio = '#__\\$itemControl\\.drop-down';
        const unspecifiedRadio = '#__\\$itemControl\\.unspecified';
        const checkboxRadio = '#__\\$itemControl\\.check-box';

        cy.selectDataType('coding');
        cy.getRadioButtonLabel('Create answer list', 'Yes').click();
        cy.getRadioButtonLabel('Answer constraint', 'Allow free text').click();
        cy.get('[for^="__\\$answerOptionMethods_value-set"]').as('nonSnomedMethod');
        cy.get('[for^="__\\$answerOptionMethods_answer-option"]').as('answerOptionMethod');
        cy.get('[for^="__\\$answerOptionMethods_snomed-value-set"]').as('snomedMethod');
        cy.get('@answerOptionMethod').click();
        cy.get(dropDownBtn).should('be.visible');
        // Default for item control is now 'Unspecified'
        cy.get(unspecifiedRadio).should('be.checked');
        cy.get(radioBtn).should('be.visible'); // Radio option when repeats is false by default.
        cy.get(checkboxBtn).should('not.exist'); // Not visible when repeats is true
        cy.get(acBtn).should('not.exist'); // Not visible for answerOption.

        // For value set options.
        ['@snomedMethod', '@nonSnomedMethod'].forEach((vsMethod) => {
          cy.get(vsMethod).click();
          cy.get(dropDownBtn).should('be.visible');
          // Default for item control is now 'Unspecified'
          cy.get(unspecifiedRadio).should('be.checked');
          cy.get(radioBtn).should('be.visible');
          cy.get(checkboxBtn).should('not.exist');
          cy.get(acBtn).should('be.visible'); // Autocomplete should be visible.

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
        cy.getFormTitleField().should('have.value', 'Item control sample form');
        cy.contains('button', 'Edit questions').click();
        cy.get('.spinner-border').should('not.exist');

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
        cy.uploadFile(sampleFile, true);
        cy.getFormTitleField().should('have.value', 'US Surgeon General family health portrait');
        cy.contains('button', 'Edit questions').click();
        cy.get('.spinner-border').should('not.exist');
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
        cy.getItemTypeField().should('contain.value', 'group');
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
        // The button label should display superscript (1) indicating that the item control is not yet supported
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
        // The button label should display superscript (1) indicating that the item control is not  yet supported
        // by LForms Preview.
        cy.get(groupGridBtn).find('sup').should('exist').should('contain.text', '(1)');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['grid']]);
        });

        // Select 'Header' Group Item Control
        cy.get(headerBtn).click();
        cy.get(headerRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not  yet supported
        // by LForms Preview.
        cy.get(headerBtn).find('sup').should('exist').should('contain.text', '(1)');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['header']]);
        });

        // Select 'Footer' Group Item Control
        cy.get(footerBtn).click();
        cy.get(footerRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not  yet supported
        // by LForms Preview.
        cy.get(footerBtn).find('sup').should('exist').should('contain.text', '(1)');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['footer']]);
        });

        // Select 'Page' Group Item Control
        cy.get(pageBtn).click();
        cy.get(pageRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not  yet supported
        // by LForms Preview.
        cy.get(pageBtn).find('sup').should('exist').should('contain.text', '(1)');
        // Extension should be add
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension).to.deep.equal([groupItemControlExtensions['page']]);
        });

        // Select 'Tab Container' Group Item Control
        cy.get(tabContainerBtn).click();
        cy.get(tabContainerRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not  yet supported
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
        cy.getItemTypeField().should('contain.value', 'group');
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
        cy.getFormTitleField().should('have.value', 'Display item control sample form');
        cy.contains('button', 'Edit questions').click();
        cy.get('.spinner-border').should('not.exist');
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
        cy.getItemTypeField().should('contain.value', 'display');
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
        cy.getItemTypeField().should('contain.value', 'display');
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
        cy.getItemTypeField().should('contain.value', 'display');
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
        cy.getItemTypeField().should('contain.value', 'display');
        // The 'Lower-bound' Display Item Control should be selected.
        cy.get(lowerRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not  yet supported
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
        cy.getItemTypeField().should('contain.value', 'display');
        // The 'Upper-bound' Display Item Control should be selected.
        cy.get(upperRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not  yet supported
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
        cy.getItemTypeField().should('contain.value', 'display');
        // The 'Fly-over' Display Item Control should be selected.
        cy.get(flyoverRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not  yet supported
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
        cy.getItemTypeField().should('contain.value', 'display');
        // The 'Legal-button' Display Item Control should be selected.
        cy.get(legalRadio).should('be.checked');
        // The button label should display superscript (1) indicating that the item control is not  yet supported
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

    describe('Question item control', () => {
      it('should display Question item-control extension', () => {
        const sampleFile = 'question-item-control-sample.json';
        let fixtureJson;
        cy.readFile('cypress/fixtures/'+sampleFile).should((json) => {fixtureJson = json});
        cy.uploadFile(sampleFile, true);
        cy.getFormTitleField().should('have.value', 'Question item control sample form');
        cy.contains('button', 'Edit questions').click();

        cy.getItemTypeField().should('contain.value', 'string');

        // Invoke preview.
        cy.contains('button', 'Preview').click();
        cy.get('lhc-item').as('lhc-item');

        // The first lhc-item
        cy.get('@lhc-item').first().within(() => {
          // Check for element label
          cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
            .should('have.text', 'Autocomplete question item control displays as drop-down');
          // Check for element input
          cy.get('.lhc-de-input-unit').within(() => {
            // Validate the input with role="combobox" exists in the correct structure
            cy.get('lhc-item-choice-autocomplete lhc-autocomplete > div > input.ac_multiple.ansList')
              .should('exist');
          });
        });

        // The 2nd lhc-item
        cy.get('@lhc-item').eq(1).within(() => {
          // Check for element label
          cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
            .should('have.text', 'Autocomplete question item control displays as autocomplete search');
          // Check for element input
          cy.get('.lhc-de-input-unit').within(() => {
            cy.get('lhc-item-choice-autocomplete lhc-autocomplete input.search_field')
              .should('exist');
          });
        });

        // The 3rd lhc-item
        cy.get('@lhc-item').eq(2).within(() => {
          // Check for element label
          cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
            .should('have.text', 'Drop down question item control');
          // Check for element input
          cy.get('.lhc-de-input-unit').within(() => {
            cy.get('lhc-item-choice-autocomplete lhc-autocomplete > div > input.ac_multiple.ansList')
              .should('exist');
          });
        });

        // The 4th lhc-item
        cy.get('@lhc-item').eq(3).within(() => {
          // Check for element label
          cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
            .should('have.text', 'Check-box question item control displays as checkbox');
          // Check for element input
          cy.get('.lhc-de-input-unit').within(() => {
            cy.get('lhc-item-choice-check-box').within(() => {
              cy.get('input[type="checkbox"]').should('have.length', 4);
            });
          });
        });

        // The 5th lhc-item
        cy.get('@lhc-item').eq(4).within(() => {
          // Check for element label
          cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
            .should('have.text', 'Radio button question item control');
          // Check for element input
          cy.get('.lhc-de-input-unit').within(() => {
            cy.get('lhc-item-choice-radio-button').within(() => {
              cy.get('input[type="radio"]').should('have.length', 4);
            });
          });
        });

        // The 6th lhc-item
        cy.get('@lhc-item').eq(5).within(() => {
          // Check for element label
          cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
            .should('have.text', 'Slider question item control - not yet supported by LHC-Forms preview');
          // Check for element input
          cy.get('.lhc-de-input-unit').within(() => {
            cy.get('input[type="text"]').should('exist');
          });
        });

        //The 7th lhc-item
        cy.get('@lhc-item').eq(6).within(() => {
          // Check for element label
          cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
            .should('have.text', 'Spinner question item control - not yet supported by LHC-Forms preview');
          // Check for element input
          cy.get('.lhc-de-input-unit').within(() => {
            cy.get('input[type="text"]').should('exist');
          });
        });

        // The 8th lhc-item
        cy.get('@lhc-item').eq(7).within(() => {
          // Check for element label
          cy.get('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question')
            .should('have.text', 'Text Box question item control - not yet supported by LHC-Forms preview');
          // Check for element input
          cy.get('.lhc-de-input-unit').within(() => {
            cy.get('input[type="text"]').should('exist');
          });
        });
      });

      it('should display different question item controls based on data types', () => {
        // Select 'boolean' data type
        cy.checkQuestionItemControlUI('boolean', null,  null, null, null);

        // Select 'decimal' data type
        cy.checkQuestionItemControlUI('decimal',  ['Slider (1)', 'Spinner (1)', 'Unspecified'], null, null, null);

        // Select 'integer' data type
        cy.checkQuestionItemControlUI('integer',
          ['Slider (1)', 'Spinner (1)', 'Unspecified'],
          ['Drop down', 'Radio Button', 'Unspecified'],
          ['Drop down', 'Check-box', 'Unspecified'], null);

        // Select 'date' data type
        cy.checkQuestionItemControlUI('date',
          ['Spinner (1)', 'Unspecified'],
          ['Drop down', 'Radio Button', 'Unspecified'],
          ['Drop down', 'Check-box', 'Unspecified'], null);

        // Select 'dateTime' data type
        cy.checkQuestionItemControlUI('dateTime', ['Spinner (1)', 'Unspecified'], null, null, null);

        // Select 'time' data type
        cy.checkQuestionItemControlUI('time',
          ['Spinner (1)', 'Unspecified'],
          ['Drop down', 'Radio Button', 'Unspecified'],
          ['Drop down', 'Check-box', 'Unspecified'], null);

        // Select 'string' data type
        cy.checkQuestionItemControlUI('string',
          ['Text Box (1)', 'Unspecified'],
          ['Drop down', 'Radio Button', 'Unspecified'],
          ['Drop down', 'Check-box', 'Unspecified'], null);

        // Select 'text' data type
        cy.checkQuestionItemControlUI('text',
          ['Text Box (1)', 'Unspecified'],
          ['Drop down', 'Radio Button', 'Unspecified'],
          ['Drop down', 'Check-box', 'Unspecified'], null);

        // Select 'url' data type
        cy.checkQuestionItemControlUI('url', null,  null, null, null);

        // Select 'coding' data type
        cy.checkQuestionItemControlUI('coding', null,
          ['Drop down', 'Radio Button', 'Unspecified'],
          ['Drop down', 'Check-box', 'Unspecified'],
          ['Auto-complete', 'Drop down', 'Check-box', 'Unspecified']);

        // Select 'quantity' data type
        cy.checkQuestionItemControlUI('quantity', null,  null, null, null);
      });
    });
  });
});
