import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

test.describe('form-level fields', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
  });

  test('should edit tags', async ({page}) => {
    const tableData = [
      ['1a', '1b', '1c'],
      ['2a', '2b', '2c'],
      ['3a', '3b', '3c'],
      ['4a', '4b', '4c']
    ];
    await mainPO.page.getByRole('button', {name: 'Advanced fields'}).click();
    const tableLoc = page.locator('lfb-table')
      .filter({has: page.getByLabel('Tags')}).getByRole('table');
    await mainPO.loadTable(tableLoc, tableData);

    const q = await PWUtils.getQuestionnaireJSON(page, 'R4');
    // Ignore the generated tag.
    const inputTags = q.meta.tag.filter((e, i) => i < 4);
    expect(inputTags).toStrictEqual([{
      display: '1a',
      code: '1b',
      system: '1c'
    }, {
      display: '2a',
      code: '2b',
      system: '2c'
    }, {
      display: '3a',
      code: '3b',
      system: '3c'
    }, {
      display: '4a',
      code: '4b',
      system: '4c'
    }]);
  });

  test('should import questionnaire with tags', async ({page}) => {
    const q = await PWUtils.uploadFile(page, 'fixtures/fl-tag-sample.json');
    await mainPO.page.getByRole('button', {name: 'Advanced fields'}).click();
    const rows = await page.locator('lfb-table')
      .filter({has: page.getByLabel('Tags')}).locator( 'table > tbody > tr').all();
    expect(rows.length).toBe(3);
    const qJson = await PWUtils.getQuestionnaireJSON(page, 'R4');
    // Ignore the generated tag.
    const inputTags = qJson.meta.tag.filter((e, i) => i < 3);
    expect(inputTags).toStrictEqual(q.meta.tag);
  });
});
