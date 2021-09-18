import {browser, by, element, promise, protractor} from 'protractor';
import {ElementArrayFinder, ElementFinder} from 'protractor/built/element';
var EC = protractor.ExpectedConditions;
import path from 'path';

export class AppPage {
  useCodeYes: ElementFinder = element(by.id('Yes_1'));
  useCodeNo: ElementFinder = element(by.id('No_1'));
  codeCode: ElementFinder = element(by.id('code.0.code'));
  itemEditor: ElementFinder = element(by.css('mat-sidenav-content sf-form'));
  bottomCreateQuestionsButton: ElementFinder = element.all(by.buttonText('Create questions')).last();
  continueButton: ElementFinder = element(by.buttonText('Continue'));
  addItemButton: ElementFinder = element(by.buttonText('Add new item'));
  allTreeNodes: ElementArrayFinder  = element.all(by.css('tree-root tree-viewport tree-node-collection tree-node'));
  firstTreeNode: ElementFinder = this.allTreeNodes.first();
  lastTreeNode: ElementFinder = this.allTreeNodes.last();
  type: ElementFinder = element(by.id('type'));
  helpText: ElementFinder = element(by.id('__$helpText'));
  typeDecimal: ElementFinder = this.type.element(by.cssContainingText('option', 'decimal'));
  typeQuantity: ElementFinder = this.type.element(by.cssContainingText('option', 'quantity'));
  typeString: ElementFinder = this.type.element(by.cssContainingText('option', 'string'));
  units: ElementFinder = element.all(by.css('[id^="units"]')).last();
  unitsSearchResults: ElementFinder = element(by.id('searchResults'));
  selectSecondUnit: ElementFinder = element(by.cssContainingText('tr > td', 'in_us'));
  viewQuestionnaireJSON: ElementFinder = element(by.buttonText('View Questionnaire JSON'));
  deleteItemButton: ElementFinder = element(by.buttonText('Delete this item'));
  importMenu: ElementFinder = element(by.buttonText('Import'));
  importMenuButton: ElementFinder = element(by.buttonText('Import from file...'));
  fileInputEl: ElementFinder = element(by.css('input[type="file"]'));
  questionnaireJSON(): promise.Promise<any> {
    const closeButton = element(by.css('ngb-modal-window')).element(by.buttonText('Close'));
    browser.actions().mouseMove(this.viewQuestionnaireJSON).perform();
    this.viewQuestionnaireJSON.click();
    const elementWithQ = element(by.css('ngb-modal-window div.modal-body pre'));
    browser.wait(EC.textToBePresentInElement(elementWithQ, '{'), 5000);
    return elementWithQ.getText().then((text) => {
      let ret;
      try {
        ret = JSON.parse(text);
      }
      catch(e) {
        console.log('Failed to parse text='+text);
        console.log(e);
        throw e;
      }
      finally {
        browser.actions().mouseMove(closeButton).perform();
        closeButton.click();
      }
      return ret;
    });
  }


  /**
   * Load a file from disk
   *
   * @param fileName
   */
  loadFormFromDisk(fileName) {
    const absPath = path.resolve(__dirname, fileName);
    // Make the file input element visible, otherwise browser doesn't accept the sendKeys().
    browser.executeScript('arguments[0].classList.toggle("d-none")', this.fileInputEl.getWebElement());
    this.fileInputEl.sendKeys(absPath);
    browser.executeScript('arguments[0].classList.toggle("d-none")', this.fileInputEl.getWebElement());
  }


  /**
   * Clean up side bar tree
   */
  cleanUpTree() {
    let isPresent = true;
    while(this.allTreeNodes.count) {
      browser.wait(this.firstTreeNode.isDisplayed().then((bool) => {
        isPresent = bool;
        this.deleteItemButton.click();
      }), 3000);
    }
    this.addItemButton.click();
  }
  /*
  Load the page
  */
  navigateTo() {
    return browser.get(browser.baseUrl) as Promise<any>;
  }

  /**
   * Identify main page
   */
  getHomePageTitle() {
    return element(by.css('#resizableMiddle .lead')).getText() as Promise<string>;
  }


  /**
   * Identify form level screen
   */
  getFormlevelPageTitle() {
    return element(by.css('#resizableMiddle p')).getText() as Promise<string>;
  }


}
