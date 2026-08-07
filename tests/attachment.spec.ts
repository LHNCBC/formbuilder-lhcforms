import { test, expect } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

/**
 * End-to-end coverage for the "attachment" item data type:
 *  - selecting the attachment data type,
 *  - the Max size restriction with the KB/MB helper (stored in bytes),
 *  - the Mime type restriction,
 *  - an initial (default) Attachment value (URL / Title / Content type),
 *  - and that the item renders as a file-upload control in the LForms preview.
 */
const MAX_SIZE_URL = 'http://hl7.org/fhir/StructureDefinition/maxSize';
const MIME_TYPE_URL = 'http://hl7.org/fhir/StructureDefinition/mimeType';

test.describe('attachment data type', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    mainPO = new MainPO(page);
    await page.goto('/');
    await mainPO.loadILPage();

    const itemTextField = await PWUtils.getItemTextField(page);
    await expect(itemTextField).toHaveValue('Item 0', { timeout: 10000 });
    await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
  });

  test('should export attachment type with maxSize (entered in MB), mimeType and an initial attachment value', async ({ page }) => {
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.fill('Upload your report');

    // Select the attachment data type.
    await PWUtils.selectDataType(page, 'attachment');
    await PWUtils.expectDataTypeValue(page, /attachment/);
    await PWUtils.assertValueInQuestionnaire(page, '/item/0/type', 'attachment', 'R4');

    // Enable restrictions.
    await page.locator('lfb-restrictions [for^="booleanControlled_Yes"]').click();

    // Row 0: Maximum size = 5 entered in MB (must be stored as bytes).
    await page.locator('[id^="__\$restrictions.0.operator"]').selectOption({ label: 'Maximum size' });
    const sizeValue = page.locator('input[aria-label="Maximum size value"]');
    await expect(sizeValue).toBeVisible();
    await sizeValue.fill('5');
    await page.locator('select[aria-label="Maximum size unit"]').selectOption({ label: 'MB' });

    // Row 1: Mime type = application/pdf.
    await page.getByRole('button', { name: 'Add new restriction' }).click();
    await page.locator('[id^="__\$restrictions.1.operator"]').selectOption({ label: 'Mime type' });
    await page.locator('input[id^="__\$restrictions.1.value"]').fill('application/pdf');

    // 5 MB is stored/exported as bytes in the maxSize extension.
    await PWUtils.assertExtensionsInQuestionnaire(
      page,
      '/item/0/extension',
      MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 5 * 1024 * 1024 }],
      'R4'
    );
    await PWUtils.assertExtensionsInQuestionnaire(
      page,
      '/item/0/extension',
      MIME_TYPE_URL,
      [{ url: MIME_TYPE_URL, valueCode: 'application/pdf' }],
      'R4'
    );

    // Default value: an initial Attachment (URL / Title / Content type).
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');

    const urlField = page.locator('[id^="initial.0.valueAttachment.url"]');
    await expect(urlField).toBeVisible();
    await urlField.fill('http://example.org/report.pdf');
    await page.locator('[id^="initial.0.valueAttachment.title"]').fill('Report');
    await page.locator('[id^="initial.0.valueAttachment.contentType"]').fill('application/pdf');

    await PWUtils.assertValueInQuestionnaire(
      page, '/item/0/initial/0/valueAttachment/url', 'http://example.org/report.pdf', 'R4');
    await PWUtils.assertValueInQuestionnaire(
      page, '/item/0/initial/0/valueAttachment/title', 'Report', 'R4');
    await PWUtils.assertValueInQuestionnaire(
      page, '/item/0/initial/0/valueAttachment/contentType', 'application/pdf', 'R4');
  });

  test('should convert the Max size unit and keep the byte count exact', async ({ page }) => {
    await PWUtils.selectDataType(page, 'attachment');
    await PWUtils.expectDataTypeValue(page, /attachment/);

    await page.locator('lfb-restrictions [for^="booleanControlled_Yes"]').click();
    await expect(page.locator('input[id^="__\$restrictions.0.value"]')).toBeDisabled();
    await page.locator('[id^="__\$restrictions.0.operator"]').selectOption({ label: 'Maximum size' });

    const sizeValue = page.locator('input[aria-label="Maximum size value"]');
    const sizeUnit = page.locator('select[aria-label="Maximum size unit"]');
    await expect(sizeValue).toBeVisible();

    // 2 KB -> 2048 bytes.
    await sizeValue.fill('2');
    await sizeUnit.selectOption({ label: 'KB' });
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 2048 }], 'R4');

    // Switch the unit to MB, keeping the number: 2 MB -> 2097152 bytes.
    await sizeUnit.selectOption({ label: 'MB' });
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 2 * 1024 * 1024 }], 'R4');
  });

  test('should remove attachment restrictions when they are disabled', async ({ page }) => {
    await PWUtils.selectDataType(page, 'attachment');
    await PWUtils.expectDataTypeValue(page, /attachment/);

    await page.locator('lfb-restrictions [for^="booleanControlled_Yes"]').click();
    await page.locator('[id^="__\$restrictions.0.operator"]').selectOption({ label: 'Maximum size' });
    const maxSizeInput = page.locator('input[aria-label="Maximum size value"]');
    const maxSizeUnit = page.locator('select[aria-label="Maximum size unit"]');
    await expect(maxSizeInput).toBeEnabled();
    await expect(maxSizeUnit).toBeEnabled();
    await maxSizeInput.fill('5');

    await page.getByRole('button', { name: 'Add new restriction' }).click();
    await page.locator('[id^="__\$restrictions.1.operator"]').selectOption({ label: 'Mime type' });
    const firstMimeTypeInput = page.locator('input[id^="__\$restrictions.1.value"]');
    await expect(firstMimeTypeInput).toBeEnabled();
    await firstMimeTypeInput.fill('application/pdf');

    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 5 * 1024 }], 'R4');
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MIME_TYPE_URL,
      [{ url: MIME_TYPE_URL, valueCode: 'application/pdf' }], 'R4');

    await page.locator('lfb-restrictions [for^="booleanControlled_No"]').click();

    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL, [], 'R4');
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MIME_TYPE_URL, [], 'R4');
  });

  test('should reject invalid MIME types and normalize a valid value', async ({ page }) => {
    await PWUtils.selectDataType(page, 'attachment');
    await PWUtils.expectDataTypeValue(page, /attachment/);

    await page.locator('lfb-restrictions [for^="booleanControlled_Yes"]').click();
    await page.locator('[id^="__\$restrictions.0.operator"]').selectOption({ label: 'Mime type' });

    const mimeTypeInput = page.locator('input[id^="__\$restrictions.0.value"]');
    await mimeTypeInput.fill('text/xxxx');
    await expect(mimeTypeInput).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a valid IANA-registered MIME type')).toBeVisible();
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MIME_TYPE_URL, [], 'R4');

    await mimeTypeInput.fill('  application/pdf  ');
    await expect(mimeTypeInput).not.toHaveAttribute('aria-invalid', 'true');
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MIME_TYPE_URL,
      [{ url: MIME_TYPE_URL, valueCode: 'application/pdf' }], 'R4');
  });

  test('should allow multiple MIME types for a repeating item while keeping maxSize singular', async ({ page }) => {
    await PWUtils.selectDataType(page, 'attachment');
    await PWUtils.expectDataTypeValue(page, /attachment/);
    await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'Yes');

    await page.locator('lfb-restrictions [for^="booleanControlled_Yes"]').click();

    await page.locator('[id^="__\$restrictions.0.operator"]').selectOption({ label: 'Maximum size' });
    await page.locator('input[aria-label="Maximum size value"]').fill('5');

    await page.getByRole('button', { name: 'Add new restriction' }).click();
    await page.locator('[id^="__\$restrictions.1.operator"]').selectOption({ label: 'Mime type' });
    await page.locator('input[id^="__\$restrictions.1.value"]').fill('application/pdf');

    await page.getByRole('button', { name: 'Add new restriction' }).click();
    await page.locator('[id^="__\$restrictions.2.operator"]').selectOption({ label: 'Mime type' });
    await page.locator('input[id^="__\$restrictions.2.value"]').fill('image/png');

    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 5 * 1024 }], 'R4');
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MIME_TYPE_URL,
      [
        { url: MIME_TYPE_URL, valueCode: 'application/pdf' },
        { url: MIME_TYPE_URL, valueCode: 'image/png' }
      ], 'R4');

    // Even for a repeating item, selecting a second maxSize is rejected.
    await page.getByRole('button', { name: 'Add new restriction' }).click();
    const fourthOperator = page.locator('[id^="__\$restrictions.3.operator"]');
    await fourthOperator.selectOption({ label: 'Mime type' });
    await fourthOperator.selectOption({ label: 'Maximum size' });
    await expect(page.getByText('That restriction is already selected.')).toBeVisible();
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 5 * 1024 }], 'R4');

    // Turning repeats off collapses MIME types back to a single extension.
    await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'No');
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MIME_TYPE_URL,
      [{ url: MIME_TYPE_URL, valueCode: 'application/pdf' }], 'R4');
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 5 * 1024 }], 'R4');
  });

  test('should import an attachment questionnaire and round-trip the stored maxSize into the KB/MB helper', async ({ page }) => {
    // Import a questionnaire whose attachment item stores maxSize as a byte count (5 MB = 5242880 bytes),
    // a mimeType restriction, and an initial Attachment value.
    await PWUtils.uploadFile(page, 'attachment-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Upload your report');

    // The data type round-trips to attachment.
    await PWUtils.expectDataTypeValue(page, /attachment/);

    // Max size: 5242880 bytes must display as "5" with unit "MB" (the largest exact unit),
    // not the raw byte count. This exercises the byte -> friendly-unit conversion on load.
    const sizeValue = page.locator('input[aria-label="Maximum size value"]');
    await expect(sizeValue).toBeVisible();
    await expect(sizeValue).toHaveValue('5');
    // [ngValue] encodes the <select> value internally, so assert the selected option's label.
    await expect(page.locator('select[aria-label="Maximum size unit"] option:checked')).toHaveText('MB');

    // The mime type restriction round-trips as free text. For an attachment item the only
    // text-type restriction value input is the mimeType one (maxSize uses number + unit select),
    // so this locator is independent of the restriction row order.
    await expect(page.locator('lfb-restrictions input[type="text"]')).toHaveValue('application/pdf');

    // The initial Attachment value round-trips (URL / Title / Content type).
    await expect(page.locator('[id^="initial.0.valueAttachment.url"]')).toHaveValue('http://example.org/report.pdf');
    await expect(page.locator('[id^="initial.0.valueAttachment.title"]')).toHaveValue('Report');
    await expect(page.locator('[id^="initial.0.valueAttachment.contentType"]')).toHaveValue('application/pdf');

    // Re-exporting keeps the exact byte count, confirming the round-trip is lossless.
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 5 * 1024 * 1024 }], 'R4');
  });

  test('should normalize imported attachment restriction cardinalities', async ({ page }) => {
    await PWUtils.uploadFile(page, 'attachment-restrictions-repeat-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Upload repeated files');

    await PWUtils.expectDataTypeValue(page, /attachment/);

    const mimeTypeInputs = page.locator('lfb-restrictions input[type="text"]');
    await expect(mimeTypeInputs).toHaveCount(2);
    await expect(mimeTypeInputs.nth(0)).toHaveValue('application/pdf');
    await expect(mimeTypeInputs.nth(1)).toHaveValue('image/png');

    // maxSize remains singular while both MIME type extensions are preserved.
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 5 * 1024 * 1024 }], 'R4');
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MIME_TYPE_URL,
      [
        { url: MIME_TYPE_URL, valueCode: 'application/pdf' },
        { url: MIME_TYPE_URL, valueCode: 'image/png' }
      ], 'R4');
  });

  test('should render an attachment item as a file-upload control in the preview', async ({ page }) => {
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.fill('Upload your report');

    await PWUtils.selectDataType(page, 'attachment');
    await PWUtils.expectDataTypeValue(page, /attachment/);

    // Open the preview dialog and switch to the rendered LForms widget.
    await PWUtils.clickMenuBarButton(page, 'Preview');
    await page.getByRole('tab', { name: 'View Rendered Form' }).click();

    const form = page.locator('wc-lhc-form');
    await expect(form).toBeVisible({ timeout: 15000 });

    // LForms accepts the attachment item and renders it as a file-upload control.
    await expect(form.getByText('Upload your report').first()).toBeVisible();
    await expect(form.locator('input[type="file"]').first()).toBeVisible();

    await PWUtils.clickDialogButton(page, { selector: 'lfb-preview-dlg' }, 'Close');
  });
});
