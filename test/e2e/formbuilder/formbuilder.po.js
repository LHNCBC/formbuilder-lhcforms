/**
 * This file uses the Page Object pattern to define the main page for tests
 * https://docs.google.com/presentation/d/1B6manhG0zEXkC-H-tPo2vwU06JhL8w9-XCF9oehXzAQ
 */

'use strict';

var jsonpath = require('jsonpath');
/**
 * A simple lookup for panel directive.
 *
 * @returns {FormBuilder}
 */
var FormBuilder = function () {
  this.autoCompListItems = element.all(by.css('#searchResults li'));
  this.questionTree = element(by.css('.angular-ui-tree'));
  this.addButton = element(by.id('sidebar-container')).element(by.css('button'));
  this.dialog = element.all(by.css('md-dialog')).last();
  this.importLOINCRadio = this.dialog.element(by.cssContainingText('md-radio-button', 'Import from LOINC'));
  this.newItemRadio = this.dialog.element(by.cssContainingText('md-radio-button', 'New item'));
  this.typePanelRadio = this.dialog.element(by.cssContainingText('md-radio-button', 'Panel'));
  this.typeQuestionRadio = this.dialog.element(by.cssContainingText('md-radio-button', 'Question'));
  this.searchBox = element(by.id('searchQuestionId'));
  this.newItemInputBox = this.dialog.all(by.css('md-dialog-actions input')).get(0);
  this.importButton = element(by.id('importButton'));
  this.addItemDlgTitle = element(by.id('addItemTitleId'));
  this.newItemAddButton = this.dialog.element(by.buttonText('Add'));
  this.importDialogCancel = this.dialog.element(by.cssContainingText('button', 'Cancel'));

  this.rootNodeList = this.questionTree.all(by.xpath('ol/li/div[@ui-tree-handle]'));
  this.nodeList = this.questionTree.all(by.css('div.angular-ui-tree-handle'));
  this.firstNode = this.nodeList.get(0);

  this.itemBuilderPanel = element(by.id('item-builder-panel'));
  this.basicPanelEl = element(by.id('basic-item-builder-panel'));
  this.advancedPanelEl = element(by.id('advanced-item-builder-panel'));
  this.panelTitle = this.basicPanelEl.element(by.css('.lf-form-title span'));
  this.questionText = element(by.id('/question/1'));
  this.questionType = element(by.id('/dataType/1'));
  this.questionAnswerText = element(by.id('/answers/text/1/1'));

  this.basicEditTab = element(by.cssContainingText('md-tab-item span', 'Build basic properties'));
  this.advancedEditTab = element(by.cssContainingText('md-tab-item span', 'Build advanced properties'));

  this.useRestrictionsYes = element(by.id('/useRestrictions/1true'));
  this.restrictionName1 = element(by.id('/useRestrictions/restrictions/name/1/1/1'));
  this.restrictionValue1 = element(by.id('/useRestrictions/restrictions/value/1/1/1'));
  this.restrictionName2 = element(by.id('/useRestrictions/restrictions/name/1/2/1'));
  this.restrictionValue2 = element(by.id('/useRestrictions/restrictions/value/1/2/1'));
  this.useSkipLogicYes = element(by.id('/useSkipLogic/1true'));

  this.skipLogicAction = element(by.id('/useSkipLogic/skipLogic/action/1/1/1'));
  this.skipLogicLogic = element(by.id('/useSkipLogic/skipLogic/logic/1/1/1'));
  this.skipLogicConditionsSource = element(by.id('/useSkipLogic/skipLogic/conditions/source/1/1/1/1'));
  this.skipLogicConditionsTriggerRangeRangeBoundary1minExclusive = element(by.id('/useSkipLogic/skipLogic/conditions/triggerRange/rangeBoundary/1/1/1/1/1minExclusive'));
  this.skipLogicConditionsTriggerRangeRangeBoundary2maxExclusive = element(by.id('/useSkipLogic/skipLogic/conditions/triggerRange/rangeBoundary/1/1/1/2/1maxExclusive'));
  this.skipLogicConditionsTriggerRangeRangeValue1 = element(by.id('/useSkipLogic/skipLogic/conditions/triggerRange/rangeValue/1/1/1/1/1'));
  this.skipLogicConditionsTriggerRangeRangeValue2 = element(by.id('/useSkipLogic/skipLogic/conditions/triggerRange/rangeValue/1/1/1/2/1'));
  this.skipLogicConditionsTrigger = element(by.id('/useSkipLogic/skipLogic/conditions/trigger/1/1/1/1'));

  //this.addRestrictionButton = element(by.id('add-/useRestrictions/restrictions/1/1'));
  this.addRestrictionButton = this.advancedPanelEl.element(by.cssContainingText('button', 'Add another \"Restriction\"'));
  this.addSkipLogicConditionButton = this.advancedPanelEl.element(by.cssContainingText('button','Add another \"Condition\"'));
  this.addSkipLogicSkipLogicNumericalRange = this.advancedPanelEl.element(by.cssContainingText('button','Add another \"Numerical range\"'));

  this.useDataControlYes = element(by.id('/useDataControl/1true'));
  this.dataControlConstructionSimple1 = element(by.id('/useDataControl/dataControl/construction/1/1/1SIMPLE'));
  this.dataControlConstructionArray1 = element(by.id('/useDataControl/dataControl/construction/1/1/1ARRAY'));
  this.dataControlSource1 = element(by.id('/useDataControl/dataControl/source/1/1/1'));
  this.dataControlDataFormat1 = element(by.id('/useDataControl/dataControl/dataFormat/1/1/1'));
  this.dataControlOnAttribute1 = element(by.id('/useDataControl/dataControl/onAttribute/1/1/1'));

  this.selectedNode = this.questionTree.element(by.css('div.angular-ui-tree-handle.active'));
  this.answersDelButton3 = this.basicPanelEl.element(by.id('del-/answers/3'));

  this.refreshButtons = element.all(by.css('md-tabs span.glyphicon-refresh'));
  this.previewRefreshButton = this.refreshButtons.first();
  this.previewWidgetBPDeviceCuffAnswerListEl = element(by.css('input[name^="BP device Cuff size"]'));
  this.previewWidgetBPDeviceInvent = element(by.css('input[name^="BP device Inventory #"]'));
  this.previewWidgetBPDeviceModel = element(by.css('input[name^="BP device Model #"]'));
  this.answerListResults = element.all(by.css('#searchResults ul li'));

  this.previewPanel = element(by.id('preview-panel'));
  this.previewPanelEl = this.previewPanel.element(by.css('lforms'));
  this.previewJsonRefreshButton = this.refreshButtons.get(2);
  this.previewFhirJsonRefreshButton = this.refreshButtons.get(1);
  this.previewJsonSource = this.previewPanel.element(by.css('md-tab-content.md-active pre'));

  this.previewVitalSignsPanelModified = this.previewPanelEl.element(by.cssContainingText('label', 'Vital Signs Panel'));
  this.previewRespRate = element(by.css('input[name="Resp rate"]'));
  this.previewHeartRate = element(by.css('input[name="Heart rate"]'));
  this.termsOfUseAcceptButton = element(by.cssContainingText('md-dialog button', 'Accept'));
  this.exportMenu = element(by.cssContainingText('md-menu-bar > md-menu > button', 'Export'));
  this.importMenu = element(by.cssContainingText('md-menu-bar > md-menu > button', 'Import'));
  this.exportToFile = element(by.cssContainingText('md-menu-content > md-menu-item > button', 'Export to file...'));
  this.exportFileFHIRFormat = this.dialog.element(by.cssContainingText('md-radio-button', 'FHIR Questionnaire'));
  this.exportFileLFormsFormat = this.dialog.element(by.cssContainingText('md-radio-button', 'LHC Forms'));
  this.createFhir = element(by.cssContainingText('md-menu-content > md-menu-item > button', 'Create a new FHIR resource on a server'));
  this.updateFhir = element(by.cssContainingText('md-menu-content > md-menu-item > button', 'Update a FHIR resource on a server'));
  this.showFhirResources = element(by.cssContainingText('md-menu-content > md-menu-item > button', 'Load from FHIR server...'));
  this.fileInput = element(by.id('fileInput'));
  this.popupMenuContent = element(by.css('.nodeMenuContent'));
  this.moveTargetItemsSearchBox = element(by.id('selectTargetId'));
  this.moveButton = this.dialog.element(by.buttonText('Move'));
  this.signIn = element(by.id('header')).element(by.partialButtonText('Sign in'));
  this.signOut = element(by.id('header')).element(by.partialButtonText('sign out'));
  this.signInAnonymously = this.dialog.element(by.partialButtonText('Sign In Anonymously'));
  this.formTitle = element(by.id('formTitleInput'));
  this.fhirErrorData = this.dialog.all(by.css('md-dialog-content pre')).get(0);
  this.fhirResponse = this.dialog.all(by.css('md-dialog-content pre')).get(1);
  this.fhirServerList = this.dialog.all(by.repeater('server in fhirCtrl.fhirServerList'));
  this.continueButton = this.dialog.element(by.buttonText('Continue'));
  this.units = element(by.id('/units/1'));
  this.unitDeleteButton = element.all(by.xpath('//ul[../input[@id="/units/1"]]/li/button')).get(0);

  var thisPO = this;
  var searchResults = this.answerListResults;

  /**
   * Get a fhir result item identified by a substring of the text in the item.
   * @param itemSubstring - substring of an item's text.
   * @returns {*} - elementFinder of the first item matching the substring.
   */
  this.fhirResultItem = function(itemSubstring) {
    return element.all(by.css('md-dialog-content md-list-item')).filter(function (elem, index) {
      return elem.getText().then(function (string) {
        return string.indexOf(itemSubstring) !== -1;
      });
    }).first();
  };

  /**
   * Menu popup overlays complete view port with menu popup and a md-backdrop element. As a result
   * element locators fail to access any visible elements on the page. To dismiss the
   * menu, click the invisible 'md-backdrop'.
   */
  this.dismissMenu = function() {
    $('md-backdrop').click();
  };


  /**
   * Select a fhir server by a substring of its name from the pull down list.
   *
   * @param substring - A substring of a server to select.
   * @returns {*} - elementFinder of the first md-option matching the substring.
   */
  this.fhirServerPulldownSelect = function(substring) {
    element(by.css('md-input-container > md-select')).click();
    return element(by.cssContainingText('md-select-menu > md-content > md-option', substring));
  };


  /**
   * Close upper most dialog.
   */
  this.closeDialog = function () {
    var dialog = element.all(by.css('md-dialog')).last();
    dialog.isDisplayed().then(function (displayed) {
      if(displayed) {
        dialog.element(by.css('md-toolbar button md-icon[aria-label="Close dialog"]')).click();
      }
    });
  };


  /**
   * Clear the side bar
   *
   */
  this.cleanupSideBar = function () {
    thisPO.rootNodeList.count().then(function (count) {
      if(count > 0) {
        thisPO.rootNodeList.get(0).element(by.css('.more-options')).click();
        thisPO.clickOpenedMenuItem('Remove this item');
        thisPO.cleanupSideBar();
      }
    });
  };


  /**
   * Click more options using node text. It opens the popup menu.
   *
   * @param nodeText {string} - Part of the node text to identify the node
   */
  this.clickMoreOptions = function (nodeText) {
    var node = thisPO.questionTree.element(by.xpath('.//li[@ui-tree-node]/div[@ui-tree-handle and contains(div[contains(@class, "flex-item-stretch")]/span/text(), "'+nodeText+'")]'));
    node.element(by.css('.more-options')).click();
  };


  /**
   * Given the popup menu is opened, click a menu item using menu item text.
   *
   * @param menuText {string} - Part of the menu item text to identify the menu item.
   */
  this.clickOpenedMenuItem = function (menuText) {
    thisPO.popupMenuContent.element(by.cssContainingText('button', menuText)).click();
  };


  /**
   * Click popup menu item using node text and menu item text.
   *
   * @param nodeText {string} - Part of the node text to identify the node
   * @param menuText {string} - Part of the menu item text to identify the menu item.
   */
  this.clickMenuItem = function (nodeText, menuText) {
    thisPO.clickMoreOptions(nodeText);
    thisPO.clickOpenedMenuItem(menuText);
  };


  /**
   * Wait for the autocomplete results to be shown
   */
  this.waitForElementDisplayed = function(el) {
    return browser.wait(function() {
      thisPO.scrollIntoView(el);
      return el.isDisplayed();
    }, 10000);
  };


  /**
   * Utility to simulate data entry into an input element.
   * @param {Object} elem - Such as textarea, or text input element
   * @param {String} stringOfKeys - String of input
   * @param {Integer} repetitions - Number of repetitions of stringOfKeys
   */
  this.sendKeys = function(elem, stringOfKeys, repetitions) {
    if (!repetitions || repetitions <= 0) {
      repetitions = 1;
    }

    this.scrollIntoView(elem);
    elem.click();
    for (var i = 0; i < repetitions; i++) {
      elem.sendKeys(stringOfKeys);
    }
  };


  /**
   * Utility to simulate data entry into an input element.
   * @param {Object} elem - Such as textarea, or text input element
   * @param {String} stringOfKeys - String of input
   * @param {Integer} repetitions - Number of repetitions of stringOfKeys
   */
  this.autoCompSelect = function(autoCompElem, orderInTheList) {
    if (!orderInTheList || orderInTheList <= 0) {
      orderInTheList = 1;
    }

    this.scrollIntoView(autoCompElem);
    autoCompElem.click();
    this.waitForElementDisplayed(element(by.id('searchResults')));
    for (var i = 0; i < orderInTheList; i++) {
      autoCompElem.sendKeys(protractor.Key.DOWN);
    }
    autoCompElem.sendKeys(protractor.Key.ENTER);
  };


  /**
   * Select an item in auto complete using item text.
   *
   * @param autoCompElem - Such as textarea, or text input element
   * @param searchText {string} - Text to input in the box
   * @param itemText {string} - Text to identify the item.
   */
  this.autoCompSelectByText = function(autoCompElem, searchText, itemText) {
    this.genericAutoCompSelectByText(autoCompElem, searchText, itemText, 'li');
  };


  /**
   * Select an item in auto complete using item text. This is used where search results
   * are in table format.
   *
   * @param autoCompElem - Such as textarea, or text input element
   * @param searchText {string} - Text to input in the box
   * @param itemText {string} - Text to identify the item.
   */
  this.tableAutoCompSelectByText = function(autoCompElem, searchText, itemText) {
    this.genericAutoCompSelectByText(autoCompElem, searchText, itemText, 'table > tbody > tr > td');
  };


  /**
   * Select an auto complete item by its text given a search string. Use searchResultCssSelector
   * expression to narrow down the usage for table format or non-table format.
   *
   * @param autoCompElem - Such as textarea, or text input element
   * @param searchText {string} - Text to input in the box
   * @param itemText {string} - Text to identify the item.
   * @param searchResultCssSelector - css selector expression to narrow down the
   *   search for itemText in '#searchResults' box.
   */
  this.genericAutoCompSelectByText = function(autoCompElem, searchText, itemText, searchResultCssSelector) {
    this.scrollIntoView(autoCompElem);
    autoCompElem.click();
    if(searchText) {
      autoCompElem.sendKeys(searchText);
    }
    var el = element(by.id('searchResults'));
    this.waitForElementDisplayed(el);
    //element(by.id('moreResults')).click();
    el.all(by.cssContainingText(searchResultCssSelector, itemText)).get(0).click();
  };


  /**
   * Return element locator for a node in the side bar given partial text of the node.
   *
   * @param nodeText - Patial text of the node
   * @returns {Object} - Element locator.
   */
  this.getNode = function(nodeText) {
    return thisPO.questionTree.element(by.xpath('.//li[@ui-tree-node and div[@ui-tree-handle]/div[contains(@class, "flex-item-stretch")]/span[contains(text(), "'+nodeText+'")]]'));
  };


  /**
   * Return element locator for all child nodes in the side bar given partial text of the parent node.
   *
   * @param parentNodeText - Patial text of the parent node
   * @returns {Object} - Element locator.
   */
  this.childNodes = function(parentNodeText) {
    var parentNode = thisPO.getNode(parentNodeText);
    return parentNode.all(by.xpath('ol/li'));
  };


  /**
   * Return element locator of the parent node given partial text of a child node.
   *
   * @param childNodeText - Patial text of a child node
   * @returns {Object} - Element locator.
   */
  this.parentNode = function(childNodeText) {
    return thisPO.questionTree.element(by.xpath('.//li[@ui-tree-node and div[@ui-tree-handle]/div[contains(@class, "flex-item-stretch")]/span[contains(text(), "'+childNodeText+'")]]/../../../li'));
  };


  /**
   * Search loinc panel from lforms-service search box. It fills up autocompSearch.model
   * with the data.
   *
   * @param {string} searchTerm - Search term enter into the box
   * @param {integer} orderInAutoCompResults (optional) - Serial number in the list to pick from the autocmplete list.
   *   Assumed first if not specified.
   */
  this.addNewItem = function(text) {
    thisPO.newItemRadio.click();
    thisPO.typeQuestionRadio.click();
    thisPO.newItemInputBox.sendKeys(text);
    thisPO.newItemAddButton.click();
  };


  /**
   * Search loinc panel from lforms-service search box. It fills up autocompSearch.model
   * with the data.
   *
   * @param {string} searchTerm - Search term enter into the box
   * @param {integer} orderInAutoCompResults (optional) - Serial number in the list to pick from the autocmplete list.
   *   Assumed first if not specified.
   */
  this.searchLoincPanel = function(searchTerm, orderInAutoCompResults) {
    this.addButton.click();
    this.importLOINCRadio.click();
    this.typePanelRadio.click();
    this.searchBox.click();
    this.searchBox.sendKeys(searchTerm);
    this.autoCompSelect(this.searchBox, orderInAutoCompResults);
  };


  /**
   * Add loinc panel from lforms-service search box.
   *
   * @param {string} searchTerm - Search term enter into the box
   * @param {integer} orderInAutoCompResults (optional) - Serial number in the list to pick from the autocmplete list.
   *   Assumed first if not specified.
   */
  this.searchAndAddLoincPanel = function(searchTerm, orderInAutoCompResults) {
    this.searchLoincPanel(searchTerm, orderInAutoCompResults);
    this.importButton.click();
  };


  /**
   * Scroll to the bottom of scrollable element.
   *
   * @param element - Element finder representing element to view.
   */
  this.scrollIntoView = function(element) {
    browser.executeScript('arguments[0].scrollIntoView();', element.getWebElement());
  };


  /**
   * Scroll to the bottom of scrollable element.
   *
   * @param element - Element finder representing element to view.
   */
  this.scrollIntoViewAndClick = function(element) {
    browser.executeScript('arguments[0].scrollIntoView();', element.getWebElement());
    element.click();
  };


  /**
   * Scroll to the bottom of scrollable element.
   *
   * @param scrollableElement - Element finder representing a scrollable element.
   */
  this.scrollToBottom = function(scrollableElement) {
    browser.executeScript('arguments[0].scrollTop = arguments[0].scrollHeight', scrollableElement.getWebElement());
  };


  /**
   * Scroll to the top of scrollable element.
   *
   * @param scrollableElement - Element finder representing a scrollable element.
   */
  this.scrollToTop = function(scrollableElement) {
    browser.executeScript('arguments[0].scrollTop = 0', scrollableElement.getWebElement());
  };


  /**
   *  Outputs the browser's console messages.
   */
  this.printBrowserConsole = function() {
    browser.manage().logs().get('browser').then(function(browserLogs) {
      if (browserLogs.length > 0) {
        console.log("Messages from browser's console");
        browserLogs.forEach(function(log){
          console.log(log.message);
        });
        console.log("End of messages from browser's console");
      }
    });
  };


  /**
   * Create a json out of text pointed to by an element locator.
   *
   * @param elemLocator - Protractor element locator
   * @param jpath - Optional json path expression to extract part of json in
   * the promise resolution.
   *
   * @returns {Promise} - A promise that resolves to json object.
   */
  this.getJsonFromText = function(elemLocator, jpath) {
    return elemLocator.getText().then(function (text) {
      var json = JSON.parse(text);
      if(jpath && (jpath.trim().length > 0)) {
        json = jsonpath.query(json, jpath.trim());
      }
      return json;
    });
  };

};


module.exports = {
  formbuilder: new FormBuilder()
};

