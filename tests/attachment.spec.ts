import { test, expect, Locator } from '@playwright/test';
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

/**
 * Upload a file without a browser-provided MIME type.
 * @param fileInput - The attachment dialog's file input.
 * @param name - The filename reported by the browser.
 * @param content - The file's text content.
 * @returns Resolves once the file selection event has been dispatched.
 */
async function uploadUntypedFile(fileInput: Locator, name: string, content: string): Promise<void> {
  await fileInput.evaluate((input: HTMLInputElement, file) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([file.content], file.name));
    Object.defineProperty(input, 'files', {value: dataTransfer.files, configurable: true});
    input.dispatchEvent(new Event('change', {bubbles: true}));
    // Restore the native property so subsequent file selections work normally.
    Reflect.deleteProperty(input, 'files');
  }, {name, content});
}

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

    // Default value: add an Attachment through the dialog.
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');
    const emptyInitialTable = page.locator('lfb-table').filter({hasText: 'Initial value'});
    const emptyInitialHeaders = emptyInitialTable.locator('thead th');
    await expect(emptyInitialHeaders).toHaveCount(4);
    await expect(emptyInitialHeaders.nth(0)).toContainText('Title');
    await expect(emptyInitialHeaders.nth(1)).toContainText('Mime Type');
    await expect(emptyInitialHeaders.nth(2)).toContainText('Size');
    await expect(emptyInitialHeaders.nth(3)).toContainText('Value');
    await page.getByRole('button', {name: 'Add another value'}).click();
    const attachmentDialog = page.locator('lfb-attachment-dlg');
    await expect(attachmentDialog).toBeVisible();
    await expect(attachmentDialog.getByRole('radiogroup', {name: 'Input Method'})).toBeVisible();
    await expect(attachmentDialog.getByRole('radio')).toHaveCount(2);
    await expect(attachmentDialog.getByRole('radio', {name: 'File upload'})).toBeChecked();
    await attachmentDialog.getByRole('radio', {name: 'URL'}).check();
    await expect(attachmentDialog.getByText('Value attachment', {exact: true})).toHaveCount(0);
    await expect(attachmentDialog.getByText('The actual value to for an initial answer.', {exact: true}))
      .toHaveCount(0);
    await expect(attachmentDialog.getByRole('textbox', {name: 'Data', exact: true})).toHaveCount(0);
    await expect(attachmentDialog.getByRole('button', {name: 'Upload local file'})).toHaveCount(0);
    const urlInput = attachmentDialog.getByRole('textbox', {name: 'URL'});
    const titleInput = attachmentDialog.getByRole('textbox', {name: /^Title/});
    const metadataLabels = attachmentDialog.locator('.attachment-metadata-form lfb-label label');
    await expect(metadataLabels.nth(0)).toContainText('URL');
    await expect(metadataLabels.nth(1)).toContainText('Title');
    await urlInput.fill('http://example.org/report.pdf');
    await titleInput.fill('Report');
    const mimeTypeInput = attachmentDialog.getByRole('combobox', {name: /^Mime Type/});
    await mimeTypeInput.fill('application/pdf');
    await mimeTypeInput.press('Escape');
    await attachmentDialog.getByRole('textbox', {name: /^Size/}).fill('9007199254740993');
    await attachmentDialog.getByRole('spinbutton', {name: /^Height/}).fill('1080');
    await attachmentDialog.getByRole('spinbutton', {name: /^Width/}).fill('1920');
    await attachmentDialog.getByRole('spinbutton', {name: /^Frames/}).fill('24');
    await attachmentDialog.getByRole('spinbutton', {name: /^Duration/}).fill('1.5');
    await attachmentDialog.getByRole('spinbutton', {name: /^Pages/}).fill('2');
    await expect(attachmentDialog.getByLabel(/Tooltip for Title:/)).toBeVisible();
    await expect(attachmentDialog.getByLabel(/Tooltip for Mime Type:/)).toBeVisible();
    await expect(attachmentDialog.getByLabel(/Tooltip for Height:/)).toBeVisible();
    await expect(attachmentDialog.locator('lfb-datetime')).toBeVisible();
    await expect(attachmentDialog.getByRole('button', {name: 'Date time picker for Creation'})).toBeVisible();
    await expect(attachmentDialog.locator('lfb-datetime label')).toHaveCSS('padding-bottom', '0px');
    const titleWidget = titleInput.locator('xpath=ancestor::lfb-string');
    await expect(titleWidget.locator('label'))
      .toHaveCSS('padding-bottom', '0px');
    const titleBounds = await titleInput.boundingBox();
    const titleRowBounds = await titleWidget.locator(':scope > div').boundingBox();
    expect(titleBounds!.x + titleBounds!.width)
      .toBeCloseTo(titleRowBounds!.x + titleRowBounds!.width, 0);
    const creationBounds = await attachmentDialog.locator('lfb-datetime input.form-control').boundingBox();
    expect(creationBounds?.x).toBeCloseTo(titleBounds?.x || 0, 0);
    const languageInput = attachmentDialog.getByRole('combobox', {name: /^Language/});
    const languageRow = languageInput.locator('xpath=ancestor::sf-form-element[1]/parent::div');
    const titleRow = titleInput.locator('xpath=ancestor::sf-form-element[1]/parent::div');
    await expect(languageRow).toHaveCSS('border-bottom-width', '1px');
    await languageRow.hover();
    await expect(languageRow).toHaveCSS('background-color', 'rgb(250, 250, 210)');
    await expect(titleRow).not.toHaveCSS('background-color', 'rgb(250, 250, 210)');
    await languageInput.click();
    const languageSuggestion = attachmentDialog.getByRole(
      'option', {name: 'English (United States) — en-US', exact: true}
    );
    await expect(languageSuggestion).toHaveText('English (United States) — en-US');
    await languageSuggestion.click();
    await expect(languageInput).toHaveValue('en-US');
    await languageInput.fill('en_US');
    await expect(attachmentDialog.getByText('Enter a valid BCP-47 language tag, such as en, en-US, or zh-Hant-TW.'))
      .toBeVisible();
    await languageInput.fill('zh-Hant-TW');
    await expect(attachmentDialog.getByText('Enter a valid BCP-47 language tag, such as en, en-US, or zh-Hant-TW.'))
      .toHaveCount(0);
    await languageInput.fill('zh-cmn-Hans');
    await expect(attachmentDialog.getByText('Enter a valid BCP-47 language tag, such as en, en-US, or zh-Hant-TW.'))
      .toHaveCount(0);
    const saveAttachment = attachmentDialog.getByRole('button', {name: 'Save and close'});
    await expect(saveAttachment).toBeEnabled();
    await saveAttachment.click();
    await expect(attachmentDialog).not.toBeVisible();

    const initialRow = page.locator('lfb-table').filter({hasText: 'Initial value'}).locator('tbody tr').first();
    const initialTable = page.locator('lfb-table').filter({hasText: 'Initial value'});
    const initialHeaders = initialTable.locator('thead th');
    await expect(initialHeaders.nth(0)).toContainText('Title');
    await expect(initialHeaders.nth(1)).toContainText('Mime Type');
    await expect(initialHeaders.nth(2)).toContainText('Size');
    await expect(initialHeaders.nth(3)).toContainText('Value');
    await expect(initialRow.locator('td').nth(0).locator('input')).toHaveValue('Report');
    await expect(initialRow.locator('td').nth(1).locator('input')).toHaveValue('application/pdf');
    const valueInput = initialRow.locator('td').nth(3).locator('input');
    expect(JSON.parse(await valueInput.inputValue())).toEqual({
      url: 'http://example.org/report.pdf',
      title: 'Report',
      contentType: 'application/pdf',
      language: 'zh-cmn-Hans',
      size: '9007199254740993',
      height: 1080,
      width: 1920,
      frames: 24,
      duration: 1.5,
      pages: 2
    });
    await expect(initialRow.locator('input').first()).toHaveAttribute('readonly', /^(|true)$/);

    const r5Questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(r5Questionnaire.item[0].initial[0].valueAttachment).toEqual({
      contentType: 'application/pdf',
      language: 'zh-cmn-Hans',
      url: 'http://example.org/report.pdf',
      size: '9007199254740993',
      title: 'Report',
      height: 1080,
      width: 1920,
      frames: 24,
      duration: 1.5,
      pages: 2
    });

    await PWUtils.assertValueInQuestionnaire(
      page, '/item/0/initial/0/valueAttachment/url', 'http://example.org/report.pdf', 'R4');
    await PWUtils.assertValueInQuestionnaire(
      page, '/item/0/initial/0/valueAttachment/title', 'Report', 'R4');
    await PWUtils.assertValueInQuestionnaire(
      page, '/item/0/initial/0/valueAttachment/contentType', 'application/pdf', 'R4');
    await PWUtils.assertValueInQuestionnaire(
      page, '/item/0/initial/0/valueAttachment/language', 'zh-cmn-Hans', 'R4');
    const r4Questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(r4Questionnaire.item[0].initial[0].valueAttachment.size).toBeUndefined();
    expect(r4Questionnaire.item[0].initial[0].valueAttachment.height).toBeUndefined();
  });

  test('should populate attachment data from files and preserve independent file and URL drafts', async ({ page }) => {
    await PWUtils.selectDataType(page, 'attachment');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');
    await page.getByRole('button', {name: 'Add another value'}).click();

    const attachmentDialog = page.locator('lfb-attachment-dlg');
    await expect(attachmentDialog.getByRole('radio', {name: 'File upload'})).toBeChecked();
    await expect(attachmentDialog.getByRole('textbox', {name: 'URL'})).toHaveCount(0);
    await expect(attachmentDialog.getByRole('textbox', {name: 'Data', exact: true})).toHaveCount(0);
    const sizeInput = attachmentDialog.getByRole('textbox', {name: /^Size/});
    await expect(sizeInput).toBeVisible();
    await expect(sizeInput).toBeEditable();
    await expect(sizeInput).toHaveValue('');
    await expect(attachmentDialog.getByLabel('Hash', {exact: true})).toHaveCount(0);
    await expect(attachmentDialog.locator('.row.mb-2')).toHaveCount(0);
    const fileInput = attachmentDialog.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello')
    });

    await expect(attachmentDialog.getByRole('textbox', {name: /^Title/})).toHaveValue('hello.txt');
    await expect(attachmentDialog.getByRole('combobox', {name: /^Mime Type/})).toHaveValue('text/plain');
    await expect(sizeInput).toHaveValue('5');
    await expect(sizeInput).not.toBeEditable();
    await expect(sizeInput).toHaveCSS('background-color', 'rgb(233, 236, 239)');

    const saveAttachment = attachmentDialog.getByRole('button', {name: 'Save and close'});
    await expect(saveAttachment).toBeEnabled();
    await saveAttachment.click();
    await expect(attachmentDialog).not.toBeVisible();
    let questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(questionnaire.item[0].initial[0].valueAttachment).toEqual({
      contentType: 'text/plain',
      data: 'SGVsbG8=',
      hash: '9/+ei3uy4Jtwk1pdeF4MxdnQq/A=',
      size: 5,
      title: 'hello.txt'
    });

    const initialRow = page.locator('lfb-table').filter({hasText: 'Initial value'}).locator('tbody tr').first();
    const jsonValue = initialRow.locator('td').nth(3).locator('input');
    expect(JSON.parse(await jsonValue.inputValue())).toEqual({
      contentType: 'text/plain',
      data: 'SGVsbG8=',
      hash: '9/+ei3uy4Jtwk1pdeF4MxdnQq/A=',
      size: '5',
      title: 'hello.txt'
    });
    await initialRow.getByLabel('Edit this row').click();

    await expect(attachmentDialog.getByRole('radio', {name: 'File upload'})).toBeChecked();
    await expect(attachmentDialog.getByRole('textbox', {name: 'URL'})).toHaveCount(0);
    const uploadButton = attachmentDialog.getByRole('button', {name: 'Upload local file'});
    await expect(uploadButton).toBeVisible();
    await expect(uploadButton.locator('xpath=ancestor::div[contains(@class, "attachment-field-row")]'))
      .toHaveCSS('border-bottom-width', '1px');
    await expect(sizeInput).toHaveValue('5');
    await expect(sizeInput).not.toBeEditable();

    // Each input method keeps an independent draft while the user switches between them.
    await attachmentDialog.getByRole('radio', {name: 'URL'}).check();
    await attachmentDialog.getByRole('textbox', {name: 'URL'}).fill('https://example.org/remote.pdf');
    await attachmentDialog.getByRole('textbox', {name: /^Title/}).fill('remote.pdf');
    await attachmentDialog.getByRole('combobox', {name: /^Mime Type/}).fill('application/pdf');
    await expect(sizeInput).toBeEditable();
    await sizeInput.fill('12');
    await sizeInput.press('Tab');

    await attachmentDialog.getByRole('radio', {name: 'File upload'}).check();
    await expect(attachmentDialog.getByRole('textbox', {name: /^Title/})).toHaveValue('hello.txt');
    await expect(attachmentDialog.getByRole('combobox', {name: /^Mime Type/})).toHaveValue('text/plain');
    await expect(sizeInput).toHaveValue('5');
    await expect(sizeInput).not.toBeEditable();

    await fileInput.setInputFiles({
      name: 'replacement.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF')
    });
    await expect(attachmentDialog.getByRole('textbox', {name: /^Title/})).toHaveValue('replacement.pdf');
    await expect(attachmentDialog.getByRole('combobox', {name: /^Mime Type/})).toHaveValue('application/pdf');
    await expect(sizeInput).toHaveValue('4');
    await expect(sizeInput).not.toBeEditable();

    await attachmentDialog.getByRole('radio', {name: 'URL'}).check();
    await expect(attachmentDialog.getByRole('textbox', {name: 'URL'}))
      .toHaveValue('https://example.org/remote.pdf');
    await expect(attachmentDialog.getByRole('textbox', {name: /^Title/})).toHaveValue('remote.pdf');
    await expect(sizeInput).toHaveValue('12');
    await expect(sizeInput).toBeEditable();

    // Saving the file draft does not include the independent URL draft.
    await attachmentDialog.getByRole('radio', {name: 'File upload'}).check();
    await expect(sizeInput).toHaveValue('4');
    await expect(sizeInput).not.toBeEditable();
    await attachmentDialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(attachmentDialog).not.toBeVisible();
    expect(JSON.parse(await jsonValue.inputValue())).toEqual({
      contentType: 'application/pdf',
      data: 'JVBERg==',
      hash: 'ObbXPv82STugZ05IJVqdgXJLRSE=',
      size: '4',
      title: 'replacement.pdf'
    });

    questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(questionnaire.item[0].initial[0].valueAttachment).toEqual({
      contentType: 'application/pdf',
      data: 'JVBERg==',
      hash: 'ObbXPv82STugZ05IJVqdgXJLRSE=',
      size: 4,
      title: 'replacement.pdf'
    });
  });

  test('should require a MIME type for files without a browser-provided type', async ({ page }) => {
    await PWUtils.selectDataType(page, 'attachment');
    await PWUtils.clickRadioButton(page, 'Value method', 'Type initial value');
    await page.getByRole('button', {name: 'Add another value'}).click();

    const attachmentDialog = page.locator('lfb-attachment-dlg');
    const saveAttachment = attachmentDialog.getByRole('button', {name: 'Save and close'});
    const fileInput = attachmentDialog.locator('input[type="file"]');
    const sizeInput = attachmentDialog.getByRole('textbox', {name: /^Size/});
    await uploadUntypedFile(fileInput, 'unknown-content', 'Hello');
    await expect(sizeInput).toHaveValue('5');
    await expect(sizeInput).not.toBeEditable();
    await expect(saveAttachment).toBeDisabled();

    await attachmentDialog.getByRole('button', {name: 'Clear all fields'}).click();
    await expect(sizeInput).toHaveValue('');
    await expect(sizeInput).toBeEditable();
    await expect(sizeInput).not.toHaveCSS('background-color', 'rgb(233, 236, 239)');
    await uploadUntypedFile(fileInput, 'unknown-content', 'Hello');
    await expect(sizeInput).toHaveValue('5');
    await expect(sizeInput).not.toBeEditable();

    const mimeTypeInput = attachmentDialog.getByRole('combobox', {name: /^Mime Type/});
    await mimeTypeInput.fill('text/plain');
    await mimeTypeInput.press('Escape');
    await expect(saveAttachment).toBeEnabled();
    await mimeTypeInput.fill('');
    await expect(saveAttachment).toBeDisabled();

    await fileInput.setInputFiles({
      name: 'known.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Known')
    });
    await expect(mimeTypeInput).toHaveValue('text/plain');
    const languageInput = attachmentDialog.getByRole('combobox', {name: /^Language/});
    const heightInput = attachmentDialog.getByRole('spinbutton', {name: /^Height/});
    await languageInput.fill('en');
    await languageInput.press('Escape');
    await heightInput.fill('480');
    await heightInput.press('Tab');

    // Replacing the file with content whose type is unknown must not inherit
    // any content-derived metadata from the previous file.
    await uploadUntypedFile(fileInput, 'unknown-content', 'Hello');
    await expect(attachmentDialog.getByRole('textbox', {name: /^Title/})).toHaveValue('unknown-content');
    await expect(mimeTypeInput).toHaveValue('');
    await expect(languageInput).toHaveValue('');
    await expect(heightInput).toHaveValue('');
    await expect(sizeInput).toHaveValue('5');
    await expect(sizeInput).not.toBeEditable();
    await expect(saveAttachment).toBeDisabled();

    await mimeTypeInput.fill('application/octet-stream');
    await mimeTypeInput.press('Escape');
    await attachmentDialog.getByRole('textbox', {name: /^Title/}).click();
    await expect(mimeTypeInput).toHaveValue('application/octet-stream');
    await expect(saveAttachment).toBeEnabled();
    await saveAttachment.click();
    await expect(attachmentDialog).not.toBeVisible();
    await expect(page.locator('lfb-table').filter({hasText: 'Initial value'}).locator('tbody tr')).toHaveCount(1);

    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(questionnaire.item[0].initial[0].valueAttachment).toEqual({
      contentType: 'application/octet-stream',
      data: 'SGVsbG8=',
      hash: '9/+ei3uy4Jtwk1pdeF4MxdnQq/A=',
      size: '5',
      title: 'unknown-content'
    });
  });

  test('should preserve valid URL and hash fields when editing imported attachments', async ({ page }) => {
    await PWUtils.uploadFile(page, 'attachment-preservation-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Attachments with retained metadata');

    const initialTable = page.locator('lfb-table').filter({hasText: 'Initial value'});
    await expect(initialTable.locator('tbody tr')).toHaveCount(2);

    await initialTable.locator('tbody tr').nth(0).getByLabel('Edit this row').click();
    let attachmentDialog = page.locator('lfb-attachment-dlg');
    await expect(attachmentDialog.getByRole('radio', {name: 'File upload'})).toBeChecked();
    await expect(attachmentDialog.getByRole('textbox', {name: /^Size/})).toHaveValue('5');
    await expect(attachmentDialog.getByRole('textbox', {name: /^Size/})).not.toBeEditable();
    const embeddedTitle = attachmentDialog.getByRole('textbox', {name: /^Title/});
    await embeddedTitle.fill('Embedded and remote (edited)');
    await embeddedTitle.press('Tab');
    const saveEmbeddedAttachment = attachmentDialog.getByRole('button', {name: 'Save and close'});
    await expect(saveEmbeddedAttachment).toBeEnabled();
    await saveEmbeddedAttachment.click();
    await expect(attachmentDialog).not.toBeVisible();

    await initialTable.locator('tbody tr').nth(1).getByLabel('Edit this row').click();
    attachmentDialog = page.locator('lfb-attachment-dlg');
    await expect(attachmentDialog.getByRole('radio', {name: 'URL'})).toBeChecked();
    const remoteSize = attachmentDialog.getByRole('textbox', {name: /^Size/});
    await expect(remoteSize).toHaveValue('');
    await expect(remoteSize).toBeEditable();
    await remoteSize.fill('4');
    await remoteSize.press('Tab');
    const remoteTitle = attachmentDialog.getByRole('textbox', {name: /^Title/});
    await remoteTitle.fill('Remote only (edited)');
    await remoteTitle.press('Tab');
    const saveRemoteAttachment = attachmentDialog.getByRole('button', {name: 'Save and close'});
    await expect(saveRemoteAttachment).toBeEnabled();
    await saveRemoteAttachment.click();
    await expect(attachmentDialog).not.toBeVisible();

    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R4');
    expect(questionnaire.item[0].initial.map(({valueAttachment}) => valueAttachment)).toEqual([
      {
        contentType: 'text/plain',
        data: 'SGVsbG8=',
        url: 'https://example.org/hello.txt',
        size: 5,
        hash: '9/+ei3uy4Jtwk1pdeF4MxdnQq/A=',
        title: 'Embedded and remote (edited)'
      },
      {
        contentType: 'application/pdf',
        url: 'https://example.org/remote.pdf',
        size: 4,
        hash: 'ObbXPv82STugZ05IJVqdgXJLRSE=',
        title: 'Remote only (edited)'
      }
    ]);
  });

  test('should preserve initial-row metadata and language tags without restoring cleared Attachment fields', async ({ page }) => {
    const initialRow = {
      id: 'initial-note',
      extension: [{
        url: 'https://example.org/initial-note',
        valueString: 'Preserve this annotation'
      }],
      modifierExtension: [{
        url: 'https://example.org/initial-modifier',
        valueBoolean: true
      }],
      valueAttachment: {
        contentType: 'application/pdf',
        url: 'https://example.org/report.pdf',
        hash: 'ObbXPv82STugZ05IJVqdgXJLRSE=',
        title: 'Original attachment',
        language: 'zh-cmn-Hans',
        _size: {
          id: 'size-note',
          extension: [{
            url: 'http://hl7.org/fhir/StructureDefinition/data-absent-reason',
            valueCode: 'unknown'
          }]
        }
      }
    };
    const questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      item: [{
        linkId: 'attachment-metadata',
        text: 'Attachment metadata',
        type: 'attachment',
        initial: [initialRow]
      }]
    };
    const fileChooserPromise = page.waitForEvent('filechooser');
    await PWUtils.clickMenuBarDropdownItem(page, 'Import', 'Import from file...');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'attachment-metadata.json',
      mimeType: 'application/fhir+json',
      buffer: Buffer.from(JSON.stringify(questionnaire))
    });
    await expect(page.getByRole('dialog', {name: 'Replace existing form?'})).toBeVisible();
    await page.getByRole('button', {name: 'Continue', exact: true}).click();
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Attachment metadata');

    for(const version of ['R5', 'R4']) {
      const imported = await PWUtils.getQuestionnaireJSONWithoutUI(page, version);
      expect(imported.item[0].initial[0]).toEqual(initialRow);
    }

    const row = page.locator('lfb-table').filter({hasText: 'Initial value'}).locator('tbody tr').first();
    await row.getByLabel('Edit this row').click();
    const attachmentDialog = page.locator('lfb-attachment-dlg');
    await expect(attachmentDialog.getByRole('combobox', {name: /^Language/})).toHaveValue('zh-cmn-Hans');
    const titleInput = attachmentDialog.getByRole('textbox', {name: /^Title/});
    await titleInput.fill('Edited attachment');
    await titleInput.press('Tab');
    const saveAttachment = attachmentDialog.getByRole('button', {name: 'Save and close'});
    await expect(saveAttachment).toBeEnabled();
    await saveAttachment.click();
    await expect(attachmentDialog).not.toBeVisible();

    for(const version of ['R5', 'R4']) {
      const edited = await PWUtils.getQuestionnaireJSONWithoutUI(page, version);
      expect(edited.item[0].initial[0]).toEqual({
        ...initialRow,
        valueAttachment: {...initialRow.valueAttachment, title: 'Edited attachment'}
      });
    }

    await row.getByLabel('Edit this row').click();
    await attachmentDialog.getByRole('button', {name: 'Clear all fields'}).click();
    await attachmentDialog.getByRole('textbox', {name: 'URL'}).fill('https://example.org/replacement.pdf');
    await expect(saveAttachment).toBeEnabled();
    await saveAttachment.click();
    await expect(attachmentDialog).not.toBeVisible();

    for(const version of ['R5', 'R4']) {
      const cleared = await PWUtils.getQuestionnaireJSONWithoutUI(page, version);
      expect(cleared.item[0].initial[0]).toEqual({
        ...initialRow,
        valueAttachment: {url: 'https://example.org/replacement.pdf'}
      });
    }
  });

  for(const {label, embedded, remote} of [
    {label: 'URL', embedded: false, remote: true},
    {label: 'embedded', embedded: true, remote: true},
    {label: 'embedded without URL', embedded: true, remote: false}
  ]) {
    test(`should preserve Attachment primitive metadata through ${label} editing and export`, async ({ page }) => {
      const primitiveMetadata = Object.fromEntries([
        'contentType', 'language', 'data', 'url', 'size', 'hash', 'title', 'creation',
        'height', 'width', 'frames', 'duration', 'pages'
      ].map((field) => [`_${field}`, {
        id: `${field}-note`,
        extension: [{
          url: 'https://example.org/StructureDefinition/primitive-note',
          valueString: `Preserve ${field}`
        }]
      }]));
      const attachment = {
        ...primitiveMetadata,
        contentType: 'text/plain',
        ...(remote ? {url: 'https://example.org/hello.txt'} : {}),
        title: 'Primitive metadata',
        language: 'en',
        height: 480,
        pages: 2,
        ...(embedded ? {
          data: 'SGVsbG8=',
          size: '5',
          hash: '9/+ei3uy4Jtwk1pdeF4MxdnQq/A='
        } : {})
      };
      const questionnaire = {
        resourceType: 'Questionnaire',
        status: 'draft',
        item: [{
          linkId: 'primitive-metadata',
          text: 'Attachment primitive metadata',
          type: 'attachment',
          initial: [{valueAttachment: attachment}]
        }]
      };

      /**
       * Check the complete exported Attachment, including metadata without scalar values.
       * @param expectedAttachment - Expected R5 Attachment before release-specific conversion.
       */
      async function expectExportedAttachment(expectedAttachment: Record<string, unknown>): Promise<void> {
        for(const version of ['R5', 'R4', 'STU3']) {
          const exported = await PWUtils.getQuestionnaireJSONWithoutUI(page, version);
          const expected = {...expectedAttachment};
          if(version !== 'R5') {
            if(expected.size !== undefined) {
              expected.size = Number(expected.size);
            }
            for(const field of ['height', 'width', 'frames', 'duration', 'pages']) {
              delete expected[field];
              delete expected[`_${field}`];
            }
          }
          const actual = version === 'STU3'
            ? exported.item[0].initialAttachment
            : exported.item[0].initial[0].valueAttachment;
          expect(actual, version).toEqual(expected);
        }
      }

      const chooserPromise = page.waitForEvent('filechooser');
      await PWUtils.clickMenuBarDropdownItem(page, 'Import', 'Import from file...');
      const chooser = await chooserPromise;
      await chooser.setFiles({
        name: 'attachment-primitive-metadata.json',
        mimeType: 'application/fhir+json',
        buffer: Buffer.from(JSON.stringify(questionnaire))
      });
      await expect(page.getByRole('dialog', {name: 'Replace existing form?'})).toBeVisible();
      await page.getByRole('button', {name: 'Continue', exact: true}).click();
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
      await PWUtils.clickTreeNode(page, 'Attachment primitive metadata');
      await expectExportedAttachment(attachment);

      const row = page.locator('lfb-table').filter({hasText: 'Initial value'}).locator('tbody tr').first();
      const dialog = page.locator('lfb-attachment-dlg');
      await row.getByLabel('Edit this row').click();
      await expect(dialog.getByRole('radio')).toHaveCount(2);
      await expect(dialog.getByRole('radio', {name: embedded ? 'File upload' : 'URL', exact: true}))
        .toBeChecked();
      const title = dialog.getByRole('textbox', {name: /^Title/});
      await title.fill('Discard this title');
      await title.press('Tab');
      await dialog.getByRole('button', {name: 'Discard changes', exact: true}).click();
      await page.getByRole('button', {name: 'Discard changes', exact: true}).last().click();
      await expect(dialog).not.toBeVisible();
      await expectExportedAttachment(attachment);

      await row.getByLabel('Edit this row').click();
      await title.fill('Edited title');
      await title.press('Tab');
      const save = dialog.getByRole('button', {name: 'Save and close'});
      await expect(save).toBeEnabled();
      await save.click();
      await expect(dialog).not.toBeVisible();
      const edited = {...attachment, title: 'Edited title'};
      await expectExportedAttachment(edited);

      if(embedded) {
        await row.getByLabel('Edit this row').click();
        await dialog.getByRole('radio', {name: 'URL', exact: true}).check();
        await expect(dialog.getByRole('combobox', {name: /^Mime Type/})).toHaveValue('');
        await dialog.getByRole('radio', {name: 'File upload', exact: true}).check();
        await expect(dialog.getByRole('combobox', {name: /^Mime Type/})).toHaveValue('text/plain');
        await expect(save).toBeEnabled();
        await save.click();
        await expect(dialog).not.toBeVisible();
        await expectExportedAttachment(edited);
      }

      await row.getByLabel('Edit this row').click();
      await dialog.getByRole('button', {name: 'Clear all fields'}).click();
      await dialog.getByRole('radio', {name: 'URL', exact: true}).check();
      await dialog.getByRole('textbox', {name: 'URL'}).fill('https://example.org/replacement');
      await expect(save).toBeEnabled();
      await save.click();
      await expect(dialog).not.toBeVisible();
      await expectExportedAttachment({url: 'https://example.org/replacement'});
    });
  }

  test('should preserve URL metadata when URLs change and embedded metadata when switching methods', async ({ page }) => {
    await PWUtils.uploadFile(page, 'attachment-revert-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Attachments with revertable metadata');

    const initialTable = page.locator('lfb-table').filter({hasText: 'Initial value'});
    const attachmentDialog = page.locator('lfb-attachment-dlg');

    await initialTable.locator('tbody tr').nth(1).getByLabel('Edit this row').click();
    const urlInput = attachmentDialog.getByRole('textbox', {name: 'URL'});
    const mimeTypeInput = attachmentDialog.getByRole('combobox', {name: /^Mime Type/});
    const sizeInput = attachmentDialog.getByRole('textbox', {name: /^Size/});
    const languageInput = attachmentDialog.getByRole('combobox', {name: /^Language/});
    const heightInput = attachmentDialog.getByRole('spinbutton', {name: /^Height/});
    const pagesInput = attachmentDialog.getByRole('spinbutton', {name: /^Pages/});

    await urlInput.fill('https://example.org/replacement.pdf');
    await expect(mimeTypeInput).toHaveValue('application/pdf');
    await expect(sizeInput).toHaveValue('4');
    await expect(languageInput).toHaveValue('en');
    await expect(heightInput).toHaveValue('720');
    await expect(pagesInput).toHaveValue('2');

    await urlInput.fill('https://example.org/remote.pdf');
    await expect(mimeTypeInput).toHaveValue('application/pdf');
    await expect(sizeInput).toHaveValue('4');
    await expect(languageInput).toHaveValue('en');
    await expect(heightInput).toHaveValue('720');
    await expect(pagesInput).toHaveValue('2');
    await attachmentDialog.getByRole('button', {name: 'Save and close'}).click();

    await initialTable.locator('tbody tr').first().getByLabel('Edit this row').click();
    await attachmentDialog.getByRole('radio', {name: 'URL', exact: true}).check();
    await expect(sizeInput).toHaveValue('');

    await attachmentDialog.getByRole('radio', {name: 'File upload'}).check();
    await expect(attachmentDialog.getByRole('alert')).toHaveCount(0);
    await expect(mimeTypeInput).toHaveValue('text/plain');
    await expect(sizeInput).toHaveValue('5');
    await expect(languageInput).toHaveValue('en');
    await expect(heightInput).toHaveValue('480');
    await expect(pagesInput).toHaveValue('1');
    await expect(attachmentDialog.getByRole('button', {name: 'Save and close'})).toBeEnabled();
    await attachmentDialog.getByRole('button', {name: 'Save and close'}).click();

    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(questionnaire.item[0].initial.map(({valueAttachment}) => valueAttachment)).toEqual([
      {
        contentType: 'text/plain',
        data: 'SGVsbG8=',
        url: 'https://example.org/hello.txt',
        size: '5',
        hash: '9/+ei3uy4Jtwk1pdeF4MxdnQq/A=',
        language: 'en',
        height: 480,
        pages: 1,
        title: 'Embedded and remote'
      },
      {
        contentType: 'application/pdf',
        url: 'https://example.org/remote.pdf',
        size: '4',
        hash: 'ObbXPv82STugZ05IJVqdgXJLRSE=',
        language: 'en',
        height: 720,
        pages: 2,
        title: 'Remote only'
      }
    ]);
  });

  test('should invalidate stale content metadata only when embedded data changes', async ({ page }) => {
    await PWUtils.uploadFile(page, 'attachment-preservation-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Attachments with retained metadata');

    const initialTable = page.locator('lfb-table').filter({hasText: 'Initial value'});
    const attachmentDialog = page.locator('lfb-attachment-dlg');

    // Replacing embedded content with an untyped file clears the previous MIME
    // type, URL, and content-derived metadata. A new MIME type is required
    // before the row can be saved.
    await initialTable.locator('tbody tr').nth(0).getByLabel('Edit this row').click();
    const fileInput = attachmentDialog.locator('input[type="file"]');
    const languageInput = attachmentDialog.getByRole('combobox', {name: /^Language/});
    const heightInput = attachmentDialog.getByRole('spinbutton', {name: /^Height/});
    await languageInput.fill('en');
    await languageInput.press('Escape');
    await heightInput.fill('480');
    await heightInput.press('Tab');
    await uploadUntypedFile(fileInput, 'replacement.pdf', '%PDF');
    const mimeTypeInput = attachmentDialog.getByRole('combobox', {name: /^Mime Type/});
    await expect(mimeTypeInput).toHaveValue('');
    await expect(languageInput).toHaveValue('');
    await expect(heightInput).toHaveValue('');
    await expect(attachmentDialog.getByRole('button', {name: 'Save and close'})).toBeDisabled();
    await mimeTypeInput.fill('application/pdf');
    await mimeTypeInput.press('Escape');
    await attachmentDialog.getByRole('textbox', {name: /^Title/}).click();
    await attachmentDialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(attachmentDialog).not.toBeVisible();

    // Changing a URL preserves the metadata entered by the user.
    await initialTable.locator('tbody tr').nth(1).getByLabel('Edit this row').click();
    const urlInput = attachmentDialog.getByRole('textbox', {name: 'URL'});
    const remoteSizeInput = attachmentDialog.getByRole('textbox', {name: /^Size/});
    await remoteSizeInput.fill('4');
    await remoteSizeInput.press('Tab');
    await languageInput.fill('en');
    await languageInput.press('Escape');
    await heightInput.fill('720');
    await heightInput.press('Tab');
    await urlInput.fill('https://example.org/replacement.pdf');
    await expect(remoteSizeInput).toHaveValue('4');
    await expect(mimeTypeInput).toHaveValue('application/pdf');
    await expect(languageInput).toHaveValue('en');
    await expect(heightInput).toHaveValue('720');
    await attachmentDialog.getByRole('textbox', {name: /^Title/}).fill('Replacement');
    await attachmentDialog.getByRole('textbox', {name: /^Title/}).press('Tab');
    await attachmentDialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(attachmentDialog).not.toBeVisible();

    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(questionnaire.item[0].initial.map(({valueAttachment}) => valueAttachment)).toEqual([
      {
        contentType: 'application/pdf',
        data: 'JVBERg==',
        size: '4',
        hash: 'ObbXPv82STugZ05IJVqdgXJLRSE=',
        title: 'replacement.pdf'
      },
      {
        contentType: 'application/pdf',
        url: 'https://example.org/replacement.pdf',
        size: '4',
        hash: 'ObbXPv82STugZ05IJVqdgXJLRSE=',
        language: 'en',
        height: 720,
        title: 'Replacement'
      }
    ]);
  });

  test('should clear only the selected input method draft and keep that method selected', async ({ page }) => {
    await PWUtils.uploadFile(page, 'attachment-preservation-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Attachments with retained metadata');

    const initialRow = page.locator('lfb-table')
      .filter({hasText: 'Initial value'}).locator('tbody tr').first();
    await initialRow.getByLabel('Edit this row').click();

    const attachmentDialog = page.locator('lfb-attachment-dlg');
    await attachmentDialog.getByRole('radio', {name: 'URL'}).check();
    await attachmentDialog.getByRole('textbox', {name: 'URL'})
      .fill('https://example.org/alternate.pdf');
    await attachmentDialog.getByRole('textbox', {name: /^Title/}).fill('Alternate draft');
    await attachmentDialog.getByRole('textbox', {name: /^Title/}).press('Tab');

    await attachmentDialog.getByRole('radio', {name: 'File upload'}).check();
    const clearAllFields = attachmentDialog.getByRole('button', {name: 'Clear all fields'});
    await expect(clearAllFields).toBeEnabled();
    await clearAllFields.click();

    await expect(attachmentDialog.getByRole('radio', {name: 'File upload'})).toBeChecked();
    await expect(attachmentDialog.getByRole('textbox', {name: /^Title/})).toHaveValue('');
    await expect(attachmentDialog.getByRole('combobox', {name: /^Mime Type/})).toHaveValue('');
    await expect(attachmentDialog.getByRole('textbox', {name: /^Size/})).toHaveValue('');
    await expect(clearAllFields).toBeDisabled();
    await expect(attachmentDialog.getByRole('button', {name: 'Save and close'})).toBeDisabled();

    await attachmentDialog.getByRole('radio', {name: 'URL'}).check();
    await expect(attachmentDialog.getByRole('textbox', {name: 'URL'}))
      .toHaveValue('https://example.org/alternate.pdf');
    await expect(attachmentDialog.getByRole('textbox', {name: /^Title/}))
      .toHaveValue('Alternate draft');

    await attachmentDialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(attachmentDialog).not.toBeVisible();
    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(questionnaire.item[0].initial[0].valueAttachment).toEqual({
      url: 'https://example.org/alternate.pdf',
      title: 'Alternate draft'
    });
  });

  test('should report invalid imported data and allow replacing it with a file', async ({ page }) => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      item: [{
        linkId: 'invalid-attachment',
        text: 'Invalid embedded attachment',
        type: 'attachment',
        initial: [{valueAttachment: {contentType: 'text/plain', data: '!', title: 'Invalid data'}}]
      }]
    };
    const chooserPromise = page.waitForEvent('filechooser');
    await PWUtils.clickMenuBarDropdownItem(page, 'Import', 'Import from file...');
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: 'invalid-attachment.json',
      mimeType: 'application/fhir+json',
      buffer: Buffer.from(JSON.stringify(questionnaire))
    });
    await expect(page.getByRole('dialog', {name: 'Replace existing form?'})).toBeVisible();
    await page.getByRole('button', {name: 'Continue', exact: true}).click();
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Invalid embedded attachment');
    const row = page.locator('lfb-table').filter({hasText: 'Initial value'}).locator('tbody tr').first();
    await row.getByLabel('Edit this row').click();

    const dialog = page.locator('lfb-attachment-dlg');
    await expect(dialog.getByRole('radio', {name: 'File upload'})).toBeChecked();
    await expect(dialog.getByRole('alert')).toContainText('Enter valid base64Binary data.');
    const save = dialog.getByRole('button', {name: 'Save and close'});
    await dialog.getByRole('textbox', {name: /^Title/}).fill('Still invalid');
    await expect(save).toBeDisabled();

    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello')
    });
    await expect(dialog.getByRole('alert')).toHaveCount(0);
    await expect(save).toBeEnabled();
    await save.click();
    await expect(dialog).not.toBeVisible();
    const exported = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(exported.item[0].initial[0].valueAttachment).toEqual({
      contentType: 'text/plain',
      data: 'SGVsbG8=',
      hash: '9/+ei3uy4Jtwk1pdeF4MxdnQq/A=',
      size: '5',
      title: 'hello.txt'
    });
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

    // Keep the value and its unit selector together on the same row.
    const sizeEditor = sizeValue.locator('..');
    const [sizeEditorBox, sizeValueBox, sizeUnitBox] = await Promise.all([
      sizeEditor.boundingBox(),
      sizeValue.boundingBox(),
      sizeUnit.boundingBox()
    ]);
    expect(sizeEditorBox).not.toBeNull();
    expect(sizeValueBox).not.toBeNull();
    expect(sizeUnitBox).not.toBeNull();
    expect(Math.abs(sizeUnitBox!.x - (sizeValueBox!.x + sizeValueBox!.width)))
      .toBeLessThanOrEqual(1);
    expect(sizeUnitBox!.y).toBeCloseTo(sizeValueBox!.y, 0);
    expect(sizeEditorBox!.x + sizeEditorBox!.width - (sizeUnitBox!.x + sizeUnitBox!.width))
      .toBeGreaterThanOrEqual(3);

    // Negative sizes are invalid and must not produce an extension.
    await sizeValue.fill('-1');
    await expect(sizeValue).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a finite, non-negative maximum size.')).toBeVisible();
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL, [], 'R4');

    // 2 KB -> 2048 bytes.
    await sizeValue.fill('2');
    await expect(sizeValue).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('Enter a finite, non-negative maximum size.')).toHaveCount(0);
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

  test('should allow multiple MIME types independently of item repetition while keeping maxSize singular', async ({ page }) => {
    await PWUtils.selectDataType(page, 'attachment');
    await PWUtils.expectDataTypeValue(page, /attachment/);
    await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'No');

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

    // Even though MIME type is repeatable, selecting a second maxSize is rejected.
    await page.getByRole('button', { name: 'Add new restriction' }).click();
    const fourthOperator = page.locator('[id^="__\$restrictions.3.operator"]');
    await fourthOperator.selectOption({ label: 'Mime type' });
    await fourthOperator.selectOption({ label: 'Maximum size' });
    await expect(page.getByText('That restriction is already selected.')).toBeVisible();
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 5 * 1024 }], 'R4');

    // Answer repetition does not affect the MIME extension cardinality.
    await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'Yes');
    await PWUtils.clickRadioButton(page, 'Allow repeating question?', 'No');
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MIME_TYPE_URL,
      [
        { url: MIME_TYPE_URL, valueCode: 'application/pdf' },
        { url: MIME_TYPE_URL, valueCode: 'image/png' }
      ], 'R4');
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

    // The initial Attachment value appears in a read-only row and can be reopened in the dialog.
    const initialRow = page.locator('lfb-table').filter({hasText: 'Initial value'}).locator('tbody tr').first();
    await expect(initialRow.locator('td').nth(0).locator('input')).toHaveValue('Report');
    await expect(initialRow.locator('td').nth(1).locator('input')).toHaveValue('application/pdf');
    expect(JSON.parse(await initialRow.locator('td').nth(3).locator('input').inputValue())).toEqual({
      url: 'http://example.org/report.pdf',
      title: 'Report',
      contentType: 'application/pdf'
    });
    await initialRow.getByLabel('Edit this row').click();
    const attachmentDialog = page.locator('lfb-attachment-dlg');
    await expect(attachmentDialog.getByRole('textbox', {name: 'URL'})).toHaveValue('http://example.org/report.pdf');
    await expect(attachmentDialog.getByRole('textbox', {name: /^Title/})).toHaveValue('Report');
    await expect(attachmentDialog.getByRole('combobox', {name: /^Mime Type/})).toHaveValue('application/pdf');
    await attachmentDialog.getByRole('button', {name: 'Discard changes'}).click();

    // Re-exporting keeps the exact byte count, confirming the round-trip is lossless.
    await PWUtils.assertExtensionsInQuestionnaire(
      page, '/item/0/extension', MAX_SIZE_URL,
      [{ url: MAX_SIZE_URL, valueDecimal: 5 * 1024 * 1024 }], 'R4');
  });

  test('should normalize imported attachment restriction cardinalities', async ({ page }) => {
    await PWUtils.uploadFile(page, 'attachment-restrictions-repeat-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Upload one file');

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

  test('should support attachment existence in enableWhen conditions', async ({ page }) => {
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.fill('Attachment source');
    await PWUtils.selectDataType(page, 'attachment');

    const addNewItemButton = PWUtils.getButton(page, 'Toolbar with item action buttons', 'Add new item');
    await addNewItemButton.click();
    await expect(await PWUtils.getItemTextField(page)).toHaveValue('New item 1');

    await PWUtils.expandAdvancedFields(page);
    await PWUtils.clickRadioButton(page, 'Conditional method', 'enableWhen condition and behavior');
    const question = page.locator('[id^="enableWhen.0.question"]');
    await question.press('Enter');
    await expect(question).toHaveValue('1 - Attachment source');

    const operator = page.locator('[id^="enableWhen.0.operator"]');
    await expect(page.getByLabel('Attachment field')).toHaveCount(0);
    await expect(operator.locator('option')).toHaveText(['Not empty', 'Empty']);
    await expect(page.locator('[id^="enableWhen.0.answer"]')).toHaveCount(0);

    await operator.selectOption({label: 'Empty'});
    let questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(questionnaire.item[1].enableWhen).toEqual([{
      question: questionnaire.item[0].linkId,
      operator: 'exists',
      answerBoolean: false
    }]);

    await operator.selectOption({label: 'Not empty'});
    questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(questionnaire.item[1].enableWhen).toEqual([{
      question: questionnaire.item[0].linkId,
      operator: 'exists',
      answerBoolean: true
    }]);
  });

  test('should import and round-trip attachment existence conditions and behavior', async ({page}) => {
    await PWUtils.uploadFile(page, 'attachment-enablewhen-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Attachment dependent');
    await PWUtils.expandAdvancedFields(page);

    await expect(page.getByLabel('Attachment field')).toHaveCount(0);
    await expect(page.locator('[id^="enableWhen.0.operator"] option:checked')).toHaveText('Not empty');
    await expect(page.locator('[id^="enableWhen.1.operator"] option:checked')).toHaveText('Empty');
    await expect(page.locator('[id^="enableWhen.0.answer"], [id^="enableWhen.1.answer"]')).toHaveCount(0);
    await PWUtils.expectRadioChecked(page, 'Show this item when', 'All conditions are true');

    const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(questionnaire.item[1].enableBehavior).toBe('all');
    expect(questionnaire.item[1].enableWhen).toEqual([
      {
        question: 'attachment-source',
        operator: 'exists',
        answerBoolean: true
      },
      {
        question: 'attachment-source',
        operator: 'exists',
        answerBoolean: false
      }
    ]);
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
