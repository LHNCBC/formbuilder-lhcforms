/**
 * Util functions for playwright scripts
 */

import {Page} from "@playwright/test";
import fhir from "fhir/r4";
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
   * Get questionnaire json from preview's JSON tab.
   *
   * @param page - Browser page
   * @param version - questionnaire json version.
   */
  static async getQuestionnaireJSON (page: Page, version: string): Promise<fhir.Questionnaire> {
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
}
