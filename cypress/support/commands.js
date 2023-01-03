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
import * as fhirServerMocks from "./mocks/fhir-server-mocks";
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
  cy.goToHomePage();
  cy.loincAccepted().then((flag) => {
    if (flag !== 'true') {
      cy.acceptLoinc();
    }
  });
});


/**
 * Visit home page and assert LForms, but do not deal with LOINC notice.
 */
Cypress.Commands.add('goToHomePage', () => {
  cy.visit('/');
  cy.window().should('have.property', 'LForms');
});


/**
 * Accept LOINC notice dialog.
 */
Cypress.Commands.add('acceptLoinc', () => {
  cy.contains('lfb-loinc-notice button', 'Accept').click();
});


/**
 * Clear session storage. Used to test LOINC notice.
 */
Cypress.Commands.add('clearSession',() => {
  cy.window()
    .its('sessionStorage')
    .invoke('clear');
});


/**
 * Check if loinc notice is accepted. Used to avoid invoking
 * element locator when restarting stopped tests in cy-open.
 */
Cypress.Commands.add('loincAccepted',() => {
  return cy.window()
    .its('sessionStorage')
    .invoke('getItem', 'acceptTermsOfUse');
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
  cy.contains('nav.navbar button', 'Preview').scrollIntoView().click();
  cy.contains('.mat-mdc-tab', 'View Questionnaire JSON').scrollIntoView().click();
  return cy.get('mat-tab-body div.mat-mdc-tab-body-content pre').invoke('text').then((text) => {
    cy.get('mat-dialog-actions > button').scrollIntoView().click();
    return cy.wrap(JSON.parse(text));
  });
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
Cypress.Commands.add('FHIRServerResponse', (menuText) => {
  cy.contains('button.dropdown-toggle.btn', 'Export').click();
  cy.contains('div.dropdown-menu.show button.dropdown-item', menuText).as('menu');
  cy.get('@menu').should('be.visible');
  cy.contains('button.dropdown-item', menuText).as('createMenu');
  cy.get('@createMenu').should('be.visible').click();
  if(menuText.startsWith('Create')) {
    cy.contains('lfb-fhir-servers-dlg div button', 'Continue').click();
  }
  return cy.get('lfb-fhir-export-dlg div pre.fhir-response').invoke('text').then((text) => {
    cy.contains('lfb-fhir-export-dlg div button', 'Close').click();
    return cy.wrap(JSON.parse(text));
  });
});

Cypress.Commands.add('enterAnswerOptions', (codings) => {
  cy.selectDataType('choice');
  cy.get('[id^="answerOption"]').should('be.visible');
  codings.forEach((coding, index) => {
    cy.get('[id^="answerOption.'+index+'."]').should('be.visible');
    cy.get('[id^="answerOption.'+index+'.valueCoding.display"]').type(coding.display);
    cy.get('[id^="answerOption.'+index+'.valueCoding.code"]').type(coding.code);
    cy.get('[id^="answerOption.'+index+'.valueCoding.system"]').type(coding.system);
    cy.get('[id^="answerOption.'+index+'.valueCoding.__$score"]').type(coding.__$score);
    cy.contains('button', 'Add another answer').click();
  });
});


/**
 * Create a sample answer option list.
 */
Cypress.Commands.add('addAnswerOptions', () => {
  cy.selectDataType('choice');
  // No widget for choice. User selects default radio in answer option table.
  cy.get('[id^="initial"]').should('not.be.visible');
  cy.get('[id^="answerOption.0.valueCoding.display"]').type('d1');
  cy.get('[id^="answerOption.0.valueCoding.code"]').type('c1');
  cy.get('[id^="answerOption.0.valueCoding.system"]').type('s1');
  cy.get('[id^="answerOption.0.valueCoding.__$score"]').type('2.1');

  cy.questionnaireJSON().should((qJson) => {
    expect(qJson.item[0].type).equal('choice');
    expect(qJson.item[0].answerOption[0].valueCoding).to.deep.equal({display: 'd1', code: 'c1', system: 's1'});
    expect(qJson.item[0].answerOption[0].extension).to.deep.equal([{
      url: 'http://hl7.org/fhir/StructureDefinition/ordinalValue',
      valueDecimal: 2.1
    }]);
    expect(qJson.item[0].initial).to.be.undefined; // No default selected
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
    expect(qJson.item[0].type).equal('choice');
    expect(qJson.item[0].answerOption[1].valueCoding).to.deep.equal({display: 'd2', code: 'c2', system: 's2'});
    expect(qJson.item[0].answerOption[1].extension).to.deep.equal([{
      url: 'http://hl7.org/fhir/StructureDefinition/ordinalValue',
      valueDecimal: 3
    }]);
    // Default/initial value coding.
    expect(qJson.item[0].initial[0].valueCoding).to.deep.equal({display: 'd1', code: 'c1', system: 's1'});
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
  fhirServerMocks.searchFHIRServer(titleSearchTerm,
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
 * CLick a node on the side bar.
 */
Cypress.Commands.add('clickTreeNode', (nodeText) => {
  cy.getTreeNode(nodeText).click();
  cy.contains('#itemContent span', nodeText);
});
