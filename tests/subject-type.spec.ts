import { test, expect, Page } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

const getSubjectTypeInput = (page: Page) =>
  page.locator('input[id^="subjectType"][id$="_ac"]:visible').first();

const getSubjectTypeChipList = (page: Page) =>
  getSubjectTypeInput(page).locator('xpath=..').locator('li');

test.describe('Subject type autocomplete', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    mainPO = new MainPO(page);
    await mainPO.mockSnomedEditions();
    await page.goto('/');
    await mainPO.loadHomePage();
  });

  test('should add selected subjectType values as chips and persist in Questionnaire JSON', async ({ page }) => {
    await page.locator('input[type="radio"][value="scratch"]').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await PWUtils.expandAdvancedFields(page);

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
});
