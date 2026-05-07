import {test, expect, Page} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

const getDateRangeInputs = (page: Page) => {
  const widget = page.locator('lfb-date-range');
  return {
    startInput: widget.getByRole('textbox', {name: /^Start/}),
    endInput: widget.getByRole('textbox', {name: /^End/})
  };
};

test.describe('date-range (effectivePeriod) widget', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
    await page.getByRole('button', {name: 'Advanced fields'}).click();
  });

  test('should enter start and end dates and output effectivePeriod', async ({page}) => {
    const {startInput, endInput} = getDateRangeInputs(page);

    await startInput.click();
    await startInput.fill('2024-03-01');
    await startInput.press('Tab');

    await endInput.click();
    await endInput.fill('2024-06-30');
    await endInput.press('Tab');

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.effectivePeriod).toEqual({start: '2024-03-01', end: '2024-06-30'});
  });

  test('should import effectivePeriod from file', async ({page}) => {
    await PWUtils.uploadFile(page, 'effective-period-sample.json');
    await page.getByRole('button', {name: 'Advanced fields'}).click();

    const {startInput, endInput} = getDateRangeInputs(page);

    await expect(startInput).toHaveValue('2024-01-15');
    await expect(endInput).toHaveValue('2024-12-31');

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.effectivePeriod).toEqual({start: '2024-01-15', end: '2024-12-31'});
  });

  test('should import dateTime effectivePeriod values from file', async ({page}) => {
    await PWUtils.uploadFile(page, 'effective-period-datetime-sample.json');
    await page.getByRole('button', {name: 'Advanced fields'}).click();

    const {startInput, endInput} = getDateRangeInputs(page);

    await expect(startInput).toHaveValue(/2024-01-15/);
    await expect(endInput).toHaveValue(/2024-12-31/);

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.effectivePeriod).toEqual({
      start: '2024-01-15T12:30:00Z',
      end: '2024-12-31T18:45:00Z'
    });
  });

  test('should show range error for imported invalid effectivePeriod', async ({page}) => {
    await PWUtils.uploadFile(page, 'effective-period-invalid-sample.json');
    await page.getByRole('button', {name: 'Advanced fields'}).click();

    const errorMsg = page.locator('lfb-date-range small.text-danger[role="alert"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('End date must be on or after start date.');
  });

  test('should show error and clear invalid start date on blur', async ({page}) => {
    const {startInput, endInput} = getDateRangeInputs(page);

    // Set end date first
    await endInput.click();
    await endInput.fill('2024-03-01');
    await endInput.press('Tab');

    // Set start date after end date
    await startInput.click();
    await startInput.fill('2024-05-01');

    // Error should show while typing
    const errorMsg = page.locator('small.text-danger[role="alert"]');
    await expect(errorMsg).toBeVisible();

    // On blur, the invalid start date should be cleared
    await startInput.press('Tab');
    await expect(startInput).toHaveValue('');
  });

  test('should show error and clear invalid end date on blur', async ({page}) => {
    const {startInput, endInput} = getDateRangeInputs(page);

    // Set start date first
    await startInput.click();
    await startInput.fill('2024-06-15');
    await startInput.press('Tab');

    // Set end date before start date
    await endInput.click();
    await endInput.fill('2024-03-01');

    // Error should show while typing
    const errorMsg = page.locator('small.text-danger[role="alert"]');
    await expect(errorMsg).toBeVisible();

    // On blur, the invalid end date should be cleared
    await endInput.press('Tab');
    await expect(endInput).toHaveValue('');
  });

  test('should allow any date if the other date is empty', async ({page}) => {
    const {startInput, endInput} = getDateRangeInputs(page);

    // Set only start date - should be fine
    await startInput.click();
    await startInput.fill('2025-12-31');
    await startInput.press('Tab');
    await expect(startInput).toHaveValue('2025-12-31');

    // Set only end date (clear start first)
    await startInput.clear();
    await startInput.press('Tab');
    await endInput.click();
    await endInput.fill('2020-01-01');
    await endInput.press('Tab');
    await expect(endInput).toHaveValue('2020-01-01');
  });

  test('should pick date from calendar popup', async ({page}) => {
    const startCalBtn = page.getByRole('button', {name: 'Date time picker for Start'});
    await startCalBtn.click();

    // The calendar popup should be visible
    const datepicker = page.locator('ngb-datepicker');
    await expect(datepicker).toBeVisible();

    // Click a day
    await datepicker.locator('.ngb-dp-day').filter({hasText: /^15$/}).first().click();

    const {startInput} = getDateRangeInputs(page);
    await expect(startInput).not.toHaveValue('');

    // Pick end date from calendar popup
    const endCalBtn = page.getByRole('button', {name: 'Date time picker for End'});
    await endCalBtn.click();

    const endDatepicker = page.locator('ngb-datepicker');
    await expect(endDatepicker).toBeVisible();

    // Click a day
    await endDatepicker.locator('.ngb-dp-day').filter({hasText: /^20$/}).first().click();

    const {endInput} = getDateRangeInputs(page);
    await expect(endInput).not.toHaveValue('');
  });
});
