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
      await page.getByRole('tab', { name: 'View/Validate Questionnaire JSON' }).click();
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
      await page.getByRole('tab', {name: 'View Rendered Form'}).click();

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
      await page.getByRole('tab', {name: 'View Rendered Form'}).click();

      const form = page.locator('wc-lhc-form');
      await expect(form).toBeVisible({timeout: 15000});

      // No proactive terminology-server warning, because the questionnaire includes one.
      await expect(form.locator('..').locator('.preferred-terminology-server-warning')).toHaveCount(0);

      await PWUtils.clickDialogButton(page, {selector: 'lfb-preview-dlg'}, 'Close');
    });
  });
});
