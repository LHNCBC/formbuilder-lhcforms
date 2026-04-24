import {Page, test, expect} from '@playwright/test';
import {MainPO} from "./po/main-po";
import {PWUtils} from "./pw-utils";



async function assertCreateExtension(page: Page) {
  const addBtn = page.getByRole('button', {name: 'Add new extension'}).first();
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  const formLoc = page.locator('lfb-extension-dlg lfb-extension-obj sf-form');
  await expect(formLoc).toBeVisible();
  await formLoc.getByLabel('Url', {exact: true}).fill('http://example.org');
  await expect(PWUtils.getRadioButton(page, 'Value or extension?', 'Use a value type', formLoc)).toBeChecked();
  await expect(PWUtils.getRadioButton(page, 'Value Type Category', 'Primitive type', formLoc)).toBeChecked();
  await expect(formLoc.getByRole('combobox', {name: 'Primitive Type'})).toHaveValue(/valueString/);
  await formLoc.getByText('Value string').fill('Test extension value');
  await page.getByRole('button', {name: 'Save and close'}).first().click();
}


test.describe('extension.component', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
  })

  test('Form level page - should create an extension and see it in the JSON', async ({page}) => {
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    await assertCreateExtension(page);
    const q = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(q.extension).toEqual([{
      url: 'http://example.org',
      valueString: 'Test extension value'
    }]);
  });

  test('Item level page - should add an extension and see it in the JSON', async ({page}) => {
    await page.getByRole('button', {name: 'Create questions'}).first().click();
    await PWUtils.expandAdvancedFields(page);
    await assertCreateExtension(page);
    const q = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(q.item[0].extension).toEqual([{
      url: 'http://example.org',
      valueString: 'Test extension value'
    }]);
  });

  test('Should import a questionnaire with form level extensions, display and see it in the JSON', async ({page}) => {
    const fileJson = await PWUtils.uploadFile(page, 'extensions-sample.json');

    // Verify that the source form is intact
    let q = await PWUtils.getQuestionnaireJSON(page, 'R4');
    expect(q.item).toEqual(fileJson.item);

    // Check form controls for extensions
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    let extRows = page.locator('lfb-extension table tbody tr');
    expect(await extRows.count()).toBe(3);
    extRows = page.locator('lfb-extension table tbody tr');
    // Verify the popup tooltip in the table cell
    await extRows.nth(0).locator('td:nth-of-type(3) input').hover();
    await expect(page.locator('.lfb-tooltip-pre-wrap')).toBeVisible();
    // Hover over another element to dismiss the tooltip.
    await page.locator('label').filter({has: page.getByText('Hide extensions that are')}).hover();
    // Check the disabled buttons of uneditable extensions
    await expect(extRows.nth(0).getByLabel('Remove this row')).toBeDisabled();
    await expect(extRows.nth(0).getByLabel('Move this row down')).toBeDisabled();
    await expect(extRows.nth(0).getByLabel('Edit this row')).toBeDisabled();
    await expect(extRows.nth(1).getByLabel('Remove this row')).toBeDisabled();
    await expect(extRows.nth(1).getByLabel('Move this row down')).toBeDisabled();
    await expect(extRows.nth(1).getByLabel('Move this row up')).toBeDisabled();
    await expect(extRows.nth(1).getByLabel('Edit this row')).toBeDisabled();
    await expect(extRows.nth(2).getByLabel('Remove this row')).toBeEnabled();
    await expect(extRows.nth(2).getByLabel('Move this row up')).toBeEnabled();
    // Test the Hide uneditable extensions checkbox
    await page.getByLabel('Hide extensions that are created').check();
    expect(await extRows.filter({visible: true}).count()).toBe(1);
    await page.getByLabel('Hide extensions that are created').uncheck();
    expect(await extRows.count()).toBe(3);

    // Check the extension fields in the dialog.
    await extRows.nth(2).getByLabel('Edit this row').click();
    const formLoc = page.locator('lfb-extension-dlg lfb-extension-obj sf-form');
    await expect(formLoc).toBeVisible();
    await expect(formLoc.getByLabel('Url', {exact: true})).toHaveValue('http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-launchContext');
    await expect(PWUtils.getRadioButton(page, 'Value or extension?', 'Use an extension', formLoc)).toBeChecked();
    let lContextExtRows = formLoc.locator('lfb-extension table tbody tr');
    await expect(lContextExtRows.nth(0).locator('td:nth-of-type(1) input')).toHaveValue('name');
    await expect(lContextExtRows.nth(0).locator('td:nth-of-type(2) input')).toHaveValue('valueId');
    await expect(lContextExtRows.nth(0).locator('td:nth-of-type(3) input')).toHaveValue('"patient"');
    await expect(lContextExtRows.nth(1).locator('td:nth-of-type(1) input')).toHaveValue('type');
    await expect(lContextExtRows.nth(1).locator('td:nth-of-type(2) input')).toHaveValue('valueCode');
    await expect(lContextExtRows.nth(1).locator('td:nth-of-type(3) input')).toHaveValue('"Patient"');
    await expect(lContextExtRows.nth(2).locator('td:nth-of-type(1) input')).toHaveValue('description');
    await expect(lContextExtRows.nth(2).locator('td:nth-of-type(2) input')).toHaveValue('valueString');
    await expect(lContextExtRows.nth(2).locator('td:nth-of-type(3) input')).toHaveValue(/For filling in patient information/);
    // Invoke the nested extension edit dialog
    await lContextExtRows.nth(2).getByLabel('Edit this row').click();
    // Playwright seems to have an issue with clicking a named button when it is overlaid on another same named button.
    // Force clicking works around this issue.
    await page.getByRole('button', {name: 'Discard changes'}).first().click({force: true});
    // Form is not changed, should see the same JSON.
    q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(q.item).toEqual(fileJson.item);
  });

  test('Should import a questionnaire with item level extensions, display and see it in the JSON', async ({page}) => {
    const fileJson = await PWUtils.uploadFile(page, 'extensions-sample.json');
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    await page.getByRole('button', {name: 'Edit questions'}).first().click();
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    let extRows = page.locator('lfb-extension table tbody tr');
    expect(await extRows.count()).toBe(3);
    await expect(extRows.nth(0).getByLabel('Edit this row')).toBeDisabled();
    await expect(extRows.nth(1).getByLabel('Edit this row')).toBeDisabled();
    await extRows.nth(2).getByLabel('Edit this row').click();
    const formLoc = page.locator('lfb-extension-dlg').nth(0);
    await expect(formLoc).toBeVisible();
    await expect(formLoc.getByLabel('Url', {exact: true})).toHaveValue('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
    await expect(formLoc.getByLabel('Value Type', {exact: true})).toHaveValue(/valueCoding$/);
    const codingLoc = formLoc.locator('lfb-object', {has: page.getByText('Value coding', {exact: true})});
    await expect(codingLoc.getByLabel('Code', {exact: true})).toHaveValue('kg');
    await expect(codingLoc.getByLabel('System', {exact: true})).toHaveValue('http://unitsofmeasure.org');
    await page.getByRole('button', {name: 'Discard changes'}).first().click();
    // No items are changed, should see the same JSON.
    let q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(q.item).toEqual(fileJson.item);

    await PWUtils.clickTreeNode(page, 'Extension with array value type');
    await expect(page.locator('.spinner-border')).not.toBeVisible();
    expect(await extRows.count()).toBe(1);
    await extRows.nth(0).getByLabel('Edit this row').click();
    await expect(formLoc).toBeVisible();
    await expect(formLoc.getByLabel('Url', {exact: true})).toHaveValue('http://example.org/codeable-concept')
    await expect(PWUtils.getRadioButton(page, 'Value or extension?', 'Use a value type', formLoc)).toBeChecked();
    await expect(PWUtils.getRadioButton(page, 'Value Type Category', 'General purpose datatype', formLoc)).toBeChecked();
    expect(await formLoc.getByLabel('Value Type', {exact: true}).inputValue()).toMatch(/valueCodeableConcept$/);
    const ccCodingLoc = formLoc.locator('lfb-array div[id^="valueCodeableConcept"]');
    await expect(ccCodingLoc).toContainClass('ps-4');
    const arrayItemsLoc = ccCodingLoc.locator('lfb-object');
    expect(await arrayItemsLoc.count()).toBe(3);
    await expect(arrayItemsLoc.nth(0).getByLabel('System', {exact: true})).toHaveValue('s1');
    await expect(arrayItemsLoc.nth(0).getByLabel('Code', {exact: true})).toHaveValue('c1');
    await expect(arrayItemsLoc.nth(0).getByLabel('Display', {exact: true})).toHaveValue('d1');
    await expect(PWUtils.getRadioButton(page, 'User Selected', 'Unspecified', arrayItemsLoc.nth(0))).toBeChecked();
    await expect(arrayItemsLoc.nth(1).getByLabel('System', {exact: true})).toHaveValue('s2');
    await expect(arrayItemsLoc.nth(1).getByLabel('Code', {exact: true})).toHaveValue('c2');
    await expect(arrayItemsLoc.nth(1).getByLabel('Display', {exact: true})).toHaveValue('d2');
    await expect(PWUtils.getRadioButton(page, 'User Selected', 'Yes', arrayItemsLoc.nth(1))).toBeChecked();
    await expect(arrayItemsLoc.nth(2).getByLabel('System', {exact: true})).toHaveValue('s3');
    await expect(arrayItemsLoc.nth(2).getByLabel('Code', {exact: true})).toHaveValue('c3');
    await expect(arrayItemsLoc.nth(2).getByLabel('Display', {exact: true})).toHaveValue('d3');
    await expect(PWUtils.getRadioButton(page, 'User Selected', 'Unspecified', arrayItemsLoc.nth(2))).toBeChecked();
    await expect(formLoc.getByRole('button', {name: 'Save and close'})).toBeDisabled();

    // Make some changes.
    // Change user selected from second to third item.
    await PWUtils.clickRadioButton(page, 'User Selected', 'Unspecified', arrayItemsLoc.nth(1));
    await PWUtils.clickRadioButton(page, 'User Selected', 'Yes', arrayItemsLoc.nth(2));

    // Modify system of the third item.
    await arrayItemsLoc.nth(2).getByLabel('System', {exact: true}).clear();
    await arrayItemsLoc.nth(2).getByLabel('System', {exact: true}).fill('Modified_s3');

    await formLoc.getByRole('button', {name: 'Save and close'}).click();
    await expect(page.locator('lfb-extension-dlg')).toHaveCount(0);
    // Verify the changes in JSON.
    q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(q.item[1].extension[0].valueCodeableConcept.coding[1]).toEqual({
      system: 's2',
      code: 'c2',
      display: 'd2'
    });
    expect(q.item[1].extension[0].valueCodeableConcept.coding[2]).toEqual({
      system: 'Modified_s3',
      code: 'c3',
      display: 'd3',
      userSelected: true
    });

    // Check nested extensions
    await PWUtils.clickTreeNode(page, 'Nested extensions');
    await expect(page.locator('.spinner-border')).not.toBeVisible();
    expect(await extRows.count()).toBe(1);
    await extRows.nth(0).getByLabel('Edit this row').click();
    await expect(formLoc).toBeVisible();
    await expect(formLoc.getByLabel('Url', {exact: true})).toHaveValue('http://example.org/level1');
    await expect(PWUtils.getRadioButton(page, 'Value or extension?', 'Use an extension', formLoc)).toBeChecked();
    let level1ExtRows = formLoc.locator('lfb-extension table tbody tr');
    expect(await level1ExtRows.count()).toBe(1);
    await level1ExtRows.nth(0).getByLabel('Edit this row').click();
    // Invoked second level extension dialog
    // Note that the nested dialogs do not have parent child relationship in the DOM. Use nth(1) to get the next dialog.
    const level2FormLoc = page.locator('lfb-extension-dlg').nth(1);
    await expect(level2FormLoc).toBeVisible();
    await expect(level2FormLoc.getByLabel('Url', {exact: true})).toHaveValue('http://example.org/level2')
    await expect(PWUtils.getRadioButton(page, 'Value or extension?', 'Use an extension', level2FormLoc)).toBeChecked();
    let level2ExtRows = level2FormLoc.locator('lfb-extension table tbody tr');
    expect(await level2ExtRows.count()).toBe(1);
    // The force click on deeply nested dialogs can intermittently fail to open the next dialog.
    // Retry the click if the 3rd dialog doesn't appear.
    const editLevel3Btn = level2ExtRows.nth(0).getByLabel('Edit this row');
    await editLevel3Btn.click({force: true});
    try {
      await expect(page.locator('lfb-extension-dlg')).toHaveCount(3, {timeout: 5000});
    } catch {
      // Retry the click if the dialog didn't open
      await editLevel3Btn.click({force: true});
      await expect(page.locator('lfb-extension-dlg')).toHaveCount(3);
    }
    const level3FormLoc = page.locator('lfb-extension-dlg').nth(2);
    await expect(level3FormLoc).toBeVisible();
    await expect(level3FormLoc.getByLabel('Url', {exact: true})).toHaveValue('http://example.org/level3')
    await expect(PWUtils.getRadioButton(page, 'Value or extension?', 'Use a value type', level3FormLoc)).toBeChecked();
    await expect(PWUtils.getRadioButton(page, 'Value Type Category', 'Primitive type', level3FormLoc)).toBeChecked();
    expect(await level3FormLoc.getByLabel('Primitive Type', {exact: true}).inputValue()).toMatch(/valueString$/);
    await expect(level3FormLoc.getByLabel('Value String', {exact: true})).toHaveValue('Level 3 value');

    await level3FormLoc.getByRole('button', {name: 'Discard changes'}).click({force: true});
    await expect(page.locator('lfb-extension-dlg')).toHaveCount(2);
    await level2FormLoc.getByRole('button', {name: 'Discard changes'}).click({force: true});
    await expect(page.locator('lfb-extension-dlg')).toHaveCount(1);
    await formLoc.getByRole('button', {name: 'Discard changes'}).click();
    await expect(page.locator('lfb-extension-dlg')).toHaveCount(0);
  });

  test('Should not save an extension without making changes', async ({page}) => {
    // Import a form with extensions
    await PWUtils.uploadFile(page, 'extensions-sample.json');
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    await page.getByRole('button', {name: 'Edit questions'}).first().click();
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();

    const extRows = page.locator('lfb-extension table tbody tr');
    await extRows.nth(2).getByLabel('Edit this row').click();
    const formLoc = page.locator('lfb-extension-dlg').nth(0);
    await expect(formLoc).toBeVisible();

    // Save button should be disabled when dialog first opens (no changes made)
    await expect(formLoc.getByRole('button', {name: 'Save and close'})).toBeDisabled();

    // Close without changes — should not prompt for confirmation
    await formLoc.getByRole('button', {name: 'Discard changes'}).click();
    // No confirmation dialog should appear; dialog should close immediately
    await expect(page.locator('lfb-extension-dlg')).toHaveCount(0);
  });

  test('Should prompt for confirmation when discarding changes in a dirty form', async ({page}) => {
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    const addBtn = page.getByRole('button', {name: 'Add new extension'}).first();
    await addBtn.click();
    const formLoc = page.locator('lfb-extension-dlg lfb-extension-obj sf-form');
    await expect(formLoc).toBeVisible();

    // Make a change to dirty the form
    await formLoc.getByLabel('Url', {exact: true}).fill('http://example.org/dirty');

    // Try to discard — should show confirmation
    await page.locator('lfb-extension-dlg').getByRole('button', {name: 'Discard changes'}).first().click();
    // Confirmation dialog should appear
    const confirmDlg = page.locator('ngb-modal-window');
    await expect(confirmDlg).toBeVisible();
    await expect(confirmDlg).toContainText('Are you sure you want to discard');

    // Click "Do not discard changes" — dialog should stay open
    await confirmDlg.getByRole('button', {name: 'Do not discard changes'}).click();
    await expect(page.locator('lfb-extension-dlg')).toHaveCount(1);

    // Try discard again, this time confirm
    await page.locator('lfb-extension-dlg').getByRole('button', {name: 'Discard changes'}).first().click();
    await expect(confirmDlg).toBeVisible();
    await confirmDlg.getByRole('button', {name: 'Discard changes', exact: true}).click();
    await expect(page.locator('lfb-extension-dlg')).toHaveCount(0);

    // Verify the extension was NOT added to the JSON
    const q = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(q.extension).toBeUndefined();
  });

  test('Should not accept empty URL extension', async ({page}) => {
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    const addBtn = page.getByRole('button', {name: 'Add new extension'}).first();
    await addBtn.click();
    const formLoc = page.locator('lfb-extension-dlg lfb-extension-obj sf-form');
    await expect(formLoc).toBeVisible();

    // Leave URL empty, fill only the value
    await formLoc.getByText('Value string').fill('Value without URL');

    // Save button should be disabled because URL is empty
    const saveBtn = page.locator('lfb-extension-dlg').getByRole('button', {name: 'Save and close'}).first();
    await expect(saveBtn).toBeDisabled();

    // Now fill in a valid URL — save should become enabled
    await formLoc.getByLabel('Url', {exact: true}).fill('http://example.org/valid');
    await expect(saveBtn).toBeEnabled();

    // Clear the URL again — save should be disabled
    await formLoc.getByLabel('Url', {exact: true}).clear();
    await expect(saveBtn).toBeDisabled();

    // Discard the changes
    await page.locator('lfb-extension-dlg').getByRole('button', {name: 'Discard changes'}).first().click();
    const confirmDlg = page.locator('ngb-modal-window');
    await expect(confirmDlg).toBeVisible();
    await confirmDlg.getByRole('button', {name: 'Discard changes', exact: true}).click();
    await expect(page.locator('lfb-extension-dlg')).toHaveCount(0);

    // The exported JSON should not have any extension
    const q = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(q.extension).toBeUndefined();
  });
});
