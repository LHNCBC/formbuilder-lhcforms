import {Page, test, expect} from '@playwright/test';
import {MainPO} from "./po/main-po";
import {PWUtils} from "./pw-utils";



async function assertCreateExtension(page: Page) {
  await page.getByRole('button', {name: 'Add new extension'}).first().click();
  const formLoc = page.locator('lfb-extension-dlg lfb-extension-obj sf-form');
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
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    await assertCreateExtension(page);
    const q = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(q.item[0].extension).toEqual([{
      url: 'http://example.org',
      valueString: 'Test extension value'
    }]);
  });

  test('Should import a questionnaire with form level extensions, display and see it in the JSON', async ({page}) => {
    const fileJson = await PWUtils.uploadFile(page, 'fixtures/extensions-sample.json');
    let q = await PWUtils.getQuestionnaireJSON(page, 'R4');
    expect(q.item).toEqual(fileJson.item);
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    let extRows = page.locator('lfb-extension table tbody tr');
    expect(await extRows.count()).toBe(3);
    extRows = page.locator('lfb-extension table tbody tr');
    await expect(extRows.nth(0).getByLabel('Edit this row')).toBeDisabled();
    await expect(extRows.nth(1).getByLabel('Edit this row')).toBeDisabled();
    await extRows.nth(2).getByLabel('Edit this row').click();
    const formLoc = page.locator('lfb-extension-dlg lfb-extension-obj sf-form');
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
    await lContextExtRows.nth(2).getByLabel('Edit this row').click();
    await page.getByRole('button', {name: 'Discard changes'}).first().click({force: true});
    q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(q.item).toEqual(fileJson.item);
  });

  test('Should import a questionnaire with item level extensions, display and see it in the JSON', async ({page}) => {
    const fileJson = await PWUtils.uploadFile(page, 'fixtures/extensions-sample.json');
    let q = await PWUtils.getQuestionnaireJSON(page, 'R4');
    expect(q.item).toEqual(fileJson.item);
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    let extRows = page.locator('lfb-extension table tbody tr');
    expect(await extRows.count()).toBe(3);
    await page.getByRole('button', {name: 'Edit questions'}).first().click();
    await page.getByRole('button', {name: 'Advanced fields'}).first().click();
    extRows = page.locator('lfb-extension table tbody tr');
    expect(await extRows.count()).toBe(3);
    await expect(extRows.nth(0).getByLabel('Edit this row')).toBeDisabled();
    await expect(extRows.nth(1).getByLabel('Edit this row')).toBeDisabled();
    await extRows.nth(2).getByLabel('Edit this row').click();
    const formLoc = page.locator('lfb-extension-dlg lfb-extension-obj sf-form');
    await expect(formLoc.getByLabel('Url', {exact: true})).toHaveValue('http://hl7.org/fhir/StructureDefinition/questionnaire-unit');
    await expect(formLoc.getByLabel('Value Type', {exact: true})).toHaveValue(/valueCoding$/);
    const codingLoc = formLoc.locator('lfb-object', {has: page.getByText('Value coding', {exact: true})});
    await expect(codingLoc.getByLabel('Code', {exact: true})).toHaveValue('kg');
    await expect(codingLoc.getByLabel('System', {exact: true})).toHaveValue('http://unitsofmeasure.org');
    await page.getByRole('button', {name: 'Discard changes'}).first().click();
    q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(q.item).toEqual(fileJson.item);
  });
});
