import { test, expect, Page, Locator } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

test.describe('expression editor autocomplete expansion', () => {
  let mainPO: MainPO;

  async function clickVisibleSeeMore(page: Page): Promise<void> {
    const seeMore = page.locator('#lhc-tools-moreResults [data-lhc-more-results-action="true"]').first();
    await expect(seeMore).toBeVisible();
    await seeMore.click();
  }

  async function ensureVariablesSectionExpanded(editor: Locator): Promise<void> {
    const addVariableBtn = editor.locator('#add-variable');
    if (await addVariableBtn.isVisible()) {
      return;
    }

    const variablesHeader = editor.locator('#variables-section h2.section-header').first();

    await expect(variablesHeader).toBeVisible();
    await variablesHeader.scrollIntoViewIfNeeded();
    await variablesHeader.click();
    await expect(addVariableBtn).toBeVisible();
  }

  async function addVariableRow(editor: Locator): Promise<{ rowId: string; rowIndex: string; row: Locator }> {
    await ensureVariablesSectionExpanded(editor);

    const variableRows = editor.locator('#variables-section .variable-row');
    const currentCount = await variableRows.count();

    await editor.locator('#add-variable').click();
    await expect(variableRows).toHaveCount(currentCount + 1);

    const rowId = await variableRows.last().getAttribute('id');
    expect(rowId).toBeTruthy();

    const rowIndex = rowId!.replace('row-', '');
    const row = editor.locator(`div#${rowId}`);

    return { rowId: rowId!, rowIndex, row };
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();

    await PWUtils.uploadFile(page, './fixtures/expression-editor-autocomplete-sample.json', true);
    await page.getByRole('button', { name: 'Edit questions' }).last().click();
  });

  test('should expand autocomplete for query observation and question variables in continuously compute value expression editor', async ({ page }) => {
    let loincAutoCount = 0;
    let loincExpandedCount = 0;

    const initialRows = [
      ['Retinol Result 1', '10001-1'],
      ['Retinol Result 2', '10002-2'],
      ['Retinol Result 3', '10003-3'],
      ['Retinol Result 4', '10004-4'],
      ['Retinol Result 5', '10005-5'],
      ['Retinol Result 6', '10006-6'],
      ['Retinol Result 7', '10007-7']
    ];

    const expandedRows = [
      ...initialRows,
      ['Retinol Expanded 8', '10008-8'],
      ['Retinol Expanded 9', '10009-9'],
      ['Retinol Expanded 10', '10010-0'],
      ['Retinol Expanded 11', '10011-1'],
      ['Retinol Expanded 12', '10012-2']
    ];

    await page.route('**/api/loinc_items/v3/search**', async (route) => {
      const url = new URL(route.request().url());
      const isExpandedSearch = url.searchParams.has('maxList');
      const rows = isExpandedSearch ? expandedRows : initialRows;

      if (isExpandedSearch) {
        loincExpandedCount += 1;
      } else {
        loincAutoCount += 1;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [
          expandedRows.length,
          rows.map((row) => row[1]),
          null,
          rows
        ]
      });
    });

    await PWUtils.clickTreeNode(page, 'Continuously Compute Value');
    await page.getByRole('button', { name: 'Create/edit expression', exact: true }).click();

    const editor = page.locator('lhc-expression-editor');
    await expect(editor.locator('#expression-editor-base-dialog')).toBeVisible();

    // Query Observation expansion
    const queryObsVar = await addVariableRow(editor);
    await queryObsVar.row.locator(`#variable-type-${queryObsVar.rowIndex}`).selectOption({ label: 'FHIR Query (Observation)' });

    const queryObsInput = queryObsVar.row.locator(`lhc-query-observation #autocomplete-${queryObsVar.rowIndex}`);
    await expect(queryObsInput).toBeVisible();
    await queryObsInput.pressSequentially('Retinol');

    const queryObsCompletionRows = page.locator('#completionOptions table tbody tr');
    await expect(queryObsCompletionRows).toHaveCount(7);

    await clickVisibleSeeMore(page);

    await expect(queryObsCompletionRows).toHaveCount(12);

    await expect(page.locator('#completionOptions table tbody tr').filter({ hasText: 'Retinol Expanded 12' })).toBeVisible();

    await expect(editor.locator('#expression-editor-base-dialog')).toBeVisible();
    await expect(editor.locator('#cancel-changes-base-dialog')).toHaveCount(0);

    // Question expansion
    const questionVar = await addVariableRow(editor);
    await questionVar.row.locator(`#variable-type-${questionVar.rowIndex}`).selectOption({ label: 'Question' });

    const questionInput = questionVar.row.locator(`input#question-${questionVar.rowIndex}`);
    await expect(questionInput).toBeVisible();
    await questionInput.pressSequentially('Body question');

    const questionCompletionItems = page.locator('#completionOptions > ul > li');
    await expect.poll(async () => questionCompletionItems.count()).toBeGreaterThan(0);
    const initialQuestionCount = await questionCompletionItems.count();

    await clickVisibleSeeMore(page);

    await expect.poll(async () => questionCompletionItems.count()).toBeGreaterThan(initialQuestionCount);
    await expect(page.locator('#completionOptions > ul > li').filter({ hasText: 'Body question 15' })).toBeVisible();

    await expect(editor.locator('#expression-editor-base-dialog')).toBeVisible();
    await expect(editor.locator('#cancel-changes-base-dialog')).toHaveCount(0);
  });
});
