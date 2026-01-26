import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

test.describe('answerOptions', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();
    await PWUtils.uploadFile(page, './fixtures/answer-option-sample.json', true);
    await page.getByRole('button', { name: 'Edit questions' }).last().click();
  });


  test('should display answer options', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Item with answer options');
    await expect(page.getByLabel('Data type', { exact: true })).toHaveValue(/coding/);
    await expect(page.getByRole('radiogroup', { name: 'Create answer list' }).getByText('Yes')).toBeChecked();
    await expect(page.getByRole('radiogroup', { name: 'Answer list source' }).getByText('Answer options')).toBeChecked();

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await expect(page.locator('[id^="answerOption.0.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
    await expect(page.locator('[id^="answerOption.0.valueCoding.display"]')).toHaveValue('Hearing');
    await expect(page.locator('[id^="answerOption.0.valueCoding.code"]')).toHaveValue('47078008');

    await expect(page.locator('[id^="answerOption.1.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
    await expect(page.locator('[id^="answerOption.1.valueCoding.display"]')).toHaveValue('Entire hip joint');
    await expect(page.locator('[id^="answerOption.1.valueCoding.code"]')).toHaveValue('182201002');

    await expect(page.locator('[id^="answerOption.2.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
    await expect(page.locator('[id^="answerOption.2.valueCoding.display"]')).toHaveValue('No pain');
    await expect(page.locator('[id^="answerOption.2.valueCoding.code"]')).toHaveValue('81765008');
  });

  test('should display missing system answer options', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Item with missing system answer options');
    await expect(page.getByLabel('Data type', { exact: true })).toHaveValue(/coding/);
    await expect(page.getByRole('radiogroup', { name: 'Create answer list' }).getByText('Yes')).toBeChecked();
    await expect(page.getByRole('radiogroup', { name: 'Answer list source' }).getByText('Answer options')).toBeChecked();

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await expect(page.locator('[id^="answerOption.0.valueCoding.system"]')).toBeEmpty();
    await expect(page.locator('[id^="answerOption.0.valueCoding.display"]')).toHaveValue('Hearing');
    await expect(page.locator('[id^="answerOption.0.valueCoding.code"]')).toHaveValue('47078008');

    await expect(page.locator('[id^="answerOption.1.valueCoding.system"]')).toBeEmpty();
    await expect(page.locator('[id^="answerOption.1.valueCoding.display"]')).toHaveValue('Entire hip joint');
    await expect(page.locator('[id^="answerOption.1.valueCoding.code"]')).toHaveValue('182201002');

    await expect(page.locator('[id^="answerOption.2.valueCoding.system"]')).toBeEmpty();
    await expect(page.locator('[id^="answerOption.2.valueCoding.display"]')).toHaveValue('No pain');
    await expect(page.locator('[id^="answerOption.2.valueCoding.code"]')).toHaveValue('81765008');
  });

  test('should display missing display answer options', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Item with missing display answer options');
    await expect(page.getByLabel('Data type', { exact: true })).toHaveValue(/coding/);
    await expect(page.getByRole('radiogroup', { name: 'Create answer list' }).getByText('Yes')).toBeChecked();
    await expect(page.getByRole('radiogroup', { name: 'Answer list source' }).getByText('Answer options')).toBeChecked();

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await expect(page.locator('[id^="answerOption.0.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
    await expect(page.locator('[id^="answerOption.0.valueCoding.display"]')).toBeEmpty();
    await expect(page.locator('[id^="answerOption.0.valueCoding.code"]')).toHaveValue('47078008');

    await expect(page.locator('[id^="answerOption.1.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
    await expect(page.locator('[id^="answerOption.1.valueCoding.display"]')).toBeEmpty();
    await expect(page.locator('[id^="answerOption.1.valueCoding.code"]')).toHaveValue('182201002');

    await expect(page.locator('[id^="answerOption.2.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
    await expect(page.locator('[id^="answerOption.2.valueCoding.display"]')).toBeEmpty();
    await expect(page.locator('[id^="answerOption.2.valueCoding.code"]')).toHaveValue('81765008');
  });

  test('should display missing code answer options', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Item with missing code answer options');
    await expect(page.getByLabel('Data type', { exact: true })).toHaveValue(/coding/);
    await expect(page.getByRole('radiogroup', { name: 'Create answer list' }).getByText('Yes')).toBeChecked();
    await expect(page.getByRole('radiogroup', { name: 'Answer list source' }).getByText('Answer options')).toBeChecked();

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await expect(page.locator('[id^="answerOption.0.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
    await expect(page.locator('[id^="answerOption.0.valueCoding.display"]')).toHaveValue('Hearing');
    await expect(page.locator('[id^="answerOption.0.valueCoding.code"]')).toBeEmpty();

    await expect(page.locator('[id^="answerOption.1.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
    await expect(page.locator('[id^="answerOption.1.valueCoding.display"]')).toHaveValue('Entire hip joint');
    await expect(page.locator('[id^="answerOption.1.valueCoding.code"]')).toBeEmpty();

    await expect(page.locator('[id^="answerOption.2.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
    await expect(page.locator('[id^="answerOption.2.valueCoding.display"]')).toHaveValue('No pain');
    await expect(page.locator('[id^="answerOption.2.valueCoding.code"]')).toBeEmpty();
  });
});