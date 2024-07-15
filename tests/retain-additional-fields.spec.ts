import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import path from 'path';
import fs from 'node:fs/promises';

test.describe('retain-additional-fields', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.clearSession();
    await mainPO.loadFLPage();
  });

  test('should retain contained field', async ({page}) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByLabel('Start from scratch').click();
    await page.getByRole('button', {name: 'Continue'}).click();
    await page.getByRole('button', { name: 'Import' }).click();
    await page.getByRole('button', { name: 'Import from file...' }).click();
    const testFile = path.join(__dirname, '../cypress/fixtures/contained-example.json');
    const fileJson = JSON.parse(await fs.readFile(testFile, 'utf-8'));

    // Start waiting for file chooser before clicking.
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testFile);

    await expect(page.locator('input#title')).toHaveValue('Contained example');
    await page.getByRole('button', {name: 'Preview'}).click();
    await page.getByText('View Questionnaire JSON').click();
    const json = JSON.parse(await page.locator('mat-tab-body pre').innerText());
    expect(json.contained).toEqual(fileJson.contained);
  });
});
