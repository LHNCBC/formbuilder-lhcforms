import {expect, test} from '@playwright/test';
import {MainPO} from './po/main-po';
import {PWUtils} from './pw-utils';

const hiddenUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-hidden';
const hiddenExtension = {url: hiddenUrl, valueBoolean: true};
const hiddenLabel = 'Hide this item from users?';

const getHiddenExtensions = (item: any) =>
  (item.extension || []).filter((extension: any) => extension.url === hiddenUrl);

test.describe('Questionnaire hidden item extension', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    mainPO = new MainPO(page);
    await page.goto('/');
    await mainPO.loadHomePage();
  });

  test('should create, export, remove, and recreate a hidden item', async ({page}) => {
    await page.locator('input[type="radio"][value="scratch"]').click();
    await page.getByRole('button', {name: 'Continue'}).click();
    await PWUtils.getButton(page, 'Toolbar with button groups', 'Create questions').click();
    await expect(await PWUtils.getItemTextField(page)).toHaveValue('Item 0', {timeout: 10000});
    await PWUtils.expandAdvancedFields(page);

    await PWUtils.expectRadioChecked(page, hiddenLabel, 'No');
    await PWUtils.expectRadioNotChecked(page, hiddenLabel, 'Yes');
    await PWUtils.clickRadioButton(page, hiddenLabel, 'Yes');

    for (const version of ['R5', 'R4', 'STU3']) {
      const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, version);
      expect(getHiddenExtensions(questionnaire.item[0])).toEqual([hiddenExtension]);
    }

    await PWUtils.clickRadioButton(page, hiddenLabel, 'No');
    let questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(getHiddenExtensions(questionnaire.item[0])).toEqual([]);
    expect(questionnaire.item[0].extension).toBeUndefined();

    await PWUtils.clickRadioButton(page, hiddenLabel, 'Yes');
    questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(getHiddenExtensions(questionnaire.item[0])).toEqual([hiddenExtension]);
  });

  test('should import hidden state and preserve an untouched false extension', async ({page}) => {
    await page.locator('input[type="radio"][value="scratch"]').click();
    await page.getByRole('button', {name: 'Continue'}).click();
    await PWUtils.uploadFile(page, 'questionnaire-hidden-sample.json');
    await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
    await expect(page.locator('.spinner-border')).not.toBeVisible();
    await PWUtils.expandAdvancedFields(page);

    await PWUtils.expectRadioChecked(page, hiddenLabel, 'Yes');
    await PWUtils.clickAndToggleTreeNode(page, 'Hidden parent');
    await expect(await PWUtils.getTreeNode(page, 'Hidden child')).toBeVisible();

    let questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(getHiddenExtensions(questionnaire.item[0])).toEqual([hiddenExtension]);
    expect(questionnaire.item[0].item[0].extension).toBeUndefined();

    await PWUtils.clickTreeNode(page, 'Explicitly visible item');
    await PWUtils.expandAdvancedFields(page);
    await PWUtils.expectRadioChecked(page, hiddenLabel, 'No');

    for (const version of ['R5', 'R4', 'STU3']) {
      questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, version);
      expect(getHiddenExtensions(questionnaire.item[1])).toEqual([{
        url: hiddenUrl,
        valueBoolean: false
      }]);
    }

    await PWUtils.clickTreeNode(page, 'Hidden parent');
    await PWUtils.expandAdvancedFields(page);
    await PWUtils.clickRadioButton(page, hiddenLabel, 'No');
    questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(getHiddenExtensions(questionnaire.item[0])).toEqual([]);
    expect(questionnaire.item[0].extension).toBeUndefined();
    expect(questionnaire.item[0].item[0].text).toBe('Hidden child');
    expect(getHiddenExtensions(questionnaire.item[1])).toEqual([{
      url: hiddenUrl,
      valueBoolean: false
    }]);
  });
});
