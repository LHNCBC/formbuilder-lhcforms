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

    await page.selectOption('#type', {label: 'coding'});
    await page.getByRole('radiogroup', {name: 'Create answer list'}).getByText('Yes').click();
    await page.getByRole('radiogroup', {name: 'Answer constraint'}).getByText('Restrict to the list').click();

    const table = page.locator('lfb-answer-option table');
    // Load a table with data
    await mainPO.loadTable(table, tableData);
    await expect(PWUtils.getTableCell(table, 1, 6).locator(removeLoc)).toBeVisible();
    // First row should not have move up button
    await expect(PWUtils.getTableCell(table, 1, 6).locator(moveUpLoc)).not.toBeVisible();
    await expect(PWUtils.getTableCell(table, 1, 6).locator(moveDownLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 1, 6).locator(moveDownLoc)).toBeEnabled();

    await expect(PWUtils.getTableCell(table, 2, 6).locator(removeLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 2, 6).locator(moveUpLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 2, 6).locator(moveUpLoc)).toBeEnabled();
    await expect(PWUtils.getTableCell(table, 2, 6).locator(moveDownLoc)).toBeEnabled();
    await expect(PWUtils.getTableCell(table, 2, 6).locator(moveDownLoc)).toBeVisible();

    await expect(PWUtils.getTableCell(table, 3, 6).locator(removeLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 6).locator(moveUpLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 6).locator(moveUpLoc)).toBeEnabled();
    await expect(PWUtils.getTableCell(table, 3, 6).locator(moveDownLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 6).locator(moveDownLoc)).toBeEnabled();

    await expect(PWUtils.getTableCell(table, 4, 6).locator(removeLoc)).toBeVisible();
    // Last row should not have move down button
    await expect(PWUtils.getTableCell(table, 4, 6).locator(moveDownLoc)).not.toBeVisible();
    await expect(PWUtils.getTableCell(table, 4, 6).locator(moveUpLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 4, 6).locator(moveUpLoc)).toBeEnabled();


    await PWUtils.getTableCell(table, 2, 5).locator('input').click();
    await PWUtils.getTableCell(table, 2, 6).locator(moveUpLoc).click();

    await expect(PWUtils.getTableCell(table, 1, 1).locator('input')).toHaveValue('2a');
    await expect(PWUtils.getTableCell(table, 1, 2).locator('input')).toHaveValue('2b');
    await expect(PWUtils.getTableCell(table, 1, 3).locator('input')).toHaveValue('2c');
    await expect(PWUtils.getTableCell(table, 1, 4).locator('input')).toHaveValue('2');
    await expect(PWUtils.getTableCell(table, 1, 5).locator('input')).toBeChecked();
    await expect(PWUtils.getTableCell(table, 2, 1).locator('input')).toHaveValue('1a');
    await expect(PWUtils.getTableCell(table, 2, 2).locator('input')).toHaveValue('1b');
    await expect(PWUtils.getTableCell(table, 2, 3).locator('input')).toHaveValue('1c');
    await expect(PWUtils.getTableCell(table, 2, 4).locator('input')).toHaveValue('1');
    await expect(PWUtils.getTableCell(table, 2, 5).locator('input')).not.toBeChecked();
    await PWUtils.getTableCell(table, 2, 6).locator(moveDownLoc).click();
    await expect(PWUtils.getTableCell(table, 3, 1).locator('input')).toHaveValue('1a');
    await expect(PWUtils.getTableCell(table, 3, 2).locator('input')).toHaveValue('1b');
    await expect(PWUtils.getTableCell(table, 3, 3).locator('input')).toHaveValue('1c');
    await expect(PWUtils.getTableCell(table, 3, 4).locator('input')).toHaveValue('1');
    await expect(PWUtils.getTableCell(table, 3, 5).locator('input')).not.toBeChecked();

    await expect(PWUtils.getTableCell(table, 2, 1).locator('input')).toHaveValue('3a');
    await expect(PWUtils.getTableCell(table, 2, 2).locator('input')).toHaveValue('3b');
    await expect(PWUtils.getTableCell(table, 2, 3).locator('input')).toHaveValue('3c');
    await expect(PWUtils.getTableCell(table, 2, 4).locator('input')).toHaveValue('3');
    await expect(PWUtils.getTableCell(table, 2, 5).locator('input')).not.toBeChecked();

    await PWUtils.getTableCell(table, 2, 6).locator(removeLoc).click();

    await expect(PWUtils.getTableCell(table, 2, 1).locator('input')).toHaveValue('1a');
    await expect(PWUtils.getTableCell(table, 2, 2).locator('input')).toHaveValue('1b');
    await expect(PWUtils.getTableCell(table, 2, 3).locator('input')).toHaveValue('1c');
    await expect(PWUtils.getTableCell(table, 2, 4).locator('input')).toHaveValue('1');
    await expect(PWUtils.getTableCell(table, 2, 5).locator('input')).not.toBeChecked();

    await expect(PWUtils.getTableCell(table, 3, 1).locator('input')).toHaveValue('4a');
    await expect(PWUtils.getTableCell(table, 3, 2).locator('input')).toHaveValue('4b');
    await expect(PWUtils.getTableCell(table, 3, 3).locator('input')).toHaveValue('4c');
    await expect(PWUtils.getTableCell(table, 3, 4).locator('input')).toHaveValue('4');
    await expect(PWUtils.getTableCell(table, 3, 5).locator('input')).not.toBeChecked();

    await expect(PWUtils.getTableCell(table, 3, 6).locator(moveDownLoc)).not.toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 6).locator(moveUpLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 6).locator(moveUpLoc)).toBeEnabled();

    // Add a new row (5th) at the end. It is empty to start with.
    await table.locator('..').getByRole(`button`, {name: 'Add'}).click();

    // Move down button on 4th row should be visible and disabled.
    await expect(PWUtils.getTableCell(table, 3, 6).locator(moveDownLoc)).toBeVisible();
    await expect(PWUtils.getTableCell(table, 3, 6).locator(moveDownLoc)).toBeDisabled();
    await expect(PWUtils.getTableCell(table, 4, 6).locator(moveDownLoc)).not.toBeVisible();
    await expect(PWUtils.getTableCell(table, 4, 6).locator(moveUpLoc)).toBeDisabled();

    await PWUtils.getTableCell(table, 4, 1).locator('input').fill('xx');
    await expect(PWUtils.getTableCell(table, 3, 6).locator(moveDownLoc)).toBeEnabled();
    await expect(PWUtils.getTableCell(table, 4, 6).locator(moveUpLoc)).toBeEnabled();

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
    await page.selectOption('#type', {label: 'coding'});
    await page.getByRole('radiogroup', {name: 'Create answer list'}).getByText('Yes').click();
    await page.getByRole('radiogroup', {name: 'Answer constraint'}).getByText('Restrict to the list').click();
    // await page.getByLabel('Allow repeating question?').getByText('Yes').click();
    await page.getByRole('radiogroup', {name: 'Allow repeating question?'}).getByText('Yes').click();
    // Load a table with data
    await mainPO.loadTable(table, tableData);

    await PWUtils.getTableCell(table, 1, 5).locator('input').click();
    await PWUtils.getTableCell(table, 4, 5).locator('input').click();

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

    await PWUtils.getTableCell(table, 1, 6).locator(moveDownLoc).click();
    await PWUtils.getTableCell(table, 4, 6).locator(moveUpLoc).click();
    await PWUtils.getTableCell(table, 2, 6).locator(moveDownLoc).click();

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
