import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

test.describe('form-level fields', () => {
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
    const tableLoc = PWUtils.getTableByFieldLabel(page.locator('lfb-form-fields'), 'Tags');
    await mainPO.loadTable(tableLoc, tableData);

    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
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
    const q = await PWUtils.uploadFile(page, 'fl-tag-sample.json');
    await mainPO.page.getByRole('button', { name: 'Advanced fields' }).click();
    const rows = await PWUtils.getTableByFieldLabel(page.locator('lfb-form-fields'), 'Tags')
      .locator('tbody > tr').all();
    expect(rows.length).toBe(3);
    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    // Ignore the generated tag.
    const inputTags = qJson.meta.tag.filter((e, i) => i < 3);
    expect(inputTags).toStrictEqual(q.meta.tag);
  });

  /** Verify advanced-field visibility, repeated concepts/codings, editing, and removal. */
  test('should edit jurisdiction in advanced form-level fields', async ({page}) => {
    const addJurisdiction = page.getByRole('button', {name: 'Add jurisdiction', exact: true});
    await expect(addJurisdiction).toBeHidden();
    await PWUtils.expandAdvancedFields(page);
    await expect(addJurisdiction).toBeVisible();
    expect((await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).jurisdiction).toBeUndefined();

    await addJurisdiction.click();
    const jurisdiction = page.getByRole('group', {name: /^Jurisdiction/});
    const text = page.locator('input[id^="jurisdiction.0.text_"]');
    await text.fill('United States');
    await page.locator('input[id^="jurisdiction.0.coding.0.display_"]').fill('United States of America');
    await page.locator('input[id^="jurisdiction.0.coding.0.code_"]').fill('US');
    await page.locator('input[id^="jurisdiction.0.coding.0.system_"]').fill('urn:iso:std:iso:3166');
    await jurisdiction.getByRole('button', {name: 'Add coding', exact: true}).click();
    await page.locator('input[id^="jurisdiction.0.coding.1.display_"]').fill('United States of America');
    await page.locator('input[id^="jurisdiction.0.coding.1.code_"]').fill('840');
    await page.locator('input[id^="jurisdiction.0.coding.1.system_"]').fill('http://unstats.un.org/unsd/methods/m49/m49.htm');

    await addJurisdiction.click();
    const secondText = page.locator('input[id^="jurisdiction.1.text_"]');
    await secondText.fill('Local health district');
    await secondText.blur();

    const expected = [
      {
        text: 'United States',
        coding: [
          {display: 'United States of America', code: 'US', system: 'urn:iso:std:iso:3166'},
          {display: 'United States of America', code: '840', system: 'http://unstats.un.org/unsd/methods/m49/m49.htm'}
        ]
      },
      {text: 'Local health district'}
    ];
    for (const version of ['R5', 'R4', 'STU3']) {
      expect((await PWUtils.getQuestionnaireJSONWithoutUI(page, version)).jurisdiction).toEqual(expected);
    }

    await PWUtils.collapseAdvancedFields(page);
    await expect(addJurisdiction).toBeHidden();
    await PWUtils.expandAdvancedFields(page);
    await expect(text).toHaveValue('United States');
    await text.fill('Updated jurisdiction');
    await text.blur();
    expected[0].text = 'Updated jurisdiction';

    await jurisdiction.locator('lfb-table').first().getByRole('button', {name: 'Remove this row', exact: true}).first().click();
    await page.getByRole('dialog').getByRole('button', {name: 'Delete', exact: true}).click();
    expected[0].coding!.shift();
    expect((await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).jurisdiction).toEqual(expected);

    await jurisdiction.getByRole('button', {name: 'Remove this item', exact: true}).first().click();
    await page.getByRole('dialog').getByRole('button', {name: 'Delete', exact: true}).click();
    expect((await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).jurisdiction).toEqual([expected[1]]);

    await jurisdiction.getByRole('button', {name: 'Remove this item', exact: true}).first().click();
    await page.getByRole('dialog').getByRole('button', {name: 'Delete', exact: true}).click();
    expect((await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).jurisdiction).toBeUndefined();
  });

  /** Verify importing and editing jurisdiction retains all CodeableConcept and Coding metadata. */
  test('should retain imported jurisdiction metadata when editing', async ({page}) => {
    const jurisdiction = [
      {
        id: 'jurisdiction-1',
        extension: [{url: 'http://example.org/jurisdiction-note', valueString: 'Retain concept metadata'}],
        text: 'United States',
        coding: [
          {
            id: 'coding-1',
            extension: [{url: 'http://example.org/coding-note', valueString: 'Retain coding metadata'}],
            display: 'United States of America',
            code: 'US',
            system: 'urn:iso:std:iso:3166',
            version: '2020',
            userSelected: true
          },
          {code: '840', system: 'http://unstats.un.org/unsd/methods/m49/m49.htm'}
        ]
      },
      {text: 'Local health district'}
    ];
    const questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      title: 'Jurisdiction sample',
      jurisdiction,
      item: [{linkId: 'q1', text: 'Question', type: 'string'}]
    };
    const chooserPromise = page.waitForEvent('filechooser');
    await PWUtils.clickMenuBarDropdownItem(page, 'Import', 'Import from file...');
    await (await chooserPromise).setFiles({
      name: 'jurisdiction.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(questionnaire))
    });
    await expect(mainPO.titleLocator).toHaveValue(questionnaire.title);
    await PWUtils.expandAdvancedFields(page);

    const text = page.locator('input[id^="jurisdiction.0.text_"]');
    await expect(text).toHaveValue('United States');
    await expect(page.locator('input[id^="jurisdiction.0.coding.0.code_"]')).toHaveValue('US');
    await expect(page.locator('input[id^="jurisdiction.0.coding.1.code_"]')).toHaveValue('840');
    await expect(page.locator('input[id^="jurisdiction.1.text_"]')).toHaveValue('Local health district');
    expect((await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).jurisdiction).toEqual(jurisdiction);

    await text.fill('Edited region');
    await text.blur();
    jurisdiction[0].text = 'Edited region';
    for (const version of ['R5', 'R4', 'STU3']) {
      expect((await PWUtils.getQuestionnaireJSONWithoutUI(page, version)).jurisdiction).toEqual(jurisdiction);
    }
  });
});
