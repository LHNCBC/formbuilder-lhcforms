import { test, expect, Page, Locator } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

const unitOptionUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption';
const unitUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit';
const unitSystem = 'http://unitsofmeasure.org';

const getUnitsInput = (page: Page, index = 0): Locator => page.locator('input[id^="units"]').nth(index);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const selectCompletionRow = async (page: Page, text: string) => {
  const row = page
    .locator('#completionOptions tr', { hasText: text });
  await row.first().click();
};

const expectUnitsRowValues = async (page: Page, index: number, display: string, code: string, system: string) => {
  const row = page.locator('lfb-units table').locator('tbody tr').nth(index);
  const cols = row.locator('td input');
  await expect(cols.nth(0)).toHaveValue(display);
  await expect(cols.nth(1)).toHaveValue(code);
  await expect(cols.nth(2)).toHaveValue(system);
};

test.describe('item-level units', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    await MainPO.mockUnitsLookup(page);
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();
    await expect(await PWUtils.getItemTextField(page)).toHaveValue('Item 0', { timeout: 10000 });
    await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
  });

  test('should display quantity units', async ({ page }) => {
    await expect(page.locator('input[id^="units"]')).toHaveCount(0);

    await PWUtils.selectDataType(page, 'quantity');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    const unitsInputs = page.locator('input[id^="units"]');
    await expect(unitsInputs.first()).toBeVisible();
    await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

    const results: Array<[string, string]> = [
      ['[in_i]', 'inch'],
      ['[in_br]', 'inch - British']
    ];

    for (let index = 0; index < results.length; index++) {
      const [code, display] = results[index];
      const input = unitsInputs.nth(index);
      await input.click();
      await input.pressSequentially('inch', { delay: 30 });
      await selectCompletionRow(page, code);

      await expectUnitsRowValues(page, index, display, code, unitSystem);

      if (index < results.length - 1) {
        await page.locator('lfb-units').getByRole('button', { name: 'Add another unit' }).click();
      }
    }

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].type).toEqual('quantity');
    expect(qJson.item[0].extension[0].url).toEqual(unitOptionUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('[in_i]');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('inch');
    expect(qJson.item[0].extension[1].url).toEqual(unitOptionUrl);
    expect(qJson.item[0].extension[1].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[1].valueCoding.code).toEqual('[in_br]');
    expect(qJson.item[0].extension[1].valueCoding.display).toEqual('inch - British');
  });

  test('should display decimal/integer units', async ({ page }) => {
    await expect(page.locator('input[id^="units"]')).toHaveCount(0);

    await PWUtils.selectDataType(page, 'decimal');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    const unitsInput = getUnitsInput(page);
    await expect(unitsInput).toBeVisible();
    await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

    await unitsInput.click();
    await unitsInput.pressSequentially('inch', { delay: 30 });
    await expect(page.locator('#lhc-tools-searchResults')).toBeVisible();
    await unitsInput.press('ArrowDown');
    await unitsInput.press('Enter');

    await expect(unitsInput).toHaveValue('inch');

    let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].type).toEqual('decimal');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('[in_i]');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('inch');

    await unitsInput.clear();

    await PWUtils.clickMenuBarButton(page, 'Preview');
    await PWUtils.getButton(page, 'Preview of Questionnaire close', 'Close').click();

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].type).toEqual('decimal');
    expect(qJson.item[0].extension).toBeUndefined();
  });

  test('should support lookup with wordBoundaryChars (string tokenizer) for decimal/integer units', async ({ page }) => {
    await expect(page.locator('input[id^="units"]')).toHaveCount(0);

    await PWUtils.selectDataType(page, 'decimal');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    const unitsInput = getUnitsInput(page);
    await expect(unitsInput).toBeVisible();
    await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

    await unitsInput.click();
    await unitsInput.pressSequentially('A');
    await expect(page.locator('#lhc-tools-searchResults')).toBeVisible();
    await selectCompletionRow(page, 'Ampere');
    await expect(unitsInput).toHaveValue('Ampere');

    const unitCode = page.locator('[id^="__$units.0.valueCoding.code"]');
    const unitSystemInput = page.locator('[id^="__$units.0.valueCoding.system"]');
    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'A', null);


    let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].type).toEqual('decimal');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('A');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('Ampere');

    await unitsInput.pressSequentially('/kg');
    await selectCompletionRow(page, 'kilogram');
    await expect(unitsInput).toHaveValue('Ampere/kilogram');
    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'A/kg', null);

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('A/kg');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('Ampere/kilogram');

    await unitsInput.pressSequentially('.st');
    await selectCompletionRow(page, 'stere');
    await expect(unitsInput).toHaveValue('[Ampere/kilogram]*stere');
    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'A/kg.st', null);

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('A/kg.st');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('[Ampere/kilogram]*stere');

    await unitsInput.clear();
    await unitsInput.pressSequentially('a');
    await selectCompletionRow(page, 'a_g');
    await expect(unitsInput).toHaveValue('mean Gregorian year');
    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'a_g', null);

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('a_g');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('mean Gregorian year');

    await unitsInput.pressSequentially('/k', { delay: 30 });
    await selectCompletionRow(page, 'kat/kg');
    await expect(unitsInput).toHaveValue('[mean Gregorian year]/[katal/kilogram]');
    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'a_g/(kat/kg)', null);

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('a_g/(kat/kg)');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('[mean Gregorian year]/[katal/kilogram]');

    await unitsInput.pressSequentially('/m', { delay: 30 });
    await selectCompletionRow(page, 'meter');
    await expect(unitsInput).toHaveValue('[mean Gregorian year]/[katal/kilogram]/meter');
    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, '(a_g)/(kat/kg)/m', null);

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('(a_g)/(kat/kg)/m');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('[mean Gregorian year]/[katal/kilogram]/meter');
  });

  test('should support lookup with wordBoundaryChars (string tokenizer) for quantity units', async ({ page }) => {
    await expect(page.locator('input[id^="units"]')).toHaveCount(0);

    await PWUtils.selectDataType(page, 'quantity');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    const quantityValue = page.locator('input[id^="initial.0.valueQuantity.value"]');
    await quantityValue.fill('10');

    const quantityUnit = page.locator('input[id^="initial.0.valueQuantity.unit"]');
    await quantityUnit.click();
    await quantityUnit.pressSequentially('l');
    await expect(page.locator('#lhc-tools-searchResults')).toBeVisible();
    await selectCompletionRow(page, 'Liters');
    await expect(quantityUnit).toHaveValue('Liters');

    await expect(page.locator('input[id^="initial.0.valueQuantity.code"]')).toHaveValue('L');
    await expect(page.locator('input[id^="initial.0.valueQuantity.system"]')).toHaveValue(unitSystem);

    let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].initial[0].valueQuantity.system).toEqual(unitSystem);
    expect(qJson.item[0].initial[0].valueQuantity.code).toEqual('L');
    expect(qJson.item[0].initial[0].valueQuantity.unit).toEqual('Liters');

    await quantityUnit.pressSequentially('/s');
    await selectCompletionRow(page, 'second - time');
    await expect(quantityUnit).toHaveValue('Liters per second');

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].initial[0].valueQuantity.system).toEqual(unitSystem);
    expect(qJson.item[0].initial[0].valueQuantity.code).toEqual('L/s');
    expect(qJson.item[0].initial[0].valueQuantity.unit).toEqual('Liters per second');

    const addUnitButton = page.locator('lfb-units').getByRole('button', { name: 'Add another unit' });

    const unit1 = getUnitsInput(page, 0);
    await expect(unit1).toBeVisible();
    await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

    await unit1.click();
    await unit1.pressSequentially('l');
    await expect(page.locator('#lhc-tools-searchResults')).toBeVisible();
    await selectCompletionRow(page, 'Liters');
    await expect(unit1).toHaveValue('Liters');

    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'L', null);

    await addUnitButton.click();

    const unit2 = getUnitsInput(page, 1);
    await expect(unit2).toBeVisible();
    await unit2.click();
    await unit2.pressSequentially('oz');
    await expect(page.locator('#lhc-tools-searchResults')).toBeVisible();
    await selectCompletionRow(page, 'standard unit used in the US and internationally');
    await expect(unit2).toHaveValue('ounce');

    await PWUtils.expectValueCoding(page, '__$units', 1, unitSystem, null, '[oz_av]', null);

    await addUnitButton.click();

    const unit3 = getUnitsInput(page, 2);
    await expect(unit3).toBeVisible();
    await unit3.click();
    await unit3.pressSequentially('m/s/J');
    await page.locator('[id^="__$units.2.valueCoding.code"]').click();
    await expect(unit3).toHaveValue('[meter/[second - time]]/joule');

    await PWUtils.expectValueCoding(page, '__$units', 2, unitSystem, null, 'm/s/J', null);

    await addUnitButton.click();

    const unit4 = getUnitsInput(page, 3);
    await expect(unit4).toBeVisible();
    await unit4.click();
    await unit4.pressSequentially('kg.m/s2');
    await page.locator('[id^="__$units.3.valueCoding.code"]').click();
    await expect(unit4).toHaveValue('[kilogram*meter]/[second - time2]');

    await PWUtils.expectValueCoding(page, '__$units', 3, unitSystem, null, 'kg.m/s2', null);

    await addUnitButton.click();

    const unit5 = getUnitsInput(page, 4);
    await expect(unit5).toBeVisible();
    await unit5.click();
    await unit5.pressSequentially('kg/(m.s2)');
    await page.locator('[id^="__$units.4.valueCoding.code"]').click();
    await expect(unit5).toHaveValue('kilogram/[meter*[second - time2]]');

    await PWUtils.expectValueCoding(page, '__$units', 4, unitSystem, null, 'kg/(m.s2)', null);

    await addUnitButton.click();

    const unit6 = getUnitsInput(page, 5);
    await expect(unit6).toBeVisible();
    await unit6.click();
    await unit6.pressSequentially('kg.m2/(s3.A)');
    await page.locator('[id^="__$units.5.valueCoding.code"]').click();
    await expect(unit6).toHaveValue('[kilogram*[square meter]]/[[second - time3]*Ampere]');

    await PWUtils.expectValueCoding(page, '__$units', 5, unitSystem, null, 'kg.m2/(s3.A)', null);

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].extension[0].url).toEqual(unitOptionUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('L');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('Liters');

    expect(qJson.item[0].extension[1].url).toEqual(unitOptionUrl);
    expect(qJson.item[0].extension[1].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[1].valueCoding.code).toEqual('[oz_av]');
    expect(qJson.item[0].extension[1].valueCoding.display).toEqual('ounce');

    expect(qJson.item[0].extension[2].url).toEqual(unitOptionUrl);
    expect(qJson.item[0].extension[2].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[2].valueCoding.code).toEqual('m/s/J');
    expect(qJson.item[0].extension[2].valueCoding.display).toEqual('[meter/[second - time]]/joule');

    expect(qJson.item[0].extension[3].url).toEqual(unitOptionUrl);
    expect(qJson.item[0].extension[3].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[3].valueCoding.code).toEqual('kg.m/s2');
    expect(qJson.item[0].extension[3].valueCoding.display).toEqual('[kilogram*meter]/[second - time2]');

    expect(qJson.item[0].extension[4].url).toEqual(unitOptionUrl);
    expect(qJson.item[0].extension[4].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[4].valueCoding.code).toEqual('kg/(m.s2)');
    expect(qJson.item[0].extension[4].valueCoding.display).toEqual('kilogram/[meter*[second - time2]]');

    expect(qJson.item[0].extension[5].url).toEqual(unitOptionUrl);
    expect(qJson.item[0].extension[5].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[5].valueCoding.code).toEqual('kg.m2/(s3.A)');
    expect(qJson.item[0].extension[5].valueCoding.display).toEqual('[kilogram*[square meter]]/[[second - time3]*Ampere]');
  });

  test('should support lookup code string that contains wordBoundaryChars', async ({ page }) => {
    await expect(page.locator('input[id^="units"]')).toHaveCount(0);

    await PWUtils.selectDataType(page, 'decimal');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    const unitsInput = getUnitsInput(page);
    await expect(unitsInput).toBeVisible();
    await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

    await unitsInput.click();
    await unitsInput.pressSequentially('a_g/kat/kg/m', { delay: 30 });
    await unitsInput.press('Enter');

    const inputCell = unitsInput.locator('xpath=ancestor::td');
    await expect(inputCell.locator('xpath=following-sibling::td[1]//input')).toHaveValue('a_g/kat/kg/m');
    await expect(inputCell.locator('xpath=following-sibling::td[2]//input')).toHaveValue(unitSystem);

    let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('a_g/kat/kg/m');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('[[[mean Gregorian year]/katal]/kilogram]/meter');

    await unitsInput.clear();
    await unitsInput.pressSequentially('m/s/J', { delay: 30 });
    await expect(page.locator('#lhc-tools-searchResults')).toBeVisible();
    await selectCompletionRow(page, 'joule per liter');
    await expect(unitsInput).toHaveValue('[meter/[second - time]]/[joule/Liters]');
    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'm/s/(J/L)', null);
  });

  test('should support lookup display string that contains wordBoundaryChars and no spaces between words', async ({ page }) => {
    await expect(page.locator('input[id^="units"]')).toHaveCount(0);

    await PWUtils.selectDataType(page, 'decimal');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    const unitsInput = getUnitsInput(page);
    await expect(unitsInput).toBeVisible();
    await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

    await unitsInput.click();
    await unitsInput.pressSequentially('Ampere/kilogram.stere', { delay: 30 });
    await unitsInput.press('Enter');

    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'A/kg.st', null);

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('A/kg.st');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('[Ampere/kilogram]*stere');
  });

  test('should support lookup display string that contains spaces between words', async ({ page }) => {
    await expect(page.locator('input[id^="units"]')).toHaveCount(0);

    await PWUtils.selectDataType(page, 'decimal');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    const unitsInput = getUnitsInput(page);
    await expect(unitsInput).toBeVisible();
    await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

    await unitsInput.click();
    await unitsInput.pressSequentially('mean Gregorian year', { delay: 30 });
    await unitsInput.press('Enter');

    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'a_g', null);

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual(unitSystem);
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('a_g');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('mean Gregorian year');
  });

  test('should not reliably support lookup by typing keywords contain word boundary characters and spaces', async ({ page }) => {
    await expect(page.locator('input[id^="units"]')).toHaveCount(0);

    await PWUtils.selectDataType(page, 'decimal');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    const unitsInput = getUnitsInput(page);
    await expect(unitsInput).toBeVisible();
    await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

    await unitsInput.click();
    await unitsInput.pressSequentially('mean Gregorian year/katal per kilogram', { delay: 30 });
    await unitsInput.press('Enter');

    const codeInput = page.locator('[id^="__$units.0.valueCoding.code"]');
    const systemInput = page.locator('[id^="__$units.0.valueCoding.system"]');

    await expect(codeInput).toHaveValue('a_g/(kat/kg)', { timeout: 5000 });
    await expect(systemInput).toHaveValue(unitSystem);

    await unitsInput.clear();
    await unitsInput.pressSequentially('katal per kilogram/mean Gregorian year', { delay: 30 });
    await unitsInput.press('Enter');
    await expect(codeInput).toHaveValue('');
    await expect(systemInput).toHaveValue('');
  });

  test('should allow users to create their own valueCoding', async ({ page }) => {
    await expect(page.locator('input[id^="units"]')).toHaveCount(0);

    await PWUtils.selectDataType(page, 'decimal');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    const unitsInput = getUnitsInput(page);
    await expect(unitsInput).toBeVisible();
    await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

    await unitsInput.click();
    await unitsInput.pressSequentially('unknown unit', { delay: 30 });
    await unitsInput.press('Enter');

    const codeInput = page.locator('[id^="__$units.0.valueCoding.code"]');
    const systemInput = page.locator('[id^="__$units.0.valueCoding.system"]');

    await codeInput.fill('unknown');
    await codeInput.press('Enter');
    await systemInput.fill('http://unknown.org');
    await systemInput.press('Enter');

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(qJson.item[0].extension[0].url).toEqual(unitUrl);
    expect(qJson.item[0].extension[0].valueCoding.system).toEqual('http://unknown.org');
    expect(qJson.item[0].extension[0].valueCoding.code).toEqual('unknown');
    expect(qJson.item[0].extension[0].valueCoding.display).toEqual('unknown unit');
  });

  test('should display units when reading from existing questionnaire', async ({ page }) => {
    const sampleFile = 'units-and-quantity-sample.json';
    await PWUtils.uploadFile(page, sampleFile, true);
    await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Units and Quantity');
    await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();

    await expect(getUnitsInput(page, 0)).toHaveValue('[[katal/kilogram]/Ampere]*stere');
    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'kat/kg/A.st', null);

    await PWUtils.clickTreeNode(page, 'Integer data type');
    await expect(getUnitsInput(page, 0)).toHaveValue('[[katal/kilogram]/Ampere]*stere');
    await PWUtils.expectValueCoding(page, '__$units', 0, unitSystem, null, 'kat/kg/A.st', null);

    await PWUtils.clickTreeNode(page, 'Quantity data type');
    await expect(page.locator('input[id^="initial.0.valueQuantity.value"]')).toHaveValue('1');
    await expect(page.locator('input[id^="initial.0.valueQuantity.unit"]')).toHaveValue('kilogram');
    await expect(page.locator('input[id^="initial.0.valueQuantity.code"]')).toHaveValue('kg');
    await expect(page.locator('input[id^="initial.0.valueQuantity.system"]')).toHaveValue(unitSystem);

    await expect(getUnitsInput(page, 0)).toHaveValue('kilogram');
    await expect(getUnitsInput(page, 1)).toHaveValue('gram');
    await expect(getUnitsInput(page, 2)).toHaveValue('milligram');

    await PWUtils.expectValueCodings(page, '__$units',
      [
        { system: unitSystem, code: 'kg' },
        { system: unitSystem, code: 'g' },
        { system: unitSystem, code: 'mg' }
      ]
    );
  });

  test('should import decimal/integer units', async ({ page }) => {
    const sampleFile = 'decimal-type-sample.json';
    const fixtureJson = await PWUtils.readJSONFile(sampleFile);

    await PWUtils.uploadFile(page, sampleFile, true);
    await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
    await expect(page.locator('.spinner-border')).not.toBeVisible();
    await PWUtils.expectDataTypeValue(page, /decimal/);
    await expect(page.locator('input[id^="initial.0.valueDecimal"]')).toHaveValue('1.1');

    const unitsInput = getUnitsInput(page, 0);
    await expect(unitsInput).toHaveValue('inch');

    let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(qJson).toEqual(fixtureJson);

    await unitsInput.clear();
    await PWUtils.clickMenuBarButton(page, 'Preview');
    await PWUtils.getButton(page, 'Preview of Questionnaire close', 'Close').click();

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(qJson.item[0].extension[0]).toEqual((fixtureJson as any).item[0].extension[1]);

    await unitsInput.click();
    await unitsInput.pressSequentially('m', { delay: 30 });
    await selectCompletionRow(page, 'meter');
    await expect(unitsInput).toHaveValue('meter');

    await PWUtils.clickMenuBarButton(page, 'Preview');
    await PWUtils.getButton(page, 'Preview of Questionnaire close', 'Close').click();

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(qJson.item[0].extension[0]).toEqual((fixtureJson as any).item[0].extension[1]);
    expect(qJson.item[0].extension[1]).toEqual({
      url: unitUrl,
      valueCoding: {
        system: unitSystem,
        code: 'm',
        display: 'meter'
      }
    });

    await PWUtils.clickTreeNode(page, 'Item with non-ucum units');
    await expect(unitsInput).toHaveValue('X Y');

    await PWUtils.clickMenuBarButton(page, 'Preview');
    await PWUtils.getButton(page, 'Preview of Questionnaire close', 'Close').click();

    qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(qJson.item[1].extension).toEqual([
      {
        url: unitUrl,
        valueCoding: {
          system: 'http://x.y',
          code: 'XY',
          display: 'X Y'
        }
      },
      {
        url: 'http://dummy.org',
        valueInteger: 2
      }
    ]);
  });
});
