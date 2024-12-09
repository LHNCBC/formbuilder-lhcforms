import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

test.describe('retain-additional-fields', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.clearSession();
    await mainPO.loadHomePage();
  });

  test('should retain contained field', async ({page}) => {
    await page.getByLabel('Start from scratch').click();
    await page.getByRole('button', {name: 'Continue'}).click();
    const fileJson = await PWUtils.uploadFile(page, '../cypress/fixtures/contained-example.json');
    await expect(page.locator('input#title')).toHaveValue('Contained example');
    const json = await PWUtils.getQuestionnaireJSON(page, 'R4');
    expect(json.contained).toEqual(fileJson.contained);
  });
});
