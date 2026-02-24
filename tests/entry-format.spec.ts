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

      fileJson = await PWUtils.uploadFile(page, './fixtures/entry-format-sample.json', true);
      await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();

      entryFormatField = await PWUtils.getItemEntryFormatField(page);
    });

    test('should display entry format placeholder for different data types', async ({ page }) => {
      await expect(page.locator('tree-root tree-viewport tree-node-collection tree-node').first()).toBeVisible();

      // Decimal data type
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/decimal/);
      await expect(entryFormatField).toHaveValue(/Enter value between 15.2 and 20.1/);

      // Integer data type
      await PWUtils.clickTreeNode(page, 'Integer data type');
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/integer/);
      await expect(entryFormatField).toHaveValue(/nnn/);

      // Date data type
      await PWUtils.clickTreeNode(page, 'Date data type');
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/date/);
      await expect(entryFormatField).toHaveValue(/YY\/MM\/DD/);

      // Decimal data type
      await PWUtils.clickTreeNode(page, 'Datetime data type');
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/dateTime/);
      await expect(entryFormatField).toHaveValue(/YY\/MM\/DD hh:mm:ss/);

      // Time data type
      await PWUtils.clickTreeNode(page, 'Time data type');
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/time/);
      await expect(entryFormatField).toHaveValue(/hh:mm:ss/);

      // String data type
      await PWUtils.clickTreeNode(page, 'String data type');
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/string/);
      await expect(entryFormatField).toHaveValue(/nnn-nnn-nnn/);

      // Text data type
      await PWUtils.clickTreeNode(page, 'Text data type');
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/text/);
      await expect(entryFormatField).toHaveValue(/Max 100 characters./);

      // URL data type
      await PWUtils.clickTreeNode(page, 'URL data type');
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/url/);
      await expect(entryFormatField).toHaveValue(/https:\/\/your-site.com/);

      // Coding data type
      await PWUtils.clickTreeNode(page, 'Coding data type');
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/coding/);
      await expect(entryFormatField).toHaveValue(/Select option./);

      // Quantity data type
      await PWUtils.clickTreeNode(page, 'Quantity data type');
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/quantity/);
      await expect(entryFormatField).toHaveValue(/Please enter weight./);

      // Invoke preview.
      await PWUtils.getButton(page, null, 'Preview').click();

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
      await PWUtils.getButton(page, null, 'Preview').click();

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
      for (const expected of expectedExtensions) {
        const item = qJson.item[expected.itemIndex];

        if (item.extension) {
          // Check that NO entryFormat extension exists
          const hasEntryFormat = item.extension.some(ext =>
            ext.url === entryFormatUrl
          );

          expect(hasEntryFormat).toBe(false); // Should not have entryFormat extension
        } else {
          // This is valid - the item may have no extensions at all after removal
          expect(item.extension).toBeUndefined();
        }
      }
    });

    test('should correctly display the entry format even when other extensions are present', async ({ page }) => {
      await MainPO.mockUnitsLookup(page);

      await expect(page.locator('tree-root tree-viewport tree-node-collection tree-node').first()).toBeVisible();

      let qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');

      // There should only be one entry format extension, however, should there be more than one, the
      // last entry format will be used.
      await expect(await PWUtils.getItemTypeField(page)).toHaveValue(/decimal/);

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
      await PWUtils.getButton(page, null, 'Preview').click();

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
      await PWUtils.getButton(page, null, 'Preview').click();

      // The LForms preview should display the correct message.
      await expect(page.locator('lhc-item lhc-item-question lhc-input > input').first())
        .toHaveAttribute('placeholder', 'Enter value between 15.2 and 20.1');

      // Close the Preview dialog.
      await PWUtils.getButton(page, 'Preview of Questionnaire close', 'Close').click();

      // Add a unit extension to the item.
      const unitsField = page.locator('[id^="units"]').first();
      await expect(unitsField).toBeVisible();
      await expect(page.locator('#lhc-tools-searchResults')).not.toBeVisible();

      await unitsField.pressSequentially('inch', { delay: 30 });

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
