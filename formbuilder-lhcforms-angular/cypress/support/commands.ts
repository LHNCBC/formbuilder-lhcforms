// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
import {isEqual} from 'lodash';
import {searchFHIRServer} from "./mocks/fhir-server-mocks";
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
 * Load home page and wait until LForms is loaded.
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
 * Visit home page and assert LForms, but do not deal with LOINC notice.
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
 * Get an item from local storage.
 */
Cypress.Commands.add('getLocalStorageItem',(item) => {
  return cy.window()
    .its('localStorage').invoke('getItem', item);
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
  cy.fixture(fileName, { encoding: null }).as('myFixture');
  cy.get('input[type="file"]').selectFile('@myFixture', {force: true});
  if(handleWarning) {
    cy.handleWarning();
  }
});

/**
 * Command to get json from 'Preview'
 */
Cypress.Commands.add('questionnaireJSON', () => {
  return CypressUtil.getQuestionnaireJSON();
});

/**
 * Command to select data type in item editor.
 */
Cypress.Commands.add('selectDataType', (type) => {
  cy.get('#type').select(type);
});

/**
 * Select a node by its text in the sidebar. The text is read from tooltip.
 */
Cypress.Commands.add('getTreeNode', (text) => {
  return cy.get('div[role="tooltip"]:contains("'+text+'")').invoke('attr', 'id').then((tooltipId) => {
    return cy.get('div[aria-describedby="' + tooltipId + '"]').should('be.visible');
  });
});

/**
 * Toggle expansion and collapse of tree node having children.
 */
Cypress.Commands.add('toggleTreeNodeExpansion', (text) => {
  const tooltipId = cy.get('div[role="tooltip"]:contains("'+text+'")').invoke('attr', 'id').then((tooltipId) => {
    cy.get('tree-root tree-viewport tree-node-collection tree-node tree-node-wrapper div.node-wrapper div tree-node-content div')
      .filter('div[aria-describedby="'+tooltipId+'"]').parents('div.node-wrapper').find('tree-node-expander').as('expander');
    cy.get('@expander').should('be.visible');
    cy.get('@expander').click();
    cy.getTreeNode(text).should('be.visible');
  }, (err)=> {console.error(err)});
});


/**
 * Load LOINC form using a search term. Picks first item from the result list.
 * @param searchTerm - Search term to search LOINC database.
 */
Cypress.Commands.add('loadLOINCForm', (searchTerm) => {
  cy.contains('nav.navbar button', 'Import').scrollIntoView().click();
  cy.get('div.dropdown-menu.show form input[placeholder="Search LOINC"]').as('searchBox');
  cy.get('@searchBox').type(searchTerm);
  cy.get('ngb-typeahead-window').should('be.visible');
  cy.get('@searchBox').type('{enter}');
  cy.get('ngb-typeahead-window').should('not.exist');
  cy.get('@searchBox').type('{esc}');
});

/**
 * Get json from FHIR server response after create/update interaction.
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
      cy.get('[id^="answerOption.'+index+'.valueCoding.'+key+'"]').type(coding[key]);
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
  cy.get('[id^="answerOption.0.valueCoding.display"]').type('d1');
  cy.get('[id^="answerOption.0.valueCoding.code"]').type('c1');
  cy.get('[id^="answerOption.0.valueCoding.system"]').type('s1');
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

  cy.get('[id^="answerOption.1.valueCoding.display"]').type('d2');
  cy.get('[id^="answerOption.1.valueCoding.code"]').type('c2');
  cy.get('[id^="answerOption.1.valueCoding.system"]').type('s2');
  cy.get('[id^="answerOption.1.valueCoding.__$score"]').type('3');
  // Select a default a.k.a initial
  cy.get('lfb-answer-option table tbody tr').eq(0).find('input[type="radio"]').click();

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
  const formTesting = formOrItem === 'form' ? true : false;
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
  cy.get('@code').next('small')
    .should('be.visible')
    .contains('Spaces are not allowed at the beginning or end.');
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
  let droppable, coords;
  cy.get(dropSelector).should(($eList) => {
    droppable = $eList[0];
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
 * and pick first result to load into the form builder.
 * Make sure to create mock response based on titleSearchTerm.
 */
Cypress.Commands.add('fhirSearch', (titleSearchTerm) => {
  searchFHIRServer(titleSearchTerm,
    `fhir-server-mock-response-${titleSearchTerm}.json`);
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
 * Expect warning dialog and click continue.
 */
Cypress.Commands.add('handleWarning', () => {
  cy.contains('.modal-title', 'Replace existing form?').should('be.visible');
  cy.contains('div.modal-footer button', 'Continue').click();
});

/**
 * Read form from local storage and compare it with default form.
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
  }, (err) => {
    return err;
  });
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
 * Reset form builder.
 * Using Close menu option to reset.
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
  // The link id text input should be outline in red
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
  // The link id text input should not have outline in red
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
 * Use radio input element to make assertions on input status, such as selected or not. It is not
 * suitable for mouse actions as it is hidden from mouse-pointer. Instead use its label to perform
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
  const radioGroup = cy.get('lfb-label label').contains(fieldLabel).parent().next();
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
 * The initial value field has different css path compared to above general boolean field.
 */
Cypress.Commands.add('getInitialValueBooleanParent', () => {
  return cy.get('lfb-table lfb-label label').contains('Initial value').parent().parent().next()
    .find('table tr:nth-child(1)');
});

/**
 * Get input element for 'Initial value' boolean field.
 */
Cypress.Commands.add('getInitialValueBooleanInput', (rbValue) => {
  return cy.getInitialValueBooleanParent().find('input[id^="booleanRadio_'+rbValue+'"]');
});

/**
 * Click radio button of 'Initial value' boolean field.
 */
Cypress.Commands.add('getInitialValueBooleanClick', (rbValue) => {
  return getInitialValueBooleanParent().find('label[for^="booleanRadio_'+rbValue+'"]').click();
});
