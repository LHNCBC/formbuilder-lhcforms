/*
Loading home page starts in this file. Make sure that this file is the first one in the order of execution.
One way to keep the order is to have the name of this file at the top alphabetically among
the *.spec.js files.
 */
'use strict';

const fb = require('./formbuilder.po').formbuilder;
const fs = require('fs');
const path = require('path');
const util = require('./test-util');

describe('GET /', function () {


  beforeAll(function () {
    util.loadHomePageIfNotLoaded();
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
          if (present) {
            fb.importDialogCancel.click();
          }
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
        fb.autoCompSelectByText(fb.searchBox, 'hepa', 'Acute ');
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
        util.getJSONSource('lforms').then(function (text) {
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
        util.getJSONSource('lforms').then(function (text) {
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

    describe('Item type radio buttons', function() {
      beforeAll(function() {
        fb.cleanupSideBar();
        var str = 'Test item created';
        fb.addButton.click();
        fb.addNewItem(str);
      });

      [
        {name:'question', clickControl: fb.itemTypeQuestion, test: {dataType: 'ST'}},
        {name:'group', clickControl: fb.itemTypeGroup, test: {header: true}},
        {name:'display', clickControl: fb.itemTypeDisplay, test: {dataType: 'TITLE'}}
      ].forEach(function (testCase) {
        it('Should select item type: '+testCase.name, function(done) {
          testCase.clickControl.click();
          util.getJSONSource('lforms').then(function (text) {
            var previewLFData = JSON.parse(text);
            var fields = Object.keys(testCase.test);
            fields.forEach(function(field) {
              expect(previewLFData.items[0][field]).toBe(testCase.test[field]);
            });
            done();
          }, function (err) {
            done(err);
          });
        });
      })
    });

    describe('Css styling', function() {
      beforeAll(function() {
        fb.cleanupSideBar();
        var str = 'Test item created';
        fb.addButton.click();
        fb.addNewItem(str);
      });

      it('should follow css defaults for question text and prefix fields', function () {
        expect(fb.addCssQuestionNo.isSelected()).toBeTruthy();
        expect(fb.cssQuestion.isPresent()).toBeFalsy();
        fb.addCssQuestionYes.click();
        expect(fb.cssQuestion.isDisplayed()).toBeTruthy();

        expect(fb.addCssPrefixNo.isSelected()).toBeTruthy();
        expect(fb.cssPrefix.isPresent()).toBeFalsy();
        fb.addCssPrefixYes.click();
        expect(fb.cssPrefix.isDisplayed()).toBeTruthy();
      });

      it('Should convert question text css', function(done) {
        fb.addCssQuestionYes.click();
        fb.cssQuestion.click();
        var cssInput = 'font-size: 2rem, color: blue, font-style: italic';
        fb.cssQuestion.sendKeys(cssInput);
        fb.previewRefreshButton.click();
        util.getJSONSource('lforms').then(function (text) {
          var previewLFData = JSON.parse(text);
          expect(previewLFData.items[0].obj_text).toEqual({
            extension: [{
              url: 'http://hl7.org/fhir/StructureDefinition/rendering-style',
              valueString: cssInput
            }]
          });
          done();
        }, function (err) {
          done(err);
        });
      });

      it('Should convert question prefix css', function(done) {
        fb.addCssPrefixYes.click();
        fb.cssPrefix.click();
        var cssInput = 'font-size: 2rem, color: red, font-weight: bold';
        fb.cssPrefix.sendKeys(cssInput);
        fb.previewRefreshButton.click();
        util.getJSONSource('lforms').then(function (text) {
          var previewLFData = JSON.parse(text);
          expect(previewLFData.items[0].obj_prefix).toEqual({
            extension: [{
              url: 'http://hl7.org/fhir/StructureDefinition/rendering-style',
              valueString: cssInput
            }]
          });
          done();
        }, function (err) {
          done(err);
        });
      });
    });

    it('should see changes in linkId', function (done) {
      fb.cleanupSideBar();
      var str = 'Test item created';
      fb.addButton.click();
      fb.addNewItem(str);
      fb.linkId.clear();
      fb.linkId.sendKeys('1');
      fb.previewRefreshButton.click();
      util.getJSONSource('lforms').then(function (text) {
        var previewLFData = JSON.parse(text);
        expect(previewLFData.items[0].linkId).toBe('1');
        done();
      }, function (err) {
        done(err);
      });
    });

    it('should pre-select default export format', function() {
      fb.exportMenu.click();
      browser.wait(protractor.ExpectedConditions.elementToBeClickable(fb.exportToFile), 5000);
      fb.exportToFile.click();
      expect(fb.exportFileFHIRFormatR4.getAttribute('class')).toContain('md-checked');
      fb.importDialogCancel.click();
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
      expect(fb.panelTitle.getText()).toBe('1 Vital signs, weight and height panel [34565-2]');
      expect(fb.nodeList.count()).toEqual(26);
    });

    it('should reflect changes to question text in formbuilder title and preview widget', function() {
      util.assertNodeSelection('Vital Signs Pnl');
      expect(fb.basicPanelEl.isDisplayed()).toBeTruthy();
      // Verify widget title
      expect(fb.panelTitle.getText()).toBe('1.1 Vital Signs Pnl [34566-0]');

      // Edit question text
      fb.sendKeys(fb.questionText, protractor.Key.BACK_SPACE, 4);
      fb.sendKeys(fb.questionText, ' Panel');

      // Verify changes in the title
      expect(fb.panelTitle.getText()).toBe('1.1 Vital Signs Panel [Modified_34566-0]');

      // Verify changes in the preview widget
      fb.previewRefreshButton.click();
      expect(fb.previewVitalSignsPanelModified.getText()).toBe('Vital Signs Panel');
    });

    it('Should reflect changes in preview widget', function () {
      util.assertNodeSelection('BP device Cuff size');
      expect(fb.basicPanelEl.isDisplayed()).toBeTruthy();
      expect(fb.panelTitle.getText()).toBe('1.1.3.5 BP device Cuff size [8358-4]');
      fb.previewRefreshButton.click();
      fb.previewWidgetBPDeviceCuffAnswerListEl.click();
      util.assertAnswerListCount(3);

      fb.scrollIntoViewAndClick(fb.answersDelButton3);
      fb.scrollIntoViewAndClick(fb.previewRefreshButton);
      fb.previewWidgetBPDeviceCuffAnswerListEl.click();
      util.assertAnswerListCount(2);
    });

    it('Should display/hide answer list items controlled by skip logic', function () {
      util.assertNodeSelection('Heart rate');
      fb.questionType.clear();
      expect(fb.questionType.isDisplayed()).toBeTruthy();

      fb.autoCompSelect(fb.questionType, 8);
      expect(fb.questionAnswerText.isDisplayed()).toBeTruthy();
      // Restore its type.
      fb.questionType.clear();
      fb.autoCompSelect(fb.questionType, 5);
    });

    it('should search and select units', function () {
      util.assertNodeSelection('BP sys');
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
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
      util.assertNodeSelection('Resp rate');
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
      util.getJSONSource('lforms').then(function (text) {
        var previewLFData = JSON.parse(text);
        var selectedItem = previewLFData.items[0].items[0].items[1];
        expect(selectedItem.question).toBe('Resp rate');
        expect(selectedItem.restrictions.minExclusive).toBe('50');
        expect(selectedItem.restrictions.maxExclusive).toBe('100');
      });
    });
  });

  describe('Build skip logic', function () {

    beforeAll(function () {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
      util.assertNodeSelection('BP device Invento');
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
      fb.scrollIntoViewAndClick(fb.skipLogicConditionsTriggerCNE);
      expect(fb.autoCompListItems.isDisplayed()).toBeTruthy();
      expect(fb.autoCompListItems.get(0).getText()).toMatch('Adult standard');
      expect(fb.autoCompListItems.get(1).getText()).toMatch('Adult large');
    });

    it('Should display skip logic in preview panel for CNE/CWE source type', function () {
      // Make sure the target item is displayed by default
      fb.scrollIntoView(fb.previewWidgetBPDeviceInvent);
      expect(fb.previewWidgetBPDeviceInvent.isDisplayed()).toBeTruthy();
      // Select first answer
      fb.autoCompSelect(fb.skipLogicConditionsTriggerCNE, 1);
      fb.scrollIntoViewAndClick(fb.previewRefreshButton);
      // See the effect of skip logic on the target.
      // Testing the absence of an element. Make sure you can see its neighbor
      // and then confirm the absence of fb.previewWidgetBPDeviceInvent.
      fb.scrollIntoView(fb.previewWidgetBPDeviceModel);
      expect(fb.previewWidgetBPDeviceModel.isDisplayed()).toBeTruthy();
      expect(fb.previewWidgetBPDeviceInvent.isPresent()).toBeFalsy();
      // Examine json output.
      util.getJSONSource('lforms').then(function (text) {
        var previewLFData = JSON.parse(text);
        var selectedItem = previewLFData.items[0].items[0].items[2].items[6];
        expect(selectedItem.question).toBe('BP device Inventory #');
        expect(selectedItem.skipLogic).toBeDefined();
        expect(selectedItem.skipLogic.action).toBe('show');
        expect(selectedItem.skipLogic.logic).toBe('ANY');
        expect(selectedItem.skipLogic.conditions.length).toBe(1);
        expect(selectedItem.skipLogic.conditions[0].source).toBe('/34566-0/35094-2/8358-4');
        expect(selectedItem.skipLogic.conditions[0].trigger.value.code).toBe('LA11162-7');
      });
    });

    it('Should build condition with number source type', function () {
      // Pick source with number type. 2nd is 'Resp rate'
      fb.autoCompSelect(fb.skipLogicConditionsSource, 2);
      fb.skipLogicConditionsTriggerRangeRangeBoundary1minExclusive.click();
      fb.sendKeys(fb.skipLogicConditionsTriggerRangeRangeValue1, '50');

      // Add another numerical range
      fb.scrollIntoViewAndClick(fb.addSkipLogicConditionButton);
      fb.scrollIntoViewAndClick(fb.skipLogicLogicAll);

      // Select the same source
      fb.autoCompSelect(fb.skipLogicConditionsSource2, 2);

      fb.skipLogicConditionsTriggerRangeRangeBoundary2maxExclusive.click();
      fb.sendKeys(fb.skipLogicConditionsTriggerRangeRangeValue2, '100');
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

    it('Should have node id labels in the auto complete results for every source item', () => {
      fb.skipLogicConditionsSource.click();
      element.all(by.css('#searchResults li')).each((el) => {
        expect(el.getText()).toMatch(/^([1-9][0-9\.]*)/);
      });
    });

    it('Should update source item list when linkId is changed', () => {
      fb.cleanupSideBar();
      fb.addButton.click();
      fb.addNewItem('q1');
      fb.addButton.click();
      fb.addNewItem('q2');

      const searchResults = element(by.id('searchResults'));
      util.assertNodeSelection('q2');
      fb.advancedEditTab.click();
      fb.useSkipLogicYes.click();
      fb.skipLogicConditionsSource.click();
      expect(searchResults.isDisplayed()).toBeFalsy();

      util.assertNodeSelection('q1');
      fb.basicEditTab.click();
      fb.linkId.click();
      fb.linkId.sendKeys('q1id');

      util.assertNodeSelection('q2');
      fb.basicEditTab.click();
      fb.linkId.click();
      fb.linkId.sendKeys('q2id');
      fb.advancedEditTab.click();
      fb.useSkipLogicYes.click();
      fb.skipLogicConditionsSource.click();
      expect(searchResults.isDisplayed()).toBeTruthy();
      expect(searchResults.all(by.css('li')).get(0).getText()).toMatch('1. q1');
      fb.autoCompSelect(fb.skipLogicConditionsSource, 1);
      const sklStringInput = element(by.id('/useSkipLogic/skipLogic/conditions/triggerOther/1/1/1/1'));
      sklStringInput.sendKeys('a');
      fb.scrollIntoViewAndClick(fb.previewRefreshButton);

      const previewSource = element(by.id('q1id/1'));
      const previewTarget = element(by.id('q2id/1'));
      expect(previewTarget.isPresent()).toBeFalsy();
      previewSource.sendKeys('a');
      expect(previewTarget.isDisplayed()).toBeTruthy();
      previewSource.sendKeys('b');
      expect(previewTarget.isPresent()).toBeFalsy();
    });

  });

  describe('Data control', function () {

    beforeAll(function () {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('vital signs pnl', 1);
      fb.scrollIntoViewAndClick(fb.previewRefreshButton);
      util.assertNodeSelection('Heart rate');
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
      util.getJSONSource('lforms').then(function (text) {
        var lforms = JSON.parse(text);
        expect(lforms.items[0].displayControl.questionLayout).toBe('horizontal');
      });
    });

    it('should test with answer layout type radio checkboxes', function () {
      // Pick non header node to work with answerLayout
      util.assertNodeSelection('Inhaled O2 flow');
      fb.advancedEditTab.click();
      fb.displayControlYes.click();
      // Question layout should be absent
      expect(fb.displayControlQuestionLayoutVertical.isPresent()).toBeFalsy();
      expect(fb.displayControlAnswerLayoutTypeCombo.isSelected()).toBe(true); // Default
      expect(fb.displayControlAnswerLayoutColumns.isPresent()).toBeFalsy();
      fb.displayControlAnswerLayoutTypeRadio.click();
      expect(fb.displayControlAnswerLayoutColumns.isDisplayed()).toBeTruthy();
      fb.displayControlAnswerLayoutColumns.sendKeys('2');

      util.getJSONSource('lforms').then(function (text) {
        var lforms = JSON.parse(text);
        var inhaledO2ItemDisplayControl = lforms.items[0].items[15].displayControl;
        expect(inhaledO2ItemDisplayControl.answerLayout.type).toBe('RADIO_CHECKBOX');
        expect(inhaledO2ItemDisplayControl.answerLayout.columns).toBe(2);
      });
    });

    it('Should test column list headers', function () {
      util.assertNodeSelection('Inhaled O2 flow');
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

      util.getJSONSource('lforms').then(function (text) {
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
    var filename = '/tmp/form.lforms.json';
    var fhirFilenameSTU3 = '/tmp/form.STU3.json';
    var fhirFilenameR4 = '/tmp/form.R4.json';
    var lformsOriginalJson = null;
    var fhirOriginalJsonSTU3 = null;
    var fhirOriginalJsonR4 = null;

    beforeAll(function (done) {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('heart rate', 1);
      fb.searchAndAddLoincPanel('weight change', 1);
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
      util.getJSONSource('lforms').then(function (text) {
        lformsOriginalJson = JSON.parse(text);
      });

      util.getJSONSource('R4').then(function (text) {
        fhirOriginalJsonR4 = JSON.parse(text);
      });

      util.getJSONSource('STU3').then(function (text) {
        fhirOriginalJsonSTU3 = JSON.parse(text);
      });

      var EC = protractor.ExpectedConditions;
      fb.exportMenu.click();
      browser.wait(EC.elementToBeClickable(fb.exportToFile), 5000);
      fb.exportToFile.click();
      fb.exportFileLFormsFormat.click();
      fb.continueButton.click();

      fb.exportMenu.click();
      browser.wait(EC.elementToBeClickable(fb.exportToFile), 5000);
      fb.exportToFile.click();
      fb.exportFileFHIRFormatR4.click();
      fb.continueButton.click();

      fb.exportMenu.click();
      browser.wait(EC.elementToBeClickable(fb.exportToFile), 5000);
      fb.exportToFile.click();
      fb.exportFileFHIRFormatSTU3.click();
      fb.continueButton.click();

      Promise.all([util.watchFilePromise(filename), util.watchFilePromise(fhirFilenameR4), util.watchFilePromise(fhirFilenameSTU3)]).then(function() {
        done();
      }).catch(function(err) {
        done(err);
      });
    });

    it('Should save lforms format to a file', function () {

      var newJson = JSON.parse(fs.readFileSync(filename, {encoding: 'utf8'}));
      expect(newJson.templateOptions).toBeUndefined();
      expect(newJson).toEqual(lformsOriginalJson);
      // Edit the file outside the formbuilder.
      // Add an undefined attribute to an item in the file.
      // This tests the functionality of manually adding an attribute to the saved file.
      // This change is expected to show up in preview json src window
      // without affecting the functionality of formbuilder or lforms preview widget.
      var unrecognized = {a: 1, b: [2, 3, 4], c: {str: "some text"}};
      newJson.items[0].unrecognized = unrecognized;
      fs.writeFileSync(filename, JSON.stringify(newJson, null, 2));
      // Add the attribute to lformsOriginalJson so that
      // json preview source after loading from the file matches with it.
      lformsOriginalJson.items[0].unrecognized = unrecognized;
    });

    it('Should save FHIR Questionnaire formats to a file', function () {
      var newJson = JSON.parse(fs.readFileSync(fhirFilenameR4, {encoding: 'utf8'}));
      util.assertFHIRQuestionnaire(newJson, fhirOriginalJsonR4);
      newJson = JSON.parse(fs.readFileSync(fhirFilenameSTU3, {encoding: 'utf8'}));
      util.assertFHIRQuestionnaire(newJson, fhirOriginalJsonSTU3);
    });

    it('Should load an LForms form from disk', function (done) {
      util.loadLFormFromDisk(filename, 'lforms').then(function (text) {
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

    it('Should import a form without showing replacement warning', function() {
      fb.cleanupSideBar(); // Clear any existing form items
      util.importFromFile(filename);
      util.assertNodeSelection('Heart rate');
    });

    it('Should import a form showing replacement warning', function() {
      fb.cleanupSideBar(); // Clear any existing form items
      fb.basicFormEditTab.click();
      fb.formTitle.clear();
      fb.formTitle.sendKeys('Edited form');
      util.importFromFile(filename);
      util.dismissWarning(false); // Cancel replacement, should not load the form.
      expect(fb.formTitle.getAttribute('value')).toBe('Edited form'); // Same form
      util.importFromFile(filename);
      util.dismissWarning(true); // Accept replacement, should load the form.
      expect(fb.formTitle.getAttribute('value')).not.toBe('Edited form');
    });

    it('Should load an LForms form into an empty form builder', function (done) {
      fb.cleanupSideBar(); // Clear any existing form items
      util.loadLFormFromDisk(filename, 'lforms').then(function (previewSrc) {
        var newJson = JSON.parse(previewSrc);
        expect(newJson).toEqual(lformsOriginalJson);
        done();
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });

    it('Should load a FHIR Questionnaire R4 form from disk', function (done) {
      fb.cleanupSideBar(); // Clear any existing form items
      util.loadLFormFromDisk(fhirFilenameR4, 'R4').then(function (previewSrc) {
        var newJson = JSON.parse(previewSrc);
        util.assertFHIRQuestionnaire(newJson, fhirOriginalJsonR4);
        done();
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });

    it('Should load a FHIR Questionnaire STU3 form from disk', function (done) {
      fb.cleanupSideBar(); // Clear any existing form items
      util.loadLFormFromDisk(fhirFilenameSTU3, 'STU3').then(function (previewSrc) {
        var newJson = JSON.parse(previewSrc);
        util.assertFHIRQuestionnaire(newJson, fhirOriginalJsonSTU3);
        done();
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });
  });

  describe('Custom file imports', function() {
    let testfile = path.join(__dirname, './fixtures/lihc_consent.json');
    let originalJson = JSON.parse(fs.readFileSync(testfile, 'utf8'));
    let newJson = null;
    beforeEach((done) => {
      util.loadLFormFromDisk(testfile, 'lforms').then(function (src) {
        newJson = JSON.parse(src);
        done();
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });

    it('should load a file with an item having answer list and answerRequired fields', function (done) {
      expect(newJson.items.length).toEqual(originalJson.items.length);
      expect(newJson.items[0].items.length).toEqual(originalJson.items[0].items.length);
      expect(newJson.items[1].items.length).toEqual(originalJson.items[1].items.length);
      // question code and code system
      expect(newJson.items[0].questionCodeSystem).toEqual(originalJson.items[0].questionCodeSystem);
      expect(newJson.items[0].questionCode).toEqual(originalJson.items[0].questionCode);
      expect(newJson.items[1].questionCodeSystem).toEqual(originalJson.items[1].questionCodeSystem);
      expect(newJson.items[1].questionCode).toEqual(originalJson.items[1].questionCode);
      // Answer fields
      expect(newJson.items[1].items[0].answers[0].code).toEqual(originalJson.items[1].items[0].answers[0].code);
      expect(newJson.items[1].items[0].answers[0].text).toEqual(originalJson.items[1].items[0].answers[0].text);
      expect(newJson.items[1].items[0].answers[1].code).toEqual(originalJson.items[1].items[0].answers[1].code);
      expect(newJson.items[1].items[0].answers[1].text).toEqual(originalJson.items[1].items[0].answers[1].text);
      expect(newJson.items[1].items[0].answerCardinality).toEqual(originalJson.items[1].items[0].answerCardinality);
      done();
    });

    it('should test LOINC items to be ready only', () => {
      util.assertNodeSelection('Date Consent Signed');
      expect(fb.questionCodeSystem.getAttribute('value')).toBe('http://loinc.org');
      fb.sendKeys(fb.questionText, ' xxxx');
      expect(fb.questionCodeSystem.getAttribute('value')).toBe('http://loinc.org/modified');
      expect(fb.questionCode.getAttribute('value')).toBe('Modified_12345-6');
    });
  });

  describe('Loading form with css styles', function () {
    let fixtureFile = path.join(__dirname, './fixtures/rendering-style.lforms.json');
    let originalJson;
    beforeAll(function() {
      originalJson = JSON.parse(fs.readFileSync(fixtureFile));
    });

    it('Should load a form with css styles', function (done) {
      fb.cleanupSideBar();
      util.loadLFormFromDisk(fixtureFile, 'lforms').then(function (text) {
        var newJson = JSON.parse(text);
        expect(newJson.items[0].items[0].obj_prefix).toEqual(originalJson.items[0].items[0].obj_prefix);
        expect(newJson.items[0].items[1].obj_text).toEqual(originalJson.items[0].items[1].obj_text);
        expect(newJson.items[0].items[2].obj_text).toEqual(originalJson.items[0].items[2].obj_text);
        expect(newJson.items[0].items[2].obj_prefix).toEqual(originalJson.items[0].items[2].obj_prefix);
        done();
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });
  });

  describe('Loading skip logic items', function () {
    it('should load with CNE/CWE type triggers in skip logic', function (done) {
      fb.cleanupSideBar();
      util.loadLFormFromDisk(path.join(__dirname, './fixtures/skiplogic-load.lforms.json'), 'lforms').then(function (text) {
        util.assertNodeSelection('list site ');
        fb.advancedEditTab.click();
        expect(fb.skipLogicConditionsSource.getAttribute('value')).toEqual('1.1.7.1. Checklist Review Guide of Symptoms');
        expect(fb.skipLogicConditionsTriggerCNE.getAttribute('value')).toEqual('lymphadenopathy');
        util.getJSONSource('lforms').then(function (source) {
          let sourceJson = JSON.parse(source);
          let loadedJson = JSON.parse(text);
          expect(sourceJson).toEqual(loadedJson);
          done();
        }, function (err) {
          done.fail(JSON.stringify(err));
        });
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });

    it('should load with INT/REAL type (value/equal) triggers in skip logic', function (done) {
      fb.cleanupSideBar();
      util.loadLFormFromDisk(path.join(__dirname, './fixtures/argonaut-skip-logic-trigger-equal.json'), 'lforms').then(function (text) {
        util.assertNodeSelection('How much time');
        fb.advancedEditTab.click();
        expect(fb.skipLogicConditionsSource.getAttribute('value')).toEqual('1. During the last 7 days, on how many days did you do vigorous physical activities like heavy lifting, digging, aerobics, or fast bicycling?');
        expect(fb.skipLogicConditionsTriggerRangeRangeBoundary1equal.isSelected()).toBeTruthy();
        expect(fb.skipLogicConditionsTriggerRangeRangeValue1.getAttribute('value')).toEqual('0');
        util.getJSONSource('lforms').then(function (source) {
          let sourceJson = JSON.parse(source);
          let loadedJson = JSON.parse(text);
          expect(sourceJson).toEqual(loadedJson);
          done();
        }, function (err) {
          done.fail(JSON.stringify(err));
        });
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });

    it('should load with INT/REAL type (notEqual) triggers in skip logic', function (done) {
      fb.cleanupSideBar();
      util.loadLFormFromDisk(path.join(__dirname, './fixtures/skip-logic-trigger-not-equal.json'), 'lforms').then(function (text) {
        util.assertNodeSelection('How much time');
        fb.advancedEditTab.click();
        expect(fb.skipLogicConditionsSource.getAttribute('value')).toEqual('1. During the last 7 days, on how many days did you do vigorous physical activities like heavy lifting, digging, aerobics, or fast bicycling?');
        expect(fb.skipLogicConditionsTriggerRangeRangeBoundary1notEqual.isSelected()).toBeTruthy();
        expect(fb.skipLogicConditionsTriggerRangeRangeValue1.getAttribute('value')).toEqual('0');
        util.getJSONSource('lforms').then(function (source) {
          let sourceJson = JSON.parse(source);
          let loadedJson = JSON.parse(text);
          expect(sourceJson).toEqual(loadedJson);
          done();
        }, function (err) {
          done.fail(JSON.stringify(err));
        });
      }, function (err) {
        done.fail(JSON.stringify(err));
      });
    });

    it('Should load skip logic with source having different data types', function (done) {
      fb.cleanupSideBar();
      util.loadLFormFromDisk(path.join(__dirname, './fixtures/enablewhen-boolean-source.R4.json'), 'lforms').then(function (previewSrc) {
        var newJson = JSON.parse(previewSrc);
        // Boolean type
        expect(newJson.items[0].items[3].skipLogic.conditions[0].trigger).toEqual({value: true});
        expect(newJson.items[0].items[4].skipLogic.conditions[0].trigger).toEqual({value: false});
        // Exists true/false
        expect(newJson.items[0].items[5].skipLogic.conditions[0].trigger).toEqual({exists: true});
        expect(newJson.items[0].items[6].skipLogic.conditions[0].trigger).toEqual({exists: false});
        // String type
        expect(newJson.items[0].items[7].skipLogic.conditions[0].trigger).toEqual({value: 'xxx'});
        expect(newJson.items[0].items[8].skipLogic.conditions[0].trigger).toEqual({notEqual: 'xxx'});
        // Integer type
        expect(newJson.items[0].items[9].skipLogic.conditions[0].trigger).toEqual({value: 1});
        expect(newJson.items[0].items[10].skipLogic.conditions[0].trigger).toEqual({notEqual: 1});
        // With other operators.
        expect(newJson.items[0].items[11].skipLogic.conditions[0].trigger).toEqual({minInclusive: 0});
        expect(newJson.items[0].items[11].skipLogic.conditions[1].trigger).toEqual({maxInclusive: 100});
        expect(newJson.items[0].items[12].skipLogic.conditions[0].trigger).toEqual({minExclusive: 0});
        expect(newJson.items[0].items[12].skipLogic.conditions[1].trigger).toEqual({maxExclusive: 100});

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
      fb.formNode.click();
      fb.basicFormEditTab.click();
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

    afterAll(function () {
      fb.cleanupSideBar();
    });

    it('should convert prefix in FHIR questionnaire json', function () {
      fb.firstNode.click();
      fb.prefix.click();
      fb.prefix.sendKeys('1)');
      expect(fb.prefix.getAttribute('value')).toEqual('1)');
      util.getJSONSource('R4').then(function(text) {
        var fhirObj = JSON.parse(text);
        expect(fhirObj.item[0].prefix).toBe('1)');
      });
    });

    it('should output FHIR questionnaire json', function () {
      util.getJSONSource('R4').then(function(text) {
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

    it('Should convert form level code in FHIR questionnaire json', function () {
      let phq9File = path.join(__dirname, './fixtures/phq9.json');
      let phq9 = JSON.parse(fs.readFileSync(phq9File), {encoding: 'utf8'});
      util.loadLFormFromDisk(phq9File, 'R4').then(function (previewSrc) {
        var newJson = JSON.parse(previewSrc);
        expect(newJson.code).toEqual(phq9.code);
      });
    });

  });

  describe('CalculationMethod', function() {
    beforeAll(function () {
      fb.cleanupSideBar();
      fb.searchAndAddLoincPanel('phq9', 1);
      util.assertNodeSelection('Patient health ');
      fb.advancedEditTab.click();
    });

    afterAll(function () {
      fb.cleanupSideBar();
    });

    it('Should see initial value set to TOTALSCORE', function () {
      expect(element(by.id("/_calculationMethod/1TOTALSCORE")).isSelected()).toBe(true);
      util.getJSONSource('lforms').then(function(text) {
        var output = JSON.parse(text);
        expect(output.items[0].items[10].calculationMethod).toEqual({name: 'TOTALSCORE'});
      });
    });

    it('Should set to none', function () {
      element(by.id("/_calculationMethod/1none")).click();
      util.getJSONSource('lforms').then(function(text) {
        var output = JSON.parse(text);
        expect(output.items[0].items[10].calculationMethod).toBe(undefined);
      });
    });

    it('Should set to TOTALSCORE again', function () {
      element(by.id("/_calculationMethod/1TOTALSCORE")).click();
      util.getJSONSource('lforms').then(function(text) {
        var output = JSON.parse(text);
        expect(output.items[0].items[10].calculationMethod).toEqual({name: 'TOTALSCORE'});
      });
    });
  });

  describe('Calculated expression', function() {
    beforeEach(function(){
      let phq9File = path.join(__dirname, './fixtures/phq9.json');
      util.loadLFormFromDisk(phq9File, 'R4');
    });

    it('Should reflect changes of fhir variable in calculated expression', function(done) {
      fb.previewRefreshButton.click();
      fb.autoCompSelect(element(by.id('/44250-9/1')), 2);
      fb.autoCompSelect(element(by.id('/44255-8/1')), 2);
      var calExpField = element(by.id('/44261-6/1'));
      expect(calExpField.getAttribute('value')).toBe('2');
      util.assertNodeSelection('Patient health ');
      //util.assertNodeSelection('Little interest ');
      fb.advancedEditTab.click();
      var variable2 = element(by.id('/_fhirVariables/expression/3/1'));
      variable2.getAttribute('value').then(function(val) {
        expect(val).toBeDefined();
        variable2.clear();
        fb.sendString(variable2, val+'*100');
        fb.previewRefreshButton.click();
        fb.autoCompSelect(element(by.id('/44250-9/1')), 2);
        fb.autoCompSelect(element(by.id('/44255-8/1')), 2);
        // Again, check calculated expression result
        expect(calExpField.getAttribute('value')).toBe('101');
        done();
      }, done);
    });

    it('Should reflect change of answer item score in calculated expression', function () {
      fb.previewRefreshButton.click();
      // In preview, select second option of first two items.
      fb.autoCompSelect(element(by.id('/44250-9/1')), 2);
      fb.autoCompSelect(element(by.id('/44255-8/1')), 2);
      // Check calculated expression result
      var calExpField = element(by.id('/44261-6/1'));
      expect(calExpField.getAttribute('value')).toBe('2');
      // Edit the score of the second option of the first item.
      util.assertNodeSelection('Little interest ');
      fb.basicEditTab.click();
      var score2 = element(by.id('/answers/score/2/1'));
      expect(score2.getAttribute('value')).toBe('1');
      score2.clear();
      fb.sendKeys(score2, '10');
      fb.previewRefreshButton.click();
      fb.autoCompSelect(element(by.id('/44250-9/1')), 2);
      fb.autoCompSelect(element(by.id('/44255-8/1')), 2);
      // Again, check calculated expression result
      expect(calExpField.getAttribute('value')).toBe('11');
    });
  });

  describe('Observation link period', function () {
    beforeEach(function () {
      fb.cleanupSideBar();
    });

    it('should warn about absent question code', function () {
      var str = 'Test item';
      fb.addButton.click();
      fb.addNewItem(str);
      fb.basicEditTab.click();
      fb.sendKeys(fb.linkId, 'lId1', 1);
      fb.advancedEditTab.click();
      // Default is no, so no warning and no input fields.
      expect(fb.observationLinkPeriodDuration.isPresent()).toBeFalsy();
      expect(fb.observationLinkPeriodUnit.isPresent()).toBeFalsy();
      expect(fb.observationLinkPeriodWarning.isPresent()).toBeFalsy();
      element(by.id('/_observationLinkPeriod/1true')).click();
      // For yes and link id is absent, show warning and no input fields.
      expect(fb.observationLinkPeriodDuration.isPresent()).toBeFalsy();
      expect(fb.observationLinkPeriodUnit.isPresent()).toBeFalsy();
      expect(fb.observationLinkPeriodWarning.isDisplayed()).toBeTruthy();
      fb.basicEditTab.click();
      fb.sendKeys(fb.questionCode, 'qc1', 1);
      fb.advancedEditTab.click();
      // Link id set, show input fields and no warning.
      expect(fb.observationLinkPeriodDuration.isDisplayed()).toBeTruthy();
      expect(fb.observationLinkPeriodUnit.isDisplayed()).toBeTruthy();
      expect(fb.observationLinkPeriodWarning.isPresent()).toBeFalsy();

      fb.basicEditTab.click();
      fb.questionCode.clear();
      fb.advancedEditTab.click();
      // Link id is cleared, back to warning mode.
      expect(fb.observationLinkPeriodDuration.isPresent()).toBeFalsy();
      expect(fb.observationLinkPeriodUnit.isPresent()).toBeFalsy();
      expect(fb.observationLinkPeriodWarning.isDisplayed()).toBeTruthy();
    });

    it('should output in json', function (done) {
      var str = 'Test item';
      fb.addButton.click();
      fb.addNewItem(str);
      fb.basicEditTab.click();
      fb.sendKeys(fb.linkId, 'lId1', 1);
      fb.sendKeys(fb.questionCode, 'qc1', 1);
      fb.advancedEditTab.click();
      element(by.id('/_observationLinkPeriod/1true')).click();
      fb.sendKeys(fb.observationLinkPeriodDuration, '2', 1);
      fb.autoCompSelect(fb.observationLinkPeriodUnit, 6);
      util.getJSONSource('R4').then(function(text) {
        const json = JSON.parse(text);
        expect(json.item[0].extension).toEqual([{
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationLinkPeriod',
          valueDuration: {
            value: 2,
            code: 'a',
            unit: 'years',
            system: 'http://unitsofmeasure.org'
          }
        }]);
        done();
      }, done.fail);
    });

    it('should load a form having an item with the extension', function() {
      let phq9File = path.join(__dirname, './fixtures/phq9.json');
      util.loadLFormFromDisk(phq9File, 'R4');
      util.assertNodeSelection('Little interest ');
      fb.advancedEditTab.click();
      expect(fb.observationLinkPeriodDuration.getAttribute('value')).toBe('1');
      expect(fb.observationLinkPeriodUnit.getAttribute('value')).toBe('years');
    });
  });

  describe('Onload form warnings', function () {

    beforeAll(function (done) {
      util.pageRefresh().then(function() {
        done();
      }, function (err) {
        done(err);
      });
    });

    it('should NOT warn refreshing the page with unedited form', function (done) {
      browser.driver.navigate().refresh();
      browser.waitForAngular().then(function () {
        browser.sleep(1000);
        fb.termsOfUseAcceptButton.click();
        done();
      }, function (err) {
        done(err);
      });
    });

    it('should warn refreshing the page with edited form', function (done) {
      browser.sleep(1000);
      fb.formTitle.clear();
      fb.formTitle.sendKeys('Edited form');
      browser.driver.navigate().refresh();
      browser.driver.switchTo().alert().dismiss(); // Cancel reload
      expect(fb.formTitle.getAttribute('value')).toBe('Edited form');
      browser.driver.navigate().refresh();
      browser.driver.switchTo().alert().accept(); // Accept reload
      browser.waitForAngular().then(function () {
        browser.sleep(1000);
        fb.termsOfUseAcceptButton.click();
        expect(fb.formTitle.getAttribute('value')).not.toBe('Edited form');
        done();
      }, function (err) {
        done(err);
      });
    });
  });

});
