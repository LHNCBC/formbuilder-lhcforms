import {test, expect} from '@playwright/test';
import {MainPO} from "./po/main-po";
import {PWUtils} from "./pw-utils";

test.describe('preview-dlg-component.spec.ts', () => {

  test.describe('Run validations', () => {
    let mainPO: MainPO;

    test.beforeEach(async ({page}) => {
      await page.goto('/');
      mainPO = new MainPO(page);
      await mainPO.loadHomePage();

      // Set up mocks for http calls.
      // For R5 version
      await page.route('https://a.com/r5/metadata?_*', async (route) => {
        await route.fulfill({
          json: {
            resourceType: "CapabilityStatement",
            // Uses implementation.url for further calls.
            implementation: {url: "https://a-proxy.com/r5"},
            fhirVersion: "5.0.0"
          }
        });
      });
      await page.route('https://a-proxy.com/r5/Questionnaire/$validate', async (route) => {
        await route.fulfill({
          json: {
            resourceType: "OperationOutcome",
            issue: [ {
              severity: "fatal",
              diagnostics: "Dummy fatal from r5",
              location: [ "Questionnaire", "Line 1, Col 2" ]
            }, {
              severity: "error",
              diagnostics: "Dummy error",
              location: [ "Questionnaire", "Line 2, Col 4" ]
            }, {
              // Only fatal and errors are reported
              severity: "warning",
              diagnostics: "Should be ignored",
              location: [ "Questionnaire", "Line 3, Col 0" ]
            } ]
          }
        });
      });

      // For some reason mocking with search params is not working. Using a separate url for search params.
      await page.route('https://aa.com/r5/metadata?_*', async (route) => {
        await route.fulfill({
          json: {
            resourceType: "CapabilityStatement",
            implementation: {url: "https://aa-proxy.com/r5"},
            fhirVersion: "5.0.0"
          }
        });
      });
      // Test 'No errors' alert box
      await page.route('https://aa-proxy.com/r5/Questionnaire/$validate**', async (route) => {
        await route.fulfill({
          json: {
            resourceType: "OperationOutcome",
            issue: [ {
              severity: "warning",
              diagnostics: "Should be ignored",
              location: [ "Questionnaire", "Line 3, Col 0" ]
            } ]
          }
        });
      });

      // For R4 version
      await page.route('https://b.com/r4/metadata?_*', async (route) => {
        await route.fulfill({
          json: {
            "resourceType": "CapabilityStatement",
            "implementation": {"url": "https://b-proxy.com/r4"},
            "fhirVersion": "4.0.1"
          }
        });
      });
      await page.route('https://b-proxy.com/r4/Questionnaire/$validate', async (route) => {
        await route.fulfill({
          json: {
            "resourceType": "OperationOutcome",
            "issue": [ {
              "severity": "error",
              "diagnostics": "Dummy error from r4",
              "location": [ "Questionnaire", "Line 1, Col 2" ]
            } ]
          }
        });
      });

      // For STU3 version
      await page.route('https://c.com/r3/metadata?_*', async (route) => {
        await route.fulfill({
          json: {
            "resourceType": "CapabilityStatement",
            "implementation": {"url": "https://c-proxy.com/r3"},
            "fhirVersion": "3.0.2"
          }
        });
      });
      await page.route('https://c-proxy.com/r3/Questionnaire/$validate', async (route) => {
        await route.fulfill({
          json: {
            "resourceType": "OperationOutcome",
            "issue": [ {
              "severity": "error",
              "diagnostics": "Dummy error from r3",
              "location": [ "Questionnaire", "Line 1, Col 2" ]
            } ]
          }
        });
      });
    });

    test('should display JSON content, copy clipboard, validate errors, alert for no errors etc.', async({page}) => {
      const noErrorAlertLocator = page.getByText('No errors found');
      const errorPanelLocator = page.locator('div.accordion > div.accordion-item');
      const firstErrorLocator = errorPanelLocator.locator('div.card > ul > li:first-child');
      const secondErrorLocator = errorPanelLocator.locator('div.card > ul > li:nth-child(2)');
      await page.getByLabel('Start from scratch').click();
      await page.getByRole('button', {name: 'Continue'}).click();
      const fileJson = await PWUtils.uploadFile(page, 'contained-example.json');
      await PWUtils.clickMenuBarButton(page, 'Preview');
      await page.getByRole('tab', { name: 'Questionnaire JSON', exact: true }).click();
      await page.getByRole('button', {name: 'Copy questionnaire to clipboard'}).click();
      const fbJson = JSON.parse(await PWUtils.getClipboardContent(page));
      expect(fbJson.contained).toEqual(fileJson.contained);

      const inputEl = page.getByRole('combobox', {name: 'URL of a FHIR server to run the validation'});
      await inputEl.clear();
      expect(await page.getByRole('listbox').isVisible()).toBe(true);
      // Default is R4
      // Should show validation errors
      await inputEl.fill('https://b.com/r4');
      await page.getByRole('button', {name: 'Run Validation'}).click();
      expect(await firstErrorLocator.innerText()).toMatch(/Error: Dummy error from r4/);
      expect(await errorPanelLocator.isVisible()).toBe(true);
      await expect(noErrorAlertLocator).not.toBeAttached();

      // R5 version
      await page.getByRole('tab', {name: 'R5 Version'}).click();

      await inputEl.fill('https://a.com/r5');
      await page.getByRole('button', {name: 'Run Validation'}).click();
      await expect(firstErrorLocator).toHaveText(/Fatal: Dummy fatal from r5/);
      await expect(secondErrorLocator).toHaveText(/Error: Dummy error/);
      await expect(noErrorAlertLocator).not.toBeAttached();

      await page.getByRole('button', {name: 'Copy validation errors to clipboard'}).click();
      const clipboard = await PWUtils.getClipboardContent(page);
      expect(clipboard).toMatch(/Fatal: Dummy fatal from r5/);

      await page.getByRole('button', {name: 'Hide'}).click();
      expect(await errorPanelLocator.isVisible()).toBe(true);
      await expect(firstErrorLocator).toBeHidden(); // TODO - This line passes assertion for *.toBeVisible() also ??

      await page.getByRole('button', {name: 'Show'}).click();
      await expect(firstErrorLocator).toBeVisible();

      await inputEl.clear();
      // Should show alert for no errors.
      await inputEl.fill('https://aa.com/r5/Questionnaire/$validate?a=b');
      await page.getByRole('button', {name: 'Run Validation'}).click();
      await expect(noErrorAlertLocator).toBeAttached();
      await expect(errorPanelLocator).not.toBeAttached();
      await page.getByRole('tab', {name: 'R4 Version'}).click();
      await expect(noErrorAlertLocator).not.toBeAttached();

      // STU3 version
      await page.getByRole('tab',{name: 'STU3 Version'}).click();
      await expect(noErrorAlertLocator).not.toBeAttached();

      await inputEl.clear();

      await inputEl.fill('https://c.com/r3');
      await page.getByRole('button', {name: 'Run Validation'}).click();
      expect(await firstErrorLocator.innerText()).toMatch(/Error: Dummy error from r3/);
      expect(await errorPanelLocator.isVisible()).toBe(true);
      await expect(noErrorAlertLocator).not.toBeAttached();
    });
  });

  test.describe('Preferred terminology server warning', () => {
    let mainPO: MainPO;

    test.beforeEach(async ({page}) => {
      await page.goto('/');
      mainPO = new MainPO(page);
      await mainPO.loadHomePage();
      // Choose "Import existing" -> "Local file" so the file input is available on
      // the home page (importLocalFile sets it directly; avoids the file-chooser race).
      await page.locator('input[type="radio"][value="existing"]').click();
      await page.locator('input[type="radio"][value="local"]').click();
    });

    test('should warn in the rendered preview when an item has an answerValueSet but no terminology server is set', async ({page}) => {
      // answer-value-set-sample.json has a single 'choice' item (linkId '1') whose
      // answerValueSet is 'http://example.org' and whose preferredTerminologyServer
      // extension has an empty valueUrl, so no terminology server is in scope.
      // Stub value set expansion to avoid a real network round-trip while the form renders;
      // it does not affect the warning, which is derived from the questionnaire content.
      await page.route('**/ValueSet/$expand**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/fhir+json',
          json: {resourceType: 'ValueSet', expansion: {contains: []}}
        });
      });

      await PWUtils.importLocalFile(page, 'answer-value-set-sample.json');
      const titleField = page.locator('lfb-form-fields').getByLabel('Title', {exact: true});
      await expect(titleField).toHaveValue('Answer value set form');

      // Open the preview dialog and switch to the rendered LForms widget.
      await PWUtils.clickMenuBarButton(page, 'Preview');
      await page.getByRole('tab', {name: 'Rendered Form'}).click();

      const form = page.locator('wc-lhc-form');
      await expect(form).toBeVisible({timeout: 15000});

      // The warning is derived from the questionnaire content, so the user is warned about
      // the missing preferred terminology server regardless of the default server the
      // preview uses to render answer lists. It also names the affected item by linkId
      // (the fixture item's linkId is '1').
      const tsWarning = form.locator('..').locator('.preferred-terminology-server-warning');
      await expect(tsWarning).toBeVisible();
      await expect(tsWarning).toContainText('does not specify a preferred terminology server');
      await expect(tsWarning).toContainText("'1'");


      await PWUtils.clickDialogButton(page, {selector: 'lfb-preview-dlg'}, 'Close');
    });

    test('should not warn in the preview when the questionnaire specifies a terminology server', async ({page}) => {
      // This fixture's answerValueSet items point at real SNOMED/clinicaltables servers.
      // Stub value set expansion only to avoid those real network round-trips while the form
      // renders; it does not affect the warning, which is derived from the questionnaire.
      await page.route('**/ValueSet/$expand**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/fhir+json',
          json: {resourceType: 'ValueSet', expansion: {contains: []}}
        });
      });

      // Every answerValueSet item in this fixture has a preferred terminology server extension.
      await PWUtils.importLocalFile(page, 'snomed-answer-value-set-sample.json');
      const titleField = page.locator('lfb-form-fields').getByLabel('Title', {exact: true});
      await expect(titleField).toHaveValue('SNOMED answer value set form');

      await PWUtils.clickMenuBarButton(page, 'Preview');
      await page.getByRole('tab', {name: 'Rendered Form'}).click();

      const form = page.locator('wc-lhc-form');
      await expect(form).toBeVisible({timeout: 15000});

      // No proactive terminology-server warning, because the questionnaire includes one.
      await expect(form.locator('..').locator('.preferred-terminology-server-warning')).toHaveCount(0);

      await PWUtils.clickDialogButton(page, {selector: 'lfb-preview-dlg'}, 'Close');
    });
  });

  test.describe('Extracted resources preview', () => {
    test.beforeEach(async ({page}) => {
      const mainPO = new MainPO(page);
      await mainPO.mockSnomedEditions();
      await page.goto('/');
      await mainPO.loadHomePage();
      await page.locator('input[type="radio"][value="existing"]').click();
      await page.locator('input[type="radio"][value="local"]').click();
      await PWUtils.importLocalFile(page, 'template-extract-preview.json');
      await expect(page.locator('lfb-form-fields').getByLabel('Title', {exact: true}))
        .toHaveValue('Extraction preview sample');
      await PWUtils.clickMenuBarButton(page, 'Preview');
      await expect(page.locator('wc-lhc-form input[id^="name/"]')).toBeVisible();
      await expect(page.locator('lfb-preview-dlg').getByRole('tablist').first().getByRole('tab')).toHaveText([
        'Questionnaire JSON', 'Rendered Form', 'Questionnaire Response JSON', 'Extracted Resources JSON'
      ]);
      // Rendered Form is selected by default.
      await expect(page.locator('lfb-preview-dlg').getByRole('tab', {name: 'Rendered Form', exact: true}))
        .toHaveAttribute('aria-selected', 'true');
    });

    test('extracts live answers, preserves repeated groups across tabs, and exports matching snapshots', async ({page}) => {
      const questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      const dialog = page.locator('lfb-preview-dlg');
      const form = dialog.locator('wc-lhc-form');
      const measurements = form.locator('input[id^="measurement/"]');
      await form.locator('input[id^="name/"]').fill('Preview Person');
      await measurements.first().fill('12.5');
      await form.locator('[id^="add-measurements/"]').first().click();
      await expect(measurements).toHaveCount(2);
      await measurements.nth(1).fill('7.5');
      await measurements.nth(1).press('Tab');
      await form.evaluate(element => { window['previewWidget'] = element; });

      await dialog.getByRole('tab', {name: 'Questionnaire JSON', exact: true}).click();
      await dialog.getByRole('tab', {name: 'STU3 Version', exact: true}).click();
      await dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true}).click();
      const extractedPanel = dialog.getByRole('tabpanel', {name: 'Extracted Resources JSON', exact: true});
      const extractedCopy = dialog.getByRole('button', {name: 'Copy extracted resources JSON', exact: true});
      const extractedDownload = dialog.getByRole('button', {name: 'Download extracted resources JSON', exact: true});
      await expect(extractedCopy).toBeEnabled();
      await expect(extractedCopy).toHaveText('');
      await expect(extractedCopy.locator('fa-icon svg')).toBeVisible();
      await expect(extractedCopy).toHaveAttribute('title', 'Copy extracted resources JSON to clipboard');
      await expect(extractedDownload).toHaveText('');
      await expect(extractedDownload.locator('fa-icon svg')).toBeVisible();
      await expect(extractedDownload).toHaveAttribute('title', 'Download extracted resources JSON');
      // Export buttons overlay the JSON editor, as on the Questionnaire JSON tab.
      const extractedJSON = extractedPanel.getByRole('region', {name: 'extracted resources JSON', exact: true});
      await expect(extractedJSON.locator('.overlay-top-right').getByRole('button')).toHaveCount(2);
      await expect(extractedPanel.locator('.extraction-note')).toHaveText('Resources are not submitted to a FHIR server.');
      await expect(extractedPanel.getByText('FHIR R5', {exact: true})).toHaveCount(0);
      await expect(extractedPanel.getByText('Preview the QuestionnaireResponse', {exact: false})).toHaveCount(0);
      const popup = page.locator('mat-snack-bar-container');
      await extractedCopy.click();
      // Copy feedback appears in a pop-up, not inside the tab.
      await expect(popup).toHaveText('Copied extracted resources JSON.');
      await expect(extractedPanel.getByText('Copied extracted resources JSON.')).toHaveCount(0);
      const bundle = JSON.parse(await PWUtils.getClipboardContent(page));
      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('transaction');
      expect(bundle.entry).toHaveLength(3);
      expect(bundle.entry[0].resource.name[0].text).toBe('Preview Person');
      expect(bundle.entry.slice(1).map(entry => entry.resource.valueQuantity.value)).toEqual([12.5, 7.5]);
      expect(bundle.entry[1].request).toEqual({method: 'POST', url: 'Observation'});

      const bundleDownloadEvent = page.waitForEvent('download');
      await extractedDownload.click();
      const bundleDownload = await bundleDownloadEvent;
      expect(bundleDownload.suggestedFilename()).toBe('extracted-resources.R5.json');
      const bundleStream = await bundleDownload.createReadStream();
      const bundleChunks = [];
      for await (const chunk of bundleStream) {
        bundleChunks.push(chunk);
      }
      expect(JSON.parse(Buffer.concat(bundleChunks).toString())).toEqual(bundle);

      await dialog.getByRole('tab', {name: 'Questionnaire Response JSON', exact: true}).click();
      await expect(dialog.getByRole('button', {name: /^(Refresh|Retry)$/, includeHidden: true})).toHaveCount(0);
      // The FHIR server note applies only to extracted resources, and no FHIR version label is shown.
      const responsePanel = dialog.getByRole('tabpanel', {name: 'Questionnaire Response JSON', exact: true});
      await expect(responsePanel.locator('.extraction-note')).toHaveCount(0);
      await expect(responsePanel.getByText('FHIR R5', {exact: true})).toHaveCount(0);
      // The pop-up from the Extracted Resources tab closes on tab change.
      await expect(popup).toHaveCount(0);
      await dialog.getByRole('button', {name: 'Copy QuestionnaireResponse JSON', exact: true}).click();
      await expect(popup).toHaveText('Copied QuestionnaireResponse JSON.');
      // The pop-up closes on its own after a few seconds.
      await expect(popup).toHaveCount(0, {timeout: 6000});
      const response = JSON.parse(await PWUtils.getClipboardContent(page));
      expect(response.resourceType).toBe('QuestionnaireResponse');
      expect(response.item.find(item => item.linkId === 'name').answer[0].valueString).toBe('Preview Person');
      for (const entry of bundle.entry.slice(1)) {
        expect(entry.resource.derivedFrom[0].reference).toBe(`QuestionnaireResponse/${response.id}`);
      }
      const responseDownloadEvent = page.waitForEvent('download');
      await dialog.getByRole('button', {name: 'Download QuestionnaireResponse JSON', exact: true}).click();
      const responseDownload = await responseDownloadEvent;
      expect(responseDownload.suggestedFilename()).toBe('questionnaire-response.R5.json');
      const responseStream = await responseDownload.createReadStream();
      const responseChunks = [];
      for await (const chunk of responseStream) {
        responseChunks.push(chunk);
      }
      expect(JSON.parse(Buffer.concat(responseChunks).toString())).toEqual(response);

      await dialog.getByRole('tab', {name: 'Rendered Form', exact: true}).click();
      expect(await form.evaluate(element => element === window['previewWidget'])).toBe(true);
      await expect(form.locator('input[id^="name/"]')).toHaveValue('Preview Person');
      await expect(measurements).toHaveCount(2);
      await expect(measurements.nth(1)).toHaveValue('7.5');
      await measurements.first().fill('22');
      // Switch immediately after editing, before LForms' debounced change event fires.
      await dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true}).click();
      await expect(extractedCopy).toBeEnabled();
      // Let the debounced change event (360 ms in LForms) arrive; no stale message may appear.
      await page.waitForTimeout(1000);
      await expect(dialog.getByText(/Form answers changed/)).toHaveCount(0);
      await extractedCopy.click();
      const updated = JSON.parse(await PWUtils.getClipboardContent(page));
      expect(updated.entry[1].resource.valueQuantity.value).toBe(22);
      await dialog.getByRole('tab', {name: 'Questionnaire Response JSON', exact: true}).click();
      await dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true}).click();
      await expect(extractedCopy).toBeEnabled();
      await extractedCopy.click();
      expect(JSON.parse(await PWUtils.getClipboardContent(page))).toEqual(updated);
      expect(await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).toEqual(questionnaire);
    });

    test('shows extraction errors only on Extracted Resources JSON and recovers on reentry', async ({page}) => {
      const dialog = page.locator('lfb-preview-dlg');
      await dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true}).click();
      const copy = dialog.getByRole('button', {name: 'Copy extracted resources JSON', exact: true});
      await expect(copy).toBeEnabled();
      await page.evaluate(() => {
        const util = window['LForms'].Util;
        window['originalPreviewExport'] = util.getFormFHIRData;
        /** Fail extraction only, preserving the public response export. */
        util.getFormFHIRData = function(resourceType, version, source, options) {
          if(options?.extract) {
            throw new Error('Test template expression failed');
          }
          return window['originalPreviewExport'].call(this, resourceType, version, source, options);
        };
      });
      await dialog.getByRole('tab', {name: 'Rendered Form', exact: true}).click();
      await dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true}).click();
      const extractedPanel = dialog.getByRole('tabpanel', {name: 'Extracted Resources JSON', exact: true});
      await expect(extractedPanel.locator('.extraction-error')).toHaveText('Test template expression failed');
      await expect(dialog.getByRole('button', {name: /^(Refresh|Retry)$/, includeHidden: true})).toHaveCount(0);
      // Export buttons are shown only over JSON output.
      await expect(copy).toHaveCount(0);
      // The error explains the missing JSON, so the generic empty message is omitted.
      await expect(extractedPanel.getByText('No extracted resources available.', {exact: true})).toHaveCount(0);
      await dialog.getByRole('tab', {name: 'Questionnaire Response JSON', exact: true}).click();
      const responsePanel = dialog.getByRole('tabpanel', {name: 'Questionnaire Response JSON', exact: true});
      await expect(dialog.getByRole('button', {name: 'Copy QuestionnaireResponse JSON', exact: true})).toBeEnabled();
      // Extraction messages do not apply to the response tab.
      await expect(responsePanel.locator('ngb-alert')).toHaveCount(0);
      await page.evaluate(() => {
        window['LForms'].Util.getFormFHIRData = window['originalPreviewExport'];
      });
      await dialog.getByRole('tab', {name: 'Rendered Form', exact: true}).click();
      await dialog.getByRole('tab', {name: 'Questionnaire Response JSON', exact: true}).click();
      await expect(dialog.locator('.extraction-error')).toHaveCount(0);
      await dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true}).click();
      await expect(copy).toBeEnabled();
    });

    test('opens Questionnaire Response JSON first and explains when no resources are extracted', async ({page}) => {
      const dialog = page.locator('lfb-preview-dlg');
      await page.evaluate(() => {
        const util = window['LForms'].Util;
        const originalExport = util.getFormFHIRData;
        /** Simulate successful extraction with no resources while retaining the real response export. */
        util.getFormFHIRData = function(resourceType, version, source, options) {
          const response = originalExport.call(this, resourceType, version, source);
          return options?.extract ? [response] : response;
        };
      });
      await dialog.getByRole('tab', {name: 'Questionnaire Response JSON', exact: true}).click();
      const responseCopy = dialog.getByRole('button', {name: 'Copy QuestionnaireResponse JSON', exact: true});
      await expect(responseCopy).toBeEnabled();
      await expect(responseCopy).toHaveText('');
      await expect(responseCopy.locator('fa-icon svg')).toBeVisible();
      await responseCopy.click();
      const response = JSON.parse(await PWUtils.getClipboardContent(page));
      expect(response.resourceType).toBe('QuestionnaireResponse');
      await dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true}).click();
      await expect(dialog.locator('.no-resources-extracted')).toHaveText('No resources were extracted from the current answers.');
      // The explanation makes the generic empty message redundant.
      await expect(dialog.getByText('No extracted resources available.', {exact: true})).toHaveCount(0);
      await expect(dialog.getByText(/Extraction completed/)).toHaveCount(0);
      await expect(dialog.getByRole('button', {name: 'Copy extracted resources JSON', exact: true})).toHaveCount(0);
      await expect(dialog.getByRole('button', {name: 'Download extracted resources JSON', exact: true})).toHaveCount(0);
      await dialog.getByRole('tab', {name: 'Questionnaire Response JSON', exact: true}).click();
      await responseCopy.click();
      expect(JSON.parse(await PWUtils.getClipboardContent(page))).toEqual(response);
    });

    test('reopens Questionnaire JSON or Rendered Form and enables snapshots after Rendered Form', async ({page}) => {
      const dialog = page.locator('lfb-preview-dlg');
      const responseTab = dialog.getByRole('tab', {name: 'Questionnaire Response JSON', exact: true});
      const extractedTab = dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true});
      const renderedTab = dialog.getByRole('tab', {name: 'Rendered Form', exact: true});
      const jsonTab = dialog.getByRole('tab', {name: 'Questionnaire JSON', exact: true});
      // Snapshot tabs are not remembered; the preview reopens on Rendered Form.
      await extractedTab.click();
      await expect(dialog.getByRole('button', {name: 'Copy extracted resources JSON', exact: true})).toBeEnabled();
      await PWUtils.clickDialogButton(page, {selector: 'lfb-preview-dlg'}, 'Close');
      await PWUtils.clickMenuBarButton(page, 'Preview');
      await expect(renderedTab).toHaveAttribute('aria-selected', 'true');
      await expect(extractedTab).toBeEnabled();

      await jsonTab.click();
      await PWUtils.clickDialogButton(page, {selector: 'lfb-preview-dlg'}, 'Close');
      await PWUtils.clickMenuBarButton(page, 'Preview');
      await expect(jsonTab).toHaveAttribute('aria-selected', 'true');
      await expect(dialog.getByRole('button', {name: 'Download questionnaire JSON', exact: true})).toBeVisible();
      // The rendered form is not created yet, so the snapshot tabs are disabled and say why.
      await expect(responseTab).toBeDisabled();
      await expect(extractedTab).toBeDisabled();
      // Material tooltips are aria-hidden and have no tooltip role, so locate them by class.
      const tooltip = page.locator('.mat-mdc-tooltip');
      // Keyboard focus on a disabled tab shows the reason and announces it to screen readers.
      await jsonTab.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await expect(responseTab).toBeFocused();
      await expect(tooltip).toHaveText('Open the Rendered Form tab first.');
      await expect(page.locator('.cdk-live-announcer-element')).toHaveText('Open the Rendered Form tab first.');
      await page.keyboard.press('ArrowLeft');
      await expect(renderedTab).toBeFocused();
      await expect(tooltip).toHaveCount(0);
      await expect(jsonTab).toHaveAttribute('aria-selected', 'true');

      await extractedTab.hover();
      await expect(tooltip).toHaveText('Open the Rendered Form tab first.');
      await extractedTab.click({force: true});
      await expect(jsonTab).toHaveAttribute('aria-selected', 'true');

      await renderedTab.click();
      await expect(responseTab).toBeEnabled();
      await expect(extractedTab).toBeEnabled();
      await extractedTab.hover();
      await expect(tooltip).toHaveCount(0);
      // Leaving the rendered form keeps it, so the snapshots read its answers.
      await dialog.locator('wc-lhc-form input[id^="name/"]').fill('Remembered Person');
      await jsonTab.click();
      await extractedTab.click();
      const extractedCopy = dialog.getByRole('button', {name: 'Copy extracted resources JSON', exact: true});
      await expect(extractedCopy).toBeEnabled();
      await extractedCopy.click();
      expect(JSON.stringify(JSON.parse(await PWUtils.getClipboardContent(page)))).toContain('Remembered Person');
      await responseTab.click();
      await expect(dialog.getByRole('button', {name: 'Copy QuestionnaireResponse JSON', exact: true})).toBeEnabled();
    });

    test('downloads the questionnaire JSON next to the copy button', async ({page}) => {
      const dialog = page.locator('lfb-preview-dlg');
      await dialog.getByRole('tab', {name: 'Questionnaire JSON', exact: true}).click();
      await dialog.getByRole('tab', {name: 'R5 Version', exact: true}).click();
      const buttons = dialog.locator('.overlay-top-right').filter({
        has: page.getByRole('button', {name: 'Download questionnaire JSON', exact: true})
      }).getByRole('button');
      await expect(buttons).toHaveCount(2);
      await expect(buttons.first()).toHaveAttribute('title', 'Copy questionnaire to clipboard');
      const downloadEvent = page.waitForEvent('download');
      await buttons.nth(1).click();
      const download = await downloadEvent;
      expect(download.suggestedFilename()).toBe('Extraction-preview-sample.R5.json');
      const chunks = [];
      for await (const chunk of await download.createReadStream()) {
        chunks.push(chunk);
      }
      expect(JSON.parse(Buffer.concat(chunks).toString())).toEqual(await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5'));
    });
  });

  test.describe('Questionnaire JSON download compatibility', () => {
    test('asks the Export menu subject type question before saving', async ({page}) => {
      const mainPO = new MainPO(page);
      await mainPO.mockSnomedEditions();
      await page.goto('/');
      await mainPO.loadHomePage();
      await page.locator('input[type="radio"][value="scratch"]').click();
      await page.getByRole('button', {name: 'Continue'}).click();
      await PWUtils.expandAdvancedFields(page);
      const subjectTypeInput = page.locator('input[id^="subjectType"][id$="_ac"]:visible').first();
      await PWUtils.typeAndSelect(subjectTypeInput, 'Patient');
      await PWUtils.typeAndSelect(subjectTypeInput, 'Citation');

      await PWUtils.clickMenuBarButton(page, 'Preview');
      const dialog = page.locator('lfb-preview-dlg');
      await dialog.getByRole('tab', {name: 'Questionnaire JSON', exact: true}).click();
      await dialog.getByRole('tab', {name: 'R4 Version', exact: true}).click();
      const download = dialog.getByRole('button', {name: 'Download questionnaire JSON', exact: true});
      const warningDialog = page.getByRole('dialog', {name: 'Subject type compatibility'});
      const downloads = [];
      page.on('download', d => downloads.push(d));

      /**
       * Click the download button, answer the subject type question, and read the saved file.
       * @param answer - Name of the button to click in the subject type question.
       * @returns The suggested file name and the parsed questionnaire.
       */
      const downloadWith = async (answer: string) => {
        await download.click();
        await expect(warningDialog).toContainText('Citation');
        const [saved] = await Promise.all([
          page.waitForEvent('download'),
          warningDialog.getByRole('button', {name: answer, exact: true}).click()
        ]);
        const chunks = [];
        for await (const chunk of await saved.createReadStream()) {
          chunks.push(chunk);
        }
        return {fileName: saved.suggestedFilename(), questionnaire: JSON.parse(Buffer.concat(chunks).toString())};
      };

      // Cancel saves nothing and returns to the preview.
      await download.click();
      await warningDialog.getByRole('button', {name: 'Cancel', exact: true}).click();
      await expect(warningDialog).toHaveCount(0);
      await expect(dialog).toBeVisible();
      // From the keyboard, Escape closes only the question, not the preview behind it.
      await download.focus();
      await page.keyboard.press('Enter');
      await expect(warningDialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(warningDialog).toHaveCount(0);
      await expect(dialog).toBeVisible();
      expect(downloads).toHaveLength(0);

      const removed = await downloadWith('Remove incompatible types and export');
      expect(removed.fileName).toBe('New-Form.R4.json');
      expect(removed.questionnaire.subjectType).toEqual(['Patient']);

      const kept = await downloadWith('Export anyway');
      expect(kept.fileName).toBe('New-Form.R4.json');
      expect(kept.questionnaire.subjectType).toEqual(['Patient', 'Citation']);
      await expect(dialog).toBeVisible();
      // Once the question is answered, Escape closes the preview again.
      await download.focus();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    });
  });

  test.describe('Observation extraction preview', () => {
    test('explains missing Observations and extracts an answered item', async ({page}) => {
      const mainPO = new MainPO(page);
      await mainPO.mockSnomedEditions();
      await page.goto('/');
      await mainPO.loadHomePage();
      await page.locator('input[type="radio"][value="existing"]').click();
      await page.locator('input[type="radio"][value="local"]').click();
      await PWUtils.importLocalFile(page, 'observation-extract.json');
      await expect(page.locator('lfb-form-fields').getByLabel('Title', {exact: true}))
        .toHaveValue('Form with observation extract');
      await PWUtils.clickMenuBarButton(page, 'Preview');
      const dialog = page.locator('lfb-preview-dlg');
      const extractedTab = dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true});
      await extractedTab.click();
      // Without answers, nothing is extracted, and the tab says why.
      await expect(dialog.locator('.no-resources-extracted')).toHaveText(
        'No resources were extracted from the current answers. Observations are extracted only from answered items.'
      );
      await expect(dialog.getByText('No extracted resources available.', {exact: true})).toHaveCount(0);
      // 'l2' uses a relationship without an extracted ancestor item.
      const relationshipWarning = dialog.locator('.unextracted-relationship-items');
      await expect(relationshipWarning).toContainText('Not extracted (linkId): l2.');

      await dialog.getByRole('tab', {name: 'Rendered Form', exact: true}).click();
      const input = dialog.locator('wc-lhc-form input[id^="l1/"]');
      await input.fill('16.5');
      await input.press('Tab');
      await dialog.locator('wc-lhc-form input[id^="l2/"]').fill('17.5');
      await dialog.locator('wc-lhc-form input[id^="l2/"]').press('Tab');
      await extractedTab.click();
      await expect(dialog.locator('.no-resources-extracted')).toHaveCount(0);
      await expect(relationshipWarning).toBeVisible();
      const copy = dialog.getByRole('button', {name: 'Copy extracted resources JSON', exact: true});
      await expect(copy).toBeEnabled();
      await copy.click();
      const bundle = JSON.parse(await PWUtils.getClipboardContent(page));
      expect(bundle.entry).toHaveLength(1);
      expect(bundle.entry[0].resource.resourceType).toBe('Observation');
      expect(bundle.entry[0].resource.code.coding).toEqual([{code: 'Code1'}]);
      // LForms 44.2.0 exports this unitless decimal answer as a string; compare the number.
      expect(Number(bundle.entry[0].resource.valueQuantity.value)).toBe(16.5);
    });
  });

  test.describe('Snapshots after LHC-Forms errors', () => {
    test.beforeEach(async ({page}) => {
      const mainPO = new MainPO(page);
      await mainPO.mockSnomedEditions();
      await page.goto('/');
      await mainPO.loadHomePage();
      await page.locator('input[type="radio"][value="existing"]').click();
      await page.locator('input[type="radio"][value="local"]').click();
    });

    test('exports a form that is rendered although an answer list fails to load', async ({page}) => {
      // The empty expansion is reported by LHC-Forms as a ValueSet load error, after it renders the form.
      await page.route('**/ValueSet/$expand**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/fhir+json',
          json: {resourceType: 'ValueSet', expansion: {contains: []}}
        });
      });
      await PWUtils.importLocalFile(page, 'answer-value-set-sample.json');
      await expect(page.locator('lfb-form-fields').getByLabel('Title', {exact: true})).toHaveValue('Answer value set form');
      await PWUtils.clickMenuBarButton(page, 'Preview');
      const dialog = page.locator('lfb-preview-dlg');
      await expect(dialog.locator('.lforms-validation')).toContainText('Unable to load ValueSet');
      await expect(dialog.locator('wc-lhc-form')).toContainText('Item with answer value set');

      await dialog.getByRole('tab', {name: 'Questionnaire Response JSON', exact: true}).click();
      const responsePanel = dialog.getByRole('tabpanel', {name: 'Questionnaire Response JSON', exact: true});
      const responseCopy = dialog.getByRole('button', {name: 'Copy QuestionnaireResponse JSON', exact: true});
      await expect(responseCopy).toBeEnabled();
      await expect(responsePanel.locator('.form-load-warning')).toContainText(
        'The form was rendered with an error: Error: Unable to load ValueSet http://example.org from FHIR server.'
      );
      await expect(responsePanel.locator('.response-error')).toHaveCount(0);
      await responseCopy.click();
      expect(JSON.parse(await PWUtils.getClipboardContent(page)).resourceType).toBe('QuestionnaireResponse');

      await dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true}).click();
      const extractedPanel = dialog.getByRole('tabpanel', {name: 'Extracted Resources JSON', exact: true});
      await expect(extractedPanel.locator('.form-load-warning')).toBeVisible();
      await expect(extractedPanel.locator('.extraction-error')).toHaveCount(0);
      await expect(extractedPanel.getByText('No extraction is configured.', {exact: false})).toBeVisible();
    });

    test('reports the form as unavailable when LHC-Forms cannot render it', async ({page}) => {
      await PWUtils.importLocalFile(page, 'questionnaire-enableWhen-missing-linkId.json');
      await expect(page.locator('lfb-form-fields').getByLabel('Title', {exact: true}))
        .toHaveValue('Questionnaire where enableWhen contains an invalid linkId');
      await PWUtils.clickMenuBarButton(page, 'Preview');
      const dialog = page.locator('lfb-preview-dlg');
      const lformsError = "Question with linkId 'q3' contains enableWhen pointing to a question with linkId 'q11' that does not exist.";
      await expect(dialog.locator('.lforms-validation')).toHaveText(lformsError);

      await dialog.getByRole('tab', {name: 'Questionnaire Response JSON', exact: true}).click();
      await expect(dialog.locator('.response-error')).toHaveText(`The rendered form is unavailable: ${lformsError}`);
      await expect(dialog.locator('.form-load-warning')).toHaveCount(0);
      await expect(dialog.getByRole('button', {name: 'Copy QuestionnaireResponse JSON', exact: true})).toHaveCount(0);

      await dialog.getByRole('tab', {name: 'Extracted Resources JSON', exact: true}).click();
      await expect(dialog.locator('.extraction-error')).toHaveText(`The rendered form is unavailable: ${lformsError}`);
      await expect(dialog.getByRole('button', {name: 'Copy extracted resources JSON', exact: true})).toHaveCount(0);
    });
  });
});
