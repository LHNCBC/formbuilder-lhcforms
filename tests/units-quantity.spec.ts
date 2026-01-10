import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';

test.describe('units and quantity units', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();
  });

  test('should autocomplete units that start with \'/\'', async ({ page }) => {
    // Select Data type 'quantity'
    await page.getByLabel('Data type', { exact: true }).selectOption({ label: 'quantity' });
    await page.locator('div[role="group"]')
              .getByText('Type initial value', { exact: true })
              .click();

    // Insert initial quantity value.
    const valueInput = page.locator('input[id^="initial.0.valueQuantity.value"]');
    await valueInput.fill('4');
    await expect(valueInput).toHaveValue('4');

    // 1. Type (not fill) so autocomplete logic runs
    const qtyUnitInput = page.locator('input[id^="initial.0.valueQuantity.unit"]');

    await qtyUnitInput.click();
    await qtyUnitInput.pressSequentially('breaths', { delay: 50 });

    // 2. Wait for dropdown / completion options to appear
    const qtyCompletionRow = page.locator('#completionOptions table > tbody > tr');
    await expect(qtyCompletionRow).toHaveCount(1);

    // 3. Select first option
    await qtyUnitInput.press('ArrowDown');
    await qtyUnitInput.press('Enter');

    // 4. (Optional) Verify the input value updated
    const qtyRow = page
      .locator('lfb-label', { hasText: 'Initial value' })
      .locator('xpath=ancestor::div[contains(@class,"row")]')
      .locator('table > tbody > tr');

    await expect(qtyRow).toHaveCount(1);

    const qtyInputs = qtyRow.locator('td input');
    await expect(qtyInputs).toHaveCount(4);
    await expect(qtyInputs.nth(0)).toHaveValue('4');
    await expect(qtyInputs.nth(1)).toHaveValue('per minute');
    await expect(qtyInputs.nth(2)).toHaveValue('/min');
    await expect(qtyInputs.nth(3)).toHaveValue('http://unitsofmeasure.org');



    // Perform search on the 'Units'
    const unitsInput = page.locator('input[id^="units"]');

    // 1. Type (not fill) so autocomplete logic runs
    await unitsInput.click();
    await unitsInput.pressSequentially('breaths', { delay: 50 });

    // 2. Wait for dropdown / completion options to appear
    const completionRow = page.locator('#completionOptions table > tbody > tr');
    await expect(completionRow).toHaveCount(1);

    // 3. Select first option
    await unitsInput.press('ArrowDown');
    await unitsInput.press('Enter');

    // 4. (Optional) Verify the input value updated
    //await expect(unitsInput).toHaveValue(/breaths/i);
    const row = page.locator('lfb-units table > tbody > tr');

    await expect(row).toHaveCount(1);

    const inputs = row.locator('td input');
    await expect(inputs).toHaveCount(3);

    await expect(inputs.nth(0)).toHaveValue('per minute');
    await expect(inputs.nth(1)).toHaveValue('/min');
    await expect(inputs.nth(2)).toHaveValue('http://unitsofmeasure.org');

  });
});