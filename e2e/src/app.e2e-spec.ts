import { AppPage } from './app.po';
import {browser, by, element, logging} from 'protractor';
import {ElementFinder} from 'protractor/built/element';
import {protractor} from 'protractor/built/ptor';
const page = new AppPage();

describe('formbuilder-lhcforms App', () => {

  beforeAll(() => {
    browser.waitForAngularEnabled(false);
  });

  beforeEach(() => {
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

      beforeEach(() => {
        // page.cleanUpTree();
      });
      it('should display item editor page', () => {
        expect(page.firstTreeNode.isDisplayed()).toBeTruthy();
        page.useCodeNo.click();
        expect(page.codeCode.isPresent()).toBeFalsy();
      });

      it('should add a new item', () => {
        browser.actions().mouseMove(page.addItemButton).perform();
        page.addItemButton.click();
        expect(page.lastTreeNode.all(by.css('span')).last().getText()).toEqual('New item 1');
        page.deleteItemButton.click();
      });

      it('should display units', async () => {
        page.type.click();
        page.typeString.click();
        expect(page.units.isPresent()).toBeFalsy();
        page.typeQuantity.click();
        expect(page.units.isDisplayed()).toBeTruthy();
        expect(page.unitsSearchResults.isDisplayed()).toBeFalsy();
        page.units.click();
        page.units.sendKeys('inch');
        // browser.wait(element.all(by.css('#completionOptions tr')).first().isDisplayed(), 2000);
        browser.sleep(1000);
        ['[in_i]', '[in_br]'].forEach((units) => {
          const unitsEl = element.all(by.cssContainingText('#completionOptions tr', units)).first();
          unitsEl.click();
          expect(element(by.cssContainingText('span.autocomp_selected li', units)).isDisplayed()).toBeTruthy();
        });
        const qJson: any = await page.questionnaireJSON();
        expect(qJson.item[0].type).toEqual('quantity');
        expect(qJson.item[0].extension[0].url).toEqual('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[0].valueCoding.system).toEqual('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[0].valueCoding.code).toEqual('[in_i]');
        expect(qJson.item[0].extension[0].valueCoding.display).toEqual('inch');
        expect(qJson.item[0].extension[1].url).toEqual('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
        expect(qJson.item[0].extension[1].valueCoding.system).toEqual('http://unitsofmeasure.org');
        expect(qJson.item[0].extension[1].valueCoding.code).toEqual('[in_br]');
        expect(qJson.item[0].extension[1].valueCoding.display).toEqual('inch - British');
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
