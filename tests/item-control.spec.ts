import { test, expect } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

const itemControlExtensions = {
  'drop-down': {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'drop-down',
        display: 'Drop down',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  autocomplete: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'autocomplete',
        display: 'Auto-complete',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  'radio-button': {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'radio-button',
        display: 'Radio Button',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  'check-box': {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'check-box',
        display: 'Check-box',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  }
};

const groupItemControlExtensions = {
  list: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'list',
        display: 'List',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  table: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'table',
        display: 'Vertical Answer Table',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  htable: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'htable',
        display: 'Horizontal Answer Table',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  gtable: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'gtable',
        display: 'Group Table',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  grid: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'grid',
        display: 'Group Grid',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  header: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'header',
        display: 'Header',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  footer: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'footer',
        display: 'Footer',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  page: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'page',
        display: 'Page',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  },
  'tab-container': {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        code: 'tab-container',
        display: 'Tab Container',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  }
};

const displayItemControlExtensions = {
  inline: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        system: 'http://hl7.org/fhir/questionnaire-item-control',
        code: 'inline',
        display: 'In-line'
      }]
    }
  },
  prompt: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        system: 'http://hl7.org/fhir/questionnaire-item-control',
        code: 'prompt',
        display: 'Prompt'
      }]
    }
  },
  unit: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        system: 'http://hl7.org/fhir/questionnaire-item-control',
        code: 'unit',
        display: 'Unit'
      }]
    }
  },
  lower: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        system: 'http://hl7.org/fhir/questionnaire-item-control',
        code: 'lower',
        display: 'Lower-bound'
      }]
    }
  },
  upper: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        system: 'http://hl7.org/fhir/questionnaire-item-control',
        code: 'upper',
        display: 'Upper-bound'
      }]
    }
  },
  flyover: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        system: 'http://hl7.org/fhir/questionnaire-item-control',
        code: 'flyover',
        display: 'Fly-over'
      }]
    }
  },
  legal: {
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      coding: [{
        system: 'http://hl7.org/fhir/questionnaire-item-control',
        code: 'legal',
        display: 'Legal-Button'
      }]
    }
  }
};

test.describe('Item control', () => {
  let mainPO: MainPO;

  test.describe('Item control options (new item)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      mainPO = new MainPO(page);
      await mainPO.loadILPage();

      const questionTextField = await PWUtils.getItemTextField(page);
      await expect(questionTextField).toHaveValue('Item 0', { timeout: 10000 });
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
    });

    test('should create item-control extension with autocomplete option', async ({ page }) => {
      const dropDownBtn = '[for^="__\\$itemControl\\.drop-down"]';
      const radioBtn = '[for^="__\\$itemControl\\.radio-button"]';
      const checkboxBtn = '[for^="__\\$itemControl\\.check-box"]';
      const acBtn = '[for^="__\\$itemControl\\.autocomplete"]';

      const dropDownRadio = '#__\\$itemControl\\.drop-down';
      const unspecifiedRadio = '#__\\$itemControl\\.unspecified';
      const checkboxRadio = '#__\\$itemControl\\.check-box';

      await PWUtils.selectDataType(page, 'coding');

      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Allow free text');

      const nonSnomedMethod = page.locator('[for^="__\\$answerOptionMethods_value-set"]');
      const answerOptionMethod = page.locator('[for^="__\\$answerOptionMethods_answer-option"]');
      const snomedMethod = page.locator('[for^="__\\$answerOptionMethods_snomed-value-set"]');

      await answerOptionMethod.click();

      await expect(page.locator(dropDownBtn)).toBeVisible();
      await expect(page.locator(unspecifiedRadio)).toBeChecked();
      await expect(page.locator(radioBtn)).toBeVisible();
      await expect(page.locator(checkboxBtn)).toHaveCount(0);
      await expect(page.locator(acBtn)).toHaveCount(0);

      for (const vsMethod of [snomedMethod, nonSnomedMethod]) {
        await vsMethod.click();
        await expect(page.locator(dropDownBtn)).toBeVisible();
        await expect(page.locator(unspecifiedRadio)).toBeChecked();
        await expect(page.locator(radioBtn)).toBeVisible();
        await expect(page.locator(checkboxBtn)).toHaveCount(0);
        await expect(page.locator(acBtn)).toBeVisible();
      }

      await snomedMethod.click();

      for (const option of ['radio-button', 'autocomplete'] as const) {
        const optBtn = page.locator(`[for^="__\\$itemControl\\.${option}"]`);
        const optRadioId = page.locator(`#__\\$itemControl\\.${option}`);

        await optBtn.click();
        await expect(optRadioId).toBeChecked();

        const json = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
        expect(json.item[0].extension).toEqual([itemControlExtensions[option]]);
      }

      await page.locator(dropDownBtn).click();
      await expect(page.locator(dropDownRadio)).toBeChecked();

      const json = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(json.item[0].extension).toEqual([itemControlExtensions['drop-down']]);

      await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'Yes');

      await expect(page.locator(dropDownBtn)).toBeVisible();
      await expect(page.locator(dropDownRadio)).toBeChecked();
      await expect(page.locator(radioBtn)).toHaveCount(0);
      await expect(page.locator(checkboxBtn)).toBeVisible();
      await expect(page.locator(acBtn)).toBeVisible();

      await page.locator(checkboxBtn).click();
      await expect(page.locator(checkboxRadio)).toBeChecked();

      const repeatJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(repeatJson.item[0].extension).toEqual([itemControlExtensions['check-box']]);
    });

    test('should import with item having item-control extension', async ({ page }) => {
      const dropDownBtn = '[for^="__\\$itemControl\\.drop-down"]';
      const radioBtn = '[for^="__\\$itemControl\\.radio-button"]';
      const checkboxBtn = '[for^="__\\$itemControl\\.check-box"]';
      const acBtn = '[for^="__\\$itemControl\\.autocomplete"]';

      const dropDownRadio = '#__\\$itemControl\\.drop-down';
      const checkRadio = '#__\\$itemControl\\.check-box';
      const radioRadio = '#__\\$itemControl\\.radio-button';
      const acRadio = '#__\\$itemControl\\.autocomplete';

      const answerMethodsAnswerOptionRadio = '#__\\$answerOptionMethods_answer-option';
      const answerMethodsValueSetRadio = '#__\\$answerOptionMethods_value-set';

      await PWUtils.uploadFile(page, 'item-control-sample.json', true);

      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await expect(titleField).toHaveValue('Item control sample form');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await expect(page.locator(answerMethodsAnswerOptionRadio)).toBeChecked();
      await expect(page.locator(dropDownRadio)).toBeVisible();
      await expect(page.locator(dropDownRadio)).toBeChecked();
      await expect(page.locator(radioBtn)).toBeVisible();
      await expect(page.locator(acBtn)).toHaveCount(0);
      await expect(page.locator(checkboxBtn)).toHaveCount(0);

      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].type).toBe('coding');
      expect(qJson.item[0].text).toBe('Answer option dropdown');
      expect(qJson.item[0].extension).toEqual([itemControlExtensions['drop-down']]);

      await PWUtils.clickTreeNode(page, 'Answer option radio-button');
      await expect(page.locator(answerMethodsAnswerOptionRadio)).toBeChecked();
      await expect(page.locator(dropDownBtn)).toBeVisible();
      await expect(page.locator(dropDownRadio)).not.toBeChecked();
      await expect(page.locator(radioBtn)).toBeVisible();
      await expect(page.locator(radioRadio)).toBeChecked();
      await expect(page.locator(acBtn)).toHaveCount(0);
      await expect(page.locator(checkboxBtn)).toHaveCount(0);

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[1].type).toBe('coding');
      expect(qJson.item[1].text).toBe('Answer option radio-button');
      expect(qJson.item[1].extension).toEqual([itemControlExtensions['radio-button']]);

      await PWUtils.clickTreeNode(page, 'Answer option check-box');
      await expect(page.locator(answerMethodsAnswerOptionRadio)).toBeChecked();
      await expect(page.locator(dropDownBtn)).toBeVisible();
      await expect(page.locator(dropDownRadio)).not.toBeChecked();
      await expect(page.locator(checkboxBtn)).toBeVisible();
      await expect(page.locator(checkRadio)).toBeChecked();
      await expect(page.locator(radioBtn)).toHaveCount(0);
      await expect(page.locator(acBtn)).toHaveCount(0);

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[2].type).toBe('coding');
      expect(qJson.item[2].text).toBe('Answer option check-box');
      expect(qJson.item[2].repeats).toBe(true);
      expect(qJson.item[2].extension).toEqual([itemControlExtensions['check-box']]);

      await PWUtils.clickTreeNode(page, 'Valueset autocomplete');
      await expect(page.locator(answerMethodsValueSetRadio)).toBeChecked();
      await expect(page.locator(dropDownBtn)).toBeVisible();
      await expect(page.locator(dropDownRadio)).not.toBeChecked();
      await expect(page.locator(acBtn)).toBeVisible();
      await expect(page.locator(acRadio)).toBeChecked();
      await expect(page.locator(radioBtn)).toBeVisible();
      await expect(page.locator(radioRadio)).not.toBeChecked();
      await expect(page.locator(checkboxBtn)).toHaveCount(0);

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[3].type).toBe('coding');
      expect(qJson.item[3].text).toBe('Valueset autocomplete');
      expect(qJson.item[3].extension[1]).toEqual(itemControlExtensions.autocomplete);

      await PWUtils.clickTreeNode(page, 'Valueset radio-button');
      await expect(page.locator(answerMethodsValueSetRadio)).toBeChecked();
      await expect(page.locator(dropDownBtn)).toBeVisible();
      await expect(page.locator(dropDownRadio)).not.toBeChecked();
      await expect(page.locator(acBtn)).toBeVisible();
      await expect(page.locator(acRadio)).not.toBeChecked();
      await expect(page.locator(radioBtn)).toBeVisible();
      await expect(page.locator(radioRadio)).toBeChecked();
      await expect(page.locator(checkboxBtn)).toHaveCount(0);

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[4].type).toBe('coding');
      expect(qJson.item[4].text).toBe('Valueset radio-button');
      expect(qJson.item[4].extension[1]).toEqual(itemControlExtensions['radio-button']);

      await PWUtils.clickTreeNode(page, 'Valueset check-box');
      await expect(page.locator(answerMethodsValueSetRadio)).toBeChecked();
      await expect(page.locator(dropDownBtn)).toBeVisible();
      await expect(page.locator(dropDownRadio)).not.toBeChecked();
      await expect(page.locator(acBtn)).toBeVisible();
      await expect(page.locator(acRadio)).not.toBeChecked();
      await expect(page.locator(checkboxBtn)).toBeVisible();
      await expect(page.locator(checkRadio)).toBeChecked();
      await expect(page.locator(radioBtn)).toHaveCount(0);

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[5].type).toBe('coding');
      expect(qJson.item[5].text).toBe('Valueset check-box');
      expect(qJson.item[5].repeats).toBe(true);
      expect(qJson.item[5].extension[1]).toEqual(itemControlExtensions['check-box']);
    });
  });

  test.describe('Group item control', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      mainPO = new MainPO(page);
      await mainPO.loadILPage();

      await PWUtils.uploadFile(page, 'USSG-family-portrait.json', true);
      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await expect(titleField).toHaveValue('US Surgeon General family health portrait');

      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();
    });

    test('should create group item-control extension with autocomplete option', async ({ page }) => {
      const icgTag = 'lfb-item-control-group';
      const listBtn = '[for^="__\\$itemControlGroup\\.list"]';
      const verticalAnsTblBtn = '[for^="__\\$itemControlGroup\\.table"]';
      const horizontalAnsTblBtn = '[for^="__\\$itemControlGroup\\.htable"]';
      const groupTblBtn = '[for^="__\\$itemControlGroup\\.gtable"]';
      const groupGridBtn = '[for^="__\\$itemControlGroup\\.grid"]';
      const headerBtn = '[for^="__\\$itemControlGroup\\.header"]';
      const footerBtn = '[for^="__\\$itemControlGroup\\.footer"]';
      const pageBtn = '[for^="__\\$itemControlGroup\\.page"]';
      const tabContainerBtn = '[for^="__\\$itemControlGroup\\.tab-container"]';

      const listRadio = '#__\\$itemControlGroup\\.list';
      const verticalAnsTblRadio = '#__\\$itemControlGroup\\.table';
      const horizontalAnsTblRadio = '#__\\$itemControlGroup\\.htable';
      const groupTblRadio = '#__\\$itemControlGroup\\.gtable';
      const groupGridRadio = '#__\\$itemControlGroup\\.grid';
      const headerRadio = '#__\\$itemControlGroup\\.header';
      const footerRadio = '#__\\$itemControlGroup\\.footer';
      const pageRadio = '#__\\$itemControlGroup\\.page';
      const tabContainerRadio = '#__\\$itemControlGroup\\.tab-container';

      await PWUtils.expectDataTypeValue(page, /group/);
      await expect(page.locator(listRadio)).not.toBeChecked();

      // Select 'List' Group Item Control
      await page.locator(listBtn).click();
      await expect(page.locator(listRadio)).toBeChecked();
      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([groupItemControlExtensions.list]);

      // Select 'Vertical Answer Table' Group Item Control
      await page.locator(verticalAnsTblBtn).click();
      await expect(page.locator(verticalAnsTblRadio)).toBeChecked();
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([groupItemControlExtensions.table]);

      // Select 'Horizontal Answer Table' Group Item Control
      await page.locator(horizontalAnsTblBtn).click();
      await expect(page.locator(horizontalAnsTblRadio)).toBeChecked();
      await expect(page.locator(horizontalAnsTblBtn).locator('sup')).toContainText('(1)');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([groupItemControlExtensions.htable]);

      // Select 'Group Table' Group Item Control
      await page.locator(groupTblBtn).click();
      await expect(page.locator(groupTblRadio)).toBeChecked();
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([groupItemControlExtensions.gtable]);

      // Select 'Group Grid' Group Item Control
      await page.locator(groupGridBtn).click();
      await expect(page.locator(groupGridRadio)).toBeChecked();
      await expect(page.locator(groupGridBtn).locator('sup')).toContainText('(1)');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([groupItemControlExtensions.grid]);

      // Select 'Header' Group Item Control
      await page.locator(headerBtn).click();
      await expect(page.locator(headerRadio)).toBeChecked();
      await expect(page.locator(headerBtn).locator('sup')).toContainText('(1)');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([groupItemControlExtensions.header]);

      // Select 'Footer' Group Item Control
      await page.locator(footerBtn).click();
      await expect(page.locator(footerRadio)).toBeChecked();
      await expect(page.locator(footerBtn).locator('sup')).toContainText('(1)');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([groupItemControlExtensions.footer]);

      // Select 'Page' Group Item Control
      await page.locator(pageBtn).click();
      await expect(page.locator(pageRadio)).toBeChecked();
      await expect(page.locator(pageBtn).locator('sup')).toContainText('(1)');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([groupItemControlExtensions.page]);

      // Select 'Tab Container' Group Item Control
      await page.locator(tabContainerBtn).click();
      await expect(page.locator(tabContainerRadio)).toBeChecked();
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([groupItemControlExtensions['tab-container']]);
    });

    test('should be able to clear group item control selection', async ({ page }) => {
      const listBtn = '[for^="__\\$itemControlGroup\\.list"]';
      const listRadio = '#__\\$itemControlGroup\\.list';
      const unspecifiedBtn = '[for^="__\\$itemControlGroup\\.unspecified"]';
      const unspecifiedRadio = '#__\\$itemControlGroup\\.unspecified';

      await PWUtils.expectDataTypeValue(page, /group/);
      await expect(page.locator(listRadio)).not.toBeChecked();

      // Select 'List' Group Item Control.
      await page.locator(listBtn).click();
      await expect(page.locator(listRadio)).toBeChecked();
      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([groupItemControlExtensions.list]);

      // Clear the group item control selection
      await page.locator(unspecifiedBtn).click();
      await expect(page.locator(unspecifiedRadio)).toBeChecked();
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toBeUndefined();
    });

  });

  test.describe('Display item control', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      mainPO = new MainPO(page);
      await mainPO.loadILPage();

      await PWUtils.uploadFile(page, 'display-item-control-sample.json', true);

      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await expect(titleField).toHaveValue('Display item control sample form');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();
    });

    test('should display Display item-control extension', async ({ page }) => {
      const inlineBtn = '[for^="__\\$itemControlDisplay\\.inline"]';
      const lowerBtn = '[for^="__\\$itemControlDisplay\\.lower"]';
      const upperBtn = '[for^="__\\$itemControlDisplay\\.upper"]';
      const flyoverBtn = '[for^="__\\$itemControlDisplay\\.flyover"]';
      const legalBtn = '[for^="__\\$itemControlDisplay\\.legal"]';
      const unspecifiedBtn = '[for^="__\\$itemControlDisplay\\.unspecified"]';
      const inlineRadio = '#__\\$itemControlDisplay\\.inline';
      const promptRadio = '#__\\$itemControlDisplay\\.prompt';
      const unitRadio = '#__\\$itemControlDisplay\\.unit';
      const lowerRadio = '#__\\$itemControlDisplay\\.lower';
      const upperRadio = '#__\\$itemControlDisplay\\.upper';
      const flyoverRadio = '#__\\$itemControlDisplay\\.flyover';
      const legalRadio = '#__\\$itemControlDisplay\\.legal';
      const unspecifiedRadio = '#__\\$itemControlDisplay\\.unspecified';

      await PWUtils.expectDataTypeValue(page, /display/);
      await expect(page.locator(inlineRadio)).toBeChecked();
      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toEqual([displayItemControlExtensions.inline]);

      await page.locator(unspecifiedBtn).click();
      await expect(page.locator(unspecifiedRadio)).toBeChecked();
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toBeUndefined();

      await PWUtils.clickTreeNode(page, 'Prompt display item control - deprecated');
      await PWUtils.expectDataTypeValue(page, /display/);
      await expect(page.locator(promptRadio)).toHaveCount(0);
      await expect(page.locator('p[id^="deprecated_hint___\\$itemControlDisplay"]'))
        .toContainText("* 'Prompt' item control is deprecated and is not presented in this list of item controls.");
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[1].extension).toEqual([displayItemControlExtensions.prompt]);

      await page.locator(inlineBtn).click();
      await expect(page.locator(inlineRadio)).toBeChecked();
      await expect(page.locator('p[id^="deprecated_hint___\\$itemControlDisplay"]')).toHaveCount(0);
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[1].extension).toEqual([displayItemControlExtensions.inline]);

      await PWUtils.clickTreeNode(page, 'Unit display item control - deprecated');
      await PWUtils.expectDataTypeValue(page, /display/);
      await expect(page.locator(unitRadio)).toHaveCount(0);
      await expect(page.locator('p[id^="deprecated_hint___\\$itemControlDisplay"]'))
        .toContainText("* 'Unit' item control is deprecated and is not presented in this list of item controls.");
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[2].extension).toEqual([displayItemControlExtensions.unit]);

      await page.locator(unspecifiedBtn).click();
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[2].extension).toBeUndefined();

      await PWUtils.clickTreeNode(page, 'Lower-bound display item control');
      await PWUtils.expectDataTypeValue(page, /display/);
      await expect(page.locator(lowerRadio)).toBeChecked();
      await expect(page.locator(lowerBtn).locator('sup')).toContainText('(1)');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[3].extension).toEqual([displayItemControlExtensions.lower]);

      await page.locator(unspecifiedBtn).click();
      await expect(page.locator(lowerRadio)).not.toBeChecked();
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[3].extension).toBeUndefined();

      await PWUtils.clickTreeNode(page, 'Upper-bound display item control');
      await PWUtils.expectDataTypeValue(page, /display/);
      await expect(page.locator(upperRadio)).toBeChecked();
      await expect(page.locator(upperBtn).locator('sup')).toContainText('(1)');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[4].extension).toEqual([displayItemControlExtensions.upper]);

      await page.locator(unspecifiedBtn).click();
      await expect(page.locator(upperRadio)).not.toBeChecked();
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[4].extension).toBeUndefined();

      await PWUtils.clickTreeNode(page, 'Fly-over display item control');
      await PWUtils.expectDataTypeValue(page, /display/);
      await expect(page.locator(flyoverRadio)).toBeChecked();
      await expect(page.locator(flyoverBtn).locator('sup')).toContainText('(1)');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[5].extension).toEqual([displayItemControlExtensions.flyover]);

      await page.locator(unspecifiedBtn).click();
      await expect(page.locator(flyoverRadio)).not.toBeChecked();
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[5].extension).toBeUndefined();

      await PWUtils.clickTreeNode(page, 'Legal-button display item control');
      await PWUtils.expectDataTypeValue(page, /display/);
      await expect(page.locator(legalRadio)).toBeChecked();
      await expect(page.locator(legalBtn).locator('sup')).toContainText('(1)');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[6].extension).toEqual([displayItemControlExtensions.legal]);

      await page.locator(unspecifiedBtn).click();
      await expect(page.locator(legalRadio)).not.toBeChecked();
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[6].extension).toBeUndefined();
    });
  });

  test.describe('Question item control', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      mainPO = new MainPO(page);
      await mainPO.loadILPage();
    });

    test('should display Question item-control extension', async ({ page }) => {
      await PWUtils.uploadFile(page, 'question-item-control-sample.json', true);
      const titleField = await page.locator('lfb-form-fields').getByLabel('Title', { exact: true });
      await expect(titleField).toHaveValue('Question item control sample form');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');

      await PWUtils.expectDataTypeValue(page, /string/);

      await PWUtils.clickMenuBarButton(page, 'Preview');

      const items = page.locator('lhc-item');

      const firstItem = items.nth(0);
      await expect(firstItem.locator('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question'))
        .toHaveText('Autocomplete question item control displays as drop-down');
      await expect(firstItem.locator('.lhc-de-input-unit lhc-item-choice-autocomplete lhc-autocomplete > div > input.ac_multiple.ansList'))
        .toBeVisible();

      const secondItem = items.nth(1);
      await expect(secondItem.locator('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question'))
        .toHaveText('Autocomplete question item control displays as autocomplete search');
      await expect(secondItem.locator('.lhc-de-input-unit lhc-item-choice-autocomplete lhc-autocomplete input.search_field'))
        .toBeVisible();

      const thirdItem = items.nth(2);
      await expect(thirdItem.locator('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question'))
        .toHaveText('Drop down question item control');
      await expect(thirdItem.locator('.lhc-de-input-unit lhc-item-choice-autocomplete lhc-autocomplete > div > input.ac_multiple.ansList'))
        .toBeVisible();

      const fourthItem = items.nth(3);
      await expect(fourthItem.locator('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question'))
        .toHaveText('Check-box question item control displays as checkbox');
      await expect(fourthItem.locator('lhc-item-choice-check-box input[type="checkbox"]'))
        .toHaveCount(4);

      const fifthItem = items.nth(4);
      await expect(fifthItem.locator('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question'))
        .toHaveText('Radio button question item control');
      await expect(fifthItem.locator('lhc-item-choice-radio-button input[type="radio"]'))
        .toHaveCount(4);

      const sixthItem = items.nth(5);
      await expect(sixthItem.locator('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question'))
        .toHaveText('Slider question item control - not yet supported by LHC-Forms preview');
      await expect(sixthItem.locator('.lhc-de-input-unit input[type="text"]'))
        .toBeVisible();

      const seventhItem = items.nth(6);
      await expect(seventhItem.locator('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question'))
        .toHaveText('Spinner question item control - not yet supported by LHC-Forms preview');
      await expect(seventhItem.locator('.lhc-de-input-unit input[type="text"]'))
        .toBeVisible();

      const eighthItem = items.nth(7);
      await expect(eighthItem.locator('lhc-item-question > div > lhc-item-question-text > div > span > label > span.question'))
        .toHaveText('Text Box question item control - not yet supported by LHC-Forms preview');
      await expect(eighthItem.locator('.lhc-de-input-unit input[type="text"]'))
        .toBeVisible();
    });

    test('should display different question item controls based on data types', async ({ page }) => {
      await PWUtils.checkQuestionItemControlUI(page, 'boolean', null, null, null, null);

      await PWUtils.checkQuestionItemControlUI(
        page,
        'decimal',
        ['Slider (1)', 'Spinner (1)', 'Unspecified'],
        null,
        null,
        null
      );

      await PWUtils.checkQuestionItemControlUI(
        page,
        'integer',
        ['Slider (1)', 'Spinner (1)', 'Unspecified'],
        ['Drop down', 'Radio Button', 'Unspecified'],
        ['Drop down', 'Check-box', 'Unspecified'],
        null
      );

      await PWUtils.checkQuestionItemControlUI(
        page,
        'date',
        ['Spinner (1)', 'Unspecified'],
        ['Drop down', 'Radio Button', 'Unspecified'],
        ['Drop down', 'Check-box', 'Unspecified'],
        null
      );

      await PWUtils.checkQuestionItemControlUI(
        page,
        'dateTime',
        ['Spinner (1)', 'Unspecified'],
        null,
        null,
        null
      );

      await PWUtils.checkQuestionItemControlUI(
        page,
        'time',
        ['Spinner (1)', 'Unspecified'],
        ['Drop down', 'Radio Button', 'Unspecified'],
        ['Drop down', 'Check-box', 'Unspecified'],
        null
      );

      await PWUtils.checkQuestionItemControlUI(
        page,
        'string',
        ['Text Box (1)', 'Unspecified'],
        ['Drop down', 'Radio Button', 'Unspecified'],
        ['Drop down', 'Check-box', 'Unspecified'],
        null
      );

      await PWUtils.checkQuestionItemControlUI(
        page,
        'text',
        ['Text Box (1)', 'Unspecified'],
        ['Drop down', 'Radio Button', 'Unspecified'],
        ['Drop down', 'Check-box', 'Unspecified'],
        null
      );

      await PWUtils.checkQuestionItemControlUI(page, 'url', null, null, null, null);

      await PWUtils.checkQuestionItemControlUI(
        page,
        'coding',
        null,
        ['Drop down', 'Radio Button', 'Unspecified'],
        ['Drop down', 'Check-box', 'Unspecified'],
        ['Auto-complete', 'Drop down', 'Check-box', 'Unspecified']
      );

      await PWUtils.checkQuestionItemControlUI(page, 'quantity', null, null, null, null);
    });
  });
});