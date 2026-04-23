import {Locator, Page, expect} from "@playwright/test";
import {mockLoincLookupData, mockUcumLookupData, mockSnomedLookupData, mockUnitLookupData} from "./mock-lookup-data";

const LOINC_SEARCH = /loinc_items\/v3\/search.*terms=.*/;
const ANSWER_OPTION_UCUM_SEARCH = /ucum\/v3\/search\?terms=.*/;
const ANSWER_OPTION_SNOMED_SEARCH = /https:\/\/snowstorm\.ihtsdotools\.org\/fhir\/ValueSet\/\$expand.*filter=/;
const UNIT_UCUM_SEARCH = /ucum\/v3\/search\?df=cs_code%2Cname%2Cguidance&terms=.*/;

export class MainPO {

  readonly _page;
  static readonly windowOpenerNotice = 'Notice: This page is sending changes back to the page';
  static lformsLibs = new Map<string, Buffer>();
  constructor(page: Page) {
    this._page = page;
  }
  /**
   * Clears session, then asserts LForms is loaded on the current page (no navigation).
   */
  async loadHomePage() {
    await this.clearSession();
    await this.assertLFormsLoaded();
    await this.acceptAllTermsOfUse();
  }

  /**
   * Getter for page.
   */
  get page() {
    return this._page;
  }

  /**
   * Getter for title field locator.
   */
  get titleLocator(): Locator {
    return this._page.locator('lfb-form-fields').getByLabel('Title', {exact: true});
  }

  /**
   * Load form level page.
   */
  async loadFLPage() {
    await this.loadHomePage();
    await this._page.getByLabel('Start from scratch').click();
    await this._page.getByRole('button', {name: 'Continue'}).click();
  }

  async loadILPage() {
    await this.loadFLPage();
    await this._page.getByRole('button', {name: 'Create questions'}).first().click();
  }
  /**
   * Load item level page from scratch.
   */
  async cleanLoadILPage() {
    await this.loadHomePage();
    await this._page.getByLabel('Start from scratch').click();
    await this._page.getByRole('button', {name: 'Continue'}).click();
    await this._page.getByRole('button', {name: 'Create questions'}).first().click();
  }

  /**
   * Load the page without accepting SNOMED license.
   */
  async loadHomePageWithLoincOnly() {
    await this.clearSession();
    await this._page.goto('/');
    await this.assertLFormsLoaded();
    await this.acceptLoincOnly();
  }

  async resetForm() {
    await this._page.getByLabel('Start from scratch').click();
    await this._page.getByRole('button', {name: 'Continue'}).click();
    await this._page.getByRole('button', {name: 'Create questions'}).first().click();
  }

  /**
   * Assert LForms is loaded on the current page. Does not navigate;
   * caller must navigate first.
   */
  async assertLFormsLoaded() {
    await this.mockSnomedEditions();
    // await this._page.goto('/');
    const lforms = await this._page.evaluateHandle('window.LForms');
    expect(lforms).toBeDefined();
  }


  /**
   * Accept LOINC notice dialog.
   */
  async acceptAllTermsOfUse() {
    await this._page.locator('#acceptLoinc').click();
    await this._page.locator('#useSnomed').click();
    await this._page.locator('#acceptSnomed').click();
    await this._page.locator('lfb-loinc-notice button').filter({hasText: 'Accept'}).click();
  }


  /**
   * Accept only LOINC terms of use.
   */
  async acceptLoincOnly() {
    await this._page.locator('#acceptLoinc').click();
    await this._page.locator('lfb-loinc-notice button').filter({hasText: 'Accept'}).click();
  }


/**
 * Clear session storage.
 */
  async clearSession() {
    await this._page.evaluate(() => {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }
      catch (e) {
        console.log(`Local storage or session storage not accessible: ${e.message}`);
      }
    });
  }

  /**
   * Mock SNOMED editions request.
   */
  async mockSnomedEditions() {
    await this._page.route('https://snowstorm.ihtsdotools.org/fhir/CodeSystem', (route) => {
      route.fulfill({path: 'tests/fixtures/snomedEditions.json'});
    });
  }

  /**
   * Cache calls to https://lhcforms-static to load LForms libraries.
   *
   * @param page - Playwright page used to register the route handler.
   * @returns Promise that resolves when the route handler is registered.
   */
  static async mockLFormsLoader(page: Page): Promise<void> {
    const lformsLibUrl = 'https://lhcforms-static.nlm.nih.gov/lforms-versions/';

    await page.route(lformsLibUrl, async (route) => {
      await MainPO.handleCachedResponse(route);
    });

    await page.route(
      new RegExp(`${lformsLibUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\/(webcomponent|fhir)\/.*\.(js|css)$`),
      async (route) => {
        await MainPO.handleCachedResponse(route);
      }
    );
  }

  /**
   * Mock lookup endpoints with fixture data based on a query-string parameter.
   *
   * @param page - Playwright page used to register the route handler.
   * @param interceptUrl - URL pattern to intercept (string or RegExp).
   * @param searchParam - Query-string parameter used as the lookup key.
   * @param type - Lookup dataset selector.
   * @param options - Optional behavior flags (e.g., normalization).
   * @returns Promise that resolves when the route handler is registered.
   */
  static async mockData(page: Page, interceptUrl: string | RegExp, searchParam: string, type: 'loinc' | 'ucum' | 'snomed' | 'unit',
                        options: { normalize?: boolean } = {}): Promise<void> {
    const {normalize = true} = options;

    await page.route(interceptUrl, async (route) => {
      const url = new URL(route.request().url());
      const term = url.searchParams.get(searchParam) ?? '';
      const key = normalize ? term.toString().toLowerCase() : term.toString();

      let body;
      if (type === 'loinc') {
        body = mockLoincLookupData[key];
      } else if (type === 'ucum') {
        body = mockUcumLookupData[key];
      } else if (type === 'unit') {
        body = mockUnitLookupData[key];
      } else {
        body = mockSnomedLookupData[key];
      }

      if (!body) {
        if (type === 'snomed') {
          body = { resourceType: 'ValueSet', expansion: { contains: [] } };
        } else {
          body = [0, [], null, []];
        }
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body)
      });
    });
  }

  /**
   * Mock LOINC items search endpoint for FHIR Query Observation to avoid flaky
   * network calls in tests that use autocompletes.
   *
   * @param page - Playwright page used to register the route handler.
   * @returns Promise that resolves when the route handler is registered.
   */
  static async mockFHIRQueryObservation(page: Page): Promise<void> {
    await MainPO.mockData(page, LOINC_SEARCH, 'terms', 'loinc');
  }

  /**
   * Mock lookups used by answerOptions autocomplete (LOINC, UCUM, SNOMED).
   *
   * @param page - Playwright page used to register the route handler.
   * @returns Promise that resolves when the route handler is registered.
   */
  static async mockAnswerOptionLookup(page: Page): Promise<void> {
    await MainPO.mockData(page, LOINC_SEARCH, 'terms', 'loinc');
    await MainPO.mockData(page, ANSWER_OPTION_UCUM_SEARCH, 'terms', 'ucum', { normalize: false });
    await MainPO.mockData(page, ANSWER_OPTION_SNOMED_SEARCH, 'filter', 'snomed', { normalize: false });
  }

  /**
   * Mock Ucum items search endpoint to avoid flaky network calls in tests that use autocompletes.
   *
   * @param page - Playwright page used to register the route handler.
   * @returns Promise that resolves when the route handler is registered.
   */
  static async mockUnitsLookup(page: Page): Promise<void> {
    await MainPO.mockData(page, UNIT_UCUM_SEARCH, 'terms', 'unit');
  }

  /**
   * Fulfill a routed request from an in-memory cache when available,
   * otherwise fetch it once, cache the response body, and fulfill the route.
   *
   * @param route - Playwright route for the intercepted request.
   */
  private static async handleCachedResponse(route: any): Promise<void> {
    const url = route.request().url();

    if (MainPO.lformsLibs.has(url)) {
      const cachedBody = MainPO.lformsLibs.get(url);
      await route.fulfill({
        status: 200,
        body: cachedBody
      });
      return;
    }

    try {
      const response = await route.fetch();
      const body = await response.body();

      if (response.status() >= 300) {
        console.error(`${response.status()}: Error loading ${url}: ${response.statusText()}`);
      } else {
        MainPO.lformsLibs.set(url, body);
      }

      await route.fulfill({ response });
    } catch (error) {
      console.error(`Error handling request for ${url}:`, error);
      await route.abort();
    }
  }

  /**
   * Load a table with data.
   * @param tableData - Data to load in the table.
   * @param table - Locator for the table.
   */
  async loadTable(table: Locator, tableData: string [][]) {
    for(let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
      for(let colIndex = 0; colIndex < tableData[rowIndex].length; colIndex++) {
        const locator = table.locator(`tbody tr:nth-child(${rowIndex+1}) td:nth-child(${colIndex+1}) input`);
        await expect(locator).toBeEditable({editable: true, timeout: 30000});
        await locator.fill(tableData[rowIndex][colIndex]);
        // This is required (mainly for the system) to fix the issue of answerOptions missing data.
        await locator.press('Tab');
      }
      if(tableData.length - rowIndex > 1) {
        await table.locator('..').getByRole('button', {name: 'Add'}).click();
        // Added check to wait for the row to be added.
        const rows = table.locator(`tbody tr`);
        await expect(rows).toHaveCount(rowIndex + 2);
      } else {
        // Added check to wait for the last cell of the last row to be added.
        const lastRow = table.locator('tbody tr').last();
        const lastCell = lastRow.locator('td input').last();
        const lastCellValue = await lastCell.inputValue();
        await expect(lastCell).toHaveValue(tableData[rowIndex][tableData[rowIndex].length - 1], { timeout: 1000});

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

}
