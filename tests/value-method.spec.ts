import { test, expect, Locator } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

test.describe('value method', async () => {
  let mainPO: MainPO;
  let fileJson: any;

  let valueMethod: Locator;
  let computeInitialRadio: Locator;
  let computeContinuouslyRadio: Locator;
  let computeInitialLabel: Locator;
  let computeContinuouslyLabel: Locator;
  let noneRadio: Locator;
  let repeatOption: Locator;
  let repeatYes: Locator;
  let repeatNo: Locator;
  let repeatUnspecified: Locator;
  let repeatYesRadio: Locator;
  let repeatNoRadio: Locator;
  let repeatUnspecifiedRadio: Locator;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();

    fileJson = await PWUtils.uploadFile(page, 'value-methods-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');

    valueMethod = page.locator('div:has-text("Value method")').first();
    await valueMethod.waitFor({ state: 'visible', timeout: 40000 });
    await expect(valueMethod).toBeVisible();

    computeInitialRadio = valueMethod.locator('[id^="__$valueMethod_compute-initial"]');
    computeContinuouslyRadio = valueMethod.locator('[id^="__$valueMethod_compute-continuously"]');
    computeInitialLabel = valueMethod.locator('[for^="__$valueMethod_compute-initial"]');
    computeContinuouslyLabel = valueMethod.locator('[for^="__$valueMethod_compute-continuously"]');
    noneRadio = valueMethod.locator('[id^="__$valueMethod_none"]');

    repeatOption = page.getByLabel('Allow repeating question?', { exact: true });
    await expect(repeatOption).toBeVisible();

    repeatYes = repeatOption.locator('[for^="booleanRadio_true"]');
    repeatNo = repeatOption.locator('[for^="booleanRadio_false"]');
    repeatUnspecified = repeatOption.locator('[for^="booleanRadio_null"]');

    repeatYesRadio = repeatOption.locator('[id^="booleanRadio_true"]');
    repeatNoRadio = repeatOption.locator('[id^="booleanRadio_false"]');
    repeatUnspecifiedRadio = repeatOption.locator('[id^="booleanRadio_null"]');
  });

  test('should load and display correct value method options', async ({ page }) => {
    // Type Initial Value (Single)
    const typeInitialRadio = await PWUtils.getRadioButton(page, 'Value method', 'Type initial value');

    await PWUtils.expectDataTypeValue(page, /integer/);

    await expect(typeInitialRadio).toBeVisible();
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueInteger"]')).toBeVisible();
    await expect(page.locator('[id^="initial.0.valueInteger"]')).toHaveValue('6');
    await expect(repeatNoRadio).toBeVisible();
    await expect(repeatNoRadio).toBeChecked();

    // Type Initial Value (Multiple)
    await PWUtils.clickTreeNode(page, 'Type Initial Value (Multiple)');
    await PWUtils.expectDataTypeValue(page, /integer/);

    await expect(typeInitialRadio).toBeVisible();
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueInteger"]')).toHaveValue('2');
    await expect(page.locator('[id^="initial.1.valueInteger"]')).toHaveValue('6');
    await expect(repeatYesRadio).toBeVisible();
    await expect(repeatYesRadio).toBeChecked();

    // Pick Initial Value (Single)
    await PWUtils.clickTreeNode(page, 'Pick Initial Value (Single)');
    const pickInitialRadio = await PWUtils.getRadioButton(page, 'Value method', 'Pick initial value');

    await PWUtils.expectDataTypeValue(page, /coding/);

    await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer options');

    await expect(pickInitialRadio).toBeVisible();
    await expect(pickInitialRadio).toBeChecked();
    await expect(page.locator('[id^="pick-answer_"]')).toHaveValue('Street clothes, no shoes');
    await expect(repeatNoRadio).toBeChecked();

    // Pick Initial Value (Multiple)
    await PWUtils.clickTreeNode(page, 'Pick Initial Value (Multiple)');
    await PWUtils.expectDataTypeValue(page, /coding/);

    await expect(pickInitialRadio).toBeVisible();
    await expect(pickInitialRadio).toBeChecked();
    const pickInitialValues = page.locator('lfb-pick-answer span.autocomp_selected li');
    await expect(pickInitialValues.nth(0)).toContainText('Street clothes, no shoes');
    await expect(pickInitialValues.nth(1)).toContainText('Street clothes & shoes');
    await expect(repeatYesRadio).toBeChecked();

    // Compute Initial Value
    await PWUtils.clickTreeNode(page, 'Compute Initial Value');
    await PWUtils.expectDataTypeValue(page, /integer/);

    await expect(computeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="__\\$initialExpression"]')).toHaveValue('%a + %b');
    await expect(repeatUnspecifiedRadio).toBeChecked();

    // Continuously Compute Value
    await PWUtils.clickTreeNode(page, 'Continuously Compute Value');
    await PWUtils.expectDataTypeValue(page, /integer/);

    await expect(computeContinuouslyRadio).toBeChecked();
    await expect(page.locator('[id^="__\\$calculatedExpression"]')).toHaveValue('%a + %b + %c');
    await expect(repeatUnspecifiedRadio).toBeChecked();

    await PWUtils.clickTreeNode(page, 'None');
    await expect(noneRadio).toBeChecked();
    await PWUtils.expectDataTypeValue(page, /integer/);

    // Compute Initial Value with decimal data type
    await PWUtils.clickTreeNode(page, 'Compute Initial Value with decimal data type');
    await PWUtils.expectDataTypeValue(page, /decimal/);

    // Variables section
    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(2);
    const firstVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(1)');
    const secondVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(2)');

    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('normal_weight');
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('Question');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText("%resource.item.where(linkId='normal_weight').answer.value");

    await expect(secondVariable.locator('td:nth-child(1)')).toHaveText('measured_weight');
    await expect(secondVariable.locator('td:nth-child(2)')).toHaveText('Question');
    await expect(secondVariable.locator('td:nth-child(3)')).toHaveText("%resource.item.where(linkId='measured_weight').answer.value");

    await expect(computeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="__\\$initialExpression"]')).toHaveValue('%measured_weight-%normal_weight');
    await expect(repeatUnspecifiedRadio).toBeChecked();

    // Continuously Compute Value with decimal data type
    await PWUtils.clickTreeNode(page, 'Continuously Compute Value with decimal data type');
    await PWUtils.expectDataTypeValue(page, /decimal/);

    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(2);
    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('normal_weight');
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('Question');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText("%resource.item.where(linkId='normal_weight').answer.value");

    await expect(secondVariable.locator('td:nth-child(1)')).toHaveText('weight_change');
    await expect(secondVariable.locator('td:nth-child(2)')).toHaveText('Question');
    await expect(secondVariable.locator('td:nth-child(3)')).toHaveText("%resource.item.where(linkId='weight_change').answer.value");

    await expect(computeContinuouslyRadio).toBeChecked();
    await expect(page.locator('[id^="__\\$calculatedExpression"]')).toHaveValue('((%weight_change / %normal_weight).round(2))*100');
    await expect(repeatUnspecifiedRadio).toBeChecked();
  });

  test('should type initial values', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();

    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Type initial values');

    await PWUtils.selectDataType(page, 'integer');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    await page.locator('[id^="initial.0.valueInteger"]').fill('3');
    await page.locator('[id^="initial.0.valueInteger"]').press('Enter');

    await repeatYes.click();

    const addInitialValueButton = page.locator('button:has-text("Add another value")');
    await addInitialValueButton.click();
    await page.locator('[id^="initial.1.valueInteger"]').fill('4');
    await page.locator('[id^="initial.1.valueInteger"]').press('Enter');
    await addInitialValueButton.click();
    await page.locator('[id^="initial.2.valueInteger"]').fill('5');
    await page.locator('[id^="initial.2.valueInteger"]').press('Enter');

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(qJson.item[7].initial).toEqual([
      { valueInteger: 3 },
      { valueInteger: 4 },
      { valueInteger: 5 }
    ]);
  });

  test('should pick initial values', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Pick initial values');
    await PWUtils.selectDataType(page, 'coding');

    await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
    await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');

    await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
    await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(1);

    await PWUtils.clickRadioButton(page, 'Value method', 'Pick initial value');

    const pickAnswer = page.locator('[id^="pick-answer_"]');
    await expect(pickAnswer).toBeVisible();
    await expect(pickAnswer).toHaveClass(/invalid/);
    const errorMsg = page.locator('lfb-pick-answer small.text-danger');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Answer choices must be populated.');
    await expect(page.locator('mat-sidenav-content > div.mt-1 > ul > li.text-danger')).toHaveCount(1);
    await expect(page.locator('mat-sidenav-content > ul > li')).toHaveClass(/text-danger/);

    const addAnswerButton = page.locator('button:has-text("Add another answer")');

    await PWUtils.addCodingAnswerOptions(page, addAnswerButton,
      [
        { system: 'http://loinc.org', display: 'Example 1', code: 'MD11871-1', __$score: null },
        { system: 'http://loinc.org', display: 'Example 2', code: 'MD11871-2', __$score: null },
        { system: 'http://loinc.org', display: 'Example 3', code: 'MD11871-3', __$score: null }
      ]
    );

    await page.locator('[id^="answerOption.2.valueCoding.__$score"]').click();

    await expect(pickAnswer).not.toHaveClass(/invalid/);
    await expect(page.locator('lfb-pick-answer small.text-danger')).not.toBeVisible();
    await expect(page.locator('mat-sidenav-content > div.mt-1 > ul > li')).not.toHaveClass(/text-danger/);
    await expect(page.locator('mat-sidenav-content > ul > li')).toHaveCount(0);

    await PWUtils.selectAutocompleteOptions(
      page,
      '[id^="pick-answer_"]',
      false,
      null,
      3,
      ['ArrowDown', 'ArrowDown', 'Enter'],
      'Example 2'
    );

    await page.getByRole('radiogroup', { name: 'Allow repeating question?' }).getByText('Yes').click();

    await PWUtils.selectAutocompleteOptions(
      page,
      '[id^="pick-answer_"]',
      true,
      'Example 1',
      null,
      ['ArrowDown', 'Enter'],
      ['×Example 1']
    );

    await PWUtils.selectAutocompleteOptions(
      page,
      '[id^="pick-answer_"]',
      true,
      'invalidCode',
      null,
      ['ArrowDown', 'Enter'],
      ['×Example 1']
    );

    await PWUtils.selectAutocompleteOptions(
      page,
      '[id^="pick-answer_"]',
      true,
      'Example 3',
      null,
      ['ArrowDown', 'Enter'],
      ['×Example 1', '×Example 3']
    );

    const pickAnswerSelection = page.locator('lfb-pick-answer span.autocomp_selected > ul > li');
    await expect(pickAnswerSelection).toHaveCount(2);
    await expect(pickAnswerSelection.nth(0)).toContainText('Example 1');
    await expect(pickAnswerSelection.nth(1)).toContainText('Example 3');

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(qJson.item[7].type).toBe('coding');
    expect(qJson.item[7].answerOption[0].valueCoding.display).toBe('Example 1');
    expect(qJson.item[7].answerOption[0].initialSelected).toBe(true);
    expect(qJson.item[7].answerOption[2].valueCoding.display).toBe('Example 3');
    expect(qJson.item[7].answerOption[2].initialSelected).toBe(true);
  });

  test('should retain valid state when toggling between "Pick initial value" and other value methods', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    await page.locator('#text').clear();
    await page.locator('#text').fill('Test state');
    await PWUtils.selectDataType(page, 'coding');

    await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
    await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');

    await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
    await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

    await PWUtils.clickRadioButton(page, 'Value method', 'Pick initial value');

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(1);

    const addAnswerButton = page.locator('button:has-text("Add another answer")');
    await PWUtils.addCodingAnswerOptions(page, addAnswerButton,
      [
        { system: 'http://loinc.org', display: 'Example 1', code: 'MD11871-1', __$score: null },
        { system: 'http://loinc.org', display: 'Example 2', code: 'MD11871-2', __$score: null },
        { system: 'http://loinc.org', display: 'Example 3', code: 'MD11871-3', __$score: null }
      ]
    );

    await page.locator('[id^="answerOption.2.valueCoding.__$score"]').click();

    const pickAnswer = page.locator('[id^="pick-answer_"]');
    await expect(pickAnswer).toBeVisible();

    await pickAnswer.click();
    await expect(page.locator('#lhc-tools-searchResults ul > li')).toHaveCount(3);
    await pickAnswer.press('ArrowDown');
    await pickAnswer.press('ArrowDown');
    await pickAnswer.press('Enter');
    await expect(pickAnswer).toHaveValue('Example 2');

    await PWUtils.clickRadioButton(page, 'Value method', 'Compute initial value');
    await PWUtils.clickRadioButton(page, 'Value method', 'Pick initial value');
    await expect(pickAnswer).not.toHaveClass(/no_match/);
  });

  test('should remove the answer choices error when answer choices are added and selected for types other than "coding"', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Test answer choice error');
    await PWUtils.selectDataType(page, 'integer');

    await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
    await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');

    await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
    await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(1);

    await PWUtils.clickRadioButton(page, 'Value method', 'Pick initial value');

    const pickAnswer = page.locator('[id^="pick-answer_"]');
    await expect(pickAnswer).toBeVisible();
    await expect(pickAnswer).toHaveClass(/invalid/);
    await expect(page.locator('lfb-pick-answer small.text-danger')).toContainText('Answer choices must be populated.');

    const addAnswerButton = page.locator('button:has-text("Add another answer")');
    await page.locator('[id^="answerOption.0.valueInteger"]').fill('100');
    await addAnswerButton.click();
    await page.locator('[id^="answerOption.1.valueInteger"]').fill('200');
    await addAnswerButton.click();
    await page.locator('[id^="answerOption.2.valueInteger"]').fill('300');
    await addAnswerButton.click();

    await pickAnswer.click();
    await expect(page.locator('#lhc-tools-searchResults ul > li')).toHaveCount(3);
    await pickAnswer.press('ArrowDown');
    await pickAnswer.press('ArrowDown');
    await pickAnswer.press('Enter');
    await expect(pickAnswer).toHaveValue('200');

    await expect(pickAnswer).not.toHaveClass(/invalid/);
    await expect(page.locator('lfb-pick-answer small.text-danger')).not.toBeVisible();
    await expect(page.locator('mat-sidenav-content > div.mt-1 > ul > li')).not.toHaveClass(/text-danger/);
    await expect(page.locator('mat-sidenav-content > ul > li')).toHaveCount(0);
  });

  test('should create Initial compute value expression', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Compute initial value expression');
    await PWUtils.selectDataType(page, 'integer');

    await computeInitialLabel.click();
    await expect(page.locator('[id^="__\\$initialExpression"]')).toBeEmpty();
    await page.locator('[id^="edit__\\$initialExpression"]').click();
    await PWUtils.expandExpressionItemVariablesSection(page);
    const dialog = page.locator('#expression-editor-base-dialog');
    const addVariableBtn = dialog.locator('#add-variable');
    await expect(dialog).toBeVisible({ timeout: 30000 });
    await addVariableBtn.waitFor({ state: 'visible', timeout: 30000 });
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

    await addVariableBtn.click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
    await page.locator('#variable-label-0').fill('a');
    await page.locator('#variable-type-0').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-0').fill('1');

    await addVariableBtn.click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);
    await page.locator('#variable-label-1').fill('b');
    await page.locator('#variable-type-1').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-1').fill('2');

    await page.locator('textarea#final-expression').fill('%a + %b');
    await page.locator('#export').click();
    await expect(page.locator('[id^="__\\$initialExpression"]')).toHaveValue('%a + %b');

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(qJson.item[7].extension).toEqual([
      expect.objectContaining({ url: 'http://hl7.org/fhir/StructureDefinition/variable' }),
      expect.objectContaining({ url: 'http://hl7.org/fhir/StructureDefinition/variable' }),
      {
        url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression',
        valueExpression: { language: 'text/fhirpath', expression: '%a + %b' }
      }
    ]);

    await page.locator('[id^="edit__\\$initialExpression"]').click();
    await PWUtils.expandExpressionItemVariablesSection(page);
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);
    await expect(page.locator('#variable-label-0')).toHaveValue('a');
    await expect(page.locator('#variable-type-0')).toHaveValue('simple');
    await expect(page.locator('input#simple-expression-0')).toHaveValue('1');
    await expect(page.locator('#variable-label-1')).toHaveValue('b');
    await expect(page.locator('#variable-type-1')).toHaveValue('simple');
    await expect(page.locator('input#simple-expression-1')).toHaveValue('2');
  });

  test('should create Continuously compute value expression', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Continuously compute value expression');
    await PWUtils.selectDataType(page, 'integer');

    await computeContinuouslyLabel.click();
    await expect(page.locator('[id^="__\\$calculatedExpression"]')).toBeEmpty();
    await page.locator('[id^="edit__\\$calculatedExpression"]').click();
    await PWUtils.expandExpressionItemVariablesSection(page);
    const dialog = page.locator('#expression-editor-base-dialog');
    const addVariableBtn = dialog.locator('#add-variable');
    await expect(dialog).toBeVisible({ timeout: 30000 });
    await addVariableBtn.waitFor({ state: 'visible', timeout: 30000 });
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

    await addVariableBtn.click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
    await page.locator('#variable-label-0').fill('a');
    await page.locator('#variable-type-0').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-0').fill('1');

    await addVariableBtn.click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);
    await page.locator('#variable-label-1').fill('b');
    await page.locator('#variable-type-1').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-1').fill('2');

    await page.locator('textarea#final-expression').fill('%a + %b');
    await page.locator('#export').click();
    await expect(page.locator('[id^="__\\$calculatedExpression"]')).toHaveValue('%a + %b');

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(qJson.item[7].extension).toEqual([
      expect.objectContaining({ url: 'http://hl7.org/fhir/StructureDefinition/variable' }),
      expect.objectContaining({ url: 'http://hl7.org/fhir/StructureDefinition/variable' }),
      {
        url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression',
        valueExpression: { language: 'text/fhirpath', expression: '%a + %b' }
      }
    ]);

    await page.locator('[id^="edit__\\$calculatedExpression"]').click();
    await PWUtils.expandExpressionItemVariablesSection(page);
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);
    await expect(page.locator('#variable-label-0')).toHaveValue('a');
    await expect(page.locator('#variable-type-0')).toHaveValue('simple');
    await expect(page.locator('input#simple-expression-0')).toHaveValue('1');
    await expect(page.locator('#variable-label-1')).toHaveValue('b');
    await expect(page.locator('#variable-type-1')).toHaveValue('simple');
    await expect(page.locator('input#simple-expression-1')).toHaveValue('2');
  });

  test('should keep "Type initial value" visible after populating "Initial compute value" expression and toggling "Create answer list"', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Initial compute value');
    await PWUtils.selectDataType(page, 'integer');

    await computeInitialLabel.click();
    await page.locator('[id^="edit__\\$initialExpression"]').click();
    await PWUtils.expandExpressionItemVariablesSection(page);
    const dialog = page.locator('#expression-editor-base-dialog');
    const addVariableBtn = dialog.locator('#add-variable');
    await expect(dialog).toBeVisible({ timeout: 30000 });
    await addVariableBtn.waitFor({ state: 'visible', timeout: 30000 });
    await addVariableBtn.click();
    await page.locator('#variable-label-0').fill('a');
    await page.locator('#variable-type-0').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-0').fill('1');
    await addVariableBtn.click();
    await page.locator('#variable-label-1').fill('b');
    await page.locator('#variable-type-1').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-1').fill('2');
    await page.locator('textarea#final-expression').fill('%a + %b');
    await page.locator('#export').click();
    await expect(page.locator('[id^="__\\$initialExpression"]')).toHaveValue('%a + %b');

    await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
    await PWUtils.clickRadioButton(page, 'Create answer list', 'No');

    await expect(await PWUtils.getRadioButton(page, 'Value method', 'Type initial value')).toBeVisible();
  });

  test('should keep "Type initial value" visible after populating "Continuously compute value" expression and switching to another item and back', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Continuously compute value');
    await PWUtils.selectDataType(page, 'integer');

    await computeContinuouslyLabel.click();
    await page.locator('[id^="edit__\\$calculatedExpression"]').click();
    await PWUtils.expandExpressionItemVariablesSection(page);
    const dialog = page.locator('#expression-editor-base-dialog');
    const addVariableBtn = dialog.locator('#add-variable');
    await expect(dialog).toBeVisible({ timeout: 30000 });
    await addVariableBtn.waitFor({ state: 'visible', timeout: 30000 });
    await addVariableBtn.click();
    await page.locator('#variable-label-0').fill('a');
    await page.locator('#variable-type-0').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-0').fill('1');
    await addVariableBtn.click();
    await page.locator('#variable-label-1').fill('b');
    await page.locator('#variable-type-1').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-1').fill('2');
    await page.locator('textarea#final-expression').fill('%a + %b');
    await page.locator('#export').click();
    await expect(page.locator('[id^="__\\$calculatedExpression"]')).toHaveValue('%a + %b');

    await PWUtils.clickTreeNode(page, 'None');
    await computeContinuouslyLabel.scrollIntoViewIfNeeded();
    await computeContinuouslyLabel.click();

    await expect(await PWUtils.getRadioButton(page, 'Value method', 'Type initial value')).toBeVisible();
  });

  test('should retain value or expression when switching between value methods', async ({ page }) => {
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();

    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Test switching value methods');
    await PWUtils.selectDataType(page, 'decimal');

    const computeInitial = valueMethod.locator('[for^="__$valueMethod_compute-initial"]');
    await computeInitialLabel.click();
    await page.locator('[id^="edit__\\$initialExpression"]').click();
    await PWUtils.expandExpressionItemVariablesSection(page);
    const dialog = page.locator('#expression-editor-base-dialog');
    const addVariableBtn = dialog.locator('#add-variable');
    await expect(dialog).toBeVisible({ timeout: 30000 });
    await addVariableBtn.waitFor({ state: 'visible', timeout: 30000 });

    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

    await addVariableBtn.click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
    await page.locator('#variable-label-0').fill('a');
    await page.locator('#variable-type-0').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-0').fill('1');

    await addVariableBtn.click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);
    await page.locator('#variable-label-1').fill('b');
    await page.locator('#variable-type-1').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-1').fill('2');

    await page.locator('textarea#final-expression').fill('%a + %b');
    const previewLines = page.locator('lhc-syntax-preview>div>div>pre');
    const count = await previewLines.count();
    for (let i = 0; i < count; i++) {
      await expect(previewLines.nth(i)).not.toHaveText('Not valid');
    }
    await page.locator('#export').click();
    await expect(page.locator('[id^="__\\$initialExpression"]')).toHaveValue('%a + %b');

    const initialJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(initialJson.item[7].extension).toMatchObject([
      { url: 'http://hl7.org/fhir/StructureDefinition/variable' },
      { url: 'http://hl7.org/fhir/StructureDefinition/variable' },
      {
        url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression',
        valueExpression: {
          language: 'text/fhirpath',
          expression: '%a + %b'
        }
      }
    ]);

    // Switch to Type Initial
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    await page.locator('[id^="initial.0.valueDecimal"]').fill('33');
    await page.locator('[id^="initial.0.valueDecimal"]').press('Enter');

    const typeInitialJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(typeInitialJson.item[7].initial).toEqual([{ valueDecimal: 33 }]);
    expect(typeInitialJson.item[7].extension).toHaveLength(2);
    expect(typeInitialJson.item[7].extension[0].url).toBe('http://hl7.org/fhir/StructureDefinition/variable');
    expect(typeInitialJson.item[7].extension[1].url).toBe('http://hl7.org/fhir/StructureDefinition/variable');

    // Switch to Continuously compute value
    await PWUtils.clickRadioButton(page, 'Value method', 'Continuously compute value');

    await expect(page.locator('[id^="__\\$calculatedExpression"]')).toHaveValue('%a + %b');
    const continuousJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(continuousJson.item[7].initial).toBeUndefined();
    expect(continuousJson.item[7].extension.find((e: any) => e.url.includes('calculatedExpression'))?.valueExpression.expression).toBe('%a + %b');

    // Switch back to Compute initial
    await computeInitial.click();
    await expect(page.locator('[id^="__\\$initialExpression"]')).toHaveValue('%a + %b');
    const computeInitialJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(computeInitialJson.item[7].extension[2]).toMatchObject({
      url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression',
      valueExpression: { language: 'text/fhirpath', expression: '%a + %b' }
    });

    // Switch to None
    await PWUtils.clickRadioButton(page, 'Value method', 'None');

    const noneJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(noneJson.item[7].extension).toHaveLength(2);
    expect(noneJson.item[7].extension[0].url).toBe('http://hl7.org/fhir/StructureDefinition/variable');
    expect(noneJson.item[7].extension[1].url).toBe('http://hl7.org/fhir/StructureDefinition/variable');

    // Switch to Pick initial value (coding)
    await PWUtils.selectDataType(page, 'coding');
    await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
    await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
    await PWUtils.clickRadioButton(page, 'Answer list layout', 'Drop down');
    await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');
    await PWUtils.clickRadioButton(page, 'Value method', 'Pick initial value');

    const pickInput = page.locator('[id^="pick-answer_"]');
    await expect(pickInput).toBeVisible();
    await expect(pickInput).toHaveClass(/invalid/);
    await expect(page.locator('lfb-pick-answer small.text-danger')).toBeVisible();

    const addAnswerButton = page.locator('button:has-text("Add another answer")');

    await PWUtils.addCodingAnswerOptions(page, addAnswerButton,
      [
        { system: 'http://loinc.org', display: 'Example 1', code: 'MD11871-1', __$score: null },
        { system: 'http://loinc.org', display: 'Example 2', code: 'MD11871-2', __$score: null },
        { system: 'http://loinc.org', display: 'Example 3', code: 'MD11871-3', __$score: null }
      ]
    );

    await page.locator('[id^="answerOption.2.valueCoding.__$score"]').click();

    await expect(pickInput).not.toHaveClass(/invalid/);
    await expect(page.locator('lfb-pick-answer small.text-danger')).not.toBeVisible();

    await PWUtils.selectAutocompleteOptions(
      page,
      '[id^="pick-answer_"]',
      true,
      null,
      3,
      ['ArrowDown', 'ArrowDown', 'Enter'],
      'Example 2'
    );

    const pickJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(pickJson.item[7].type).toBe('coding');
    expect(pickJson.item[7].answerOption[1].initialSelected).toBe(true);

    // Switch to Continuously compute value again
    await PWUtils.clickRadioButton(page, 'Value method', 'Continuously compute value');

    await expect(page.locator('[id^="__\\$calculatedExpression"]')).toHaveValue('%a + %b');
    const finalJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    const calcExt = finalJson.item[7].extension.find((e: any) => e.url.endsWith('calculatedExpression'));
    expect(calcExt?.valueExpression?.expression).toBe('%a + %b');
    const itemControlExt = finalJson.item[7].extension.find((e: any) => e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl');
    expect(itemControlExt?.valueCodeableConcept?.coding?.[0]?.code).toBe('drop-down');
  });
});


test.describe('Value method button selection', () => {
  let mainPO: MainPO;
  let fileJson: any;
  let valueMethod: Locator;
  let computeInitialRadio: Locator;
  let computeContinuouslyRadio: Locator;
  let noneRadio: Locator;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();

    fileJson = await PWUtils.uploadFile(page, 'value-methods-button-selection-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');

    valueMethod = page.locator('lfb-value-method').first();
    await valueMethod.waitFor({ state: 'visible', timeout: 40000 });
    await expect(valueMethod).toBeVisible();

    noneRadio = valueMethod.locator('[id^="__$valueMethod_none"]');
  });

  test('should display the appropriate value method option based on the data', async ({ page }) => {
    await PWUtils.expectDataTypeValue(page, /boolean/);

    const pickInitialRadio = valueMethod.locator('[id^="__$valueMethod_pick-initial"]');
    await expect(pickInitialRadio).toBeVisible();
    await expect(pickInitialRadio).toBeChecked();

    const initialYesInput = page.locator('lfb-table').first().locator('input[id^="booleanRadio_true"]');
    await expect(initialYesInput).toBeVisible();
    await expect(initialYesInput).toBeChecked();

    await PWUtils.clickTreeNode(page, 'decimal_type');
    await PWUtils.expectDataTypeValue(page, /decimal/);
    const typeInitialRadio = valueMethod.locator('[id^="__$valueMethod_type-initial"]');
    await expect(typeInitialRadio).toBeVisible();
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueDecimal"]')).toHaveValue('3.2');

    await PWUtils.clickTreeNode(page, 'integer_type-answerlist_no');
    await PWUtils.expectDataTypeValue(page, /integer/);
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueInteger"]')).toHaveValue('5');

    await PWUtils.clickTreeNode(page, 'integer_type-answerlist_yes');
    await PWUtils.expectDataTypeValue(page, /integer/);
    await expect(pickInitialRadio).toBeChecked();
    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await expect(page.locator('[id^="pick-answer_"]')).toHaveValue('2');

    await PWUtils.clickTreeNode(page, 'date_type-answerlist_no');
    await PWUtils.expectDataTypeValue(page, /date/);
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueDate"]')).toHaveValue('2024-03-03');

    await PWUtils.clickTreeNode(page, 'date_type-answerlist_yes');
    await PWUtils.expectDataTypeValue(page, /date/);
    await expect(pickInitialRadio).toBeChecked();
    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(2);
    await expect(page.locator('[id^="pick-answer_"]')).toHaveValue('2024-01-02');

    await PWUtils.clickTreeNode(page, 'dateTime_type');
    await PWUtils.expectDataTypeValue(page, /dateTime/);
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueDateTime"]')).toHaveValue('2024-03-03 07:01:01 AM');

    await PWUtils.clickTreeNode(page, 'time_type-answerlist_no');
    await PWUtils.expectDataTypeValue(page, /time/);
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueTime"]')).toHaveValue('01:01:01');

    await PWUtils.clickTreeNode(page, 'time_type-answerlist_yes');
    await PWUtils.expectDataTypeValue(page, /time/);
    await expect(pickInitialRadio).toBeChecked();
    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(2);
    await expect(page.locator('[id^="pick-answer_"]')).toHaveValue('02:01:01');

    await PWUtils.clickTreeNode(page, 'string_type-answerlist_no');
    await PWUtils.expectDataTypeValue(page, /string/);
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueString"]')).toHaveValue('abcd');

    await PWUtils.clickTreeNode(page, 'string_type-answerlist_yes');
    await PWUtils.expectDataTypeValue(page, /string/);
    await expect(pickInitialRadio).toBeChecked();
    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(2);
    await expect(page.locator('[id^="pick-answer_"]')).toHaveValue('def');

    await PWUtils.clickTreeNode(page, 'text_type-answerlist_no');
    await PWUtils.expectDataTypeValue(page, /text/);
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueString"]')).toHaveValue('abcd');

    await PWUtils.clickTreeNode(page, 'text_type-answerlist_yes');
    await PWUtils.expectDataTypeValue(page, /text/);
    await expect(pickInitialRadio).toBeChecked();
    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(2);
    await expect(page.locator('[id^="pick-answer_"]')).toHaveValue('def');

    await PWUtils.clickTreeNode(page, 'url_type');
    await PWUtils.expectDataTypeValue(page, /url/);
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueUri"]')).toHaveValue('http://www.test.org');

    await PWUtils.clickTreeNode(page, 'coding_type-answerlist_no');
    await PWUtils.expectDataTypeValue(page, /coding/);
    await expect(noneRadio).toBeChecked();

    await PWUtils.clickTreeNode(page, 'coding_type-answerlist_yes');
    await PWUtils.expectDataTypeValue(page, /coding/);
    await expect(pickInitialRadio).toBeChecked();
    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await expect(page.locator('[id^="pick-answer_"]')).toHaveValue('a2');

    await PWUtils.clickTreeNode(page, 'quantity_type');
    await PWUtils.expectDataTypeValue(page, /quantity/);
    await expect(typeInitialRadio).toBeChecked();
    await expect(page.locator('[id^="initial.0.valueQuantity.value"]')).toHaveValue('3');
  });
});
