import {test, expect, Locator} from '@playwright/test';
import {MainPO} from "./po/main-po";
import {PWUtils} from "./pw-utils";
import fhir from "fhir/r4";

test.describe('Contained resources table in form level page', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
    await page.getByRole('button', {name: 'Advanced fields'}).click();
  });

  test('should add a resource', async ({page}) => {
    const containedTable: Locator = PWUtils.getTableByFieldLabel(
      page.locator('lfb-form-fields'),
      'Contained resources'
    );
    await page.getByRole('button', {name: 'Add new ValueSet'}).click();
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Id', {exact: true}).fill('vs1');
    await dialog.getByLabel('Title', {exact: true}).fill('A title');
    const status = dialog.getByLabel('Status', {exact: true});
    await expect(status.getByRole('radio', {name: 'draft'})).toBeChecked(); // default
    await status.locator('label:has-text("active")').click();
    const table = PWUtils.getTableByFieldLabel(dialog, 'Contains');
    const addButton = dialog.getByRole('button', {name: 'Add new row'});
    await PWUtils.getTableCellInput(table, 1, 1).fill('d1');
    await PWUtils.getTableCellInput(table, 1, 2).fill('c1');
    await PWUtils.getTableCellInput(table, 1, 3).fill('s1');
    await addButton.click();
    await PWUtils.getTableCellInput(table, 2, 1).fill('d2');
    await PWUtils.getTableCellInput(table, 2, 2).fill('c2');
    await PWUtils.getTableCellInput(table, 2, 3).fill('s2');
    await addButton.click();
    await PWUtils.getTableCellInput(table, 3, 1).fill('d3');
    await PWUtils.getTableCellInput(table, 3, 2).fill('c3');
    await PWUtils.getTableCellInput(table, 3, 3).fill('s3');

    await dialog.getByRole('button', {name: 'Advanced fields'}).click();

    await dialog.getByLabel('Version', {exact: true}).fill('A version');
    await dialog.getByLabel('Name', {exact: true}).fill('A name');
    await dialog.getByLabel('Description', {exact: true}).fill('A description');
    await dialog.getByLabel('Purpose', {exact: true}).fill('A purpose');

    await dialog.getByLabel('Publisher', {exact: true}).fill('A publisher');
    await dialog.getByLabel('Copyright', {exact: true}).fill('A copyright');

    await dialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(containedTable.locator('tbody > tr')).toHaveCount(1);
    await expect(PWUtils.getTableCell(containedTable, 1, 1).locator('input')).toHaveValue('ValueSet');
    await expect(PWUtils.getTableCell(containedTable, 1, 2).locator('input')).toHaveValue('vs1');
    await expect(PWUtils.getTableCell(containedTable, 1, 3).locator('input')).toHaveValue('A title');
    await expect(PWUtils.getTableCell(containedTable, 1, 4).locator('input'))
      .toHaveValue(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z/);
    await expect(PWUtils.getTableCell(containedTable, 1, 5).locator('input')).toHaveValue('active');

    // Verify it in JSON
    const json = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(json.contained).toBeDefined();
    expect(json.contained.length).toBe(1);
    const vs: fhir.ValueSet = json.contained[0] as fhir.ValueSet;
    expect(vs.resourceType).toBe('ValueSet');
    expect(vs.id).toBe('vs1');
    expect(vs.title).toBe('A title');
    expect(vs.status).toBe('active');
    expect(vs.version).toBe('A version');
    expect(vs.name).toBe('A name');
    expect(vs.description).toBe('A description');
    expect(vs.purpose).toBe('A purpose');
    expect(vs.publisher).toBe('A publisher');
    expect(vs.copyright).toBe('A copyright');
    expect(vs.expansion.contains).toStrictEqual([{
      code: 'c1',
      display: 'd1',
      system: 's1'
    }, {
      code: 'c2',
      display: 'd2',
      system: 's2'
    }, {
      code: 'c3',
      display: 'd3',
      system: 's3'
    }]);
  });
});

test.describe(() => {
  let mainPO: MainPO, fileJson;
  let flContainedTable: Locator;
  const editLoc = `button[aria-label="Edit this row"]`;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
    fileJson = await PWUtils.uploadFile(page, 'fixtures/contained-value-set-sample.json', false);
    flContainedTable = PWUtils.getTableByFieldLabel(
      page.locator('lfb-form-fields'),
      'Contained resources'
    );
    await page.getByRole('button', {name: 'Advanced fields'}).click();
  });
  test('should import questionnaire with contained value set', async({page}) => {
    expect(await flContainedTable.locator('tbody > tr').count()).toBe(3);
    await expect(PWUtils.getTableCell(flContainedTable, 3, 6).locator(editLoc)).toBeDisabled();
    await PWUtils.getTableCell(flContainedTable, 2, 6).locator(editLoc).click();
    const dialog = page.locator('mat-dialog-container');
    await dialog.waitFor({ state: 'visible' }); // Wait until the input is visible
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Id', {exact: true})).toHaveValue('vs2');

    await expect(dialog.getByLabel('Title', {exact: true})).toHaveValue('Title - Contained Value Set Two');
    const status = dialog.getByLabel('Status', {exact: true});
    await expect(status.getByRole('radio', {name: 'active'})).toBeChecked(); // default

    const containsTable = PWUtils.getTableByFieldLabel(dialog, 'Contains');
    await expect(PWUtils.getTableCellInput(containsTable, 1, 1)).toHaveValue('Code 21');
    await expect(PWUtils.getTableCellInput(containsTable, 1, 2)).toHaveValue('code21');
    await expect(PWUtils.getTableCellInput(containsTable, 2, 1)).toHaveValue('Code 22');
    await expect(PWUtils.getTableCellInput(containsTable, 2, 2)).toHaveValue('code22');

    await dialog.getByRole('button', {name: 'Advanced fields'}).click();

    await expect(dialog.getByLabel('Version', {exact: true})).toHaveValue('2.0.0');
    await expect(dialog.getByLabel('Name', {exact: true})).toHaveValue('Name - Contained Value Set Two');
    await expect(dialog.getByLabel('Description', {exact: true})).toHaveValue('Some description2');
    await expect(dialog.getByLabel('Purpose', {exact: true})).toHaveValue('Some purpose2');

    const metaTags = PWUtils.getTableByFieldLabel(dialog, 'Tags');
    await expect(PWUtils.getTableCellInput(metaTags, 1, 1)).toHaveValue('Example tag21');
    await expect(PWUtils.getTableCellInput(metaTags, 1, 2)).toHaveValue('example-tag21');
    await expect(PWUtils.getTableCellInput(metaTags, 1, 3)).toHaveValue('https://example21.org/tags');
    await expect(PWUtils.getTableCellInput(metaTags, 2, 1)).toHaveValue('Example tag22');
    await expect(PWUtils.getTableCellInput(metaTags, 2, 2)).toHaveValue('example-tag22');
    await expect(PWUtils.getTableCellInput(metaTags, 2, 3)).toHaveValue('https://example22.org/tags');

    await expect(dialog.getByLabel('Publisher', {exact: true})).toHaveValue('Some publisher2');
    await expect(dialog.getByLabel('Copyright', {exact: true})).toHaveValue('Some copyright2');

    // No changes made, should not trigger the alert dialog.
    await dialog.getByRole('button', {name: 'Discard changes'}).click();

    // Verify it in JSON
    const json = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(json.contained).toStrictEqual(fileJson.contained);
  });

  test('should validate resource.id', async({page}) => {
    await PWUtils.getTableCell(flContainedTable, 2, 6).locator(editLoc).click();
    const dialog = page.locator('.cdk-dialog-container');
    const idInput = dialog.getByLabel('Id', { exact: true });
    await idInput.waitFor({ state: 'visible' }); // Wait until the input is visible
    await expect(idInput).toBeVisible();
    const idParent = idInput.locator('..');
    await expect(idParent.filter({hasNot: page.locator('small.text-danger')})).toBeVisible();
    await expect(idInput).toHaveValue('vs2');
    await idInput.clear();
    await expect(idParent.filter({has: page.getByText('This field is required.')})).toBeVisible();

    await idInput.fill('vs1'); // Duplicate id
    await expect(idParent.filter({has: page.getByText('Id must be unique.')})).toBeVisible();
    await idInput.fill('#'); // Invalid id
    await expect(idParent.filter({
      has: page.getByText('Only alphanumeric, hyphen and period characters are allowed in this field.')
    })).toBeVisible();

    await dialog.getByRole('button', {name: 'Save and close'}).click();
    const alertDialog = page.getByRole('dialog', {name: 'Fix errors'});
    await expect(alertDialog).toBeVisible();
    await expect(alertDialog.getByText(/There are errors in the form./)).toBeVisible();
    await alertDialog.getByRole('button', {name: 'OK'}).click();
    await expect(alertDialog).not.toBeVisible();

    await idInput.clear();
    await idInput.fill('vs2-modified'); // Valid id
    await dialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(dialog).not.toBeVisible();
    await expect(flContainedTable.locator('tbody > tr')).toHaveCount(3);
    await expect(PWUtils.getTableCellInput(flContainedTable, 2, 2)).toHaveValue('vs2-modified');
  });
});
