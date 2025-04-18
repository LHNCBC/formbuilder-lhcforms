/**
 * Util functions for playwright scripts
 */

import {Locator, Page} from "@playwright/test";
import fhir from "fhir/r4";
import path from "path";
import fs from "node:fs/promises";

/**
 * Class for playwright utilities.
 */
export class PWUtils {

  static helpTextExtension = [{
    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
    valueCodeableConcept: {
      text: 'Help-Button',
      coding: [{
        code: 'help',
        display: 'Help-Button',
        system: 'http://hl7.org/fhir/questionnaire-item-control'
      }]
    }
  }];

  /**
   * Capture Questionnaire JSON using internal code, by passing the UI actions.
   * Use for quick verification of JSON output to speed up the tests.
   * @return Promise of questionnaire JSON.
   */
  static async getQuestionnaireJSONWithoutUI(page: Page, format = 'R4'): Promise<any> {
    return await page.evaluate( (format) => {
      const app = window['appRef'];
      // app.tick();
      const basePageComponent = window['basePageComponent'];
      const form = basePageComponent.formValue;
      return basePageComponent.formService.convertFromR5(window['fbUtil'].convertToQuestionnaireJSON(form), format);
    }, format);
  }


  /**
   * Capture clipboard content
   * @param page - Context page.
   * @return Promise of content string.
   */
  static getClipboardContent(page: Page): Promise<string> {
    return page.evaluate('navigator.clipboard.readText()');
  }

  /**
   * Get questionnaire json from preview's JSON tab.
   *
   * @param page - Browser page
   * @param version - questionnaire json version.
   */
  static async getQuestionnaireJSON (page: Page, version = 'R4'): Promise<fhir.Questionnaire> {
    await page.getByRole('button', {name: 'Preview'}).click();
    await page.getByText('View/Validate Questionnaire JSON').click();
    await page.getByText(version + ' Version').click();
    await page.getByRole('button', {name: 'Copy questionnaire to clipboard'}).click();
    const ret = JSON.parse(await PWUtils.getClipboardContent(page)) as fhir.Questionnaire;
    await page.getByRole('button', {name: 'Close'}).click();
    return ret;
  }

  /**
   * Upload local file.
   *
   * @param page - Browser page.
   * @param relativeFilePath - Relative path of the uploading file.
   * @param handleDialog - Boolean to handle replace alert dialog.
   */
  static async uploadFile(page: Page, relativeFilePath: string, handleDialog = false): Promise<any> {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Import' }).click();
    await page.getByRole('button', { name: 'Import from file...' }).click();

    // Start waiting for file chooser before clicking.
    const fileChooser = await fileChooserPromise;
    const testFile = path.join(__dirname, relativeFilePath);
    await fileChooser.setFiles(testFile);
    if(handleDialog) {
      const dialog = page.getByRole('dialog', { name: 'Replace existing form?' });
      await dialog.isVisible();
      await page.getByRole('button', { name: 'Continue' }).click();
    }
    return JSON.parse(await fs.readFile(testFile, 'utf-8'));
  }

  /**
   * Wait for local storage to update.
   * @param page - Browser page
   * @param itemKey - window.localStorage item key.
   * @param valueSubStr - A sub string of item value to match.
   */
  static async waitUntilLocalStorageItemIsUpdated(page: Page, itemKey: string, valueSubStr: string) {
    await page.waitForFunction( ({key, match}) => {
      const storedValue = window.localStorage.getItem(key)
      return !!storedValue && storedValue.includes(match);
    }, {key: itemKey, match: valueSubStr}, {polling: 600});
  }

  /**
   * Get tree node identified by matching text of the node.
   * @param page - Browser page
   * @param nodeText - Text of the node to match
   */
  static async getTreeNode(page: Page, nodeText: string): Promise<Locator> {
    const tTip = page.locator('div[role="tooltip"]').filter({hasText: nodeText});
    return page.locator(`div[aria-describedby="${await tTip.getAttribute('id')}"]`);
  }

  /**
   * Click the tree node identified by the text of the node.
   * @param page - Browser page
   * @param nodeText - Text of the node to match.
   */
  static async clickTreeNode(page: Page, nodeText: string) {
    await (await PWUtils.getTreeNode(page, nodeText)).click();
  }

  /**
   * Click the tree node identified by the text of the node and toggle the expand/collapse status.
   * @param page - Browser page
   * @param nodeText - Text of the node to match.
   */
  static async clickAndToggleTreeNode(page: Page, nodeText: string) {
    const node = await PWUtils.getTreeNode(page, nodeText);
    await node.click();
    await node.locator(`../../../tree-node-expander`).click();
  }

  /**
   * Get a table cell locator.
   * @param table - Table locator.
   * @param row - Row number, indexed from 1.
   * @param column - Column number, indexed from 1
   * @return Locator - Table cell locator.
   */
  static getTableCell(table: Locator, row: number, column: number): Locator {
    return table.locator(`tbody tr:nth-child(${row}) > td:nth-child(${column})`);
  }

  /**
   * Read json file and return a promise of JSON object.
   * @param relativeFilePath - File path of the file.
   */
  static async readJSONFile(relativeFilePath: string): Promise<Object> {
    const testFile = path.join(__dirname, relativeFilePath);
    return JSON.parse(await fs.readFile(testFile, 'utf-8'));
  }
}
