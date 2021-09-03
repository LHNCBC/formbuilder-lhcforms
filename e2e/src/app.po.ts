import {browser, by, element, promise, protractor} from 'protractor';
import {ElementArrayFinder, ElementFinder} from 'protractor/built/element';

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
  typeDecimal: ElementFinder = this.type.element(by.cssContainingText('option', 'decimal'));
  typeQuantity: ElementFinder = this.type.element(by.cssContainingText('option', 'quantity'));
  typeString: ElementFinder = this.type.element(by.cssContainingText('option', 'string'));
  units: ElementFinder = element.all(by.css('[id^="units"]')).last();
  unitsSearchResults: ElementFinder = element(by.id('searchResults'));
  selectSecondUnit: ElementFinder = element(by.cssContainingText('tr > td', 'in_us'));
  viewQuestionnaireJSON: ElementFinder = element(by.buttonText('View Questionnaire JSON'));
  deleteItemButton: ElementFinder = element(by.buttonText('Delete this item'));

  questionnaireJSON(): promise.Promise<any> {
    const closeButton = element(by.css('ngb-modal-window')).element(by.buttonText('Close'));
    browser.actions().mouseMove(this.viewQuestionnaireJSON).perform();
    this.viewQuestionnaireJSON.click();
    return element(by.css('ngb-modal-window div.modal-body pre')).getText().then((text) => {
      const ret = JSON.parse(text);
      browser.actions().mouseMove(closeButton).perform();
      closeButton.click();
      return ret;
    });
  }


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
