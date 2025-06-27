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
    for(let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
      for(let colIndex = 0; colIndex < tableData[rowIndex].length; colIndex++) {
        const locator = table.locator(`tbody tr:nth-child(${rowIndex+1}) td:nth-child(${colIndex+1}) input`);
        await expect(locator).toBeEditable({editable: true, timeout: 30000});
        await locator.fill(tableData[rowIndex][colIndex]);
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
