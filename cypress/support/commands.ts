// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
//  commands, please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
import {isEqual} from 'lodash';
import {CypressUtil} from "./cypress-util";
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 * Load the home page and wait until LForms is loaded.
 */
Cypress.Commands.add('loadHomePage',() => {
  cy.clearSession();
  cy.goToHomePage();
  cy.acceptAllTermsOfUse();
});

/**
 * Load the page without accepting SNOMED license.
 */
Cypress.Commands.add('loadHomePageWithLoincOnly',() => {
  cy.clearSession();
  cy.goToHomePage();
  cy.acceptLoincOnly();
});


/**
 * Visit the home page and assert LForms, but do not deal with LOINC notice.
 */
Cypress.Commands.add('goToHomePage', () => {
  CypressUtil.mockLFormsLoader();
  cy.visit('/');
  cy.window({timeout: 60000}).should('have.property', 'LForms');
});


/**
 * Accept LOINC notice dialog.
 */
Cypress.Commands.add('acceptAllTermsOfUse', () => {
  cy.get('#acceptLoinc').click();
  cy.get('#useSnomed').click();
  cy.get('#acceptSnomed').click();
  cy.contains('lfb-loinc-notice button', 'Accept').click();
});

Cypress.Commands.add('acceptLoincOnly', () => {
  cy.get('#acceptLoinc').click();
  cy.contains('lfb-loinc-notice button', 'Accept').click();
});


/**
 * Clear session storage. Used to test LOINC notice.
 */
Cypress.Commands.add('clearSession',() => {
  cy.window()
    .its('localStorage')
    .invoke('clear');
  cy.window()
    .its('sessionStorage')
    .invoke('clear');
});


/**
 * Read a local storage item.
 */
Cypress.Commands.add('getLocalStorageItem', (itemName) => {
  return cy.window()
    .its('localStorage')
    .invoke('getItem', itemName);
});


/**
 * Get an item from session storage.
 */
Cypress.Commands.add('getSessionStorageItem',(item) => {
  return cy.window()
    .its('sessionStorage').invoke('getItem', item);
});



/**
 * Command to upload a file.
 * @param fileName - Name of the file to upload
 */
Cypress.Commands.add('uploadFile',(fileName, handleWarning) => {
  cy.fixture(fileName, null).as("myFixture");
  cy.get('input[type="file"]').selectFile('@myFixture', {force: true});
  if(handleWarning) {
    cy.handleWarning();
  }
});

/**
 * Command to get JSON from 'Preview'
 */
Cypress.Commands.add('questionnaireJSON', () => {
  return CypressUtil.getQuestionnaireJSON();
});

/**
 * Command to select data type in item editor.
 */
Cypress.Commands.add('selectDataType', (type) => {
  cy.getItemTypeField().select(type);
});

/**
 * Select a node by its text in the sidebar. The text is read from the tooltip.
 */
Cypress.Commands.add('getTreeNode', (text) => {
  return cy.get('div[role="tooltip"]:contains("'+text+'")').invoke('attr', 'id').then((tooltipId) => {
    return cy.get('div[aria-describedby="' + tooltipId + '"]:visible');
  });
});

/**
 * Toggle expansion and collapse of tree node having children.
 */
Cypress.Commands.add('toggleTreeNodeExpansion', (text) => {
  cy.get('div[role="tooltip"]:contains("'+text+'")').invoke('attr', 'id').then(tooltipId => {
    cy.get('tree-root tree-viewport tree-node-collection tree-node tree-node-wrapper div.node-wrapper div tree-node-content div')
      .filter('div[aria-describedby="'+tooltipId+'"]').parents('div.node-wrapper').find('tree-node-expander').as('expander');
    cy.get('@expander').should('be.visible');
    cy.get('@expander').click();
    cy.getTreeNode(text).should('be.visible');
  });
});


/**
 * Load LOINC form using a search term. Picks first item from the result list.
 * @param searchTerm - Search term to search the LOINC database.
 */
Cypress.Commands.add('loadLOINCForm', (searchTerm) => {
  cy.contains('nav.navbar button', 'Import').as('importBtn').scrollIntoView();
  cy.get('@importBtn').click();
  cy.get('div.dropdown-menu.show form input[placeholder="Search LOINC"]').as('searchBox');
  cy.get('@searchBox').type(searchTerm);
  cy.get('ngb-typeahead-window').should('be.visible');
  cy.get('@searchBox').type('{enter}');
  cy.get('ngb-typeahead-window').should('not.exist');
  cy.get('@searchBox').type('{esc}');
});

/**
 * Get JSON from FHIR server response after create/update interaction.
 * @param menuText - Menu text to pick the menu item.
 */
Cypress.Commands.add('FHIRServerResponse', (menuText, serverBaseUrl = 'https://lforms-fhir.nlm.nih.gov/baseR4') => {
  cy.contains('button.dropdown-toggle.btn', 'Export').click();
  cy.contains('div.dropdown-menu.show button.dropdown-item', menuText).as('menu');
  cy.get('@menu').should('be.visible');
  cy.contains('button.dropdown-item', menuText).as('createMenu');
  cy.get('@createMenu').should('be.visible').click();
  if(menuText.startsWith('Create')) {
    const serverId = '#' + serverBaseUrl.replace(/([-:./])/g, '\\$1');
    cy.get(serverId).click();
    cy.contains('lfb-fhir-servers-dlg div button', 'Continue').click();
  }
  return cy.get('lfb-fhir-export-dlg div pre.fhir-response').invoke('text').then((text) => {
    cy.contains('lfb-fhir-export-dlg div button', 'Close').click();
    return cy.wrap(JSON.parse(text));
  });
});

Cypress.Commands.add('enterAnswerOptions', (codings) => {
  cy.selectDataType('coding');
  cy.getRadioButtonLabel('Create answer list', 'Yes').click();
  cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
  cy.get('[id^="answerOption"]').should('be.visible');
  codings.forEach((coding, index) => {
    cy.get('[id^="answerOption.'+index+'."]').should('be.visible');
    Object.keys(coding).forEach((key) => {
      cy.get('[id^="answerOption.'+index+'.valueCoding.'+key+'"]').type(coding[key]).type('{enter}');
    });
    cy.contains('button', 'Add another answer').click();
  });
});


/**
 * Create a sample answer option list.
 */
Cypress.Commands.add('addAnswerOptions', () => {
  cy.selectDataType('coding');
  cy.getRadioButtonLabel('Create answer list', 'Yes').click();
  cy.getRadioButtonLabel('Answer constraint', 'Restrict to the list').click();
  // No 'initial' widget for coding. User selects default radio in answer option table.
  // cy.get('[id^="initial"]').should('not.be.visible');
  cy.get('[id^="answerOption.0.valueCoding.system"]').type('s1');
  cy.get('[id^="answerOption.0.valueCoding.display"]').type('d1');
  cy.get('[id^="answerOption.0.valueCoding.code"]').type('c1');
  cy.get('[id^="answerOption.0.valueCoding.__$score"]').type('2.1');

  cy.questionnaireJSON().should((qJson) => {
    console.log(JSON.stringify(qJson, null, 2));
    expect(qJson.item[0].type).equal('coding');
    expect(qJson.item[0].answerConstraint).equal('optionsOnly');
    expect(qJson.item[0].answerOption[0].valueCoding).to.deep.equal({display: 'd1', code: 'c1', system: 's1'});
    expect(qJson.item[0].answerOption[0].extension).to.deep.equal([{
      url: 'http://hl7.org/fhir/StructureDefinition/itemWeight',
      valueDecimal: 2.1
    }]);
  });

  // Add a second answerOption.
  cy.contains('button', 'Add another answer').click();

  cy.get('[id^="answerOption.1.valueCoding.system"]').type('s2');
  cy.get('[id^="answerOption.1.valueCoding.display"]').type('d2');
  cy.get('[id^="answerOption.1.valueCoding.code"]').type('c2');
  cy.get('[id^="answerOption.1.valueCoding.__$score"]').type('3');
  // Select the first option
  cy.contains('div', 'Value method').find('[for^="__$valueMethod_pick-initial"]').click();
  cy.get('[id^="pick-answer"]').as('pickAnswer');
  cy.get('@pickAnswer').click();
  cy.get('#lhc-tools-searchResults ul > li').should('have.length', 2);
  cy.get('@pickAnswer').type('{downarrow}{enter}');
  cy.get('@pickAnswer').should('have.value', 'd1');

  cy.questionnaireJSON().should((qJson) => {
    expect(qJson.item[0].type).equal('coding');
    expect(qJson.item[0].answerConstraint).equal('optionsOnly');
    expect(qJson.item[0].answerOption).to.deep.equal([
      {
        initialSelected: true,
        valueCoding: {display: 'd1', code: 'c1', system: 's1'},
        extension: [{
          url: 'http://hl7.org/fhir/StructureDefinition/itemWeight',
          valueDecimal: 2.1
        }]
      },
      {
        valueCoding: {display: 'd2', code: 'c2', system: 's2'},
        extension: [{
          url: 'http://hl7.org/fhir/StructureDefinition/itemWeight',
          valueDecimal: 3
        }]
      },
    ]);
  });
});

/**
 * Test code yes no options
 */
Cypress.Commands.add('includeExcludeCodeField', {prevSubject: true}, (codeOptionElement, formOrItem) => {
  const formTesting = formOrItem === 'form';
  cy.wrap(codeOptionElement).find('[for^="booleanRadio_true"]').as('codeYes');
  cy.wrap(codeOptionElement).find('[for^="booleanRadio_false"]').as('codeNo');
  cy.get('[id^="booleanRadio_false"]').should('be.checked');
  cy.questionnaireJSON().should((q) => {
    const jsonCode = formTesting ? q.code : q.item[0].code;
    expect(jsonCode).to.be.undefined;
  });

  const coding = {code: 'c1', system: 's1', display: 'd1'}
  cy.get('@codeYes').click();
  cy.get('[id^="code.0.code_"]').as('code');
  cy.get('@code').type('ab ');
  cy.get('@code').next('ul').find('small').as('codeError');
  cy.get('@codeError').should('be.visible');
  cy.get('@codeError').contains('Spaces are not allowed at the beginning or end.');
  cy.get('@code').clear();
  cy.get('@code').type(coding.code);
  cy.get('[id^="code.0.system_"]').type(coding.system);
  cy.get('[id^="code.0.display_"]').type(coding.display);
  cy.questionnaireJSON().should((q) => {
    const code = formTesting ? q.code : q.item[0].code;
    expect(code).to.deep.equal([coding]);
  });

  cy.get('@codeNo').click();
  cy.questionnaireJSON().should((q) => {
    const code = formTesting ? q.code : q.item[0].code;
    expect(code).to.be.undefined;
  });

  cy.get('@codeYes').click();
  cy.questionnaireJSON().should((q) => {
    const code = formTesting ? q.code : q.item[0].code;
    expect(code).to.deep.equal([coding]);
  });
});

//For Cypress drag and drop custom command
/**
 * TODO - Not working, revisit.
 * @param dragNodeText - Identifying text of the source node.
 * @param dropNodeText - Identifying text of destination node
 */
Cypress.Commands.add('dragAndDropNode', (dragNodeText, dropNodeText) => {

  const dropSelector = '.node-content-wrapper span:contains("' + dropNodeText + '")';
  const dragSelector = '.node-content-wrapper span:contains("' + dragNodeText + '")';
  let coords: any;
  cy.get(dropSelector).should(($eList) => {
    const droppable = $eList[0];
    coords = droppable.getBoundingClientRect();
  });

  cy.get(dragSelector).should(($eList) => {
    const draggable = $eList[0];
    // The sequence of mouse events
    draggable.dispatchEvent(new MouseEvent('mousedown'));
    draggable.dispatchEvent(new MouseEvent('mousemove', { clientX: 5, clientY: 0 }));
    draggable.dispatchEvent(new MouseEvent('mousemove', {
      clientX: coords.left + 5,
      clientY: coords.top + 5  // A few extra pixels to get the ordering right
    }));
    draggable.dispatchEvent(new MouseEvent('mouseup'));
  });

  return cy.get(dropSelector).should(($eList) => {
    const classList = Array.from($eList[0].classList);
    return classList.includes('node-content-wrapper-focused');
  });
});


/**
 * Interact with FHIR server selection and do search with <code>titleSearchTerm</code>
 * and pick the first result to load into the form builder.
 * Make sure to create a mock response based on titleSearchTerm.
 */
Cypress.Commands.add('fhirSearch', (titleSearchTerm) => {

  cy.intercept(
    `**title:contains=${titleSearchTerm}**`,
    {fixture: `fhir-server-mock-response-${titleSearchTerm}.json`}).as("searchFHIRServer");

  cy.get('input[type="radio"][name="fhirServer"]').first().click();
  cy.contains('div.modal-footer button', 'Continue').click();
  cy.get('input.form-control[placeholder="Search any text field"]').type(titleSearchTerm);
  cy.get('#searchField1').select('Form title only');
  cy.get('#button-addon2').click();
  cy.wait('@searchFHIRServer');
  cy.get('div.list-group').should('be.visible');
  cy.get('a.result-item').first().click();
});

/**
 * Expect the warning dialog and click continue.
 */
Cypress.Commands.add('handleWarning', () => {
  cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
  cy.contains('div.modal-footer button', 'Continue').click();
});

/**
 * Read a form from local storage and compare it with the default form.
 * Yields boolean
 */
Cypress.Commands.add('isDefault', () => {
  let defaultForm = {
    resourceType: 'Questionnaire',
    title: 'New Form',
    status: 'draft',
    item: []
  };
  let ret = false;
  return cy.getCurrentForm().then((form) => {
    ret = isEqual(form, defaultForm);
    return cy.wrap(ret);
  });
});

/**
 * Read local storage to get the loaded form.
 */
Cypress.Commands.add('getCurrentForm', () => {
  return cy.getLocalStorageItem('fhirQuestionnaire').then((formStr) => {
    const form = formStr && formStr.length > 0 ? JSON.parse(formStr) : null;
    return cy.wrap(form);
  });
});

/**
 * Reset form builder.
 * Using the Close menu option to reset.
 */
Cypress.Commands.add('resetForm', () => {
  cy.contains('nav.navbar > div > button', 'Close').click();
  cy.get('input[type="radio"][value="scratch"]').click();
  cy.get('button').contains('Continue').click();
});


/**
 * Wait for spinner.
 */
Cypress.Commands.add('waitForSpinner', () => {
  cy.get('.spinner-border').should('be.visible');
  cy.get('.spinner-border').should('not.exist');
});

/**
 * CLick a node on the sidebar.
 */
Cypress.Commands.add('clickTreeNode', (nodeText) => {
  cy.getTreeNode(nodeText).click({force: true}); // Force through tooltip
  cy.contains('#itemContent span', nodeText);
});

/**
 * Look for extension field and return all that match the url.
 *
 * @param extensionsArray: Array of extensions.
 * @param url: URL of the desired extensions.
 */
Cypress.Commands.add('getExtensions', (extensionsArray, url) => {
  return extensionsArray?.filter((ext) => ext.url === url);
});

/**
 * Get input field for terminology server url
 */
Cypress.Commands.add('tsUrl', () => {
  return cy.get('[id="__$terminologyServer"]');
});

/**
 * Get input field for editable link id
 */
Cypress.Commands.add('editableLinkId', () => {
  return cy.get('[id="linkId"]');
});

/**
 * Check whether a specific error message is currently displayed in the UI for the linkId field.
 * @param errorMessage - the error message to validate.
 */
Cypress.Commands.add('checkLinkIdErrorIsDisplayed', (errorMessage) => {
  // The link id text input should be outlined in red
  cy.editableLinkId()
    .should('have.class', 'invalid');
     // The error message should display at the bottom of the text input
  cy.get('lfb-editable-link-id')
    .find('small.text-danger')
    .should('be.visible')
    .should('contain.text', errorMessage);

  // Error should display at the top of the content and at the bottom.
  cy.get('mat-sidenav-content > div.mt-1 > ul > li').should('have.class', 'text-danger');
  cy.get('mat-sidenav-content > ul > li').should('have.class', 'text-danger');

});

/**
 * Check whether the error message for the linkId field is no longer displayed in the UI.
 */
Cypress.Commands.add('checkLinkIdErrorIsNotDisplayed', () => {
  // The link id text input should not have an outline in red
  cy.editableLinkId()
    .should('not.have.class', 'invalid');
  // The error message should not be displayed at the bottom of the text input
  cy.get('lfb-editable-link-id')
    .find('small.text-danger')
    .should('not.exist');

  // Error should not be displayed at the top of the content and at the bottom.
  cy.get('mat-sidenav-content > div.mt-1 > ul > li').should('not.have.class', 'text-danger');
  cy.get('mat-sidenav-content > ul > li').should('not.exist');
});

/**
 * Expand advanced panel
 */
Cypress.Commands.add('expandAdvancedFields',() => {
  cy.contains('button', 'Advanced fields').find('svg.fa-angle-down').click();
});

/**
 * Collapse advanced panel
 */
Cypress.Commands.add('collapseAdvancedFields',() => {
  cy.contains('button', 'Advanced fields').find('svg.fa-angle-up').click();
});

/**
 * Click a boolean value radio button identified by field label and value of the radio button.
 */
Cypress.Commands.add('booleanFieldClick', (fieldLabel, rbValue) => {
  return cy.getBooleanFieldParent(fieldLabel).find('label[for^="booleanRadio_'+rbValue+'"]').click();
});

/**
 * Get a radio button identified by the label of the group and the label of the radio button.
 *
 * Use a radio input element to make assertions on input status, such as selected or not. It is not
 * suitable for mouse actions as it is hidden from a mouse-pointer, instead use its label to perform
 * mouse actions.
*/

Cypress.Commands.add('getRadioButton', (groupLabel, rLabel) => {
  return cy.getRadioButtonLabel(groupLabel, rLabel).invoke('attr', 'for').then((id) => {
    return cy.get('#'+id);
  }).should('have.attr', 'type', 'radio');
  // Confirm the radio input and return its label for mouse actions.
});

/**
 * Get the label of radio input identified by the label of the field and the label of the radio button.
 */
Cypress.Commands.add('getRadioButtonLabel', (fieldLabel, radioLabel) => {
  // Ensure the label is visible before proceeding
  const radioGroup = cy.get('lfb-label label').contains(fieldLabel).should('be.visible').parent().next();
  return radioGroup.find('label').contains(radioLabel);
});

/**
 * Get radio input tag identified by field label and input value.
 */
Cypress.Commands.add('getBooleanInput', (fieldLabel, rbValue) => {
  return cy.getBooleanFieldParent(fieldLabel).find('input[id^="booleanRadio_'+rbValue+'"]');
});

/**
 * Get a parent element of a boolean field identified by its label.
 * Used to get elements of radio input and labels.
 */
Cypress.Commands.add('getBooleanFieldParent', (fieldLabel) => {
  return cy.get('lfb-boolean-radio lfb-label label').contains(fieldLabel).parent().next();
});

/**
 * Get parent for elements of boolean input/label in initial[x].valueBoolean field.
 * The initial value field has a different CSS path compared to the above general boolean field.
 */
Cypress.Commands.add('getInitialValueBooleanParent', () => {
  return cy.get('lfb-table lfb-label label').contains('Initial value').parent().parent().next()
    .find('table tr:nth-child(1)');
});

/**
 * Get an input element for 'Initial value' boolean field.
 */
Cypress.Commands.add('getInitialValueBooleanInput', (rbValue) => {
  return cy.getInitialValueBooleanParent().find('input[id^="booleanRadio_'+rbValue+'"]');
});

/**
 * Click a radio button of 'Initial value' boolean field.
 */
Cypress.Commands.add('getInitialValueBooleanClick', (rbValue) => {
  return cy.getInitialValueBooleanParent().find('label[for^="booleanRadio_'+rbValue+'"]').click();
});

/**
 * Get the input element using its label text.
 * Works provided the label[for] === input[id].
 * @param parentSelector - The parent selector to search within. Helps to constrain
 * the search to a specific part of the form.
 * @param label - The label text to find the input element.
 */
Cypress.Commands.add('getByLabel', (parentSelector: string, label: string) => {
  return cy.get(parentSelector)
    .find('label')
    .contains(label).invoke('attr', 'for').then((id) => {
      return cy.get('#' + id);
    });
});

/**
 * Get the title field from the form level page.
 */
Cypress.Commands.add('getFormTitleField', () => {
  return cy.getByLabel('lfb-form-fields', 'Title');
});

/**
 * Get the data type field from the item editor.
 */
Cypress.Commands.add('getItemTypeField', () => {
  return cy.getByLabel('lfb-ngx-schema-form', 'Data type');
});

/**
 * Get the question text field from the item editor.
 */
Cypress.Commands.add('getItemTextField', () => {
  return cy.getByLabel('lfb-ngx-schema-form', 'Question text');
});

/**
 * Click a radio button for the 'Type initial value' boolean field under the Value Method.
 */
Cypress.Commands.add('getTypeInitialValueValueMethodClick', () => {
  return cy.contains('div', 'Value method').find('[for^="__$valueMethod_type-initial"]').click();
});

/**
 * Click a radio button for the 'Pick initial value' boolean field under the Value Method.
 */
Cypress.Commands.add('getPickInitialValueValueMethodClick', () => {
  return cy.contains('div', 'Value method').find('[for^="__$valueMethod_pick-initial"]').click();
});
/**
 * Click a radio button for the 'Compute initial value' boolean field under the Value Method.
 */
Cypress.Commands.add('getComputeInitialValueValueMethodClick', () => {
  return cy.contains('div', 'Value method').find('[for^="__$valueMethod_compute-initial"]').click();
});

/**
 * Click a radio button for the 'Continuously compute value' boolean field under the Value Method.
 */
Cypress.Commands.add('getComputeContinuouslyValueValueMethodClick', () => {
  return cy.contains('div', 'Value method').find('[for^="__$valueMethod_compute-continuously"]').click();
});

/**
 * Click a radio button for the 'None' boolean field under the Value Method.
 */
Cypress.Commands.add('getNoneValueMethodClick', () => {
  return cy.contains('div', 'Value method').find('[for^="__$valueMethod_none"]').click();
});

/**
 * Handles the common workflow for interacting with an autocomplete input in Cypress tests.
 *
 * @param autocompleteElement - The input element for the autocomplete (as a jQuery element).
 * @param clearBeforeTyping - Whether to clear the input before typing.
 * @param searchKeyword - (Optional) The keyword to type into the autocomplete input.
 * @param expectedListSize - (Optional) The expected number of options in the search results. Pass undefined to skip this check.
 * @param specialCharacterSequencesText - Special key sequences to send (e.g., '{downarrow}{enter}').
 * @param assertionFn - A callback function containing assertions to run after selection.
 *
 * This helper function types a keyword into an autocomplete input, waits for the search results to appear,
 * optionally checks the number of results, selects an option using special key sequences,
 * and then runs the provided assertion logic.
 */
function handleAutocomplete(autocompleteElement: JQuery<HTMLInputElement>, clearBeforeTyping: boolean, searchKeyword: string, expectedListSize: number,
                            specialCharacterSequencesText: string, assertionFn: () => void) {
  if (clearBeforeTyping) {
    cy.wrap(autocompleteElement).clear();
  }

  // If a searchKeyword is provided, type it into the input; otherwise, just click the input element.
  if (searchKeyword) {
    cy.wrap(autocompleteElement).type(searchKeyword);
  } else {
    cy.wrap(autocompleteElement).click();
  }

  cy.document().then((doc) => {
    cy.wrap(doc).find('#lhc-tools-searchResults').then($container => {
      const $results = $container.find('tbody tr, ul li');

      if (typeof expectedListSize === 'number') {
        expect($results.length, 'Number of results returned by the search').to.equal(expectedListSize);
      }

      if ($results.length > 0) {
        if (specialCharacterSequencesText) {
          cy.wrap(autocompleteElement).type(specialCharacterSequencesText);
        }
      }
    });
  });

  // Run the assertion logic passed in
  assertionFn();
}

/**
 * Selects an option from a multi-select autocomplete input and verifies the selected results.
 *
 * @param autocompleteElement - The input element for the autocomplete (as a jQuery element).
 * @param clearBeforeTyping - Whether to clear the input before typing.
 * @param searchKeyword - (Optional) The keyword to type into the autocomplete input.
 * @param expectedListSize - (Optional) The expected number of options in the search results. Pass null to skip this check.
 * @param specialCharacterSequencesText - Special key sequences to send (e.g., '{downarrow}{enter}').
 * @param expectedResults - (Optional) The expected array of texts for the selected results to assert.
 *
 * This command types an optional keyword into a multi-select autocomplete input, waits for the search results to appear,
 * optionally checks the number of results, selects an option using special key sequences,
 * and verifies that the expected results appear in the selection display.
 */
Cypress.Commands.add('selectAutocompleteOptions',
  (autocompleteElement, clearBeforeTyping, searchKeyword, expectedListSize, specialCharacterSequencesText,
   expectedResults) => {

    handleAutocomplete(autocompleteElement, clearBeforeTyping, searchKeyword, expectedListSize,
      specialCharacterSequencesText, () => {
        if (Array.isArray(expectedResults) && expectedResults.length === 0) {
          // Expect no selection
          cy.wrap(autocompleteElement)
            .parentsUntil('div.query-select')
            .parent()
            .find('span.autocomp_selected > ul > li')
            .should('have.length', 0);
        } else if (Array.isArray(expectedResults)) {
          // Existing positive case
          cy.wrap(autocompleteElement)
            .parentsUntil('div.query-select')
            .parent()
            .find('span.autocomp_selected > ul > li')
            .should(($lis) => {
              expect($lis.length, 'Number of results returned by the search').to.equal(expectedResults.length);
              expectedResults.forEach((text, idx) => {
                expect($lis.eq(idx)).to.have.text(text);
              });
            });
        }
      }
    );
  }
);

/**
 * Selects an option from a single-select autocomplete input and verifies the selected result.
 *
 * @param autocompleteElement - The input element for the autocomplete (as a jQuery element).
 * @param clearBeforeTyping - Whether to clear the input before typing.
 * @param searchKeyword - (Optional) The keyword to type into the autocomplete input.
 * @param expectedListSize - (Optional) The expected number of options in the search results. Pass null to skip this check.
 * @param specialCharacterSequencesText - Special key sequences to send (e.g., '{downarrow}{enter}').
 * @param expectedResultText - (Optional) The expected text for the selected result to assert.
 *
 * This command types an optional keyword into an autocomplete input, waits for the search results to appear,
 * optionally checks the number of results, selects an option using special key sequences,
 * and verifies that the expected result appears in the selection display.
 */
Cypress.Commands.add('selectAutocompleteOption',
  (autocompleteElement, clearBeforeTyping, searchKeyword, expectedListSize, specialCharacterSequencesText,
   expectedResultText) => {

    handleAutocomplete(autocompleteElement, clearBeforeTyping, searchKeyword, expectedListSize,
      specialCharacterSequencesText, () => {
        const hasExpectedListSize = typeof expectedListSize === 'number';

        if (searchKeyword && hasExpectedListSize && expectedListSize === 0) {
          cy.wrap(autocompleteElement).should('have.class', 'no_match');
          expect(expectedResultText == null).to.be.true;
        } else {
          if (hasExpectedListSize && expectedListSize > 0) {
            cy.wrap(autocompleteElement).should('not.have.class', 'no_match');
          }

          // This handles the scenario where searchKeyword is not provided.
          // If searchKeyword is provided, then autocompleteElement is likely always equal to expectedResultText.
          // If the value is based on specialCharacterSequencesText, this will validate that the autocompleteElement value
          // is equal to expectedResultText.
          if (expectedResultText) {
            cy.wrap(autocompleteElement).should('have.value', expectedResultText);
          }
        }
      }
    );
  }
);

/**
 * Custom command to check the Question Item Control UI logic for a given data type and expected UI state.
 * @param {string} type - The data type to select (e.g., 'integer').
 * @param {string[]} questionItemControlOptions - Expected labels for item control question options (before answer list is created).
 * @param {string[]} itemControlOptions - Expected labels for item control options (after answer list is created).
 * @param {string[]} itemControlOptionsAfterRepeat - Expected labels for item control options after repeat is set.
 * @param {string[]} itemControlOptionsAfterAnswerValueSet - Expected something
 */
Cypress.Commands.add('checkQuestionItemControlUI',
  (type, questionItemControlOptions, itemControlOptions, itemControlOptionsAfterRepeat,
   itemControlOptionsAfterAnswerValueSet) => {
  const createAnswerListLabel = 'Create answer list';
  const questionItemControlLabel = 'Question item control';
  const answerListLayoutLabel = 'Answer list layout';
  const repeatLabel = 'Allow repeating question?';
  const questionItemControlVisible = questionItemControlOptions;
  const createAnswerListVisible = itemControlOptions;
  const repeatVisible = itemControlOptionsAfterRepeat;
  const answerValueSetOptionsVisible = itemControlOptionsAfterAnswerValueSet;

  // Select the data type
  cy.selectDataType(type);

  // Check 'Create answer list' label visibility
  if (createAnswerListVisible) {
    cy.get('lfb-label label').contains(createAnswerListLabel).should('exist');
  } else {
    cy.get('lfb-label label').contains(createAnswerListLabel).should('not.exist');
  }

  // Reset the 'Create Answer List' back to 'No'
  if (createAnswerListVisible) {
    cy.getRadioButtonLabel(createAnswerListLabel, 'No').click();
  }
  // Reset the 'Allow repeating question?' back to 'Unspecified'
  if (repeatVisible) {
    cy.getRadioButtonLabel(repeatLabel, 'Unspecified').click();
  }

  // Check 'Question item control' label visibility
  if (questionItemControlVisible) {
    cy.get('lfb-label label').contains(questionItemControlLabel).should('exist');
    cy.get('div#__\\$itemControlQuestion > div > input').as('itemControlQuestion');
    cy.get('@itemControlQuestion').should('have.length', questionItemControlOptions.length);
    questionItemControlOptions.forEach((label, idx) => {
      cy.get('@itemControlQuestion').eq(idx).next('label').should('contain.text', label);
    });
  } else {
    cy.get('lfb-label label').contains(questionItemControlLabel).should('not.exist');
  }

  // Click 'Yes' on the 'Create answer list' if requested
  if (createAnswerListVisible) {
    cy.getRadioButtonLabel(createAnswerListLabel, 'Yes').click();
    // 'Question item control' should now be hidden
    cy.get('lfb-label label').contains(questionItemControlLabel).should('not.exist');
    // 'Answer list layout' should be displayed
    cy.get('lfb-label label').contains(answerListLayoutLabel).should('exist');
    cy.get('div#__\\$itemControl > div > input').as('itemControl');
    cy.get('@itemControl').should('have.length', itemControlOptions.length);
    itemControlOptions.forEach((label, idx) => {
      cy.get('@itemControl').eq(idx).next('label').should('contain.text', label);
    });
    // Click 'Yes' on the 'Allow repeating question?' if requested
    if (repeatVisible && createAnswerListVisible) {
      cy.getRadioButtonLabel(repeatLabel, 'Yes').click();
      // Check item control options after repeat
      cy.get('@itemControl').should('have.length', itemControlOptionsAfterRepeat.length);
      itemControlOptionsAfterRepeat.forEach((label, idx) => {
        cy.get('@itemControl').eq(idx).next('label').should('contain.text', label);
      });
    }

    if (answerValueSetOptionsVisible) {
      // Click the 'Answer list source - SNOMED answer value set' radion option.
      cy.get('[for^="__\\$answerOptionMethods_snomed-value-set"]').click();
      // Check item control options after Answer Valuet Set
      cy.get('@itemControl').should('have.length', itemControlOptionsAfterAnswerValueSet.length);
      itemControlOptionsAfterAnswerValueSet.forEach((label, idx) => {
        cy.get('@itemControl').eq(idx).next('label').should('contain.text', label);
      });
    }
  }
});
// Helps remove TypeScript errors and auto completing the Cypress commands in TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      loadHomePage(): Chainable<void>;
      loadHomePageWithLoincOnly(): Chainable<void>;
      goToHomePage(): Chainable<void>;
      acceptAllTermsOfUse(): Chainable<void>;
      acceptLoincOnly(): Chainable<void>;
      clearSession(): Chainable<void>;
      uploadFile(fileName: string, handleWarning?: boolean): Chainable<void>;
      questionnaireJSON(): Chainable<any>;
      selectDataType(type: string): Chainable<void>;
      toggleTreeNodeExpansion(text: string): Chainable<JQuery<HTMLElement>>;
      loadLOINCForm(searchTerm: string): Chainable<void>;
      FHIRServerResponse(menuText: string, serverBaseUrl?: string): Chainable<any>;
      enterAnswerOptions(codings: any[]): Chainable<void>;
      addAnswerOptions(): Chainable<void>;
      includeExcludeCodeField(formOrItem: 'form' | 'item'): Chainable<void>;
      dragAndDropNode(dragNodeText: string, dropNodeText: string): Chainable<JQuery<HTMLElement>>;
      fhirSearch(titleSearchTerm: string): Chainable<JQuery<HTMLElement>>;
      handleWarning(): Chainable<JQuery<HTMLElement>>;
      isDefault(): Chainable<boolean>;
      resetForm(): Chainable<void>;
      waitForSpinner(): Chainable<JQuery<HTMLElement>>;
      clickTreeNode(nodeText: string): Chainable<JQuery<HTMLElement>>;
      getExtensions(extensionsArray: any[], url: string): any[];
      tsUrl(): Cypress.Chainable<JQuery<HTMLElement>>;
      editableLinkId(): Cypress.Chainable<JQuery<HTMLElement>>;
      checkLinkIdErrorIsDisplayed(errorMessage: string): Cypress.Chainable<JQuery<HTMLElement>>;
      checkLinkIdErrorIsNotDisplayed(): Cypress.Chainable<JQuery<HTMLElement>>;
      expandAdvancedFields(): Cypress.Chainable<JQuery<HTMLElement>>;
      collapseAdvancedFields(): Cypress.Chainable<JQuery<HTMLElement>>;
      booleanFieldClick(fieldLabel: string, rbValue: boolean): Cypress.Chainable<JQuery<HTMLElement>>;
      getBooleanFieldParent(fieldLabel: string): Chainable<JQuery<HTMLElement>>;
      getBooleanInput(fieldLabel: string, rbValue: boolean): Chainable<JQuery<HTMLElement>>;
      getByLabel(parentSelector: string, label: string): Cypress.Chainable<JQuery<HTMLElement>>;
      getCurrentForm(): Chainable<any>;
      getFormTitleField(): Cypress.Chainable<JQuery<HTMLElement>>;
      getInitialValueBooleanClick(rbValue: boolean): Chainable<JQuery<HTMLElement>>;
      getInitialValueBooleanInput(rbValue: boolean): Chainable<JQuery<HTMLElement>>;
      getInitialValueBooleanParent(): Chainable<JQuery<HTMLElement>>;
      getItemTextField(): Cypress.Chainable<JQuery<HTMLElement>>;
      getItemTypeField(): Cypress.Chainable<JQuery<HTMLElement>>;
      getLocalStorageItem(itemName: string): Chainable<string | null>;
      getRadioButton(groupLabel: string, rLabel: string): Chainable<JQuery<HTMLElement>>;
      getRadioButtonLabel(groupLabel: string, rLabel: string): Cypress.Chainable<JQuery<HTMLElement>>;
      getSessionStorageItem(item: string): Chainable<string | null>;
      getTreeNode(text: string): Chainable<JQuery<HTMLElement>>;
      getTypeInitialValueValueMethodClick(): Chainable<JQuery<HTMLElement>>;
      getPickInitialValueValueMethodClick(): Chainable<JQuery<HTMLElement>>;
      getComputeInitialValueValueMethodClick(): Chainable<JQuery<HTMLElement>>;
      getComputeContinuouslyValueValueMethodClick(): Chainable<JQuery<HTMLElement>>;
      getNoneValueMethodClick(): Chainable<JQuery<HTMLElement>>;
      selectAutocompleteOption(
        autoCompleteInput: JQuery<HTMLInputElement>, clearBeforeTyping: boolean,
        searchKeyword: string, expectedListSize: number, specialCharacterSequencesText: string,
        expectedResult: string): Chainable<void>;
      selectAutocompleteOptions(
        autoCompleteInput: JQuery<HTMLInputElement>, clearBeforeTyping: boolean,
        searchKeyword: string, expectedListSize: number, specialCharacterSequencesText: string,
        expectedResults: string[]): Chainable<void>;

      checkQuestionItemControlUI(
        type: string, questionItemControlOptions: string[], itemControlOptions: string[],
        itemControlOptionsAfterRepeat: string[], itemControlOptionsAfterAnswerValueSet: string[]): Chainable<void>;
    }
  }
}
