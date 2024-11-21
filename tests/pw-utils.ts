/**
 * Util functions for playwright scripts
 */

import {Locator, Page} from "@playwright/test";
import path from "path";
import fs from "node:fs/promises";

/**
 * Class for playwright utilities.
 */
export class PWUtils {

  /**
   * Capture clipboard content
   * @param page - Context page.
   * @return Promise of content string.
   */
  static getClipboardContent(page: Page): Promise<string> {
    return page.evaluate('navigator.clipboard.readText()');
  }

  /**
   * Load a given questionnaire into form builder, and return json of file
   * content and loaded form json from preview.
   *
   * @param page - Browser page
   * @param qFilePath - File path of questionnaire relative to this folder.
   *
   * @return Promise<{fileJson, fbJson}>
   */
  static async loadFile(page: Page, qFilePath: string): Promise<any> {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByLabel('Start from scratch').click();
    await page.getByRole('button', {name: 'Continue'}).click();
    await page.getByRole('button', { name: 'Import' }).click();
    await page.getByRole('button', { name: 'Import from file...' }).click();
    const testFile = path.join(__dirname, qFilePath);
    const fileJson = JSON.parse(await fs.readFile(testFile, 'utf-8'));

    // Start waiting for file chooser before clicking.
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testFile);

    await page.getByRole('button', {name: 'Preview'}).click();
    await page.getByRole('tab', {name: 'View/Validate Questionnaire JSON'}).click();
    await page.getByRole('button', {name: 'Copy questionnaire to clipboard'}).click();
    const fbJson = JSON.parse(await PWUtils.getClipboardContent(page));
    return {fileJson, fbJson};
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
}
