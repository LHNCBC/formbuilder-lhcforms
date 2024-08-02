/**
 * Util functions for playwright scripts
 */

import {Page} from "@playwright/test";

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
}
