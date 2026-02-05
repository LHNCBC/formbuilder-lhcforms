/**
 * Util functions for playwright scripts
 */

import {Locator, Page, expect} from "@playwright/test";
import fhir from "fhir/r4";
import path from "path";
import fs from "node:fs/promises";

export type ExpressionInput =
  | { kind: 'text'; selector: string; value: string }
  | { kind: 'autocomplete'; selector: string; search: string }
  | { kind: 'dropdown'; selector: string; search: string }
  | { kind: 'none' };

export interface VariableTestCase {
  name: string;
  label: string;
  type: string;
  input: ExpressionInput;
  expectedType: string;
  expectedValue: string;
}

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
   * Upload a local file.
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
   * @param valueSubStr - A substring of item value to match.
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
   * Get a table cell's input.
   * @param table - Table locator.
   * @param row - Row number, indexed from 1.
   * @param column - Column number, indexed from 1
   * @return Locator - Input locator.
   */
  static getTableCellInput(table: Locator, row: number, column: number): Locator {
    return PWUtils.getTableCell(table, row, column).locator(`input`);
  }

  /**
   * Read a JSON file and return a promise of JSON object.
   * @param relativeFilePath - File path of the file.
   */
  static async readJSONFile(relativeFilePath: string): Promise<Object> {
    const testFile = path.join(__dirname, relativeFilePath);
    return JSON.parse(await fs.readFile(testFile, 'utf-8'));
  }

  /**
   * Get a table by field label.
   * @param locator - Locator of the ancestral element, to constrain the search.
   * @param label - Label text of the field.
   * @return Locator - Table locator.
   */
  static getTableByFieldLabel(locator: Locator, label: string): Locator {
    return locator.getByText(label, {exact: true}).locator('xpath=../../following-sibling::div[1]/table');
  }

  /**
   * Get a radio button identified by the label of the group and the label of the radio button.
   *
   * Use a radio input element to make assertions on input status, such as selected or not. It is not
   * suitable for mouse actions as it is hidden from a mouse-pointer, instead use its label to perform
   * mouse actions.
   * @param page - Browser page
   * @param groupLabel - The visible label identifying the radio group
   * @param radioLabel - The visible label of the desired radio button
   * @returns A Playwright Locator for the matching radio button label
   */
  static async getRadioButton(page: Page, groupLabel: string, radioLabel: string): Promise<Locator> {
    // assumes you already have a helper that finds the label
    const label = await PWUtils.getRadioButtonLabel(page, groupLabel, radioLabel);

    const id = await label.getAttribute('for');
    expect(id).not.toBeNull();

    const radio = page.locator(PWUtils.escapeIdForPlaywright(id));
    await expect(radio).toHaveAttribute('type', 'radio');

    return radio;
  }

  /**
   * Get the label of radio input identified by the label of the field and the label of the radio button.
   * @param page - Browser page
   * @param fieldLabel - The visible label identifying the radio group
   * @param radioLabel - The visible label of the desired radio button
   * @returns A Playwright Locator for the matching radio button label
   */
  static async getRadioButtonLabel(page: Page, fieldLabel: string, radioLabel: string): Promise<Locator> {
    const fieldLabelEl = page.locator('lfb-label label').filter({ hasText: fieldLabel });

    await expect(fieldLabelEl).toBeVisible();

    const radioGroup = fieldLabelEl.locator('..').locator('xpath=following-sibling::*[1]');

    const radioLabelEl = radioGroup.locator('label').filter({ hasText: radioLabel });

    await expect(radioLabelEl).toBeVisible();

    return radioLabelEl;
  }

  /**
   * Expands the Advanced fields panel by clicking the down-angle icon
   * inside the "Advanced fields" button.
   *
   * @param page - The Playwright Page instance.
   */
  static async expandAdvancedFields(page: Page): Promise<void> {
    const button = page.getByRole('button', { name: 'Advanced fields' });
    const expandIcon = button.locator('svg.fa-angle-down');

    await expect(expandIcon).toBeVisible();
    await expandIcon.click();
  }

  /**
   * Collapses the Advanced fields panel by clicking the up-angle icon
   * inside the "Advanced fields" button.
   *
   * @param page - The Playwright Page instance.
   */
  static async collapseAdvancedFields(page: Page): Promise<void> {
    const button = page.getByRole('button', { name: 'Advanced fields' });
    const collapseIcon = button.locator('svg.fa-angle-up');

    await expect(collapseIcon).toBeVisible();
    await collapseIcon.click();
  }

  /**
   * Escapes a DOM element ID so it can be safely used in a Playwright CSS selector.
   */
  static escapeIdForPlaywright(id: string): string {
    return `[id="${id}"]`;
  }

  /**
   * Creates a single item variable in the expression editor.
   *
   * This function opens the "Create/edit variables" dialog, fills in the variable
   * label and type, handles the expression input based on its kind
   * (text, autocomplete, dropdown, or none), saves the variable, and verifies
   * that it appears correctly in the variables table.
   *
   * @param {Page} page - The Playwright Page object to interact with the UI.
   * @param {VariableTestCase} test - The test case defining the variable's
   *        name, label, type, input details, and expected values for verification.
   */
  static async createSingleVariable(
    page: Page,
    test: VariableTestCase
  ) {
    await page.getByRole('button', {
      name: 'Create/edit variables',
      exact: true,
    }).click();

    const shadow = page.locator('lhc-expression-editor');

    await expect(
      shadow.locator('#expression-editor-base-dialog')
    ).toBeVisible();

    // Add variable
    await shadow.locator('#add-variable').click();
    await shadow.locator('#variable-label-0').fill(test.label);
    await shadow.locator('#variable-type-0').selectOption(test.type);

    // Expression input (type-dependent)
    switch (test.input.kind) {
      case 'text': {
        const input = shadow.locator(test.input.selector);
        await input.fill(test.input.value);
        await expect(input).not.toHaveClass(/field-error/);
        break;
      }

      case 'autocomplete': {
        const input = shadow.locator(test.input.selector);
        await input.fill(test.input.search);
        await input.press('ArrowDown');
        await input.press('Enter');
        break;
      }

      case 'dropdown': {
        const input = shadow.locator(test.input.selector);
        await input.fill(test.input.search);
        break;
      }

      case 'none':
        break;
    }

    // Save
    await shadow.locator('#export').click();

    // Verify table
    const row = page.locator('lfb-variable table > tbody > tr').first();

    await expect(row.locator('td').nth(0)).toHaveText(test.label);
    await expect(row.locator('td').nth(1)).toHaveText(test.expectedType);
    await expect(row.locator('td').nth(2)).toHaveText(test.expectedValue);
  }
}
