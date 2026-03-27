import { test, expect, Page } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

const snomedEclText = '< 429019009 |Finding related to biological sex|';
const getTerminologyServerInput = (page: Page) => page.locator('[id="__$terminologyServer"]');

function enableWhenErrorMsg(
  itemName: string,
  linkId: string,
  optionsOrString = false,
  conditionNum = 1
): string {
  if (optionsOrString) {
    return ` The answer value does not match any answer option in the '${itemName}' (linkId: '${linkId}') or the answer constraint of type string for enableWhen condition ${conditionNum}.`;
  }
  return ` The answer value does not match any answer option in the '${itemName}' (linkId: '${linkId}') for enableWhen condition ${conditionNum}.`;
}

test.describe('enableWhen condition and behavior', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
  });

  test.describe('Item level fields: advanced', () => {
    test.beforeEach(async ({ page }) => {
      await mainPO.loadILPage();
      await PWUtils.expandAdvancedFields(page);
      await expect(getTerminologyServerInput(page)).toBeVisible();
    });

    test.afterEach(async ({ page }) => {
      await PWUtils.collapseAdvancedFields(page);
    });

    test('should support conditional display with answer coding source', async ({ page }) => {
      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

      const addAnswerButton = page.locator('button:has-text("Add another answer")');

      await PWUtils.addCodingAnswerOptions(page, addAnswerButton,
        [
          { system: 's1', display: 'd1', code: 'c1', __$score: 2.1 },
          { system: 's2', display: 'd2', code: 'c2', __$score: 3 }
        ]
      );

      await PWUtils.clickRadioButton(page, 'Value method', 'Pick initial value');

      const pickAnswer = page.locator('[id^="pick-answer"]');
      await pickAnswer.click();
      await expect(page.locator('#lhc-tools-searchResults ul > li')).toHaveCount(2);
      await pickAnswer.press('ArrowDown');
      await pickAnswer.press('Enter');
      await expect(pickAnswer).toHaveValue('d1');

      const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      const questionInput = page.locator('[id^="enableWhen.0.question"]');
      await questionInput.click();
      await questionInput.press('ArrowDown');
      await questionInput.press('Enter');

      await page.locator('[id^="enableWhen.0.operator"]').selectOption({ label: '=' });
      const answerCoding = page.locator('[id^="enableWhen.0.answerCoding"]');
      await answerCoding.fill('d1 (c1 : s1)');
      await answerCoding.press('ArrowDown');
      await answerCoding.press('Enter');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item.length).toEqual(2);
      expect(qJson.item[1].enableWhen.length).toEqual(1);
      expect(qJson.item[1].enableWhen[0].question).toEqual(qJson.item[0].linkId);
      expect(qJson.item[1].enableWhen[0].operator).toEqual('=');
      expect(qJson.item[1].enableWhen[0].answerCoding.display).toEqual(qJson.item[0].answerOption[0].valueCoding.display);
      expect(qJson.item[1].enableWhen[0].answerCoding.code).toEqual(qJson.item[0].answerOption[0].valueCoding.code);
      expect(qJson.item[1].enableWhen[0].answerCoding.system).toEqual(qJson.item[0].answerOption[0].valueCoding.system);
    });

    test('should display error message for invalid answer in conditional display', async ({ page }) => {
      const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      const errorMessageEl = 'mat-sidenav-content ul > li.text-danger.list-group-item-warning';
      const question1El = '[id^="enableWhen.0.question"]';
      const operator1El = '[id^="enableWhen.0.operator"]';
      const answer1El = '[id^="enableWhen.0.answer"]';
      const errorIcon1El = '[id^="enableWhen.0_err"]';
      const question2El = '[id^="enableWhen.1.question"]';
      const operator2El = '[id^="enableWhen.1.operator"]';
      const errorIcon2El = '[id^="enableWhen.1_err"]';

      await page.locator(question1El).click();
      await page.locator(question1El).press('ArrowDown');
      await page.locator(question1El).press('Enter');
      await expect(page.locator(errorIcon1El)).toHaveCount(0);
      await expect(page.locator(errorMessageEl)).toHaveCount(0);

      await page.locator(operator1El).selectOption({ label: '=' });
      await expect(page.locator(errorIcon1El)).toBeVisible();
      await expect(page.locator(errorMessageEl)).toHaveCount(2);
      await page.locator(operator1El).selectOption({ label: 'Empty' });
      await expect(page.locator(errorIcon1El)).toHaveCount(0);
      await expect(page.locator(errorMessageEl)).toHaveCount(0);

      await page.locator(operator1El).selectOption({ label: '>' });
      await expect(page.locator(errorIcon1El)).toBeVisible();
      await expect(page.locator(errorMessageEl)).toHaveCount(2);
      await page.locator(answer1El).fill('1');
      await expect(page.locator(errorIcon1El)).toHaveCount(0);
      await expect(page.locator(errorMessageEl)).toHaveCount(0);

      await page.locator('button:has-text("Add another condition")').click();

      await page.locator(question2El).click();
      await page.locator(question2El).press('ArrowDown');
      await page.locator(question2El).press('Enter');
      await expect(page.locator(errorIcon2El)).toHaveCount(0);
      await expect(page.locator(errorMessageEl)).toHaveCount(0);

      await page.locator(operator2El).selectOption({ label: '<' });
      await expect(page.locator(errorIcon2El)).toBeVisible();
      await expect(page.locator(errorMessageEl)).toHaveCount(2);

      await page.locator('[id^="enableWhen.1_remove"]').click();
      await expect(page.locator(errorMessageEl)).toHaveCount(0);
    });

    test('should display validation error message for each of the enableWhen fields', async ({ page }) => {
      const fixtureJson = await PWUtils.uploadFile(page, 'items-validation-sample.json', true);
      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await expect(titleField).toHaveValue(fixtureJson.title);
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      const errorMessageEl = 'mat-sidenav-content > div > ul > li.text-danger.list-group-item-warning';
      const question1El = '[id^="enableWhen.0.question"]';
      const operator1El = '[id^="enableWhen.0.operator"]';
      const answer1El = '[id^="enableWhen.0.answer"]';
      const errorIcon1El = '[id^="enableWhen.0_err"]';
      const question2El = '[id^="enableWhen.1.question"]';
      const errorIcon2El = '[id^="enableWhen.1_err"]';
      const errorIcon3El = '[id^="enableWhen.2_err"]';
      const errorIcon4El = '[id^="enableWhen.3_err"]';
      const answer4El = '[id^="enableWhen.3.answer"]';

      await PWUtils.clickTreeNode(page, 'EnableWhen');
      await expect(page.locator(errorMessageEl)).toBeVisible();

      await expect(page.locator(question1El)).toHaveValue('4 - Integer Type');
      await expect(page.locator(operator1El)).toHaveValue('2: =');
      await expect(page.locator(answer1El)).toHaveValue('5');
      await expect(page.locator(errorIcon1El)).toHaveCount(0);

      await expect(page.locator(question2El)).toHaveValue('');
      await expect(page.locator(errorIcon2El).locator('small'))
        .toContainText(" Question not found for the linkId 'q11' for enableWhen condition 2. ");

      await expect(page.locator(errorIcon3El).locator('small'))
        .toContainText(" Invalid operator '>' for type 'coding' for enableWhen condition 3. ");

      await expect(page.locator(errorIcon4El).locator('small'))
        .toContainText(" Answer field is required when you choose an operator other than 'Not empty' or 'Empty' for enableWhen condition 4. ");

      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[5].enableWhen.length).toEqual(1);
      expect(qJson.item[5].enableWhen[0].question).toEqual('/itm4');
      expect(qJson.item[5].enableWhen[0].operator).toEqual('=');
      expect(qJson.item[5].enableWhen[0].answerInteger).toEqual(5);

      await page.locator(answer1El).fill('');
      await expect(page.locator(errorIcon1El)).toBeVisible();
      await expect(page.locator(errorIcon1El).locator('small'))
        .toContainText(" Answer field is required when you choose an operator other than 'Not empty' or 'Empty' for enableWhen condition 1. ");

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[5].enableWhen).toBeUndefined();

      await page.locator(answer1El).fill('5');
      await page.locator(answer4El).fill('15');
      await expect(page.locator(errorIcon1El)).toHaveCount(0);
      await expect(page.locator(errorIcon4El)).toHaveCount(0);

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[5].enableWhen.length).toEqual(2);
      expect(qJson.item[5].enableWhen[0].question).toEqual('/itm4');
      expect(qJson.item[5].enableWhen[0].operator).toEqual('=');
      expect(qJson.item[5].enableWhen[0].answerInteger).toEqual(5);
      expect(qJson.item[5].enableWhen[1].question).toEqual('/itm4');
      expect(qJson.item[5].enableWhen[1].operator).toEqual('=');
      expect(qJson.item[5].enableWhen[1].answerInteger).toEqual(15);
    });

    test('should clear invalid question field on focusout for new enableWhen condition', async ({ page }) => {
      await PWUtils.uploadFile(page, 'items-validation-sample.json', true);
      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await PWUtils.clickTreeNode(page, 'Integer Type');

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      const question0 = page.locator('[id^="enableWhen.0.question"]');
      await question0.click();
      await question0.press('Enter');
      await expect(page.locator('[id^="enableWhen.0.operator"]')).toBeEnabled();
      await page.locator('[id^="enableWhen.0.operator"]').selectOption({ label: '=' });
      const answerString = page.locator('[id^="enableWhen.0.answerString"]');
      await expect(answerString).toBeVisible();
      await answerString.fill('Joe');

      await expect(page.locator('[id^="enableWhen.0_err"]')).toHaveCount(0);

      await page.locator('button:has-text("Add another condition")').click();

      const question1 = page.locator('[id^="enableWhen.1.question"]');
      await question1.pressSequentially('invalid question');
      await expect(page.locator('ngb-typeahead-window')).toHaveCount(0);
      await question1.press('Tab');
      await expect(question1).toHaveValue('');
      await expect(page.locator('[id^="enableWhen.1_err"]')).toBeVisible();

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item.length).toEqual(12);
      expect(qJson.item[3].enableWhen.length).toEqual(1);
      expect(qJson.item[3].enableWhen[0].question).toEqual(qJson.item[2].item[0].linkId);
      expect(qJson.item[3].enableWhen[0].operator).toEqual('=');
      expect(qJson.item[3].enableWhen[0].answerString).toEqual('Joe');
    });

    test('should display an error on invalid question field on focusout for an existing enableWhen condition', async ({ page }) => {
      await PWUtils.uploadFile(page, 'items-validation-sample.json', true);
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await PWUtils.clickTreeNode(page, 'Integer Type');

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      await page.locator('[id^="enableWhen.0.question"]').click();
      await page.locator('[id^="enableWhen.0.question"]').press('Enter');
      await expect(page.locator('[id^="enableWhen.0.operator"]')).toBeEnabled();
      await page.locator('[id^="enableWhen.0.operator"]').selectOption({ label: '=' });
      const answerString = page.locator('[id^="enableWhen.0.answerString"]');
      await expect(answerString).toBeVisible();
      await answerString.fill('Joe');

      await expect(page.locator('[id^="enableWhen.0_err"]')).toHaveCount(0);

      await page.locator('button:has-text("Add another condition")').click();
      await page.locator('[id^="enableWhen.1.question"]').click();
      await page.locator('[id^="enableWhen.1.question"]').press('Enter');
      await page.locator('[id^="enableWhen.1.operator"]').selectOption({ label: '=' });
      const answerString2 = page.locator('[id^="enableWhen.1.answerString"]');
      await expect(answerString2).toBeVisible();
      await answerString2.fill('David');

      await page.locator('button:has-text("Add another condition")').click();
      const question2 = page.locator('[id^="enableWhen.2.question"]');
      await question2.press('ArrowDown');
      await question2.press('Enter');
      await page.locator('[id^="enableWhen.2.operator"]').selectOption({ label: '=' });
      const answerCoding = page.locator('[id^="enableWhen.2.answerCoding"]');
      await answerCoding.pressSequentially('Street clothes, no shoes');
      await answerCoding.press('ArrowDown');
      await answerCoding.press('Enter');

      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item.length).toEqual(12);
      expect(qJson.item[3].enableWhen.length).toEqual(3);
      expect(qJson.item[3].enableWhen[0].question).toEqual(qJson.item[2].item[0].linkId);
      expect(qJson.item[3].enableWhen[0].operator).toEqual('=');
      expect(qJson.item[3].enableWhen[0].answerString).toEqual('Joe');
      expect(qJson.item[3].enableWhen[1].question).toEqual(qJson.item[2].item[0].linkId);
      expect(qJson.item[3].enableWhen[1].operator).toEqual('=');
      expect(qJson.item[3].enableWhen[1].answerString).toEqual('David');
      expect(qJson.item[3].enableWhen[2].question).toEqual(qJson.item[4].linkId);
      expect(qJson.item[3].enableWhen[2].operator).toEqual('=');
      expect(qJson.item[3].enableWhen[2].answerCoding.display).toEqual('Street clothes, no shoes');

      const question1 = page.locator('[id^="enableWhen.1.question"]');
      await question1.fill('invalid question');
      await expect(page.locator('ngb-typeahead-window')).toHaveCount(0);
      await page.locator('[id^="enableWhen.1.operator"]').focus();
      await expect(page.locator('[id^="enableWhen.1_err"]')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.1_err"] small'))
        .toContainText(" Question not found for the linkId '' for enableWhen condition 2. ");

      const question3 = page.locator('[id^="enableWhen.2.question"]');
      await question3.fill('invalid question2');
      await expect(page.locator('ngb-typeahead-window')).toHaveCount(0);
      await page.locator('[id^="enableWhen.2.operator"]').focus();
      await expect(page.locator('[id^="enableWhen.2_err"]')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.2_err"] small'))
        .toContainText(" Question not found for the linkId '' for enableWhen condition 3. ");

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[3].enableWhen.length).toEqual(1);
      expect(qJson.item[3].enableWhen[0].question).toEqual(qJson.item[2].item[0].linkId);
      expect(qJson.item[3].enableWhen[0].operator).toEqual('=');

      await PWUtils.clickTreeNode(page, 'Valid LinkId');
      await PWUtils.clickTreeNode(page, 'Integer Type');

      await expect(page.locator('[id^="enableWhen.1.question"]')).toHaveValue('');
      await expect(page.locator('[id^="enableWhen.1_err"]')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.1_err"] small'))
        .toContainText(" Question not found for the linkId '' for enableWhen condition 2. ");

      await expect(page.locator('[id^="enableWhen.2.question"]')).toHaveValue('');
      await expect(page.locator('[id^="enableWhen.2_err"]')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.2_err"] small'))
        .toContainText(" Question not found for the linkId '' for enableWhen condition 3. ");
    });

    test('should display lforms errors in preview', async ({ page }) => {
      await PWUtils.uploadFile(page, 'questionnaire-enableWhen-missing-linkId.json', true);
      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await expect(titleField).toHaveValue('Questionnaire where enableWhen contains an invalid linkId');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await page.locator('button:has-text("Preview")').click();
      const tabBody = page.locator('wc-lhc-form').locator('..');
      await expect(tabBody.locator('.card.bg-danger-subtle')).toBeVisible();

      const validation = tabBody.locator('.lforms-validation');
      await expect(validation).toHaveText(
        "Question with linkId 'q3' contains enableWhen pointing to a question with linkId 'q11' that does not exist."
      );

      const fhirMsg = tabBody.locator('.fhir-validation-msg');
      await expect(fhirMsg).toHaveText(
        "Select the 'View/Validate Questionnaire JSON' tab to access a feature that validates your Questionnaire against a supplied FHIR server, offering more detailed error insights."
      );

      await page.locator('mat-dialog-actions button:has-text("Close")').click();

      await PWUtils.clickTreeNode(page, 'enableWhen item with an invalid linkId');
      await page.locator('button:has-text("Delete this item")').click();
      await page.locator('lfb-confirm-dlg button:has-text("Yes")').click();

      await page.locator('button:has-text("Preview")').click();
      const tabBody2 = page.locator('wc-lhc-form').locator('..');
      await expect(tabBody2.locator('.card.bg-danger-subtle')).toHaveCount(0);
      await page.locator('mat-dialog-actions button:has-text("Close")').click();
    });

    test('should show answer column if there is an answer option in any row of conditional display', async ({ page }) => {
      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

      let addAnswerButton = page.locator('button:has-text("Add another answer")');

      await PWUtils.addCodingAnswerOptions(page, addAnswerButton,
        [
          { system: 's1', display: 'display 1', code: 'c1', __$score: 1 },
          { system: 's2', display: 'display 2', code: 'c2', __$score: 2 }
        ]
      );
      const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');

      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

      addAnswerButton = page.locator('button:has-text("Add another answer")');

      await PWUtils.addCodingAnswerOptions(page, addAnswerButton,
        [
          { system: 's1', display: 'display 1', code: 'c1', __$score: 1 },
          { system: 's2', display: 'display 2', code: 'c2', __$score: 2 },
          { system: 's3', display: 'display 3', code: 'c3', __$score: 3 }
        ]
      );

      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 2');

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      const r1Question = page.locator('[id^="enableWhen.0.question"]');
      const r1Operator = page.locator('[id^="enableWhen.0.operator"]');
      const r2Question = page.locator('[id^="enableWhen.1.question"]');
      const r2Operator = page.locator('[id^="enableWhen.1.operator"]');
      const r2Answer = page.locator('[id^="enableWhen.1.answerCoding"]');

      await r1Question.press('Enter');
      await r1Operator.selectOption({ label: 'Not empty' });
      await expect(page.locator('[id^="enableWhen.0.answerCoding"]')).toHaveCount(0);

      await page.locator('button:has-text("Add another condition")').click();

      await r2Question.press('ArrowDown');
      await r2Question.press('Enter');
      await r2Operator.selectOption({ label: '=' });
      await r2Answer.fill('display 3 (c3)');
      await r2Answer.press('ArrowDown');
      await r2Answer.press('Enter');

      await expect(page.locator('[id^="enableWhen.0.answerCoding"]')).toHaveCount(0);

      await r2Operator.selectOption({ label: 'Empty' });
      await expect(r2Answer).toHaveCount(0);

      await r1Operator.selectOption({ label: '=' });
      const r1Answer = page.locator('[id^="enableWhen.0.answerCoding"]');
      await expect(r1Answer).toBeVisible();
      await r1Answer.fill('display 1 (c1)');
      await r1Answer.press('ArrowDown');
      await r1Answer.press('Enter');
    });

    test('should show answer column if there is an answer in any row of conditional display', async ({ page }) => {
      const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      const r1Question = page.locator('[id^="enableWhen.0.question"]');
      const r1Operator = page.locator('[id^="enableWhen.0.operator"]');
      const r1Answer = page.locator('[id^="enableWhen.0.answer"]');
      const r2Question = page.locator('[id^="enableWhen.1.question"]');
      const r2Operator = page.locator('[id^="enableWhen.1.operator"]');
      const r2Answer = page.locator('[id^="enableWhen.1.answer"]');

      await r1Question.press('Enter');
      await r1Operator.selectOption({ label: 'Not empty' });
      await expect(r1Answer).toHaveCount(0);

      await page.locator('button:has-text("Add another condition")').click();

      await r2Question.press('ArrowDown');
      await r2Question.press('Enter');
      await r2Operator.selectOption({ label: '=' });
      await r2Answer.fill('2');
      await expect(r1Answer).toHaveCount(0);

      await r1Operator.selectOption({ label: '=' });
      await r1Answer.fill('1');
      await expect(r2Answer).toHaveValue('2');

      await r2Operator.selectOption({ label: 'Empty' });
      await expect(r1Answer).toHaveValue('1');
      await expect(r2Answer).toHaveCount(0);
    });

    test('should work with operator exists value in conditional display', async ({ page }) => {
      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

      let addAnswerButton = page.locator('button:has-text("Add another answer")');

      await PWUtils.addCodingAnswerOptions(page, addAnswerButton,
        [
          { system: 's1', display: 'display 1', code: 'c1', __$score: 1 },
          { system: 's2', display: 'display 2', code: 'c2', __$score: 2 }
        ]
      );

      const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');


      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

      addAnswerButton = page.locator('button:has-text("Add another answer")');

      await PWUtils.addCodingAnswerOptions(page, addAnswerButton,
        [
          { system: 's1', display: 'display 1', code: 'c1', __$score: 1 },
          { system: 's2', display: 'display 2', code: 'c2', __$score: 2 },
          { system: 's3', display: 'display 3', code: 'c3', __$score: 3 }
        ]
      );

      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 2');

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      const r1Question = page.locator('[id^="enableWhen.0.question"]');
      const r1Operator = page.locator('[id^="enableWhen.0.operator"]');
      const r2Question = page.locator('[id^="enableWhen.1.question"]');
      const r2Operator = page.locator('[id^="enableWhen.1.operator"]');

      await r1Question.press('Enter');
      await r1Operator.selectOption({ label: 'Not empty' });

      await page.locator('button:has-text("Add another condition")').click();

      await r2Question.press('ArrowDown');
      await r2Question.press('Enter');
      await r2Operator.selectOption({ label: 'Empty' });
      await expect(r2Operator).toHaveValue('1: notexists');

      const json = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(json.item[2].enableWhen).toEqual([
        {
          question: json.item[0].linkId,
          operator: 'exists',
          answerBoolean: true
        },
        {
          question: json.item[1].linkId,
          operator: 'exists',
          answerBoolean: false
        }
      ]);
    });

    test('should display the tree hierarchy sequence number concatenated with the item text ', async ({ page }) => {
      await PWUtils.selectDataType(page, 'decimal');
      await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');
      const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();
      await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      const r1Question = page.locator('[id^="enableWhen.0.question"]');
      await r1Question.press('Enter');
      await expect(r1Question).toHaveValue('1 - Item 0');
    });

    test('should fix a bug showing answer field when source item is decimal and operator is other than exists', async ({ page }) => {
      await PWUtils.selectDataType(page, 'decimal');
      await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');
      const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();
      await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      const r1Question = page.locator('[id^="enableWhen.0.question"]');
      const r1Operator = page.locator('[id^="enableWhen.0.operator"]');
      const r1Answer = page.locator('[id^="enableWhen.0.answer"]');
      const r1DecimalAnswer = page.locator('[id^="enableWhen.0.answerDecimal"]');
      const errorIcon1El = page.locator('[id^="enableWhen.0_err"]');

      await r1Question.press('Enter');
      await expect(r1Operator).toBeVisible();
      await expect(r1Answer).toHaveCount(0);
      await expect(errorIcon1El).toHaveCount(0);

      await r1Operator.selectOption({ label: '>' });
      await expect(r1DecimalAnswer).toBeVisible();
      await expect(errorIcon1El).toBeVisible();
      await r1DecimalAnswer.fill('2.3');
      await expect(errorIcon1El).toHaveCount(0);
    });

    test('should support source item with answerValueSet in conditional display', async ({ page }) => {
      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer value set URI');

      await page.locator('#answerValueSet_non-snomed').fill('http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions');
      await getTerminologyServerInput(page).scrollIntoViewIfNeeded();
      await getTerminologyServerInput(page).fill('https://clinicaltables.nlm.nih.gov/fhir/R4');
      await PWUtils.clickRadioButton(page, 'Answer list layout', 'Auto-complete');

      const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();
      await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      const r1Question = page.locator('[id^="enableWhen.0.question"]');
      const r1Operator = page.locator('[id^="enableWhen.0.operator"]');
      const r1Answer = page.locator('lfb-enable-when table tbody tr:nth-child(1) lfb-enablewhen-answer-coding lfb-auto-complete input');

      await r1Question.press('Enter');
      await r1Operator.selectOption({ label: '=' });
      await r1Answer.click();
      await r1Answer.pressSequentially('dia');
      await r1Answer.press('ArrowDown');
      await r1Answer.press('Enter');

      const json = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(json.item[1].enableWhen).toEqual([
        {
          question: json.item[0].linkId,
          operator: '=',
          answerCoding: {
            system: 'http://clinicaltables.nlm.nih.gov/fhir/CodeSystem/conditions',
            code: '2143',
            display: 'Diabetes mellitus'
          }
        }
      ]);
    });

    test('should support source item with SNOMED answerValueSet in conditional display', async ({ page }) => {
      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'SNOMED answer value set');

      await page.locator('#answerValueSet_ecl').fill(snomedEclText);
      await PWUtils.clickRadioButton(page, 'Answer list layout', 'Auto-complete');
      const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      await addNewItemButton.scrollIntoViewIfNeeded();
      await addNewItemButton.click();

      await PWUtils.expectRadioChecked(page, 'Conditional method', 'None');
      await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

      const r1Question = page.locator('[id^="enableWhen.0.question"]');
      const r1Operator = page.locator('[id^="enableWhen.0.operator"]');
      const r1Answer = page.locator('lfb-enable-when table tbody tr:nth-child(1) lfb-enablewhen-answer-coding lfb-auto-complete input');

      await r1Question.press('Enter');
      await r1Operator.selectOption({ label: '=' });
      await r1Answer.click();

      await page.route('**/ValueSet/$expand**', async (route) => {
        await route.fulfill({
          path: 'tests/fixtures/snomed-ecl-expression-mock.json',
          contentType: 'application/json'
        });
      });

      await r1Answer.pressSequentially('male');
      await r1Answer.press('ArrowDown');
      await r1Answer.press('Enter');

      await expect(r1Answer).toHaveValue('Intersex');

      const json = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(json.item[1].enableWhen).toEqual([
        {
          question: json.item[0].linkId,
          operator: '=',
          answerCoding: {
            system: 'http://snomed.info/sct',
            code: '32570691000036108',
            display: 'Intersex'
          }
        }
      ]);
    });

    test('should import form with conditional display field', async ({ page }) => {
      const fixtureJson = await PWUtils.uploadFile(page, 'enable-when-sample.json', true);
      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await expect(titleField).toHaveValue('US Surgeon General family health portrait');

      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await PWUtils.clickAndToggleTreeNode(page, 'Family member health history');
      await PWUtils.clickAndToggleTreeNode(page, 'Living?');
      await PWUtils.clickTreeNode(page, 'Living?');
      await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
      await PWUtils.expectValueCoding(page, 'answerOption', 0, null, 'Yes', 'LA33-6');

      await PWUtils.clickTreeNode(page, 'Date of Birth');
      await expect(page.locator('[id^="enableWhen.0.question"]')).toHaveValue('1.1 - Living?');
      await expect(page.locator('[id^="enableWhen.0.operator"] option:checked')).toHaveText('=');
      await expect(page.locator('[id^="enableWhen.0.answerCoding"]'))
        .toHaveValue('Yes (LA33-6 : http://loinc.org)');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].item[0].item[0].enableWhen)
        .toEqual(fixtureJson.item[0].item[0].item[0].enableWhen);
    });
  });

  test.describe('enableWhen answer pointing to answerOptions validation', () => {
    test.beforeEach(async ({ page }) => {
      await mainPO.loadFLPage();
    });

    test('should display a validation error if the answer does not match any of the answerOptions for R4 questionnaire', async ({ page }) => {
      test.setTimeout(60000);

      const fixtureJson = await PWUtils.uploadFile(page, 'enable-when-answer-options-R4-sample.json', false);
      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await expect(titleField).toHaveValue('R4 enableWhen AnswerOptions');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      // ---- integer ----
      await PWUtils.expectDataTypeValue(page, /integer/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[0].answerOption[0].valueInteger).toEqual(1);
      expect(q.item[0].answerOption[1].valueInteger).toEqual(2);
      expect(q.item[0].answerOption[2].valueInteger).toEqual(3);

      const enableWhenIntegerOnListItem = await PWUtils.getTreeNode(page, 'enableWhen integer on-list', true);
      await enableWhenIntegerOnListItem.click();
      await expect(enableWhenIntegerOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await PWUtils.expandAdvancedFields(page);
      await expect(page.locator('[id^="enableWhen.0.answerInteger"]')).toHaveValue('2');

      const enableWhenIntegerOffListItem = await PWUtils.getTreeNode(page, 'enableWhen integer off-list', true);
      await enableWhenIntegerOffListItem.click();
      await expect(enableWhenIntegerOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerInteger"]')).toHaveValue('4');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('integer answerOptions', '779085650305'));

      // ---- date ----
      await PWUtils.clickTreeNode(page, 'date answerOptions');
      await PWUtils.expectDataTypeValue(page, /date/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[3].answerOption[0].valueDate).toEqual('2025-11-03');
      expect(q.item[3].answerOption[1].valueDate).toEqual('2025-11-04');
      expect(q.item[3].answerOption[2].valueDate).toEqual('2025-11-05');

      const enableWhenDateOnListItem = await PWUtils.getTreeNode(page, 'enableWhen date on-list', true);
      await enableWhenDateOnListItem.click();
      await expect(enableWhenDateOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await expect(page.locator('[id^="enableWhen.0.answerDate"]')).toHaveValue('2025-11-04');

      const enableWhenDateOffListItem = await PWUtils.getTreeNode(page, 'enableWhen date off-list', true);
      await enableWhenDateOffListItem.click();
      await expect(enableWhenDateOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerDate"]')).toHaveValue('2025-11-20');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('date answerOptions', '759608001746'));

      // ---- time ----
      await PWUtils.clickTreeNode(page, 'time answerOptions');
      await PWUtils.expectDataTypeValue(page, /time/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[6].answerOption[0].valueTime).toEqual('16:00:00');
      expect(q.item[6].answerOption[1].valueTime).toEqual('17:00:00');
      expect(q.item[6].answerOption[2].valueTime).toEqual('18:00:00');

      const enableWhenTimeOnListItem = await PWUtils.getTreeNode(page, 'enableWhen time on-list', true);
      await enableWhenTimeOnListItem.click();
      await expect(enableWhenTimeOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await expect(page.locator('[id^="enableWhen.0.answerTime"]')).toHaveValue('17:00:00');

      const enableWhenTimeOffListItem = await PWUtils.getTreeNode(page, 'enableWhen time off-list', true);
      await enableWhenTimeOffListItem.click();
      await expect(enableWhenTimeOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerTime"]')).toHaveValue('08:00:00');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('time answerOptions', '657367236699'));

      // ---- string ----
      await PWUtils.clickTreeNode(page, 'string answerOptions');
      await PWUtils.expectDataTypeValue(page, /string/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[9].answerOption[0].valueString).toEqual('A');
      expect(q.item[9].answerOption[1].valueString).toEqual('B');
      expect(q.item[9].answerOption[2].valueString).toEqual('C');

      const enableWhenStringOnListItem = await PWUtils.getTreeNode(page, 'enableWhen string on-list', true);
      await enableWhenStringOnListItem.click();
      await expect(enableWhenStringOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await expect(page.locator('[id^="enableWhen.0.answerString"]')).toHaveValue('B');

      const enableWhenStringOffListItem = await PWUtils.getTreeNode(page, 'enableWhen string off-list', true);
      await enableWhenStringOffListItem.click();
      await expect(enableWhenStringOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerString"]')).toHaveValue('Z');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('string answerOptions', '820906264719'));

      // ---- text ---
      await PWUtils.clickTreeNode(page, 'text answerOptions');
      await PWUtils.expectDataTypeValue(page, /text/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[12].answerOption[0].valueString).toEqual('AAAAAAAA');
      expect(q.item[12].answerOption[1].valueString).toEqual('BBBBBBBBB');
      expect(q.item[12].answerOption[2].valueString).toEqual('CCCCCCCCC');

      const enableWhenTextOnListItem = await PWUtils.getTreeNode(page, 'enableWhen text on-list', true);
      await enableWhenTextOnListItem.click();
      await expect(enableWhenTextOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await expect(page.locator('[id^="enableWhen.0.answerString"]')).toHaveValue('BBBBBBBBB');

      const enableWhenTextOffListItem = await PWUtils.getTreeNode(page, 'enableWhen text off-list', true);
      await enableWhenTextOffListItem.click();
      await expect(enableWhenTextOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerString"]')).toHaveValue('ZZZZZZZZZ');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('text answerOptions', '174788656639'));

      // ---- coding ----
      await PWUtils.clickTreeNode(page, 'coding answerOptions restricted');
      await PWUtils.expectDataTypeValue(page, /coding/);
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.expectRadioNotChecked(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioNotChecked(page, 'Answer constraint', 'Allow off list');
      await PWUtils.expectRadioNotChecked(page, 'Answer constraint', 'Allow free text');

      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[15].answerOption[0].valueCoding.system).toEqual('a');
      expect(q.item[15].answerOption[0].valueCoding.code).toEqual('a1');
      expect(q.item[15].answerOption[0].valueCoding.display).toEqual('a1');

      let enableWhenCodingOnListItem = await PWUtils.getTreeNode(page, 'enableWhen coding on-list', true);
      await enableWhenCodingOnListItem.click();
      await expect(enableWhenCodingOnListItem.locator('fa-icon#error')).toHaveCount(0);
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[16].enableWhen[0].answerCoding.display).toEqual(q.item[15].answerOption[1].valueCoding.display);
      expect(q.item[16].enableWhen[0].answerCoding.code).toEqual(q.item[15].answerOption[1].valueCoding.code);
      expect(q.item[16].enableWhen[0].answerCoding.system).toEqual(q.item[15].answerOption[1].valueCoding.system);

      let enableWhenCodingOffListItem = await PWUtils.getTreeNode(page, 'enableWhen coding off-list', true);
      await enableWhenCodingOffListItem.click();
      await expect(enableWhenCodingOffListItem.locator('fa-icon#error')).toBeVisible();
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[17].enableWhen[0].answerCoding.display).not.toEqual(q.item[15].answerOption[1].valueCoding.display);
      expect(q.item[17].enableWhen[0].answerCoding.code).not.toEqual(q.item[15].answerOption[1].valueCoding.code);
      expect(q.item[17].enableWhen[0].answerCoding.system).not.toEqual(q.item[15].answerOption[1].valueCoding.system);
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('coding answerOptions restricted', '264603036166'));

      const codingAnswerOptionsOptionsOrStringItem = await PWUtils.getTreeNode(page, 'coding answerOptions optionsOrString', true);
      await codingAnswerOptionsOptionsOrStringItem.click();
      await PWUtils.expectDataTypeValue(page, /coding/);
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.expectRadioNotChecked(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioNotChecked(page, 'Answer constraint', 'Allow off list');
      await PWUtils.expectRadioChecked(page, 'Answer constraint', 'Allow free text');

      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[15].answerOption[0].valueCoding.system).toEqual('a');
      expect(q.item[15].answerOption[0].valueCoding.code).toEqual('a1');
      expect(q.item[15].answerOption[0].valueCoding.display).toEqual('a1');

      enableWhenCodingOnListItem = await PWUtils.getTreeNode(page, 'enableWhen coding on-list', true);
      await enableWhenCodingOnListItem.click();
      await expect(enableWhenCodingOnListItem.locator('fa-icon#error')).toHaveCount(0);
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[19].enableWhen[0].answerCoding.display).toEqual(q.item[18].answerOption[1].valueCoding.display);
      expect(q.item[19].enableWhen[0].answerCoding.code).toEqual(q.item[18].answerOption[1].valueCoding.code);
      expect(q.item[19].enableWhen[0].answerCoding.system).toEqual(q.item[18].answerOption[1].valueCoding.system);

      enableWhenCodingOffListItem = await PWUtils.getTreeNode(page, 'enableWhen coding off-list', true);
      await enableWhenCodingOffListItem.click();
      await expect(enableWhenCodingOffListItem.locator('fa-icon#error')).toBeVisible();
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[20].enableWhen[0].answerCoding.display).not.toEqual(q.item[18].answerOption[1].valueCoding.display);
      expect(q.item[20].enableWhen[0].answerCoding.code).not.toEqual(q.item[18].answerOption[1].valueCoding.code);
      expect(q.item[20].enableWhen[0].answerCoding.system).not.toEqual(q.item[18].answerOption[1].valueCoding.system);
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('coding answerOptions restricted', '264603036166'));
    });

    test('should display a validation error if the answer does not match any of the answerOptions for R5 questionnaire', async ({ page }) => {
      test.setTimeout(60000);

      await PWUtils.uploadFile(page, 'enable-when-answer-options-R5-sample.json', false);
      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await expect(titleField).toHaveValue('R5 enableWhen AnswerOptions optionsOnly');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      // ---- integer ----
      await PWUtils.expectDataTypeValue(page, /integer/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[0].answerOption[0].valueInteger).toEqual(1);
      expect(q.item[0].answerOption[1].valueInteger).toEqual(2);
      expect(q.item[0].answerOption[2].valueInteger).toEqual(3);

      const enableWhenIntegerOnListItem = await PWUtils.getTreeNode(page, 'enableWhen integer on-list', true);
      await enableWhenIntegerOnListItem.click();
      await expect(enableWhenIntegerOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await PWUtils.expandAdvancedFields(page);
      await expect(page.locator('[id^="enableWhen.0.answerInteger"]')).toHaveValue('2');

      let enableWhenIntegerOffListItem = await PWUtils.getTreeNode(page, 'enableWhen integer off-list', true);
      await enableWhenIntegerOffListItem.click();
      await expect(enableWhenIntegerOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerInteger"]')).toHaveValue('4');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('integer answerOptions', '779085650305'));

      // ---- date ----
      await PWUtils.clickTreeNode(page, 'date answerOptions');
      await PWUtils.expectDataTypeValue(page, /date/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[3].answerOption[0].valueDate).toEqual('2025-11-03');
      expect(q.item[3].answerOption[1].valueDate).toEqual('2025-11-04');
      expect(q.item[3].answerOption[2].valueDate).toEqual('2025-11-05');

      const enableWhenDateOnListItem = await PWUtils.getTreeNode(page, 'enableWhen date on-list', true);
      await enableWhenDateOnListItem.click();
      await expect(enableWhenDateOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await expect(page.locator('[id^="enableWhen.0.answerDate"]')).toHaveValue('2025-11-04');

      const enableWhenDateOffListItem = await PWUtils.getTreeNode(page, 'enableWhen date off-list', true);
      await enableWhenDateOffListItem.click();
      await expect(enableWhenDateOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerDate"]')).toHaveValue('2025-11-20');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('date answerOptions', '759608001746'));


      // ---- time ----
      await PWUtils.clickTreeNode(page, 'time answerOptions');
      await PWUtils.expectDataTypeValue(page, /time/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[6].answerOption[0].valueTime).toEqual('16:00:00');
      expect(q.item[6].answerOption[1].valueTime).toEqual('17:00:00');
      expect(q.item[6].answerOption[2].valueTime).toEqual('18:00:00');

      const enableWhenTimeOnListItem = await PWUtils.getTreeNode(page, 'enableWhen time on-list', true);
      await enableWhenTimeOnListItem.click();
      await expect(enableWhenTimeOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await expect(page.locator('[id^="enableWhen.0.answerTime"]')).toHaveValue('17:00:00');

      const enableWhenTimeOffListItem = await PWUtils.getTreeNode(page, 'enableWhen time off-list', true);
      await enableWhenTimeOffListItem.click();
      await expect(enableWhenTimeOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerTime"]')).toHaveValue('08:00:00');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('time answerOptions', '657367236699'));

      // ---- string ----
      await PWUtils.clickTreeNode(page, 'string answerOptions');
      await PWUtils.expectDataTypeValue(page, /string/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[9].answerOption[0].valueString).toEqual('A');
      expect(q.item[9].answerOption[1].valueString).toEqual('B');
      expect(q.item[9].answerOption[2].valueString).toEqual('C');

      const enableWhenStringOnListItem = await PWUtils.getTreeNode(page, 'enableWhen string on-list', true);
      await enableWhenStringOnListItem.click();
      await expect(enableWhenStringOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await expect(page.locator('[id^="enableWhen.0.answerString"]')).toHaveValue('B');

      const enableWhenStringOffListItem = await PWUtils.getTreeNode(page, 'enableWhen string off-list', true);
      await enableWhenStringOffListItem.click();
      await expect(enableWhenStringOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerString"]')).toHaveValue('Z');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('string answerOptions', '820906264719'));

      // ---- text ----
      await PWUtils.clickTreeNode(page, 'text answerOptions');
      await PWUtils.expectDataTypeValue(page, /text/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[12].answerOption[0].valueString).toEqual('AAAAAAAA');
      expect(q.item[12].answerOption[1].valueString).toEqual('BBBBBBBBB');
      expect(q.item[12].answerOption[2].valueString).toEqual('CCCCCCCCC');

      const enableWhenTextOnListItem = await PWUtils.getTreeNode(page, 'enableWhen text on-list', true);
      await enableWhenTextOnListItem.click();
      await expect(enableWhenTextOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await expect(page.locator('[id^="enableWhen.0.answerString"]')).toHaveValue('BBBBBBBBB');

      const enableWhenTextOffListItem = await PWUtils.getTreeNode(page, 'enableWhen text off-list', true);
      await enableWhenTextOffListItem.click();
      await expect(enableWhenTextOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerString"]')).toHaveValue('ZZZZZZZZZ');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('text answerOptions', '174788656639'));

      // ---- coding ----
      await PWUtils.clickTreeNode(page, 'coding answerOptions');
      await PWUtils.expectDataTypeValue(page, /coding/);
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.expectRadioChecked(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioNotChecked(page, 'Answer constraint', 'Allow off list');
      await PWUtils.expectRadioNotChecked(page, 'Answer constraint', 'Allow free text');

      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[15].answerOption[0].valueCoding.system).toEqual('a');
      expect(q.item[15].answerOption[0].valueCoding.code).toEqual('a1');
      expect(q.item[15].answerOption[0].valueCoding.display).toEqual('a1');

      const enableWhenCodingOnListItem = await PWUtils.getTreeNode(page, 'enableWhen coding on-list', true);
      await enableWhenCodingOnListItem.click();
      await expect(enableWhenCodingOnListItem.locator('fa-icon#error')).toHaveCount(0);
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[16].enableWhen[0].answerCoding.display).toEqual(q.item[15].answerOption[1].valueCoding.display);
      expect(q.item[16].enableWhen[0].answerCoding.code).toEqual(q.item[15].answerOption[1].valueCoding.code);
      expect(q.item[16].enableWhen[0].answerCoding.system).toEqual(q.item[15].answerOption[1].valueCoding.system);

      const enableWhenCodingOffListItem = await PWUtils.getTreeNode(page, 'enableWhen coding off-list', true);
      await enableWhenCodingOffListItem.click();
      await expect(enableWhenCodingOffListItem.locator('fa-icon#error')).toBeVisible();
      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[17].enableWhen[0].answerCoding.display).not.toEqual(q.item[15].answerOption[1].valueCoding.display);
      expect(q.item[17].enableWhen[0].answerCoding.code).not.toEqual(q.item[15].answerOption[1].valueCoding.code);
      expect(q.item[17].enableWhen[0].answerCoding.system).not.toEqual(q.item[15].answerOption[1].valueCoding.system);
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('coding answerOptions', '264603036166'));
    });

    test('should validate answer constraints (Restrict to the list, Allow off list, Allow free text)', async ({ page }) => {
      test.setTimeout(60000);

      await PWUtils.uploadFile(page, 'enable-when-answer-options-R5-sample.json', false);
      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await expect(titleField).toHaveValue('R5 enableWhen AnswerOptions optionsOnly');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await PWUtils.expectDataTypeValue(page, /integer/);
      await PWUtils.expectRadioChecked(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');

      let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[0].answerOption[0].valueInteger).toEqual(1);
      expect(q.item[0].answerOption[1].valueInteger).toEqual(2);
      expect(q.item[0].answerOption[2].valueInteger).toEqual(3);

      const enableWhenIntegerOnListItem = await PWUtils.getTreeNode(page, 'enableWhen integer on-list', true);
      await enableWhenIntegerOnListItem.click();
      await expect(enableWhenIntegerOnListItem.locator('fa-icon#error')).toHaveCount(0);
      await PWUtils.expandAdvancedFields(page);
      await expect(page.locator('[id^="enableWhen.0.answerInteger"]')).toHaveValue('2');

      let enableWhenIntegerOffListItem = await PWUtils.getTreeNode(page, 'enableWhen integer off-list', true);
      await enableWhenIntegerOffListItem.click();
      await expect(enableWhenIntegerOffListItem.locator('fa-icon#error')).toBeVisible();
      await expect(page.locator('[id^="enableWhen.0.answerInteger"]')).toHaveValue('4');
      await expect(page.locator('[id^="enableWhen.0_err"] small'))
        .toContainText(enableWhenErrorMsg('integer answerOptions', '779085650305'));

      await PWUtils.clickTreeNode(page, 'integer answerOptions');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Allow off list');

      await enableWhenIntegerOffListItem.click();
      await expect(enableWhenIntegerOffListItem.locator('fa-icon#error')).toHaveCount(0);
      await expect(page.locator('[id^="enableWhen.0_err"]')).toHaveCount(0);

      await PWUtils.clickTreeNode(page, 'integer answerOptions');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Allow free text');

      await enableWhenIntegerOffListItem.click();
      await expect(enableWhenIntegerOffListItem.locator('fa-icon#error')).toHaveCount(0);
      await expect(page.locator('[id^="enableWhen.0_err"]')).toHaveCount(0);
    });

  });
});

test.describe('enableWhen condition and enableWhenExpression', async () => {
  let mainPO: MainPO;
  let fileJson;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();
    fileJson = await PWUtils.uploadFile(page, 'enable-when-expression-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
  });

  test('should show/hide enableWhenExpression extension when switching between conditional method options', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'enableWhen expression');

    // Expand the Advanced fields section.
    await PWUtils.expandAdvancedFields(page);

    // Validate that the enableWhen expression radio button is checked.
    await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen expression');

    // Check the enableWhenExpression extension.
    const input = page.locator('textarea[id^="__$enableWhenExpression"]');
    await expect(input).toHaveValue('%a > 5 and %b > 5');
    let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[3].extension).toHaveLength(3);
    expect(q.item[3].extension).toEqual(fileJson.item[3].extension);

    // Select the 'enableWhen condition and behavior' option.
    await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');

    // The enableWhenExpression extension should be hidden.
    q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[3].extension).toHaveLength(2);

    expect(q.item[3].extension[0]).toEqual(fileJson.item[3].extension[0]);
    expect(q.item[3].extension[1]).toEqual(fileJson.item[3].extension[1]);

    // Select the 'enableWhenExpression' option.
    await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen expression');

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
    await PWUtils.clickButton(page, 'Toolbar with item action buttons', 'Add new item');
    await PWUtils.clickButton(page, null, 'Advanced fields');

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
    await PWUtils.uploadFile(page, 'enable-when-answer-coding-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
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
