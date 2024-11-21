import {test, expect} from '@playwright/test';
import {MainPO} from "./po/main-po";
import {PWUtils} from "./pw-utils";

test.describe('Table component', async () => {

    test.beforeEach(async ({page}) => {
      await page.goto('/');
      const mainPO = new MainPO(page);
      await mainPO.loadILPage();
    });

    test('should display table with data', async ({page}) => {
      const mainPO = new MainPO(page);
      const tableData = [['1a', '1b', '1c', '1'], ['2a', '2b', '2c', '2'], ['3a', '3b', '3c', '3'], ['4a', '4b', '4c', '4']];

      await page.selectOption('#type', {label: 'choice'});
      const table = page.locator('lfb-answer-option table');
      // Load a table with data
      await mainPO.loadTable(table, tableData);

      const removeLoc = `button[aria-label="Remove this row"]`;
      const moveUpLoc = `button[aria-label="Move this row up"]`;
      const moveDownLoc = `button[aria-label="Move this row down"]`;
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
    });
});
