import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

test.describe('item-level fields', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
  });

  test('should import help text item from file and localstorage', async ({page, browser}) => {
    const newHelpText = 'testing help text from localstorage';
    const helpTextInputEl = page.getByLabel('Help text', {exact: true});
    const helpString = /^A <b>plain<\/b> text instruction/;
    await PWUtils.uploadFile(page, 'fixtures/help-text-sample1.json');
    await page.getByRole('button', {name: 'Edit questions'}).click();
    await expect(helpTextInputEl).toHaveValue(helpString);
    const qJson = await PWUtils.getQuestionnaireJSON(page, 'R4');
    expect(qJson.item[0].item[2].text).toMatch(helpString);
    expect(qJson.item[0].item[2].type).toEqual('display');
    expect(qJson.item[0].item[2].extension).toEqual(PWUtils.helpTextExtension);

    await helpTextInputEl.clear();
    await helpTextInputEl.fill(newHelpText);
    // Capture local storage to initiate next session with it.
    // Wait until debounce time (500ms) before capturing the local storage.
    await PWUtils.waitUntilLocalStorageItemIsUpdated(page, 'fhirQuestionnaire', newHelpText);
    const sState = await page.context().storageState();
    const context = await browser.newContext({storageState: sState});
    page = await context.newPage();
    await page.goto('/');
    expect(await context.storageState()).toEqual(sState);

    await page.getByLabel('Would you like to start from where you left off before?').click();
    await page.getByRole('button', {name: 'Continue'}).click();
    await expect(helpTextInputEl).toHaveValue(newHelpText);
  });
});
