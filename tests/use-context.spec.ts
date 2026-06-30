import { test, expect, Page, Locator } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

test.describe('Use context field tests', () => {
  let mainPO: MainPO;

  test.setTimeout(90000);

  const getDialogPaneRects = async (page: Page) => page.evaluate(() => {
    const toRect = (element: Element | undefined) => {
      const rect = element?.getBoundingClientRect();
      return rect ? {top: rect.top, left: rect.left} : null;
    };
    const panes = Array.from(document.querySelectorAll('.cdk-overlay-pane'));
    return {
      usageContext: toRect(panes.find((pane) => pane.querySelector('lfb-usage-context-dlg'))),
      identifiers: panes
        .filter((pane) => pane.querySelector('lfb-identifier-dlg'))
        .map((pane) => toRect(pane))
    };
  });

  const getUseContextDialog = (page: Page) => page.locator('lfb-usage-context-dlg');

  const addUseContextRow = async (page: Page) => {
    await page.getByRole('button', { name: 'Add use context' }).click();
    const dialog = getUseContextDialog(page);
    await expect(dialog).toBeVisible();
    return dialog;
  };

  const fillUseContextCode = async (
    dialog: Locator,
    code: { display: string; code: string; system: string }
  ) => {
    await dialog.locator('input[id^="code.display"]').fill(code.display);
    await dialog.locator('input[id^="code.code"]').fill(code.code);
    await dialog.locator('input[id^="code.system"]').fill(code.system);
  };

  const fillIdentifierDialog = async (
    dialog: Locator,
    identifier: { system: string; value: string; use?: string }
  ) => {
    if (identifier.use) {
      await dialog.locator('select[name="use"]').selectOption({label: identifier.use});
    }
    await dialog.locator('input[name="system"]').fill(identifier.system);
    await dialog.locator('input[name="value"]').fill(identifier.value);
  };

  const addRecursiveReferenceIdentifier = async (
    page: Page,
    useContextDialog: Locator,
    identifiers: Array<{ system: string; value: string; use?: string }>
  ) => {
    await useContextDialog.getByRole('button', { name: /Add (new )?identifier/i }).click();

    for (let index = 0; index < identifiers.length; index++) {
      const identifierDialog = page.locator('lfb-identifier-dlg').nth(index);
      await expect(identifierDialog).toBeVisible();
      await fillIdentifierDialog(identifierDialog, identifiers[index]);

      if (index < identifiers.length - 1) {
        await identifierDialog.getByRole('button', { name: /Add (new )?identifier/i }).click();
      }
    }

    for (let index = identifiers.length - 1; index >= 0; index--) {
      const identifierDialog = page.locator('lfb-identifier-dlg').nth(index);
      await identifierDialog.getByRole('button', { name: 'Save and close' }).click();
      await expect(identifierDialog).toBeHidden();
    }
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
  });

  test('should load existing useContext rows and display all UsageContext value types', async ({ page }) => {
    const q = await PWUtils.uploadFile(page, 'use-context-sample.json');

    await page.getByRole('button', { name: 'Advanced fields' }).click();

    const useContextRows = page.locator('lfb-usage-context tbody > tr')
      .filter({ has: page.locator('input[id^="useContext."]') });
    await expect(useContextRows).toHaveCount(4);

    const useContextTable = page.locator('lfb-usage-context table');
    await expect(PWUtils.getTableCellInput(useContextTable, 1, 1)).toHaveValue('Gender');
    await expect(PWUtils.getTableCellInput(useContextTable, 1, 2)).toHaveValue('gender');
    await expect(PWUtils.getTableCell(useContextTable, 1, 3)).toHaveText('Female');

    await expect(PWUtils.getTableCellInput(useContextTable, 2, 1)).toHaveValue('Age');
    await expect(PWUtils.getTableCell(useContextTable, 2, 3))
      .toHaveText('18 years http://unitsofmeasure.org - 65 years http://unitsofmeasure.org');

    await expect(PWUtils.getTableCellInput(useContextTable, 3, 1)).toHaveValue('Workflow Task');
    await expect(PWUtils.getTableCell(useContextTable, 3, 3)).toHaveText('Example plan | PlanDefinition/example | PlanDefinition');

    await expect(PWUtils.getTableCellInput(useContextTable, 4, 1)).toHaveValue('Clinical Focus');
    await expect(PWUtils.getTableCell(useContextTable, 4, 3)).toHaveText('>=42 score http://example.org/score');

    await useContextRows.nth(0).getByRole('button', { name: 'Edit this row' }).click();
    const dialog = page.getByRole('dialog')
      .filter({has: page.getByRole('heading', {name: 'Use context', exact: true})});
    await expect(dialog.getByRole('heading', { name: 'Use context', exact: true })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Edit use context fields' })).toBeVisible();
    await expect(dialog.locator('lfb-usage-context-obj')).toBeVisible();
    await expect(dialog.getByText('useContext[0]')).toBeVisible();
    await expect(dialog.locator('select[name="__$valueType"]')).toHaveValue(/valueCodeableConcept$/);
    await expect(dialog.getByText('Value codeable concept', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Value quantity', { exact: true })).toBeHidden();
    await expect(dialog.getByText('Value range', { exact: true })).toBeHidden();
    await expect(dialog.getByText('Value reference', { exact: true })).toBeHidden();
    await dialog.getByRole('button', { name: 'Discard changes' }).click();

    await useContextRows.nth(1).getByRole('button', { name: 'Edit this row' }).click();
    await expect(dialog.locator('select[name="__$valueType"]')).toHaveValue(/valueRange$/);
    await expect(dialog.getByText('Value range', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Low', { exact: true })).toBeVisible();
    await expect(dialog.getByText('High', { exact: true })).toBeVisible();
    await expect(dialog.locator('select[id*="valueRange.low.comparator"]')).toHaveCount(0);
    await expect(dialog.locator('select[id*="valueRange.high.comparator"]')).toHaveCount(0);
    await expect(dialog.locator('input[id*="valueRange.low.value"]')).toHaveValue('18');
    await expect(dialog.locator('input[id*="valueRange.high.value"]')).toHaveValue('65');
    await dialog.getByRole('button', { name: 'Discard changes' }).click();

    await useContextRows.nth(2).getByRole('button', { name: 'Edit this row' }).click();
    await expect(dialog.locator('select[name="__$valueType"]')).toHaveValue(/valueReference$/);
    await expect(dialog.getByText('Value reference', { exact: true })).toBeVisible();
    const identifierTable = dialog.locator('lfb-identifier table');
    await expect(identifierTable).toBeVisible();
    await expect(PWUtils.getTableCellInput(identifierTable, 1, 1)).toHaveValue('plan-123');
    await expect(PWUtils.getTableCellInput(identifierTable, 1, 2)).toHaveValue('http://example.org/plans');
    await expect(PWUtils.getTableCell(identifierTable, 1, 3).locator('select')).toHaveCount(0);
    await expect(PWUtils.getTableCell(identifierTable, 1, 3).locator('span')).toHaveText('official');

    await identifierTable.locator('tbody > tr').nth(0).getByRole('button', { name: 'Edit this row' }).click();
    const parentIdentifierDialog = page.getByRole('dialog')
      .filter({has: page.getByRole('heading', {name: 'Identifier', exact: true})})
      .nth(0);
    await expect(parentIdentifierDialog.getByText('Edit identifier fields')).toBeVisible();
    await expect.poll(async () => {
      const paneRects = await getDialogPaneRects(page);
      return Math.round((paneRects.identifiers[0]?.top || 0) - (paneRects.usageContext?.top || 0));
    }).toBe(20);
    await expect.poll(async () => {
      const paneRects = await getDialogPaneRects(page);
      return Math.round((paneRects.identifiers[0]?.left || 0) - (paneRects.usageContext?.left || 0));
    }).toBe(20);
    const assignerIdentifierTable = parentIdentifierDialog.locator('lfb-identifier table');
    await expect(assignerIdentifierTable).toBeVisible();
    await expect(PWUtils.getTableCellInput(assignerIdentifierTable, 1, 1)).toHaveValue('nested-org-id');
    await expect(PWUtils.getTableCellInput(assignerIdentifierTable, 1, 2)).toHaveValue('http://example.org/organizations');
    await expect(PWUtils.getTableCell(assignerIdentifierTable, 1, 3).locator('select')).toHaveCount(0);
    await expect(PWUtils.getTableCell(assignerIdentifierTable, 1, 3).locator('span')).toHaveText('secondary');

    await parentIdentifierDialog.getByRole('button', { name: 'Discard changes' }).click();
    await expect(parentIdentifierDialog).toBeHidden();
    await dialog.getByRole('button', { name: 'Discard changes' }).click();
    await expect(dialog).toBeHidden();

    await useContextRows.nth(3).getByRole('button', { name: 'Edit this row' }).click();
    await expect(dialog.locator('select[name="__$valueType"]')).toHaveValue(/valueQuantity$/);
    await expect(dialog.getByText('Value quantity', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('spinbutton', { name: /^Value\b/ })).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: /^Comparator\b/ })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: /^Unit\b/ })).toBeVisible();
    await expect(dialog.locator('select[id*="valueQuantity.comparator"]')).toHaveValue(/>=$/);
    await expect(dialog.locator('input[id*="valueQuantity.value"]')).toHaveValue('42');
    await expect(dialog.locator('input[id*="valueQuantity.unit"]')).toHaveValue('score');
    await expect(dialog.locator('input[id*="valueQuantity.system"]')).toHaveValue('http://example.org/score');
    await expect(dialog.locator('input[id*="valueQuantity.code"]')).toHaveValue('score');
    await dialog.getByRole('button', { name: 'Discard changes' }).click();

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(qJson.useContext).toEqual(q.useContext);
    expect(qJson.useContext[2].valueReference.identifier.assigner.identifier.value).toEqual('nested-org-id');
    expect(qJson.useContext[2].valueReference.identifier.assigner.identifier.assigner.identifier.value).toEqual('third-level-id');

    const previewJson = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(previewJson.useContext[2].valueReference.identifier.assigner.identifier.value).toEqual('nested-org-id');
    expect(previewJson.useContext[2].valueReference.identifier.assigner.identifier.assigner.identifier.value).toEqual('third-level-id');
  });

  test('should keep valueReference identifier assigner.identifier when assigner has no other fields', async ({ page }) => {
    await PWUtils.uploadFile(page, 'use-context-assigner-identifier-only.json');

    await page.getByRole('button', { name: 'Advanced fields' }).click();

    const useContextRows = page.locator('lfb-usage-context tbody > tr')
      .filter({ has: page.locator('input[id^="useContext."]') });
    const useContextTable = page.locator('lfb-usage-context table');
    await expect(PWUtils.getTableCell(useContextTable, 1, 3))
      .toHaveText('plan-identifier-only | http://example.org/plans | official');
    await useContextRows.nth(0).getByRole('button', { name: 'Edit this row' }).click();

    const useContextDialog = page.getByRole('dialog')
      .filter({has: page.getByRole('heading', {name: 'Use context', exact: true})});
    const identifierTable = useContextDialog.locator('lfb-identifier table');
    await identifierTable.locator('tbody > tr').nth(0).getByRole('button', { name: 'Edit this row' }).click();

    const identifierDialog = page.getByRole('dialog')
      .filter({has: page.getByRole('heading', {name: 'Identifier', exact: true})})
      .nth(0);
    const assignerIdentifierTable = identifierDialog.locator('lfb-identifier table');
    await expect(PWUtils.getTableCellInput(assignerIdentifierTable, 1, 1)).toHaveValue('assigner-id-only');
    await expect(PWUtils.getTableCellInput(assignerIdentifierTable, 1, 2)).toHaveValue('http://example.org/assigners');

    await identifierDialog.getByRole('button', { name: 'Discard changes' }).click();
    await expect(identifierDialog).toBeHidden();
    await useContextDialog.getByRole('button', { name: 'Discard changes' }).click();
    await expect(useContextDialog).toBeHidden();

    const previewJson = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(previewJson.useContext[0].valueReference.identifier.assigner.identifier.value).toEqual('assigner-id-only');
  });

  test('should populate all UsageContext value types and persist the expected JSON', async ({ page }) => {
    await page.getByRole('button', { name: 'Advanced fields' }).click();

    let useContextDialog = await addUseContextRow(page);
    await useContextDialog.locator('input[id^="code.display"]').fill('Gender');
    await useContextDialog.locator('input[id^="code.system"]').fill('http://terminology.hl7.org/CodeSystem/usage-context-type');
    await expect(useContextDialog.getByRole('button', { name: 'Save and close' })).toBeDisabled();
    await useContextDialog.locator('select[id^="__"]').selectOption({label: 'Codeable concept'});
    await expect(useContextDialog.getByRole('button', { name: 'Save and close' })).toBeDisabled();
    await useContextDialog.locator('input[id^="valueCodeableConcept.text"]').fill('Female');
    const codeInput = useContextDialog.locator('input[id^="code.code"]');
    await expect(useContextDialog.getByText('Code is required.')).toHaveCount(0);
    await expect.poll(() => codeInput.evaluate((el) => el.classList.contains('invalid'))).toBe(false);
    await expect(codeInput).not.toHaveAttribute('aria-invalid', 'true');
    await expect(useContextDialog.getByRole('button', { name: 'Save and close' })).toBeDisabled();
    await expect(useContextDialog.locator('.save-button-tooltip-wrapper')).toHaveAttribute('title', 'Enter a code.');
    await codeInput.fill('gender');
    await expect.poll(() => codeInput.evaluate((el) => el.classList.contains('invalid'))).toBe(false);
    await expect(codeInput).not.toHaveAttribute('aria-invalid', 'true');
    await expect(useContextDialog.getByRole('button', { name: 'Save and close' })).toBeEnabled();
    await useContextDialog.getByRole('button', { name: 'Save and close' }).click();
    await expect(useContextDialog).toBeHidden();

    useContextDialog = await addUseContextRow(page);
    await fillUseContextCode(useContextDialog, {
      display: 'Age',
      code: 'age',
      system: 'http://terminology.hl7.org/CodeSystem/usage-context-type'
    });
    await useContextDialog.locator('select[id^="__"]').selectOption({label: 'Range'});
    await useContextDialog.locator('input[id*="valueRange.low.value"]').fill('18');
    await useContextDialog.locator('input[id*="valueRange.low.unit"]').fill('years');
    await useContextDialog.locator('input[id*="valueRange.low.system"]').fill('http://unitsofmeasure.org');
    await useContextDialog.locator('input[id*="valueRange.low.code"]').fill('a');
    const rangeHighInput = useContextDialog.locator('input[id*="valueRange.high.value"]');
    await rangeHighInput.fill('12');
    await expect(useContextDialog.getByText('High value must be greater than or equal to low value.')).toBeVisible();
    await expect(rangeHighInput).toHaveClass(/invalid/);
    await expect(rangeHighInput).toHaveAttribute('aria-invalid', 'true');
    await expect(useContextDialog.getByRole('button', { name: 'Save and close' })).toBeDisabled();
    await rangeHighInput.fill('65');
    await expect(useContextDialog.getByText('High value must be greater than or equal to low value.')).toBeHidden();
    await expect(rangeHighInput).not.toHaveClass(/invalid/);
    await expect(rangeHighInput).not.toHaveAttribute('aria-invalid', 'true');
    await useContextDialog.locator('input[id*="valueRange.high.unit"]').fill('years');
    await useContextDialog.locator('input[id*="valueRange.high.system"]').fill('http://unitsofmeasure.org');
    await useContextDialog.locator('input[id*="valueRange.high.code"]').fill('a');
    await useContextDialog.getByRole('button', { name: 'Save and close' }).click();
    await expect(useContextDialog).toBeHidden();

    useContextDialog = await addUseContextRow(page);
    await fillUseContextCode(useContextDialog, {
      display: 'Workflow Task',
      code: 'task',
      system: 'http://terminology.hl7.org/CodeSystem/usage-context-type'
    });
    await useContextDialog.locator('select[id^="__"]').selectOption({label: 'Reference'});
    await useContextDialog.locator('input[id^="valueReference.display"]').fill('Created plan');
    await useContextDialog.locator('input[id^="valueReference.reference"]').fill('PlanDefinition/created');
    await useContextDialog.locator('input[id^="valueReference.type"]').fill('PlanDefinition');
    await expect(useContextDialog.locator('lfb-identifier table tbody > tr')).toHaveCount(0);
    await expect(useContextDialog.getByRole('button', { name: 'Add new identifier' })).toBeEnabled();

    await addRecursiveReferenceIdentifier(page, useContextDialog, [
      {system: 'http://example.org/plans', value: 'created-plan-id', use: 'official'},
      {system: 'http://example.org/assigners', value: 'created-assigner-id', use: 'secondary'},
      {system: 'http://example.org/grandchild-assigners', value: 'created-grandchild-id', use: 'usual'},
      {system: 'http://example.org/great-grandchild-assigners', value: 'created-great-grandchild-id', use: 'old'}
    ]);
    await useContextDialog.getByRole('button', { name: 'Save and close' }).click();
    await expect(useContextDialog).toBeHidden();

    useContextDialog = await addUseContextRow(page);
    await fillUseContextCode(useContextDialog, {
      display: 'Clinical Focus',
      code: 'focus',
      system: 'http://terminology.hl7.org/CodeSystem/usage-context-type'
    });
    await useContextDialog.locator('select[id^="__"]').selectOption({label: 'Quantity'});
    await useContextDialog.locator('select[id*="valueQuantity.comparator"]').selectOption({label: '>='});
    await useContextDialog.locator('input[id*="valueQuantity.value"]').fill('42');
    await useContextDialog.locator('input[id*="valueQuantity.unit"]').fill('score');
    await useContextDialog.locator('input[id*="valueQuantity.system"]').fill('http://example.org/score');
    await useContextDialog.locator('input[id*="valueQuantity.code"]').fill('score');
    await useContextDialog.getByRole('button', { name: 'Save and close' }).click();
    await expect(useContextDialog).toBeHidden();

    const previewJson = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(previewJson.useContext).toHaveLength(4);
    expect(previewJson.useContext[0]).toMatchObject({
      code: {
        display: 'Gender',
        code: 'gender',
        system: 'http://terminology.hl7.org/CodeSystem/usage-context-type'
      },
      valueCodeableConcept: {
        text: 'Female'
      }
    });
    expect(previewJson.useContext[1]).toMatchObject({
      code: {
        display: 'Age',
        code: 'age',
        system: 'http://terminology.hl7.org/CodeSystem/usage-context-type'
      },
      valueRange: {
        low: {
          value: 18,
          unit: 'years',
          system: 'http://unitsofmeasure.org',
          code: 'a'
        },
        high: {
          value: 65,
          unit: 'years',
          system: 'http://unitsofmeasure.org',
          code: 'a'
        }
      }
    });
    expect(previewJson.useContext[2]).toMatchObject({
      code: {
        display: 'Workflow Task',
        code: 'task',
        system: 'http://terminology.hl7.org/CodeSystem/usage-context-type'
      },
      valueReference: {
        display: 'Created plan',
        reference: 'PlanDefinition/created',
        type: 'PlanDefinition'
      }
    });
    expect(previewJson.useContext[2].valueReference.identifier.value).toEqual('created-plan-id');
    expect(previewJson.useContext[2].valueReference.identifier.assigner.identifier.value)
      .toEqual('created-assigner-id');
    expect(previewJson.useContext[2].valueReference.identifier.assigner.identifier.assigner.identifier.value)
      .toEqual('created-grandchild-id');
    expect(previewJson.useContext[2].valueReference.identifier.assigner.identifier.assigner.identifier.assigner.identifier.value)
      .toEqual('created-great-grandchild-id');
    expect(previewJson.useContext[3]).toMatchObject({
      code: {
        display: 'Clinical Focus',
        code: 'focus',
        system: 'http://terminology.hl7.org/CodeSystem/usage-context-type'
      },
      valueQuantity: {
        comparator: '>=',
        value: 42,
        unit: 'score',
        system: 'http://example.org/score',
        code: 'score'
      }
    });

    const previewR4Json = await PWUtils.getQuestionnaireJSON(page, 'R4');
    expect(previewR4Json.useContext[2].valueReference.identifier.value).toEqual('created-plan-id');
    expect(previewR4Json.useContext[2].valueReference.identifier.assigner.identifier.value)
      .toEqual('created-assigner-id');
    expect(previewR4Json.useContext[2].valueReference.identifier.assigner.identifier.assigner.identifier.value)
      .toEqual('created-grandchild-id');
    expect(previewR4Json.useContext[2].valueReference.identifier.assigner.identifier.assigner.identifier.assigner.identifier.value)
      .toEqual('created-great-grandchild-id');
  });
});
