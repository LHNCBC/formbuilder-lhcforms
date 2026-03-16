import { test, expect } from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils } from "./pw-utils";


  test.describe('Entry format extension', () => {
    let mainPO: MainPO;
    let fileJson;
    let entryFormatField;
    const entryFormatUrl = "http://hl7.org/fhir/StructureDefinition/entryFormat";

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      mainPO = new MainPO(page);
      await mainPO.loadILPage();

      fileJson = await PWUtils.uploadFile(page, 'entry-format-sample.json', true);
      await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');

      entryFormatField = await PWUtils.getItemEntryFormatField(page);
    });

    test('should display entry format placeholder for different data types', async ({ page }) => {
      await expect(page.locator('tree-root tree-viewport tree-node-collection tree-node').first()).toBeVisible();

      // Decimal data type
      await PWUtils.expectDataTypeValue(page, /decimal/);
      await expect(entryFormatField).toHaveValue(/Enter value between 15.2 and 20.1/);

      // Integer data type
      await PWUtils.clickTreeNode(page, 'Integer data type');
      await PWUtils.expectDataTypeValue(page, /integer/);
      await expect(entryFormatField).toHaveValue(/nnn/);

      // Date data type
      await PWUtils.clickTreeNode(page, 'Date data type');
      await PWUtils.expectDataTypeValue(page, /date/);
      await expect(entryFormatField).toHaveValue(/YY\/MM\/DD/);

      // Decimal data type
      await PWUtils.clickTreeNode(page, 'Datetime data type');
      await PWUtils.expectDataTypeValue(page, /dateTime/);
      await expect(entryFormatField).toHaveValue(/YY\/MM\/DD hh:mm:ss/);

      // Time data type
      await PWUtils.clickTreeNode(page, 'Time data type');
      await PWUtils.expectDataTypeValue(page, /time/);
      await expect(entryFormatField).toHaveValue(/hh:mm:ss/);

      // String data type
      await PWUtils.clickTreeNode(page, 'String data type');
      await PWUtils.expectDataTypeValue(page, /string/);
      await expect(entryFormatField).toHaveValue(/nnn-nnn-nnn/);

      // Text data type
      await PWUtils.clickTreeNode(page, 'Text data type');
      await PWUtils.expectDataTypeValue(page, /text/);
      await expect(entryFormatField).toHaveValue(/Max 100 characters./);

      // URL data type
      await PWUtils.clickTreeNode(page, 'URL data type');
      await PWUtils.expectDataTypeValue(page, /url/);
      await expect(entryFormatField).toHaveValue(/https:\/\/your-site.com/);

      // Coding data type
      await PWUtils.clickTreeNode(page, 'Coding data type');
      await PWUtils.expectDataTypeValue(page, /coding/);
      await expect(entryFormatField).toHaveValue(/Select option./);

      // Quantity data type
      await PWUtils.clickTreeNode(page, 'Quantity data type');
      await PWUtils.expectDataTypeValue(page, /quantity/);
      await expect(entryFormatField).toHaveValue(/Please enter weight./);

      // Invoke preview.
      await PWUtils.clickMenuBarButton(page, 'Preview');

      // Each item should have placeholder populated
      const expectedPlaceholders = [
        "Enter value between 15.2 and 20.1", "nnn", "YY/MM/DD", "YY/MM/DD hh:mm:ss", "hh:mm:ss",
        "nnn-nnn-nnn", "https://your-site.com", "Select option.", "Please enter weight."
      ];

      const inputPlaceholders = page.locator('lhc-item lhc-item-question input[placeholder]');
      for (let i = 0; i < expectedPlaceholders.length; i++) {
        await expect(inputPlaceholders.nth(i)).toHaveAttribute('placeholder', expectedPlaceholders[i]);
      }
      await expect(page.locator('lhc-item lhc-item-question textarea')).toHaveAttribute('placeholder', 'Max 100 characters.');
    });

    test('should update entry format placeholder for different data types', async ({ page }) => {
      await expect(page.locator('tree-root tree-viewport tree-node-collection tree-node').first()).toBeVisible();

      // Update 'Decimal data type' entry format
      await PWUtils.clickTreeNode(page, 'Decimal data type');
      await entryFormatField.fill('##.##');

      // Update 'Integer data type' entry format
      await PWUtils.clickTreeNode(page, 'Integer data type');
      await entryFormatField.fill('n');

      // Update 'Date data type' entry format
      await PWUtils.clickTreeNode(page, 'Date data type');
      await entryFormatField.fill('YYYY');

      // Update 'Datetime data type' entry format
      await PWUtils.clickTreeNode(page, 'Datetime data type');
      await entryFormatField.fill('YYYY hh:mm:ss');

      // Update 'Time data type' entry format
      await PWUtils.clickTreeNode(page, 'Time data type');
      await entryFormatField.fill('hh:mm');

      // Update 'String data type' entry format
      await PWUtils.clickTreeNode(page, 'String data type');
      await entryFormatField.fill('nnn-nnn');

      // Update 'Text data type' entry format
      await PWUtils.clickTreeNode(page, 'Text data type');
      await entryFormatField.fill('Max 200 characters.');

      // Update 'URL data type' entry format
      await PWUtils.clickTreeNode(page, 'URL data type');
      await entryFormatField.fill('https://my-site.com');

      // Update 'Coding data type' entry format
      await PWUtils.clickTreeNode(page, 'Coding data type');
      await entryFormatField.fill('Select one of the following options.');

      // Update 'Quantity data type' entry format
      await PWUtils.clickTreeNode(page, 'Quantity data type');
      await entryFormatField.fill('Please enter your weight.');

      // Invoke preview.
      await PWUtils.clickMenuBarButton(page, 'Preview');

      const expectedPlaceholders = [
        "##.##", "n", "YYYY", "YYYY hh:mm:ss", "hh:mm", "nnn-nnn", "https://my-site.com",
        "Select one of the following options.", "Please enter your weight."
      ];

      const inputPlaceholders = page.locator('lhc-item lhc-item-question input[placeholder]');
      for (let i = 0; i < expectedPlaceholders.length; i++) {
        await expect(inputPlaceholders.nth(i)).toHaveAttribute('placeholder', expectedPlaceholders[i]);
      }
      await expect(page.locator('lhc-item lhc-item-question textarea')).toHaveAttribute('placeholder', 'Max 200 characters.');
    });

    test('should remove entry format placeholder for different data types', async ({ page }) => {
      await expect(page.locator('tree-root tree-viewport tree-node-collection tree-node').first()).toBeVisible();

      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');

      const expectedExtensions = [
        { itemIndex: 0, extensionIndex: 3, type: 'decimal', valueString: "Enter value between 15.2 and 20.1" },
        { itemIndex: 1, extensionIndex: 0, type: 'integer', valueString: "nnn" },
        { itemIndex: 2, extensionIndex: 0, type: 'date', valueString: "YY/MM/DD" },
        { itemIndex: 3, extensionIndex: 0, type: 'dateTime', valueString: "YY/MM/DD hh:mm:ss" },
        { itemIndex: 4, extensionIndex: 0, type: 'time', valueString: "hh:mm:ss" },
        { itemIndex: 5, extensionIndex: 0, type: 'string', valueString: "nnn-nnn-nnn" },
        { itemIndex: 6, extensionIndex: 0, type: 'text', valueString: "Max 100 characters." },
        { itemIndex: 7, extensionIndex: 0, type: 'url', valueString: "https://your-site.com" },
        { itemIndex: 8, extensionIndex: 1, type: 'coding', valueString: "Select option." },
        { itemIndex: 9, extensionIndex: 3, type: 'quantity', valueString: "Please enter weight." }
      ];

      for (const expected of expectedExtensions) {
        expect(qJson.item[expected.itemIndex].type).toBe(expected.type);
        expect(qJson.item[expected.itemIndex].extension[expected.extensionIndex]).toEqual({
          url: entryFormatUrl,
          valueString: expected.valueString
        });
      }

      // Clear all entry formats
      const dataTypes = [
          'Decimal data type', 'Integer data type', 'Date data type', 'Datetime data type',
          'Time data type', 'String data type', 'Text data type', 'URL data type',
          'Coding data type', 'Quantity data type'
      ];

      for (const type of dataTypes) {
        await PWUtils.clickTreeNode(page, type);
        await entryFormatField.clear();
      }

      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');

      // Verify that entryFormat extension is removed from all items
      expect(qJson.item[0].type).toBe('decimal');
      expect(qJson.item[0].extension[3]).toBeUndefined();

      // The entryFormat has been deleted; unit extension should remain.
      expect(qJson.item[1].type).toBe('integer');
      expect(qJson.item[1].extension[0]).toEqual({
        url: "http://hl7.org/fhir/StructureDefinition/questionnaire-unit",
        valueCoding: {
          code: "kg",
          display: "kilogram",
          system: "http://unitsofmeasure.org"
        }
      });

      expect(qJson.item[2].type).toBe('date');
      expect(qJson.item[2].extension).toBeUndefined();

      expect(qJson.item[3].type).toBe('dateTime');
      expect(qJson.item[3].extension).toBeUndefined();

      expect(qJson.item[4].type).toBe('time');
      expect(qJson.item[4].extension).toBeUndefined();

      expect(qJson.item[5].type).toBe('string');
      expect(qJson.item[5].extension).toBeUndefined();

      expect(qJson.item[6].type).toBe('text');
      expect(qJson.item[6].extension).toBeUndefined();

      expect(qJson.item[7].type).toBe('url');
      expect(qJson.item[7].extension).toBeUndefined();

      expect(qJson.item[8].type).toBe('coding');
      expect(qJson.item[8].extension[1]).toBeUndefined();

      expect(qJson.item[9].type).toBe('quantity');
      expect(qJson.item[9].extension[3]).toBeUndefined();
    });

    test('should correctly display the entry format even when other extensions are present', async ({ page }) => {
      await MainPO.mockUnitsLookup(page);

      await expect(page.locator('tree-root tree-viewport tree-node-collection tree-node').first()).toBeVisible();

      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');

      // There should only be one entry format extension, however, should there be more than one, the
      // last entry format will be used.
      await PWUtils.expectDataTypeValue(page, /decimal/);

      // There are 2 entry format extensions.
      expect(qJson.item[0].type).toBe('decimal');
      expect(qJson.item[0].extension).toHaveLength(4);
      expect(qJson.item[0].extension[2]).toEqual({
        url: entryFormatUrl,
        valueString: "#,###.##"
      });
      expect(qJson.item[0].extension[3]).toEqual({
        url: entryFormatUrl,
        valueString: "Enter value between 15.2 and 20.1"
      });

      // Invoke preview.
      await PWUtils.clickMenuBarButton(page, 'Preview');

      // The last entry format will be used.
      await expect(page.locator('lhc-item lhc-item-question lhc-input > input').first())
        .toHaveAttribute('placeholder', 'Enter value between 15.2 and 20.1');

      // Close the Preview dialog.
      await PWUtils.getButton(page, 'Preview of Questionnaire close', 'Close').click();

      // Clear the entry format.
      await entryFormatField.clear();

      // Both entry formats got deleted actually. This is preferrable to suddenly
      // popping up with the '#,###.##'.
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toHaveLength(2);

      const hasEntryFormat = qJson.item[0].extension.some(ext =>
        ext.url === entryFormatUrl
      );
      expect(hasEntryFormat).toBe(false);

      // Re-enter the entry format.
      await entryFormatField.fill('Enter value between 15.2 and 20.1');
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      expect(qJson.item[0].extension).toHaveLength(3);
      expect(qJson.item[0].extension[2]).toEqual({
        url: entryFormatUrl,
        valueString: "Enter value between 15.2 and 20.1"
      });

      // Invoke preview.
      await PWUtils.clickMenuBarButton(page, 'Preview');

      // The LForms preview should display the correct message.
      await expect(page.locator('lhc-item lhc-item-question lhc-input > input').first())
        .toHaveAttribute('placeholder', 'Enter value between 15.2 and 20.1');

      // Close the Preview dialog.
      await PWUtils.clickButton(page, 'Preview of Questionnaire close', 'Close');

      // Add a unit extension to the item.
      const unitsField = page.locator('[id^="units"]').first();
      await expect(unitsField).toBeVisible();
      await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

      await unitsField.pressSequentially('inch');

      await unitsField.press('ArrowDown');
      await unitsField.press('Enter');


      // Change the entryFormat
      //await entryFormatField.clear();
      await entryFormatField.fill('Enter here.');

      // The order should remain the same, unless .clear() is being called before .type(),
      // then the entryFormat will get append as a last entry.
      qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');

      expect(qJson.item[0].extension).toHaveLength(4);
      expect(qJson.item[0].extension[2]).toEqual({
        url: entryFormatUrl,
        valueString: "Enter here."
      });
      expect(qJson.item[0].extension[3]).toEqual({
        url: "http://hl7.org/fhir/StructureDefinition/questionnaire-unit",
        valueCoding: {
          system: "http://unitsofmeasure.org",
          code: "[in_i]",
          display: "inch"
        }
      });
    });
  });
