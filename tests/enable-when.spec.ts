import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

test.describe('enableWhen condition and enableWhenExpression', async () => {
  let mainPO: MainPO;
  let fileJson;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();
    fileJson = await PWUtils.uploadFile(page, './fixtures/enable-when-expression-sample.json', true);
    await page.getByRole('button', { name: 'Edit questions' }).last().click();
  });

  test('should show/hide enableWhenExpression extension when switching between conditional method options', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'enableWhen expression');

    // Expand the Advanced fields section.
    await PWUtils.expandAdvancedFields(page);

    // Validate that the enableWhen expression radio button is checked.
    const enableWhenExpressionButton = await PWUtils.getRadioButton(page, 'Conditional method', 'enableWhen expression');
    await enableWhenExpressionButton.check();

    // Check the enableWhenExpression extension.
    const input = page.locator('textarea[id^="__$enableWhenExpression"]');
    await expect(input).toHaveValue('%a > 5 and %b > 5');
    let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[3].extension).toHaveLength(3);
    expect(q.item[3].extension).toEqual(fileJson.item[3].extension);

    // Select the 'enableWhen condition and behavior' option.
    const enableWhenConditionLabel = await PWUtils.getRadioButtonLabel(page, 'Conditional method', 'enableWhen condition and behavior');
    await enableWhenConditionLabel.click();

    // The enableWhenExpression extension should be hidden.
    q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[3].extension).toHaveLength(2);

    expect(q.item[3].extension[0]).toEqual(fileJson.item[3].extension[0]);
    expect(q.item[3].extension[1]).toEqual(fileJson.item[3].extension[1]);

    // Select the 'enableWhenExpression' option.
    const enableWhenExpressionLabel = await PWUtils.getRadioButtonLabel(page, 'Conditional method', 'enableWhen expression');
    await enableWhenExpressionLabel.click();

    // The enableWhenExpression extension should be visible again.
    q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[3].extension).toHaveLength(3);
    expect(q.item[3].extension).toEqual(fileJson.item[3].extension);
  });
});