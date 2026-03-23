import { test, expect, Page, Locator } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';
import { EXTENSION_URL_ITEM_CONTROL } from 'src/app/lib/constants/constants';

const getFormTitleField = (page: Page) => PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');

const getBooleanFieldParent = (page: Page, fieldLabel: string) =>
  page.locator('lfb-boolean-radio lfb-label label').filter({ hasText: fieldLabel }).locator('..')
    .locator('xpath=following-sibling::*[1]');

const getBooleanInput = (page: Page, fieldLabel: string, rbValue: string | null) =>
  getBooleanFieldParent(page, fieldLabel).locator(`input[id^="booleanRadio_${rbValue}"]`);

const booleanFieldClick = async (page: Page, fieldLabel: string, rbValue: string | null) =>
  getBooleanFieldParent(page, fieldLabel).locator(`label[for^="booleanRadio_${rbValue}"]`).click();

const getInitialValueBooleanParent = (page: Page) =>
  page.locator('lfb-table lfb-label label').filter({ hasText: 'Initial value' })
    .locator('..').locator('..').locator('xpath=following-sibling::*[1]')
    .locator('table tr').first();

const getInitialValueBooleanInput = (page: Page, rbValue: string | null) =>
  getInitialValueBooleanParent(page).locator(`input[id^="booleanRadio_${rbValue}"]`);

const getInitialValueBooleanClick = async (page: Page, rbValue: string | null) =>
  getInitialValueBooleanParent(page).locator(`label[for^="booleanRadio_${rbValue}"]`).click();

const getTypeInitialValueValueMethodClick = async (page: Page) =>
  page.locator('div').filter({ hasText: 'Value method' }).first()
    .locator('[for^="__\$valueMethod_type-initial"]').click();

const getPickInitialValueValueMethodClick = async (page: Page) =>
  page.locator('div').filter({ hasText: 'Value method' }).first()
    .locator('[for^="__\$valueMethod_pick-initial"]').click();

const toggleTreeNodeExpansion = async (page: Page, nodeText: string) => {
  await PWUtils.clickAndToggleTreeNode(page, nodeText);
  await PWUtils.getTreeNode(page, nodeText);
};

const setupStub = async (fixtureFile: string, stubOverrideObj: Record<string, any>) => {
  const fixtureJson = await PWUtils.readJSONFile(fixtureFile);
  const responseStub = JSON.parse(JSON.stringify(fixtureJson));
  Object.keys(stubOverrideObj).forEach((f) => {
    responseStub[f] = stubOverrideObj[f];
  });
  return { fixtureJson, responseStub };
};


const assertCodeField = async (page: Page, jsonPointerToCodeField: string) => {
  const codeYes = page.locator('[for^="booleanRadio_true"]').filter({ hasText: 'Include code' }).first();
  await codeYes.click({ force: true });

  const codeTable = page.locator('table').filter({ hasText: 'Code' }).first().locator('tbody');

  const row1 = codeTable.locator('tr').nth(0);
  await row1.locator('[id^="code.0.code_"]').fill('c1');
  await row1.locator('[id^="code.0.system_"]').fill('s1');
  await row1.locator('[id^="code.0.display_"]').fill('d1');

  await page.getByRole('button', { name: 'Add new code' }).click();
  const row2 = codeTable.locator('tr').nth(1);
  await row2.locator('[id^="code.1.code_"]').fill('c2');
  await row2.locator('[id^="code.1.system_"]').fill('s2');
  await row2.locator('[id^="code.1.display_"]').fill('d2');

  await page.getByRole('button', { name: 'Add new code' }).click();
  const row3 = codeTable.locator('tr').nth(2);
  await row3.locator('[id^="code.2.code_"]').fill('c3');
  await row3.locator('[id^="code.2.system_"]').fill('s3');
  await row3.locator('[id^="code.2.display_"]').fill('d3');

  await PWUtils.assertValueInQuestionnaire(page, jsonPointerToCodeField, [
    { code: 'c1', system: 's1', display: 'd1' },
    { code: 'c2', system: 's2', display: 'd2' },
    { code: 'c3', system: 's3', display: 'd3' }
  ]);
};

const includeExcludeCodeField = async (page: Page, codeOption: Locator, formOrItem: 'form' | 'item') => {
  const formTesting = formOrItem === 'form';

  const codeYes = await PWUtils.getRadioButtonLabel(page, 'Question code', 'Include code');
  const codeNo = await PWUtils.getRadioButtonLabel(page, 'Question code', 'No code');

  const codeNoRadio = await PWUtils.getRadioButton(page, 'Question code', 'No code');
  await expect(codeNoRadio).toBeChecked();
  const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
  const jsonCode = formTesting ? qJson.code : qJson.item?.[0]?.code;
  expect(jsonCode).toBeUndefined();

  const coding = { code: 'c1', system: 's1', display: 'd1' };
  await codeYes.click();

  const codeInput = page.locator('[id^="code.0.code_"]');
  await codeInput.fill('ab ');
  await codeInput.press('Enter');
  const codeError = codeInput.locator('xpath=following-sibling::ul//small');
  await expect(codeError).toBeVisible();
  await expect(codeError).toContainText('Spaces are not allowed at the beginning or end.');

  await codeInput.clear();
  await codeInput.fill(coding.code);
  await page.locator('[id^="code.0.system_"]').fill(coding.system);
  await page.locator('[id^="code.0.display_"]').fill(coding.display);

  const qJsonAfterYes = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
  const codeAfterYes = formTesting ? qJsonAfterYes.code : qJsonAfterYes.item?.[0]?.code;
  expect(codeAfterYes).toEqual([coding]);

  await codeNo.click();
  const qJsonAfterNo = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
  const codeAfterNo = formTesting ? qJsonAfterNo.code : qJsonAfterNo.item?.[0]?.code;
  expect(codeAfterNo).toBeUndefined();

  await codeYes.click();
  const qJsonAfterYesAgain = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
  const codeAfterYesAgain = formTesting ? qJsonAfterYesAgain.code : qJsonAfterYesAgain.item?.[0]?.code;
  expect(codeAfterYesAgain).toEqual([coding]);
};

const helpTextExtension = [{
  url: EXTENSION_URL_ITEM_CONTROL,
  valueCodeableConcept: {
    text: 'Help-Button',
    coding: [{
      code: 'help',
      display: 'Help-Button',
      system: 'http://hl7.org/fhir/questionnaire-item-control'
    }]
  }
}];

test.describe('Home page', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    mainPO = new MainPO(page);
    await page.goto('/');
  });

  test.describe('Item level fields', () => {
    let codeOption: Locator;
    let codeYes: Locator;
    let codeNo: Locator;
    let codeYesRadio: Locator;
    let codeNoRadio: Locator;
    let addNewItemButton: Locator;
    let helpText: Locator;

    test.beforeEach(async ({ page }) => {
      await mainPO.loadILPage();

      const itemTextField = await PWUtils.getItemTextField(page);
      await expect(itemTextField).toHaveValue('Item 0', { timeout: 10000 });

      addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
      helpText = page.locator('input[id^="__\$helpText\.text"]');

      codeOption = page.locator('div').filter({ hasText: 'Question code' }).first();
      await expect(codeOption).toBeVisible();

      codeYes = await PWUtils.getRadioButtonLabel(page, 'Question code', 'Include code');
      codeYesRadio = await PWUtils.getRadioButton(page, 'Question code', 'Include code');
      codeNo = await PWUtils.getRadioButtonLabel(page, 'Question code', 'No code');
      codeNoRadio = await PWUtils.getRadioButton(page, 'Question code', 'No code');

      await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
    });

    test('should display item editor page', async ({ page }) => {
      await expect(page.locator('tree-root tree-viewport tree-node-collection tree-node').first()).toBeVisible();

      await codeYes.click();
      const codeInput = page.locator('[id^="code.0.code"]');
      await expect(codeInput).toBeVisible();

      await codeNo.click();
      await expect(page.locator('[id^="code.0.code"]')).toHaveCount(0);

      await addNewItemButton.click();
      const lastNode = page.locator('tree-root tree-viewport tree-node-collection tree-node').last();
      await expect(lastNode.locator('tree-node-content div span').nth(1)).toHaveText('New item 1');

      await PWUtils.clickButton(page, 'Toolbar with item action buttons', 'Delete this item');
      await PWUtils.clickDialogButton(page, { title: 'Confirm deletion' }, 'Yes');

      const lastNodeAfterDelete = page.locator('tree-root tree-viewport tree-node-collection tree-node').last();
      await expect(lastNodeAfterDelete.locator('tree-node-content div span').nth(1)).toHaveText('Item 0');

      const helpString = 'Test help text!';
      await helpText.click();
      await helpText.fill(helpString);

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].item[0].text).toEqual(helpString);
      expect(qJson.item[0].item[0].type).toEqual('display');
      expect(qJson.item[0].item[0].extension).toEqual(helpTextExtension);
    });

    test('should include code only when use question code is yes', async ({ page }) => {
      await includeExcludeCodeField(page, codeOption, 'item');
    });

    test('should create codes at item level', async ({ page }) => {
      await assertCodeField(page, '/item/0/code');
    });

    test('should import form with nested extensions', async ({ page }) => {
      const sampleFile = 'nested-extension-sample.json';
      const fixtureJson = await PWUtils.readJSONFile(sampleFile);
      await PWUtils.uploadFile(page, sampleFile, true);
      await PWUtils.clickMenuBarButton(page, 'Preview');

      await PWUtils.clickDialogButton(page, { selector: 'lfb-preview-dlg' }, 'Close');

      const json = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(json.item[0].extension[0].extension[0].extension[0].valueDecimal).toEqual(1.1);
      expect(json.item[0].extension[0].extension[1].extension[0].valueString).toEqual('Nested item: 1/2/1');
      expect(json.item[0].extension[0].extension[1].extension[1].valueString).toEqual('Nested item: 1/2/2');
      expect(json.extension[0].extension[0].extension[0].valueString).toEqual('Form level extension: 1/1/1');
      expect(json).toEqual(fixtureJson);
    });

    test('should import item from CTSS with answer option', async ({ page }) => {
      const addLoincItemBtn = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item from LOINC');
      await addLoincItemBtn.scrollIntoViewIfNeeded();
      await addLoincItemBtn.click();

      const dialog = page.getByRole('dialog', { name: 'Add LOINC item' });
      await expect(dialog).toBeVisible();
      await dialog.getByLabel('Question').click();

      const input = dialog.getByLabel('Search for a LOINC item:');
      await input.fill('vital signs assess');
      const listBox = dialog.getByRole('listbox');
      await expect(listBox).toBeVisible();
      await listBox.press('ArrowDown');
      await listBox.press('Enter');

      await dialog.getByRole('button', { name: 'Add' }).click();

      await PWUtils.expectDataTypeValue(page, /coding/);
      await PWUtils.expectRadioChecked(page, 'Create answer list', 'Yes');

      await PWUtils.expectValueCodings(page, 'answerOption',
        [
          { system: 'http://loinc.org', display: 'Within Defined Limits', code: 'LA25085-4' },
          { system: 'http://loinc.org', display: 'Other', code: 'LA46-8' }
        ]
      );

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[1].answerOption).toEqual([
        {
          valueCoding: {
            system: 'http://loinc.org',
            code: 'LA25085-4',
            display: 'Within Defined Limits'
          }
        },
        {
          valueCoding: {
            system: 'http://loinc.org',
            code: 'LA46-8',
            display: 'Other'
          }
        }
      ]);
    });

    test('should not overwrite previous tree node, when clicked before updating the editor', async ({ page }) => {
      await PWUtils.clickMenuBarDropdown(page, 'Import');

      const searchBox = page.locator('form > input[placeholder="Search LOINC"]');
      await searchBox.fill('vital signs, weight & height panel');
      const typeaheadList = page.getByRole('listbox');
      await expect(typeaheadList).toBeVisible();

      await searchBox.press('Enter');

      await expect(page.locator('div.spinner-border')).not.toBeVisible();
      await PWUtils.clickDialogButton(page, { title: 'Replace existing form?' }, 'Continue');

      await expect(page.locator('#itemContent span')).toContainText('Vital Signs Pnl');

      await toggleTreeNodeExpansion(page, 'Vital Signs Pnl');

      const vitalsNodes = page.locator('tree-root tree-viewport tree-node-collection tree-node span')
        .filter({ hasText: /Resp rate|Heart rate/i });

      await vitalsNodes.evaluateAll((els) => {
        els.forEach((el) => {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
      });

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('Resp rate');
      await PWUtils.clickTreeNode(page, 'Heart rate');
      await expect(await PWUtils.getItemTextField(page)).toHaveValue('Heart rate');
    });

    test('should show correct focused node on the sidebar tree after updating the form from FHIR server', async ({ page }) => {
      const fixture = 'sidebar-node-highlighting-form.R4.json';
      const fhirServer = 'https://lforms-fhir.nlm.nih.gov/baseR4';

      const { responseStub } = await setupStub(fixture, {
        id: '1111',
        meta: {
          versionId: '1',
          lastUpdated: '2020-02-22T22:22:22.222-00:00'
        }
      });

      await page.route(`${fhirServer}/Questionnaire`, async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(responseStub)
        });
      });

      await PWUtils.uploadFile(page, fixture, true);

      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await PWUtils.clickTreeNode(page, 'Second item');

      const json = await PWUtils.getFHIRServerResponse(page, 'Create a new questionnaire on a FHIR server...', fhirServer);
      expect(json).toEqual(responseStub);

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('Second item');
      const firstItem = (await PWUtils.getTreeNode(page, 'First item')).locator('xpath=ancestor::div[contains(@class, "node-content-wrapper")]').first();
      await expect(firstItem).not.toHaveClass(/node-content-wrapper-focused|node-content-wrapper-active/);

      const secondItem = (await PWUtils.getTreeNode(page, 'Second item')).locator('xpath=ancestor::div[contains(@class, "node-content-wrapper")]').first();
      await expect(secondItem).toHaveClass(/node-content-wrapper-active/);
    });

    test('should delete items', async ({ page }) => {
      const nestedItemsFilename = 'nested-items-delete-sample.json';
      await PWUtils.uploadFile(page, nestedItemsFilename, true);
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      await expect(page.locator('.spinner-border')).not.toBeVisible();
      await expect(await PWUtils.getItemTextField(page)).toHaveValue('One (group)');

      await toggleTreeNodeExpansion(page, 'One (group)');
      await toggleTreeNodeExpansion(page, 'One dot seven (group): last sibling');
      await toggleTreeNodeExpansion(page, 'Two (group): last sibling');
      await toggleTreeNodeExpansion(page, 'Two dot four (group)');

      await PWUtils.clickTreeNode(page, 'Two dot four dot two');

      const itemsToDelete = [
        'Two dot four dot two',
        'Two dot four dot three',
        'Two dot four dot four: last sibling',
        'Two dot four dot one',
        'Two dot four (group)',
        'Two dot five',
        'Two dot six',
        'Two dot seven',
        'Two dot eight',
        'Two dot nine (group): last sibling',
        'Two dot three',
        'Two dot two',
        'Two dot one',
        'Two (group): last sibling',
        'One (group)'
      ];

      for (const itemText of itemsToDelete) {
        await expect(await PWUtils.getItemTextField(page)).toHaveValue(itemText);
        await PWUtils.clickButton(page, 'Toolbar with item action buttons', 'Delete this item');
        await PWUtils.clickDialogButton(page, { selector: 'lfb-confirm-dlg' }, 'Yes');
      }

      await expect(page.locator('lfb-sf-form-wrapper div.container-fluid p'))
        .toHaveText('No items in the form. Add an item to continue.');
    });

    test.describe('Boolean fields', () => {
      const readOnlyLabel = 'Read only';
      const repeatsLabel = 'Allow repeating question?';
      const requiredLabel = 'Answer required';

      test('should test options for boolean field', async ({ page }) => {
        await expect(getBooleanInput(page, readOnlyLabel, null)).toBeChecked();
        await expect(getBooleanInput(page, readOnlyLabel, 'false')).not.toBeChecked();

        await booleanFieldClick(page, readOnlyLabel, 'false');

        await expect(getBooleanInput(page, readOnlyLabel, null)).not.toBeChecked();
        await expect(getBooleanInput(page, readOnlyLabel, 'false')).toBeChecked();
        await expect(getBooleanInput(page, repeatsLabel, null)).toBeChecked();
        await expect(getBooleanInput(page, repeatsLabel, 'false')).not.toBeChecked();

        let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
        expect(qJson.item[0].readOnly).toBe(false);
        expect(qJson.item[0].repeats).toBeUndefined();

        await booleanFieldClick(page, readOnlyLabel, null);
        qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
        expect(qJson.item[0].readOnly).toBeUndefined();
        expect(qJson.item[0].repeats).toBeUndefined();

        await booleanFieldClick(page, readOnlyLabel, 'false');
        qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
        expect(qJson.item[0].readOnly).toBe(false);
        expect(qJson.item[0].repeats).toBeUndefined();
      });

      test('should import items with boolean fields', async ({ page }) => {
        const importFile = 'boolean-fields-sample.json';
        await PWUtils.uploadFile(page, importFile, true);
        await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
        await expect(page.locator('.spinner-border')).not.toBeVisible();

        await getPickInitialValueValueMethodClick(page);
        await expect(getInitialValueBooleanInput(page, null)).toBeChecked();
        await expect(getBooleanInput(page, readOnlyLabel, 'true')).toBeChecked();
        await expect(getBooleanInput(page, requiredLabel, 'false')).toBeChecked();
        await expect(getBooleanInput(page, repeatsLabel, null)).toBeChecked();

        await PWUtils.clickTreeNode(page, 'Item 1');

        await expect(getInitialValueBooleanInput(page, 'true')).toBeChecked();
        await expect(getBooleanInput(page, readOnlyLabel, 'false')).toBeChecked();
        await expect(getBooleanInput(page, requiredLabel, 'true')).toBeChecked();
        await expect(getBooleanInput(page, repeatsLabel, 'false')).toBeChecked();

        await PWUtils.clickTreeNode(page, 'Item 2');

        await expect(getInitialValueBooleanInput(page, 'false')).toBeChecked();
        await expect(getBooleanInput(page, readOnlyLabel, null)).toBeChecked();
        await expect(getBooleanInput(page, requiredLabel, null)).toBeChecked();
        await expect(getBooleanInput(page, repeatsLabel, 'true')).toBeChecked();

        const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
        expect(qJson.item[0].initial).toBeUndefined();
        expect(qJson.item[0].readOnly).toBe(true);
        expect(qJson.item[0].required).toBe(false);
        expect(qJson.item[0].repeats).toBeUndefined();
        expect(qJson.item[1].initial[0].valueBoolean).toBe(true);
        expect(qJson.item[1].readOnly).toBe(false);
        expect(qJson.item[1].required).toBe(true);
        expect(qJson.item[1].repeats).toBe(false);
        expect(qJson.item[2].initial[0].valueBoolean).toBe(false);
        expect(qJson.item[2].readOnly).toBeUndefined();
        expect(qJson.item[2].required).toBeUndefined();
        expect(qJson.item[2].repeats).toBe(true);
      });
    });

    test.describe('Insert new item using sidebar tree node context menu', () => {
      test.beforeEach(async ({ page }) => {
        const contextNode = await PWUtils.getTreeNode(page, 'Item 0');
        await expect(contextNode.locator('span.node-display-prefix')).toHaveText('1');
        await contextNode.locator('button.dropdown-toggle').click();
      });

      test.afterEach(async ({ page }) => {
        const contextNode = await PWUtils.getTreeNode(page, 'New item 1', true);
        await contextNode.locator('button.dropdown-toggle').click();
        await expect(page.locator('div.dropdown-menu.show')).toBeVisible();
        await PWUtils.clickMoreOptionsDropdownItem(page, 'Remove this item');

        await PWUtils.clickDialogButton(page, { title: 'Confirm deletion' }, 'Yes');
      });

      test('should insert before context node using sidebar tree node context menu', async ({ page }) => {
        await PWUtils.clickMoreOptionsDropdownItem(page, 'Insert a new item before this');

        await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');
        await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('1');
      });

      test('should insert after context node using sidebar tree node context menu', async ({ page }) => {
        await PWUtils.clickMoreOptionsDropdownItem(page, 'Insert a new item after this');

        await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');
        await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('2');
      });

      test('should insert a child of context node using sidebar tree node context menu', async ({ page }) => {
        await PWUtils.clickMoreOptionsDropdownItem(page, 'Insert a new child item');

        await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');
        await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('1.1');
      });
    });

    test.describe('Move context node using sidebar tree node context menu', () => {
      test.beforeEach(async ({ page }) => {
        await addNewItemButton.click();
        await addNewItemButton.click();
        await addNewItemButton.click();
        await PWUtils.clickTreeNode(page, 'Item 0');

        await expect((await PWUtils.getTreeNode(page, 'Item 0')).locator('span.node-display-prefix')).toHaveText('1');
        await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('2');
        await expect((await PWUtils.getTreeNode(page, 'New item 2')).locator('span.node-display-prefix')).toHaveText('3');
        await expect((await PWUtils.getTreeNode(page, 'New item 3')).locator('span.node-display-prefix')).toHaveText('4');

        const item0 = await PWUtils.getTreeNode(page, 'Item 0');
        await item0.locator('button.dropdown-toggle').click();
        await PWUtils.clickMoreOptionsDropdownItem(page, 'Move this item ...');

        const moveBtn = await PWUtils.getDialogButton(page, { selector: 'lfb-node-dialog' }, 'Move');

        await expect(moveBtn).toBeDisabled();
        await page.locator('#moveTarget1').click();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      });

      test.afterEach(async ({ page }) => {
        await PWUtils.clickMenuBarButton(page, 'Close');
        await mainPO.resetForm();
      });

      test('should move after a target node', async ({ page }) => {
        await expect(page.locator('input[type="radio"][value="AFTER"]')).toBeChecked();
        await PWUtils.getButton(page, null, 'Move').click();
        await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('1');
        await expect((await PWUtils.getTreeNode(page, 'New item 2')).locator('span.node-display-prefix')).toHaveText('2');
        await expect((await PWUtils.getTreeNode(page, 'Item 0')).locator('span.node-display-prefix')).toHaveText('3');
        await expect((await PWUtils.getTreeNode(page, 'New item 3')).locator('span.node-display-prefix')).toHaveText('4');
      });

      test('should move before a target node', async ({ page }) => {
        await page.locator('input[type="radio"][value="BEFORE"]').click();
        await PWUtils.getButton(page, null, 'Move').click();
        await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('1');
        await expect((await PWUtils.getTreeNode(page, 'Item 0')).locator('span.node-display-prefix')).toHaveText('2');
        await expect((await PWUtils.getTreeNode(page, 'New item 2')).locator('span.node-display-prefix')).toHaveText('3');
        await expect((await PWUtils.getTreeNode(page, 'New item 3')).locator('span.node-display-prefix')).toHaveText('4');
      });

      test('should move as a child of a target', async ({ page }) => {
        await page.locator('input[type="radio"][value="CHILD"]').click();
        await PWUtils.getButton(page, null, 'Move').click();
        await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('1');
        await expect((await PWUtils.getTreeNode(page, 'New item 2')).locator('span.node-display-prefix')).toHaveText('2');
        await expect((await PWUtils.getTreeNode(page, 'Item 0')).locator('span.node-display-prefix')).toHaveText('2.1');
        await expect((await PWUtils.getTreeNode(page, 'New item 3')).locator('span.node-display-prefix')).toHaveText('3');
      });
    });

    test.describe('Copy context node using sidebar tree node context menu', () => {
      test.beforeEach(async ({ page }) => {
        await addNewItemButton.click();
        await addNewItemButton.click();
        await addNewItemButton.click();
        await PWUtils.clickTreeNode(page, 'Item 0');

        await expect((await PWUtils.getTreeNode(page, 'Item 0')).locator('span.node-display-prefix')).toHaveText('1');
        await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('2');
        await expect((await PWUtils.getTreeNode(page, 'New item 2')).locator('span.node-display-prefix')).toHaveText('3');
        await expect((await PWUtils.getTreeNode(page, 'New item 3')).locator('span.node-display-prefix')).toHaveText('4');

        const item0 = await PWUtils.getTreeNode(page, 'Item 0');
        await item0.locator('button.dropdown-toggle').click();

        await PWUtils.clickMoreOptionsDropdownItem(page, 'Copy this item ...');

        const copyBtn = await PWUtils.getDialogButton(page, { selector: 'lfb-node-dialog' }, 'Copy');
        await expect(copyBtn).toBeDisabled();
        await page.locator('#moveTarget1').click();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      });

      test.afterEach(async ({ page }) => {
        await PWUtils.clickMenuBarButton(page, 'Close');
        await mainPO.resetForm();

      });

      test('should copy after a target node', async ({ page }) => {
        await expect(page.locator('input[type="radio"][value="AFTER"]')).toBeChecked();
        await PWUtils.getButton(page, null, 'Copy').click();

        await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('2');
        await expect((await PWUtils.getTreeNode(page, 'Copy of Item 0')).locator('span.node-display-prefix')).toHaveText('3');
        await expect((await PWUtils.getTreeNode(page, 'New item 2')).locator('span.node-display-prefix')).toHaveText('4');
        await expect((await PWUtils.getTreeNode(page, 'New item 3')).locator('span.node-display-prefix')).toHaveText('5');
      });

      test('should copy before a target node', async ({ page }) => {
        await page.locator('input[type="radio"][value="BEFORE"]').click();
        await PWUtils.getButton(page, null, 'Copy').click();
        await expect((await PWUtils.getTreeNode(page, 'Copy of Item 0')).locator('span.node-display-prefix')).toHaveText('2');
      });

      test('should copy as a child of a target', async ({ page }) => {
        await page.locator('input[type="radio"][value="CHILD"]').click();
        await PWUtils.getButton(page, null, 'Copy').click();
        await expect((await PWUtils.getTreeNode(page, 'Item 0')).locator('span.node-display-prefix')).toHaveText('1');
        await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('2');
        await toggleTreeNodeExpansion(page, 'New item 1');
        await expect((await PWUtils.getTreeNode(page, 'Copy of Item 0')).locator('span.node-display-prefix')).toHaveText('2.1');
        await expect((await PWUtils.getTreeNode(page, 'New item 2')).locator('span.node-display-prefix')).toHaveText('3');
        await expect((await PWUtils.getTreeNode(page, 'New item 3')).locator('span.node-display-prefix')).toHaveText('4');
      });
    });

    test('should copy a single item', async ({ page }) => {
      const contextMoreBtn = page.locator('div.node-content-wrapper-active button.dropdown-toggle');
      await contextMoreBtn.click();

      await PWUtils.clickMoreOptionsDropdownItem(page, 'Copy this item ...');

      const dlgInput = page.locator('lfb-node-dialog #moveTarget1');
      await dlgInput.click();
      await expect(page.locator('lfb-node-dialog [role="listbox"]')).toContainText('Item 0');
      await dlgInput.press('ArrowDown');
      await dlgInput.press('Enter');
      await PWUtils.getButton(page, null, 'Copy').click();

      await PWUtils.clickTreeNode(page, 'Copy of Item 0');
    });

    test('should restrict to integer input in integer field', async ({ page }) => {
      await PWUtils.selectDataType(page, 'integer');
      await getTypeInitialValueValueMethodClick(page);
      const initIntField = page.locator('[id^="initial.0.valueInteger"]');

      await initIntField.clear();
      await initIntField.pressSequentially('abc');
      await initIntField.press('Enter');
      await expect(initIntField).toHaveValue('');

      await initIntField.pressSequentially('12abc');
      await initIntField.press('Enter');
      await expect(initIntField).toHaveValue('12');
      await initIntField.clear();

      await initIntField.pressSequentially('3.4');
      await initIntField.press('Enter');
      await expect(initIntField).toHaveValue('34');
      await initIntField.clear();

      await initIntField.pressSequentially('-5.6');
      await initIntField.press('Enter');
      await expect(initIntField).toHaveValue('-56');
      await initIntField.clear();

      await initIntField.pressSequentially('-0');
      await initIntField.press('Enter');
      await expect(initIntField).toHaveValue('-0');
      await initIntField.clear();

      await initIntField.pressSequentially('-2-4-');
      await initIntField.press('Enter');
      await expect(initIntField).toHaveValue('-24');
      await initIntField.clear();

      await initIntField.pressSequentially('24e1');
      await initIntField.press('Enter');
      await expect(initIntField).toHaveValue('241');
      await initIntField.clear();

      await initIntField.pressSequentially('-24E1');
      await initIntField.press('Enter');
      await expect(initIntField).toHaveValue('-241');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].initial).toEqual([{ valueInteger: -241 }]);
    });

    test('should restrict to decimal input in number field', async ({ page }) => {
      await PWUtils.selectDataType(page, 'decimal');
      await getTypeInitialValueValueMethodClick(page);
      const initNumberField = page.locator('[id^="initial.0.valueDecimal"]');

      await initNumberField.pressSequentially('abc');
      await initNumberField.press('Enter');
      await expect(initNumberField).toHaveValue('');
      await initNumberField.pressSequentially('abc');
      await initNumberField.press('Enter');
      await initNumberField.blur();
      await expect(initNumberField).toHaveValue('');

      await initNumberField.pressSequentially('12abc');
      await initNumberField.press('Enter');
      await expect(initNumberField).toHaveValue('12');
      await initNumberField.clear();

      await initNumberField.pressSequentially('3.4');
      await initNumberField.press('Enter');
      await expect(initNumberField).toHaveValue('3.4');
      await initNumberField.clear();

      await initNumberField.pressSequentially('-5.6');
      await initNumberField.press('Enter');
      await expect(initNumberField).toHaveValue('-5.6');
      await initNumberField.clear();

      await initNumberField.pressSequentially('-7.8ab');
      await initNumberField.press('Enter');
      await expect(initNumberField).toHaveValue('-7.8');
      await initNumberField.clear();

      await initNumberField.pressSequentially('-xy0.9ab');
      await initNumberField.press('Enter');
      await expect(initNumberField).toHaveValue('-0.9');
      await initNumberField.clear();

      await initNumberField.pressSequentially('-');
      await initNumberField.press('Enter');
      await expect(initNumberField).toHaveValue('-');
      await expect(page.locator('lfb-initial-number input[id^="initial.0.valueDecimal"]')).toHaveClass(/invalid/);
      await expect(page.locator('span[id="initial.0.err"] > small')).toContainText('Invalid decimal value.');
      await initNumberField.clear();

      await initNumberField.pressSequentially('.');
      await initNumberField.press('Enter');
      await expect(initNumberField).toHaveValue('.');
      await expect(page.locator('lfb-initial-number input[id^="initial.0.valueDecimal"]')).toHaveClass(/invalid/);
      await expect(page.locator('span[id="initial.0.err"] > small')).toContainText('Invalid decimal value.');
      await initNumberField.clear();

      await initNumberField.pressSequentially('e');
      await initNumberField.press('Enter');
      await expect(initNumberField).toHaveValue('e');
      await expect(page.locator('lfb-initial-number input[id^="initial.0.valueDecimal"]')).toHaveClass(/invalid/);
      await expect(page.locator('span[id="initial.0.err"] > small')).toContainText('Invalid decimal value.');
      await initNumberField.clear();

      await initNumberField.pressSequentially('-xy0.9ab');
      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].initial).toEqual([{ valueDecimal: -0.9 }]);
      await initNumberField.clear();

      await initNumberField.pressSequentially('.9');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].initial).toEqual([{ valueDecimal: 0.9 }]);
      await initNumberField.clear();

      await initNumberField.pressSequentially('-.9');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].initial).toEqual([{ valueDecimal: -0.9 }]);
      await initNumberField.clear();

      await initNumberField.pressSequentially('2e2');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].initial).toEqual([{ valueDecimal: 200 }]);
      await initNumberField.clear();

      await initNumberField.pressSequentially('2.100');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].initial).toEqual([{ valueDecimal: 2.1 }]);
    });

    test('should add restrictions', async ({ page }) => {
      await page.locator('lfb-restrictions [for^="booleanControlled_Yes"]').click();

      await page.locator('[id^="__\$restrictions.0.operator"]').selectOption({ label: 'Maximum length' });
      await page.locator('[id^="__\$restrictions.0.value"]').fill('10');
      const addRestrictionButton = page.getByRole('button', { name: 'Add new restriction' });
      await addRestrictionButton.click();

      await page.locator('[id^="__\$restrictions.1.operator"]').selectOption({ label: 'Minimum length' });
      await page.locator('[id^="__\$restrictions.1.value"]').fill('5');
      await addRestrictionButton.click();

      await page.locator('[id^="__\$restrictions.2.operator"]').selectOption({ label: 'Regex pattern' });
      await page.locator('[id^="__\$restrictions.2.value"]').fill('xxx');

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].maxLength).toEqual(10);
      expect(qJson.item[0].extension[0].url).toEqual('http://hl7.org/fhir/StructureDefinition/minLength');
      expect(qJson.item[0].extension[0].valueInteger).toEqual(5);
      expect(qJson.item[0].extension[1].url).toEqual('http://hl7.org/fhir/StructureDefinition/regex');
      expect(qJson.item[0].extension[1].valueString).toEqual('xxx');
    });

    test('should import form with restrictions', async ({ page }) => {
      const sampleFile = 'restrictions-sample.json';
      const fixtureJson = await PWUtils.readJSONFile(sampleFile);
      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('Form with restrictions');
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0]).toEqual(fixtureJson.item[0]);
    });

    test('should import form in LForms format', async ({ page }) => {
      const sampleFile = 'sample.lforms.json';
      const fixtureJson = await PWUtils.readJSONFile(sampleFile);
      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('Dummy Form');
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item.length).toEqual(1);
      expect(qJson.item[0].text).toEqual('Section 0');
      expect(qJson.item[0].type).toEqual('group');
      expect(qJson.item[0].code[0].code).toEqual('c0');
      expect(qJson.item[0].item.length).toEqual(1);
      expect(qJson.item[0].item[0].text).toEqual('Section 00');
      expect(qJson.item[0].item[0].type).toEqual('group');
      expect(qJson.item[0].item[0].code[0].code).toEqual('c00');
      expect(qJson.item[0].item[0].item[0].text).toEqual('Decimal question 000');
      expect(qJson.item[0].item[0].item[0].type).toEqual('decimal');
      expect(qJson.item[0].item[0].item[0].code[0].code).toEqual('c000');
    });

    test('should not display header display data type if item has sub-item', async ({ page }) => {
      await PWUtils.expectDataTypeValue(page, /string/);

      let dataTypeSelect = await PWUtils.getItemTypeField(page);
      await expect(dataTypeSelect.locator('option', { hasText: /^group$/ })).toHaveCount(1);
      await expect(dataTypeSelect.locator('option', { hasText: /^display$/ })).toHaveCount(1);

      const contextNode = await PWUtils.getTreeNode(page, 'Item 0');
      await expect(contextNode.locator('span.node-display-prefix')).toHaveText('1');
      await contextNode.locator('button.dropdown-toggle').click();

      await PWUtils.clickMoreOptionsDropdownItem(page, 'Insert a new child item');

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');
      await expect((await PWUtils.getTreeNode(page, 'New item 1')).locator('span.node-display-prefix')).toHaveText('1.1');

      await contextNode.click();
      dataTypeSelect = await PWUtils.getItemTypeField(page);
      await expect(dataTypeSelect.locator('option', { hasText: /^group$/ })).toHaveCount(1);
      await expect(dataTypeSelect.locator('option', { hasText: /^display$/ })).toHaveCount(0);
    });

    test('should retain header type after switching to another item and switching back', async ({ page }) => {
      await PWUtils.expectDataTypeValue(page, /string/);
      await PWUtils.selectDataType(page, 'display');
      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].type).toEqual('display');

      await addNewItemButton.click();
      await PWUtils.expectDataTypeValue(page, /string/);

      await PWUtils.clickTreeNode(page, 'Item 0');
      await PWUtils.expectDataTypeValue(page, /display/);

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].type).toEqual('display');
      expect(qJson.item[1].type).toEqual('string');
    });

    test('should import display type', async ({ page }) => {
      const sampleFile = 'group-display-type-sample.json';
      const fixtureJson = await PWUtils.readJSONFile(sampleFile);
      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('New Form');
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].type).toEqual(fixtureJson.item[0].type);
      expect(qJson.item[1].type).toEqual(fixtureJson.item[1].type);
      expect(qJson.item[1].item[0].type).toEqual(fixtureJson.item[1].item[0].type);
    });

    test('should import quantity type', async ({ page }) => {
      const sampleFile = 'initial-quantity-sample.json';
      const fixtureJson = await PWUtils.readJSONFile(sampleFile);
      await PWUtils.uploadFile(page, sampleFile, true);
      await expect(await getFormTitleField(page)).toHaveValue('Quantity Sample');
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      await expect(page.locator('.spinner-border')).not.toBeVisible();

      await PWUtils.expectDataTypeValue(page, /quantity/);

      await expect(page.locator('[id^="units"]').first()).toBeVisible();
      await expect(page.locator('lfb-units table tbody')).toBeVisible();

      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].initial).toEqual(fixtureJson.item[0].initial);
    });

    test('should create quantity type with initial quantity unit', async ({ page }) => {
      await MainPO.mockUnitsLookup(page);

      await PWUtils.selectDataType(page, 'quantity');
      await getTypeInitialValueValueMethodClick(page);
      await PWUtils.expectDataTypeValue(page, /quantity/);

      await page.locator('[id^="initial.0.valueQuantity.value"]').fill('123');
      const unit0 = page.locator('[id^="initial.0.valueQuantity.unit"]');
      await unit0.pressSequentially('f');

      const suggestions = page.locator('#lhc-tools-searchResults');
      await expect(suggestions).toBeVisible();
      await suggestions.locator('table tbody tr').first().click();
      await expect(suggestions).not.toBeVisible();
      await expect(unit0).toHaveValue('farad');

      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].initial[0]).toEqual({
        valueQuantity: {
          value: 123,
          unit: 'farad',
          code: 'F',
          system: 'http://unitsofmeasure.org'
        }
      });

      await unit0.clear();
      await unit0.fill('xxxx');
      await PWUtils.clickMenuBarButton(page, 'Preview');

      await PWUtils.clickDialogButton(page, { selector: 'lfb-preview-dlg' }, 'Close');

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].initial[0]).toEqual({
        valueQuantity: {
          value: 123,
          unit: 'xxxx'
        }
      });
    });
  });

  test.describe('Test descendant items and display/group type changes', () => {
    test.beforeEach(async ({ page }) => {
      const sampleFile = 'USSG-family-portrait.json';
      await mainPO.loadFLPage();

      await PWUtils.uploadFile(page, sampleFile, false);
      await expect(await getFormTitleField(page)).toHaveValue('US Surgeon General family health portrait');
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
      await expect(page.locator('.spinner-border')).not.toBeVisible();
    });

    test('should preserve descendant item array', async ({ page }) => {
      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].item[10].item.length).toEqual(2);
    });

    test('should preserve change of datatype display', async ({ page }) => {
      await toggleTreeNodeExpansion(page, 'My health history');
      await PWUtils.clickTreeNode(page, 'Name');

      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].item[0].text).toEqual('Name');
      expect(qJson.item[0].item[0].type).toEqual('string');

      const itemText = await PWUtils.getItemTextField(page);
      await itemText.fill('xxx');
      await PWUtils.selectDataType(page, 'display');

      await PWUtils.clickTreeNode(page, 'My health history');
      await PWUtils.clickTreeNode(page, 'xxx');

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('xxx');
      await PWUtils.expectDataTypeValue(page, /display/);

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
      expect(qJson.item[0].item[0].text).toEqual('xxx');
      expect(qJson.item[0].item[0].type).toEqual('display');
    });

    test('should not display selected node in the target node list', async ({ page }) => {
      await toggleTreeNodeExpansion(page, 'Family member health history');
      const contextNode = await PWUtils.getTreeNode(page, 'Relationship to patient');
      await contextNode.click();
      await contextNode.locator('button.dropdown-toggle').click();

      await PWUtils.clickMoreOptionsDropdownItem(page, 'Move this item ...');

      await PWUtils.getButton(page, null, 'Move').waitFor({ state: 'visible' });

      const targetInput = page.locator('lfb-node-dialog').locator('#moveTarget1');
      await targetInput.click();

      const listbox = page.locator('lfb-node-dialog [role="listbox"]');
      await expect(listbox).not.toContainText('Relationship to patient');
    });

    test('should not be able to move an item to an item of type "display"', async ({ page }) => {
      await toggleTreeNodeExpansion(page, 'Family member health history');
      await PWUtils.clickTreeNode(page, 'Race');

      await PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item').click();

      await (await PWUtils.getItemTextField(page)).fill('Display Data Type');
      await PWUtils.selectDataType(page, 'display');
      await expect((await PWUtils.getTreeNode(page, 'Display Data Type')).locator('span.node-display-prefix')).toHaveText('2.8');

      const contextNode = await PWUtils.getTreeNode(page, 'Race');
      await contextNode.locator('button.dropdown-toggle').click();
      await PWUtils.clickMoreOptionsDropdownItem(page, 'Move this item ...');

      const targetInput = page.locator('lfb-node-dialog').locator('#moveTarget1');
      await targetInput.click();
      await targetInput.fill('Gender');
      await targetInput.press('ArrowDown');
      await targetInput.press('Enter');

      const options = page.locator('lfb-node-dialog').locator('ul li');
      await expect(options).toHaveCount(3);
      await expect(options.nth(0)).toContainText('After the target item.');
      await expect(options.nth(1)).toContainText('Before the target item.');
      await expect(options.nth(2)).toContainText('As a child of target item.');

      await targetInput.click();
      await targetInput.fill('Display Data Type');
      await targetInput.press('ArrowDown');
      await targetInput.press('Enter');

      const childOption = page.locator('lfb-node-dialog').locator('ul li').nth(2);
      await expect(childOption).toContainText('As a child of target item.');
      await childOption.locator('input[type="radio"]').check();

      await PWUtils.getButton(page, null, 'Move').click();

      await expect(page.locator('lfb-confirm-dlg > div.modal-header')).toContainText('Move Not Allowed');
      await expect(page.locator('lfb-confirm-dlg > div.modal-body')).toContainText(
        /Cannot drop into item 'Display Data Type' \(linkId: [^)]+\) of type 'display' because it cannot contain children\./
      );

      await PWUtils.clickDialogButton(page, { selector: 'lfb-confirm-dlg' }, 'Close');
    });

    test('should not be able to insert a new child item to an item of type "display"', async ({ page }) => {
      await toggleTreeNodeExpansion(page, 'Family member health history');
      await PWUtils.clickTreeNode(page, 'Race');

      await PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item').click();

      await (await PWUtils.getItemTextField(page)).fill('Display Data Type');
      await PWUtils.selectDataType(page, 'display');
      await expect((await PWUtils.getTreeNode(page, 'Display Data Type')).locator('span.node-display-prefix')).toHaveText('2.8');

      const raceNode = await PWUtils.getTreeNode(page, 'Race');
      await raceNode.locator('button.dropdown-toggle').click();
      await expect(page.locator('div.dropdown-menu.show')).toContainText('Insert a new child item');

      const displayNode = await PWUtils.getTreeNode(page, 'Display Data Type');
      await displayNode.click();
      await displayNode.locator('button.dropdown-toggle').click();
      await expect(page.locator('div.dropdown-menu.show')).not.toContainText('Insert a new child item');
    });

    test('should show "display" data type if the last child is removed from the item', async ({ page }) => {
      await toggleTreeNodeExpansion(page, 'Family member health history');
      await PWUtils.clickTreeNode(page, 'Race');

      await PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item').click();

      await (await PWUtils.getItemTextField(page)).fill('Item with child');

      let parentDataTypeList = await PWUtils.getItemTypeField(page);
      await expect(parentDataTypeList.locator('option', { hasText: /^display$/ })).toHaveCount(1);

      const contextNode = await PWUtils.getTreeNode(page, 'Item with child');
      await contextNode.locator('button.dropdown-toggle').click();
      await PWUtils.clickMoreOptionsDropdownItem(page, 'Insert a new child item');

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 2');

      await PWUtils.clickTreeNode(page, 'Item with child');
      const dataTypesAfterAddedChild = await PWUtils.getItemTypeField(page);
      await expect(dataTypesAfterAddedChild.locator('option', { hasText: /^display$/ })).toHaveCount(0);

      const childNode = await PWUtils.getTreeNode(page, 'New item 2');
      await childNode.locator('button.dropdown-toggle').click();
      await PWUtils.clickMoreOptionsDropdownItem(page, 'Remove this item');
      await PWUtils.clickDialogButton(page, { selector: 'lfb-confirm-dlg' }, 'Yes');

      await expect(await PWUtils.getItemTextField(page)).toHaveValue('Item with child');
      await PWUtils.clickTreeNode(page, 'Item with child');
      const dataTypesAfterRemovedChild = await PWUtils.getItemTypeField(page);
      await expect(dataTypesAfterRemovedChild.locator('option', { hasText: /^display$/ })).toHaveCount(1);
    });
  });
});
