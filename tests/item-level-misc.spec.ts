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
    await page.getByRole('button', {name: 'Create questions'}).click();
  });

  test('should show correct units when adding loinc question of a decimal type', async ({page}) => {
    await page.getByRole('button', {name: 'Add new item from LOINC'}).click();
    const dlg = page.getByRole('dialog', {name: 'Add LOINC item'});
    await expect(dlg).toBeVisible();
    await dlg.getByLabel('Question').click();
    const inputEl = dlg.getByLabel('Search for a LOINC item:');
    await inputEl.fill('body weight');
    await expect(dlg.getByRole('listbox')).toBeVisible();
    // await inputEl.fill('body weight');
    await page.keyboard.press('Enter');
    await expect(inputEl).toHaveValue('18833-4: Body weight');
    await page.getByRole('button', {name: 'Add'}).click();

    await expect(page.getByLabel('Units', {exact: true})).toHaveValue('kg');
  });
});
