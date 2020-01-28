'use strict';

const fb = require('./formbuilder.po').formbuilder;
const fs = require('fs');


module.exports = {

  /**
   * Loads the page if not already loaded.
   *
   * Call this in top level beforeAll() of each *.spec.js. It helps loading the page only once when running suites
   * either from a single spec file or from multiple spec files.
   *
   * @returns - A promise that resolves to true if loaded in this call or resolves to false if it already loaded.
   */
  loadHomePageIfNotLoaded: function() {
    let deferred = protractor.promise.defer();
    // Load the page only if not already loaded.
    let _self = this;
    browser.getCurrentUrl().then(function () {
      // Already loaded, refresh it.
      _self.pageRefresh().then(function () {
        deferred.fulfill(false);
      }, function (err) {
        deferred.reject(err);
      });
    }, function () {
      // Page is not loaded yet.
      setAngularSite(true);
      browser.get('/').then(function () {
        fb.termsOfUseAcceptButton.click();
        deferred.fulfill(true);
      }, function (err) {
        deferred.reject(new Error('Failed to get /: '+err.message));
      });
    });

    return deferred.promise;
  },


  /**
   *  Do browser refresh, accept alert window if presented, and accept terms of use
   *
   * @returns {Promise} - Fulfills after accepting terms of use.
   */
  pageRefresh: function() {
    let deferred = protractor.promise.defer();
    setAngularSite(false);
    browser.refresh();
    browser.driver.switchTo().alert().then(function (alert) { // Accept reload if alerted.
      console.log('Accepting alert popup... ');
      alert.accept();
      setAngularSite(true);
      browser.waitForAngular().then(function () {
        fb.termsOfUseAcceptButton.click().then(function () {
          deferred.fulfill();
        }, function (err) {
          console.log('Error refreshing the page (clicking terms of use button): '+err.message);
          deferred.reject(err);
        });
      }, function (err) {
        console.log('Error refreshing the page (waiting for angular): '+err.message);
        deferred.reject(err);
      });
    }, function (err) {
      console.log('No alert found: '+err.message);
      deferred.fulfill(); // No alert, move on
    });

    return deferred.promise;
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
    fb.continueButton.isPresent().then(function (present) {
      if (present) {
        if (toContinue) {
          fb.dialog.element(by.buttonText('Continue')).click();
        } else {
          fb.dialog.element(by.buttonText('Cancel')).click();
        }
      }
    });
  },


  /**
   * Dismiss browser alert popup
   * @param toContinue - Boolean flag, true to accept false to dismiss.
   */
  dismissAlert: function(toContinue) {
    browser.driver.switchTo().alert().then(function (alert) { // Accept reload if alerted.
      if(toContinue) {
        alert.accept();
      }
      else {
        alert.dismiss();
      }
    }, function (err) {
      //console.log(err.toString());
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
   * @param format {string} - One of the strings: R4 | STU3 | lforms
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

