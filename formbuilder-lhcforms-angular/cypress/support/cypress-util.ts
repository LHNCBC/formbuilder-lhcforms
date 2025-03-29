import {Util} from '../../src/app/lib/util';
import {JsonPointer} from "json-ptr";
import {format, parseISO} from 'date-fns';

export class CypressUtil {

  static lformsLibs = new Map();
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
  static getQuestionnaireJSON(format = 'R5') {
    // @ts-ignore
    let formService;
    return CypressUtil.getBasePageComponent().its('formService').then((service) => {
      formService = service;
      return CypressUtil.getBasePageComponent().its('formValue');
    }).then((form) => {
      return cy.wrap(formService.convertFromR5(Util.convertToQuestionnaireJSON(form), format));
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
   * Get array of extensions which match a given extension uri.
   *
   * @param item - Object with extensions.
   * @param matchingExtUrl - URI of the extensions.
   */
  static getExtensions(item, matchingExtUrl) {
    let extensions = item?.extension || null;
    return extensions?.filter((e) => e.url === matchingExtUrl);
  };

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

  /**
   * Convert zulu time to local time zone
   * @param zuluTimeStr - Zulu time string
   * @returns {string} - Translate to local time zone.
   */
  static getLocalTime(zuluTimeStr) {
    return format(parseISO(zuluTimeStr), 'yyyy-MM-dd hh:mm:ss.SSS a');
  }

  static mockSnomedEditions() {
    const fixture = 'snomedEditions.json';
    cy.intercept('https://snowstorm.ihtsdotools.org/fhir/CodeSystem', (req) => {
      console.log(`cy.intecept(): url = ${req.url}; query = ${JSON.stringify(req.query)}`);
      req.reply({fixture});
    });
  }

  /**
   * Cache calls to https://lhcforms-static to load LForms libraries.
   */
  static mockLFormsLoader() {
    const lformsLibUrl = 'https://lhcforms-static.nlm.nih.gov/lforms-versions/';
    cy.intercept(lformsLibUrl, async (req) => {
      if(CypressUtil.lformsLibs.has(req.url)) {
        console.log(`LForms versions from cached response for ${req.url}`);
        req.reply(CypressUtil.lformsLibs.get(req.url));
      }
      else {
        req.continue((res) => {
            CypressUtil.lformsLibs.set(req.url, res.body);
            console.log(`LForms versions after call through to ${req.url}`);
            res.send({body: res.body});

        });
      }
    }).as('lformsVersions');

    cy.intercept(lformsLibUrl+'**/@(webcomponent|fhir)/*.@(js|css)', async (req) => {
      if(CypressUtil.lformsLibs.has(req.url)) {
        console.log(`LForms libraries from cache for ${req.url}`);
        req.reply(CypressUtil.lformsLibs.get(req.url));
      }
      else {
        req.continue((res) => {
            CypressUtil.lformsLibs.set(req.url, res.body);
            console.log(`LForms libraries after call through to ${req.url}`);
        });
      }
    }).as('lformsLib');
  }

  /**
   * Modify a given json, overriding certain fields and return original and modified copies.
   * Intended to make some minor changes to the fixtures during the tests.
   *
   * @param fixtureFile - Fixture file
   * @param stubOverrideObj - Object having overriding fields for stubbed responses.
   * @returns {Cypress.Chainable<{responseStub: *, fixtureJson: *}>} Chainable with
   */
  static setupStub (fixtureFile, stubOverrideObj) {
    return cy.readFile('cypress/fixtures/' + fixtureFile).then((json) => {
      const fJson = json;
      const rStub = JSON.parse(JSON.stringify(json));

      Object.keys(stubOverrideObj).forEach((f) => {
        rStub[f] = stubOverrideObj[f];
      });

      return {fixtureJson: fJson, responseStub: rStub};
    });
  };

  /**
   * Recursively removes a specified field from an object or an array of objects.
   *
   * @param obj - The input object or array of objects from which the specified field should
   *              be removed.
   * @param field - A string representing the name of the field to be omitted from the object(s).
   * @returns - A new object or array of objects with the specified field removed.
   */
  static omitField(obj, field) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.omitField(item, field));
    } else if (obj && typeof obj === 'object') {

      const { [field]: _, ...newObj } = obj;
      for (const key in newObj) {
        newObj[key] = this.omitField(newObj[key], field);
      }
      return newObj;
    }
    return obj;
  }

  /**
   * Capture clipboard content.
   *
   * @param callback - Callback function providing the content as string to the caller.
   */
  static getClipboardContent(callback) {
    return cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => callback(text));
    });
  }
}
