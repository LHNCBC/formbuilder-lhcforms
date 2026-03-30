import { test, expect, Page, Download } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';
import { format, parseISO } from 'date-fns';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';
import { ExtensionDefs } from '../src/app/lib/extension-defs';

const termsAcceptedKey = 'acceptedTermsOfUse';

const getTerminologyServerInput = (page: Page) => page.locator('[id="__$terminologyServer"]');

const getLocalStorageItem = async (page: Page, key: string) => {
  return page.evaluate((k) => window.localStorage.getItem(k), key);
};

const getSessionStorageItem = async (page: Page, key: string) => {
  return page.evaluate((k) => window.sessionStorage.getItem(k), key);
};

const getLocalTime = (zuluTimeStr: string) => format(parseISO(zuluTimeStr), 'yyyy-MM-dd hh:mm:ss.SSS a');

const assertCodeField = async (page: Page, jsonPointerToCodeField: string) => {
  await PWUtils.clickRadioButton(page, 'Code', 'Include code');

  const codeInput = page.locator('[id^="code.0.code_"]').first();
  await expect(codeInput).toBeVisible();
  await codeInput.fill('ab ');
  await codeInput.press('Enter');
  const codeError = codeInput.locator('xpath=following-sibling::ul//small');
  await expect(codeError).toBeVisible();
  await expect(codeError).toContainText('Spaces are not allowed at the beginning or end.');

  const coding = { code: 'c1', system: 's1', display: 'd1' };
  await codeInput.clear();
  await codeInput.fill(coding.code);
  await page.locator('[id^="code.0.system_"]').first().fill(coding.system);
  await page.locator('[id^="code.0.display_"]').first().fill(coding.display);

  await page.getByRole('button', { name: 'Add new code' }).click();
  await page.locator('[id^="code.1.code_"]').first().fill('c2');
  await page.locator('[id^="code.1.system_"]').first().fill('s2');
  await page.locator('[id^="code.1.display_"]').first().fill('d2');

  await page.getByRole('button', { name: 'Add new code' }).click();
  await page.locator('[id^="code.2.code_"]').first().fill('c3');
  await page.locator('[id^="code.2.system_"]').first().fill('s3');
  await page.locator('[id^="code.2.display_"]').first().fill('d3');

  await PWUtils.assertValueInQuestionnaire(page, jsonPointerToCodeField, [
    { code: 'c1', system: 's1', display: 'd1' },
    { code: 'c2', system: 's2', display: 'd2' },
    { code: 'c3', system: 's3', display: 'd3' }
  ]);

  await PWUtils.clickRadioButton(page, 'Code', 'No code');

  await PWUtils.assertValueInQuestionnaire(page, jsonPointerToCodeField, undefined);

  await PWUtils.clickRadioButton(page, 'Code', 'Include code');

  await PWUtils.assertValueInQuestionnaire(page, jsonPointerToCodeField, [
    { code: 'c1', system: 's1', display: 'd1' },
    { code: 'c2', system: 's2', display: 'd2' },
    { code: 'c3', system: 's3', display: 'd3' }
  ]);
};

const fhirSearch = async (page: Page, titleSearchTerm: string) => {
  const fixturePath = path.join(__dirname, 'fixtures', `fhir-server-mock-response-${titleSearchTerm}.json`);
  const fixture = await fs.readFile(fixturePath, 'utf-8');

  await page.route(`**title:contains=${titleSearchTerm}**`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: fixture });
  });

  await page.locator('input[type="radio"][name="fhirServer"]').first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('input.form-control[placeholder="Search any text field"]').fill(titleSearchTerm);
  await page.locator('#searchField1').selectOption('Form title only');
  await page.locator('#button-addon2').click();
  await expect(page.locator('div.list-group')).toBeVisible();
  await page.locator('a.result-item').first().click();
};

const saveDownload = async (download: Download, filePath: string) => {
  await download.saveAs(filePath);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
};

test.describe('Home page accept Terms of Use notices', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    mainPO = new MainPO(page);
    await mainPO.mockSnomedEditions();
  });

  test.describe('Loading LForms', () => {
    test('should display error message on lforms loading error', async ({ page }) => {
      await page.route(/^https:\/\/lhcforms-static\.nlm\.nih\.gov\/lforms-versions\//, async (route) => {
        await route.fulfill({ status: 404, body: 'File not found!' });
      });

      const responsePromise = page.waitForResponse((response) =>
        response.url().startsWith('https://lhcforms-static.nlm.nih.gov/lforms-versions/') && response.status() === 404
      );

      await page.goto('/');
      await responsePromise;
      const mainPO = new MainPO(page);
      await mainPO.acceptAllTermsOfUse();

      const errorCard = page.locator('.card').filter({ hasText: 'Error' });
      await expect(errorCard.locator('.card-header')).toContainText('Error', { timeout: 10000 });
      await expect(errorCard.locator('.card-body')).toContainText('Encountered an error which causes');
    });

    test('should not display error after loading LForms', async ({ page }) => {
      await page.goto('/');
      const mainPO = new MainPO(page);
      await mainPO.assertLFormsLoaded();
      await mainPO.acceptAllTermsOfUse();
      const lformsVersion = await page.evaluate(() => (window as any).LForms?.lformsVersion);
      expect(lformsVersion).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
      await expect(page.locator('.card.bg-danger-subtle')).toHaveCount(0);
    });
  });

  test('should make SNOMED CT available after accepting SNOMED notice', async ({ page }) => {
    await page.goto('/');
    const mainPO = new MainPO(page);
    await mainPO.assertLFormsLoaded();

    const acceptBtn = page.locator('lfb-loinc-notice button', { hasText: 'Accept' });
    await expect(acceptBtn).toBeDisabled();

    const loinc = page.locator('#acceptLoinc');
    await loinc.click();
    await expect(loinc).toBeChecked();
    await expect(acceptBtn).toBeEnabled();

    await page.locator('#useSnomed').click();
    await expect(acceptBtn).toBeDisabled();

    const snomed = page.locator('#acceptSnomed');
    await snomed.click();
    await expect(snomed).toBeChecked();
    await expect(acceptBtn).toBeEnabled();

    await loinc.click();
    await expect(acceptBtn).toBeDisabled();
    await loinc.click();
    await expect(acceptBtn).toBeEnabled();
    await acceptBtn.click();

    const termsValue = await getLocalStorageItem(page, termsAcceptedKey);
    const acceptedTerms = JSON.parse(termsValue || '{}');
    expect(acceptedTerms.acceptedLoinc).toBe(true);
    expect(acceptedTerms.acceptedSnomed).toBe(true);

    await page.locator('input[type="radio"][value="scratch"]').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Create questions' }).first().click();

    await PWUtils.selectDataType(page, 'coding');
    await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
    await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');

    await expect(page.locator('[id^="__\\$answerOptionMethods_answer-option"]')).not.toBeChecked();
    await expect(page.locator('[id^="__\\$answerOptionMethods_value-set"]')).toBeVisible();
    await expect(page.locator('[id^="__\\$answerOptionMethods_value-set"]')).not.toBeChecked();
    await expect(page.locator('[id^="__\\$answerOptionMethods_snomed-value-set"]')).toBeVisible();
    await expect(page.locator('[id^="__\\$answerOptionMethods_snomed-value-set"]')).not.toBeChecked();
    await expect(page.locator('[id^="__\\$answerOptionMethods_none"]')).toBeChecked();
  });

  test('should not find SNOMED CT functionality after accepting only LOINC terms of use', async ({ page }) => {
    await page.goto('/');
    const mainPO = new MainPO(page);
    await mainPO.assertLFormsLoaded();

    await mainPO.acceptLoincOnly();

    await expect(await getSessionStorageItem(page, 'acceptedLoinc')).toEqual('true');
    await expect(await getSessionStorageItem(page, 'acceptedSnomed')).toEqual('false');

    await page.locator('input[type="radio"][value="scratch"]').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Create questions' }).first().click();
    await expect(page.locator('.spinner-border')).toHaveCount(0);

    await PWUtils.selectDataType(page, 'coding');
    await PWUtils.clickRadioButton(page, 'Create answer list', 'Yes');
    await PWUtils.clickRadioButton(page, 'Answer constraint', 'Restrict to the list');

    await expect(page.locator('[id^="__\\$answerOptionMethods_answer-option"]')).not.toBeChecked();
    await expect(page.locator('[id^="__\\$answerOptionMethods_value-set"]')).toBeVisible();
    await expect(page.locator('[id^="__\\$answerOptionMethods_value-set"]')).not.toBeChecked();
    await expect(page.locator('[id^="__\\$answerOptionMethods_snomed-value-set"]')).toHaveCount(0);
    await expect(page.locator('[id^="__\\$answerOptionMethods_none"]')).toBeChecked();
  });
});

test.describe('Home page', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    mainPO = new MainPO(page);
    await mainPO.mockSnomedEditions();
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadHomePage();
  });

  test('display home page title', async ({ page }) => {
    await expect(page.locator('.lead').first()).toHaveText('How do you want to create your form?');
  });

  test('should display version info', async ({ page }) => {
    const versionLink = page.locator('.version-info a');
    await expect(versionLink).toHaveAttribute('href',
      'https://github.com/lhncbc/formbuilder-lhcforms/blob/master/CHANGELOG.md');
    await expect(versionLink).toContainText(/^[0-9]+\.[0-9]+\.[0-9]+$/);
  });

  test.describe('Home page import options', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('input[type="radio"][value="existing"]').click();
    });

    test('should import local file', async ({ page }) => {
      await page.locator('input[type="radio"][value="local"]').click();
      const sampleFile = 'answer-option-sample-2.json';
      const fixtureJson = await PWUtils.readJSONFile(sampleFile);
      await PWUtils.importLocalFile(page, sampleFile, false);
      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Answer options form');
      const previewJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(previewJson.item.length).toBe(fixtureJson.item.length);
    });

    test('should import LOINC form', async ({ page }) => {
      await page.locator('input[type="radio"][value="loinc"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.locator('#loincSearch').fill('vital signs with');
      await expect(page.locator('ngb-typeahead-window')).toBeVisible();
      await page.locator('ngb-typeahead-window button').first().click();

      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title'))
        .toHaveValue('Vital signs with method details panel');
      await expect(page.locator('[id^="booleanRadio_true"]')).toBeChecked();
      await expect(page.locator('[id^="code.0.code"]')).toHaveValue('34566-0');
    });

    test('should import form from FHIR server', async ({ page }) => {
      const titleSearchTerm = 'vital';

      await page.locator('input[type="radio"][value="fhirServer"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();

      await fhirSearch(page, titleSearchTerm);

      const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
      await expect(titleField).toHaveValue(new RegExp(titleSearchTerm, 'i'));
      await expect(page.locator('[id^="booleanRadio_true"]')).toBeChecked();
      await expect(page.locator('[id^="code.0.code"]')).toHaveValue('85353-1');
    });
  });

  test.describe('Home page export options', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      await page.locator('input[type="radio"][value="scratch"]').click();
      await PWUtils.deleteDownloadsFolder(testInfo.outputDir);
    });

    test('should export to local file in R4 format', async ({ page }, testInfo) => {
      await PWUtils.importLocalFile(page, 'sample.STU3.json');

      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Sample STU3 form');

      const exportR4Item = await PWUtils.getMenuBarDropDownItem(page, 'Export', 'Export to file in FHIR R4 format');

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportR4Item.click()
      ]);

      const downloadPath = testInfo.outputPath('Sample-STU3-form.R4.json');
      const downloadedJson = await saveDownload(download, downloadPath);

      await PWUtils.clickMenuBarButton(page, 'Preview');
      await page.getByText('View/Validate Questionnaire JSON').click();
      await page.getByText('R4 Version').click();
      await page.getByRole('button', { name: 'Copy questionnaire to clipboard' }).click();

      const clipboardJson = JSON.parse(await PWUtils.getClipboardContent(page));
      expect(clipboardJson.item[0].answerOption.length).toBe(3);
      expect(clipboardJson).toEqual(downloadedJson);

      await page.getByRole('button', { name: 'Close' }).click();
    });

    test('should export to local file in STU3 format', async ({ page }, testInfo) => {
      await PWUtils.importLocalFile(page, 'sample.R4.json');
      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Sample R4 form');

      await PWUtils.expectRadioChecked(page, 'Code', 'Include code');

      await expect(page.locator('[id^="code.0.code"]')).toHaveValue('34565-2');

      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');

      await expect(page.locator('.spinner-border')).toHaveCount(0);

      await PWUtils.expectRadioChecked(page, 'Question code', 'Include code');

      await expect(page.locator('[id^="code.0.code"]')).toHaveValue('8358-4');

      const exportSTU3Item = await PWUtils.getMenuBarDropDownItem(page, 'Export', 'Export to file in FHIR STU3 format');

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportSTU3Item.click()
      ]);

      const downloadPath = testInfo.outputPath('Sample-R4-form.STU3.json');
      const downloadedJson = await saveDownload(download, downloadPath);

      await PWUtils.clickMenuBarButton(page, 'Preview');

      await page.getByText('View/Validate Questionnaire JSON').click();
      await page.getByText('STU3 Version').click();
      await page.getByRole('button', { name: 'Copy questionnaire to clipboard' }).click();

      const clipboardJson = JSON.parse(await PWUtils.getClipboardContent(page));
      expect(clipboardJson.item[0].option.length).toBe(3);
      expect(clipboardJson).toEqual(downloadedJson);

      await page.getByRole('button', { name: 'Close' }).click();
    });

    test('should export to local file in LHC-FORMS format', async ({ page }, testInfo) => {
      await PWUtils.importLocalFile(page, 'sample.R4.json');
      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Sample R4 form');

      const exportLHCFormsItem = await PWUtils.getMenuBarDropDownItem(page, 'Export', 'Export to file in LHC-Forms internal (and volatile) format');

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportLHCFormsItem.click()
      ]);

      const downloadPath = testInfo.outputPath('Sample-R4-form.LHC-Forms.json');
      const downloadedJson = await saveDownload(download, downloadPath);

      await PWUtils.clickMenuBarButton(page, 'Preview');
      await page.getByText('View/Validate Questionnaire JSON').click();
      await page.getByText('R4 Version').click();
      await page.getByRole('button', { name: 'Copy questionnaire to clipboard' }).click();

      const clipboardJson = JSON.parse(await PWUtils.getClipboardContent(page));
      expect(clipboardJson.title).toBe(downloadedJson.name);
      expect(clipboardJson.item[0].text).toBe(downloadedJson.items[0].question);
      expect(clipboardJson.item[0].code[0].code).toBe(downloadedJson.items[0].codeList[0].code);
      expect(clipboardJson.item[0].answerOption.length).toBe(downloadedJson.items[0].answers.length);

      await page.getByRole('button', { name: 'Close' }).click();
    });
  });

  test.describe('Form level fields', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('input[type="radio"][value="scratch"]').click();
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Continue');

    });

    test('should include code only when use question code is yes (form level)', async ({ page }) => {
      const codeField = page.locator('lfb-boolean-radio', { hasText: /Code/ }).first();
      await expect(codeField).toBeVisible();
      await assertCodeField(page, '/code');
    });

    test('should create codes at form level', async ({ page }) => {
      await assertCodeField(page, '/code');
    });

    test('should display Questionnaire.url', async ({ page }) => {
      const urlField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'URL');
      await urlField.fill('http://example.com/1');
      await PWUtils.assertValueInQuestionnaire(page, '/url', 'http://example.com/1');

      await urlField.clear();
      await urlField.fill('a a');
      const urlError = urlField.locator('xpath=following-sibling::ul//small');
      await expect(urlError).toBeVisible();
      await expect(urlError).toContainText('Spaces and other whitespace characters are not allowed in this field.');

      await urlField.clear();
      await expect(urlField.locator('xpath=following-sibling::ul')).toHaveCount(0);
    });

    test('should retain title edits', async ({ page }) => {
      let titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
      await expect(titleField).toHaveValue('New Form');
      await titleField.clear();
      await titleField.fill('Dummy title');

      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Create questions');
      const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.title).toBe('Dummy title');

      await PWUtils.clickMenuBarButton(page, 'Edit form attributes');
      titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
      await expect(titleField).toHaveValue('Dummy title');
    });

    test('should display default title', async ({ page }) => {
      const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
      await expect(titleField).toHaveValue('New Form');
      await titleField.clear();

      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Create questions');
      const attentionButton = page.locator('#resizableMiddle button.attention');
      await expect(attentionButton).toContainText('Untitled Form');
      await expect(attentionButton).toHaveClass(/attention/);
    });

    test('should move to form level fields', async ({ page }) => {
      await expect(page.locator('lfb-form-fields > div > div > p'))
        .toHaveText('Enter basic information about the form.');
    });

    test('should hide/display code field', async ({ page }) => {
      const codeYes = await PWUtils.getRadioButtonLabel(page, 'Code', 'Include code');
      const codeNo = await PWUtils.getRadioButtonLabel(page, 'Code', 'No code');

      await codeYes.click();
      const codeInput = page.locator('[id^="code.0.code"]');
      await expect(codeInput).toBeVisible();

      await codeNo.click();
      await expect(codeInput).toBeHidden();
    });

    test('should display preview widget', async ({ page }) => {
      await PWUtils.uploadFile(page, 'answer-option-sample-2.json');
      const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
      await expect(titleField).toHaveValue('Answer options form', { timeout: 10000 });

      await PWUtils.clickMenuBarButton(page, 'Preview');
      await page.getByRole('tab', { name: 'View Rendered Form' }).click();

      const form = page.locator('wc-lhc-form');
      await expect(form).toBeVisible();

      const acInput = page.locator('[id="1/1"]');
      await expect(acInput).toHaveValue('d2');
      await acInput.click();

      const acResults = page.locator('#completionOptionsScroller');
      await expect(acResults).toBeVisible();
      const acListItems = acResults.locator('ul > li');
      await expect(acListItems).toHaveCount(2);
      await acListItems.first().click();
      await expect(acInput).toHaveValue('d1');

      await PWUtils.clickDialogButton(page, { selector: 'lfb-preview-dlg' }, 'Close');

    });

    test('should work with ethnicity ValueSet in preview', async ({ page }) => {
      await PWUtils.uploadFile(page, 'USSG-family-portrait.json');
      const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
      await expect(titleField).toHaveValue('US Surgeon General family health portrait', { timeout: 10000 });

      await PWUtils.clickMenuBarButton(page, 'Preview');
      await page.getByRole('tab', { name: 'View Rendered Form' }).click();

      const form = page.locator('wc-lhc-form');
      await expect(form).toBeVisible({ timeout: 10000 });

      const ethnicity = page.locator('#\\/54126-8\\/54133-4\\/1\\/1');
      await PWUtils.typeSequentially(ethnicity, 'l');
      const completionOptions = page.locator('#completionOptions');
      await completionOptions.scrollIntoViewIfNeeded();
      await expect(completionOptions).toBeVisible();

      await ethnicity.press('ArrowDown');
      await ethnicity.press('Enter');
      const selectedItem = page.locator('span.autocomp_selected ul > li', { hasText: 'La Raza' });
      await expect(selectedItem).toBeVisible();

      await PWUtils.clickDialogButton(page, { selector: 'lfb-preview-dlg' }, 'Close');
    });

    test.describe('Upload questionnaires to FHIR server', () => {
      const testConfigs = [
        {
          fixtureFile: 'initial-sample.R5.json',
          serverBaseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR5',
          version: 'R5'
        },
        {
          fixtureFile: 'initial-sample.R4.json',
          serverBaseUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4',
          version: 'R4'
        },
        {
          fixtureFile: 'initial-sample.STU3.json',
          serverBaseUrl: 'https://lforms-fhir.nlm.nih.gov/baseDstu3',
          version: 'STU3'
        }
      ];

      for (const testConfig of testConfigs) {
        test(`should create/update questionnaire on the fhir server - ${testConfig.version}`, async ({ page }) => {
          const fixtureJson = await PWUtils.readJSONFile(testConfig.fixtureFile);
          const responseStub = JSON.parse(JSON.stringify(fixtureJson));
          responseStub.id = '1111';
          responseStub.meta = {
            versionId: '1',
            lastUpdated: '2020-02-22T22:22:22.222-00:00'
          };

          await PWUtils.uploadFile(page, `${testConfig.fixtureFile}`);

          const exportMenu = await PWUtils.getMenuBarButton(page, 'Export');
          await exportMenu.click();
          const updateMenuItem = page.getByRole('button', { name: /^Update the questionnaire on the server/ });
          await expect(updateMenuItem).toHaveClass(/disabled/);
          await exportMenu.click();

          await page.route(`${testConfig.serverBaseUrl}/Questionnaire`, async (route) => {
            if (route.request().method() === 'POST') {
              await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(responseStub) });
            } else {
              await route.fallback();
            }
          });

          const created = await PWUtils.getFHIRServerResponse(page, 'Create a new questionnaire on a FHIR server...', testConfig.serverBaseUrl);
          expect(created).toEqual(responseStub);

          responseStub.title = 'Modified title';
          const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
          await titleField.clear();
          await titleField.fill(responseStub.title);

          await exportMenu.click();
          await expect(updateMenuItem).toBeVisible();
          await expect(updateMenuItem).not.toHaveClass(/disabled/);
          await exportMenu.click();

          await page.route(`${testConfig.serverBaseUrl}/Questionnaire/${responseStub.id}`, async (route) => {
            if (route.request().method() === 'PUT') {
              await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseStub) });
            } else {
              await route.fallback();
            }
          });

          const updated = await PWUtils.getFHIRServerResponse(page, 'Update the questionnaire on the server');
          expect(updated).toEqual(responseStub);
        });
      }
    });

    test('should expand/collapse advanced fields panel', async ({ page }) => {
      const tsUrl = getTerminologyServerInput(page);
      await expect(tsUrl).toBeHidden();
      await PWUtils.expandAdvancedFields(page);
      await expect(tsUrl).toBeVisible();
      await PWUtils.collapseAdvancedFields(page);
      await expect(tsUrl).toBeHidden();
    });

    test.describe('Form level fields: Advanced', () => {

      test.beforeEach(async ({ page }) => {
        await PWUtils.expandAdvancedFields(page);
        await expect(getTerminologyServerInput(page)).toBeVisible();
      });

      test.afterEach(async ({ page }) => {
        await PWUtils.collapseAdvancedFields(page);
        await expect(getTerminologyServerInput(page)).toBeHidden();
      });

      test('should create terminology server extension', async ({ page }) => {
        const tsUrl = getTerminologyServerInput(page);

        await expect(tsUrl.locator('xpath=following-sibling::small')).toHaveCount(0);
        await tsUrl.fill('ab');
        await expect(tsUrl.locator('xpath=following-sibling::small')).toHaveText('Please enter a valid URL.');
        await tsUrl.clear();
        await expect(tsUrl.locator('xpath=following-sibling::small')).toHaveCount(0);

        await tsUrl.fill('http://example.org/fhir');
        await PWUtils.assertValueInQuestionnaire(page, '/extension', [
          {
            valueUrl: 'http://example.org/fhir',
            url: ExtensionDefs.preferredTerminologyServer.url
          }
        ]);

        await tsUrl.clear();
        await PWUtils.assertValueInQuestionnaire(page, '/extension', undefined);

        await tsUrl.fill('http://example.com/r4');
        await PWUtils.assertValueInQuestionnaire(page, '/extension', [
          {
            url: ExtensionDefs.preferredTerminologyServer.url,
            valueUrl: 'http://example.com/r4'
          }
        ]);
      });

      test('should import form with terminology server extension at form level', async ({ page }) => {
        const sampleFile = 'terminology-server-sample.json';
        await PWUtils.uploadFile(page, sampleFile, false);

        const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
        await expect(titleField).toHaveValue('Terminology server sample form');

        const tsUrl = getTerminologyServerInput(page);
        await expect(tsUrl).toBeVisible();
        await expect(tsUrl).toHaveValue('https://example.org/fhir');

        await PWUtils.assertExtensionsInQuestionnaire(
          page,
          '/extension',
          ExtensionDefs.preferredTerminologyServer.url,
          [
            {
              url: ExtensionDefs.preferredTerminologyServer.url,
              valueUrl: 'https://example.org/fhir'
            }
          ]
        );

        await tsUrl.clear();
        await PWUtils.assertExtensionsInQuestionnaire(page, '/extension', ExtensionDefs.preferredTerminologyServer.url, []);

        await tsUrl.fill('http://a.b');
        await PWUtils.assertExtensionsInQuestionnaire(
          page,
          '/extension',
          ExtensionDefs.preferredTerminologyServer.url,
          [
            {
              url: ExtensionDefs.preferredTerminologyServer.url,
              valueUrl: 'http://a.b'
            }
          ]
        );
      });

      test.describe('Import date fields', () => {
        const fileToFieldsMap = {
          'form-level-advanced-fields.json': [
            { field: 'implicitRules', title: 'Implicit rules' },
            { field: 'version', title: 'Version' },
            { field: 'name', title: 'Questionnaire name' },
            { field: 'date', title: 'Revision date' },
            { field: 'publisher', title: 'Publisher' },
            { field: 'copyright', title: 'Copyright' },
            { field: 'approvalDate', title: 'Approval date' },
            { field: 'lastReviewDate', title: 'Last review date' }
          ],
          'datetime-1.json': [
            { field: 'date', title: 'Revision date' },
            { field: 'approvalDate', title: 'Approval date' },
            { field: 'lastReviewDate', title: 'Last review date' }
          ],
          'datetime-2.json': [
            { field: 'date', title: 'Revision date' },
            { field: 'approvalDate', title: 'Approval date' },
            { field: 'lastReviewDate', title: 'Last review date' }
          ]
        };

        for (const file of Object.keys(fileToFieldsMap)) {
          test(`should import with advanced fields from: ${file}`, async ({ page }) => {
            const json = await PWUtils.readJSONFile(file);
            await PWUtils.uploadFile(page, `${file}`);

            const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
            await expect(titleField).toHaveValue(json.title);

            const fieldList = fileToFieldsMap[file as keyof typeof fileToFieldsMap];
            for (const fieldObj of fieldList) {
              let expVal = json[fieldObj.field];
              if (file === 'form-level-advanced-fields.json' && fieldObj.field === 'date') {
                expVal = getLocalTime(json[fieldObj.field]);
              }
              const field = await PWUtils.getByLabel(page, 'lfb-form-fields', fieldObj.title);
              await expect(field).toHaveValue(expVal);
            }

            const previewJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
            for (const f of fieldList) {
              expect(previewJson[f.field]).toEqual(json[f.field]);
            }
          });
        }
      });

      test.describe('Date and Datetime related fields.', () => {
        const dateRE = /^\d{4}-\d{2}-\d{2}$/;
        const dateTimeRE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} (AM|PM)$/;
        const dateTimeZuluRE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

        test('should test revised date (date time picker)', async ({ page }) => {
          const dateInput = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Revision date');
          await dateInput.locator('xpath=following-sibling::button').click();
          const datepicker = dateInput.locator('xpath=following-sibling::ngb-datepicker');
          const includeTime = datepicker.getByLabel('Include time');

          await expect(includeTime).toBeChecked();
          await datepicker.getByRole('button', { name: 'Today' }).click();
          await expect(dateInput).toHaveValue(dateRE);

          const nowButton = datepicker.getByRole('button', { name: 'Now' });
          await nowButton.click();
          await expect(dateInput).toHaveValue(dateTimeRE);

          await includeTime.locator('xpath=following-sibling::label').click();
          await includeTime.click();
          await expect(dateInput).toHaveValue(dateRE);

          await nowButton.click();
          await expect(dateInput).toHaveValue(dateTimeRE);

          const previewJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
          expect(previewJson.date).toMatch(dateTimeZuluRE);
        });

        test('should test approval date (date picker)', async ({ page }) => {
          const approvalDtInput = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Approval date');
          await approvalDtInput.locator('xpath=following-sibling::button').click();
          const datepicker = approvalDtInput.locator('xpath=following-sibling::ngb-datepicker');
          await expect(datepicker).toBeVisible();

          await datepicker.getByText('Today').click();
          await expect(approvalDtInput).toHaveValue(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

          await approvalDtInput.clear();
          await approvalDtInput.fill('2021-01-01');

          const previewJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
          expect(previewJson.approvalDate).toBe('2021-01-01');
        });

        test('should accept valid but not invalid dates', async ({ page }) => {
          const widgets = [
            { widgetId: 'date', widgetLabel: 'Revision date' },
            { widgetId: 'approvalDate', widgetLabel: 'Approval date' },
            { widgetId: 'lastReviewDate', widgetLabel: 'Last review date' }
          ];

          for (const { widgetId, widgetLabel } of widgets) {
            const dateInput = await PWUtils.getByLabel(page, 'lfb-form-fields', widgetLabel);
            for (const validDate of ['2020', '2020-06', '2020-06-23']) {
              await dateInput.clear();
              await dateInput.fill(validDate);
              await dateInput.blur();

              const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
              expect(qJson[widgetId]).toBe(validDate);
            }

            await dateInput.clear();
            await dateInput.fill('abc');
            await dateInput.blur();
            let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
            expect(qJson[widgetId]).toBeUndefined();

            await dateInput.clear();
            await dateInput.fill('202');
            await dateInput.blur();
            qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
            expect(qJson[widgetId]).toBeUndefined();
          }

          for (const { widgetId, widgetLabel } of widgets) {
            const dateInput = await PWUtils.getByLabel(page, 'lfb-form-fields', widgetLabel);
            const dateError = dateInput.locator('xpath=ancestor::div[contains(@class,"row")]//small[contains(@class,"text-danger")]');
            await dateInput.clear();
            await dateInput.fill('2020-01-02 10:');
            await expect(dateError).toBeVisible();
            await expect(dateInput).toHaveClass(/ng-invalid/);

            await dateInput.press('Backspace');
            await expect(dateError).toBeVisible();
            await expect(dateInput).toHaveClass(/ng-invalid/);

            await dateInput.press('Backspace');
            await expect(dateError).toBeVisible();
            await expect(dateInput).toHaveClass(/ng-invalid/);

            await dateInput.press('Backspace');
            await expect(dateError).toHaveCount(0);
            await expect(dateInput).not.toHaveClass(/ng-invalid/);

            await dateInput.fill('ab');
            await expect(dateError).toBeVisible();
            await expect(dateInput).toHaveClass(/ng-invalid/);
            await dateInput.blur();

            let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
            expect(qJson[widgetId]).toBeUndefined();

            for (const input of ['2023-11-31', '2023-02-29', '2023-02-30', '2023-02-31']) {
              await dateInput.clear();
              await dateInput.fill(input);
              await dateInput.blur();
              await expect(dateInput).toHaveClass(/ng-invalid/);

              qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
              expect(qJson[widgetId]).toBeUndefined();
            }
          }

          const dateInput = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Revision date');
          await dateInput.clear();
          await dateInput.fill('2020-01-02 100');
          await expect(dateInput).toHaveClass(/ng-invalid/);
          await dateInput.blur();

          let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
          expect(qJson.date).toBeUndefined();

          await dateInput.clear();
          await dateInput.fill('2020-01-02 100');
          await expect(dateInput).toHaveClass(/ng-invalid/);
          await dateInput.press('Backspace');
          await PWUtils.typeSequentially(dateInput, ':10:10.1 am');
          await expect(dateInput).not.toHaveClass(/ng-invalid/);

          qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
          expect(qJson.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });
      });

      test('should create variables at the Questionnaire level', async ({ page }) => {
        await MainPO.mockFHIRQueryObservation(page);

        await page.locator('button#editVariables').click();
        await expect(page.locator('#expression-editor-base-dialog')).toBeVisible();

        await expect(page.locator('lhc-variables > h2')).toContainText('Form Variables');
        await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

        await page.locator('#add-variable').click();
        await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
        await page.locator('#variable-label-0').fill('a_fhir_exp');
        await page.locator('#variable-type-0').selectOption('FHIRPath Expression');
        await page.locator('input#variable-expression-0').fill("%resource.item.where(linkId='/29453-7').answer.value");
        await expect(page.locator('input#variable-expression-0')).not.toHaveClass(/field-error/);

        await page.locator('#add-variable').click();
        await page.locator('#variable-label-1').fill('b_fhir_query');
        await page.locator('#variable-type-1').selectOption('FHIR Query');
        await page.locator('input#variable-expression-1')
          .fill("Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))");
        await expect(page.locator('input#variable-expression-1')).not.toHaveClass(/field-error/);

        await page.locator('#add-variable').click();
        await page.locator('#variable-label-2').fill('c_fhir_query_obs');
        await page.locator('#variable-type-2').selectOption('FHIR Query (Observation)');

        await PWUtils.selectAutocompleteOptions(
          page,
          '#autocomplete-2',
          false,
          'invalidCode',
          null,
          ['ArrowDown', 'Enter'],
          []
        );

        await PWUtils.selectAutocompleteOptions(
          page,
          '#autocomplete-2',
          true,
          'weight',
          null,
          ['ArrowDown', 'Enter'],
          ['×Weight - 29463-7']
        );

        await page.locator('#add-variable').click();
        await page.locator('#variable-label-3').fill('d_easy_path_exp');
        await page.locator('#variable-type-3').selectOption('Easy Path Expression');
        await page.locator('input#simple-expression-3').fill('1');

        await page.locator('#export').click();

        const variables = page.locator('lfb-variable tbody > tr');
        await expect(variables).toHaveCount(4);

        await expect(variables.nth(0).locator('td').nth(0)).toHaveText('a_fhir_exp');
        await expect(variables.nth(0).locator('td').nth(1)).toHaveText('FHIRPath Expression');
        await expect(variables.nth(0).locator('td').nth(2))
          .toHaveText("%resource.item.where(linkId='/29453-7').answer.value");

        await expect(variables.nth(1).locator('td').nth(0)).toHaveText('b_fhir_query');
        await expect(variables.nth(1).locator('td').nth(1)).toHaveText('FHIR Query');
        await expect(variables.nth(1).locator('td').nth(2))
          .toHaveText("Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))");

        await expect(variables.nth(2).locator('td').nth(0)).toHaveText('c_fhir_query_obs');
        await expect(variables.nth(2).locator('td').nth(1)).toHaveText('FHIR Query (Observation)');
        await expect(variables.nth(2).locator('td').nth(2))
          .toHaveText('Observation?code=http%3A%2F%2Floinc.org%7C29463-7&date=gt{{today()-1 months}}&patient={{%patient.id}}&_sort=-date&_count=1');

        await expect(variables.nth(3).locator('td').nth(0)).toHaveText('d_easy_path_exp');
        await expect(variables.nth(3).locator('td').nth(1)).toHaveText('Easy Path Expression');
        await expect(variables.nth(3).locator('td').nth(2)).toHaveText('1');
      });

      test('should not allow saving a form-level variable with a missing value and display validation error', async ({ page }) => {
        await page.locator('button#editVariables').click();
        await expect(page.locator('#expression-editor-base-dialog')).toBeVisible();

        await expect(page.locator('lhc-variables > h2')).toContainText('Form Variables');
        await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);
        await expect(page.locator('lhc-variables div.no-variables'))
          .toContainText('There are currently no variables for this form.');

        await page.locator('#add-variable').click();
        await page.locator('#variable-label-0').fill('a');
        await page.locator('#variable-type-0').selectOption('Easy Path Expression');
        await page.locator('input#simple-expression-0').fill('10');

        await page.locator('#add-variable').click();
        await page.locator('#variable-label-1').fill('b');
        await page.locator('#variable-type-1').selectOption('Easy Path Expression');

        await page.locator('#export').click();

        await expect(page.locator('input#simple-expression-1')).toHaveClass(/field-error/);
        await expect(page.locator('input#simple-expression-1')).toHaveClass(/ng-invalid/);

        const errorMsg = page.locator('lhc-syntax-converter#variable-expression-1 div#expression-error > p');
        await expect(errorMsg).toContainText('Expression is required.');

        await expect(page.locator('button#export')).toHaveClass(/disabled/);

        await page.locator('input#simple-expression-1').fill('11');

        await expect(page.locator('input#simple-expression-1')).not.toHaveClass(/field-error/);
        await expect(page.locator('input#simple-expression-1')).not.toHaveClass(/ng-invalid/);

        await expect(page.locator('lhc-syntax-converter#variable-expression-1 div#expression-error')).toHaveCount(0);

        await page.locator('#export').click();
      });
    });
  });

  test('should display variables at the Questionnaire level', async ({ page }) => {
    await page.locator('input[type="radio"][value="existing"]').click();
    await page.locator('input[type="radio"][value="local"]').click();

    await PWUtils.importLocalFile(page, 'questionnaire_level_variables.json');

    await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title'))
      .toHaveValue('Weight & Height tracking panel', { timeout: 10000 });

    await PWUtils.expandAdvancedFields(page);

    const variables = page.locator('lfb-variable tbody > tr');
    await expect(variables).toHaveCount(5);

    await expect(variables.nth(0).locator('td').nth(0)).toHaveText('a_fhirpath_exp');
    await expect(variables.nth(0).locator('td').nth(1)).toHaveText('FHIRPath Expression');
    await expect(variables.nth(0).locator('td').nth(2))
      .toHaveText("%resource.item.where(linkId='/8302-2').answer.value");

    await expect(variables.nth(1).locator('td').nth(0)).toHaveText('b_fhir_query');
    await expect(variables.nth(1).locator('td').nth(1)).toHaveText('FHIR Query');
    await expect(variables.nth(1).locator('td').nth(2))
      .toHaveText("%resource.item.where(linkId='/8352-7').answer.value");

    await expect(variables.nth(2).locator('td').nth(0)).toHaveText('c_fhir_obs');
    await expect(variables.nth(2).locator('td').nth(1)).toHaveText('FHIR Query (Observation)');
    await expect(variables.nth(2).locator('td').nth(2))
      .toHaveText('Observation?code=http%3A%2F%2Floinc.org%7C29463-7&date=gt{{today()-1 months}}&patient={{%patient.id}}&_sort=-date&_count=1');

    await expect(variables.nth(3).locator('td').nth(0)).toHaveText('d_question');
    await expect(variables.nth(3).locator('td').nth(1)).toHaveText('Question');
    await expect(variables.nth(3).locator('td').nth(2))
      .toHaveText("%resource.item.where(linkId='/29463-7').answer.value");

    await expect(variables.nth(4).locator('td').nth(0)).toHaveText('e_simple');
    await expect(variables.nth(4).locator('td').nth(1)).toHaveText('Easy Path Expression');
    await expect(variables.nth(4).locator('td').nth(2)).toHaveText('1 + 1');

    await PWUtils.collapseAdvancedFields(page);
  });

  test.describe('User specified FHIR server dialog', () => {
    test.beforeEach(async ({ page }) => {
      await PWUtils.clickButton(page, null, 'Continue');
      await PWUtils.clickMenuBarDropdownItem(page, 'Import', 'Import from a FHIR server...');
      await PWUtils.clickButton(page, null, 'Add your FHIR server...');
    });

    test('should detect invalid FHIR url in user specified server dialog', async ({ page }) => {
      const inputUrl = page.locator('#urlInputId');
      const validate = page.getByRole('button', { name: 'Validate' });
      const add = page.getByRole('button', { name: 'Add' });
      const cancel = page.getByRole('button', { name: 'Cancel' });

      await expect(validate).toBeDisabled();
      await expect(add).toBeDisabled();

      await inputUrl.fill('xxx');
      await expect(validate).toBeEnabled();
      await expect(add).toBeDisabled();
      await validate.click();
      await expect(page.locator('p.text-danger')).toContainText('You entered an invalid url: xxx');
      await expect(add).toBeDisabled();

      await inputUrl.clear();
      await inputUrl.fill('http://localhost');
      await validate.click();
      await expect(page.locator('p.text-danger')).toContainText('Unable to confirm the URL is a FHIR server.');
      await expect(add).toBeDisabled();

      await cancel.click();
    });

    test('should validate and select user specified FHIR server', async ({ page }) => {
      const inputUrl = page.locator('#urlInputId');
      const validate = page.getByRole('button', { name: 'Validate' });
      const add = page.getByRole('button', { name: 'Add' });

      await inputUrl.fill('https://dummyhost.com/baseR4');
      await page.route('https://dummyhost.com/baseR4/metadata?*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          path: path.join(__dirname, 'fixtures', 'fhir-metadata-elements.json')
        });
      });

      await validate.click();
      await expect(page.locator('p.text-success'))
        .toContainText('https://dummyhost.com/baseR4 was verified to be a FHIR server.');
      await add.click();

      await expect(page.locator('input[type="radio"][name="fhirServer"]').first()).toBeChecked();
      await expect(page.locator('lfb-fhir-servers-dlg table tbody tr').first().locator('td label'))
        .toHaveText('https://dummyhost-1.com/baseR4');
    });
  });

  test.describe('Warning dialog when replacing current form', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('input[type="radio"][value="scratch"]').click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await PWUtils.uploadFile(page, 'answer-option-sample-2.json');
    });

    test('should display warning dialog when replacing from local file', async ({ page }) => {
      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Answer options form');

      await PWUtils.uploadFile(page, 'decimal-type-sample.json');

      await PWUtils.clickDialogButton(page, { title: 'Replace existing form?' }, 'Cancel');

      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Answer options form');

      await PWUtils.uploadFile(page, 'decimal-type-sample.json', true);

      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Decimal type form');

    });

    test('should display warning dialog when replacing form from LOINC', async ({ page }) => {
      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Answer options form');

      await PWUtils.clickMenuBarDropdown(page, 'Import');
      await page.locator('form > input[placeholder="Search LOINC"]').fill('Vital signs with method details panel');
      await expect(page.locator('ngb-typeahead-window')).toBeVisible();
      await page.locator('ngb-typeahead-window button').first().click();
      await PWUtils.clickDialogButton(page, { title: 'Replace existing form?' }, 'Cancel');

      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Answer options form');

      await PWUtils.clickMenuBarDropdown(page, 'Import');
      await page.locator('form > input[placeholder="Search LOINC"]').fill('Vital signs with method details panel');
      await expect(page.locator('ngb-typeahead-window')).toBeVisible();
      await page.locator('ngb-typeahead-window button').first().click();
      await PWUtils.clickDialogButton(page, { title: 'Replace existing form?' }, 'Continue');

      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title'))
        .toHaveValue('Vital signs with method details panel');
    });

    test('should display warning dialog when replacing form from FHIR server', async ({ page }) => {
      const titleSearchTerm = 'vital';

      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Answer options form');

      await PWUtils.clickMenuBarDropdownItem(page, 'Import', 'Import from a FHIR server...');

      await fhirSearch(page, titleSearchTerm);
      await PWUtils.clickDialogButton(page, { title: 'Replace existing form?' }, 'Cancel');

      await expect(await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title')).toHaveValue('Answer options form');

      await PWUtils.clickMenuBarDropdownItem(page, 'Import', 'Import from a FHIR server...');

      await fhirSearch(page, titleSearchTerm);
      await PWUtils.clickDialogButton(page, { title: 'Replace existing form?' }, 'Continue');

      const titleField = await PWUtils.getByLabel(page, 'lfb-form-fields', 'Title');
      await expect(titleField).toHaveValue(new RegExp(titleSearchTerm, 'i'));
      await expect(page.locator('[id^="booleanRadio_true"]')).toBeChecked();
      await expect(page.locator('[id^="code.0.code"]')).toHaveValue('85353-1');
    });
  });
});
