'use strict';

var fb = require('./formbuilder.po').formbuilder;
const fs = require('fs');


/**
 * Watch a file for its content change.
 *
 * @param filename - File to watch.
 * @returns {Q.Promise<any>}
 */
function watchFilePromise(filename) {
  return new Promise(function(resolve, reject){
    fs.watchFile(filename, {interval: 10}, function(curr, prev) {
      if(curr.size > 0) {
        fs.unwatchFile(filename);
        resolve();
      }
    });
  });
}

/**
 * Select node from sidebar tree using node title.
 *
 * @param nodeTitle
 */
function assertNodeSelection(nodeTitle) {
  var node = fb.questionTree.element(by.cssContainingText('div.angular-ui-tree-handle .flex-item-stretch span', nodeTitle));
  node.click();
  expect(fb.questionText.getAttribute('value')).toMatch(nodeTitle);
}


/**
 * Get json output for a given format.
 *
 * @param format - Valid strings are 'lforms', 'STU3', and 'R4'
 * @returns {Promise} - A promise which resolves to json string.
 */
function getJSONSource(format) {
  let formatButtonMap = {
    lforms: fb.previewFHIRQuestionnaireLFormsRadio,
    STU3: fb.previewFHIRQuestionnaireSTU3Radio,
    R4: fb.previewFHIRQuestionnaireR4Radio
  };

  fb.scrollIntoViewAndClick(fb.previewJsonRefreshButton);
  formatButtonMap[format].click();
  expect(fb.previewJsonSource.isDisplayed()).toBeTruthy();
  return fb.previewJsonSource.getText();
}

/**
 * Load lforms json from the file system.
 *
 * @param fileName {string} - The lforms json file on the disk
 * @return Promise - If resolved, it gives lforms preview source string
 */
function loadLFormFromDisk(fileName, format) {
  // Make the file input element visible, otherwise browser doesn't accept the sendKeys().
  browser.executeScript('arguments[0].classList.toggle("hide")', fb.fileInput.getWebElement());
  fb.fileInput.sendKeys(fileName);
  browser.executeScript('arguments[0].classList.toggle("hide")', fb.fileInput.getWebElement());

  return getJSONSource(format);
}


/**
 * Assert FHIR Questionnaire equality, ignoring certain fields.
 *
 * @param actual - Actual FHIR Questionnaire instance
 * @param expected -  Expected FHIR Questionnaire instance
 */
function assertFHIRQuestionnaire(actual, expected) {
  // Date is not supported in lforms, and it is created every time there is a conversion. Remove them for now.
  const ignoreFields = ['date'];
  [actual, expected].forEach(function(q) {
    ignoreFields.forEach(function (field) {
      if(q[field]) {
        delete q[field];
      }
    })
  });

  expect(actual).toEqual(expected);
}
/**
 * Assert expected count of items from autocomplete list
 * @param count
 */
function assertAnswerListCount(count) {
  expect(fb.answerListResults.isDisplayed()).toBeTruthy();
  fb.answerListResults.then(function(list) {
    expect(list.length).toBe(count);
  });
}


/**
 * Select a resource from FHIR results dialog and load it into form builder.
 *
 * @param resourceTitle - A string to identify an item from the list of results.
 */
function assertImportFromFhir(partialResourceTitle) {
  fb.cleanupSideBar();
  fb.formTitle.clear();
  fb.importMenu.click();
  fb.showFhirResources.click();
  expect(fb.dialog.isDisplayed()).toBeTruthy();
  fb.fhirResultItem(partialResourceTitle).click();
  expect(fb.firstNode.isDisplayed()).toBeTruthy();
  fb.formTitle.getAttribute('value').then(function (text) {
    expect(text).toBe(partialResourceTitle);
  });
}


/**
 * Create fhir resource with a given resource title on a given FHIR server
 * specified by partial name of the server.
 *
 * @param resourceTitle - Resource title aka form name.
 * @param partialFhirServerName - Partial name of the server to pick the server
 * from the server list. If more than one match, first match is picked.
 */
function assertCreateFhirResource(resourceTitle, partialFhirServerName) {
  fb.formTitle.clear();
  fb.formTitle.sendKeys(resourceTitle);

  fb.exportMenu.click();
  fb.createFhir.click();
  let fhirServerElement = fb.fhirServerList.filter(function(elem, index) {
    return elem.getText().then(function (text) {
      return text.includes(partialFhirServerName);
    });
  }).first();
  expect(fhirServerElement.isDisplayed()).toBeTruthy();
  fhirServerElement.click();
  fb.continueButton.click();
  expect(fb.fhirResponse.isDisplayed()).toBeTruthy();
  fb.fhirResponse.getText().then(function(text){
    let createdResource = JSON.parse(text);
    expect(createdResource.resourceType).toBe('Questionnaire');
    expect(createdResource.id).toMatch(/^\d+$/);
  });
  fb.closeDialog();
}


/**
 * Get the delete button of the resource item specified by its title.
 *
 * @param resourceTitle - Resource title
 * @param partialFhirServerName - Partial string of the server's name.
 * @returns {*} Protractor's ElementFinder
 */
function getFhirResourceDeleteElement(resourceTitle, partialFhirServerName) {
  fb.importMenu.click();
  fb.showFhirResources.click();
  expect(fb.dialog.isDisplayed()).toBeTruthy();
  fb.fhirServerPulldownSelect(partialFhirServerName).click();
  let resultItem = fb.fhirResultItem(resourceTitle);
  return resultItem.element(by.css('button.md-secondary[aria-label="Delete this resource"]'));
}

describe('GET /', function () {


  beforeAll(function () {
    setAngularSite(true);
    browser.get('/');
    fb.termsOfUseAcceptButton.click();
  });

  afterAll(function() {
    // For some reason there are a lot of warning messages in the console, so
    // it is better not print them out except when debugging.
    //fb.printBrowserConsole();
  });

  describe('Add New or import from LOINC', function () {
    describe('LOINC import panel/question', function () {
      beforeEach(function () {
        fb.cleanupSideBar();
        fb.addButton.click();
        fb.importLOINCRadio.click();
      });

      afterEach(function () {
        // Click the cancel button if the dialog is still open
        fb.importDialogCancel.isPresent().then(function (present) {
          if (present)
            fb.importDialogCancel.click();
        });
      });

      /**
       *  Simulates a click on the Import button in the LOINC import panel
       */
      function clickImportButton() {
        // In real-life a blur will happen before a click event, which doesn't
        // happen until mouse-up.  Sending just a click event doesn't seem to trigger
        // the blur, so here we click out side the box and then click the button

        //browser.actions().mouseMove(fb.importButton).perform();
        fb.addItemDlgTitle.click(); // Create blurr event
        fb.importButton.click();
      }

      it('should not import when the field is empty', function () {
        expect(fb.importButton.isEnabled()).toBeTruthy();
        clickImportButton();
        browser.sleep(100);
        expect(fb.importButton.isPresent()).toBeTruthy();
      });

      it('should not import if an invalid value is entered', function () {
        fb.sendKeys(fb.searchBox, 'zzz');
        clickImportButton();
        browser.sleep(100);
        expect(fb.importButton.isPresent()).toBeTruthy();
      });

      it('should import if a valid value is entered after an invalid one', function () {
        // For some reason entering two characters doesn't seem to bring the
        // correct auto complete list using protractor/chrome driver.
        //fb.autoCompSelectByText(fb.searchBox, 'ar', 'Gas panel');
        fb.autoCompSelectByText(fb.searchBox, 'Gas', 'Gas panel');
        clickImportButton();
        expect(fb.importButton.isPresent()).toBeFalsy();
        expect(fb.panelTitle.getAttribute('innerText')).toContain('Gas');
      });

      it('should not import if an invalid value is entered after a valid one', function () {
        fb.autoCompSelectByText(fb.searchBox, 'arb', 'Arbovirus');
        fb.searchBox.click(); // restore focus that was lost for some unknown reason
        fb.searchBox.sendKeys('z');
        clickImportButton();
        browser.sleep(100); // allow the dialog to close, if the test fails
        expect(fb.importButton.isPresent()).toBeTruthy();
      });

      it('should import the correct panel if a second panel is selected after the first', function () {
        fb.autoCompSelectByText(fb.searchBox, 'hep', 'Acute ');
        fb.searchBox.clear();
        fb.searchBox.click(); // restore focus to field
        fb.sendKeys(fb.searchBox, 'Vital');
        fb.searchBox.sendKeys(protractor.Key.DOWN);
        clickImportButton();
        expect(fb.panelTitle.getAttribute('innerText')).toContain('Vital');
      });

      it('should import question with answers', function () {
        fb.typeQuestionRadio.click();
        fb.searchBox.clear();
        fb.searchBox.click(); // restore focus to field
        fb.sendKeys(fb.searchBox, '21858-6');
        fb.searchBox.sendKeys(protractor.Key.DOWN);
        clickImportButton();
        getJSONSource('lforms').then(function (text) {
          var lforms = JSON.parse(text);
          expect(lforms.items[0].answers.length).toBe(10);
        });
      });

      it('should import question with units', function () {
        fb.typeQuestionRadio.click();
        fb.searchBox.clear();
        fb.searchBox.click(); // restore focus to field
        fb.sendKeys(fb.searchBox, '3141-9');
        fb.searchBox.sendKeys(protractor.Key.DOWN);
        clickImportButton();
        getJSONSource('lforms').then(function (text) {
          var lforms = JSON.parse(text);
          expect(lforms.items[0].units.length).toBe(2);
          expect(lforms.items[0].units[0].name).toBe('[lb_av]');
          expect(lforms.items[0].units[1].name).toBe('kg');
        });
      });
    });

    it('Should create a new item', function () {
      fb.cleanupSideBar();
      var str = 'Test item created';
      fb.addButton.click();
      fb.addNewItem(str);
      expect(fb.basicPanelEl.isDisplayed()).toBeTruthy();
      // Verify widget title
      expect(fb.panelTitle.getText()).toBe('1 '+str);
    });
  });

  describe('Test with imported vital signs panel from lforms-service', function() {

    beforeAll(function() {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
    });

    beforeEach(function() {
      fb.scrollToTop(fb.previewPanel);
      fb.scrollToTop(fb.itemBuilderPanel);
    });

    it('Should display the panel nodes in side bar tree', function () {
      expect(fb.firstNode.isDisplayed()).toBeTruthy();
      expect(fb.basicPanelEl.isDisplayed()).toBeTruthy();
      expect(fb.panelTitle.getText()).toBe('1 Vital signs, weight & height panel [34565-2]');
      expect(fb.nodeList.count()).toEqual(26);
    });

    it('should reflect changes to question text in formbuilder title and preview widget', function() {
      assertNodeSelection('Vital Signs Pnl');
      expect(fb.basicPanelEl.isDisplayed()).toBeTruthy();
      // Verify widget title
      expect(fb.panelTitle.getText()).toBe('1.1 Vital Signs Pnl [34566-0]');

      // Edit question text
      fb.sendKeys(fb.questionText, protractor.Key.BACK_SPACE, 4);
      fb.sendKeys(fb.questionText, ' Panel');

      // Verify changes in the title
      expect(fb.panelTitle.getText()).toBe('1.1 Vital Signs Panel [34566-0]');

      // Verify changes in the preview widget
      fb.previewRefreshButton.click();
      expect(fb.previewVitalSignsPanelModified.getText()).toBe('Vital Signs Panel');
    });

    it('Should reflect changes in preview widget', function () {
      assertNodeSelection('BP device Cuff size');
      expect(fb.basicPanelEl.isDisplayed()).toBeTruthy();
      expect(fb.panelTitle.getText()).toBe('1.1.3.5 BP device Cuff size [8358-4]');
      fb.previewRefreshButton.click();
      fb.previewWidgetBPDeviceCuffAnswerListEl.click();
      assertAnswerListCount(3);

      fb.scrollIntoViewAndClick(fb.answersDelButton3);
      fb.scrollIntoViewAndClick(fb.previewRefreshButton);
      fb.previewWidgetBPDeviceCuffAnswerListEl.click();
      assertAnswerListCount(2);
    });

    it('Should display/hide answer list items controlled by skip logic', function () {
      assertNodeSelection('Heart rate');
      fb.questionType.clear();
      expect(fb.questionType.isDisplayed()).toBeTruthy();

      fb.autoCompSelect(fb.questionType, 8);
      expect(fb.questionAnswerText.isDisplayed()).toBeTruthy();
      // Restore its type.
      fb.questionType.clear();
      fb.autoCompSelect(fb.questionType, 5);
    });

    it('should search and select units', function () {
      assertNodeSelection('BP sys');
      var bpSysUnitsPath = '$.items[0].items[0].items[2].items[0].units';

      fb.scrollIntoViewAndClick(fb.previewJsonRefreshButton);
      fb.previewFHIRQuestionnaireLFormsRadio.click();
      expect(fb.getJsonFromText(fb.previewJsonSource, bpSysUnitsPath)).toEqual([[{name: 'mm[Hg]'}]]);
      fb.tableAutoCompSelectByText(fb.units, 'wc ', 'inch of water column');
      fb.unitDeleteButton.click();
      fb.scrollIntoViewAndClick(fb.previewJsonRefreshButton);
      fb.previewFHIRQuestionnaireLFormsRadio.click();
      expect(fb.getJsonFromText(fb.previewJsonSource, bpSysUnitsPath)).toEqual([[{name: '[in_i\'H2O]'}]]);
    });

  });

  describe('Build restrictions', function () {

    beforeAll(function () {
      // Re-open page to start fresh after preceeding tests
      browser.get('/');
      fb.termsOfUseAcceptButton.click();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
      assertNodeSelection('Resp rate');
      fb.advancedEditTab.click();
      fb.useRestrictionsYes.click();
    });

    afterEach(function () {
      fb.scrollToTop(fb.previewPanel);
      fb.scrollToTop(fb.itemBuilderPanel);
    });

    it('Should display restriction items', function () {
      expect(fb.restrictionName1.isDisplayed()).toBeTruthy();
      expect(fb.restrictionValue1.isDisplayed()).toBeTruthy();

      fb.autoCompSelect(fb.restrictionName1, 1);
      fb.sendKeys(fb.restrictionValue1, '50');
      expect(fb.restrictionValue1.getAttribute('value')).toBe('50');

      fb.scrollIntoViewAndClick(fb.addRestrictionButton);

      expect(fb.restrictionName2.isDisplayed()).toBeTruthy();
      expect(fb.restrictionValue2.isDisplayed()).toBeTruthy();
      fb.autoCompSelect(fb.restrictionName2, 3);
      fb.sendKeys(fb.restrictionValue2, '100');
      expect(fb.restrictionValue2.getAttribute('value')).toBe('100');
    });

    it('Should check json output for restrictions', function () {
      getJSONSource('lforms').then(function (text) {
        var previewLFData = JSON.parse(text);
        var selectedItem = previewLFData.items[0].items[0].items[1];
        expect(selectedItem.question).toBe('Resp rate');
        expect(selectedItem.restrictions.length).toBe(2);
        expect(selectedItem.restrictions[0].name).toBe('minExclusive');
        expect(selectedItem.restrictions[0].value).toBe('50');
        expect(selectedItem.restrictions[1].name).toBe('maxExclusive');
        expect(selectedItem.restrictions[1].value).toBe('100');
      });
    });
  });

  describe('Build skip logic', function () {

    beforeAll(function () {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
      assertNodeSelection('BP device Invento');
      fb.advancedEditTab.click();
      fb.useSkipLogicYes.click();
      // Pick source with CNE type. 12th is 'BP device Cuff size'
      fb.autoCompSelect(fb.skipLogicConditionsSource, 12);
      fb.scrollIntoViewAndClick(fb.previewRefreshButton);
    });

    afterEach(function () {
      fb.scrollToTop(fb.itemBuilderPanel);
      fb.scrollToTop(fb.previewPanel);
    });

    it('Should test building condition with CNE/CWE source type', function () {
      fb.scrollIntoViewAndClick(fb.skipLogicConditionsTrigger);
      expect(fb.autoCompListItems.isDisplayed()).toBeTruthy();
      expect(fb.autoCompListItems.get(0).getText()).toMatch('Adult standard');
      expect(fb.autoCompListItems.get(1).getText()).toMatch('Adult large');
    });

    it('Should display skip logic in preview panel for CNE/CWE source type', function () {
      // Make sure the target item is displayed by default
      fb.scrollIntoView(fb.previewWidgetBPDeviceInvent);
      expect(fb.previewWidgetBPDeviceInvent.isDisplayed()).toBeTruthy();
      // Select first answer
      fb.autoCompSelect(fb.skipLogicConditionsTrigger, 1);
      fb.scrollIntoViewAndClick(fb.previewRefreshButton);
      // See the effect of skip logic on the target.
      // Testing the absence of an element. Make sure you can see its neighbor
      // and then confirm the absence of fb.previewWidgetBPDeviceInvent.
      fb.scrollIntoView(fb.previewWidgetBPDeviceModel);
      expect(fb.previewWidgetBPDeviceModel.isDisplayed()).toBeTruthy();
      expect(fb.previewWidgetBPDeviceInvent.isPresent()).toBeFalsy();
      // Examine json output.
      getJSONSource('lforms').then(function (text) {
        var previewLFData = JSON.parse(text);
        var selectedItem = previewLFData.items[0].items[0].items[2].items[6];
        expect(selectedItem.question).toBe('BP device Inventory #');
        expect(selectedItem.skipLogic).toBeDefined();
        expect(selectedItem.skipLogic.action).toBe('show');
        expect(selectedItem.skipLogic.logic).toBe('ANY');
        expect(selectedItem.skipLogic.conditions.length).toBe(1);
        expect(selectedItem.skipLogic.conditions[0].source).toBe('8358-4');
        expect(selectedItem.skipLogic.conditions[0].trigger.code).toBe('LA11162-7');
      });
    });

    it('Should build condition with number source type', function () {
      // Pick source with number type. 2nd is 'Resp rate'
      fb.autoCompSelect(fb.skipLogicConditionsSource, 2);
      fb.skipLogicConditionsTriggerRangeRangeBoundary1minExclusive.click();
      fb.sendKeys(fb.skipLogicConditionsTriggerRangeRangeValue1, '50');

      // Add another numerical range
      fb.scrollIntoViewAndClick(fb.addSkipLogicSkipLogicNumericalRange);

      fb.skipLogicConditionsTriggerRangeRangeBoundary2maxExclusive.click();
      fb.sendKeys(fb.skipLogicConditionsTriggerRangeRangeValue2, '100');
    });

    it('should display skip logic effect with number source type', function () {
      fb.previewRefreshButton.click();
      expect(fb.previewWidgetBPDeviceInvent.isPresent()).toBeFalsy();
      fb.sendKeys(fb.previewRespRate, '51');
      expect(fb.previewWidgetBPDeviceInvent.isDisplayed()).toBeTruthy();
      fb.previewRespRate.clear();
      fb.sendKeys(fb.previewRespRate, '50');
      expect(fb.previewWidgetBPDeviceInvent.isPresent()).toBeFalsy();
      fb.previewRespRate.clear();
      fb.sendKeys(fb.previewRespRate, '99');
      expect(fb.previewWidgetBPDeviceInvent.isDisplayed()).toBeTruthy();
      fb.previewRespRate.clear();
      fb.sendKeys(fb.previewRespRate, '100');
      expect(fb.previewWidgetBPDeviceInvent.isPresent()).toBeFalsy();
    });
  });

  describe('Data control', function () {

    beforeAll(function () {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
      fb.scrollIntoViewAndClick(fb.previewRefreshButton);
      assertNodeSelection('Heart rate');
      fb.advancedEditTab.click();
      fb.useDataControlYes.click();
      // Pick source with CNE type. 1st is 'Resp rate'
      fb.autoCompSelect(fb.dataControlSource1, 1);
    });

    afterEach(function () {
      fb.scrollToTop(fb.itemBuilderPanel);
      fb.scrollToTop(fb.previewPanel);
    });

    it('Should test building data control with simple construction', function () {
      fb.scrollIntoViewAndClick(fb.previewRefreshButton);
      fb.previewHeartRate.clear();
      fb.sendKeys(fb.previewRespRate, '80');
      expect(fb.previewHeartRate.getAttribute('value')).toBe('80');
    });

  });

  describe('Display control', function () {

    beforeAll(function () {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('gas ', 1);
    });

    afterEach(function () {
      fb.scrollToTop(fb.itemBuilderPanel);
      fb.scrollToTop(fb.previewPanel);
    });

    it('should test question layout', function () {
      // First one is a header node, work with questionLayout
      fb.advancedEditTab.click();
      fb.displayControlYes.click();
      // Default is vertical
      expect(fb.displayControlQuestionLayoutVertical.isSelected()).toBe(true);
      // Answer layout should be absent
      expect(fb.displayControlAnswerLayoutTypeCombo.isPresent()).toBe(false);
      expect(fb.displayControlAnswerLayoutColumns.isPresent()).toBe(false);
      expect(fb.displayControlAddColHeaders1.isPresent()).toBe(false);

      fb.displayControlQuestionLayoutHorizontal.click();
      getJSONSource('lforms').then(function (text) {
        var lforms = JSON.parse(text);
        expect(lforms.items[0].displayControl.questionLayout).toBe('horizontal');
      });
    });

    it('should test with answer layout type radio checkboxes', function () {
      // Pick non header node to work with answerLayout
      assertNodeSelection('Inhaled O2 flow');
      fb.advancedEditTab.click();
      fb.displayControlYes.click();
      // Question layout should be absent
      expect(fb.displayControlQuestionLayoutVertical.isPresent()).toBeFalsy();
      expect(fb.displayControlAnswerLayoutTypeCombo.isSelected()).toBe(true); // Default
      expect(fb.displayControlAnswerLayoutColumns.isPresent()).toBeFalsy();
      fb.displayControlAnswerLayoutTypeRadio.click();
      expect(fb.displayControlAnswerLayoutColumns.isDisplayed()).toBeTruthy();
      fb.displayControlAnswerLayoutColumns.sendKeys('2');

      getJSONSource('lforms').then(function (text) {
        var lforms = JSON.parse(text);
        var inhaledO2ItemDisplayControl = lforms.items[0].items[15].displayControl;
        expect(inhaledO2ItemDisplayControl.answerLayout.type).toBe('RADIO_CHECKBOX');
        expect(inhaledO2ItemDisplayControl.answerLayout.columns).toBe(2);
      });
    });

    it('Should test column list headers', function () {
      assertNodeSelection('Inhaled O2 flow');
      fb.advancedEditTab.click();
      fb.displayControlYes.click();
      // Should see answer layout, but not column header list
      expect(fb.displayControlAnswerLayoutTypeCombo.isDisplayed()).toBeTruthy();
      expect(fb.displayControlAddColHeaders1.isPresent()).toBeFalsy();
      // Make it externally defined.
      fb.basicEditTab.click();
      fb.externallyDefined.sendKeys('https://clinicaltables.nlm.nih.gov');
      fb.advancedEditTab.click();
      // Should not see answer layout, but should see column list headers
      expect(fb.displayControlAnswerLayoutTypeCombo.isPresent()).toBeFalsy();
      expect(fb.displayControlAddColHeaders1.isDisplayed()).toBeTruthy();

      //listColHeaders
      fb.displayControlAddColHeaders1.sendKeys('test1');
      fb.displayControlAddColHeadersButton.click();
      fb.displayControlAddColHeaders2.sendKeys('test2');

      getJSONSource('lforms').then(function (text) {
        var lforms = JSON.parse(text);
        var inhaledO2ItemDisplayControl = lforms.items[0].items[15].displayControl;
        expect(inhaledO2ItemDisplayControl.listColHeaders.length).toBe(2);
        expect(inhaledO2ItemDisplayControl.listColHeaders[0]).toBe('test1');
        expect(inhaledO2ItemDisplayControl.listColHeaders[1]).toBe('test2');
      });
    });
  });

  describe('Export import', function () {
    // The download path is set to /tmp in firefoxProfile. See
    // protractor.conf.js for profile preferences.
    // 'NewForm' is default form name, while .lforms.json and .fhir.json are appended in export functionality.
    var filename = '/tmp/NewLForm.lforms.json';
    var fhirFilenameSTU3 = '/tmp/NewLForm.STU3.json';
    var fhirFilenameR4 = '/tmp/NewLForm.R4.json';
    var lformsOriginalJson = null;
    var fhirOriginalJsonSTU3 = null;
    var fhirOriginalJsonR4 = null;

    beforeAll(function (done) {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('heart rate', 1);
      if (fs.existsSync(filename)) {
        // Make sure the browser doesn't have to rename the download.
        fs.unlinkSync(filename);
      }
      if (fs.existsSync(fhirFilenameR4)) {
        // Make sure the browser doesn't have to rename the download.
        fs.unlinkSync(fhirFilenameR4);
      }
      if (fs.existsSync(fhirFilenameSTU3)) {
        // Make sure the browser doesn't have to rename the download.
        fs.unlinkSync(fhirFilenameSTU3);
      }
      getJSONSource('lforms').then(function (text) {
        lformsOriginalJson = JSON.parse(text);
      });

      getJSONSource('R4').then(function (text) {
        fhirOriginalJsonR4 = JSON.parse(text);
      });

      getJSONSource('STU3').then(function (text) {
        fhirOriginalJsonSTU3 = JSON.parse(text);
      });

      fb.exportMenu.click();
      fb.exportToFile.click();
      fb.exportFileLFormsFormat.click();
      fb.continueButton.click();

      fb.exportMenu.click();
      fb.exportToFile.click();
      fb.exportFileFHIRFormatR4.click();
      fb.continueButton.click();

      fb.exportMenu.click();
      fb.exportToFile.click();
      fb.exportFileFHIRFormatSTU3.click();
      fb.continueButton.click();

      Promise.all([watchFilePromise(filename), watchFilePromise(fhirFilenameR4), watchFilePromise(fhirFilenameSTU3)]).then(function() {
        done();
      }).catch(function(err) {
        done(err);
      });
    });

    it('Should save lforms format to a file', function () {

      var newJson = JSON.parse(fs.readFileSync(filename, {encoding: 'utf8'}));
      expect(newJson).toEqual(lformsOriginalJson);
      // Edit the file outside the formbuilder.
      // Add an undefined attribute to an item in the file.
      // This tests the functionality of manually adding an attribute to the saved file.
      // This change is expected to show up in preview json src window
      // without affecting the functionality of formbuilder or lforms preview widget.
      var unrecognized = {a: 1, b: [2, 3, 4], c: {str: "some text"}};
      newJson.items[0]['unrecognized'] = unrecognized;
      fs.writeFileSync(filename, JSON.stringify(newJson, null, 2));
      // Add the attribute to lformsOriginalJson so that
      // json preview source after loading from the file matches with it.
      lformsOriginalJson.items[0]['unrecognized'] = unrecognized;
    });

    it('Should save FHIR Questionnaire formats to a file', function () {
      var newJson = JSON.parse(fs.readFileSync(fhirFilenameR4, {encoding: 'utf8'}));
      assertFHIRQuestionnaire(newJson, fhirOriginalJsonR4);
      newJson = JSON.parse(fs.readFileSync(fhirFilenameSTU3, {encoding: 'utf8'}));
      assertFHIRQuestionnaire(newJson, fhirOriginalJsonSTU3);
    });

    it('Should load an LForms form from disk', function (done) {
      loadLFormFromDisk(filename, 'lforms').then(function (text) {
        var newJson = JSON.parse(text);
        // Keep the commented out code for future debugging
        // fs.writeFileSync('uploaded.json', JSON.stringify(newJson, null, 2));
        // fs.writeFileSync('lformsOriginalJson.json', JSON.stringify(lformsOriginalJson, null, 2));
        expect(lformsOriginalJson).toEqual(newJson);
        done();
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });

    it('Should load an LForms form into an empty form builder', function (done) {
      fb.cleanupSideBar(); // Clear any existing form items
      loadLFormFromDisk(filename, 'lforms').then(function (previewSrc) {
        var newJson = JSON.parse(previewSrc);
        expect(newJson).toEqual(lformsOriginalJson);
        done();
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });

    it('Should load a FHIR Questionnaire R4 form from disk', function (done) {
      fb.cleanupSideBar(); // Clear any existing form items
      loadLFormFromDisk(fhirFilenameR4, 'R4').then(function (previewSrc) {
        var newJson = JSON.parse(previewSrc);
        assertFHIRQuestionnaire(newJson, fhirOriginalJsonR4);
        done();
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });
    it('Should load a FHIR Questionnaire STU3 form from disk', function (done) {
      fb.cleanupSideBar(); // Clear any existing form items
      loadLFormFromDisk(fhirFilenameSTU3, 'STU3').then(function (previewSrc) {
        var newJson = JSON.parse(previewSrc);
        assertFHIRQuestionnaire(newJson, fhirOriginalJsonSTU3);
        done();
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });
  });

  describe('Popup menu of an item', function () {
    var parent = 'BP Pnl';
    var selected = 'BP method';

    beforeAll(function () {
      fb.basicEditTab.click();
    });

    beforeEach(function () {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
    });

    it('Should remove this node', function () {
      // Count number children before removal.
      expect(fb.childNodes(parent).count()).toEqual(9);
      // Clicking more options button selects that node and pops up the menu
      fb.clickMoreOptions(selected);
      expect(fb.panelTitle.getText()).toBe('1.1.3.4 '+selected+' [8357-6]');
      fb.clickOpenedMenuItem('Remove this item');
      expect(fb.childNodes(parent).count()).toEqual(8);
      // The next item is selected and its id changes to current one.
      expect(fb.panelTitle.getText()).toBe('1.1.3.4 BP device Cuff size [8358-4]');
    });

    it('Should insert a new item before this', function () {
      var parent = 'Bdy temp Pnl';
      var selected = 'Bdy Temp Device C';

      expect(fb.childNodes(parent).count()).toEqual(6);
      fb.clickMenuItem(selected, 'Insert an item before');
      expect(fb.dialog.isDisplayed).toBeTruthy();
      fb.newItemRadio.click();
      fb.typeQuestionRadio.click();
      fb.newItemInputBox.sendKeys('test item');
      fb.newItemAddButton.click();
      expect(fb.childNodes(parent).count()).toEqual(7);
      expect(fb.getNode('test item').getText()).toMatch(/^1\.1\.4\.2 test item/);
    });

    it('Should insert a new item after this', function () {
      var parent = 'Bdy temp Pnl';
      var selected = 'Bdy Temp Device C';

      expect(fb.childNodes(parent).count()).toEqual(6);
      fb.clickMenuItem(selected, 'Insert an item after');
      expect(fb.dialog.isDisplayed).toBeTruthy();
      fb.addNewItem('test item');
      expect(fb.childNodes(parent).count()).toEqual(7);
      expect(fb.getNode('test item').getText()).toMatch(/^1\.1\.4\.3 test item/);
    });

    it('Should insert a new child item of this node', function () {
      expect(fb.childNodes(parent).count()).toEqual(9);
      fb.clickMenuItem(parent, 'Insert a child item');
      expect(fb.dialog.isDisplayed).toBeTruthy();
      fb.newItemRadio.click();
      fb.typeQuestionRadio.click();
      fb.newItemInputBox.sendKeys('test item');
      fb.newItemAddButton.click();
      expect(fb.childNodes(parent).count()).toEqual(10);
      expect(fb.getNode('test item').getText()).toMatch(/^1\.1\.3\.10 test item/);
    });

    it('Should move this before a selected node', function () {
      expect(fb.childNodes(parent).count()).toEqual(9);
      fb.clickMenuItem(selected, 'Move this before');
      expect(fb.dialog.isDisplayed).toBeTruthy();
      fb.autoCompSelect(fb.moveTargetItemsSearchBox, 4);
      expect(fb.moveTargetItemsSearchBox.getAttribute('value')).toMatch(/^1\.1\.2: /);
      fb.moveButton.click();
      expect(fb.childNodes(parent).count()).toEqual(8);
      var newLocationTextRE = new RegExp('^1\.1\.2 '+selected);
      expect(fb.getNode(selected).getText()).toMatch(newLocationTextRE);
    });

    it('Should move this after a selected node', function () {
      expect(fb.childNodes(parent).count()).toEqual(9);
      fb.clickMenuItem(selected, 'Move this item after');
      expect(fb.dialog.isDisplayed).toBeTruthy();
      fb.autoCompSelect(fb.moveTargetItemsSearchBox, 4);
      //fb.autoCompSelectByText(fb.moveTargetItemsSearchBox, '', '1.1.2: ');
      expect(fb.moveTargetItemsSearchBox.getAttribute('value')).toMatch(/^1\.1\.2: /);
      fb.moveButton.click();
      expect(fb.childNodes(parent).count()).toEqual(8);
      var newLocationTextRE = new RegExp('^1\.1\.3 '+selected);
      expect(fb.getNode(selected).getText()).toMatch(newLocationTextRE);
    });

    it('Should move this as a child of a selected node', function () {
      expect(fb.childNodes(parent).count()).toEqual(9);
      fb.clickMenuItem(selected, 'Make this a child of');
      expect(fb.dialog.isDisplayed).toBeTruthy();
      fb.autoCompSelect(fb.moveTargetItemsSearchBox, 2);
      //fb.autoCompSelectByText(fb.moveTargetItemsSearchBox, '', '1.1.2: ');
      expect(fb.moveTargetItemsSearchBox.getAttribute('value')).toMatch(/^1\.1: /);
      fb.moveButton.click();
      expect(fb.childNodes(parent).count()).toEqual(8);
      var newLocationTextRE = new RegExp('^1\.1\.10 '+selected);
      expect(fb.getNode(selected).getText()).toMatch(newLocationTextRE);
    });
  });

  describe('FHIR questionnaire', function () {
    beforeAll(function () {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
    });

    it('should output FHIR questionnaire json', function () {
      getJSONSource('R4').then(function(text) {
        var fhirObj = JSON.parse(text);
        // One root level node: 1
        expect(fhirObj.item.length).toBe(1);
        // One child of root level node: 1.1
        expect(fhirObj.item[0].item.length).toBe(1);
        // 9 children of 1.1
        expect(fhirObj.item[0].item[0].item.length).toBe(9);
        // 9 children of 1.1.3
        expect(fhirObj.item[0].item[0].item[2].item.length).toBe(9);
        // 6 children of 1.1.4
        expect(fhirObj.item[0].item[0].item[3].item.length).toBe(6);
      });
    });
  });

  describe('FHIR resource operations on the server', function () {
    // Note - The tests in this block are in an order. Any changes to
    // a test suite could impact the following assertions.

    const newTitle = 'Newly created form';
    const updatedTitle = 'Updated form';
    const uhnServerName = 'UHN HAPI Server - R4';

    beforeAll(function () {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
    });

    it('should create', function () {
      fb.exportMenu.click();
      expect(fb.updateFhir.isEnabled()).toBeFalsy();
      fb.dismissMenu();
      assertCreateFhirResource(newTitle, uhnServerName);
      fb.exportMenu.click();
      expect(fb.updateFhir.isEnabled()).toBeTruthy();
      fb.dismissMenu();

    });

    it('should read', function () {
      assertImportFromFhir(newTitle);
    });

    // Assume there is a loaded panel
    it('should update', function () {
      fb.formTitle.clear();
      fb.formTitle.sendKeys(updatedTitle);
      fb.exportMenu.click();
      fb.updateFhir.click();
      expect(fb.fhirResponse.isDisplayed()).toBeTruthy();
      fb.fhirResponse.getText().then(function(text){
        expect(text).toBe('\"Successfully updated the resource.\"');
      });

      fb.closeDialog();

      assertImportFromFhir(updatedTitle);
    });

    // Assume there is a resource on the server
    it('should delete', function () {

      fb.exportMenu.click();
      expect(fb.updateFhir.isEnabled()).toBeTruthy();
      fb.dismissMenu();

      getFhirResourceDeleteElement(updatedTitle, uhnServerName).click();

      expect(fb.fhirResponse.isDisplayed()).toBeTruthy();
      fb.fhirResponse.getText().then(function(text){
        var resp = JSON.parse(text);
        expect(resp.issue[0].diagnostics).toContain('Successfully deleted 1 resource(s) in');
      });
      fb.closeDialog(); // fhir response
      fb.closeDialog(); // fhir results

      fb.exportMenu.click();
      expect(fb.updateFhir.isEnabled()).toBeFalsy();
      fb.dismissMenu();
    });

    // Assume there is a resource on the server
    it('should do next/previous page', function () {

      fb.importMenu.click();
      fb.showFhirResources.click();
      expect(fb.dialog.isDisplayed()).toBeTruthy();
      fb.fhirServerPulldownSelect(uhnServerName).click();

      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeFalsy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeFalsy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();

      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeFalsy();

      fb.fhirServerPulldownSelect('UHN HAPI Server - STU3').click();

      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeFalsy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.nextButton.click();
      expect(fb.nextButton.isEnabled()).toBeFalsy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();

      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeTruthy();
      fb.prevButton.click();
      expect(fb.nextButton.isEnabled()).toBeTruthy();
      expect(fb.prevButton.isEnabled()).toBeFalsy();


      fb.closeDialog(); // fhir results
    });
  });

});
