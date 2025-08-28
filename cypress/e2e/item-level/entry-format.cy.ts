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

    describe('Entry format extension', () => {
      beforeEach(() => {
        const sampleFile = 'entry-format-sample.json';
        cy.uploadFile(sampleFile, true);
        cy.getFormTitleField().should('have.value', 'Entry format extension');
        cy.contains('button', 'Edit questions').click();
        cy.get('.spinner-border').should('not.exist');
      });

      it('should display entry format placeholder for different data types', () => {
        cy.get('tree-root tree-viewport tree-node-collection tree-node').first().should('be.visible');

        // Decimal data type
        cy.getItemTextField().should('have.value', 'Decimal data type');
        cy.getItemTypeField().should('contain.value', 'decimal');
        cy.get('[id="__$entryFormat"]').should('have.value', 'Enter value between 15.2 and 20.1');

        // Integer data type
        cy.getTreeNode('Integer data type').click();
        cy.getItemTextField().should('have.value', 'Integer data type');
        cy.getItemTypeField().should('contain.value', 'integer');
        cy.get('[id="__$entryFormat"]').should('have.value', 'nnn');

        // Date data type
        cy.getTreeNode('Date data type').click();
        cy.getItemTextField().should('have.value', 'Date data type');
        cy.getItemTypeField().should('contain.value', 'date');
        cy.get('[id="__$entryFormat"]').should('have.value', 'YY/MM/DD');

        // Datetime data type
        cy.getTreeNode('Datetime data type').click();
        cy.getItemTextField().should('have.value', 'Datetime data type');
        cy.getItemTypeField().should('contain.value', 'dateTime');
        cy.get('[id="__$entryFormat"]').should('have.value', 'YY/MM/DD hh:mm:ss');

        // Time data type
        cy.getTreeNode('Time data type').click();
        cy.getItemTextField().should('have.value', 'Time data type');
        cy.getItemTypeField().should('contain.value', 'time');
        cy.get('[id="__$entryFormat"]').should('have.value', 'hh:mm:ss');

        // String data type
        cy.getTreeNode('String data type').click();
        cy.getItemTextField().should('have.value', 'String data type');
        cy.getItemTypeField().should('contain.value', 'string');
        cy.get('[id="__$entryFormat"]').should('have.value', 'nnn-nnn-nnn');

        // Text data type
        cy.getTreeNode('Text data type').click();
        cy.getItemTextField().should('have.value', 'Text data type');
        cy.getItemTypeField().should('contain.value', 'text');
        cy.get('[id="__$entryFormat"]').should('have.value', 'Max 100 characters.');

        // URL data type
        cy.getTreeNode('URL data type').click();
        cy.getItemTextField().should('have.value', 'URL data type');
        cy.getItemTypeField().should('contain.value', 'url');
        cy.get('[id="__$entryFormat"]').should('have.value', 'https://your-site.com');

        // Coding data type
        cy.getTreeNode('Coding data type').click();
        cy.getItemTextField().should('have.value', 'Coding data type');
        cy.getItemTypeField().should('contain.value', 'coding');
        cy.get('[id="__$entryFormat"]').should('have.value', 'Select option.');

        // Quantity data type
        cy.getTreeNode('Quantity data type').click();
        cy.getItemTextField().should('have.value', 'Quantity data type');
        cy.getItemTypeField().should('contain.value', 'quantity');
        cy.get('[id="__$entryFormat"]').should('have.value', 'Please enter weight.');

        // Invoke preview.
        cy.contains('button', 'Preview').click();

        // Each item should have placeholder populated
        const expectedPlaceholders = ["Enter value between 15.2 and 20.1", "nnn", "YY/MM/DD", "YY/MM/DD hh:mm:ss", "hh:mm:ss",
          "nnn-nnn-nnn", "https://your-site.com", "Select option.", "Please enter weight."];
        cy.get('lhc-item lhc-item-question input:first').each(($el, index) => {
          cy.wrap($el).invoke('attr', 'placeholder').should('eq', expectedPlaceholders[index]);
        });

        cy.get('lhc-item lhc-item-question textarea').should('have.attr', 'placeholder', 'Max 100 characters.');
      });

      it('should update entry format placeholder for different data types', () => {
        cy.get('tree-root tree-viewport tree-node-collection tree-node').first().should('be.visible');

        // Decimal data type
        cy.getItemTextField().should('have.value', 'Decimal data type');
        cy.get('[id="__$entryFormat"]').clear().type('##.##');

        // Integer data type
        cy.getTreeNode('Integer data type').click();
        cy.getItemTextField().should('have.value', 'Integer data type');
        cy.get('[id="__$entryFormat"]').clear().type('n');

        // Date data type
        cy.getTreeNode('Date data type').click();
        cy.getItemTextField().should('have.value', 'Date data type');
        cy.get('[id="__$entryFormat"]').clear().type('YYYY');

        // Datetime data type
        cy.getTreeNode('Datetime data type').click();
        cy.getItemTextField().should('have.value', 'Datetime data type');
        cy.get('[id="__$entryFormat"]').clear().type('YYYY hh:mm:ss');

        // Time data type
        cy.getTreeNode('Time data type').click();
        cy.getItemTextField().should('have.value', 'Time data type');
        cy.get('[id="__$entryFormat"]').clear().type('hh:mm');

        // String data type
        cy.getTreeNode('String data type').click();
        cy.getItemTextField().should('have.value', 'String data type');
        cy.get('[id="__$entryFormat"]').clear().type('nnn-nnn');

        // Text data type
        cy.getTreeNode('Text data type').click();
        cy.getItemTextField().should('have.value', 'Text data type');
        cy.get('[id="__$entryFormat"]').clear().type('Max 200 characters.');

        // URL data type
        cy.getTreeNode('URL data type').click();
        cy.getItemTextField().should('have.value', 'URL data type');
        cy.get('[id="__$entryFormat"]').clear().type('https://my-site.com');

        // Coding data type
        cy.getTreeNode('Coding data type').click();
        cy.getItemTextField().should('have.value', 'Coding data type');
        cy.get('[id="__$entryFormat"]').clear().type('Select one of the following options.');

        // Quantity data type
        cy.getTreeNode('Quantity data type').click();
        cy.getItemTextField().should('have.value', 'Quantity data type');
        cy.get('[id="__$entryFormat"]').clear().type('Please enter your weight.');

        // Invoke preview.
        cy.contains('button', 'Preview').click();

        // Each item should have placeholder populated
        const expectedPlaceholders = ["##.##", "n", "YYYY", "YYYY hh:mm:ss", "hh:mm", "nnn-nnn", "https://my-site.com",
          "Select one of the following options.", "Please enter your weight."];
        cy.get('lhc-item lhc-item-question input:first').each(($el, index) => {
          cy.wrap($el).invoke('attr', 'placeholder').should('eq', expectedPlaceholders[index]);
        });

        cy.get('lhc-item lhc-item-question textarea').should('have.attr', 'placeholder', 'Max 200 characters.')
      });

      it('should remove entry format placeholder for different data types', () => {
        cy.get('tree-root tree-viewport tree-node-collection tree-node').first().should('be.visible');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].type).equal('decimal');
          expect(qJson.item[0].extension[3]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "Enter value between 15.2 and 20.1"
          });
          expect(qJson.item[1].extension[0]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "nnn"
          });
          expect(qJson.item[2].extension[0]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "YY/MM/DD"
          });
          expect(qJson.item[3].extension[0]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "YY/MM/DD hh:mm:ss"
          });
          expect(qJson.item[4].extension[0]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "hh:mm:ss"
          });
          expect(qJson.item[5].extension[0]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "nnn-nnn-nnn"
          });
          expect(qJson.item[6].extension[0]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "Max 100 characters."
          });
          expect(qJson.item[7].extension[0]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "https://your-site.com"
          });
          expect(qJson.item[8].extension[1]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "Select option."
          });
          expect(qJson.item[9].extension[3]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "Please enter weight."
          });
        });

        // Decimal data type
        cy.getItemTextField().should('have.value', 'Decimal data type');
        cy.get('[id="__$entryFormat"]').clear();

        // Integer data type
        cy.getTreeNode('Integer data type').click();
        cy.getItemTextField().should('have.value', 'Integer data type');
        cy.get('[id="__$entryFormat"]').clear();

        // Date data type
        cy.getTreeNode('Date data type').click();
        cy.getItemTextField().should('have.value', 'Date data type');
        cy.get('[id="__$entryFormat"]').clear();

        // Datetime data type
        cy.getTreeNode('Datetime data type').click();
        cy.getItemTextField().should('have.value', 'Datetime data type');
        cy.get('[id="__$entryFormat"]').clear();

        // Time data type
        cy.getTreeNode('Time data type').click();
        cy.getItemTextField().should('have.value', 'Time data type');
        cy.get('[id="__$entryFormat"]').clear();

        // String data type
        cy.getTreeNode('String data type').click();
        cy.getItemTextField().should('have.value', 'String data type');
        cy.get('[id="__$entryFormat"]').clear();

        // Text data type
        cy.getTreeNode('Text data type').click();
        cy.getItemTextField().should('have.value', 'Text data type');
        cy.get('[id="__$entryFormat"]').clear();

        // URL data type
        cy.getTreeNode('URL data type').click();
        cy.getItemTextField().should('have.value', 'URL data type');
        cy.get('[id="__$entryFormat"]').clear();

        // Coding data type
        cy.getTreeNode('Coding data type').click();
        cy.getItemTextField().should('have.value', 'Coding data type');
        cy.get('[id="__$entryFormat"]').clear();

        // Quantity data type
        cy.getTreeNode('Quantity data type').click();
        cy.getItemTextField().should('have.value', 'Quantity data type');
        cy.get('[id="__$entryFormat"]').clear();

        // Invoke preview.
        cy.contains('button', 'Preview').click();

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].type).equal('decimal');
          expect(qJson.item[0].extension[3]).undefined;

          // the entryFormat has been deleted.
          expect(qJson.item[1].extension[0]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-unit",
            "valueCoding": {
              "code": "kg",
              "display": "kilogram",
              "system": "http://unitsofmeasure.org"
            }
          });

          expect(qJson.item[2].type).equal('date');
          expect(qJson.item[2].extension).undefined;

          expect(qJson.item[3].type).equal('dateTime');
          expect(qJson.item[3].extension).undefined;

          expect(qJson.item[4].type).equal('time');
          expect(qJson.item[4].extension).undefined;

          expect(qJson.item[5].type).equal('string');
          expect(qJson.item[5].extension).undefined;

          expect(qJson.item[6].type).equal('text');
          expect(qJson.item[6].extension).undefined;

          expect(qJson.item[7].type).equal('url');
          expect(qJson.item[7].extension).undefined;

          expect(qJson.item[8].type).equal('coding');
          expect(qJson.item[8].extension[1]).undefined;

          expect(qJson.item[9].type).equal('quantity');
          expect(qJson.item[9].extension[3]).undefined;
        });
      });

      it('should correctly display the entry format even when other extensions are present', () => {
        cy.get('tree-root tree-viewport tree-node-collection tree-node').first().should('be.visible');

        // There should only be one entryFormat extension, however, should there be more than one, the
        // last entry format will be used.
        cy.getItemTextField().should('have.value', 'Decimal data type');
        cy.getItemTypeField().should('contain.value', 'decimal');
        cy.get('[id="__$entryFormat"]').should('have.value', 'Enter value between 15.2 and 20.1');

        // Looking at the JSON, there are actually two entryFormats.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].type).equal('decimal');
          expect(qJson.item[0].extension[2]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "#,###.##"
          });
          expect(qJson.item[0].extension[3]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "Enter value between 15.2 and 20.1"
          });
        });

        // Invoke preview.
        cy.contains('button', 'Preview').click();

        // The LForms preview should display the correct message.
        cy.get('lhc-item lhc-item-question lhc-input > input:first')
          .first()
          .invoke('attr', 'placeholder')
          .should('eq', 'Enter value between 15.2 and 20.1');

        // Close the Preview dialog.
        cy.contains('mat-dialog-actions > button', 'Close').scrollIntoView().click();

        // Clear the entry format.
        cy.getTreeNode('Decimal data type').click();
        cy.get('[id="__$entryFormat"]').clear()

        // Both entry formats got deleted actually. This is preferrable to suddenly
        // popping up with the '#,###.##'.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension[2]).undefined;
          expect(qJson.item[0].extension[3]).undefined;
        });

        // Re-enter the entry format.
        cy.get('[id="__$entryFormat"]').type('Enter value between 15.2 and 20.1');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension[2]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "Enter value between 15.2 and 20.1"
          });
        });

        // Invoke preview.
        cy.contains('button', 'Preview').click();

        // The LForms preview should display the correct message.
        cy.get('lhc-item lhc-item-question lhc-input > input:first')
          .first()
          .invoke('attr', 'placeholder')
          .should('eq', 'Enter value between 15.2 and 20.1');

        // Close the Preview dialog.
        cy.contains('mat-dialog-actions > button', 'Close').scrollIntoView().click();

        // Add a unit extension to the item.
        cy.get('[id^="units"]').first().as('units');
        cy.get('@units').should('be.visible');
        cy.get('#lhc-tools-searchResults').should('not.be.visible');
        cy.get('@units').type('inch');
        cy.get('#lhc-tools-searchResults').should('be.visible');
        cy.contains('#completionOptions tr', '[in_i]').click();
        cy.get('@units').should('have.value', 'inch');

        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension[3]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-unit",
            "valueCoding": {
              "system": "http://unitsofmeasure.org",
              "code": "[in_i]",
              "display": "inch"
            }
          });
        });

        // Change the entryFormat
        cy.get('[id="__$entryFormat"]').type('{selectall}Enter here.');

        // The order should remain the same, unless .clear() is being called before .type(),
        // then the entryFormat will get append as a last entry.
        cy.questionnaireJSON().should((qJson) => {
          expect(qJson.item[0].extension[2]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/entryFormat",
            "valueString": "Enter here."
          });
          expect(qJson.item[0].extension[3]).to.deep.equal({
            "url": "http://hl7.org/fhir/StructureDefinition/questionnaire-unit",
            "valueCoding": {
              "system": "http://unitsofmeasure.org",
              "code": "[in_i]",
              "display": "inch"
            }
          });

        });
      });
    });
  });
});