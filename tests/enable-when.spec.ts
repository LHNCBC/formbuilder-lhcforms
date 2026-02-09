import {test, expect, Locator, Page} from '@playwright/test';
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

test.describe('enableWhen answerCoding', async () => {
  let mainPO: MainPO;

  /**
   * Helper function to test enableWhen answer coding selection
   * Adds a new item with an enableWhen condition and verifies that the
   * selected answer coding is correctly reflected in the Questionnaire JSON.
   *
   * @param page - Browser page
   * @param treeNodeName - Name of the tree node to add the item under
   * @param itemIndex - Index of the source item used in the enableWhen condition
   * @param expectedQuestion - Expected question linkId in the generated JSON
   * @param optionIndex - Index of the answerCoding option to select
   * @param expectedAnswerCoding - Expected answerCoding object in the JSON output
   */
  async function testEnableWhenAnswerSelection(
    page: Page,
    treeNodeName: string,
    itemIndex: number,
    expectedQuestion: string,
    optionIndex: number,
    expectedAnswerCoding: { system?: string; code?: string; display?: string }
  ) {
    await PWUtils.clickTreeNode(page, treeNodeName);
    await page.getByRole('button', { name: 'Add new item', exact: true }).click();
    await page.getByRole('button', { name: 'Advanced fields' }).click();

    await page.getByRole('radiogroup', { name: 'Conditional method' })
      .getByText('enableWhen condition and behavior')
      .click();

    const parentEl = page.locator('lfb-enable-when');

    // Click the input and select the item
    await parentEl.getByRole('combobox').click();
    await page.locator('ngb-typeahead-window button').nth(itemIndex).click();

    // Select operator
    await page.locator('select[id^="enableWhen.0.operator_"]').selectOption('=');

    // Select answer coding
    const answerCoding = page.locator('input[id^="enableWhen.0.answerCoding_"]');
    await answerCoding.click();
    for (let i = 0; i < optionIndex; i++) {
      await answerCoding.press('ArrowDown');
    }
    await answerCoding.press('Enter');

    // Get and verify the JSON
    const qJson = await PWUtils.getQuestionnaireJSON(page, 'R4');
    const enableWhenJson = qJson.item[itemIndex + 1].enableWhen;

    expect(enableWhenJson).toBeDefined();
    expect(enableWhenJson).toHaveLength(1);
    expect(enableWhenJson[0].question).toEqual(expectedQuestion);
    expect(enableWhenJson[0].operator).toEqual('=');
    expect(enableWhenJson[0].answerCoding).toBeDefined();
    expect(enableWhenJson[0].answerCoding).toEqual(expectedAnswerCoding);
  }


  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();
    await PWUtils.uploadFile(page, './fixtures/enable-when-answer-coding-sample.json', true);
    await page.getByRole('button', { name: 'Edit questions' }).last().click();
  });

  test('should select enableWhen answer from answer options', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with answer options',
      0,
      '258551383902',
      1,
      {
        system: "http://snomed.info/sct",
        code: "47078008",
        display: "Hearing"
      }
    );
  });

  test('should select enableWhen answer from answer options with missing system', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with missing system answer options',
      1,
      '258551383903',
      1,
      {
        code: "47078008",
        display: "Hearing"
      }
    );
  });

  test('should select enableWhen answer from answer options with missing display', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with missing display answer options',
      2,
      '258551383904',
      1,
      {
        system: "http://snomed.info/sct",
        code: "47078008"
      }
    );
  });

  test('should select enableWhen answer from answer options with missing code', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with missing code answer options',
      3,
      '258551383905',
      1,
      {
        system: "http://snomed.info/sct",
        display: "Hearing"
      }
    );
  });

  test('should select enableWhen answer from answer options with just display', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with just display answer options',
      4,
      '258551383906',
      1,
      {
        display: "Hearing"
      }
    );
  });

  test('should select enableWhen answer from answer options with just code', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with just code answer options',
      5,
      '258551383907',
      1,
      {
        code: "47078008"
      }
    );
  });

  test('should select enableWhen answer from answer options with duplicate code 1', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with duplicate code answer options',
      6,
      '258551383908',
      1,
      {
        "system": "http://snomed.info/sct",
        "code": "47078008",
        "display": "Hearing"
      }
    );
  });

  test('should select enableWhen answer from answer options with duplicate code 2', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with duplicate code answer options',
      6,
      '258551383908',
      3,
      {
        "system": "http://abcd.info/sct",
        "code": "47078008",
        "display": "No pain"
      }
    );
  });

  test('should select enableWhen answer from answer options with duplicate code 1 and missing display', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with duplicate code and missing display answer options',
      7,
      '258551383909',
      1,
      {
        "system": "http://snomed.info/sct",
        "code": "47078008"
      }
    );
  });

  test('should select enableWhen answer from answer options with duplicate code 2 and missing display', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with duplicate code and missing display answer options',
      7,
      '258551383909',
      3,
      {
        "system": "http://abcd.info/sct",
        "code": "47078008"
      }
    );
  });

  test('should select enableWhen answer from answer options with duplicate display 1 and missing code', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with duplicate display and missing code answer options',
      8,
      '258551383910',
      1,
      {
        "system": "http://snomed.info/sct",
        "display": "No pain"
      }
    );
  });

  test('should select enableWhen answer from answer options with duplicate display 2 and missing code', async ({ page }) => {
    await testEnableWhenAnswerSelection(
      page,
      'Item with duplicate display and missing code answer options',
      8,
      '258551383910',
      3,
      {
        "system": "http://abcd.info/sct",
        "display": "No pain"
      }
    );
  });

  test('should select enableWhen answer from answer options with just display and contain duplicate', async ({ page }) => {
    // The duplicate answer options is on the 1st and the 3rd
    await testEnableWhenAnswerSelection(
      page,
      'Item with just display and contains duplicate answer options',
      9,
      '258551383911',
      1,
      {
        "display": "Hearing"
      }
    );

    // Select answer coding
    const answerCoding = page.locator('input[id^="enableWhen.0.answerCoding_"]');
    await answerCoding.click();

    // Wait for the dropdown to appear and verify it has 2 items
    const initialValues = await page.locator('#completionOptions > ul > li');
    await expect(initialValues).toHaveCount(2);
  });

  test('should select enableWhen answer from answer options with just code and contain duplicate', async ({ page }) => {
    // The duplicate answer options is on the 1st and the 3rd
    await testEnableWhenAnswerSelection(
      page,
      'Item with just code and contains duplicate answer options',
      10,
      '258551383912',
      1,
      {
        "code": "47078008"
      }
    );

    // Select answer coding
    const answerCoding = page.locator('input[id^="enableWhen.0.answerCoding_"]');
    await answerCoding.click();

    // Wait for the dropdown to appear and verify it has 2 items
    const initialValues = await page.locator('#completionOptions > ul > li');
    await expect(initialValues).toHaveCount(2);
  });

  test('should load and display enableWhen answer coding', async ({ page }) => {
    await PWUtils.clickTreeNode(page, "enableWhen answer coding");
    // Expand the Advanced fields section.
    await PWUtils.expandAdvancedFields(page);
    await expect(page.locator('input[id^="enableWhen.0.question"]')).toHaveValue("1 - Item with answer options");
    await expect(page.locator('select[id^="enableWhen.0.operator_"]')).toHaveValue("2: =");
    await expect(page.locator('input[id^="enableWhen.0.answerCoding_"]')).toHaveValue("Hearing (47078008 : http://snomed.info/sct)");

    await PWUtils.clickTreeNode(page, "enableWhen missing system answer coding");
    await expect(page.locator('input[id^="enableWhen.0.question"]')).toHaveValue("2 - Item with missing system answer options");
    await expect(page.locator('select[id^="enableWhen.0.operator_"]')).toHaveValue("2: =");
    await expect(page.locator('input[id^="enableWhen.0.answerCoding_"]')).toHaveValue("Hearing (47078008)");

    await PWUtils.clickTreeNode(page, "enableWhen missing display answer coding");
    await expect(page.locator('input[id^="enableWhen.0.question"]')).toHaveValue("3 - Item with missing display answer options");
    await expect(page.locator('select[id^="enableWhen.0.operator_"]')).toHaveValue("2: =");
    await expect(page.locator('input[id^="enableWhen.0.answerCoding_"]')).toHaveValue("(47078008 : http://snomed.info/sct)");

    await PWUtils.clickTreeNode(page, "enableWhen missing code answer coding");
    await expect(page.locator('input[id^="enableWhen.0.question"]')).toHaveValue("4 - Item with missing code answer options");
    await expect(page.locator('select[id^="enableWhen.0.operator_"]')).toHaveValue("2: =");
    await expect(page.locator('input[id^="enableWhen.0.answerCoding_"]')).toHaveValue("Hearing (http://snomed.info/sct)");

    await PWUtils.clickTreeNode(page, "enableWhen missing system and code answer coding");
    await expect(page.locator('input[id^="enableWhen.0.question"]')).toHaveValue("5 - Item with just display answer options");
    await expect(page.locator('select[id^="enableWhen.0.operator_"]')).toHaveValue("2: =");
    await expect(page.locator('input[id^="enableWhen.0.answerCoding_"]')).toHaveValue("Hearing");

    await PWUtils.clickTreeNode(page, "enableWhen missing system and display answer coding");
    await expect(page.locator('input[id^="enableWhen.0.question"]')).toHaveValue("6 - Item with just code answer options");
    await expect(page.locator('select[id^="enableWhen.0.operator_"]')).toHaveValue("2: =");
    await expect(page.locator('input[id^="enableWhen.0.answerCoding_"]')).toHaveValue("(47078008)");
  });
});
