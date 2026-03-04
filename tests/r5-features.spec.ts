import {test, expect, Locator} from '@playwright/test';
import {MainPO} from "./po/main-po";
import {PWUtils} from "./pw-utils";

test.describe('r5-features.spec.ts', async () => {
  let mainPO: MainPO;
  const constraintLabels = {
    optionsOnly: 'Restrict to the list',
    optionsOrType: 'Allow off list',
    optionsOrString: 'Allow free text'
  };
  const disabledDisplayLabels = {
    hidden: 'Hide',
    protected: 'Show as protected'
  }
  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();
  });

  test('should test answer constraint', async ({page}) => {
    // Unsupported type
    for (const listType of ['boolean', 'decimal', 'dateTime', 'url', 'quantity', 'group', 'display']) {
      await page.getByLabel('Data type', {exact: true}).selectOption({label: listType});
      await expect(page.locator('lfb-label label').getByText('Create answer list')).not.toBeVisible();
    }
    // Supported type
    for (const listType of ['integer', 'date', 'time', 'string', 'text', 'coding']) {
      await page.getByLabel('Data type', {exact: true}).selectOption({label: listType});
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');

      for(const constraintType of Object.keys(constraintLabels)) {
        await PWUtils.clickRadioButton(page, 'Answer constraint', constraintLabels[constraintType]);
        await expect(PWUtils.getRadioButton(page, 'Answer constraint', constraintLabels[constraintType])).toBeChecked();
        await page.waitForTimeout(100);
        let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
        expect(q.item[0].type).toBe(listType);
        expect(q.item[0].answerConstraint).toBe(constraintType);
      }
    }
  });

  test('should import form with answer constraints', async ({page}) => {
    const fileJson = await PWUtils.uploadFile(page, 'fixtures/answer-constraint-sample.json', true);
    await page.getByRole('button', {name: 'Edit questions'}).first().click();

    await PWUtils.clickTreeNode(page, 'Integer type, optionsOrType');
    await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('Integer type, optionsOrType');
    await expect(PWUtils.getRadioButton(page, 'Create answer list', 'Yes')).toBeChecked();
    await expect(PWUtils.getRadioButton(page, 'Answer constraint', 'Allow off list')).toBeChecked();
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(1) td:nth-child(1) input')).toHaveValue('1');

    await PWUtils.clickTreeNode(page, 'String type, optionsOrString');
    await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('String type, optionsOrString');
    await expect(PWUtils.getRadioButton(page, 'Create answer list', 'Yes')).toBeChecked();
    await expect(PWUtils.getRadioButton(page, 'Answer constraint', 'Allow free text')).toBeChecked();
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(1) td:nth-child(1) input')).toHaveValue('first');

    await PWUtils.clickTreeNode(page, 'Coding type, optionsOnly');
    await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('Coding type, optionsOnly');
    await expect(PWUtils.getRadioButton(page, 'Create answer list', 'Yes')).toBeChecked();
    await expect(PWUtils.getRadioButton(page, 'Answer constraint', 'Restrict to the list')).toBeChecked();
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(1) td:nth-child(1) input')).toHaveValue('s1');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(1) td:nth-child(2) input')).toHaveValue('First coding');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(1) td:nth-child(3) input')).toHaveValue('c1');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(2) td:nth-child(1) input')).toHaveValue('s2');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(2) td:nth-child(2) input')).toHaveValue('Second coding');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(2) td:nth-child(3) input')).toHaveValue('c2');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(3) td:nth-child(1) input')).toHaveValue('s3');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(3) td:nth-child(2) input')).toHaveValue('Third coding');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(3) td:nth-child(3) input')).toHaveValue('c3');

    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[0].answerConstraint).toEqual('optionsOrType');
    expect(q.item[0].type).toEqual('integer');
    expect(q.item[1].answerConstraint).toEqual('optionsOrString');
    expect(q.item[1].type).toEqual('string');
    expect(q.item[2].answerConstraint).toEqual('optionsOnly');
    expect(q.item[2].type).toEqual('coding');
    expect(q.item[0].answerOption).toEqual(fileJson.item[0].answerOption);
    expect(q.item[1].answerOption).toEqual(fileJson.item[1].answerOption);
    expect(q.item[2].answerOption).toEqual(fileJson.item[2].answerOption);
  });

  test('should test disabledDisplay', async ({page}) => {
    await page.getByRole('button', {name: 'Add new item', exact: true}).click();
    await page.getByRole('button', {name: 'Advanced fields'}).click();
    const elementLocatorInTable = (parent: Locator, row: number, col: number, selector: string)=> {
      return parent.locator(`table > tbody > tr:nth-child(${row}) > td:nth-child(${col}) ${selector}`);
    }

    await page.getByRole('radiogroup', {name: 'Conditional method'}).getByText('enableWhen condition and behavior').click();

    const parentEl = page.locator('lfb-enable-when');
    parentEl.locator('')
    await elementLocatorInTable(parentEl, 1, 1, 'input').click();
    // Get the first item in the auto-complete list
    // Empty selector returns the cell.
    await elementLocatorInTable(parentEl, 1, 1, '').locator('ngb-typeahead-window button:nth-child(1)').click();
    await elementLocatorInTable(parentEl, 1, 2, 'select').selectOption({label: '!='});
    await elementLocatorInTable(parentEl, 1, 3, 'input').fill('a');
    await parentEl.locator('button:text("Add another condition")').click();
    await elementLocatorInTable(parentEl, 2, 1, 'input').click();
    await elementLocatorInTable(parentEl, 2, 1, '').locator('ngb-typeahead-window button:nth-child(1)').click();
    await elementLocatorInTable(parentEl, 2, 2, 'select').selectOption({label: '!='});
    await elementLocatorInTable(parentEl, 2, 3, 'input').fill('b');

    for(const opt of Object.keys(disabledDisplayLabels)) {
      await PWUtils.clickRadioButton(page, 'Hide or show this item when', disabledDisplayLabels[opt]);
      const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[1].disabledDisplay).toBe(opt);
    }
  });

  test('should import a form with disabledDisplay', async ({page}) => {
    await PWUtils.uploadFile(page, 'fixtures/disabled-display-sample.json', true);
    await page.getByRole('button', {name: 'Edit questions'}).first().click();
    await page.getByRole('button', {name: 'Advanced fields'}).click();

    await PWUtils.clickTreeNode(page, 'Target 1');
    await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('Target 1');
    await expect(PWUtils.getRadioButton(page, 'Hide or show this item when', 'Hide')).toBeChecked();

    await PWUtils.clickTreeNode(page, 'Target 2');
    await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('Target 2');
    await expect(PWUtils.getRadioButton(page, 'Hide or show this item when', 'Show as protected')).toBeChecked();
    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[1].disabledDisplay).toBe('hidden');
    expect(q.item[2].disabledDisplay).toBe('protected');
  });

  test('should import items with answer list layout', async ({page}) => {
    await PWUtils.uploadFile(page, 'fixtures/answer-list-layout-sample.json', true);
    await page.getByRole('button', {name: 'Edit questions'}).first().click();

    await PWUtils.clickTreeNode(page, 'Integer type answer list layout');
    await expect(page.getByLabel('Data type', {exact: true})).toHaveValue(/integer/);
    await expect(PWUtils.getRadioButton(page, 'Create answer list', 'Yes')).toBeChecked();
    await expect(PWUtils.getRadioButton(page, 'Answer list layout', 'Drop down')).toBeChecked();

    await PWUtils.clickTreeNode(page, 'Date type answer list layout');
    await expect(page.getByLabel('Data type', {exact: true})).toHaveValue(/date/);
    await expect(PWUtils.getRadioButton(page, 'Create answer list', 'Yes')).toBeChecked();
    await expect(PWUtils.getRadioButton(page, 'Answer list layout', 'Check-box')).toBeChecked();

    await PWUtils.clickTreeNode(page, 'Time type answer list layout');
    await expect(page.getByLabel('Data type', {exact: true})).toHaveValue(/time/);
    await expect(PWUtils.getRadioButton(page, 'Create answer list', 'Yes')).toBeChecked();
    await expect(PWUtils.getRadioButton(page, 'Answer list layout', 'Radio Button')).toBeChecked();

    await PWUtils.clickTreeNode(page, 'Coding type answer list layout');
    await expect(page.getByLabel('Data type', {exact: true})).toHaveValue(/coding/);
    await expect(PWUtils.getRadioButton(page, 'Create answer list', 'Yes')).toBeChecked();
    await expect(PWUtils.getRadioButton(page, 'Answer list layout', 'Drop down')).toBeChecked();

    await PWUtils.clickTreeNode(page, 'String type answer list layout');
    await expect(page.getByLabel('Data type', {exact: true})).toHaveValue(/string/);
    await expect(PWUtils.getRadioButton(page, 'Create answer list', 'Yes')).toBeChecked();
    await expect(PWUtils.getRadioButton(page, 'Answer list layout', 'Radio Button')).toBeChecked();
  });

  test('should export to R4 and STU3 versions', async ({page}) => {
    const fileJson = await PWUtils.uploadFile(page, 'fixtures/answer-constraint-sample.json', true);
    await page.getByRole('button', {name: 'Edit questions'}).first().click();

    // R4
    const q4 = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');

    expect(q4.item[0].answerConstraint).toBeUndefined();
    expect(q4.item[0].type).toEqual('integer');
    expect(q4.item[0].answerOption).toEqual(fileJson.item[0].answerOption);
    expect(q4.item[1].answerConstraint).toBeUndefined();
    expect(q4.item[1].type).toEqual('string');
    expect(q4.item[1].answerOption).toEqual(fileJson.item[1].answerOption);
    expect(q4.item[2].answerConstraint).toBeUndefined();
    expect(q4.item[2].type).toEqual('choice');
    expect(q4.item[2].answerOption).toEqual(fileJson.item[2].answerOption);

    // STU3
    const q3 = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'STU3');

    expect(q3.item[0].answerConstraint).toBeUndefined();
    expect(q3.item[0].type).toEqual('integer');
    expect(q3.item[0].option).toEqual(fileJson.item[0].answerOption);
    expect(q3.item[1].answerConstraint).toBeUndefined();
    expect(q3.item[1].type).toEqual('string');
    expect(q3.item[1].option).toEqual(fileJson.item[1].answerOption);
    expect(q3.item[2].answerConstraint).toBeUndefined();
    expect(q3.item[2].type).toEqual('choice');
    expect(q3.item[2].option).toEqual(fileJson.item[2].answerOption);
  });

});
