import { test, expect, Page } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

const MIN_OCCURS_EXT_URL = 'http://hl7.org/fhir/StructureDefinition/questionnaire-minOccurs';
const MAX_OCCURS_EXT_URL = 'http://hl7.org/fhir/StructureDefinition/questionnaire-maxOccurs';

/**
 * Helper to get the Min input inside the min-max-occurs widget.
 */
const getMinInput = (page: Page) =>
  page.locator('[id^="minOccursLabel_"]').locator('..').locator('input');

/**
 * Helper to get the Max input inside the min-max-occurs widget.
 */
const getMaxInput = (page: Page) =>
  page.locator('[id^="maxOccursLabel_"]').locator('..').locator('input');

/**
 * Helper to get the validation warning alert.
 */
const getValidationAlert = (page: Page) =>
  page.locator('lfb-min-max-occurs .alert-warning');

test.describe('Min/Max Occurs', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    mainPO = new MainPO(page);
    await page.goto('/');
    await mainPO.loadHomePage();
  });

  test.describe('Visibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('input[type="radio"][value="scratch"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Create questions').click();

      const itemTextField = await PWUtils.getItemTextField(page);
      await expect(itemTextField).toHaveValue('Item 0', { timeout: 10000 });
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
    });

    test('should not show min/max occurs when repeats is not Yes', async ({ page }) => {
      // By default repeats is Unspecified, min/max occurs should not be visible
      await expect(getMinInput(page)).toHaveCount(0);
      await expect(getMaxInput(page)).toHaveCount(0);
    });

    test('should show min/max occurs when repeats is Yes', async ({ page }) => {
      await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'Yes');

      await expect(getMinInput(page)).toBeVisible();
      await expect(getMaxInput(page)).toBeVisible();
    });

    test('should hide min/max occurs when repeats is changed back to No', async ({ page }) => {
      await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'Yes');
      await expect(getMinInput(page)).toBeVisible();

      await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'No');
      await expect(getMinInput(page)).toHaveCount(0);
      await expect(getMaxInput(page)).toHaveCount(0);
    });
  });

  test.describe('Setting values', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('input[type="radio"][value="scratch"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Create questions').click();

      const itemTextField = await PWUtils.getItemTextField(page);
      await expect(itemTextField).toHaveValue('Item 0', { timeout: 10000 });
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });

      await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'Yes');
      await expect(getMinInput(page)).toBeVisible();
    });

    test('should set minOccurs extension in questionnaire JSON', async ({ page }) => {
      const minInput = getMinInput(page);
      await minInput.fill('2');
      await minInput.dispatchEvent('change');

      await PWUtils.assertExtensionsInQuestionnaire(
        page, '/item/0/extension', MIN_OCCURS_EXT_URL,
        [{ url: MIN_OCCURS_EXT_URL, valueInteger: 2 }]
      );
    });

    test('should set maxOccurs extension in questionnaire JSON', async ({ page }) => {
      const maxInput = getMaxInput(page);
      await maxInput.fill('10');
      await maxInput.dispatchEvent('change');

      await PWUtils.assertExtensionsInQuestionnaire(
        page, '/item/0/extension', MAX_OCCURS_EXT_URL,
        [{ url: MAX_OCCURS_EXT_URL, valueInteger: 10 }]
      );
    });

    test('should set both minOccurs and maxOccurs extensions', async ({ page }) => {
      const minInput = getMinInput(page);
      const maxInput = getMaxInput(page);

      await minInput.fill('1');
      await minInput.dispatchEvent('change');
      await maxInput.fill('5');
      await maxInput.dispatchEvent('change');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page);
      const extensions = qJson.item[0].extension || [];
      const minExt = extensions.find((e: any) => e.url === MIN_OCCURS_EXT_URL);
      const maxExt = extensions.find((e: any) => e.url === MAX_OCCURS_EXT_URL);

      expect(minExt).toEqual({ url: MIN_OCCURS_EXT_URL, valueInteger: 1 });
      expect(maxExt).toEqual({ url: MAX_OCCURS_EXT_URL, valueInteger: 5 });
    });

    test('should remove extension when value is cleared', async ({ page }) => {
      const minInput = getMinInput(page);

      await minInput.fill('3');
      await minInput.dispatchEvent('change');

      await PWUtils.assertExtensionsInQuestionnaire(
        page, '/item/0/extension', MIN_OCCURS_EXT_URL,
        [{ url: MIN_OCCURS_EXT_URL, valueInteger: 3 }]
      );

      await minInput.clear();
      await minInput.dispatchEvent('change');

      await PWUtils.assertExtensionsInQuestionnaire(
        page, '/item/0/extension', MIN_OCCURS_EXT_URL,
        []
      );
    });
  });

  test.describe('Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('input[type="radio"][value="scratch"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Create questions').click();

      const itemTextField = await PWUtils.getItemTextField(page);
      await expect(itemTextField).toHaveValue('Item 0', { timeout: 10000 });
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });

      await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'Yes');
      await expect(getMinInput(page)).toBeVisible();
    });

    test('should show warning when min > max', async ({ page }) => {
      const minInput = getMinInput(page);
      const maxInput = getMaxInput(page);

      await maxInput.fill('3');
      await maxInput.dispatchEvent('change');
      await minInput.fill('5');
      await minInput.dispatchEvent('change');

      await expect(getValidationAlert(page)).toBeVisible();
      await expect(getValidationAlert(page)).toContainText('Min occurs must be ≤ Max occurs');
    });

    test('should clear warning when min <= max', async ({ page }) => {
      const minInput = getMinInput(page);
      const maxInput = getMaxInput(page);

      await maxInput.fill('3');
      await maxInput.dispatchEvent('change');
      await minInput.fill('5');
      await minInput.dispatchEvent('change');

      await expect(getValidationAlert(page)).toBeVisible();

      await minInput.clear();
      await minInput.fill('2');
      await minInput.dispatchEvent('change');

      await expect(getValidationAlert(page)).toHaveCount(0);
    });

    test('should show warning when min is negative', async ({ page }) => {
      const minInput = getMinInput(page);
      await minInput.fill('-1');
      await minInput.dispatchEvent('change');

      await expect(getValidationAlert(page)).toBeVisible();
      await expect(getValidationAlert(page)).toContainText('Min occurs must be ≥ 0');
    });

    test('should show warning when max is less than 1', async ({ page }) => {
      const maxInput = getMaxInput(page);
      await maxInput.fill('0');
      await maxInput.dispatchEvent('change');

      await expect(getValidationAlert(page)).toBeVisible();
      await expect(getValidationAlert(page)).toContainText('Max occurs must be ≥ 1');
    });
  });

  test.describe('Import questionnaire with minOccurs/maxOccurs', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('input[type="radio"][value="scratch"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await PWUtils.uploadFile(page, 'min-max-occurs-sample.json', false);
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
    });

    test('should load and display existing minOccurs and maxOccurs values', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'Repeating with both');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });

      const minInput = getMinInput(page);
      const maxInput = getMaxInput(page);

      await expect(minInput).toBeVisible();
      await expect(minInput).toHaveValue('2');
      await expect(maxInput).toHaveValue('5');
    });

    test('should not show min/max occurs for non-repeating imported item', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'Non-repeating question');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });

      await expect(getMinInput(page)).toHaveCount(0);
      await expect(getMaxInput(page)).toHaveCount(0);
    });

    test('should preserve minOccurs/maxOccurs in round-trip export', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'Repeating with both');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page);
      const extensions = qJson.item[0].extension || [];
      const minExt = extensions.find((e: any) => e.url === MIN_OCCURS_EXT_URL);
      const maxExt = extensions.find((e: any) => e.url === MAX_OCCURS_EXT_URL);

      expect(minExt).toEqual({ url: MIN_OCCURS_EXT_URL, valueInteger: 2 });
      expect(maxExt).toEqual({ url: MAX_OCCURS_EXT_URL, valueInteger: 5 });
    });

    test('should display min-only item correctly', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'Repeating min only');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });

      await expect(getMinInput(page)).toHaveValue('1');
      await expect(getMaxInput(page)).toHaveValue('');
    });

    test('should display max-only item correctly', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'Repeating max only');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });

      await expect(getMinInput(page)).toHaveValue('');
      await expect(getMaxInput(page)).toHaveValue('10');
    });

    test('should show empty inputs for repeating item with no occurs extensions', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'Repeating no occurs');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });

      await expect(getMinInput(page)).toBeVisible();
      await expect(getMinInput(page)).toHaveValue('');
      await expect(getMaxInput(page)).toHaveValue('');
    });
  });

  test.describe('Switching between nodes', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('input[type="radio"][value="scratch"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await PWUtils.uploadFile(page, 'min-max-occurs-sample.json', false);
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
    });

    test('should update UI when switching from both-occurs to min-only item', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'Repeating with both');
      await expect(getMinInput(page)).toHaveValue('2');
      await expect(getMaxInput(page)).toHaveValue('5');

      await PWUtils.clickTreeNode(page, 'Repeating min only');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
      await expect(getMinInput(page)).toHaveValue('1');
      await expect(getMaxInput(page)).toHaveValue('');
    });

    test('should update UI when switching from repeating to non-repeating item', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'Repeating with both');
      await expect(getMinInput(page)).toBeVisible();

      await PWUtils.clickTreeNode(page, 'Non-repeating question');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
      await expect(getMinInput(page)).toHaveCount(0);
      await expect(getMaxInput(page)).toHaveCount(0);
    });

    test('should update UI when switching from non-repeating to repeating item', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'Non-repeating question');
      await expect(getMinInput(page)).toHaveCount(0);

      await PWUtils.clickTreeNode(page, 'Repeating max only');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
      await expect(getMinInput(page)).toHaveValue('');
      await expect(getMaxInput(page)).toHaveValue('10');
    });

    test('should update UI when switching from max-only to no-occurs item', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'Repeating max only');
      await expect(getMaxInput(page)).toHaveValue('10');

      await PWUtils.clickTreeNode(page, 'Repeating no occurs');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
      await expect(getMinInput(page)).toHaveValue('');
      await expect(getMaxInput(page)).toHaveValue('');
    });

    test('should not corrupt other items when editing one item', async ({ page }) => {
      // Edit the no-occurs item to add min=3, max=7
      await PWUtils.clickTreeNode(page, 'Repeating no occurs');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });

      const minInput = getMinInput(page);
      const maxInput = getMaxInput(page);
      await minInput.fill('3');
      await minInput.dispatchEvent('change');
      await maxInput.fill('7');
      await maxInput.dispatchEvent('change');

      // Switch to another item and back
      await PWUtils.clickTreeNode(page, 'Repeating with both');
      await expect(getMinInput(page)).toHaveValue('2');
      await expect(getMaxInput(page)).toHaveValue('5');

      await PWUtils.clickTreeNode(page, 'Repeating min only');
      await expect(getMinInput(page)).toHaveValue('1');
      await expect(getMaxInput(page)).toHaveValue('');

      // Verify full questionnaire JSON is correct
      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page);

      // q1: both (2, 5)
      const q1Exts = qJson.item[0].extension || [];
      expect(q1Exts.find((e: any) => e.url === MIN_OCCURS_EXT_URL)).toEqual({ url: MIN_OCCURS_EXT_URL, valueInteger: 2 });
      expect(q1Exts.find((e: any) => e.url === MAX_OCCURS_EXT_URL)).toEqual({ url: MAX_OCCURS_EXT_URL, valueInteger: 5 });

      // q2: non-repeating, no extensions
      expect(qJson.item[1].extension).toBeUndefined();

      // q3: min only (1)
      const q3Exts = qJson.item[2].extension || [];
      expect(q3Exts.find((e: any) => e.url === MIN_OCCURS_EXT_URL)).toEqual({ url: MIN_OCCURS_EXT_URL, valueInteger: 1 });
      expect(q3Exts.find((e: any) => e.url === MAX_OCCURS_EXT_URL)).toBeUndefined();

      // q4: max only (10)
      const q4Exts = qJson.item[3].extension || [];
      expect(q4Exts.find((e: any) => e.url === MIN_OCCURS_EXT_URL)).toBeUndefined();
      expect(q4Exts.find((e: any) => e.url === MAX_OCCURS_EXT_URL)).toEqual({ url: MAX_OCCURS_EXT_URL, valueInteger: 10 });

      // q5: edited to (3, 7)
      const q5Exts = qJson.item[4].extension || [];
      expect(q5Exts.find((e: any) => e.url === MIN_OCCURS_EXT_URL)).toEqual({ url: MIN_OCCURS_EXT_URL, valueInteger: 3 });
      expect(q5Exts.find((e: any) => e.url === MAX_OCCURS_EXT_URL)).toEqual({ url: MAX_OCCURS_EXT_URL, valueInteger: 7 });
    });

    test('should not leak values between items when switching rapidly', async ({ page }) => {
      // Rapid switching between all items
      await PWUtils.clickTreeNode(page, 'Repeating with both');
      await PWUtils.clickTreeNode(page, 'Non-repeating question');
      await PWUtils.clickTreeNode(page, 'Repeating min only');
      await PWUtils.clickTreeNode(page, 'Repeating max only');
      await PWUtils.clickTreeNode(page, 'Repeating no occurs');

      // Go back to first item and verify values are intact
      await PWUtils.clickTreeNode(page, 'Repeating with both');
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
      await expect(getMinInput(page)).toHaveValue('2');
      await expect(getMaxInput(page)).toHaveValue('5');

      // Verify JSON integrity
      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page);
      const q1Exts = qJson.item[0].extension || [];
      expect(q1Exts.find((e: any) => e.url === MIN_OCCURS_EXT_URL)).toEqual({ url: MIN_OCCURS_EXT_URL, valueInteger: 2 });
      expect(q1Exts.find((e: any) => e.url === MAX_OCCURS_EXT_URL)).toEqual({ url: MAX_OCCURS_EXT_URL, valueInteger: 5 });
    });
  });
});
