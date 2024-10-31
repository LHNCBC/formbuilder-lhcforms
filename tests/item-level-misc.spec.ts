import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

test.describe('item-level fields', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.clearSession();
    await mainPO.loadFLPage();
    await page.getByLabel('Start from scratch').click();
    await page.getByRole('button', {name: 'Continue'}).click();
  });

  test('should import help text item from localstorage', async ({page, browser}) => {
    const newHelpText = 'testing help text from localstorage';
    const helpTextInputEl = page.getByLabel('Help text', {exact: true});
    await PWUtils.uploadFile(page, '../cypress/fixtures/help-text-sample.json');
    await page.getByRole('button', {name: 'Edit questions'}).click();
    await expect(helpTextInputEl).toHaveValue('testing help text from import');
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
