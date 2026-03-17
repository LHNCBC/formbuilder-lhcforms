/**
 * Util functions for playwright scripts
 */

import { Locator, Page, expect } from "@playwright/test";
import { JsonPointer } from "json-ptr";
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
    await PWUtils.clickMenuBarDropdownItem(page, 'Import', 'Import from file...');

    // Start waiting for file chooser before clicking.
    const fileChooser = await fileChooserPromise;
    const testFile = path.join(__dirname, 'fixtures', relativeFilePath);
    await fileChooser.setFiles(testFile);
    if(handleDialog) {
      const dialog = page.getByRole('dialog', { name: 'Replace existing form?' });
      await dialog.isVisible();
      await page.getByRole('button', { name: 'Continue' }).click();
    }
    return JSON.parse(await fs.readFile(testFile, 'utf-8'));
  }

  /**
   * Import a local file by setting the file input directly.
   * Mirrors Cypress uploadFile behavior with optional warning handling.
   * This is mainly using by the form-level.spec.ts
   *
   * @param page - Browser page.
   * @param relativeFilePath - Relative path of the uploading file.
   * @param handleWarning - Boolean to handle replace alert dialog.
   */
  static async importLocalFile(page: Page, relativeFilePath: string, handleWarning = false): Promise<any> {
    const testFile = path.join(__dirname, 'fixtures', relativeFilePath);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);

    if (handleWarning) {
      await PWUtils.clickDialogButton(page, { title: 'Replace existing form?' }, 'Continue');
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
  static async readJSONFile(relativeFilePath: string): Promise<any> {
    const testFile = path.join(__dirname, 'fixtures', relativeFilePath);
    return JSON.parse(await fs.readFile(testFile, 'utf-8'));
  }

  /**
   * Delete a downloads folder (Playwright-friendly replacement for CypressUtil.deleteDownloadsFolder).
   * @param downloadsDir - Absolute path to the downloads directory.
   * @param ignoreIfNotExist - If true, ignore missing folder errors.
   */
  static async deleteDownloadsFolder(downloadsDir: string, ignoreIfNotExist = true): Promise<void> {
    try {
      await fs.rm(downloadsDir, { recursive: true, force: ignoreIfNotExist });
    } catch (error) {
      if (!ignoreIfNotExist) {
        throw error;
      }
    }
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

  // ---------------------------------- Button ----------------------------------

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
   * Click a button by label/name with optional spinner wait and timeout guards.
   *
   * @param page - The Playwright Page instance.
   * @param label - Optional accessible label for a button group/container; pass null to search globally.
   * @param buttonLabel - The accessible name of the button to click.
   * @param options - Optional settings for timeout, spinner wait behavior, and fallback behavior.
   * @returns Promise that resolves after the click completes.
   */
  static async clickButton(
    page: Page,
    label: string | null,
    buttonLabel: string,
    options?: { timeout?: number; waitForSpinner?: boolean; fallbackToGlobal?: boolean }
  ): Promise<void> {
    const timeout = options?.timeout ?? 40000;
    const waitForSpinner = options?.waitForSpinner ?? true;
    const fallbackToGlobal = options?.fallbackToGlobal ?? false;

    let button: Locator;
    if (label) {
      const container = page.getByLabel(label);
      if (fallbackToGlobal) {
        // Fallback enabled: try the labeled container first, then global if needed.
        if (await container.count()) {
          const scopedButton = container.getByRole('button', { name: buttonLabel, exact: true });
          if (await scopedButton.count()) {
            // Container exists and contains the button.
            button = scopedButton;
          } else {
            // Container exists but doesn't contain the button; fall back to global lookup.
            button = page.getByRole('button', { name: buttonLabel, exact: true });
          }
        } else {
          // Container not found; fall back to global lookup.
          button = page.getByRole('button', { name: buttonLabel, exact: true });
        }
      } else {
        // Fallback disabled: only search within the labeled container.
        button = container.getByRole('button', { name: buttonLabel, exact: true });
      }
    } else {
      // No label provided: search globally for the button.
      button = page.getByRole('button', { name: buttonLabel, exact: true });
    }

    await expect(button).toBeVisible({ timeout });
    await expect(button).toBeEnabled({ timeout });

    if (waitForSpinner) {
      const spinner = page.locator('.spinner-border');
      await expect(spinner).not.toBeVisible({ timeout });
    }

    await button.click({ timeout });
  }

  // ---------------------------------- Menu Bar ----------------------------------

  /**
   * Get the menu bar navigation element.
   *
   * @param page - The Playwright Page instance.
   * @returns {Locator} A Playwright Locator for the menu bar navigation.
   */
  static getMenuBar(page: Page): Locator {
    return page.getByRole('navigation', { name: 'Menu bar' });
  }

  /**
   * Get a dropdown group in the menu bar by its aria-label (e.g., "Export menu").
   *
   * @param page - The Playwright Page instance.
   * @param menuLabel - The aria-label of the dropdown group.
   * @returns {Locator} A Playwright Locator for the dropdown group.
   */
  static getMenuBarDropdownGroup(page: Page, menuLabel: string): Locator {
    return PWUtils.getMenuBar(page).getByRole('group', { name: menuLabel, exact: true });
  }

  /**
   * Click a menu bar dropdown toggle by menu label (e.g., "Export" or "Import").
   *
   * @param page - The Playwright Page instance.
   * @param menuLabel - The visible dropdown toggle text.
   * @returns Promise that resolves after the click completes.
   */
  static async clickMenuBarDropdown(page: Page, menuLabel: string): Promise<void> {
    await PWUtils.getMenuBar(page).getByRole('button', { name: menuLabel, exact: true }).click();
  }

  /**
   * Get an item inside a menu bar dropdown.
   *
   * @param page - The Playwright Page instance.
   * @param menuLabel - The visible dropdown toggle text (e.g., "Export" or "Import").
   * @param itemLabel - The visible label of the dropdown item to locate.
   * @returns {Promise<Locator>} A promise that resolves to the matching dropdown item.
   */
  static async getMenuBarDropdownItem(
    page: Page,
    menuLabel: string,
    itemLabel: string
  ): Promise<Locator> {
    const menuBar = PWUtils.getMenuBar(page);
    const menuButton = menuBar.getByRole('button', { name: menuLabel, exact: true });
    await menuButton.click();

    const dropdown = menuButton.locator('xpath=following-sibling::div[contains(@class, "dropdown-menu")]');
    await expect(dropdown).toBeVisible();

    const menuItem = dropdown.getByRole('menuitem', { name: itemLabel, exact: true });
    if (await menuItem.count()) {
      return menuItem;
    }

    return dropdown.getByRole('button', { name: itemLabel, exact: true });
  }

  /**
   * Get an item inside a menu bar dropdown.
   *
   * @param page - The Playwright Page instance.
   * @param menuLabel - The visible dropdown toggle text (e.g., "Export" or "Import").
   * @param itemLabel - The visible label of the dropdown item to locate.
   * @returns {Promise<Locator>} A promise that resolves to the matching dropdown item.
   */
  static async getMenuBarDropDownItem(
    page: Page,
    menuLabel: string,
    itemLabel: string
  ): Promise<Locator> {
    return PWUtils.getMenuBarDropdownItem(page, menuLabel, itemLabel);
  }

  /**
   * Click an item inside a menu bar dropdown.
   *
   * @param page - The Playwright Page instance.
   * @param menuLabel - The visible dropdown toggle text (e.g., "Export" or "Import").
   * @param itemLabel - The visible label of the dropdown item to click.
   * @returns Promise that resolves after the click completes.
   */
  static async clickMenuBarDropdownItem(
    page: Page,
    menuLabel: string,
    itemLabel: string
  ): Promise<void> {
    const menuItem = await PWUtils.getMenuBarDropdownItem(page, menuLabel, itemLabel);
    await menuItem.click();
  }

  /**
   * Get a menu bar button by its visible text.
   *
   * @param page - The Playwright Page instance.
   * @param buttonLabel - The visible label of the menu bar button.
   * @returns {Locator} A Playwright Locator for the matching menu bar button.
   */
  static getMenuBarButton(page: Page, buttonLabel: string): Locator {
    return PWUtils.getMenuBar(page).getByRole('button', { name: buttonLabel, exact: true });
  }

  /**
   * Click a menu bar button by its visible text.
   *
   * @param page - The Playwright Page instance.
   * @param buttonLabel - The visible label of the menu bar button.
   * @returns Promise that resolves after the click completes.
   */
  static async clickMenuBarButton(page: Page, buttonLabel: string): Promise<void> {
    await PWUtils.getMenuBarButton(page, buttonLabel).click();
  }

  // ---------------------------------- More Options Dropdown ----------------------------------

  /**
   * Get an item from the "More options" dropdown menu by its visible label.
   *
   * @param page - The Playwright Page instance.
   * @param itemLabel - The visible label of the dropdown item to locate.
   * @param options - Optional settings to scope the toggle and control auto-opening.
   * @returns {Promise<Locator>} A promise that resolves to the matching dropdown item.
   */
  static async getMoreOptionsDropdownItem(
    page: Page,
    itemLabel: string,
    options?: { scope?: Locator; openIfNeeded?: boolean }
  ): Promise<Locator> {
    const openIfNeeded = options?.openIfNeeded ?? true;
    const openDropdowns = page.locator('div.dropdown-menu.show');

    if (openIfNeeded && !(await openDropdowns.count())) {
      const scopedToggle = options?.scope
        ? options.scope.locator('button[mattooltip="More options"], button.dropdown-toggle')
        : page.locator(
            'div.node-content-wrapper-active button[mattooltip="More options"], div.node-content-wrapper-active button.dropdown-toggle, button[mattooltip="More options"], button.dropdown-toggle'
          );
      const toggle = scopedToggle.first();
      await expect(toggle).toBeVisible();
      await toggle.click();
    }

    const dropdown = page.locator('div.dropdown-menu.show');
    await expect(dropdown).toBeVisible();

    return dropdown.getByRole('menuitem', { name: itemLabel, exact: true }).first();
  }

  /**
   * Click an item in the "More options" dropdown menu by its visible label.
   *
   * @param page - The Playwright Page instance.
   * @param itemLabel - The visible label of the dropdown item to click.
   * @returns Promise that resolves after the click completes.
   */
  static async clickMoreOptionsDropdownItem(
    page: Page,
    itemLabel: string,
    options?: { scope?: Locator; openIfNeeded?: boolean }
  ): Promise<void> {
    const menuItem = await PWUtils.getMoreOptionsDropdownItem(page, itemLabel, options);
    await menuItem.click();
  }

  // ---------------------------------- Modal Dialog ----------------------------------

  /**
   * Get a dialog locator by selector or by visible title text.
   *
   * @param page - The Playwright Page instance.
   * @param options - Dialog selector or title text.
   * @returns {Locator} The dialog locator.
   */
  static getDialog(
    page: Page,
    options: { selector?: string; title?: string; footerSelector?: string }
  ): Locator {
    const { selector, title } = options;
    if (selector) {
      return page.locator(selector);
    }
    if (title) {
      return page.locator('ngb-modal-window').first().filter({ hasText: title });
    }
    throw new Error('getDialog requires either a selector or a title.');
  }

  /**
   * Get the text content of a preformatted response inside a dialog body.
   *
   * @param page - The Playwright Page instance.
   * @param options - Dialog selector or title text.
   * @param preSelector - Selector for the pre element within the modal body.
   * @returns {Promise<string | null>} A promise that resolves to the preformatted text content.
   */
  static async getDialogBodyPreTextContent(
    page: Page,
    options: { selector?: string; title?: string; footerSelector?: string },
    preSelector = 'pre.fhir-response'
  ): Promise<string | null> {
    const dialog = PWUtils.getDialog(page, options);
    await expect(dialog).toBeVisible();
    return dialog.locator('div.modal-body').locator(preSelector).textContent();
  }

  /**
   * Get a button from a dialog footer by label.
   *
   * @param page - The Playwright Page instance.
   * @param options - Dialog selector or title text.
   * @param buttonLabel - The button label to locate.
   * @returns {Promise<Locator>} A promise that resolves to the matching dialog footer button.
   */
  static async getDialogButton(
    page: Page,
    options: { selector?: string; title?: string; footerSelector?: string },
    buttonLabel: string
  ): Promise<Locator> {
    const dialog = PWUtils.getDialog(page, options);
    await expect(dialog).toBeVisible();
    const footerSelectors = options.footerSelector
      ? [options.footerSelector]
      : ['div.modal-footer', 'mat-dialog-actions'];

    for (const selector of footerSelectors) {
      const footer = dialog.locator(selector);
      if (await footer.count()) {
        return footer.getByRole('button', { name: buttonLabel, exact: true });
      }
    }

    throw new Error(`No dialog footer found for button: ${buttonLabel}`);
  }

  /**
   * Click a dialog footer button by label.
   *
   * @param page - The Playwright Page instance.
   * @param options - Dialog selector or title text.
   * @param buttonLabel - The button label to click.
   * @returns Promise that resolves after the click completes.
   */
  static async clickDialogButton(
    page: Page,
    options: { selector?: string; title?: string; footerSelector?: string },
    buttonLabel: string
  ): Promise<void> {
    const button = await PWUtils.getDialogButton(page, options, buttonLabel);
    await expect(button).toBeVisible({ timeout: 10000 });
    await expect(button).toBeEnabled({ timeout: 10000 });
    await button.click({ timeout: 10000 });
  }

  // ---------------------------------- Radio Button ----------------------------------

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
   * Click a radio button by its group label and option label.
   *
   * @param page - The Playwright Page instance.
   * @param groupLabel - The visible label identifying the radio group.
   * @param radioLabel - The visible label of the radio option to click.
   * @returns Promise that resolves after the click completes.
   */
  static async clickRadioButton(page: Page, groupLabel: string, radioLabel: string): Promise<void> {
    await (await PWUtils.getRadioButtonLabel(page, groupLabel, radioLabel)).click();
  }

  /**
   * Assert that a radio option is checked by group label and option label.
   *
   * @param page - The Playwright Page instance.
   * @param groupLabel - The visible label identifying the radio group.
   * @param radioLabel - The visible label of the radio option to validate.
   * @returns Promise that resolves after the assertion completes.
   */
  static async expectRadioChecked(page: Page, groupLabel: string, radioLabel: string): Promise<void> {
    await expect(await PWUtils.getRadioButton(page, groupLabel, radioLabel)).toBeChecked();
  }

  /**
   * Assert that a radio option is not checked by group label and option label.
   *
   * @param page - The Playwright Page instance.
   * @param groupLabel - The visible label identifying the radio group.
   * @param radioLabel - The visible label of the radio option to validate.
   * @returns Promise that resolves after the assertion completes.
   */
  static async expectRadioNotChecked(page: Page, groupLabel: string, radioLabel: string): Promise<void> {
    await expect(await PWUtils.getRadioButton(page, groupLabel, radioLabel)).not.toBeChecked();
  }

  // --------------------------------------------------------------------


  /**
   * Clicks a FHIR export menu item and returns the parsed JSON response from the export dialog.
   * Handles both dropdown menu and direct menu button patterns.
   *
   * @param page - The Playwright Page instance.
   * @param menuText - The export menu item label to click.
   * @param serverBaseUrl - Optional server base URL for Create flows.
   */
  static async getFHIRServerResponse(
    page: Page,
    menuText: string,
    serverBaseUrl = 'https://lforms-fhir.nlm.nih.gov/baseR4'
  ): Promise<any> {
    const menuTextRe = new RegExp(menuText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    await PWUtils.clickMenuBarDropdown(page, 'Export');

    const dropdown = page.locator('div.dropdown-menu.show');
    try {
      await dropdown.waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      // Fallback if menu is rendered differently.
    }

    if (await dropdown.count()) {
      const menuItem = dropdown.getByRole('menuitem', { name: menuTextRe });
      if (await menuItem.count()) {
        await menuItem.first().click();
      } else {
        const menuButton = dropdown.getByRole('button', { name: menuTextRe });
        await expect(menuButton).toBeVisible();
        await menuButton.first().click();
      }
    } else {
      const menuButton = page.getByRole('button', { name: menuTextRe });
      await expect(menuButton).toBeVisible();
      await menuButton.first().click();
    }

    if (menuText.startsWith('Create')) {
      const serverOption = page.locator(PWUtils.escapeIdForPlaywright(serverBaseUrl));
      await expect(serverOption).toBeVisible();
      await serverOption.click();
      await page.locator('lfb-fhir-servers-dlg').getByRole('button', { name: 'Continue' }).click();
    }

    const responseText = await PWUtils.getDialogBodyPreTextContent(
      page,
      { selector: 'lfb-fhir-export-dlg' },
      'pre.fhir-response'
    );
    await PWUtils.clickDialogButton(page, { selector: 'lfb-fhir-export-dlg' }, 'Close');

    return JSON.parse(responseText || '{}');
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

    // Be resilient to UI variants: icon may be missing or swapped in different layouts.
    if (await collapseIcon.count()) {
      await expect(collapseIcon).toBeVisible();
      await collapseIcon.click();
      return;
    }

    const expandIcon = button.locator('svg.fa-angle-down');
    if (await expandIcon.count()) {
      return;
    }

    await expect(button).toBeVisible();
    await button.click();

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
    return page.locator('lfb-ngx-schema-form').getByLabel('Question text', { exact: true });
  }


  /**
   * Get the data type field from the item editor.
   *
   * @param page - The Playwright Page instance to operate on.
   * @returns {Promise<Locator>} A promise that resolves to the Playwright Locator for the input element.
   */
  static async getItemTypeField(page: Page): Promise<Locator> {
    return page.locator('lfb-ngx-schema-form').getByLabel('Data type', { exact: true });
  }

  /**
   * Get the selected data type text from the item editor.
   *
   * @param page - The Playwright Page instance to operate on.
   * @returns {Promise<string>} The selected option text.
   */
  static async getItemType(page: Page): Promise<string> {
    const selectField = await PWUtils.getItemTypeField(page);
    const selected = selectField.locator('option:checked');
    const text = (await selected.textContent()) || '';
    return text.trim();
  }



  /**
   * Expect the item type field to have the given value.
   * @param page - Browser page
   * @param expectedValue - Expected value or regex for the item type field
   * @returns Promise that resolves after the assertion completes.
   */
  static async expectDataTypeValue(page: Page, expectedValue: string | RegExp): Promise<void> {
    const itemTypeField = await PWUtils.getItemType(page);
    const labelText = 'Data type';
    const parentSelector = 'lfb-ngx-schema-form';
    const pollValue = async () => {
      try {
        const labelElement = page.locator(parentSelector).locator(`label:has-text("${labelText}")`);
        const forAttr = await labelElement.getAttribute('for');
        if (!forAttr) return null;
        const input = page.locator(PWUtils.escapeIdForPlaywright(forAttr));
        if (!(await input.count())) return null;
        return await input.inputValue();
      } catch {
        return null;
      }
    };

    if (expectedValue instanceof RegExp) {
      await expect.poll(pollValue).toMatch(expectedValue);
    } else {
      await expect.poll(pollValue).toBe(expectedValue);
    }
  }


  /**
   * Get the data type field from the item editor.
   *
   * @param page - The Playwright Page instance to operate on.
   * @returns {Promise<Locator>} A promise that resolves to the Playwright Locator for the input element.
   */
  static async getItemEntryFormatField(page: Page): Promise<Locator> {
    return page.locator('lfb-ngx-schema-form').getByLabel('Entry format', { exact: true });
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
      await PWUtils.clickRadioButton(page, createAnswerListLabel, 'No');
    }

    if (repeatVisible) {
      await PWUtils.clickRadioButton(page, repeatLabel, 'Unspecified');
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
      await PWUtils.clickRadioButton(page, createAnswerListLabel, 'Yes');
      await expect(questionItemControlLabelEl).toHaveCount(0);

      const answerListLayoutLabelEl = page.locator('lfb-label label').filter({ hasText: answerListLayoutLabel });
      await expect(answerListLayoutLabelEl).toBeVisible();

      if (type === 'coding') {
        const noneMethod = page.locator('[id^="__\\$answerOptionMethods_none"]');
        await expect(noneMethod).toBeChecked();
        await PWUtils.clickRadioButton(page, 'Answer list source', 'Answer options');
      }

      const itemControlInputs = page.locator('div#__\\$itemControl > div > input');
      await expect(itemControlInputs).toHaveCount(itemControlOptions!.length);
      for (let i = 0; i < itemControlOptions!.length; i++) {
        const label = itemControlInputs.nth(i).locator('xpath=following-sibling::label[1]');
        await expect(label).toContainText(itemControlOptions![i]);
      }

      if (repeatVisible) {
        await PWUtils.clickRadioButton(page, repeatLabel, 'Yes');
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
    system?: string | null,
    display?: string | null,
    code?: string | null,
    score?: string | number | null
  ): Promise<void> {
    const rows = page.locator('lfb-answer-option table > tbody > tr');
    const existingCount = await rows.count();
    const index = existingCount - 1;

    await expect(rows).toHaveCount(index + 1);
    await expect(rows.nth(index)).toBeVisible();

    const baseSelector = `answerOption.${index}.valueCoding`;
    if (system != null) {
      const systemInput = page.locator(`[id^="${baseSelector}.system"]`);
      await systemInput.pressSequentially(String(system));
      await systemInput.press('Enter');
    }

    if (display != null) {
      const displayInput = page.locator(`[id^="${baseSelector}.display"]`);
      await displayInput.waitFor({ state: 'visible' });
      await PWUtils.fillDisplayField(displayInput, String(display));
    }

    if (code != null) {
      const codeInput = page.locator(`[id^="${baseSelector}.code"]`);
      await codeInput.pressSequentially(String(code));
      await codeInput.press('Enter');
    }

    if (score != null) {
      const scoreInput = page.locator(`[id^="${baseSelector}.__$score"]`);
      await scoreInput.pressSequentially(String(score));
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
    codings: Array<{ system?: string; display?: string; code?: string; score?: number | string; __$score?: number | string }>
  ) {
    for (let index = 0; index < codings.length; index++) {
      const coding = codings[index];
      const score = coding.__$score ?? coding.score;

      await PWUtils.addAnswerOption(page, coding.system, coding.display, coding.code, score);

      if (addButton && index < codings.length - 1) {
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
      await input.pressSequentially(searchKeyword);
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
      await input.pressSequentially(searchKeyword);
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


  /**
   * Validate valueCoding fields (system/display/code) for a given key and index,
   * optionally validating the score when provided.
   *
   * @param page - The Playwright Page instance.
   * @param key - The id prefix key (e.g., "answerOption", "initial", "__\$units").
   * @param index - The row/index used in the id prefix.
  * @param system - Expected system value. Use undefined to assert empty, null to skip.
  * @param display - Expected display value. Use undefined to assert empty, null to skip.
  * @param code - Expected code value. Use undefined to assert empty, null to skip.
  * @param score - Optional expected score value. Use undefined to assert empty, null to skip.
   * @returns Promise that resolves when all expectations are satisfied.
   */
  static async expectValueCoding(
    page: Page,
    key: string,
    index: number,
    system?: string | null,
    display?: string | null,
    code?: string | null,
    score?: string | number | null
  ): Promise<void> {
    const assertValue = async (selector: string, value: string | number | undefined | null) => {
      if (value === null) {
        return;
      }
      const locator = page.locator(selector);
      if (value === '' || value === undefined) {
        if (!(await locator.count())) {
          return;
        }
        await expect(locator).toBeEmpty();
      } else {
        await expect(locator).toHaveValue(String(value));
      }
    };

    await assertValue(`[id^="${key}.${index}.valueCoding.system"]`, system);
    await assertValue(`[id^="${key}.${index}.valueCoding.display"]`, display);
    await assertValue(`[id^="${key}.${index}.valueCoding.code"]`, code);
    await assertValue(`[id^="${key}.${index}.valueCoding.__\$score"]`, score);
  }

  /**
   * Validate valueCoding fields for multiple rows using an array of codings.
   * The index is derived from the array order.
   *
   * @param page - The Playwright Page instance.
   * @param key - The id prefix key (e.g., "answerOption", "initial", "__\$units").
   * @param codings - Array of coding objects to validate in order.
   * @returns Promise that resolves when all expectations are satisfied.
   */
  static async expectValueCodings(
    page: Page,
    key: string,
    codings: Array<{ system?: string | null; display?: string | null; code?: string | null; score?: string | number | null }>
  ): Promise<void> {
    for (let index = 0; index < codings.length; index++) {
      const coding = codings[index];
      await PWUtils.expectValueCoding(
        page,
        key,
        index,
        coding.system,
        coding.display,
        coding.code,
        coding.score
      );
    }
  }

  /**
   * Assert a value in the Questionnaire JSON using a JSON Pointer.
   *
   * @param page - The Playwright Page instance.
   * @param jsonPointer - JSON Pointer path to the target value.
   * @param expectedValue - The expected value at the JSON Pointer path.
   * @param version - Questionnaire version to generate (default: R5).
   * @returns Promise that resolves after the assertion completes.
   */
  static async assertValueInQuestionnaire (
    page: Page,
    jsonPointer: string,
    expectedValue: unknown,
    version: 'R5' | 'R4' | 'STU3' = 'R5'
  ) {
    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, version);
    const actual = JsonPointer.get(qJson, jsonPointer);
    expect(actual).toEqual(expectedValue);
  };

  /**
   * Assert extensions in the Questionnaire JSON that match a given URL.
   *
   * @param page - The Playwright Page instance.
   * @param extensionPtr - JSON Pointer path to the extensions array.
   * @param extUrl - Extension URL to match.
   * @param expectedValue - Expected array of matching extensions.
   * @param version - Questionnaire version to generate (default: R5).
   * @returns Promise that resolves after the assertion completes.
   */
  static async assertExtensionsInQuestionnaire (
    page: Page,
    extensionPtr: string,
    extUrl: string,
    expectedValue: unknown,
    version: 'R5' | 'R4' | 'STU3' = 'R5'
  ) {
    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, version);
    const extensions = (JsonPointer.get(qJson, extensionPtr) as Array<{ url: string }> | undefined) || [];
    const matched = extensions.filter((ext) => ext.url === extUrl);
    expect(matched).toEqual(expectedValue);
  };


  /**
   * Check whether a specific error message is currently displayed in the UI for the linkId field.
   * @param page - Browser page
   * @param errorMessage - the error message to validate.
   * @returns Promise that resolves after the assertion completes.
   */
  static async checkLinkIdErrorIsDisplayed(page: Page, errorMessage: string): Promise<void> {
    const linkIdInput = page.locator('lfb-editable-link-id input');
    await expect(linkIdInput).toHaveClass(/invalid/);

    const inlineError = page.locator('lfb-editable-link-id').locator('small.text-danger');
    await expect(inlineError).toBeVisible();
    await expect(inlineError).toContainText(errorMessage);

    const topErrors = page.locator('mat-sidenav-content > div.mt-1 > ul > li.text-danger');
    if (await topErrors.count()) {
      await expect(topErrors.first()).toBeVisible();
    }

    const bottomErrors = page.locator('mat-sidenav-content > ul > li.text-danger');
    if (await bottomErrors.count()) {
      await expect(bottomErrors.first()).toBeVisible();
    }

  }

  /**
   * Check whether the error message for the linkId field is no longer displayed in the UI.
   * @param page - Browser page
   * @returns Promise that resolves after the assertion completes.
   */
  static async checkLinkIdErrorIsNotDisplayed(page: Page): Promise<void> {
    const linkIdInput = page.locator('lfb-editable-link-id input');
    await expect(linkIdInput).not.toHaveClass(/invalid/);

    const inlineError = page.locator('lfb-editable-link-id').locator('small.text-danger');
    await expect(inlineError).toHaveCount(0);

    const topErrors = page.locator('mat-sidenav-content > div.mt-1 > ul > li.text-danger');
    await expect(topErrors).toHaveCount(0);

    const bottomErrors = page.locator('mat-sidenav-content > ul > li');
    await expect(bottomErrors).toHaveCount(0);
  }
}

