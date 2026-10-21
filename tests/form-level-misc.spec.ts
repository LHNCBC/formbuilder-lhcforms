import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

test.describe('form-level fields', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
  });

  test('should edit tags', async ({page}) => {
    const tableData = [
      ['1a', '1b', '1c'],
      ['2a', '2b', '2c'],
      ['3a', '3b', '3c'],
      ['4a', '4b', '4c']
    ];
    await mainPO.page.getByRole('button', {name: 'Advanced fields'}).click();
    const tableLoc = PWUtils.getTableByFieldLabel(page.locator('lfb-form-fields'), 'Tags');
    await mainPO.loadTable(tableLoc, tableData);

    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    const inputTags = q.meta.tag.filter((e, i) => i < 4);

    expect(inputTags).toStrictEqual([{
      display: '1a',
      code: '1b',
      system: '1c'
    }, {
      display: '2a',
      code: '2b',
      system: '2c'
    }, {
      display: '3a',
      code: '3b',
      system: '3c'
    }, {
      display: '4a',
      code: '4b',
      system: '4c'
    }]);
  });

  test('should import questionnaire with tags', async ({page}) => {
    const q = await PWUtils.uploadFile(page, 'fl-tag-sample.json');
    await mainPO.page.getByRole('button', { name: 'Advanced fields' }).click();
    const rows = await PWUtils.getTableByFieldLabel(page.locator('lfb-form-fields'), 'Tags')
      .locator('tbody > tr').all();
    expect(rows.length).toBe(3);
    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    // Ignore the generated tag.
    const inputTags = qJson.meta.tag.filter((e, i) => i < 3);
    expect(inputTags).toStrictEqual(q.meta.tag);
  });
});

test.describe('home page while LForms is loading', () => {
  test('should enable Continue, and restore the autosaved form, once LForms is loaded', async ({page}) => {
    await page.goto('/');
    await new MainPO(page).loadFLPage();
    const titleField = page.locator('lfb-form-fields').getByLabel('Title', {exact: true});
    await titleField.fill('Saved before reload');
    await PWUtils.waitUntilLocalStorageItemIsUpdated(page, 'fhirQuestionnaire', 'Saved before reload');

    // Hold the LForms files, which lforms-loader fetches from .../lforms-versions/..., until released.
    let releaseLForms: () => void;
    const lformsHeld = new Promise<void>((resolve) => { releaseLForms = resolve; });
    await page.route(/\/lforms-versions\//, async (route) => {
      await lformsHeld;
      await route.continue();
    });
    await page.reload();

    const continueButton = page.getByRole('button', {name: 'Continue'});
    await page.getByLabel('Would you like to start from where you left off before?').click();
    await expect(continueButton).toBeDisabled();
    await expect(page.getByRole('status').filter({hasText: 'Loading'})).toBeVisible();

    releaseLForms();
    await expect(continueButton).toBeEnabled();
    await expect(page.getByRole('status').filter({hasText: 'Loading'})).toHaveCount(0);
    await continueButton.click();
    await expect(titleField).toHaveValue('Saved before reload');
  });
});
