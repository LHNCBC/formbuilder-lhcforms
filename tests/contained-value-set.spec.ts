import {test, expect, Locator} from '@playwright/test';
import {MainPO} from "./po/main-po";
import {PWUtils} from "./pw-utils";
import fhir from "fhir/r4";

test.describe('Contained resources table in form level page', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
    await PWUtils.clickButton(page, null, 'Advanced fields');
  });

  test('should add a resource', async ({page}) => {
    const containedTable: Locator = PWUtils.getTableByFieldLabel(
      page.locator('lfb-form-fields'),
      'Contained resources'
    );

    await PWUtils.clickButton(page, null, 'Add contained resource');
    await page.getByRole('button', {name: 'Create a ValueSet…'}).click();
    const dialog = page.locator('mat-dialog-container');
    await dialog.waitFor({ state: 'visible', timeout: 10000 });

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
    await expect(PWUtils.getTableCell(containedTable, 1, 1)).toHaveText('ValueSet');
    await expect(PWUtils.getTableCell(containedTable, 1, 2)).toHaveText('vs1');
    await expect(PWUtils.getTableCell(containedTable, 1, 3)).toHaveText('A title');
    await expect(PWUtils.getTableCell(containedTable, 1, 4)).toHaveText('R5');
    await expect(PWUtils.getTableCell(containedTable, 1, 5)).toHaveText('active');

    const json = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');

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
    fileJson = await PWUtils.uploadFile(page, 'contained-value-set-sample.json', false);
    flContainedTable = PWUtils.getTableByFieldLabel(
      page.locator('lfb-form-fields'),
      'Contained resources'
    );
    await PWUtils.clickButton(page, null, 'Advanced fields');
  });

  test('should import questionnaire with contained value set', async({page}) => {
    expect(await flContainedTable.locator('tbody > tr').count()).toBe(3);
    const editCell = PWUtils.getTableCell(flContainedTable, 2, 6).locator(editLoc);
    await expect(editCell).toBeDefined();
    await expect(editCell).toBeVisible();
    await expect(editCell).toBeEnabled();
    await editCell.scrollIntoViewIfNeeded()
    await editCell.click();

    const dialog = page.locator('mat-dialog-container');

    await Promise.all([
      dialog.waitFor({ state: 'visible' }),
    ]);

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
    const json = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(json.contained).toStrictEqual(fileJson.contained);
  });

  test('should validate resource.id', async({page}) => {
    const editCell = PWUtils.getTableCell(flContainedTable, 2, 6).locator(editLoc);
    await expect(editCell).toBeVisible();
    await expect(editCell).toBeEnabled();
    await editCell.scrollIntoViewIfNeeded()
    await editCell.click();

    const dialog = page.locator('.cdk-dialog-container');

    // First, wait for the dialog to exist and be visible.
    await dialog.waitFor({ state: 'visible' });

    const idInput = dialog.getByLabel('Id', { exact: true });
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
    await expect(PWUtils.getTableCell(flContainedTable, 2, 2)).toHaveText('vs2-modified');
  });
});

test.describe('Contained resource local-file import', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/');
    const mainPO = new MainPO(page);
    await mainPO.loadFLPage();
    await PWUtils.clickButton(page, null, 'Advanced fields');
  });

  test('imports arbitrary resource JSON and warns only for mismatched preview versions', async ({page}) => {
    const containedTable = PWUtils.getTableByFieldLabel(
      page.locator('lfb-form-fields'),
      'Contained resources'
    );
    const addButton = page.getByRole('button', {name: 'Add contained resource'});
    const tableBox = await containedTable.boundingBox();
    const addButtonBox = await addButton.boundingBox();
    expect(Math.abs(tableBox.width - addButtonBox.width)).toBeLessThanOrEqual(1);
    const chooserPromise = page.waitForEvent('filechooser');
    await addButton.click();
    const addMenu = page.locator('lfb-contained .dropdown-menu.show');
    const openButtonBox = await addButton.boundingBox();
    const addMenuBox = await addMenu.boundingBox();
    const buttonCenter = openButtonBox.x + openButtonBox.width / 2;
    const menuCenter = addMenuBox.x + addMenuBox.width / 2;
    expect(Math.abs(buttonCenter - menuCenter)).toBeLessThanOrEqual(1);
    await expect(page.getByRole('button', {name: 'Import from a FHIR server…'})).toBeEnabled();
    await page.getByRole('button', {name: 'Upload from a local file…'}).click();
    const chooser = await chooserPromise;
    await chooser.setFiles('tests/fixtures/contained-patient-r4.json');

    await expect(containedTable.locator('tbody > tr')).toHaveCount(1);
    await expect(PWUtils.getTableCell(containedTable, 1, 1)).toHaveText('Patient');
    await expect(PWUtils.getTableCell(containedTable, 1, 2)).toHaveText('patient-template');
    await expect(PWUtils.getTableCell(containedTable, 1, 4)).toHaveText('R4');
    const viewButton = containedTable.getByRole('button', {name: 'View contained resource JSON'});
    await expect(viewButton.locator('svg[data-icon="eye"]')).toBeVisible();
    await viewButton.click();
    const resourceDialog = page.getByRole('dialog', {name: 'Contained Resource'});
    await expect(resourceDialog).toContainText('"resourceType": "Patient"');
    await expect(resourceDialog).not.toContainText('__$fhirVersionInfo');
    await resourceDialog.getByRole('button', {name: 'Close', exact: true}).last().click();

    await page.getByRole('button', {name: 'Preview'}).click();
    await expect(page.locator('.contained-resource-version-warning'))
      .toContainText('Patient #patient-template was imported as FHIR R4');
    await page.getByRole('tab', {name: 'View/Validate Questionnaire JSON'}).click();
    await page.getByRole('tab', {name: 'R4 Version'}).click();
    await expect(page.locator('ngb-alert').filter({hasText: 'Patient #patient-template'})).toHaveCount(0);
    await page.getByRole('button', {name: 'Copy questionnaire to clipboard'}).click();
    const r4Questionnaire = JSON.parse(await PWUtils.getClipboardContent(page));
    expect(r4Questionnaire.contained[0]).toEqual({
      resourceType: 'Patient',
      id: 'patient-template',
      meta: {profile: ['http://hl7.org/fhir/4.0/StructureDefinition/Patient']},
      active: true,
      name: [{use: 'official', family: 'Contained', given: ['Patient']}]
    });
    await page.getByRole('tab', {name: 'R5 Version'}).click();
    await expect(page.locator('ngb-alert').filter({hasText: 'Patient #patient-template'})).toBeVisible();
  });
});

test.describe('Contained resource import from a FHIR server', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/');
    const mainPO = new MainPO(page);
    await mainPO.loadFLPage();
    await PWUtils.uploadFile(page, 'contained-example.json', false);
    await PWUtils.clickButton(page, null, 'Advanced fields');
  });

  test('selects a resource type and imports a normalized server resource', async ({page}) => {
    await page.route('https://lforms-fhir.nlm.nih.gov/baseR5/metadata?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/fhir+json',
        json: {
          resourceType: 'CapabilityStatement',
          status: 'active',
          date: '2026-09-02',
          kind: 'instance',
          fhirVersion: '5.0.0',
          format: ['json'],
          rest: [{
            mode: 'server',
            resource: [{
              type: 'Practitioner',
              searchParam: [{name: 'name', type: 'string'}]
            }]
          }]
        }
      });
    });
    await page.route('https://lforms-fhir.nlm.nih.gov/baseR5/Practitioner?**', async (route) => {
      expect(route.request().url()).toContain('_content=Jane');
      await route.fulfill({
        status: 200,
        contentType: 'application/fhir+json',
        json: {
          resourceType: 'Bundle',
          type: 'searchset',
          total: 1,
          entry: [{
            resource: {
              resourceType: 'Practitioner',
              id: 'p2',
              active: true,
              name: [{family: 'Roe', given: ['Jane']}]
            }
          }]
        }
      });
    });
    await page.route(/\/baseR5\/Practitioner\/p2\?/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/fhir+json',
        json: {
          resourceType: 'Practitioner',
          id: 'p2',
          meta: {
            lastUpdated: '2026-09-02T12:00:00Z',
            tag: [{code: 'server-import'}]
          },
          active: true,
          name: [{family: 'Roe', given: ['Jane']}]
        }
      });
    });

    await page.getByRole('button', {name: 'Add contained resource'}).click();
    await page.getByRole('button', {name: 'Import from a FHIR server…'}).click();
    await PWUtils.clickDialogButton(page, {title: 'Choose a FHIR server'}, 'Continue');

    const searchDialog = page.getByRole('dialog', {name: 'Import a contained resource'});
    await expect(searchDialog).toBeVisible();
    const searchButton = searchDialog.getByRole('button', {name: 'Search'});
    await expect(searchButton).toBeDisabled();
    await searchDialog.getByLabel('Resource type').fill('Practitioner');
    await expect(searchButton).toBeEnabled();
    await searchDialog.getByLabel('Search term').fill('Jane');
    await searchButton.click();
    await searchDialog.getByRole('button', {name: /Jane Roe/}).click();

    const normalizationDialog = page.getByRole('dialog', {name: 'Normalize contained resource'});
    await expect(normalizationDialog).toContainText('meta.lastUpdated');
    await normalizationDialog.getByRole('button', {name: 'Import resource'}).click();

    const containedTable = PWUtils.getTableByFieldLabel(
      page.locator('lfb-form-fields'),
      'Contained resources'
    );
    await expect(containedTable.locator('tbody > tr')).toHaveCount(2);
    await expect(PWUtils.getTableCell(containedTable, 2, 1)).toHaveText('Practitioner');
    await expect(PWUtils.getTableCell(containedTable, 2, 2)).toHaveText('p2');
    await expect(PWUtils.getTableCell(containedTable, 2, 3)).toHaveText('Jane Roe');
    await expect(PWUtils.getTableCell(containedTable, 2, 4)).toHaveText('R5');

    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(questionnaire.contained[1]).toEqual({
      resourceType: 'Practitioner',
      id: 'p2',
      meta: {tag: [{code: 'server-import'}]},
      active: true,
      name: [{family: 'Roe', given: ['Jane']}]
    });
  });
});
