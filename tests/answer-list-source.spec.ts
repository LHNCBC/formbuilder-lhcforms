import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils} from "./pw-utils";

test.describe('answerOptions', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();
    await PWUtils.uploadFile(page, 'answer-option-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
  });


  test('should display answer options', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Item with answer options');
    await PWUtils.expectDataTypeValue(page, /coding/);
    await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
    await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer options');

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await PWUtils.expectValueCodings(page, 'answerOption',
      [
        { system: 'http://snomed.info/sct', display: 'Hearing', code: '47078008' },
        { system: 'http://snomed.info/sct', display: 'Entire hip joint', code: '182201002' },
        { system: 'http://snomed.info/sct', display: 'No pain', code: '81765008' }
      ]
    );
  });

  test('should display missing system answer options', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Item with missing system answer options');
    await PWUtils.expectDataTypeValue(page, /coding/);
    await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
    await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer options');

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await PWUtils.expectValueCodings(page, 'answerOption',
      [
        { display: 'Hearing', code: '47078008' },
        { display: 'Entire hip joint', code: '182201002' },
        { display: 'No pain', code: '81765008' }
      ]
    );
  });

  test('should display missing display answer options', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Item with missing display answer options');
    await PWUtils.expectDataTypeValue(page, /coding/);
    await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
    await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer options');

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await PWUtils.expectValueCodings(page, 'answerOption',
      [
        { system: 'http://snomed.info/sct', code: '47078008' },
        { system: 'http://snomed.info/sct', code: '182201002' },
        { system: 'http://snomed.info/sct', code: '81765008' }
      ]
    );
  });

  test('should display missing code answer options', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Item with missing code answer options');
    await PWUtils.expectDataTypeValue(page, /coding/);
    await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
    await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer options');

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await PWUtils.expectValueCodings(page, 'answerOption',
      [
        { system: 'http://snomed.info/sct', display: 'Hearing' },
        { system: 'http://snomed.info/sct', display: 'Entire hip joint' },
        { system: 'http://snomed.info/sct', display: 'No pain' }
      ]
    );
  });

  test('should display just display answer options', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Item with just display answer options');
    await PWUtils.expectDataTypeValue(page, /coding/);
    await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
    await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer options');

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await PWUtils.expectValueCodings(page, 'answerOption',
      [
        { display: 'Hearing' },
        { display: 'Entire hip joint' },
        { display: 'No pain' }
      ]
    );
  });

  test('should display just code answer options', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Item with just code answer options');
    await PWUtils.expectDataTypeValue(page, /coding/);
    await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
    await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer options');

    await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);
    await PWUtils.expectValueCodings(page, 'answerOption',
      [
        { code: '47078008' },
        { code: '182201002' },
        { code: '81765008' }
      ]
    );
  });
});