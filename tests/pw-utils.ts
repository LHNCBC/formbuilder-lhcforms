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
    const testFile = path.join(__dirname, relativeFilePath);

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count()) {
      await fileInput.setInputFiles(testFile);
    } else {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Import' }).click();
      await page.getByRole('button', { name: 'Import from file...' }).click();

      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(testFile);
    }
    if(handleDialog) {
      const dialog = page.getByRole('dialog', { name: 'Replace existing form?' });
      await dialog.isVisible();
      await page.getByRole('button', { name: 'Continue' }).click();
    }
    return JSON.parse(await fs.readFile(testFile, 'utf-8'));
  }


  /**
   * Starts a new item-level form from scratch by selecting the appropriate radio button,
   * clicking through the UI, and waiting for the initial spinner to disappear.
   *
   * @param page - The Playwright Page instance to operate on.
   */
  static async openItemLevelFromScratch(page: Page) {
    await page.locator('input[type="radio"][value="scratch"]').click();
    await page.locator('button:has-text("Continue")').click();
    await PWUtils.getButton(page, 'Toolbar with button groups', 'Create questions').click();
    await expect(page.locator('.spinner-border')).not.toBeVisible({ timeout: 10000 });
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
   * @param exactMatch - If true, performs exact text match; otherwise partial match (default: true)
   */
  static async getTreeNode(page: Page, nodeText: string, exactMatch: boolean = true): Promise<Locator> {
    const tTip = page.locator('div[role="tooltip"]').filter({
      hasText: exactMatch ? new RegExp(`^${nodeText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) : nodeText
    });
    return page.locator(`div[aria-describedby="${await tTip.getAttribute('id')}"]`);
  }

  /**
   * Click the tree node identified by the text of the node.
   * @param page - Browser page
   * @param nodeText - Text of the node to match.
   * @param exactMatch - If true, performs exact text match; otherwise partial match (default: true)
   */
  static async clickTreeNode(page: Page, nodeText: string, exactMatch: boolean = true) {
    await (await PWUtils.getTreeNode(page, nodeText, exactMatch)).click();
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
   * Returns a Playwright Locator for a button by its label and/or accessible name.
   *
   * If a group label is provided, it first finds the element by label and then searches for the button within that context.
   * Otherwise, it searches for the button globally by its accessible name.
   *
   * @param page - The Playwright Page instance to search within.
   * @param label - The accessible label of the group or container (or null to search globally).
   * @param buttonLabel - The accessible name of the button to locate.
   * @returns {Locator} A Playwright Locator for the matching button.
   */
  static getButton(page: Page, label: string | null, buttonLabel: string): Locator {
    if (label) {
      return page.getByLabel(label).getByRole('button', { name: buttonLabel, exact: true });
    } else {
      return page.getByRole('button', { name: buttonLabel, exact: true });
    }
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
   *
   * @param id - The DOM id to match.
   * @returns {string} A CSS attribute selector string that matches id.
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

  /**
   * Get the input element using its label text.
   *
   * @param page - The Playwright Page instance to operate on.
   * @param parentSelector - The parent selector to search within.
   * @param label - The visible label for the input field.
   * @returns {Promise<Locator>} A promise that resolves to the Playwright Locator for the input element.
   */
  static async getByLabel(page: Page, parentSelector: string, label: string): Promise<Locator> {
    const labelElement = page.locator(parentSelector).locator(`label:has-text("${label}")`);
    const forAttr = await labelElement.getAttribute('for');
    if (!forAttr) throw new Error(`Label "${label}" has no 'for' attribute`);
    return page.locator(PWUtils.escapeIdForPlaywright(forAttr));
  }

  /**
   * Get the question text field from the item editor.
   *
   * @param page - The Playwright Page instance to operate on.
   * @returns {Promise<Locator>} A promise that resolves to the Playwright Locator for the input element.
   */
  static async getItemTextField(page: Page): Promise<Locator> {
    return PWUtils.getByLabel(page, 'lfb-ngx-schema-form', 'Question text');
  }


  /**
   * Get the data type field from the item editor.
   *
   * @param page - The Playwright Page instance to operate on.
   * @returns {Promise<Locator>} A promise that resolves to the Playwright Locator for the input element.
   */
  static async getItemTypeField(page: Page): Promise<Locator> {
    return PWUtils.getByLabel(page, 'lfb-ngx-schema-form', 'Data type');
  }

  /**
   * Expect the item type field to have the given value.
   * @param page - Browser page
   * @param expectedValue - Expected value or regex for the item type field
   */
  static async expectDataTypeValue(page: Page, expectedValue: string | RegExp): Promise<void> {
    const itemTypeField = await PWUtils.getItemTypeField(page);
    await expect(itemTypeField).toHaveValue(expectedValue);
  }

  /**
   * Get the data type field from the item editor.
   *
   * @param page - The Playwright Page instance to operate on.
   * @returns {Promise<Locator>} A promise that resolves to the Playwright Locator for the input element.
   */
  static async getItemEntryFormatField(page: Page): Promise<Locator> {
    return PWUtils.getByLabel(page, 'lfb-ngx-schema-form', 'Entry format');
  }

  /**
   * Command to select data type in item editor.
   */
  static async selectDataType(page: Page, type: string) {
    await (await PWUtils.getItemTypeField(page)).selectOption(type);
  }

  /**
   * Checks the Question Item Control UI logic for a given data type and verifies the visibility and content
   * of related UI elements based on the expected state for each step (question item control, answer list, repeat, etc).
   *
   * @param page - The Playwright Page instance to operate on.
   * @param type - The data type to select and test.
   * @param questionItemControlOptions - Expected options for the question item control (or null if not visible).
   * @param itemControlOptions - Expected options for the item control after answer list (or null if not visible).
   * @param itemControlOptionsAfterRepeat - Expected options after enabling repeat (or null if not visible).
   * @param itemControlOptionsAfterAnswerValueSet - Expected options after selecting answer value set (or null if not visible).
   * @returns {Promise<void>} Resolves when all UI checks and assertions are complete.
   */
  static async checkQuestionItemControlUI(
    page: Page,
    type: string,
    questionItemControlOptions: string[] | null,
    itemControlOptions: string[] | null,
    itemControlOptionsAfterRepeat: string[] | null,
    itemControlOptionsAfterAnswerValueSet: string[] | null
  ): Promise<void> {
    const createAnswerListLabel = 'Create answer list';
    const questionItemControlLabel = 'Question item control';
    const answerListLayoutLabel = 'Answer list layout';
    const repeatLabel = 'Allow repeating question?';

    const questionItemControlVisible = questionItemControlOptions !== null;
    const createAnswerListVisible = itemControlOptions !== null;
    const repeatVisible = itemControlOptionsAfterRepeat !== null;
    const answerValueSetOptionsVisible = itemControlOptionsAfterAnswerValueSet !== null;

    await PWUtils.selectDataType(page, type);

    const createAnswerListLabelEl = page.locator('lfb-label label').filter({ hasText: createAnswerListLabel });
    if (createAnswerListVisible) {
      await expect(createAnswerListLabelEl).toBeVisible();
    } else {
      await expect(createAnswerListLabelEl).toHaveCount(0);
    }

    if (createAnswerListVisible) {
      await (await PWUtils.getRadioButtonLabel(page, createAnswerListLabel, 'No')).click();
    }

    if (repeatVisible) {
      await (await PWUtils.getRadioButtonLabel(page, repeatLabel, 'Unspecified')).click();
    }

    const questionItemControlLabelEl = page.locator('lfb-label label').filter({ hasText: questionItemControlLabel });
    if (questionItemControlVisible) {
      await expect(questionItemControlLabelEl).toBeVisible();

      const itemControlQuestionInputs = page.locator('div#__\\$itemControlQuestion > div > input');
      await expect(itemControlQuestionInputs).toHaveCount(questionItemControlOptions!.length);
      for (let i = 0; i < questionItemControlOptions!.length; i++) {
        const label = itemControlQuestionInputs.nth(i).locator('xpath=following-sibling::label[1]');
        await expect(label).toContainText(questionItemControlOptions![i]);
      }
    } else {
      await expect(questionItemControlLabelEl).toHaveCount(0);
    }

    if (createAnswerListVisible) {
      await (await PWUtils.getRadioButtonLabel(page, createAnswerListLabel, 'Yes')).click();
      await expect(questionItemControlLabelEl).toHaveCount(0);

      const answerListLayoutLabelEl = page.locator('lfb-label label').filter({ hasText: answerListLayoutLabel });
      await expect(answerListLayoutLabelEl).toBeVisible();

      if (type === 'coding') {
        const noneMethod = page.locator('[id^="__\\$answerOptionMethods_none"]');
        await expect(noneMethod).toBeChecked();
        await (await PWUtils.getRadioButtonLabel(page, 'Answer list source', 'Answer options')).click();
      }

      const itemControlInputs = page.locator('div#__\\$itemControl > div > input');
      await expect(itemControlInputs).toHaveCount(itemControlOptions!.length);
      for (let i = 0; i < itemControlOptions!.length; i++) {
        const label = itemControlInputs.nth(i).locator('xpath=following-sibling::label[1]');
        await expect(label).toContainText(itemControlOptions![i]);
      }

      if (repeatVisible) {
        await (await PWUtils.getRadioButtonLabel(page, repeatLabel, 'Yes')).click();
        await expect(itemControlInputs).toHaveCount(itemControlOptionsAfterRepeat!.length);
        for (let i = 0; i < itemControlOptionsAfterRepeat!.length; i++) {
          const label = itemControlInputs.nth(i).locator('xpath=following-sibling::label[1]');
          await expect(label).toContainText(itemControlOptionsAfterRepeat![i]);
        }
      }

      if (answerValueSetOptionsVisible) {
        await page.locator('[for^="__\\$answerOptionMethods_snomed-value-set"]').click();
        await expect(itemControlInputs).toHaveCount(itemControlOptionsAfterAnswerValueSet!.length);
        for (let i = 0; i < itemControlOptionsAfterAnswerValueSet!.length; i++) {
          const label = itemControlInputs.nth(i).locator('xpath=following-sibling::label[1]');
          await expect(label).toContainText(itemControlOptionsAfterAnswerValueSet![i]);
        }
      }
    }
  }

  /**
   * Get a select element using its label text.
   * @param page - Browser page
   * @param parentSelector - The parent selector to search within.
   * @param label - The visible label for the select field
   * @returns {Promise<Locator>} A promise that resolves to the Playwright Locator for the input element.
   */
  static async getSelectByLabel(page: Page, parentSelector: string, label: string): Promise<Locator> {
    return PWUtils.getByLabel(page, parentSelector, label);
  }

  /**
   * Select an option by value for a select field identified by label text.
   * @param page - Browser page
   * @param parentSelector - The parent selector to search within.
   * @param label - The visible label for the select field
   * @param value - The option value to select
   */
  static async selectByLabel(page: Page, parentSelector: string, label: string, value: string): Promise<void> {
    await (await PWUtils.getSelectByLabel(page, parentSelector, label)).selectOption(value);
  }

  /**
   * Expect a select field identified by label text to have the given value.
   * @param page - Browser page
   * @param parentSelector - The parent selector to search within.
   * @param label - The visible label for the select field
   * @param expectedValue - Expected value or regex for the select field
   */
  static async expectSelectValue(
    page: Page,
    parentSelector: string,
    label: string,
    expectedValue: string | RegExp
  ): Promise<void> {
    const selectField = await PWUtils.getSelectByLabel(page, parentSelector, label);
    await expect(selectField).toHaveValue(expectedValue);
  }

  /**
   * Add an answer option row and populate its coding fields.
   * This will detect the current number of answer options and append the next index.
   *
   * @param page - Browser page
   * @param system - Coding system
   * @param display - Coding display
   * @param code - Coding code
   * @param score - Optional score
   */
  static async addAnswerOption(
    page: Page,
    system: string,
    display: string,
    code: string,
    score?: string | null
  ): Promise<void> {
    const rows = page.locator('lfb-answer-option table > tbody > tr');
    const existingCount = await rows.count();
    const index = existingCount - 1;

    await expect(rows).toHaveCount(index + 1);
    await expect(rows.nth(index)).toBeVisible();

    const baseSelector = `answerOption.${index}.valueCoding`;
    if (system != null) {
      const systemInput = page.locator(`[id^="${baseSelector}.system"]`);
      await systemInput.fill(String(system));
      await systemInput.press('Enter');
    }

    if (display != null) {
      const displayInput = page.locator(`[id^="${baseSelector}.display"]`);
      await displayInput.waitFor({ state: 'visible' });
      await PWUtils.fillDisplayField(displayInput, String(display));
    }

    if (code != null) {
      const codeInput = page.locator(`[id^="${baseSelector}.code"]`);
      await codeInput.fill(String(code));
      await codeInput.press('Enter');
    }

    if (score != null) {
      const scoreInput = page.locator(`[id^="${baseSelector}.__$score"]`);
      await scoreInput.fill(String(score));
      await scoreInput.press('Enter');
    }
  }

  /**
   * Adds multiple coding answer options to a form by filling in system, display, code, and score fields for each option.
   * Optionally clicks an add button after each entry.
   *
   * @param page - The Playwright Page instance to operate on.
   * @param addButton - Locator for the button to add a new answer option row (clicked after each entry).
   * @param codings - Array of coding objects, each with optional system, display, code, and __$score fields.
   */
  static async addCodingAnswerOptions(
    page: Page,
    addButton: Locator,
    codings: Array<{ system?: string; display?: string; code?: string; __$score?: number | string }>
  ) {
    for (let index = 0; index < codings.length; index++) {
      const coding = codings[index];
      const baseSelector = `answerOption.${index}.valueCoding`;
      if (coding.system != null) {
        const systemInput = page.locator(`[id^="${baseSelector}.system"]`);
        await systemInput.fill(String(coding.system));
        await systemInput.press('Enter');
      }
      if (coding.display != null) {
        const displayInput = page.locator(`[id^="${baseSelector}.display"]`);
        await displayInput.fill(String(coding.display));
        await displayInput.press('Enter');
      }
      if (coding.code != null) {
        const codeInput = page.locator(`[id^="${baseSelector}.code"]`);
        await codeInput.fill(String(coding.code));
        await codeInput.press('Enter');
      }
      if (coding.__$score != null) {
        const scoreInput = page.locator(`[id^="${baseSelector}.__\\$score"]`);
        await scoreInput.fill(String(coding.__$score));
        await scoreInput.press('Enter');
      }

      if (addButton) {
        await addButton.click();
      }
    }
  }

  /**
   * Fill the display field reliably (some widgets ignore plain fill()).
   *
   * @param locator - The Playwright Locator for the input field to fill.
   * @param value - The string value to enter into the field.
   * @returns {Promise<void>} Resolves when the field is filled and verified.
   */
  static async fillDisplayField(locator: Locator, value: string): Promise<void> {
    await locator.click({ position: { x: 5, y: 5 } });
    await locator.evaluate((el, val) => {
      const input = el as HTMLInputElement;
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.value = val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
    await expect(locator).toHaveValue(value);
  }

  /**
   * Expands the Item Variables section in the Expression Editor by clicking the arrow to reveal variables.
   *
   * @param page - The Playwright Page instance to operate on.
   */
  static async expandExpressionItemVariablesSection(page: Page) {
    const arrow = page.locator('#variables-section span.arrow');
    await expect(arrow).toBeVisible();
    await expect(arrow).toHaveText('›');
    await expect(arrow).toHaveCSS('transform', 'none');
    await arrow.click();
  }

  /**
   * Collapse the Item Variables section in the Expression Editor
   *
   * @param page - The Playwright Page instance to operate on.
   */
  static async collapseExpressionItemVariablesSection(page: Page) {
    const arrow = page.locator('#variables-section span.arrow');
    await expect(arrow).toBeVisible();
    await expect(arrow).toHaveText('›');
    await arrow.click();
  }


  /**
   * Handles selection in an autocomplete input field, including typing, clearing, and verifying results.
   *
   * @param page - The Playwright Page instance to operate on.
   * @param autocompleteSelector - Selector for the autocomplete input field.
   * @param clearBeforeTyping - Whether to clear the input before typing.
   * @param searchKeyword - The keyword to type into the autocomplete field.
   * @param expectedListSize - The expected number of autocomplete results (or null to skip check).
   * @param specialCharacterSequencesText - Array of special key sequences to send after typing.
   * @param expectedResultText - The expected value in the input after selection (or null if not checked).
   */
  static async selectAutocompleteOption(
    page: Page,
    autocompleteSelector: string,
    clearBeforeTyping: boolean,
    searchKeyword: string,
    expectedListSize: number | null,
    specialCharacterSequencesText: string[],
    expectedResultText: string | null
  ) {
    const input = page.locator(autocompleteSelector);

    if (clearBeforeTyping) {
      await input.clear();
    }

    if (searchKeyword) {
      await input.click();
      await input.pressSequentially(searchKeyword, {delay: 30});
    } else {
      await input.click();
    }

    const results = page.locator('#lhc-tools-searchResults tbody tr, #lhc-tools-searchResults ul li');

    if (typeof expectedListSize === 'number') {
      await expect(results).toHaveCount(expectedListSize);
    }

    const count = await results.count();
    if (count > 0 && specialCharacterSequencesText && specialCharacterSequencesText.length > 0) {
      for (const key of specialCharacterSequencesText) {
        await input.press(key);
      }
    }

    const hasExpectedListSize = typeof expectedListSize === 'number';

    if (searchKeyword && hasExpectedListSize && expectedListSize === 0) {
      await expect(input).toHaveClass(/no_match/);
      expect(expectedResultText == null).toBeTruthy();
    } else {
      if (hasExpectedListSize && expectedListSize > 0) {
        await expect(input).not.toHaveClass(/no_match/);
      }
      if (expectedResultText) {
        await expect(input).toHaveValue(expectedResultText);
      }
    }
  }

  /**
   * Selects one or more options from a multi-select autocomplete input, handling typing, clearing, and result verification.
   *
   * @param page - The Playwright Page instance to operate on.
   * @param autocompleteSelector - Selector for the autocomplete input field.
   * @param clearBeforeTyping - Whether to clear the input before typing.
   * @param searchKeyword - The keyword to type into the autocomplete field.
   * @param expectedListSize - The expected number of autocomplete results (or null to skip check).
   * @param specialCharacterSequencesText - Array of special key sequences to send after typing.
   * @param expectedResults - The expected selected value(s) after selection (string or array of strings).
   */
  static async selectAutocompleteOptions(
    page: Page,
    autocompleteSelector: string,
    clearBeforeTyping: boolean,
    searchKeyword: string,
    expectedListSize: number | null,
    specialCharacterSequencesText: string[],
    expectedResults: string | string[]
  ) {
    const input = page.locator(autocompleteSelector);

    if (clearBeforeTyping) {
      await input.clear();
    }

    if (searchKeyword) {
      await input.click();
      await input.pressSequentially(searchKeyword, {delay: 30});
    } else {
      await input.click();
    }

    const results = page.locator('#lhc-tools-searchResults tbody tr, #lhc-tools-searchResults ul li');

    if (typeof expectedListSize === 'number') {
      await expect(results).toHaveCount(expectedListSize);
    }

    const count = await results.count();
    if (count > 0 && specialCharacterSequencesText && specialCharacterSequencesText.length > 0) {
      for (const key of specialCharacterSequencesText) {
        await input.press(key);
      }
    }

    if (typeof expectedResults === 'string') {
      await expect(input).toHaveValue(expectedResults);
      return;
    }

    if (Array.isArray(expectedResults)) {
      const selectedList = page.locator('span.autocomp_selected');
      const selectedItems = selectedList.locator('ul > li');

      await expect(selectedList).toBeVisible();

      if (expectedResults.length === 0) {
        await expect(selectedItems).toHaveCount(0);
      } else {
        await expect(selectedItems).toHaveCount(expectedResults.length);
        for (let i = 0; i < expectedResults.length; i++) {
          await expect(selectedItems.nth(i)).toHaveText(expectedResults[i]);
        }
      }
    }
  }
}

