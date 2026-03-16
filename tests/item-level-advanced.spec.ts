import { test, expect, Locator, Page } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';
import { ExtensionDefs } from '../src/app/lib/extension-defs';

const olpExtUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationLinkPeriod';
const observationExtractExtUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationExtract';
const ucumUrl = 'http://unitsofmeasure.org';

const getTerminologyServerInput = (page: Page) => page.locator('[id="__$terminologyServer"]');

test.describe('Home page', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    mainPO = new MainPO(page);
    await mainPO.mockSnomedEditions();
    await page.goto('/');
    await mainPO.loadHomePage();
  });

  test.describe('Item level fields: advanced', () => {
    let codeYesLabel: Locator;
    let codeYesRadio: Locator;

    test.beforeEach(async ({ page }) => {
      await page.locator('input[type="radio"][value="scratch"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Create questions').click();

      const itemTextField = await PWUtils.getItemTextField(page);
      await expect(itemTextField).toHaveValue('Item 0', { timeout: 10000 });

      const codeOption = page.locator('div').filter({ hasText: 'Question code' }).first();
      await expect(codeOption).toBeVisible();

      codeYesLabel = await PWUtils.getRadioButtonLabel(page, 'Question code', 'Include code');
      codeYesRadio = await PWUtils.getRadioButton(page, 'Question code', 'Include code');

      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
      await PWUtils.expandAdvancedFields(page);
    });

    test.afterEach(async ({ page }) => {
      await PWUtils.collapseAdvancedFields(page);
    });

    test('should create terminology server extension', async ({ page }) => {
      const tsUrl = await getTerminologyServerInput(page);

      await tsUrl.fill('http://example.org/fhir');
      await PWUtils.assertValueInQuestionnaire(page, '/item/0/extension', [
        {
          valueUrl: 'http://example.org/fhir',
          url: ExtensionDefs.preferredTerminologyServer.url
        }
      ]);

      await tsUrl.clear();
      await PWUtils.assertValueInQuestionnaire(page, '/item/0/extension', undefined);

      await tsUrl.fill('http://example.com/r4');
      await PWUtils.assertValueInQuestionnaire(page, '/item/0/extension', [
        {
          url: ExtensionDefs.preferredTerminologyServer.url,
          valueUrl: 'http://example.com/r4'
        }
      ]);
    });

    test('should import a form with terminology server extension', async ({ page }) => {
      const sampleFile = 'terminology-server-sample.json';
      await PWUtils.uploadFile(page, sampleFile, true);

      const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');

      await expect(titleField).toHaveValue('Terminology server sample form');

      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();

      await expect(page.locator('.spinner-border')).not.toBeVisible();

      const tsUrl = await getTerminologyServerInput(page);

      await expect(tsUrl).toBeVisible();
      await expect(tsUrl).toHaveValue('http://example.com/r4');

      await PWUtils.assertExtensionsInQuestionnaire(
        page,
        '/item/0/extension',
        ExtensionDefs.preferredTerminologyServer.url,
        [
          {
            url: ExtensionDefs.preferredTerminologyServer.url,
            valueUrl: 'http://example.com/r4'
          }
        ]
      );

      await tsUrl.clear();
      await PWUtils.assertExtensionsInQuestionnaire(
        page,
        '/item/0/extension',
        ExtensionDefs.preferredTerminologyServer.url,
        []
      );

      await tsUrl.fill('http://a.b');
      await PWUtils.assertExtensionsInQuestionnaire(
        page,
        '/item/0/extension',
        ExtensionDefs.preferredTerminologyServer.url,
        [
          {
            url: ExtensionDefs.preferredTerminologyServer.url,
            valueUrl: 'http://a.b'
          }
        ]
      );
    });

    test('should create observation link period', async ({ page }) => {
      const olpNo = await PWUtils.getRadioButton(page, 'Add link to pre-populate FHIR Observation?', 'No');
      const olpYes = await PWUtils.getRadioButton(page, 'Add link to pre-populate FHIR Observation?', 'Yes');

      await expect(olpNo).toBeVisible();
      await expect(olpNo).toBeChecked();
      await expect(olpYes).toBeVisible();
      await expect(olpYes).not.toBeChecked();

      (await PWUtils.getRadioButtonLabel(page, 'Add link to pre-populate FHIR Observation?', 'Yes')).click();

      const warningMsg = page.locator('lfb-observation-link-period > div > div > div > p');
      await expect(warningMsg).toContainText('Linking to FHIR Observation');
      await expect(page.locator('[id^="observationLinkPeriod"]')).toHaveCount(0);

      await codeYesLabel.click();
      await page.locator('[id^="code.0.code"]').fill('C1');
      await expect(warningMsg).toHaveCount(0);

      const timeWindow = page.locator('[id^="observationLinkPeriod"]');
      await expect(timeWindow).toBeVisible();
      await timeWindow.fill('2');

      await expect(page.locator('[id^="select_observationLinkPeriod"] option:checked')).toHaveText('years');
      await page.locator('[id^="select_observationLinkPeriod"]').selectOption({ label: 'months' });

      const qJson = await PWUtils.getQuestionnaireJSON(page, 'R5');

      expect(qJson.item[0].code[0].code).toEqual('C1');
      expect(qJson.item[0].extension[0]).toEqual({
        url: olpExtUrl,
        valueDuration: {
          value: 2,
          unit: 'months',
          system: ucumUrl,
          code: 'mo'
        }
      });
    });

    test('should import item with observation link period extension', async ({ page }) => {
      const sampleFile = 'olp-sample.json';
      const fixtureJson = await PWUtils.readJSONFile(sampleFile);

      await PWUtils.uploadFile(page, sampleFile, true);
      const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');

      await expect(titleField).toHaveValue('Form with observation link period');
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await expect(await PWUtils.getRadioButton(page, 'Question code', 'Include code')).toBeChecked();
      await expect(page.locator('[id^="code.0.code"]')).toHaveValue('Code1');

      const timeWindow = page.locator('[id^="observationLinkPeriod"]');
      await expect(timeWindow).toBeVisible();
      await expect(timeWindow).toHaveValue('200');
      await expect(page.locator('[id^="select_observationLinkPeriod"] option:checked')).toHaveText('days');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item).toEqual(fixtureJson.item);

      await timeWindow.fill('');
      await timeWindow.blur();

      const updatedJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(updatedJson.item[0].extension.length).toEqual(2);
      const extExists = updatedJson.item[0].extension.some((ext) => ext.url === olpExtUrl);
      expect(extExists).toEqual(false);
    });

    test.describe('Use FHIR Observation extraction?', () => {
      test('should create observation extraction', async ({ page }) => {
        const oeNoLabel = page.locator('[for^="radio_No_observationExtract"]');
        const oeYesLabel = page.locator('[for^="radio_Yes_observationExtract"]');
        await oeYesLabel.click();

        const warningMsg = page.locator('lfb-observation-extract p');
        await expect(warningMsg).toContainText('Extraction to FHIR Observations requires');

        await oeNoLabel.click();
        await expect(warningMsg).toHaveCount(0);

        await oeYesLabel.click();
        await expect(warningMsg).toBeVisible();

        await codeYesLabel.click();
        await page.locator('[id^="code.0.code"]').fill('C1');
        await expect(warningMsg).toHaveCount(0);

        await page.locator('[id^="code.0.code"]').fill('');
        await expect(warningMsg).toBeVisible();
        await page.locator('[id^="code.0.code"]').fill('C1');
        await expect(warningMsg).toHaveCount(0);

        const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
        expect(qJson.item[0].code[0].code).toEqual('C1');
        expect(qJson.item[0].extension[0]).toEqual({
          url: observationExtractExtUrl,
          valueBoolean: true
        });

        await oeNoLabel.click();
        const updatedJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
        expect(updatedJson.item[0].code[0].code).toEqual('C1');
        expect(updatedJson.item[0].extension).toBeUndefined();
      });

      test('should import item with observation-extract extension', async ({ page }) => {
        const sampleFile = 'observation-extract.json';
        const fixtureJson = await PWUtils.readJSONFile(sampleFile);

        await PWUtils.uploadFile(page, sampleFile, true);

        const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');

        await expect(titleField).toHaveValue('Form with observation extract');

        await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
        await expect(page.locator('.spinner-border')).not.toBeVisible();

        await expect(await PWUtils.getRadioButton(page, 'Question code', 'Include code')).toBeChecked();

        await expect(page.locator('[id^="code.0.code"]')).toHaveValue('Code1');
        await expect(page.locator('[id^="radio_Yes_observationExtract"]')).toBeChecked();

        const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
        expect(qJson.item).toEqual(fixtureJson.item);

        await page.locator('[for^="radio_No_observationExtract"]').click();

        const updatedJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
        expect(updatedJson.item[0].extension.length).toEqual(2);
        const extExists = updatedJson.item[0].extension.some((ext) => ext.url === observationExtractExtUrl);
        expect(extExists).toEqual(false);
      });
    });
  });

  test.describe('Item level fields: advanced - Editable Link Id', () => {
    const REQUIRED = 'Link Id is required.';
    const DUPLICATE_LINK_ID = 'Entered linkId is already used.';
    const PATTERN =
      'Spaces are not allowed at the beginning or end, and only a single space is allowed between words.';

    test.beforeEach(async ({ page }) => {
      const sampleFile = 'USSG-family-portrait.json';

      await page.locator('input[type="radio"][value="scratch"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();

      await PWUtils.uploadFile(page, sampleFile, false);

      const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');

      await expect(titleField).toHaveValue('US Surgeon General family health portrait');

      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await PWUtils.expandAdvancedFields(page);

      await expect(await getTerminologyServerInput(page)).toBeVisible();
    });

    test.afterEach(async ({ page }) => {
      await PWUtils.collapseAdvancedFields(page);
    });

    test('should update the link id', async ({ page }) => {
      const longLinkId =
        '/sQbMAgt9SavZxxL63WIFBju6Hdwjp3JHyFzXnBKVdLEtCJ71u6TNMhXt' +
        'znjw9HV9b7N6kY33bLiZMEy7nSCJupWu3MIzFg2PfT4JEEa5VFXk3KgaZ' +
        'ypvFH8EGDlxe9bpLoZqbXgxBCQ0iFmG6FKyA1FiuMMtZYoaXHPpJ0M6kZ' +
        'bjBbTbmOSrtufcLu1SrN0MN0h30lxak1yNfCjqqlsxdGescju0nu0nJvg' +
        '6K1Vd5rhBGavjkrBnbDXLrOglYT0gf1HaIBbGGM4C9kO8dTxqBOqg1KHn' +
        'ctpWOL3vc0PIiXB';
      const linkIdSizeLimit = 255;

      const linkId = page.getByLabel('Link Id', {exact: true});

      await expect(linkId).toBeVisible();
      await expect(linkId).toHaveValue('/54126-8');

      await linkId.fill(longLinkId);

      const value = await linkId.inputValue();
      expect(value).not.toEqual(longLinkId);
      expect(value.length).toEqual(linkIdSizeLimit);
      expect(value).toEqual(longLinkId.substring(0, linkIdSizeLimit));
    });

    test('should validate the linkId pattern', async ({ page }) => {
      await PWUtils.clickAndToggleTreeNode(page, 'Family member health history');

      const nameNode = await PWUtils.getTreeNode(page, 'Name', true);
      await nameNode.click();

      const linkId = page.getByLabel('Link Id', {exact: true});
      await linkId.scrollIntoViewIfNeeded();
      await expect(linkId).toBeVisible();
      await expect(linkId).toHaveValue('/54114-4/54138-3');

      await PWUtils.checkLinkIdErrorIsNotDisplayed(page);

      await linkId.fill('/test');
      await PWUtils.checkLinkIdErrorIsNotDisplayed(page);

      await linkId.fill(' /test');
      await PWUtils.checkLinkIdErrorIsDisplayed(page, PATTERN);

      await linkId.fill('/test ');
      await PWUtils.checkLinkIdErrorIsDisplayed(page, PATTERN);

      await linkId.fill(' /test ');
      await PWUtils.checkLinkIdErrorIsDisplayed(page, PATTERN);

      await linkId.fill('/test abc');
      await PWUtils.checkLinkIdErrorIsNotDisplayed(page);

      await linkId.fill('/test  abc');
      await PWUtils.checkLinkIdErrorIsDisplayed(page, PATTERN);
    });

    test('should required linkId', async ({ page }) => {
      await PWUtils.clickAndToggleTreeNode(page, 'Family member health history');
      await PWUtils.clickAndToggleTreeNode(page, 'Living?');

      const currentAgeNode = await PWUtils.getTreeNode(page, 'Current Age', true);
      await currentAgeNode.click();

      const linkId = page.getByLabel('Link Id', { exact: true });

      await linkId.scrollIntoViewIfNeeded();
      await expect(linkId).toBeVisible();
      await expect(linkId).toHaveValue('/54114-4/54139-1/54141-7');

      await linkId.fill('');
      await linkId.press('Backspace');
      await linkId.blur();

      await PWUtils.checkLinkIdErrorIsDisplayed(page, REQUIRED);

      await expect(currentAgeNode.locator('fa-icon#error')).toBeVisible();

      await expect((await PWUtils.getTreeNode(page, 'Living?', true)).locator('fa-icon#error')).toBeVisible();
      await expect((await PWUtils.getTreeNode(page, 'Family member health history', true)).locator('fa-icon#error')).toBeVisible();
    });

    test('should detect duplicate link id and display error', async ({ page }) => {
      await PWUtils.clickAndToggleTreeNode(page, 'Family member health history');
      await PWUtils.clickAndToggleTreeNode(page, 'Living?');

      const livingNode = await PWUtils.getTreeNode(page, 'Living?', true);

      await livingNode.click();

      const linkId = page.getByLabel('Link Id', { exact: true });

      await linkId.scrollIntoViewIfNeeded();
      await expect(linkId).toHaveValue('/54114-4/54139-1');

      await linkId.fill('/54114-4');
      await PWUtils.checkLinkIdErrorIsDisplayed(page, DUPLICATE_LINK_ID);

      await expect(livingNode.locator('fa-icon#error')).toBeVisible();
      await expect((await PWUtils.getTreeNode(page, 'Family member health history', true)).locator('fa-icon#error')).toBeVisible();

      const currentAgeNode = await PWUtils.getTreeNode(page, 'Current Age', true);
      await currentAgeNode.click();

      await page.locator('[id^="enableWhen.0.question"]').press('ArrowDown');
      await page.locator('[id^="enableWhen.0.question"]').press('Enter');
      await page.locator('[id^="enableWhen.0.operator"]').selectOption({ label: 'Not empty' });

      await linkId.scrollIntoViewIfNeeded();
      await expect(linkId).toHaveValue('/54114-4/54139-1/54141-7');
      await linkId.fill('/54114-4');

      await PWUtils.checkLinkIdErrorIsDisplayed(page, DUPLICATE_LINK_ID);
      await expect(currentAgeNode.locator('fa-icon#error')).toBeVisible();

      await livingNode.click();
      await linkId.scrollIntoViewIfNeeded();
      await linkId.fill('/54114-4/54139-1');

      await expect(livingNode.locator('fa-icon#error')).toBeVisible();
      await expect((await PWUtils.getTreeNode(page, 'Family member health history', true)).locator('fa-icon#error')).toBeVisible();

      await currentAgeNode.click();
      await linkId.scrollIntoViewIfNeeded();
      await linkId.fill('/54114-4/54139-1/54141-7');

      await PWUtils.checkLinkIdErrorIsNotDisplayed(page);
      await expect(currentAgeNode.locator('fa-icon#error')).toHaveCount(0);
      await expect(livingNode.locator('fa-icon#error')).toHaveCount(0);
      await expect((await PWUtils.getTreeNode(page, 'Family member health history', true)).locator('fa-icon#error')).toHaveCount(0);

    });

    test('should check siblings for error before clearing out errors from ancestor', async ({ page }) => {
      await PWUtils.clickAndToggleTreeNode(page, 'Family member health history');
      await PWUtils.clickAndToggleTreeNode(page, 'Living?');

      const currentAgeNode = await PWUtils.getTreeNode(page, 'Current Age', true);
      await currentAgeNode.click();

      const linkId = page.getByLabel('Link Id', { exact: true });

      await linkId.scrollIntoViewIfNeeded();
      await expect(linkId).toHaveValue('/54114-4/54139-1/54141-7');

      await linkId.fill('/54114-4/54139-1');
      await PWUtils.checkLinkIdErrorIsDisplayed(page, DUPLICATE_LINK_ID);

      const livingNode = await PWUtils.getTreeNode(page, 'Living?', true);
      const familyNode = await PWUtils.getTreeNode(page, 'Family member health history', true);

      await expect(currentAgeNode.locator('fa-icon#error')).toBeVisible();
      await expect(livingNode.locator('fa-icon#error')).toBeVisible();
      await expect(familyNode.locator('fa-icon#error')).toBeVisible();

      const dobNode = await PWUtils.getTreeNode(page, 'Date of Birth', true);
      await dobNode.click();

      await linkId.scrollIntoViewIfNeeded();
      await expect(linkId).toHaveValue('/54114-4/54139-1/54124-3');

      await linkId.fill('/54114-4/54139-1');
      await PWUtils.checkLinkIdErrorIsDisplayed(page, DUPLICATE_LINK_ID);

      await currentAgeNode.click();
      await linkId.scrollIntoViewIfNeeded();
      await linkId.fill('/54114-4/54139-1/54141-7');

      await PWUtils.checkLinkIdErrorIsNotDisplayed(page);
      await expect(currentAgeNode.locator('fa-icon#error')).toHaveCount(0);

      await expect(livingNode.locator('fa-icon#error')).toBeVisible();
      await expect(familyNode.locator('fa-icon#error')).toBeVisible();

      await dobNode.click();
      await linkId.scrollIntoViewIfNeeded();
      await linkId.fill('/54124-3');

      await PWUtils.checkLinkIdErrorIsNotDisplayed(page);
      await expect(dobNode.locator('fa-icon#error')).toHaveCount(0);
      await expect(livingNode.locator('fa-icon#error')).toHaveCount(0);
      await expect(familyNode.locator('fa-icon#error')).toHaveCount(0);
    });

    test('should allow the linkId to be set to empty and remain empty upon gaining focus', async ({ page }) => {
      const familyNode = await PWUtils.getTreeNode(page, 'Family member health history', true);
      await familyNode.click();

      const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      addNewItemButton.click();

      const newItem1Node = await PWUtils.getTreeNode(page, 'New item 1', true);
      await newItem1Node.click();

      const linkId = page.getByLabel('Link Id', { exact: true });

      await linkId.scrollIntoViewIfNeeded();
      await expect(linkId).toBeVisible();
      await linkId.fill('1');

      await addNewItemButton.click();

      const newItem2Node = await PWUtils.getTreeNode(page, 'New item 2', true);
      await newItem2Node.click();

      await newItem1Node.click();
      await linkId.scrollIntoViewIfNeeded();
      await expect(linkId).toHaveValue('1');

      await linkId.fill('');

      await newItem2Node.click();
      await newItem1Node.click();

      await linkId.scrollIntoViewIfNeeded();
      await expect(linkId).toHaveValue('');
    });

    test('should populate linkId when creating a new item after a focused item with expanded children', async ({ page }) => {
      const familyNode = await PWUtils.getTreeNode(page, 'Family member health history', true);
      await familyNode.click();

      await PWUtils.clickAndToggleTreeNode(page, 'Family member health history');

      await PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item').click();

      const newItem1Node = await PWUtils.getTreeNode(page, 'New item 1', true);
      await newItem1Node.click();

      const linkId = page.getByLabel('Link Id', {exact: true});
      await linkId.scrollIntoViewIfNeeded();
      await expect(linkId).toBeVisible();
      await expect(await linkId.inputValue()).not.toEqual('');
    });
  });

  test.describe('Item level fields: advanced - Condition expression', () => {
    let fixtureJson: any;

    test.beforeEach(async ({ page }) => {
      const sampleFile = 'enable-when-expression-sample.json';
      fixtureJson = await PWUtils.readJSONFile(sampleFile);

      await page.locator('input[type="radio"][value="scratch"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();


      await PWUtils.uploadFile(page, sampleFile, false);

      const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');

      await expect(titleField).toHaveValue('enableWhen expression');

      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();

      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });

    });

    test.afterEach(async ({ page }) => {
      await PWUtils.collapseAdvancedFields(page);
    });

    test('should display enableWhen condition', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'enableWhen condition', true);

      await PWUtils.expandAdvancedFields(page);

      await expect(await PWUtils.getRadioButton(page, 'Conditional method', 'enableWhen condition and behavior')).toBeChecked();
      await expect(page.locator('[id^="enableWhen.0.question"]')).toHaveValue('1 - Item 0');
      await expect(page.locator('[id^="enableWhen.0.operator"] option:checked')).toHaveText('>');
      await expect(page.locator('[id^="enableWhen.0.answerInteger"]')).toHaveValue('5');
      await expect(page.locator('[id^="enableWhen.1.question"]')).toHaveValue('2 - Item 1');
      await expect(page.locator('[id^="enableWhen.1.operator"] option:checked')).toHaveText('>');
      await expect(page.locator('[id^="enableWhen.1.answerInteger"]')).toHaveValue('5');

      await expect(page.locator('input#enableBehavior\\.all')).toBeChecked();
      await expect(page.locator('input#disabledDisplay\\.hidden')).toBeChecked();

    });

    test('should display enableWhen expression', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'enableWhen expression', true);
      await PWUtils.expandAdvancedFields(page);

      await expect(await PWUtils.getRadioButton(page, 'Conditional method', 'enableWhen expression')).toBeChecked();

      await expect(page.locator('[id^="__\\$enableWhenExpression"]')).toHaveValue('%a > 5 and %b > 5');
    });

    test('should display enableWhen and initial expressions', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'enableWhen and initial expressions', true);
      await PWUtils.expandAdvancedFields(page);

      const valueMethod = page.locator('div').filter({ hasText: 'Value method' }).first();
      await expect(valueMethod).toBeVisible();

      const computeInitial = valueMethod.locator('[id^="__$valueMethod_compute-initial"]');
      await expect(computeInitial).toBeChecked();
      await expect(page.locator('[id^="__\\$initialExpression"]')).toHaveValue('%a + %b');

      await expect(await PWUtils.getRadioButton(page, 'Conditional method', 'enableWhen expression')).toBeChecked();

      await expect(page.locator('[id^="__\\$enableWhenExpression"]')).toHaveValue('%a < 5 and %b < 5');
    });

    test('should display enableWhen and calculated expressions', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'enableWhen and calculated expressions', true);
      await PWUtils.expandAdvancedFields(page);

      const valueMethod = page.locator('div').filter({ hasText: 'Value method' }).first();
      await expect(valueMethod).toBeVisible();

      const computeContinuously = valueMethod.locator('[id^="__$valueMethod_compute-continuously"]');
      await expect(computeContinuously).toBeChecked();
      await expect(page.locator('[id^="__\\$calculatedExpression"]')).toHaveValue('%a * %b');

      await expect(await PWUtils.getRadioButton(page, 'Conditional method', 'enableWhen expression')).toBeChecked();

      await expect(page.locator('[id^="__\\$enableWhenExpression"]')).toHaveValue('%a < 5 and %b < 5');
    });

    test('should display enableWhen and answer expressions', async ({ page }) => {
      await PWUtils.clickTreeNode(page, 'enableWhen and answer expressions', true);
      await PWUtils.expandAdvancedFields(page);

      const createAnswerList = await PWUtils.getRadioButton(page, 'Create answer list', 'Yes');
      await expect(createAnswerList).toBeChecked();
      await expect(page.locator('[id^="__\\$answerOptionMethods_answer-expression"]')).toBeChecked();
      await expect(page.locator('[id^="__\\$answerExpression"]')).toHaveValue('1');

      await expect(await PWUtils.getRadioButton(page, 'Conditional method', 'enableWhen expression')).toBeChecked();

      await expect(page.locator('[id^="__\\$enableWhenExpression"]')).toHaveValue('%a < 5 and %b < 5');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[6].extension).toEqual(fixtureJson.item[6].extension);
    });

    test('should show/hide questions based on enableWhen condition and expression', async ({ page }) => {
      await PWUtils.expandAdvancedFields(page);

      await PWUtils.clickMenuBarButton(page, 'Preview');

      const lhcItems = page.locator('div.lhc-form-body > lhc-item');
      await expect(lhcItems).toHaveCount(5);

      const item0 = lhcItems.nth(0);
      await expect(item0.locator('lhc-item-question span.question')).toHaveText('Item 0');
      await expect(item0.locator('.lhc-de-input-unit lhc-item-simple-type input')).toHaveValue('2');

      const item1 = lhcItems.nth(1);
      await expect(item1.locator('lhc-item-question span.question')).toHaveText('Item 1');
      await expect(item1.locator('.lhc-de-input-unit lhc-item-simple-type input')).toHaveValue('3');

      const item2 = lhcItems.nth(2);
      await expect(item2.locator('lhc-item-question span.question')).toHaveText('enableWhen and initial expressions');
      await expect(item2.locator('.lhc-de-input-unit lhc-item-simple-type input')).toHaveValue('5');

      const item3 = lhcItems.nth(3);
      await expect(item3.locator('lhc-item-question span.question')).toHaveText('enableWhen and calculated expressions');
      await expect(item3.locator('.lhc-de-input-unit lhc-item-simple-type input')).toHaveValue('6');

      const item4 = lhcItems.nth(4);
      await expect(item4.locator('lhc-item-question span.question')).toHaveText('enableWhen and answer expressions');
      await expect(item4.locator('lhc-item-choice-autocomplete input')).toHaveValue('');

      await item0.locator('.lhc-de-input-unit lhc-item-simple-type input').fill('6');
      await expect(lhcItems).toHaveCount(2);

      await lhcItems.nth(1).locator('.lhc-de-input-unit lhc-item-simple-type input').fill('6');
      await expect(lhcItems).toHaveCount(4);

      await expect(lhcItems.nth(2).locator('lhc-item-question span.question')).toHaveText('enableWhen condition');
      await expect(lhcItems.nth(3).locator('lhc-item-question span.question')).toHaveText('enableWhen expression');

      await page.locator('mat-dialog-actions button:has-text("Close")').click();
    });
  });
});
