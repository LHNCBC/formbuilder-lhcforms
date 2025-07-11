import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

test.describe('Date, DateTime, and Time types', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();
    await PWUtils.uploadFile(page, './fixtures/date-datetime-time-sample.json', true);
    await page.getByRole('button', {name: 'Edit questions'}).last().click();
  });

  test('Date - should import and edit', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Date field - 1');
    const input = page.locator('input[id*=".valueDate_"]');
    await expect(input).toHaveValue('2000-01-02');
    await input.fill('2000-12-13');
    PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5').then((json) => {
      expect(json.item[0].initial[0].valueDate).toMatch(/^2000-12-1\d$/);
    });
    await expect(input).toHaveValue('2000-12-13');
  });

  test('Datetime - should import and edit', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'DateTime field - 1');
    const input = page.locator('input[id*=".valueDateTime_"]');
    await expect(input).toHaveValue(/^2001-01-0\d \d{2}:\d{2}:\d{2} [AP]M$/);
    await input.fill('2000-12-13 02:02:02 PM');
    PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5').then((json) => {
      expect(json.item[1].initial[0].valueDateTime).toMatch(/2000-12-1\dT\d{2}:\d{2}:\d{2}Z/);
    });
    await expect(input).toHaveValue('2000-12-13 02:02:02 PM');
  });

  test('Time - should import and edit', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Time field - 2');
    const input = page.locator('input[id*=".valueTime_"]');
    await expect(input).toHaveValue('12:34:56.789');
    await input.fill('13:45:00.123');
    PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5').then((json) => {
      expect(json.item[2].initial[0].valueTime).toBe('13:45:00.123');
    });
    await expect(input).toHaveValue('13:45:00.123');
  });

});
