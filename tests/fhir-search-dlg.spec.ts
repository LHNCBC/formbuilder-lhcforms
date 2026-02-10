import {test, expect} from '@playwright/test';
import {MainPO} from "./po/main-po";

test.describe("FHIR Search Dlg - Server errors", () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
  });

  test.describe("Server errors", () => {
    test.beforeEach(async ({page}) => {
      await page.getByRole('button', {name: 'Import'}).click();
      await page.getByRole('button', {name: 'Import from a FHIR server...'}).click();
      await expect(page.getByRole('dialog', {name: 'Choose a FHIR server'})).toBeVisible();
      await page.getByRole('button', {name: 'Continue', exact: true}).click();
      await expect(page.getByRole('dialog', {name: 'Import a questionnaire'})).toBeVisible();
    });

    test('Should display 400 error.', async ({page}) => {
      // Set up mocks for http calls.
      await page.route('https://lforms-fhir.nlm.nih.gov/baseDstu3/Questionnaire?**_content=vital', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/fhir+json',
          json: {
            "resourceType": "OperationOutcome",
            "text": {
              "status": "generated",
              "div": "<div>Test message</div>"
            },
            "issue": [{
              "severity": "error",
              "code": "processing",
              "diagnostics": "First error diagnostics message."
            }]
          }
        });
      });
      await page.locator('select[id^="SelectFHIRServer"]').selectOption({label: 'https://lforms-fhir.nlm.nih.gov/baseDstu3'});
      await page.getByPlaceholder('Search any text field').fill('vital');
      await page.getByPlaceholder('Search any text field').press('Enter');
      const errorMsg = page.locator('.card.bg-danger-subtle');
      await errorMsg.getByRole('button', {name: 'Toggle error details'}).click();
      await expect(errorMsg.getByRole('listitem').getByText('First error diagnostics message.')).toBeVisible()
    });

    test('should display 500 error', async ({page}) => {
      // Set up mocks for http calls.
      await page.route('https://lforms-fhir.nlm.nih.gov/baseDstu3/Questionnaire?**_content=vital', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/fhir+json',
          json: {
            "resourceType": "OperationOutcome",
            "text": {
              "status": "generated",
              "div": "<div>Server side error</div>"
            },
            "issue": [{
              "severity": "error",
              "code": "processing",
              "diagnostics": "500 error."
            }]
          }
        });
      });
      await page.locator('select[id^="SelectFHIRServer"]').selectOption({label: 'https://lforms-fhir.nlm.nih.gov/baseDstu3'});
      await page.getByPlaceholder('Search any text field').fill('vital');
      await page.getByPlaceholder('Search any text field').press('Enter');
      const errorMsg = page.locator('.card.bg-danger-subtle');
      await expect(errorMsg.locator('.card-header')).toHaveText('Server error - the selected FHIR server encountered an internal error.');
      await errorMsg.getByRole('button', {name: 'Toggle error details'}).click();
      await expect(errorMsg.getByRole('listitem').getByText('500 error.')).toBeVisible()
    });
  });
});
