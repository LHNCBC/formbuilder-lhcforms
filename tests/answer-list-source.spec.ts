import { test, expect, Page } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

const snomedEclText = '< 429019009 |Finding related to biological sex|';
const snomedEclTextDiseaseDisorder = '< 64572001 |Disease (disorder)|';
const snomedEclEncodedTextDiseaseDisorder =
  'http://snomed.info/sct/900000000000207008/version/20231001?fhir_vs=ecl/%3C+64572001+%7CDisease+%28disorder%29%7C';

const getFormTitleField = (page: Page) => PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
const getItemTypeField = (page: Page) => PWUtils.getItemTypeField(page);
const getItemTextField = (page: Page) => PWUtils.getItemTextField(page);

const getTypeInitialValueValueMethodClick = async (page: Page) =>
  page.locator('div').filter({ hasText: 'Value method' }).first()
    .locator('[for^="__\\$valueMethod_type-initial"]').click();

const getPickInitialValueValueMethodClick = async (page: Page) =>
  page.locator('div').filter({ hasText: 'Value method' }).first()
    .locator('[for^="__\\$valueMethod_pick-initial"]').click();

const getComputeInitialValueValueMethodClick = async (page: Page) =>
  page.locator('div').filter({ hasText: 'Value method' }).first()
    .locator('[for^="__\\$valueMethod_compute-initial"]').click();

const toggleTreeNodeExpansion = async (page: Page, nodeText: string) => {
  await PWUtils.clickAndToggleTreeNode(page, nodeText);
  await PWUtils.getTreeNode(page, nodeText);
};

const getTerminologyServerInput = (page: Page) => page.locator('[id="__$terminologyServer"]');

const checkReferencedOptionDialog = async (page: Page, expectedText: string, buttonName: string) => {
  const dlg = page.locator('lfb-message-dlg');
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('#msgDlgTitle')).toContainText("Option referenced by other item's text and linkId.");
  const msgContent = dlg.locator('.modal-body #msgContent');
  const msgText = (await msgContent.textContent()) || '';
  expect(msgText.replace(/\s+/g, ' ').trim()).toEqual(expectedText);

  await PWUtils.clickDialogButton(page, { selector: 'lfb-message-dlg' }, buttonName);
};

const removeAndCheckReferencedOption = async (page: Page, type: string, index: number, msg: string, buttonLabel: string) => {
  const selector = `[id^="answerOption.${index}.${type}"]`;
  const row = page.locator(selector).locator('xpath=ancestor::tr[1]');
  await row.locator('td.action-column button[aria-label="Remove this row"]').click();
  await checkReferencedOptionDialog(page, msg, buttonLabel);
};

const checkAnswerOptionLinkIcon = async (page: Page, rowSelector: string, iconRows: number[] = [], tooltipText?: string) => {
  const rows = page.locator(rowSelector);
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const hasIcon = iconRows.includes(i + 1);
    const icon = row.locator('fa-icon#link');
    if (hasIcon) {
      await expect(icon).toHaveCount(1);
      const iconFirst = icon.first();
      if (tooltipText) {
        await iconFirst.hover();
        const tooltip = page
          .locator('.cdk-overlay-container')
          .locator('.mat-mdc-tooltip, .mat-tooltip')
          .filter({ hasText: tooltipText })
          .first();
        await expect(tooltip).toBeVisible();
      }
    } else {
      await expect(icon).toHaveCount(0);
    }
  }
};

const getReferencedOptionMsg = (item: string, linkId: string, action: string) =>
  `This option is referenced by another item, '${item}' (linkId: ` +
  `'${linkId}'), for conditional display. ${action} this ` +
  `option may affect that behavior.`;

const getReferencedOptionMsgMultiple = (
  refs: { enableWhenItemName: string; enableWhenItemLinkId: string }[],
  action: string
) =>
  `This option is referenced by multiple items:` +
  refs.map(ref => ` • '${ref.enableWhenItemName}' (linkId: '${ref.enableWhenItemLinkId}')`).join('') +
  `for conditional display. ${action} this option may affect their behavior.`;

const modifyReferencedData = async (
  page: Page,
  type: string,
  enableWhenNodeName: string,
  answerOptionNodeName: string,
  answerOptionSelector: string,
  referencedMsg: string,
  buttonText: string,
  editValue: string
) => {
  const enableWhenNode = await PWUtils.getTreeNode(page, enableWhenNodeName);

  await expect(enableWhenNode.locator('fa-icon#error')).toHaveCount(0);

  await PWUtils.getTreeNode(page, answerOptionNodeName);
  const input = page.locator(answerOptionSelector);
  await input.click();
  await checkReferencedOptionDialog(page, referencedMsg, buttonText);

  if (type !== 'time') {
    await input.clear();
    if (type === 'coding') {
      await input.pressSequentially(editValue);
      await input.blur();
    } else {
      await input.fill(editValue);
    }
  } else {
    await input.fill(editValue);
    await input.blur();
  }

  await expect(enableWhenNode.locator('fa-icon#error')).toBeVisible();
};

test.describe('Home page', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Item level fields', () => {
    test.beforeEach(async ({ page }) => {
      mainPO = new MainPO(page);
      await mainPO.loadILPage();
      await expect(await getItemTextField(page)).toHaveValue('Item 0', { timeout: 10000 });
      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
    });

    test('should add answer-option', async ({ page }) => {
      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

      const aOptions = [
        { system: 's1', display: 'd1', code: 'c1', score: '2.1' },
        { system: 's2', display: 'd2', code: 'c2', score: '3' }
      ];

      const addAnswerButton = page.locator('button:has-text("Add another answer")');

      await PWUtils.addCodingAnswerOptions(page, addAnswerButton, aOptions);

      await getPickInitialValueValueMethodClick(page);
      const pickAnswer = page.locator('[id^="pick-answer"]');
      await pickAnswer.click();
      await expect(page.locator('#lhc-tools-searchResults ul > li')).toHaveCount(2);
      await pickAnswer.press('ArrowDown');
      await pickAnswer.press('Enter');
      await expect(pickAnswer).toHaveValue('d1');

      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].type).toEqual('coding');
      expect(qJson.item[0].answerConstraint).toEqual('optionsOnly');
      expect(qJson.item[0].answerOption).toEqual([
        {
          initialSelected: true,
          valueCoding: { display: 'd1', code: 'c1', system: 's1' },
          extension: [{ url: 'http://hl7.org/fhir/StructureDefinition/itemWeight', valueDecimal: 2.1 }]
        },
        {
          valueCoding: { display: 'd2', code: 'c2', system: 's2' },
          extension: [{ url: 'http://hl7.org/fhir/StructureDefinition/itemWeight', valueDecimal: 3 }]
        }
      ]);

    });

    test('should add initial values', async ({ page }) => {
      await PWUtils.selectDataType(page, 'string');
      await getTypeInitialValueValueMethodClick(page);
      await page.locator('[id^="initial.0.valueString"]').pressSequentially('initial string');
      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].type).toEqual('string');
      expect(qJson.item[0].initial[0].valueString).toEqual('initial string');

      await PWUtils.selectDataType(page, 'decimal');
      await getTypeInitialValueValueMethodClick(page);
      await page.locator('[id^="initial.0.valueDecimal"]').pressSequentially('100.1');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].type).toEqual('decimal');
      expect(qJson.item[0].initial[0].valueDecimal).toEqual(100.1);

      await PWUtils.selectDataType(page, 'integer');
      await getTypeInitialValueValueMethodClick(page);
      const initialInteger = page.locator('[id^="initial.0.valueInteger"]');
      await initialInteger.pressSequentially('100');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].type).toEqual('integer');
      expect(qJson.item[0].initial[0].valueDecimal).toBeUndefined();
      expect(qJson.item[0].initial[0].valueInteger).toEqual(100);

      await initialInteger.clear();
      await initialInteger.pressSequentially('1.1');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].type).toEqual('integer');
      expect(qJson.item[0].initial[0].valueDecimal).toBeUndefined();
      expect(qJson.item[0].initial[0].valueInteger).toBeDefined();

      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await expect(page.locator('[id^="initial"]')).toHaveCount(0);
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].type).toEqual('coding');
      expect(qJson.item[0].answerConstraint).toEqual('optionsOnly');
      expect(qJson.item[0].initial).toBeUndefined();
    });

    test('should add initial values for the SNOMED answer value set option', async ({ page }) => {
      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'Yes');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'SNOMED answer value set');
      await getPickInitialValueValueMethodClick(page);

      const initialValueTable = page.locator('lfb-table').filter({ hasText: 'Initial value' }).first();
      const initialValueWarning = initialValueTable.locator('div[role="alert"] span.text-warning');
      await expect(initialValueTable).toBeVisible();
      await expect(initialValueWarning)
        .toContainText('SNOMED ECL is not set. The lookup feature will not be available. Initial values can still be manually typed in.');

      await page.locator('[id^="initial.0.valueCoding.system"]').pressSequentially('http://example.org');
      await page.locator('[id^="initial.0.valueCoding.display"]').pressSequentially('example');
      await page.locator('[id^="initial.0.valueCoding.code"]').pressSequentially('123');

      await page.locator('#answerValueSet_ecl').fill(snomedEclText);
      await page.locator('#answerValueSet_ecl').press('Enter');
      await page.locator('#answerValueSet_edition').selectOption('International Edition (900000000000207008)');
      await page.locator('#answerValueSet_version').selectOption('20231001');

      await expect(initialValueWarning).toHaveCount(0);

      await PWUtils.expandAdvancedFields(page);
      const tsUrl = getTerminologyServerInput(page);
      await tsUrl.scrollIntoViewIfNeeded();
      await expect(tsUrl).toHaveValue('https://snowstorm.ihtsdotools.org/fhir');

      await page.getByRole('button', { name: 'Add another value' }).click();

      await page.route('https://snowstorm.ihtsdotools.org/fhir/ValueSet/**', async (route) => {
        await route.fulfill({ path: 'cypress/fixtures/snomed-ecl-expression-mock.json' });
      });

      const acInput = page.locator('lfb-auto-complete[id^="initial.1.valueCoding.display"] > span > input');
      await acInput.click();
      await acInput.pressSequentially('Intersex');

      const options = page.locator('span#completionOptions > ul > li');
      await expect.poll(async () => await options.count()).toBeGreaterThan(0);
      await acInput.press('ArrowDown');
      await acInput.press('Enter');

      await PWUtils.expectValueCoding(page, 'initial', 1, 'http://snomed.info/sct', null, '32570691000036108');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].initial[0].valueCoding.display).toEqual('example');
      expect(qJson.item[0].initial[0].valueCoding.code).toEqual('123');
      expect(qJson.item[0].initial[0].valueCoding.system).toEqual('http://example.org');

      expect(qJson.item[0].initial[1].valueCoding.display).toEqual('Intersex');
      expect(qJson.item[0].initial[1].valueCoding.code).toEqual('32570691000036108');
      expect(qJson.item[0].initial[1].valueCoding.system).toEqual('http://snomed.info/sct');
    });

    test('should add initial values for the answer value set URI option', async ({ page }) => {
      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'Yes');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer value set URI');
      await getPickInitialValueValueMethodClick(page);

      const initialValueTable = page.locator('lfb-table').filter({ hasText: 'Initial value' }).first();
      const initialValueWarning = initialValueTable.locator('div[role="alert"] span.text-warning');
      await expect(initialValueTable).toBeVisible();
      await expect(initialValueWarning)
        .toContainText('The Answer value set URL is not set. The lookup feature will not be available. Initial values can still be manually typed in.');

      await page.locator('[id^="initial.0.valueCoding.system"]').pressSequentially('http://example.org');
      await page.locator('[id^="initial.0.valueCoding.display"]').pressSequentially('example');
      await page.locator('[id^="initial.0.valueCoding.code"]').pressSequentially('123');

      await page.locator('#answerValueSet_non-snomed')
        .fill('http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions');

      await expect(initialValueWarning)
        .toContainText('Preferred terminology server is not set. The lookup feature will not be available. Initial values can still be manually typed in.');

      await PWUtils.expandAdvancedFields(page);
      const tsUrl = getTerminologyServerInput(page);
      await tsUrl.scrollIntoViewIfNeeded();
      await expect(tsUrl).toHaveValue('');
      await tsUrl.fill('https://clinicaltables.nlm.nih.gov/fhir/R4');

      await expect(initialValueWarning).toHaveCount(0);

      await page.getByRole('button', { name: 'Add another value' }).click();
      const acInput = page.locator('lfb-auto-complete[id^="initial.1.valueCoding.display"] > span > input');
      await acInput.click();
      await acInput.pressSequentially('pain');

      const options = page.locator('span#completionOptions > ul > li');
      await expect.poll(async () => await options.count()).toBeGreaterThan(0);
      await acInput.press('ArrowDown');
      await acInput.press('Enter');

      await PWUtils.expectValueCoding(page, 'initial', 1, 'http://clinicaltables.nlm.nih.gov/fhir/CodeSystem/conditions', null, '2315');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].initial[0].valueCoding.display).toEqual('example');
      expect(qJson.item[0].initial[0].valueCoding.code).toEqual('123');
      expect(qJson.item[0].initial[0].valueCoding.system).toEqual('http://example.org');

      expect(qJson.item[0].initial[1].valueCoding.display).toEqual('Back pain');
      expect(qJson.item[0].initial[1].valueCoding.code).toEqual('2315');
      expect(qJson.item[0].initial[1].valueCoding.system)
        .toEqual('http://clinicaltables.nlm.nih.gov/fhir/CodeSystem/conditions');
    });

    test('should import item with answer option', async ({ page }) => {
      const sampleFile = 'answer-option-sample-2.json';
      const fixtureJson = await PWUtils.readJSONFile(sampleFile);
      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('Answer options form');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');

      await expect(page.locator('.spinner-border')).not.toBeVisible();

      const firstOption = page.locator('lfb-answer-option table > tbody > tr:nth-of-type(1)');
      const secondOption = page.locator('lfb-answer-option table > tbody > tr:nth-of-type(2)');

      await expect(firstOption.locator('td:nth-child(1) input')).toHaveValue('s');
      await expect(firstOption.locator('td:nth-child(2) input')).toHaveValue('d1');
      await expect(firstOption.locator('td:nth-child(3) input')).toHaveValue('a');
      await expect(firstOption.locator('td:nth-child(4) input')).toHaveValue('1');

      await expect(secondOption.locator('td:nth-child(1) input')).toHaveValue('s');
      await expect(secondOption.locator('td:nth-child(2) input')).toHaveValue('d2');
      await expect(secondOption.locator('td:nth-child(3) input')).toHaveValue('b');
      const secondScore = secondOption.locator('td:nth-child(4) input');
      await expect(secondScore).toHaveValue('2');

      await getPickInitialValueValueMethodClick(page);
      const pickAnswer = page.locator('[id^="pick-answer_"]');
      await expect(pickAnswer).toHaveValue('d2');

      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].answerOption).toEqual(fixtureJson.item[0].answerOption);

      await secondScore.clear();
      await secondScore.pressSequentially('22');
      await secondScore.press('Enter');

      await page.locator('lfb-answer-option table+button').click();
      const thirdOption = page.locator('lfb-answer-option table > tbody > tr:nth-of-type(3)');
      await expect(thirdOption).toBeVisible();
      await thirdOption.locator('td:nth-child(1) input').pressSequentially('s');
      await thirdOption.locator('td:nth-child(2) input').pressSequentially('d3');
      await thirdOption.locator('td:nth-child(3) input').pressSequentially('c');
      await thirdOption.locator('td:nth-child(4) input').pressSequentially('33');

      await pickAnswer.click();
      await expect(page.locator('#lhc-tools-searchResults ul > li')).toHaveCount(3);
      await pickAnswer.clear();
      await pickAnswer.pressSequentially('d3');
      await pickAnswer.press('Enter');

      const SCORE_URI = 'http://hl7.org/fhir/StructureDefinition/itemWeight';
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].answerOption).toEqual([
        {
          valueCoding: { system: 's', display: 'd1', code: 'a' },
          extension: [{ url: SCORE_URI, valueDecimal: 1 }]
        },
        {
          valueCoding: { system: 's', display: 'd2', code: 'b' },
          extension: [{ url: SCORE_URI, valueDecimal: 22 }]
        },
        {
          valueCoding: { system: 's', display: 'd3', code: 'c' },
          extension: [{ url: SCORE_URI, valueDecimal: 33 }],
          initialSelected: true
        }
      ]);
    });

    test('should fix a bug in messing up default selections when switched to another node', async ({ page }) => {
      const sampleFile = 'answer-option-sample-2.json';
      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('Answer options form');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await getPickInitialValueValueMethodClick(page);
      const pickAnswer1 = page.locator('[id^="pick-answer_"]');
      await expect(pickAnswer1).toHaveValue('d2');

      await PWUtils.clickTreeNode(page, 'Item 2 with answer option', false);
      await getPickInitialValueValueMethodClick(page);
      const pickAnswer2 = page.locator('[id^="pick-answer_"]');
      await expect(pickAnswer2).toHaveValue('');

      const pickAnswer2Id = await pickAnswer2.getAttribute('id');
      await PWUtils.selectAutocompleteOption(
        page,
        `#${pickAnswer2Id}`,
        true,
        'invalidCode',
        0,
        ['ArrowDown', 'Enter'],
        null
      );

      await PWUtils.selectAutocompleteOption(
        page,
        `#${pickAnswer2Id}`,
        true,
        'd11',
        1,
        ['ArrowDown', 'Enter'],
        'd11'
      );

      await PWUtils.clickTreeNode(page, 'Item with answer option', false);
      await getPickInitialValueValueMethodClick(page);
      await expect(page.locator('[id^="pick-answer_"]')).toHaveValue('d2');

      await PWUtils.clickTreeNode(page, 'Item 2 with answer option', false);
      await getPickInitialValueValueMethodClick(page);
      await expect(page.locator('[id^="pick-answer_"]')).toHaveValue('d11');
    });

    test('should clear all default selections', async ({ page }) => {
      const repeatsLabel = 'Allow repeating question?';
      const sampleFile = 'answer-option-sample-2.json';
      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('Answer options form');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await PWUtils.clickTreeNode(page, 'Item 2 with answer option', false);
      await getPickInitialValueValueMethodClick(page);
      await expect(page.locator('lfb-answer-option table > tbody > tr')).toHaveCount(3);

      const pickAnswer2 = page.locator('#pick-answer_2');

      await PWUtils.selectAutocompleteOption(
        page,
        '#pick-answer_2',
        false,
        null,
        3,
        ['ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter'],
        'd31'
      );

      await PWUtils.selectAutocompleteOption(
        page,
        '#pick-answer_2',
        true,
        null,
        3,
        ['Enter'],
        ''
      );

      await expect(page.locator('#lhc-tools-searchResults ul > li')).toHaveCount(3);

      await PWUtils.clickRadioButton(page, repeatsLabel, 'Yes');
      await PWUtils.expectRadioChecked(page, repeatsLabel, 'Yes');
      await expect(page.locator('#lhc-tools-searchResults ul > li')).toHaveCount(3);

      await PWUtils.selectAutocompleteOptions(
        page,
        '#pick-answer_2',
        true,
        null,
        3,
        ['ArrowDown', 'ArrowDown', 'Enter'],
        ['×d21']
      );
      await PWUtils.selectAutocompleteOptions(
        page,
        '#pick-answer_2',
        true,
        null,
        2,
        ['ArrowDown', 'ArrowDown', 'Enter'],
        ['×d21', '×d31']
      );

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[1].answerOption).toEqual([
        {
          extension: [{ url: 'http://hl7.org/fhir/StructureDefinition/itemWeight', valueDecimal: 10 }],
          valueCoding: { system: 's1', code: 'a1', display: 'd11' }
        },
        {
          extension: [{ url: 'http://hl7.org/fhir/StructureDefinition/itemWeight', valueDecimal: 20 }],
          valueCoding: { system: 's1', code: 'b1', display: 'd21' },
          initialSelected: true
        },
        {
          extension: [{ url: 'http://hl7.org/fhir/StructureDefinition/itemWeight', valueDecimal: 30 }],
          valueCoding: { system: 's1', code: 'c1', display: 'd31' },
          initialSelected: true
        }
      ]);
    });

    test('should display the answerOptions lookup', async ({ page }) => {
      const sampleFile = 'answer-option-lookup-sample.json';
      const fixtureJson = await PWUtils.readJSONFile(sampleFile);
      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('Answer options lookup form');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('answer option lookup');

      await PWUtils.expectDataTypeValue(page, /coding/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');

      const firstOption = page.locator('lfb-answer-option table > tbody > tr:nth-of-type(1)');
      const secondOption = page.locator('lfb-answer-option table > tbody > tr:nth-of-type(2)');
      const thirdOption = page.locator('lfb-answer-option table > tbody > tr:nth-of-type(3)');

      await expect(firstOption.locator('td:nth-child(1) input')).toHaveValue('http://snomed.info/sct');
      await expect(firstOption.locator('td:nth-child(2) input')).toHaveValue('Heart beat');
      await expect(firstOption.locator('td:nth-child(3) input')).toHaveValue('248646004');

      await expect(secondOption.locator('td:nth-child(1) input')).toHaveValue('http://loinc.org');
      await expect(secondOption.locator('td:nth-child(2) input')).toHaveValue('Newborn hearing screening panel');
      await expect(secondOption.locator('td:nth-child(3) input')).toHaveValue('54111-0');

      await expect(thirdOption.locator('td:nth-child(1) input')).toHaveValue('http://example.com');
      await expect(thirdOption.locator('td:nth-child(2) input')).toHaveValue('visceral fat');
      await expect(thirdOption.locator('td:nth-child(3) input')).toHaveValue('vf');

      const valueMethod = page.locator('div').filter({ hasText: 'Value method' }).first();
      const pickInitialRadio = valueMethod.locator('[id^="__\\$valueMethod_pick-initial"]');
      await expect(pickInitialRadio).toBeChecked();

      const pickAnswer = page.locator('[id^="pick-answer_"]');
      await expect(pickAnswer).toHaveValue('Newborn hearing screening panel');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].answerOption).toEqual(fixtureJson.item[0].answerOption);
    });

    test('should create answerOptions lookup', async ({ page }) => {
      await MainPO.mockAnswerOptionLookup(page);

      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

      await page.locator('[id^="answerOption.0.valueCoding.system"]').click();
      await page.locator('[id^="answerOption.0.valueCoding.system"]').press('ArrowDown');
      await page.locator('[id^="answerOption.0.valueCoding.system"]').press('ArrowDown');
      await page.locator('[id^="answerOption.0.valueCoding.system"]').press('Enter');
      await expect(page.locator('[id^="answerOption.0.valueCoding.system"]')).toHaveValue('http://loinc.org');

      await page.locator('[id^="answerOption.0.valueCoding.display"]').pressSequentially('heart');
      const options = page.locator('span#completionOptions > ul > li');
      await expect.poll(async () => await options.count()).toBeGreaterThan(0);
      const displayInput = page.locator('[id^="answerOption.0.valueCoding.display"]');
      await displayInput.press('ArrowDown');
      await displayInput.press('ArrowDown');
      await displayInput.press('ArrowDown');
      await displayInput.press('Enter');

      await PWUtils.expectValueCoding(page, 'answerOption', 0, 'http://loinc.org', 'Heart rate', '18708-8');

      await page.getByRole('button', { name: 'Add another answer' }).click();

      await page.locator('[id^="answerOption.1.valueCoding.system"]').click();
      await page.locator('[id^="answerOption.1.valueCoding.system"]').press('ArrowDown');
      await page.locator('[id^="answerOption.1.valueCoding.system"]').press('ArrowDown');
      await page.locator('[id^="answerOption.1.valueCoding.system"]').press('ArrowDown');
      await page.locator('[id^="answerOption.1.valueCoding.system"]').press('Enter');
      await expect(page.locator('[id^="answerOption.1.valueCoding.system"]')).toHaveValue('http://unitsofmeasure.org');

      await page.locator('[id^="answerOption.1.valueCoding.display"]').pressSequentially('kat');
      await expect.poll(async () => await options.count()).toBeGreaterThan(0);
      const displayInput2 = page.locator('[id^="answerOption.1.valueCoding.display"]');
      await displayInput2.press('ArrowDown');
      await displayInput2.press('Enter');

      await PWUtils.expectValueCoding(page, 'answerOption', 1, 'http://unitsofmeasure.org', 'kat - katal', 'kat');

      await page.getByRole('button', { name: 'Add another answer' }).click();
      await page.locator('[id^="answerOption.2.valueCoding.system"]').pressSequentially('http://example.org');
      await page.locator('[id^="answerOption.2.valueCoding.system"]').press('Enter');
      await page.locator('[id^="answerOption.2.valueCoding.display"]').pressSequentially('abcd123');
      await page.locator('[id^="answerOption.2.valueCoding.code"]').pressSequentially('123');

      await page.getByRole('button', { name: 'Add another answer' }).click();
      await page.locator('[id^="answerOption.3.valueCoding.system"]').click();
      await page.locator('[id^="answerOption.3.valueCoding.system"]').press('ArrowDown');
      await page.locator('[id^="answerOption.3.valueCoding.system"]').press('Enter');
      await expect(page.locator('[id^="answerOption.3.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');

      await page.locator('[id^="answerOption.3.valueCoding.display"]').click();
      await page.locator('[id^="answerOption.3.valueCoding.display"]').pressSequentially('intersex');
      await expect.poll(async () => await options.count()).toBeGreaterThan(0);
      await page.locator('[id^="answerOption.3.valueCoding.display"]').press('ArrowDown');
      await page.locator('[id^="answerOption.3.valueCoding.display"]').press('Enter');

      await PWUtils.expectValueCoding(page, 'answerOption', 3, 'http://snomed.info/sct', 'Intersex', '32570691000036108');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].answerOption[0].valueCoding.system).toEqual('http://loinc.org');
      expect(qJson.item[0].answerOption[0].valueCoding.display).toEqual('Heart rate');
      expect(qJson.item[0].answerOption[0].valueCoding.code).toEqual('18708-8');

      expect(qJson.item[0].answerOption[1].valueCoding.system).toEqual('http://unitsofmeasure.org');
      expect(qJson.item[0].answerOption[1].valueCoding.display).toEqual('kat - katal');
      expect(qJson.item[0].answerOption[1].valueCoding.code).toEqual('kat');

      expect(qJson.item[0].answerOption[2].valueCoding.system).toEqual('http://example.org');
      expect(qJson.item[0].answerOption[2].valueCoding.display).toEqual('abcd123');
      expect(qJson.item[0].answerOption[2].valueCoding.code).toEqual('123');

      expect(qJson.item[0].answerOption[3].valueCoding.system).toEqual('http://snomed.info/sct');
      expect(qJson.item[0].answerOption[3].valueCoding.display).toEqual('Intersex');
      expect(qJson.item[0].answerOption[3].valueCoding.code).toEqual('32570691000036108');
    });

    test('should fix initial input box when switched data type from coding to decimal', async ({ page }) => {
      const sampleFile = 'initial-component-bugfix.json';
      const fixtureJson = await PWUtils.readJSONFile(sampleFile);
      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('Sample to test initial component error');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].item[0].answerOption).toEqual(fixtureJson.item[0].item[0].answerOption);

      await toggleTreeNodeExpansion(page, 'Group item 1');
      await PWUtils.clickTreeNode(page, 'Coding item 1.1');
      await PWUtils.expectDataTypeValue(page, /coding/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      await expect(page.locator('lfb-answer-option')).toBeVisible();
      await expect(page.locator('[id^="initial"]')).toHaveCount(0);
      await expect(page.locator('[id^="pick-answer_"]')).toHaveValue('Answer 2');

      await PWUtils.selectDataType(page, 'decimal');
      await getTypeInitialValueValueMethodClick(page);
      await expect(page.locator('[id^="answerOption."]')).toHaveCount(0);
      await page.locator('[id^="initial.0.valueDecimal"]').pressSequentially('1.2');

      const updatedJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(updatedJson.item[0].item[0].initial[0].valueDecimal).toEqual(1.2);
    });

    test('should show link icon, warnng on modify and delete for referenced answerOptions', async ({ page }) => {
      test.setTimeout(60000);

      const sampleFile = 'enable-when-answer-options-R5-sample.json';
      const OK = 'Ok';
      const CANCEL = 'Cancel';

      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('R5 enableWhen AnswerOptions optionsOnly');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      const answerOptionTests = [
        {
          nodeName: 'integer answerOptions',
          type: 'integer',
          valueField: 'valueInteger',
          expectedValues: [1, 2, 3],
          referencingItem: 'enableWhen integer on-list',
          referencingLinkId: '600338559566',
          modifyValue: '100\n'
        },
        {
          nodeName: 'date answerOptions',
          type: 'date',
          valueField: 'valueDate',
          expectedValues: ['2025-11-03', '2025-11-04', '2025-11-05'],
          referencingItem: 'enableWhen date on-list',
          referencingLinkId: '360117504487',
          modifyValue: '2025-01-01\n'
        },
        {
          nodeName: 'time answerOptions',
          type: 'time',
          valueField: 'valueTime',
          expectedValues: ['16:00:00', '17:00:00', '18:00:00'],
          referencingItem: 'enableWhen time on-list',
          referencingLinkId: '877781889993',
          modifyValue: '09:00:00\n'
        },
        {
          nodeName: 'string answerOptions',
          type: 'string',
          valueField: 'valueString',
          expectedValues: ['A', 'B', 'C'],
          referencingItem: 'enableWhen string on-list',
          referencingLinkId: '242477867005',
          modifyValue: 'N\n'
        },
        {
          nodeName: 'text answerOptions',
          type: 'text',
          valueField: 'valueString',
          expectedValues: ['AAAAAAAA', 'BBBBBBBBB', 'CCCCCCCCC'],
          referencingItem: 'enableWhen text on-list',
          referencingLinkId: '800004427766',
          modifyValue: 'NNNNNNN\n'
        },
        {
          nodeName: 'coding answerOptions',
          type: 'coding',
          valueField: 'valueCoding',
          expectedValues: [
            { system: 'a', display: 'a1', code: 'a1' },
            { system: 'b', display: 'b1', code: 'b1' },
            { system: 'c', display: 'c1', code: 'c1' }
          ],
          referencingItem: 'enableWhen coding on-list',
          referencingLinkId: '171991128943',
          modifyValue: 'HHH\n',
          subFields: ['code']
        }
      ];

      for (let idx = 0; idx < answerOptionTests.length; idx++) {
        const testCfg = answerOptionTests[idx];
        if (idx > 0) {
          await PWUtils.clickTreeNode(page, testCfg.nodeName);
        }

        await PWUtils.expectDataTypeValue(page, new RegExp(testCfg.type));
        await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');

        const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
        if (testCfg.type === 'coding') {
          testCfg.expectedValues.forEach((val: any, i: number) => {
            expect(q.item[15].answerOption[i].valueCoding.system).toEqual(val.system);
            expect(q.item[15].answerOption[i].valueCoding.display).toEqual(val.display);
            expect(q.item[15].answerOption[i].valueCoding.code).toEqual(val.code);
          });
        } else {
          testCfg.expectedValues.forEach((val: any, i: number) => {
            expect(q.item[idx * 3].answerOption[i][testCfg.valueField]).toEqual(val);
          });
        }

        await checkAnswerOptionLinkIcon(
          page,
          'lfb-answer-option table > tbody > tr',
          [2],
          "Option referenced by other item's text and linkId."
        );

        const deleteMsg = getReferencedOptionMsg(testCfg.referencingItem, testCfg.referencingLinkId, 'Deleting');
        await removeAndCheckReferencedOption(page, testCfg.valueField, 1, deleteMsg, CANCEL);

        if (testCfg.type === 'coding') {
          const modifyMsg = getReferencedOptionMsg(testCfg.referencingItem, testCfg.referencingLinkId, 'Modifying');
          await page.locator(`[id^="answerOption.1.${testCfg.valueField}.system"]`).click();
          await checkReferencedOptionDialog(page, modifyMsg, OK);

          await page.locator('body').click({ position: { x: 0, y: 0 } });

          await page.locator(`[id^="answerOption.2.${testCfg.valueField}.system"]`).click();
          await expect(page.locator('lfb-message-dlg')).toHaveCount(0);

          await modifyReferencedData(
            page,
            testCfg.type,
            testCfg.referencingItem,
            testCfg.nodeName,
            `[id^="answerOption.1.${testCfg.valueField}.system"]`,
            modifyMsg,
            OK,
            testCfg.modifyValue
          );
        } else {
          await page.locator(`[id^="answerOption.0.${testCfg.valueField}"]`).click();
          await expect(page.locator('lfb-message-dlg')).toHaveCount(0);
          await page.locator(`[id^="answerOption.1.${testCfg.valueField}"]`).click();
          const modifyMsg = getReferencedOptionMsg(testCfg.referencingItem, testCfg.referencingLinkId, 'Modifying');
          await checkReferencedOptionDialog(page, modifyMsg, OK);
          await page.locator(`[id^="answerOption.2.${testCfg.valueField}"]`).click();
          await expect(page.locator('lfb-message-dlg')).toHaveCount(0);

          await modifyReferencedData(
            page,
            testCfg.type,
            testCfg.referencingItem,
            testCfg.nodeName,
            `[id^="answerOption.1.${testCfg.valueField}"]`,
            modifyMsg,
            OK,
            testCfg.modifyValue
          );
        }
      }
    });

    test('should display a warning that includes all items referencing the selected answerOption', async ({ page }) => {
      const sampleFile = 'answer-option-validation-sample.json';
      const OK = 'Ok';

      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('Answer options validation');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await PWUtils.expectDataTypeValue(page, /string/);
      await page.locator('[id^="answerOption.1.valueString"]').click();

      let enableWhenItems = [
        { enableWhenItemName: 'Reference string option value b', enableWhenItemLinkId: '816000609340' },
        { enableWhenItemName: 'Reference string option value b as well', enableWhenItemLinkId: '267515907402' }
      ];

      let msg = getReferencedOptionMsgMultiple(enableWhenItems, 'Modifying');
      await checkReferencedOptionDialog(page, msg, OK);

      await checkAnswerOptionLinkIcon(
        page,
        'lfb-answer-option table > tbody > tr',
        [2, 3],
        "Option referenced by other item's text and linkId."
      );

      await page.locator('[id^="answerOption.2.valueString"]').click();
      msg = getReferencedOptionMsg('Reference string option value c', '516220192689', 'Modifying');
      await checkReferencedOptionDialog(page, msg, OK);

      await PWUtils.clickTreeNode(page, 'coding answerOptions');
      await PWUtils.expectDataTypeValue(page, /coding/);
      await page.locator('[id^="answerOption.1.valueCoding.system"]').click();

      enableWhenItems = [
        { enableWhenItemName: 'Reference coding option value d2 (c2)', enableWhenItemLinkId: '321543291333' },
        { enableWhenItemName: 'Reference coding option value d2 (c2) as well', enableWhenItemLinkId: '296534877584' }
      ];
      msg = getReferencedOptionMsgMultiple(enableWhenItems, 'Modifying');
      await checkReferencedOptionDialog(page, msg, OK);
      await checkAnswerOptionLinkIcon(
        page,
        'lfb-answer-option table > tbody > tr',
        [2, 3],
        "Option referenced by other item's text and linkId."
      );

      await page.locator('body').click({ position: { x: 0, y: 0 } });
      await page.locator('[id^="answerOption.2.valueCoding.system"]').click();
      msg = getReferencedOptionMsg('Reference coding option value d3 (c3)', '367425898269', 'Modifying');
      await checkReferencedOptionDialog(page, msg, OK);
    });

    test('should create answerValueSet', async ({ page }) => {
      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
      await PWUtils.expectRadioNotChecked(page, 'Answer list source', 'Answer options');
      await PWUtils.expectRadioNotChecked(page, 'Answer list source', 'Answer value set URI');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');

      await expect(page.locator('#answerValueSet_non-snomed')).toHaveCount(0);

      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');
      await expect(page.locator('lfb-answer-option')).toBeVisible();

      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer value set URI');
      await expect(page.locator('#answerValueSet_non-snomed')).toBeVisible();
      await expect(page.locator('lfb-answer-option')).toHaveCount(0);
      await page.locator('#answerValueSet_non-snomed').fill('http://example.org');

      let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[0].answerValueSet).toEqual('http://example.org');
      expect(q.item[0].answerOption).toBeUndefined();

      await PWUtils.clickRadioButton(page, 'Answer list source', 'None');
      await expect(page.locator('#answerValueSet_non-snomed')).toHaveCount(0);

      // Switch back to 'Answer options'
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');
      const aOptions = [
        { system: 's1', display: 'display 1', code: 'c1' },
        { system: 's2', display: 'display 2', code: 'c2' }
      ];

      const addAnswerButton = page.locator('button:has-text("Add another answer")');

      await PWUtils.addCodingAnswerOptions(page, addAnswerButton, aOptions);

      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[0].answerValueSet).toBeUndefined();
      expect(q.item[0].answerOption[0].valueCoding).toEqual(aOptions[0]);
      expect(q.item[0].answerOption[1].valueCoding).toEqual(aOptions[1]);
    });

    test('should import a form with an item having answerValueSet', async ({ page }) => {
      await PWUtils.uploadFile(page, 'answer-value-set-sample.json', true);
      await expect(await getFormTitleField(page)).toHaveValue('Answer value set form');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await expect(page.locator('.spinner-border')).not.toBeVisible();
      await expect(page.getByLabel('Question text', {exact: true})).toHaveValue('Item with answer value set');

      await PWUtils.expectDataTypeValue(page, /coding/);

      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
      await PWUtils.expectRadioNotChecked(page, 'Answer list source', 'Answer options');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer value set URI');

      await expect(page.locator('lfb-answer-option')).toHaveCount(0);
      await expect(page.locator('#answerValueSet_non-snomed')).toHaveValue('http://example.org');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].answerValueSet).toEqual('http://example.org');
    });

    test('should create SNOMED CT answerValueSet', async ({ page }) => {
      const eclSel = '#answerValueSet_ecl';
      await PWUtils.selectDataType(page, 'coding');
      await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
      await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');

      const nonSnomedMethod = page.locator('[for^="__\\$answerOptionMethods_value-set"]');
      const answerOptionMethod = page.locator('[for^="__\\$answerOptionMethods_answer-option"]');
      const snomedMethod = page.locator('[for^="__\\$answerOptionMethods_snomed-value-set"]');
      await snomedMethod.click();

      await expect(page.locator(eclSel)).toBeVisible();
      const answerValueSet = page.locator(eclSel).locator('xpath=ancestor::lfb-answer-value-set');
      const formattedUri = answerValueSet.locator('span.text-break');

      await PWUtils.expandAdvancedFields(page);
      const tsUrl = getTerminologyServerInput(page);
      await expect(tsUrl).toBeVisible();
      await expect(tsUrl).toHaveValue('');

      await expect(page.locator('lfb-answer-option')).not.toBeVisible(); //.toHaveCount(0);
      await expect(formattedUri).toHaveCount(0);
      await page.locator(eclSel).fill('123 456');
      await page.locator(eclSel).blur();
      await expect(formattedUri).toContainText('fhir_vs=ecl/123%20456');

      await expect(tsUrl).toHaveValue('https://snowstorm.ihtsdotools.org/fhir');

      await nonSnomedMethod.click();
      await expect(page.locator('#answerValueSet_ecl')).not.toBeVisible(); //.toHaveCount(0);
      const asInput = page.locator('#answerValueSet_non-snomed');
      await expect(asInput).toBeVisible();
      await expect(asInput).toHaveValue(/fhir_vs=ecl\/123%20456/);

      // append '_extra_chars' to the end of the existing value
      const asValue = await asInput.inputValue();
      await asInput.fill(`${asValue}_extra_chars`);
      await asInput.blur();

      await snomedMethod.click();
      await expect(page.locator(eclSel)).toHaveValue('123 456_extra_chars');

      await answerOptionMethod.click();
      await expect(page.locator(eclSel)).toHaveCount(0);
      await snomedMethod.click();
      await expect(page.locator(eclSel)).toHaveValue('123 456_extra_chars');

      let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[0].answerValueSet).toContain('fhir_vs=ecl/123%20456_extra_chars');
      expect(q.item[0].answerOption).toBeUndefined();
      const preferredTsUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-preferredTerminologyServer';
      const preferredTsExt = (q.item[0].extension || []).filter((ext: { url: string }) => ext.url === preferredTsUrl);
      expect(preferredTsExt).toEqual([
        {
          url: preferredTsUrl,
          valueUrl: 'https://snowstorm.ihtsdotools.org/fhir'
        }
      ]);

      await tsUrl.fill('https://clinicaltables.nlm.nih.gov/fhir/R4');
      await page.locator(eclSel).clear();
      await page.locator(eclSel).blur();
      await expect(tsUrl).toHaveValue('https://clinicaltables.nlm.nih.gov/fhir/R4');

      await tsUrl.clear();
      await tsUrl.fill('https://snowstorm.ihtsdotools.org/fhir');

      await page.locator(eclSel).fill('123');
      await page.locator(eclSel).blur();
      await page.locator(eclSel).clear();
      await page.locator(eclSel).blur();

      await expect(tsUrl).toHaveValue('');
      await expect(formattedUri).toHaveCount(0);

      q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(q.item[0].answerValueSet).toBeUndefined();
      expect(q.item[0].answerOption).toBeUndefined();

    });

    test('should import a form with an item having SNOMED CT answerValueSet', async ({ page }) => {
      const encodedUriPart = 'fhir_vs=ecl/' + encodeURIComponent(snomedEclText);

      await PWUtils.uploadFile(page, 'snomed-answer-value-set-sample.json', true);
      await expect(await getFormTitleField(page)).toHaveValue('SNOMED answer value set form');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');

      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await PWUtils.expectRadioChecked(page, 'Answer list source', 'SNOMED answer value set');
      await expect(page.locator('lfb-answer-option')).toHaveCount(0);
      await expect(page.locator('#answerValueSet_non-snomed')).toHaveCount(0);

      const ecl = page.locator('#answerValueSet_ecl');
      await expect(ecl).toHaveValue(snomedEclText);
      const edition = page.locator('#answerValueSet_edition');
      await expect(edition.locator('option:checked')).toHaveText('International Edition (900000000000207008)');
      const version = page.locator('#answerValueSet_version');
      await expect(version.locator('option:checked')).toHaveText('20221231');
      const formattedUri = ecl.locator('xpath=ancestor::lfb-answer-value-set//span[contains(@class,"text-break")]');
      await expect(formattedUri).toContainText(encodedUriPart);

      await PWUtils.clickTreeNode(page, 'Item with non-snomed', false);
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer value set URI');
      await expect(page.locator('#answerValueSet_non-snomed')).toBeVisible();
      await expect(page.locator('#answerValueSet_non-snomed'))
        .toHaveValue('http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions');
      await expect(ecl).toHaveCount(0);
      await expect(edition).toHaveCount(0);
      await expect(version).toHaveCount(0);
      await expect(page.locator('lfb-answer-option')).toHaveCount(0);

      await PWUtils.clickTreeNode(page, 'Item with answer option', false);
      await expect(page.locator('[id^="__\\$answerOptionMethods_none"]')).toBeChecked();
      await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer options');
      await expect(page.locator('lfb-answer-option')).toBeVisible();
      await expect(page.locator('#answerValueSet_non-snomed')).toHaveCount(0);

      await PWUtils.clickTreeNode(page, 'Item with SNOMED', false);
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'SNOMED answer value set');
      await PWUtils.clickTreeNode(page, 'Item with answer option', false);
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer options');
      await expect(page.locator('lfb-answer-option')).toBeVisible();

      await PWUtils.clickTreeNode(page, 'Item with non-snomed', false);
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer value set URI');

      await PWUtils.clickTreeNode(page, 'Item with SNOMED', false);
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'SNOMED answer value set');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].answerValueSet).toContain(encodedUriPart);
      expect(qJson.item[1].answerValueSet).toContain('http://clinicaltables.nlm.nih.gov/fhir/R4/ValueSet/conditions');
      expect(qJson.item[2].answerValueSet).toBeUndefined();

      await page.route('https://snowstorm.ihtsdotools.org/fhir/ValueSet/**', async (route) => {
        await route.fulfill({ path: 'cypress/fixtures/snomed-ecl-expression-mock.json' });
      });

      await PWUtils.clickMenuBarButton(page, 'Preview');
      await page.getByRole('tab', { name: 'View Rendered Form' }).click();

      const inputBox1 = page.locator('[id="1/1"]');
      await inputBox1.click();
      const sr = page.locator('#lhc-tools-searchResults');
      await expect(sr).toBeVisible();
      await inputBox1.press('ArrowDown');
      await inputBox1.press('Enter');
      await expect(sr).not.toBeVisible();
      await expect(inputBox1).toHaveValue('Intersex');

      const inputBox2 = page.locator('[id="2/1"]');
      await inputBox2.click();
      await expect(sr).toBeVisible();
      await inputBox2.press('ArrowDown');
      await inputBox2.press('Enter');
      await expect(sr).not.toBeVisible();
      await expect(inputBox2).toHaveValue('Back pain');

      await PWUtils.clickDialogButton(page, { selector: 'lfb-preview-dlg' }, 'Close');
    });

    test('should display the pre-defined SNOMED CT answerValueSet initial selection', async ({ page }) => {
      await PWUtils.uploadFile(page, 'snomed-answer-value-set-sample.json', true);
      await expect(await getFormTitleField(page)).toHaveValue('SNOMED answer value set form');
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await PWUtils.clickTreeNode(page, 'Item with a single SNOMED answerValuetSet initial selection');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'SNOMED answer value set');
      await expect(page.locator('lfb-answer-option')).toHaveCount(0);
      await expect(page.locator('#answerValueSet_non-snomed')).toHaveCount(0);

      const ecl = page.locator('#answerValueSet_ecl');
      await expect(ecl).toHaveValue(snomedEclTextDiseaseDisorder);
      const edition = page.locator('#answerValueSet_edition');
      await expect(edition.locator('option:checked')).toHaveText('International Edition (900000000000207008)');
      const version = page.locator('#answerValueSet_version');
      await expect(version.locator('option:checked')).toHaveText('20231001');
      const formattedUri = ecl.locator('xpath=ancestor::lfb-answer-value-set//span[contains(@class,"text-break")]');
      await expect(formattedUri).toContainText(snomedEclEncodedTextDiseaseDisorder);

      const valueMethod = page.locator('div').filter({ hasText: 'Value method' }).first();
      const pickInitialRadio = valueMethod.locator('[id^="__\\$valueMethod_pick-initial"]');
      await expect(pickInitialRadio).toBeChecked();

      await expect(page.locator('lfb-auto-complete[id^="initial.0.valueCoding.display"] > span > input'))
        .toHaveValue('Adenosine deaminase 2 deficiency');
      await expect(page.locator('[id^="initial.0.valueCoding.code"]')).toHaveValue('987840791000119102');
      await expect(page.locator('[id^="initial.0.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');

      await PWUtils.clickTreeNode(page, 'Item with multiple SNOMED answerValueSet initial selections');
      await PWUtils.expectRadioChecked(page, 'Answer list source', 'SNOMED answer value set');
      await expect(page.locator('lfb-answer-option')).toHaveCount(0);
      await expect(page.locator('#answerValueSet_non-snomed')).toHaveCount(0);

      await expect(page.locator('#answerValueSet_ecl')).toHaveValue(snomedEclTextDiseaseDisorder);
      await expect(edition.locator('option:checked')).toHaveText('International Edition (900000000000207008)');
      await expect(version.locator('option:checked')).toHaveText('20231001');
      await expect(formattedUri).toContainText(snomedEclEncodedTextDiseaseDisorder);

      await expect(pickInitialRadio).toBeChecked();

      await expect(page.locator('lfb-auto-complete[id^="initial.0.valueCoding.display"] > span > input'))
        .toHaveValue('Adenosine deaminase 2 deficiency');
      await expect(page.locator('[id^="initial.0.valueCoding.code"]')).toHaveValue('987840791000119102');
      await expect(page.locator('[id^="initial.0.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
      await expect(page.locator('lfb-auto-complete[id^="initial.1.valueCoding.display"] > span > input'))
        .toHaveValue('Chronic gastric erosion');
      await expect(page.locator('[id^="initial.1.valueCoding.code"]')).toHaveValue('956321981000119108');
      await expect(page.locator('[id^="initial.1.valueCoding.system"]')).toHaveValue('http://snomed.info/sct');
    });

    test.describe('Answer expression', () => {
      test.beforeEach(async ({ page }) => {
        const sampleFile = 'answer-expression-sample.json';
        await PWUtils.uploadFile(page, sampleFile, true);
        await expect(page.locator('lfb-form-fields label:has-text("Title")'))
          .toBeVisible({ timeout: 10000 });
        await expect(await getFormTitleField(page)).toHaveValue('answer-expression-sample');
        await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      });

      test('should display the appropriate answer expression and initial value', async ({ page }) => {
        const type = page.locator('[id^="type"]');
        const valueMethod = page.locator('div').filter({ hasText: 'Value method' }).first();

        await expect(type).toContainText('string');
        await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
        await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer expression');
        await expect(page.locator('[id^="__\\$answerExpression"]'))
          .toHaveValue("%patient.name.where(use = 'official').given.join(' ') + ' ' + %patient.name.where(use = 'official').family");

        await expect(valueMethod.locator('[id^="__\\$valueMethod_"]')).toHaveCount(4);
        const typeInitialRadio = valueMethod.locator('[id^="__\\$valueMethod_type-initial"]');
        await expect(typeInitialRadio).toBeChecked();
        await expect(page.locator('[id^="initial.0.valueString"]')).toHaveValue('Ann Anderson');

        await PWUtils.clickTreeNode(page, "What is the patient's age?");
        await expect(type).toContainText('integer');
        await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
        await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer expression');
        await expect(page.locator('[id^="__\\$answerExpression"]'))
          .toHaveValue("today().toDate().difference(%patient.birthDate.toDate()).years()");

        await expect(typeInitialRadio).toBeChecked();
        await expect(page.locator('[id^="initial.0.valueInteger"]')).toHaveValue('20');

        await PWUtils.clickTreeNode(page, "What is the patient's gender?");
        await expect(type).toContainText('coding');
        await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');
        await PWUtils.expectRadioChecked(page, 'Answer list source', 'Answer expression');
        await expect(page.locator('[id^="__\\$answerExpression"]')).toHaveValue('%patient.gender');

        await expect(typeInitialRadio).toBeChecked();
        await expect(page.locator('[id^="initial.0.valueCoding.display"]')).toHaveValue('Male');
        await expect(page.locator('[id^="initial.0.valueCoding.code"]')).toHaveValue('male');
        await expect(page.locator('[id^="initial.0.valueCoding.system"]'))
          .toHaveValue('http://hl7.org/fhir/administrative-gender');
      });

      test('should create and update Answer expression', async ({ page }) => {
        await PWUtils.clickTreeNode(page, "What is the patient's gender?");
        const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
        await addNewItemButton.scrollIntoViewIfNeeded();
        await addNewItemButton.click();

        const textInput = page.locator('#text');
        await textInput.clear();
        await textInput.fill('Answer Expression');
        await PWUtils.selectDataType(page, 'integer');

        await page.locator('button#editVariables').click();

        await expect(page.locator('#expression-editor-base-dialog')).toBeVisible();
        await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
        await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

        await page.locator('#add-variable').click();
        await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
        await page.locator('#variable-label-0').clear();
        await page.locator('#variable-label-0').fill('a');
        await page.locator('#variable-type-0').selectOption('Easy Path Expression');
        await page.locator('input#simple-expression-0').fill('1');

        await page.locator('#add-variable').click();
        await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);
        await page.locator('#variable-label-1').clear();
        await page.locator('#variable-label-1').fill('b');
        await page.locator('#variable-type-1').selectOption('Easy Path Expression');
        await page.locator('input#simple-expression-1').fill('2');

        await page.locator('#export').click();

        await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(2);
        const firstVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(1)');
        const secondVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(2)');

        await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('a');
        await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
        await expect(firstVariable.locator('td:nth-child(3)')).toHaveText('1');

        await expect(secondVariable.locator('td:nth-child(1)')).toHaveText('b');
        await expect(secondVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
        await expect(secondVariable.locator('td:nth-child(3)')).toHaveText('2');

        await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
        await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer expression');
        await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');

        await page.locator('[id^="edit__\\$answerExpression"]').click();
        await page.locator('textarea#final-expression').clear();
        await page.locator('textarea#final-expression').fill('%a | %b');
        await page.locator('#export').click();
        await expect(page.locator('[id^="__\\$answerExpression"]')).toHaveValue('%a | %b');

        await page.locator('[id^="edit__\\$answerExpression"]').click();
        await page.locator('textarea#final-expression').clear();
        await page.locator('textarea#final-expression').fill('%a | %b | 999');
        await page.locator('#export').click();
        await expect(page.locator('[id^="__\\$answerExpression"]')).toHaveValue('%a | %b | 999');

        const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
        expect(qJson.item[3].extension).toEqual([
          {
            url: 'http://hl7.org/fhir/StructureDefinition/variable',
            valueExpression: {
              name: 'a',
              language: 'text/fhirpath',
              expression: '1',
              extension: [
                { url: 'http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type', valueString: 'simple' },
                { url: 'http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax', valueString: '1' }
              ]
            }
          },
          {
            url: 'http://hl7.org/fhir/StructureDefinition/variable',
            valueExpression: {
              name: 'b',
              language: 'text/fhirpath',
              expression: '2',
              extension: [
                { url: 'http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type', valueString: 'simple' },
                { url: 'http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax', valueString: '2' }
              ]
            }
          },
          {
            url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-answerExpression',
            valueExpression: { language: 'text/fhirpath', expression: '%a | %b | 999' }
          }
        ]);

        await PWUtils.clickMenuBarButton(page, 'Preview');
        const items = page.locator('lhc-item');
        await items.nth(3).locator('lhc-item-question input').click();
        const completionOptions = page.locator('span#completionOptions > ul > li');
        await expect(completionOptions).toHaveCount(3);
        await expect(completionOptions.nth(0)).toHaveText('1');
        await expect(completionOptions.nth(1)).toHaveText('2');
        await expect(completionOptions.nth(2)).toHaveText('999');
        await PWUtils.clickDialogButton(page, { selector: 'lfb-preview-dlg' }, 'Close');

        await getComputeInitialValueValueMethodClick(page);
        await expect(page.locator('[id^="__\\$initialExpression"]')).toBeEmpty();
      });
    });

    test.describe('Accepting only LOINC terms of use', () => {
      test.beforeEach(async ({ page }) => {
        await mainPO.loadHomePageWithLoincOnly();

        await page.locator('input[type="radio"][value="scratch"]').click();
        await page.getByRole('button', { name: 'Continue' }).click();
        await PWUtils.clickButton(page, 'Toolbar with button groups', 'Create questions');

        await expect(page.locator('.spinner-border')).not.toBeVisible();
      });

      test('should not display SNOMED option in answerValueSet', async ({ page }) => {
        await expect(await getItemTextField(page)).toHaveValue('Item 0', { timeout: 10000 });

        await PWUtils.selectDataType(page, 'coding');
        await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
        await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');
        await PWUtils.expectRadioNotChecked(page, 'Answer list source', 'Answer options');
        await PWUtils.expectRadioNotChecked(page, 'Answer list source', 'Answer value set URI');
        await PWUtils.expectRadioChecked(page, 'Answer list source', 'None');

        await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');

        await expect(page.locator('[for^="__\\$answerOptionMethods_snomed-value-set"]')).toHaveCount(0);
        await expect(page.locator('#answerValueSet_non-snomed')).toHaveCount(0);
        await expect(page.locator('#answerValueSet_ecl')).toHaveCount(0);
        await expect(page.locator('#answerValueSet_edition')).toHaveCount(0);
        await expect(page.locator('#answerValueSet_version')).toHaveCount(0);
        await expect(page.locator('lfb-answer-option')).toBeVisible();

        await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer value set URI');
        await expect(page.locator('#answerValueSet_non-snomed')).toBeVisible();
        await expect(page.locator('lfb-answer-option')).toHaveCount(0);
      });
    });
  });

  test.describe('Answer options display variants', async () => {
    test.beforeEach(async ({ page }) => {
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
});
