import { AppPage } from './app.po';
import {browser, by, element, logging} from 'protractor';

describe('formbuilder-lhcforms App', () => {
  let page: AppPage;

  beforeAll(() => {
    browser.waitForAngularEnabled(false);
  });

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display home page', () => {
    page.navigateTo();
    expect(page.getHomePageTitle()).toEqual('How do you want to create your form?');
  });

  describe('Form level fields', () => {
    beforeAll(() => {
      page.navigateTo();
      page.continueButton.click();
    });

    it('should move to form level fields', () => {
      expect(page.getFormlevelPageTitle()).toEqual('Enter basic information about the form.');
    });

    it('should hide/display code field', () => {
      page.useCodeYes.click();
      expect(page.codeCode.isDisplayed()).toBeTruthy();
      page.useCodeNo.click();
      expect(page.codeCode.isPresent()).toBeFalsy();
    });

    describe('item level fields', () => {
      beforeAll(() => {
        page.navigateTo();
        page.continueButton.click();
        page.bottomCreateQuestionsButton.click();
      });

      it('should display item editor page', () => {
        expect(page.firstTreeNode.isDisplayed()).toBeTruthy();
        page.useCodeNo.click();
        expect(page.codeCode.isPresent()).toBeFalsy();
      });

      it('should add a new item', () => {
        page.addItemButton.click();
        expect(page.lastTreeNode.all(by.css('span')).last().getText()).toEqual('New item 1');
      });
    });
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
