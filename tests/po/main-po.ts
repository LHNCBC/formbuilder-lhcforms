import {Locator, Page, expect} from "@playwright/test";

export class MainPO {

  readonly _page;
  static readonly windowOpenerNotice = 'Notice: This page is sending changes back to the page';
  constructor(page: Page) {
    this._page = page;
  }
  /**
   * Load home page and wait until LForms is loaded.
   */
  async loadHomePage() {
    await this.clearSession();
    await this.goToHomePage();
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
    return this._page.locator('#title');
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
    await this._page.getByRole('button', {name: 'Create questions'}).click();
  }
  /**
   * Load item level page from scratch.
   */
  async cleanLoadILPage() {
    await this.loadHomePage();
    await this._page.getByLabel('Start from scratch').click();
    await this._page.getByRole('button', {name: 'Continue'}).click();
    await this._page.getByRole('button', {name: 'Create questions'}).click();
  }

  /**
   * Load the page without accepting SNOMED license.
   */
  async loadHomePageWithLoincOnly() {
    await this.clearSession();
    await this.goToHomePage();
    await this.acceptLoincOnly();
  }


  /**
   * Visit home page and assert LForms, but do not deal with LOINC notice.
   */
  async goToHomePage() {
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
      route.fulfill({path: 'cypress/fixtures/snomedEditions.json'});
    });
  }

  /**
   * Load a table with data.
   * @param tableData - Data to load in the table.
   * @param table - Locator for the table.
   */
  async loadTable(table: Locator, tableData: string [][]) {
    for(let i = 0; i < tableData.length; i++) {
      for(let j = 0; j < tableData[i].length; j++) {
        const locator = table.locator(`tbody tr:nth-child(${i+1}) td:nth-child(${j+1}) input`);
        await expect(locator).toBeEditable({editable: true, timeout: 30000});
        await locator.fill(tableData[i][j]);
      }
      if(tableData.length - i > 1) {
        await table.locator('..').getByRole('button', {name: 'Add'}).click();
      }
    }
  }

}
