import { test, expect, Page } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';
import fs from 'node:fs/promises';

const getSubjectTypeInput = (page: Page) =>
  page.locator('input[id^="subjectType"][id$="_ac"]:visible').first();

const getSubjectTypeChipList = (page: Page) =>
  getSubjectTypeInput(page).locator('xpath=..').locator('li');

const startScratchForm = async (page: Page) => {
  await page.locator('input[type="radio"][value="scratch"]').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await PWUtils.expandAdvancedFields(page);
};

const exportToFile = async (page: Page, format: string, buttonName: string, outputPath: string) => {
  const exportItem = await PWUtils.getMenuBarDropDownItem(page, 'Export', `Export to file in FHIR ${format} format`);
  await exportItem.click();

  const warningDialog = page.getByRole('dialog', { name: 'Subject type compatibility' });
  await expect(warningDialog).toContainText('ActorDefinition');
  await expect(warningDialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await expect(warningDialog.getByRole('button', { name: 'Export anyway' })).toBeVisible();
  await expect(warningDialog.getByRole('button', { name: 'Remove incompatible types and export' })).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    warningDialog.getByRole('button', { name: buttonName }).click()
  ]);
  await download.saveAs(outputPath);
  return JSON.parse(await fs.readFile(outputPath, 'utf-8'));
};

test.describe('Subject type autocomplete', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    mainPO = new MainPO(page);
    await mainPO.mockSnomedEditions();
    await page.goto('/');
    await mainPO.loadHomePage();
  });

  test('should add selected subjectType values as chips and persist in Questionnaire JSON', async ({ page }) => {
    await startScratchForm(page);

    const subjectTypeInput = getSubjectTypeInput(page);
    await expect(subjectTypeInput).toBeVisible();

    await PWUtils.typeAndSelect(subjectTypeInput, 'Pat');
    await PWUtils.typeAndSelect(subjectTypeInput, 'Per');

    const chips = getSubjectTypeChipList(page);
    await expect(chips.filter({ hasText: 'Patient' })).toHaveCount(1);
    await expect(chips.filter({ hasText: 'Person' })).toHaveCount(1);

    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(questionnaire.subjectType).toEqual(expect.arrayContaining(['Patient', 'Person']));
  });

  test('should display version labels for resource types that are not available in all versions', async ({ page }) => {
    await startScratchForm(page);

    const subjectTypeInput = getSubjectTypeInput(page);
    await PWUtils.typeAndSelect(subjectTypeInput, 'ActorDefinition');
    await PWUtils.typeAndSelect(subjectTypeInput, 'CatalogEntry');
    await PWUtils.typeAndSelect(subjectTypeInput, 'DeviceAlert');

    const chips = getSubjectTypeChipList(page);
    await expect(chips.filter({ hasText: 'ActorDefinition (R5, R6)' })).toHaveCount(1);
    await expect(chips.filter({ hasText: 'CatalogEntry (R4)' })).toHaveCount(1);
    await expect(chips.filter({ hasText: 'DeviceAlert (R6)' })).toHaveCount(1);

    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(questionnaire.subjectType).toContain('ActorDefinition');
  });

  test('should render preselected subjectType values from imported Questionnaire as chips', async ({ page }) => {
    await page.locator('input[type="radio"][value="existing"]').click();
    await page.locator('input[type="radio"][value="local"]').click();

    const fixture = await PWUtils.importLocalFile(page, 'enable-when-sample.json');
    const expectedTypes: string[] = fixture.subjectType;
    await PWUtils.expandAdvancedFields(page);

    const subjectTypeInput = getSubjectTypeInput(page);
    await expect(subjectTypeInput).toBeVisible();

    const chips = getSubjectTypeChipList(page);
    for (const type of expectedTypes) {
      await expect(chips.filter({ hasText: type })).toHaveCount(1);
    }

    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(questionnaire.subjectType).toEqual(expect.arrayContaining(expectedTypes));
  });

  test('should keep imported subjectType values when requested', async ({ page }) => {
    await page.locator('input[type="radio"][value="existing"]').click();
    await page.locator('input[type="radio"][value="local"]').click();

    await PWUtils.importLocalFile(page, 'subject-type-r4-only.json');

    const warningDialog = page.getByRole('dialog', { name: 'Subject type compatibility' });
    await expect(warningDialog).toContainText('CatalogEntry');
    await expect(warningDialog).toContainText('not valid in FHIR R5');
    await expect(warningDialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(warningDialog.getByRole('button', { name: 'Keep and continue' })).toBeVisible();
    await expect(warningDialog.getByRole('button', { name: 'Remove incompatible types' })).toBeVisible();
    await warningDialog.getByRole('button', { name: 'Keep and continue' }).click();

    await PWUtils.expandAdvancedFields(page);
    const chips = getSubjectTypeChipList(page);
    await expect(chips.filter({ hasText: 'CatalogEntry (R4)' })).toHaveCount(1);
  });

  test('should remove incompatible imported subjectType values when requested', async ({ page }) => {
    await page.locator('input[type="radio"][value="existing"]').click();
    await page.locator('input[type="radio"][value="local"]').click();

    await PWUtils.importLocalFile(page, 'subject-type-r4-only.json');

    const warningDialog = page.getByRole('dialog', { name: 'Subject type compatibility' });
    await expect(warningDialog).toContainText('CatalogEntry');
    await warningDialog.getByRole('button', { name: 'Remove incompatible types' }).click();

    await PWUtils.expandAdvancedFields(page);
    const chips = getSubjectTypeChipList(page);
    await expect(chips.filter({ hasText: 'Patient' })).toHaveCount(1);
    await expect(chips.filter({ hasText: 'CatalogEntry' })).toHaveCount(0);

    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(questionnaire.subjectType).toEqual(['Patient']);
  });

  test('should export anyway with incompatible subjectType values when requested', async ({ page }, testInfo) => {
    await startScratchForm(page);

    const subjectTypeInput = getSubjectTypeInput(page);
    await PWUtils.typeAndSelect(subjectTypeInput, 'Patient');
    await PWUtils.typeAndSelect(subjectTypeInput, 'ActorDefinition');

    const questionnaire = await exportToFile(
      page,
      'R4',
      'Export anyway',
      testInfo.outputPath('subject-type-export-anyway.R4.json')
    );

    expect(questionnaire.subjectType).toEqual(expect.arrayContaining(['Patient', 'ActorDefinition']));
  });

  test('should remove incompatible subjectType values from export when requested', async ({ page }, testInfo) => {
    await startScratchForm(page);

    const subjectTypeInput = getSubjectTypeInput(page);
    await PWUtils.typeAndSelect(subjectTypeInput, 'Patient');
    await PWUtils.typeAndSelect(subjectTypeInput, 'ActorDefinition');

    const questionnaire = await exportToFile(
      page,
      'R4',
      'Remove incompatible types and export',
      testInfo.outputPath('subject-type-export-drop.R4.json')
    );

    expect(questionnaire.subjectType).toEqual(['Patient']);

    const currentQuestionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(currentQuestionnaire.subjectType).toEqual(expect.arrayContaining(['Patient', 'ActorDefinition']));
  });

  test('should show compatibility warning on preview JSON tabs for R4 and STU3', async ({ page }) => {
    await startScratchForm(page);

    const subjectTypeInput = getSubjectTypeInput(page);
    await PWUtils.typeAndSelect(subjectTypeInput, 'Patient');
    await PWUtils.typeAndSelect(subjectTypeInput, 'AdministrableProductDefinition');
    await PWUtils.typeAndSelect(subjectTypeInput, 'Citation');

    await PWUtils.clickMenuBarButton(page, 'Preview');
    await page.getByRole('tab', { name: 'View/Validate Questionnaire JSON' }).click();

    const previewDialog = page.locator('lfb-preview-dlg');
    const r4Warning = page.getByText('This Questionnaire has subject types that are not valid in FHIR R4:');
    await expect(r4Warning).toBeVisible();
    await expect(previewDialog).toContainText(/This Questionnaire has subject types that are not valid in FHIR R4:[\s\S]*AdministrableProductDefinition[\s\S]*Citation[\s\S]*the R4 output may fail validation\./);

    await page.getByRole('tab', { name: 'STU3 Version' }).click();
    const stu3Warning = page.getByText('This Questionnaire has subject types that are not valid in FHIR STU3:');
    await expect(stu3Warning).toBeVisible();
    await expect(previewDialog).toContainText(/This Questionnaire has subject types that are not valid in FHIR STU3:[\s\S]*AdministrableProductDefinition[\s\S]*Citation[\s\S]*the STU3 output may fail validation\./);
  });
});
