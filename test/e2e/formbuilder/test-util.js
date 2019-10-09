'use strict';

const fb = require('./formbuilder.po').formbuilder;
const fs = require('fs');


module.exports = {
  loadHomePage: function() {
    setAngularSite(true);
    browser.get('/');
    fb.termsOfUseAcceptButton.click();
    /*
    browser.driver.switchTo().alert().then(function (alert) { // Accept reload if alerted.
      alert.accept();
      fb.termsOfUseAcceptButton.click();
    }, function (err) {
      console.log();
    });
*/
  },


  /**
   * Watch a file for its content change.
   *
   * @param filename - File to watch.
   * @returns {Q.Promise<any>}
   */
  watchFilePromise: function (filename) {
    return new Promise(function (resolve) {
      fs.watchFile(filename, {interval: 10}, function (curr) {
        if (curr.size > 0) {
          fs.unwatchFile(filename);
          resolve();
        }
      });
    });
  },


  /**
   * Select node from sidebar tree using node title.
   *
   * @param nodeTitle
   */
  assertNodeSelection: function (nodeTitle) {
    let node = fb.questionTree.element(by.cssContainingText('div.angular-ui-tree-handle .flex-item-stretch span', nodeTitle));
    node.click();
    expect(fb.questionText.getAttribute('value')).toMatch(nodeTitle);
  },


  /**
   * Get json output for a given format.
   *
   * @param format - Valid strings are 'lforms', 'STU3', and 'R4'
   * @returns {Promise} - A promise which resolves to json string.
   */
  getJSONSource: function (format) {
    let formatButtonMap = {
      lforms: fb.previewFHIRQuestionnaireLFormsRadio,
      STU3: fb.previewFHIRQuestionnaireSTU3Radio,
      R4: fb.previewFHIRQuestionnaireR4Radio
    };

    fb.scrollIntoViewAndClick(fb.previewJsonRefreshButton);
    formatButtonMap[format].click();
    expect(fb.previewJsonSource.isDisplayed()).toBeTruthy();
    return fb.previewJsonSource.getText();
  },


  /**
   * Dismiss md-dialog by clicking cancel or continue button.
   * @param toContinue {boolean} - True for continue, false for cancel.
   */
  dismissWarning: function (toContinue) {
    console.log('dismissWarning() entered');
    fb.continueButton.isPresent().then(function (present) {
      console.log('toContinue: '+ toContinue + ' :: '+'present: '+present);
      if (present) {
        if (toContinue) {
          fb.dialog.element(by.buttonText('Continue')).click();
        } else {
          fb.dialog.element(by.buttonText('Cancel')).click();
        }
      }
    });
  },

  dismissAlert: function() {
    browser.driver.switchTo().alert().then(function (alert) { // Accept reload if alerted.
      alert.accept();
      fb.termsOfUseAcceptButton.click();
    }, function (err) {
      console.log();
    });

  },

  /**
   * Equivalent of invoking file dialog and entering filename.
   *
   * @param fileName - file name to import from.
   */
  importFromFile: function (fileName) {
    // Make the file input element visible, otherwise browser doesn't accept the sendKeys().
    browser.executeScript('arguments[0].classList.toggle("hide")', fb.fileInput.getWebElement());
    fb.fileInput.sendKeys(fileName);
    browser.executeScript('arguments[0].classList.toggle("hide")', fb.fileInput.getWebElement());
  },


  /**
   * Load lforms json from the file system.
   *
   * @param fileName {string} - The lforms json file on the disk
   * @return Promise - If resolved, it gives lforms preview source string
   */
  loadLFormFromDisk: function (fileName, format) {
    this.importFromFile(fileName);
    this.dismissWarning(true);
    return this.getJSONSource(format);
  },


  /**
   * Assert FHIR Questionnaire equality, ignoring certain fields.
   *
   * @param actual - Actual FHIR Questionnaire instance
   * @param expected -  Expected FHIR Questionnaire instance
   */
  assertFHIRQuestionnaire: function (actual, expected) {
    // Date is not supported in lforms, and it is created every time there is a conversion. Remove them for now.
    const ignoreFields = ['date'];
    [actual, expected].forEach(function (q) {
      ignoreFields.forEach(function (field) {
        if (q[field]) {
          delete q[field];
        }
      });
    });

    expect(actual).toEqual(expected);
  },


  /**
   * Assert expected count of items from autocomplete list
   * @param count
   */
  assertAnswerListCount: function (count) {
    expect(fb.answerListResults.isDisplayed()).toBeTruthy();
    fb.answerListResults.then(function (list) {
      expect(list.length).toBe(count);
    });
  },


  /**
   * Select a resource from FHIR results dialog and load it into form builder.
   *
   * @param partialResourceTitle - A string to identify an item from the list of results.
   */
  assertImportFromFhir: function (partialResourceTitle) {
    fb.cleanupSideBar();
    fb.formNode.click();
    fb.formTitle.clear();
    fb.importMenu.click();
    fb.showFhirResources.click();
    fb.continueButton.click();
    expect(fb.dialog.isDisplayed()).toBeTruthy();
    fb.fhirResultItem(partialResourceTitle).click();
    if(partialResourceTitle.startsWith('Update')) {
      browser.sleep(20000);
    }
    this.dismissWarning(true); // Accept replacement, should load the form.
    expect(fb.firstNode.isDisplayed()).toBeTruthy();
    fb.formTitle.getAttribute('value').then(function (text) {
      expect(text).toBe(partialResourceTitle);
    });
  },


  /**
   * Get the delete button of the resource item specified by its title.
   *
   * @param resourceTitle - Resource title
   * @param partialFhirServerName - Partial string of the server's name.
   * @returns {*} Protractor's ElementFinder
   */
  getFhirResourceDeleteElement: function (resourceTitle, partialFhirServerName) {
    fb.importMenu.click();
    fb.showFhirResources.click();
    fb.continueButton.click();
    expect(fb.dialog.isDisplayed()).toBeTruthy();
    fb.fhirServerPulldownSelect(partialFhirServerName).click();
    let resultItem = fb.fhirResultItem(resourceTitle);
    return resultItem.element(by.css('button.md-secondary[aria-label="Delete this resource"]'));
  },


  /**
   * Create fhir resource with a given resource title on a given FHIR server
   * specified by partial name of the server.
   *
   * @param resourceTitle - Resource title aka form name.
   * @param partialFhirServerName - Partial name of the server to pick the server
   * from the server list. If more than one match, first match is picked.
   */
  assertCreateFhirResource: function (resourceTitle, partialFhirServerName) {
    fb.formNode.click();
    fb.formTitle.clear();
    fb.formTitle.sendKeys(resourceTitle);

    fb.exportMenu.click();
    fb.createFhir.click();
    let fhirServerElement = fb.getFhirServerElement(partialFhirServerName);
    /*
    let fhirServerElement = fb.fhirServerList.filter(function (elem) {
      return elem.getText().then(function (text) {
        return text.includes(partialFhirServerName);
      });
    }).first();
    */
    expect(fhirServerElement.isDisplayed()).toBeTruthy();
    fhirServerElement.click();
    fb.continueButton.click();
    expect(fb.fhirResponse.isDisplayed()).toBeTruthy();
    fb.fhirResponse.getText().then(function (text) {
      let createdResource = JSON.parse(text);
      expect(createdResource.resourceType).toBe('Questionnaire');
      expect(createdResource.id).toMatch(/^\d+$/);
    });
    fb.closeDialog();
  }
};

