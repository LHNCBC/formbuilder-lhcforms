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
      await page.selectOption('#type', {label: listType});
      await expect(page.getByRole('radiogroup', {name: 'Create answer list'})).not.toBeVisible();
    }
    // Supported type
    for (const listType of ['integer', 'date', 'time', 'string', 'text', 'coding']) {
      await page.selectOption('#type', {label: listType});
      await page.getByRole('radiogroup', {name: 'Create answer list'}).getByText('Yes').click()

      for(const constraintType of Object.keys(constraintLabels)) {
        await page.getByRole('radiogroup', {name: 'Answer constraint'}).getByText(constraintLabels[constraintType]).click();
        let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
        expect(q.item[0].type).toBe(listType);
        expect(q.item[0].answerConstraint).toBe(constraintType);
      }
    }
  });

  test('should import form with answer constraints', async ({page}) => {
    const fileJson = await PWUtils.uploadFile(page, 'fixtures/answer-constraint-sample.json', true);
    await page.getByRole('button', {name: 'Edit questions'}).click();

    await PWUtils.clickTreeNode(page, 'Integer type, optionsOrType');
    await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('Integer type, optionsOrType');
    await expect(page.getByRole('radiogroup', {name: 'Create answer list'}).getByText('Yes')).toBeChecked();
    await expect(page.getByRole('radiogroup', {name: 'Answer constraint'}).getByText('Allow off list')).toBeChecked();
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(1) td:nth-child(1) input')).toHaveValue('1');

    await PWUtils.clickTreeNode(page, 'String type, optionsOrString');
    await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('String type, optionsOrString');
    await expect(page.getByRole('radiogroup', {name: 'Create answer list'}).getByText('Yes')).toBeChecked();
    await expect(page.getByRole('radiogroup', {name: 'Answer constraint'}).getByText('Allow free text')).toBeChecked();
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(1) td:nth-child(1) input')).toHaveValue('first');

    await PWUtils.clickTreeNode(page, 'Coding type, optionsOnly');
    await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('Coding type, optionsOnly');
    await expect(page.getByRole('radiogroup', {name: 'Create answer list'}).getByText('Yes')).toBeChecked();
    await expect(page.getByRole('radiogroup', {name: 'Answer constraint'}).getByText('Restrict to the list')).toBeChecked();
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(1) td:nth-child(1) input')).toHaveValue('First coding');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(1) td:nth-child(2) input')).toHaveValue('c1');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(1) td:nth-child(3) input')).toHaveValue('s1');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(2) td:nth-child(1) input')).toHaveValue('Second coding');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(2) td:nth-child(2) input')).toHaveValue('c2');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(2) td:nth-child(3) input')).toHaveValue('s2');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(3) td:nth-child(1) input')).toHaveValue('Third coding');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(3) td:nth-child(2) input')).toHaveValue('c3');
    await expect(page.locator('lfb-answer-option table tbody tr:nth-child(3) td:nth-child(3) input')).toHaveValue('s3');

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
      await page.getByRole('radiogroup', {name: 'Hide or show this item when'}).getByText(disabledDisplayLabels[opt]).click();
      const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[1].disabledDisplay).toBe(opt);
    }
  });

  test('should import a form with disabledDisplay', async ({page}) => {
    const fileJson = await PWUtils.uploadFile(page, 'fixtures/disabled-display-sample.json', true);
    await page.getByRole('button', {name: 'Edit questions'}).click();
    await page.getByRole('button', {name: 'Advanced fields'}).click();

    await PWUtils.clickTreeNode(page, 'Target 1');
    await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('Target 1');
    await expect(page.getByRole('radiogroup', {name: 'Hide or show this item when'}).getByText('Hide')).toBeChecked();

    await PWUtils.clickTreeNode(page, 'Target 2');
    await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('Target 2');
    await expect(page.getByRole('radiogroup', {name: 'Hide or show this item when'}).getByText('Show as protected')).toBeChecked();
    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[1].disabledDisplay).toBe('hidden');
    expect(q.item[2].disabledDisplay).toBe('protected');
  });

  test('should import R4 version from local storage', async ({page}) => {
    const json = await PWUtils.readJSONFile('fixtures/local-storage-mock.R4.json');
    await page.evaluate((mockQ) => {
      window.localStorage.removeItem('state');
      window.localStorage.setItem('fhirQuestionnaire', JSON.stringify(mockQ));
    }, json);
    await page.goto('/');
    await page.getByLabel('Would you like to start from where you left off before?').click();
    await page.getByRole('button', {name: 'Continue'}).click();
    await page.getByRole('button', {name: 'Edit questions'}).click();
    await expect(page.getByLabel('Data type', {exact: true})).toHaveValue(/coding/);

    await expect(page.getByRole('radiogroup', {name: 'Create answer list'}).getByText('Yes')).toBeChecked();
    const helpString = /^A plain text instruction/;
    await expect(page.getByLabel('Help text', {exact: true})).toHaveValue(helpString);
    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].item[0].text).toMatch(helpString);
  });

  test('should export to R4 and STU3 versions', async ({page}) => {
    const fileJson = await PWUtils.uploadFile(page, 'fixtures/answer-constraint-sample.json', true);
    await page.getByRole('button', {name: 'Edit questions'}).click();

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
