import {test, expect} from '@playwright/test';
import {MainPO} from "./po/main-po";
import {PWUtils} from "./pw-utils";

test.describe('Table component', async () => {

  const removeLoc = `button[aria-label="Remove this row"]`;
  const moveUpLoc = `button[aria-label="Move this row up"]`;
  const moveDownLoc = `button[aria-label="Move this row down"]`;
  const tableData = [
    ['1a', '1b', '1c', '1'],
    ['2a', '2b', '2c', '2'],
    ['3a', '3b', '3c', '3'],
    ['4a', '4b', '4c', '4']
  ];

  test.beforeEach(async ({page}) => {
      await page.goto('/');
      const mainPO = new MainPO(page);
      await mainPO.loadILPage();
    });

  test('should display actions of remove, move up/down of rows with radio selection', async ({page}) => {
    const mainPO = new MainPO(page);

    await page.getByLabel('Data type', {exact: true}).selectOption({label: 'coding'});
    await page.getByRole('radiogroup', {name: 'Create answer list'}).getByText('Yes').click();
    await page.getByRole('radiogroup', {name: 'Answer constraint'}).getByText('Restrict to the list').click();

    const table = page.locator('lfb-answer-option table');
    // Load a table with data
    await mainPO.loadTable(table, tableData);
    await expect(PWUtils.getTableCell(table, 1, 5).locator(removeLoc)).toBeVisible();
    // First row should not have move up button
    await expect(PWUtils.getTableCell(table, 1, 5).locator(moveUpLoc)).not.toBeVisible();
    await expect(PWUtils.getTableCell(table, 1, 5).locator(moveDownLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 1, 5).locator(moveDownLoc)).toBeEnabled();

    await expect(PWUtils.getTableCell(table, 2, 5).locator(removeLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 2, 5).locator(moveUpLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 2, 5).locator(moveUpLoc)).toBeEnabled();
    await expect(PWUtils.getTableCell(table, 2, 5).locator(moveDownLoc)).toBeEnabled();
    await expect(PWUtils.getTableCell(table, 2, 5).locator(moveDownLoc)).toBeVisible();

    await expect(PWUtils.getTableCell(table, 3, 5).locator(removeLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 5).locator(moveUpLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 5).locator(moveUpLoc)).toBeEnabled();
    await expect(PWUtils.getTableCell(table, 3, 5).locator(moveDownLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 5).locator(moveDownLoc)).toBeEnabled();

    await expect(PWUtils.getTableCell(table, 4, 5).locator(removeLoc)).toBeVisible();
    // Last row should not have move down button
    await expect(PWUtils.getTableCell(table, 4, 5).locator(moveDownLoc)).not.toBeVisible();
    await expect(PWUtils.getTableCell(table, 4, 5).locator(moveUpLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 4, 5).locator(moveUpLoc)).toBeEnabled();

    // Click on the Value Method - Pick Initial option
    await page.locator('[for*="valueMethod_pick-initial"]').click();
    // The Pick Initial drop-down is displayed, select the '2a'
    const pickInitial = page.locator('lfb-pick-answer >> input[type="text"]');
    await pickInitial.click();
    const initialValues = await page.locator('#completionOptions > ul > li');
    await expect(initialValues).toHaveCount(4);
    await pickInitial.press('ArrowDown');
    await pickInitial.press('ArrowDown');
    await pickInitial.press('Enter');
    await expect(pickInitial).toHaveValue('2a');

    await PWUtils.getTableCell(table, 2, 5).locator(moveUpLoc).click();

    await expect(PWUtils.getTableCell(table, 1, 1).locator('input')).toHaveValue('2a');
    await expect(PWUtils.getTableCell(table, 1, 2).locator('input')).toHaveValue('2b');
    await expect(PWUtils.getTableCell(table, 1, 3).locator('input')).toHaveValue('2c');
    await expect(PWUtils.getTableCell(table, 1, 4).locator('input')).toHaveValue('2');

    await expect(PWUtils.getTableCell(table, 2, 1).locator('input')).toHaveValue('1a');
    await expect(PWUtils.getTableCell(table, 2, 2).locator('input')).toHaveValue('1b');
    await expect(PWUtils.getTableCell(table, 2, 3).locator('input')).toHaveValue('1c');
    await expect(PWUtils.getTableCell(table, 2, 4).locator('input')).toHaveValue('1');

    await PWUtils.getTableCell(table, 2, 5).locator(moveDownLoc).click();
    await expect(PWUtils.getTableCell(table, 3, 1).locator('input')).toHaveValue('1a');
    await expect(PWUtils.getTableCell(table, 3, 2).locator('input')).toHaveValue('1b');
    await expect(PWUtils.getTableCell(table, 3, 3).locator('input')).toHaveValue('1c');
    await expect(PWUtils.getTableCell(table, 3, 4).locator('input')).toHaveValue('1');

    await expect(PWUtils.getTableCell(table, 2, 1).locator('input')).toHaveValue('3a');
    await expect(PWUtils.getTableCell(table, 2, 2).locator('input')).toHaveValue('3b');
    await expect(PWUtils.getTableCell(table, 2, 3).locator('input')).toHaveValue('3c');
    await expect(PWUtils.getTableCell(table, 2, 4).locator('input')).toHaveValue('3');

    await PWUtils.getTableCell(table, 2, 5).locator(removeLoc).click();

    await expect(PWUtils.getTableCell(table, 2, 1).locator('input')).toHaveValue('1a');
    await expect(PWUtils.getTableCell(table, 2, 2).locator('input')).toHaveValue('1b');
    await expect(PWUtils.getTableCell(table, 2, 3).locator('input')).toHaveValue('1c');
    await expect(PWUtils.getTableCell(table, 2, 4).locator('input')).toHaveValue('1');

    await expect(PWUtils.getTableCell(table, 3, 1).locator('input')).toHaveValue('4a');
    await expect(PWUtils.getTableCell(table, 3, 2).locator('input')).toHaveValue('4b');
    await expect(PWUtils.getTableCell(table, 3, 3).locator('input')).toHaveValue('4c');
    await expect(PWUtils.getTableCell(table, 3, 4).locator('input')).toHaveValue('4');

    await expect(PWUtils.getTableCell(table, 3, 5).locator(moveDownLoc)).not.toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 5).locator(moveUpLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 5).locator(moveUpLoc)).toBeEnabled();

    // Add a new row (5th) at the end. It is empty to start with.
    await table.locator('..').getByRole(`button`, {name: 'Add'}).click();

    // Move down button on 4th row should be visible and disabled.
    await expect(PWUtils.getTableCell(table, 3, 5).locator(moveDownLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 5).locator(moveDownLoc)).toBeDisabled();
    await expect(PWUtils.getTableCell(table, 4, 5).locator(moveDownLoc)).not.toBeVisible();
    await expect(PWUtils.getTableCell(table, 4, 5).locator(moveUpLoc)).toBeDisabled();

    await PWUtils.getTableCell(table, 4, 1).locator('input').fill('xx');
    await expect(PWUtils.getTableCell(table, 3, 5).locator(moveDownLoc)).toBeEnabled();
    await expect(PWUtils.getTableCell(table, 4, 5).locator(moveUpLoc)).toBeEnabled();

    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[0].answerOption).toEqual([
      {
        valueCoding: {display: '2a', code: '2b', system: '2c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 2
        }],
        initialSelected: true
      },
      {
        valueCoding: {display: '1a', code: '1b', system: '1c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 1
        }]
      },
      {
        valueCoding: {display: '4a', code: '4b', system: '4c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 4
        }]
      },
      {
        valueCoding: {display: 'xx'}
      }
    ]);
  });

  test('should display actions of remove, move up/down of rows with checkbox selections', async ({page}) => {
    const mainPO = new MainPO(page);

    const table = page.locator('lfb-answer-option table');
    await page.getByLabel('Data type', {exact: true}).selectOption({label: 'coding'});
    await page.getByRole('radiogroup', {name: 'Create answer list'}).getByText('Yes').click();
    await page.getByRole('radiogroup', {name: 'Answer constraint'}).getByText('Restrict to the list').click();
    // await page.getByLabel('Allow repeating question?').getByText('Yes').click();
    await page.getByRole('radiogroup', {name: 'Allow repeating question?'}).getByText('Yes').click();
    
    // Click on the Value Method - Pick Initial option
    await page.locator('[for*="valueMethod_pick-initial"]').click();
    
    // Load a table with data
    await mainPO.loadTable(table, tableData);

    // The Pick Initial drop-down is displayed
    const pickInitial = page.locator('lfb-pick-answer >> input[type="text"]');
    await pickInitial.click();

    const autoCompInitials = page.locator('span#completionOptions > ul > li')
    await expect(autoCompInitials).toHaveCount(4);

    // Select '1a'
    await pickInitial.press('ArrowDown');
    await pickInitial.press('Enter');

    let pickInitials = page.locator('span.autocomp_selected > ul > li');
    await expect(pickInitials).toHaveCount(1);
    await expect(pickInitials.nth(0)).toHaveText('×1a');

    // Select '4a'
    await pickInitial.click();
    await pickInitial.press('ArrowDown');
    await pickInitial.press('ArrowDown');
    await pickInitial.press('Enter');

    pickInitials = page.locator('span.autocomp_selected > ul > li');
    await expect(pickInitials).toHaveCount(2);
    await expect(pickInitials.nth(0)).toHaveText('×1a');
    await expect(pickInitials.nth(1)).toHaveText('×4a');

    let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[0].answerOption).toEqual([
      {
        valueCoding: {display: '1a', code: '1b', system: '1c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 1
        }],
        initialSelected: true
      },
      {
        valueCoding: {display: '2a', code: '2b', system: '2c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 2
        }]
      },
      {
        valueCoding: {display: '3a', code: '3b', system: '3c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 3
        }]
      },
      {
        valueCoding: {display: '4a', code: '4b', system: '4c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 4
        }],
        initialSelected: true
      }
    ]);

    await PWUtils.getTableCell(table, 1, 5).locator(moveDownLoc).click();
    await PWUtils.getTableCell(table, 4, 5).locator(moveUpLoc).click();
    await PWUtils.getTableCell(table, 2, 5).locator(moveDownLoc).click();

    q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(q.item[0].answerOption).toEqual([
      {
        valueCoding: {display: '2a', code: '2b', system: '2c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 2
        }]
      },
      {
        valueCoding: {display: '4a', code: '4b', system: '4c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 4
        }],
        initialSelected: true
      },
      {
        valueCoding: {display: '1a', code: '1b', system: '1c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 1
        }],
        initialSelected: true
      },
      {
        valueCoding: {display: '3a', code: '3b', system: '3c'},
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/itemWeight",
          valueDecimal: 3
        }]
      },
    ]);
  });
});
