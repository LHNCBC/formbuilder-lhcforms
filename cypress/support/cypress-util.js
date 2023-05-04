import {Util} from '../../src/app/lib/util';
import {ExtensionDefs} from "../../src/app/lib/extension-defs";
import jsonPointer from "jsonpointer";

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
      return cy.wrap(formService.convertR4(Util.convertToQuestionnaireJSON(form), format));
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
      expect(jsonPointer.get(q, ptrInQuestionnaire)).to.deep.equal(expectedValue);
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
      const extensions = jsonPointer.get(q, extensionPtrInQuestionnaire).filter((e) => e.url === matchingExtUrl);
      expect(extensions).to.deep.equal(expectedValue);
    });
  };


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
