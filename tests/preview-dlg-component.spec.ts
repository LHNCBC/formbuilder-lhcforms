import {test, expect} from '@playwright/test';
import {MainPO} from "./po/main-po";
import path from "path";
import fs from "node:fs/promises";

test.describe('preview-dlg-component.spec.ts', async () => {

  test.describe('Run validations', async() => {
    let mainPO: MainPO;

    test.beforeEach(async ({page}) => {
      await page.goto('/');
      mainPO = new MainPO(page);
      await mainPO.clearSession();
      await mainPO.loadFLPage();

      // Set up mocks for http calls.
      // For R4 version
      await page.route('https://a.com/r4/metadata**', async (route) => {
        await route.fulfill({
          json: {
            resourceType: "CapabilityStatement",
            // Uses implementation.url for further calls.
            implementation: {url: "https://a-proxy.com/r4"},
            fhirVersion: "4.0.1"
          }
        });
      });
      await page.route('https://a-proxy.com/r4/Questionnaire/$validate', async (route) => {
        await route.fulfill({
          json: {
            resourceType: "OperationOutcome",
            issue: [ {
              severity: "fatal",
              diagnostics: "Dummy fatal from r4",
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

      // For STU3 version
      await page.route('https://b.com/r3/metadata?_*', async (route) => {
        await route.fulfill({
          json: {
            "resourceType": "CapabilityStatement",
            "implementation": {"url": "https://b-proxy.com/r3"},
            "fhirVersion": "3.0.2"
          }
        });
      });
      await page.route('https://b-proxy.com/r3/Questionnaire/$validate', async (route) => {
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

      // For some reason mocking with search params is not working. Using a separate url for search params.
      await page.route('https://c.com/r4/metadata**', async (route) => {
        await route.fulfill({
          json: {
            resourceType: "CapabilityStatement",
            implementation: {url: "https://cp.com/r4"},
            fhirVersion: "4.0.1"
          }
        });
      });
      // Test 'No errors' alert box
      await page.route('https://cp.com/r4/Questionnaire/$validate**', async (route) => {
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
    });

    test('should display JSON content, copy clipboard, validate errors, alert for no errors etc.', async({page}) => {
      const noErrorAlertLocator = page.getByText('No errors found');
      const errorPanelLocator = page.locator('div.accordion > div.accordion-item');
      const firstErrorLocator = errorPanelLocator.locator('div.card > ul > li:first-child');
      const secondErrorLocator = errorPanelLocator.locator('div.card > ul > li:nth-child(2)');
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByLabel('Start from scratch').click();
      await page.getByRole('button', {name: 'Continue'}).click();
      await page.getByRole('button', { name: 'Import' }).click();
      await page.getByRole('button', { name: 'Import from file...' }).click();
      const testFile = path.join(__dirname, '../cypress/fixtures/contained-example.json');
      const fileJson = JSON.parse(await fs.readFile(testFile, 'utf-8'));

      // Start waiting for file chooser before clicking.
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(testFile);

      await expect(page.locator('input#title')).toHaveValue('Contained example');
      await page.getByRole('button', {name: 'Preview'}).click();
      await page.getByRole('tab',{name: 'View/Validate Questionnaire JSON'}).click();

      await page.getByRole('button', {name: 'Copy questionnaire to clipboard'}).click();
      let clipboard: string = await page.evaluate('navigator.clipboard.readText()');
      const json = JSON.parse(clipboard);
      expect(json.contained).toEqual(fileJson.contained);

      const inputEl = page.getByRole('combobox', {name: 'URL of a FHIR server to run the validation'});
      await inputEl.clear();
      expect(await page.getByRole('listbox').isVisible()).toBe(true);
      // Should show validation errors
      await inputEl.fill('https://a.com/r4');
      await page.getByRole('button', {name: 'Run Validation'}).click();
      expect(await firstErrorLocator.innerText()).toMatch(/Fatal: Dummy fatal from r4/);
      expect(await secondErrorLocator.innerText()).toMatch(/Error: Dummy error/);
      await expect(noErrorAlertLocator).not.toBeAttached();

      await page.getByRole('button', {name: 'Copy validation errors to clipboard'}).click();
      clipboard = await page.evaluate('navigator.clipboard.readText()');
      expect(clipboard).toMatch(/Fatal: Dummy fatal from r4/);

      await page.getByRole('button', {name: 'Hide'}).click();
      expect(await errorPanelLocator.isVisible()).toBe(true);
      await expect(firstErrorLocator).toBeHidden(); // TODO - This line passes assertion for *.toBeVisible() also ??

      await page.getByRole('button', {name: 'Show'}).click();
      await expect(firstErrorLocator).toBeVisible();

      await inputEl.clear();
      // Should show alert for no errors.
      await inputEl.fill('https://c.com/r4/Questionnaire/$validate?a=b');
      await page.getByRole('button', {name: 'Run Validation'}).click();
      await expect(noErrorAlertLocator).toBeAttached();
      await expect(errorPanelLocator).not.toBeAttached();

      // STU3 version
      await page.getByRole('tab',{name: 'STU3 Version'}).click();

      await inputEl.clear();

      await inputEl.fill('https://b.com/r3');
      await page.getByRole('button', {name: 'Run Validation'}).click();
      expect(await firstErrorLocator.innerText()).toMatch(/Error: Dummy error from r3/);
      expect(await errorPanelLocator.isVisible()).toBe(true);
      await expect(noErrorAlertLocator).not.toBeAttached();
    });
  });
});
