import { browser, by, element } from 'protractor';
import {ElementArrayFinder, ElementFinder} from "protractor/built/element";

export class AppPage {
  useCodeYes: ElementFinder = element(by.id('Yes_1'));
  useCodeNo: ElementFinder = element(by.id('No_1'));
  codeCode: ElementFinder = element(by.id('code.0.code'));
  itemEditor: ElementFinder = element(by.css('mat-sidenav-content sf-form'));
  bottomCreateQuestionsButton: ElementFinder = element.all(by.buttonText('Create questions')).last();
  continueButton: ElementFinder = element(by.buttonText('Continue'));
  addItemButton: ElementFinder = element(by.buttonText('Add an item'));
  allTreeNodes: ElementArrayFinder  = element.all(by.css('tree-root tree-viewport tree-node-collection tree-node'));
  firstTreeNode: ElementFinder = this.allTreeNodes.first();
  lastTreeNode: ElementFinder = this.allTreeNodes.last();


  /**
   * Load the page
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
