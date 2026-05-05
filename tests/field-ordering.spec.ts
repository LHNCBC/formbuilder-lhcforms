import { test, expect } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

/**
 * Test suite for FHIR Field Ordering
 *
 * Verifies that exported Questionnaire JSON maintains canonical FHIR field order
 * across different FHIR versions (R5, R4, STU3).
 */
test.describe('FHIR Field Ordering', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    mainPO = new MainPO(page);
    await mainPO.mockSnomedEditions();
    await page.goto('/');
    await mainPO.loadHomePage();
    await page.locator('input[type="radio"][value="existing"]').click();
    await page.locator('input[type="radio"][value="local"]').click();
  });

  /**
   * Helper function to verify key order matches expected order.
   * Asserts that each expected key appears at the corresponding index in actualKeys.
   */
  function verifyKeyOrder(actualKeys: string[], expectedOrder: string[]): void {
    expectedOrder.forEach((key, index) => {
      expect(actualKeys[index]).toBe(key);
    });
  }

  test('should export Questionnaire with correct root field order (R5)', async ({ page }) => {
    await PWUtils.importLocalFile(page, 'answer-option-sample-2.json');
    await expect(mainPO.titleLocator).toHaveValue('Answer options form');
    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    const rootKeys = Object.keys(q);
    expect(rootKeys[0]).toBe('resourceType');
    expect(rootKeys[rootKeys.length - 1]).toBe('item');
    const statusIndex = rootKeys.indexOf('status');
    const titleIndex = rootKeys.indexOf('title');
    if (titleIndex >= 0 && statusIndex >= 0) {
      expect(titleIndex).toBeLessThan(statusIndex);
    }
  });

  test('should export items with correct field order (R5)', async ({ page }) => {
    await PWUtils.importLocalFile(page, 'answer-option-sample-2.json');
    await expect(mainPO.titleLocator).toHaveValue('Answer options form');
    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item).toBeDefined();
    expect(q.item.length).toBeGreaterThan(0);
    const itemKeys = Object.keys(q.item[0]);
    const linkIdIndex = itemKeys.indexOf('linkId');
    const textIndex = itemKeys.indexOf('text');
    const typeIndex = itemKeys.indexOf('type');
    expect(linkIdIndex).toBeGreaterThanOrEqual(0);
    expect(linkIdIndex).toBeLessThan(textIndex);
    expect(textIndex).toBeLessThan(typeIndex);
  });

  test('should preserve field order after R4 conversion', async ({ page }) => {
    await PWUtils.importLocalFile(page, 'answer-option-sample-2.json');
    await expect(mainPO.titleLocator).toHaveValue('Answer options form');
    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    const rootKeys = Object.keys(q);
    expect(rootKeys[0]).toBe('resourceType');
    const statusIndex = rootKeys.indexOf('status');
    const itemIndex = rootKeys.indexOf('item');
    expect(statusIndex).toBeGreaterThan(0);
    expect(itemIndex).toBeGreaterThan(statusIndex);
  });

  test('should preserve field order after STU3 conversion', async ({ page }) => {
    await PWUtils.importLocalFile(page, 'answer-option-sample-2.json');
    await expect(mainPO.titleLocator).toHaveValue('Answer options form');
    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'STU3');
    const rootKeys = Object.keys(q);
    expect(rootKeys[0]).toBe('resourceType');
    const statusIndex = rootKeys.indexOf('status');
    const itemIndex = rootKeys.indexOf('item');
    expect(statusIndex).toBeGreaterThan(0);
    expect(itemIndex).toBeGreaterThan(statusIndex);
  });

  test('should order enableWhen fields correctly', async ({ page }) => {
    await PWUtils.importLocalFile(page, 'enable-when-answer-coding-sample.json');
    await expect(mainPO.titleLocator).not.toBeEmpty();
    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    const items = q.item || [];
    const itemWithEnableWhen = items.find((item: any) => item.enableWhen);
    expect(itemWithEnableWhen).toBeDefined();
    const ewKeys = Object.keys(itemWithEnableWhen.enableWhen[0]);
    const questionIndex = ewKeys.indexOf('question');
    const operatorIndex = ewKeys.indexOf('operator');
    expect(questionIndex).toBeGreaterThanOrEqual(0);
    expect(questionIndex).toBeLessThan(operatorIndex);
  });

  test('should order answerOption fields correctly', async ({ page }) => {
    await PWUtils.importLocalFile(page, 'answer-option-sample-2.json');
    await expect(mainPO.titleLocator).toHaveValue('Answer options form');
    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    const items = q.item || [];
    const itemWithOptions = items.find((item: any) => item.answerOption);
    expect(itemWithOptions).toBeDefined();
    const aoKeys = Object.keys(itemWithOptions.answerOption[0]);
    const valueCodingIndex = aoKeys.indexOf('valueCoding');
    expect(valueCodingIndex).toBeGreaterThanOrEqual(0);
    const initialSelectedIndex = aoKeys.indexOf('initialSelected');
    if (initialSelectedIndex >= 0) {
      expect(valueCodingIndex).toBeLessThan(initialSelectedIndex);
    }
  });

  test('should order nested items recursively', async ({ page }) => {
    await PWUtils.importLocalFile(page, 'group-display-type-sample.json');
    await expect(mainPO.titleLocator).not.toBeEmpty();
    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item).toBeDefined();
    const groupItem = q.item.find((item: any) => item.type === 'group' && item.item);
    if (groupItem) {
      const nestedItem = groupItem.item[0];
      const nestedKeys = Object.keys(nestedItem);
      const linkIdIndex = nestedKeys.indexOf('linkId');
      const typeIndex = nestedKeys.indexOf('type');
      expect(linkIdIndex).toBeGreaterThanOrEqual(0);
      expect(linkIdIndex).toBeLessThan(typeIndex);
    }
  });
});
