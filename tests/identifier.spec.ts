import {test, expect, Locator, Page} from '@playwright/test';
import {MainPO} from './po/main-po';
import {PWUtils} from './pw-utils';

interface IdentifierInput {
  use: string;
  system: string;
  value: string;
  typeText: string;
  coding: {
    display: string;
    code: string;
    system: string;
  };
  periodStart: string;
  periodEnd: string;
  assignerDisplay: string;
  assignerReference: string;
  assignerType: string;
}

const identifierInputs: IdentifierInput[] = [
  {
    use: 'official',
    system: 'urn:sys:alpha',
    value: 'ID-ALPHA',
    typeText: 'alpha-type',
    coding: {
      display: 'Alpha Display',
      code: 'A1',
      system: 'http://example.org/codes'
    },
    periodStart: '2024-01-02 10:20:30 AM',
    periodEnd: '2025-03-04 11:22:33 AM',
    assignerDisplay: 'Dept A',
    assignerReference: 'Organization/org-a',
    assignerType: 'Organization'
  },
  {
    use: 'secondary',
    system: 'urn:sys:beta',
    value: 'ID-BETA',
    typeText: 'beta-type',
    coding: {
      display: 'Beta Display',
      code: 'B2',
      system: 'http://example.org/codes'
    },
    periodStart: '2023-05-06 07:08:09 AM',
    periodEnd: '2026-09-10 11:12:13 AM',
    assignerDisplay: 'Dept B',
    assignerReference: 'Organization/org-b',
    assignerType: 'Organization'
  }
];

function getIdentifierTable(page: Page): Locator {
  return PWUtils.getTableByFieldLabel(page.locator('lfb-form-fields'), 'Identifiers');
}

function getEditButton(table: Locator, row: number): Locator {
  return table.locator(`tbody tr:nth-child(${row}) button[aria-label="Edit this row"]`);
}

function getRemoveButton(table: Locator, row: number): Locator {
  return table.locator(`tbody tr:nth-child(${row}) button[aria-label="Remove this row"]`);
}

async function ensureAdvancedFieldsExpanded(page: Page): Promise<void> {
  const expandIcon = page.getByRole('button', {name: 'Advanced fields'}).locator('svg.fa-angle-down');
  if (await expandIcon.count()) {
    await expect(expandIcon).toBeVisible();
    await expandIcon.click();
  }
}

async function openIdentifierDialogByAdd(page: Page): Promise<Locator> {
  await PWUtils.clickButton(page, null, 'Add new identifier');
  const dialog = page.locator('mat-dialog-container').last();
  await expect(dialog).toBeVisible();
  return dialog;
}

async function openIdentifierDialogByEdit(table: Locator, row: number): Promise<Locator> {
  const edit = getEditButton(table, row);
  await expect(edit).toBeVisible();
  await edit.click();
  const dialog = table.page().locator('mat-dialog-container').last();
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillIdentifierDialog(dialog: Locator, data: IdentifierInput): Promise<void> {
  await dialog.getByLabel('Use', {exact: true}).selectOption(data.use);
  await dialog.getByLabel('System', {exact: true}).fill(data.system);
  await dialog.getByLabel('Value', {exact: true}).fill(data.value);

  await dialog.getByLabel('Start', {exact: true}).fill(data.periodStart);
  await dialog.getByLabel('End', {exact: true}).fill(data.periodEnd);

  await dialog.getByLabel('Text', {exact: true}).fill(data.typeText);
  const codingTable = PWUtils.getTableByFieldLabel(dialog, 'Coding');
  await PWUtils.getTableCellInput(codingTable, 1, 1).fill(data.coding.display);
  await PWUtils.getTableCellInput(codingTable, 1, 2).fill(data.coding.code);
  await PWUtils.getTableCellInput(codingTable, 1, 3).fill(data.coding.system);

  await dialog.locator('input[id*="assigner.display"]').first().fill(data.assignerDisplay);
  await dialog.locator('input[id*="assigner.reference"]').first().fill(data.assignerReference);
  await dialog.locator('input[id*="assigner.type"]').first().fill(data.assignerType);
}

async function expectIdentifierDialogValues(dialog: Locator, data: IdentifierInput): Promise<void> {
  const useSelect = dialog.getByLabel('Use', {exact: true});
  await expect(useSelect).toHaveValue(new RegExp(`${data.use}$`));
  await expect(useSelect.locator('option:checked')).toContainText(data.use);
  await expect(dialog.getByLabel('System', {exact: true})).toHaveValue(data.system);
  await expect(dialog.getByLabel('Value', {exact: true})).toHaveValue(data.value);
  await expect(dialog.getByLabel('Text', {exact: true})).toHaveValue(data.typeText);

  const codingTable = PWUtils.getTableByFieldLabel(dialog, 'Coding');
  await expect(PWUtils.getTableCellInput(codingTable, 1, 1)).toHaveValue(data.coding.display);
  await expect(PWUtils.getTableCellInput(codingTable, 1, 2)).toHaveValue(data.coding.code);
  await expect(PWUtils.getTableCellInput(codingTable, 1, 3)).toHaveValue(data.coding.system);

  await expect(dialog.locator('input[id*="period.start"]').first()).toHaveValue(/\d{4}-\d{2}-\d{2}/);
  await expect(dialog.locator('input[id*="period.end"]').first()).toHaveValue(/\d{4}-\d{2}-\d{2}/);
  await expect(dialog.locator('input[id*="assigner.display"]').first()).toHaveValue(data.assignerDisplay);
  await expect(dialog.locator('input[id*="assigner.reference"]').first()).toHaveValue(data.assignerReference);
  await expect(dialog.locator('input[id*="assigner.type"]').first()).toHaveValue(data.assignerType);
}

async function expectIdentifierTableRow(table: Locator, row: number, data: IdentifierInput): Promise<void> {
  await expect(PWUtils.getTableCellInput(table, row, 1)).toHaveValue(data.value);
  await expect(PWUtils.getTableCellInput(table, row, 2)).toHaveValue(data.system);
  const useInput = PWUtils.getTableCellInput(table, row, 3);
  if (await useInput.count()) {
    await expect(useInput).toHaveValue(data.use);
    return;
  }

  const useDisplay = PWUtils.getTableCell(table, row, 3).locator('span.form-control');
  await expect(useDisplay).toContainText(data.use);
}

test.describe('Identifier in form level', () => {
  let mainPO: MainPO;
  const editedIdentifier: IdentifierInput = {
    use: 'temp',
    system: 'urn:sys:edited',
    value: 'ID-EDITED',
    typeText: 'edited-type',
    coding: {
      display: 'Edited Display',
      code: 'E9',
      system: 'http://example.org/edited-codes'
    },
    periodStart: '2027-01-01 01:02:03 AM',
    periodEnd: '2028-02-03 04:05:06 AM',
    assignerDisplay: 'Edited Dept',
    assignerReference: 'Organization/org-edited',
    assignerType: 'Organization'
  };

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
    await ensureAdvancedFieldsExpanded(page);
  });

  test('should add two identifiers and populate preview JSON with subfields', async ({page}) => {
    const identifierTable = getIdentifierTable(page);

    for (const identifier of identifierInputs) {
      const dialog = await openIdentifierDialogByAdd(page);
      await fillIdentifierDialog(dialog, identifier);
      await PWUtils.clickDialogButton(page, {selector: 'mat-dialog-container'}, 'Save and close');
    }

    await expect(identifierTable.locator('tbody > tr')).toHaveCount(2);

    for (let row = 1; row <= 2; row++) {
      await expect(getEditButton(identifierTable, row)).toBeVisible();
      await expect(identifierTable.locator(`tbody tr:nth-child(${row}) button[aria-label="Remove this row"]`)).toBeVisible();
    }

    const previewJson = await PWUtils.getQuestionnaireJSON(page, 'R4');
    const identifiers = previewJson.identifier ?? [];
    expect(identifiers).toHaveLength(2);

    expect(identifiers[0]).toMatchObject({
      use: 'official',
      system: 'urn:sys:alpha',
      value: 'ID-ALPHA',
      type: {
        text: 'alpha-type',
        coding: [
          {
            display: 'Alpha Display',
            code: 'A1',
            system: 'http://example.org/codes'
          }
        ]
      },
      assigner: {
        display: 'Dept A',
        reference: 'Organization/org-a',
        type: 'Organization'
      }
    });
    expect(identifiers[0]?.period?.start).toMatch(/^2024-01-02T\d{2}:20:30Z$/);
    expect(identifiers[0]?.period?.end).toMatch(/^2025-03-04T\d{2}:22:33Z$/);

    expect(identifiers[1]).toMatchObject({
      use: 'secondary',
      system: 'urn:sys:beta',
      value: 'ID-BETA',
      type: {
        text: 'beta-type',
        coding: [
          {
            display: 'Beta Display',
            code: 'B2',
            system: 'http://example.org/codes'
          }
        ]
      },
      assigner: {
        display: 'Dept B',
        reference: 'Organization/org-b',
        type: 'Organization'
      }
    });
    expect(identifiers[1]?.period?.start).toMatch(/^2023-05-06T\d{2}:08:09Z$/);
    expect(identifiers[1]?.period?.end).toMatch(/^2026-09-10T\d{2}:12:13Z$/);
  });

  test('should import identifier fixture and display identifier values correctly', async ({page}) => {
    const fixture = await PWUtils.uploadFile(page, 'identifier-sample.json');
    await ensureAdvancedFieldsExpanded(page);

    const identifierTable = getIdentifierTable(page);
    await expect(identifierTable.locator('tbody > tr')).toHaveCount(fixture.identifier.length);

    await expectIdentifierTableRow(identifierTable, 1, identifierInputs[0]);
    await expectIdentifierTableRow(identifierTable, 2, identifierInputs[1]);

    const row1Dialog = await openIdentifierDialogByEdit(identifierTable, 1);
    await expectIdentifierDialogValues(row1Dialog, identifierInputs[0]);
    await PWUtils.clickDialogButton(page, {selector: 'mat-dialog-container'}, 'Discard changes');

    const row2Dialog = await openIdentifierDialogByEdit(identifierTable, 2);
    await expectIdentifierDialogValues(row2Dialog, identifierInputs[1]);
    await PWUtils.clickDialogButton(page, {selector: 'mat-dialog-container'}, 'Discard changes');
  });

  test('should edit an existing identifier and persist the updated values', async ({page}) => {
    await PWUtils.uploadFile(page, 'identifier-sample.json');
    await ensureAdvancedFieldsExpanded(page);

    const identifierTable = getIdentifierTable(page);
    await expect(identifierTable.locator('tbody > tr')).toHaveCount(2);

    const editDialog = await openIdentifierDialogByEdit(identifierTable, 1);
    await fillIdentifierDialog(editDialog, editedIdentifier);
    await PWUtils.clickDialogButton(page, {selector: 'mat-dialog-container'}, 'Save and close');

    await expectIdentifierTableRow(identifierTable, 1, editedIdentifier);

    const previewJson = await PWUtils.getQuestionnaireJSON(page, 'R4');
    const identifiers = previewJson.identifier ?? [];
    expect(identifiers).toHaveLength(2);
    expect(identifiers[0]).toMatchObject({
      use: 'temp',
      system: 'urn:sys:edited',
      value: 'ID-EDITED',
      type: {
        text: 'edited-type',
        coding: [
          {
            display: 'Edited Display',
            code: 'E9',
            system: 'http://example.org/edited-codes'
          }
        ]
      },
      assigner: {
        display: 'Edited Dept',
        reference: 'Organization/org-edited',
        type: 'Organization'
      }
    });
  });

  test('should enable save when deleting identifier type coding', async ({page}) => {
    await PWUtils.uploadFile(page, 'identifier-sample.json');
    await ensureAdvancedFieldsExpanded(page);

    const identifierTable = getIdentifierTable(page);
    const editDialog = await openIdentifierDialogByEdit(identifierTable, 1);
    const saveButton = editDialog.getByRole('button', {name: 'Save and close'});
    await expect(saveButton).toBeDisabled();

    const codingTable = PWUtils.getTableByFieldLabel(editDialog, 'Coding');
    await codingTable.getByRole('button', {name: 'Remove this row'}).click();
    await PWUtils.clickDialogButton(page, {title: 'Confirm deletion'}, 'Delete');

    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    const previewJson = await PWUtils.getQuestionnaireJSON(page, 'R4');
    expect(previewJson.identifier?.[0]?.type?.coding).toBeUndefined();
  });

  test('should support recursive assigner identifier fields', async ({page}) => {
    const dialog = await openIdentifierDialogByAdd(page);
    await dialog.getByLabel('Use', {exact: true}).selectOption('official');
    await dialog.getByLabel('System', {exact: true}).fill('urn:sys:parent');
    await dialog.getByLabel('Value', {exact: true}).fill('ID-PARENT');

    await dialog.locator('input[id*="assigner.display"]').first().fill('Dept Recursive');
    await dialog.locator('input[id*="assigner.reference"]').first().fill('Organization/org-recursive');
    await dialog.locator('input[id*="assigner.type"]').first().fill('Organization');

    await dialog.getByRole('button', {name: /Add (new )?identifier/i}).click();
    const nestedDialog = page.locator('mat-dialog-container').last();
    await expect(nestedDialog).toBeVisible();
    await nestedDialog.getByLabel('System', {exact: true}).fill('urn:sys:assigner');
    await nestedDialog.getByLabel('Value', {exact: true}).fill('ID-ASSIGNER');

    await nestedDialog.getByRole('button', {name: /Add (new )?identifier/i}).click();
    const grandchildDialog = page.locator('mat-dialog-container').last();
    await expect(grandchildDialog).toBeVisible();
    await grandchildDialog.getByLabel('System', {exact: true}).fill('urn:sys:grandchild');
    await grandchildDialog.getByLabel('Value', {exact: true}).fill('ID-GRANDCHILD');

    await grandchildDialog.getByRole('button', {name: /Add (new )?identifier/i}).click();
    const greatGrandchildDialog = page.locator('mat-dialog-container').last();
    await expect(greatGrandchildDialog).toBeVisible();
    await greatGrandchildDialog.getByLabel('System', {exact: true}).fill('urn:sys:great-grandchild');
    await greatGrandchildDialog.getByLabel('Value', {exact: true}).fill('ID-GREAT-GRANDCHILD');
    await greatGrandchildDialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(3);

    await grandchildDialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(2);

    await nestedDialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(page.locator('mat-dialog-container')).toHaveCount(1);

    await PWUtils.clickDialogButton(page, {selector: 'mat-dialog-container'}, 'Save and close');

    const previewJson = await PWUtils.getQuestionnaireJSON(page, 'R4') as any;
    expect(previewJson.identifier?.[0]?.use).toBe('official');
    expect(previewJson.identifier?.[0]?.system).toBe('urn:sys:parent');
    expect(previewJson.identifier?.[0]?.value).toBe('ID-PARENT');
    expect(previewJson.identifier?.[0]?.assigner?.display).toBe('Dept Recursive');
    expect(previewJson.identifier?.[0]?.assigner?.reference).toBe('Organization/org-recursive');
    expect(previewJson.identifier?.[0]?.assigner?.type).toBe('Organization');

    expect(previewJson.identifier?.[0]?.assigner?.identifier?.system).toBe('urn:sys:assigner');
    expect(previewJson.identifier?.[0]?.assigner?.identifier?.value).toBe('ID-ASSIGNER');

    expect(previewJson.identifier?.[0]?.assigner?.identifier?.assigner?.identifier?.system).toBe('urn:sys:grandchild');
    expect(previewJson.identifier?.[0]?.assigner?.identifier?.assigner?.identifier?.value).toBe('ID-GRANDCHILD');

    expect(previewJson.identifier?.[0]?.assigner?.identifier?.assigner?.identifier?.assigner?.identifier?.system)
      .toBe('urn:sys:great-grandchild');
    expect(previewJson.identifier?.[0]?.assigner?.identifier?.assigner?.identifier?.assigner?.identifier?.value)
      .toBe('ID-GREAT-GRANDCHILD');
  });

  test('should delete an identifier row and persist the remaining identifier', async ({page}) => {
    await PWUtils.uploadFile(page, 'identifier-sample.json');
    await ensureAdvancedFieldsExpanded(page);

    const identifierTable = getIdentifierTable(page);
    await expect(identifierTable.locator('tbody > tr')).toHaveCount(2);

    await getRemoveButton(identifierTable, 2).click();
    await PWUtils.clickDialogButton(page, { title: 'Confirm deletion' }, 'Delete');
    await expect(identifierTable.locator('tbody > tr')).toHaveCount(1);
    await expectIdentifierTableRow(identifierTable, 1, identifierInputs[0]);

    const previewJson = await PWUtils.getQuestionnaireJSON(page, 'R4');
    const identifiers = previewJson.identifier ?? [];
    expect(identifiers).toHaveLength(1);
    expect(identifiers[0]).toMatchObject({
      use: 'official',
      system: 'urn:sys:alpha',
      value: 'ID-ALPHA'
    });
  });
});
