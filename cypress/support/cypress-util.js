import {Util} from '../../src/app/lib/util';
import {ExtensionDefs} from "../../src/app/lib/extension-defs";
import {JsonPointer} from "json-ptr";

export class CypressUtil {
  /**
   * Access base page component
   * @returns {Cypress.Chainable<Subject>}
   */
  static getBasePageComponent() {
    return cy.window()
      .should('have.own.property', 'basePageComponent');
  }

  /**
   * Get output json of questionnaire from application model.
   * @returns {Cypress.Chainable<JQuery<E>>}
   */
  static getQuestionnaireJSON(format = 'R4') {
    // @ts-ignore
    let formService;
    return CypressUtil.getBasePageComponent().its('formService').then((service) => {
      formService = service;
      return CypressUtil.getBasePageComponent().its('formValue');
    }).then((form) => {
      return cy.wrap(formService.convertFromR4(Util.convertToQuestionnaireJSON(form), format));
    });
  }

  /**
   * Access appRef.
   * @returns {Cypress.Chainable<Subject>}
   */
  static getAppRef() {
    return cy.window().should('have.own.property', 'appRef');
  }

  /**
   * Calls `appRef.tick()` to force UI refresh
   */
  static tick() {
    // @ts-ignore
    CypressUtil.getAppRef().invoke('tick');
  }

  /**
   * Assert expected value is equal to the value obtained in questionnaire json pointed by ptrInQuestionnaire.
   * @param ptrInQuestionnaire - JSON Pointer (as defined in RFC 6901) into questionnaire json.
   * @param expectedValue - Expected value to assert.
   */
  static assertValueInQuestionnaire(ptrInQuestionnaire, expectedValue) {
    cy.questionnaireJSON().should((q) => {
      expect(JsonPointer.get(q, ptrInQuestionnaire)).to.deep.equal(expectedValue);
    });
  }

  /**
   * Assert extensions (array of extensions) which match a given extension uri.
   *
   * @param extensionPtrInQuestionnaire - json pointer pointing to an extension field in questionnaire json.
   * @param matchingExtUrl - URI of the extension to assert. This should represent the extension(s) field in the questionnaire.
   * @param expectedValue - Matching value to assert equal to the selected extension array.
   */
  static assertExtensionsInQuestionnaire(extensionPtrInQuestionnaire, matchingExtUrl, expectedValue) {
    cy.questionnaireJSON().should((q) => {
      const extensions = JsonPointer.get(q, extensionPtrInQuestionnaire).filter((e) => e.url === matchingExtUrl);
      expect(extensions).to.deep.equal(expectedValue);
    });
  };

  /**
   * Assert code field creation in form level fields and item level fields.
   * @param jsonPointerToCodeField - JSON pointer to code field in questionnaire.
   * Example:
   *   For form level: '/code'
   *   For first root item: /item/0/code
   */
  static assertCodeField(jsonPointerToCodeField) {
    cy.contains('[for^="booleanRadio_true"]', 'Include code').click({force: true});
    cy.contains('table > thead', 'Code').parent().parent().as('codeField');
    cy.get('@codeField').find('tbody').as('codeTable');
    cy.get('@codeTable').find('tr:nth-child(1)').as('firstRow');
    cy.get('@firstRow').find('[id^="code.0.code_"]').type('c1').as('code1');
    cy.get('@firstRow').find('[id^="code.0.system_"]').type('s1').as('system1');
    cy.get('@firstRow').find('[id^="code.0.display_"]').type('d1').as('display1');

    cy.get('@codeField').find('button').contains('Add new code').as('addCode').click();
    cy.get('@codeTable').find('tr:nth-child(2)').as('secondRow');
    cy.get('@secondRow').find('[id^="code.1.code_"]').type('c2').as('code2');
    cy.get('@secondRow').find('[id^="code.1.system_"]').type('s2').as('system2');
    cy.get('@secondRow').find('[id^="code.1.display_"]').type('d2').as('display2');

    cy.get('@addCode').click();
    cy.get('@codeTable').find('tr:nth-child(3)').as('thirdRow');
    cy.get('@thirdRow').find('[id^="code.2.code_"]').type('c3').as('code3');
    cy.get('@thirdRow').find('[id^="code.2.system_"]').type('s3').as('system3');
    cy.get('@thirdRow').find('[id^="code.2.display_"]').type('d3').as('display3');

    CypressUtil.assertValueInQuestionnaire(jsonPointerToCodeField, [
      {code: 'c1', system: 's1', display: 'd1'},
      {code: 'c2', system: 's2', display: 'd2'},
      {code: 'c3', system: 's3', display: 'd3'}
    ]);
  }

  /**
   * Delete cypress downloads folder.
   *
   * @param ignoreIfNotExist - A flag to ignore file not found error. Default is true.
   *   All other errors are thrown.
   */
  static deleteDownloadsFolder(ignoreIfNotExist = true) {
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('deleteFolder', {folder: downloadsFolder, ignoreIfNotExist});
  }

  /**
   * Delete a file in cypress downloads folder.
   *
   * @param filename - File name relative to cypress downloads folder.
   * @param ignoreIfNotExist -  A flag to ignore file not found error. Default is true.
   *   All other errors are thrown.
   */
  static deleteDownloadFile(filename, ignoreIfNotExist = true) {
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.task('deleteFile', {filename, folder: downloadsFolder, ignoreIfNotExist});
  }
}
