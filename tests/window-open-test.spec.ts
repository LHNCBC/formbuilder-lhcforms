import {test, expect, Page, FrameLocator} from '@playwright/test';

import {MainPO} from "./po/main-po";
import {PWUtils} from "./pw-utils";

const fbSecondUrl = encodeURI(`/tests/window-open-test.html?targetUrl=${encodeURI(process.env.TEST_BASE_URL_SECOND)}`);

test.describe('Window opener notice', () => {

  test('should not exist if not opened by window.open() call', async ({page}) => {
    await page.goto('/');
    const mainPO = new MainPO(page);
    await mainPO.loadHomePage();
    // Note: Trying to assert non-existent element that it should NOT exist.
    // However, after loading main page the element should have been attached,
    // if it was opened by window.open(). So, negative assertion has still some
    // testing value.
    await expect(page.getByText(MainPO.windowOpenerNotice)).not.toBeAttached();
  });
});

test.describe('Cancel event', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    page.on('console', msg => {
      if(msg.type() === 'error') {
        console.error(msg.text());
      }
      else {
        console.log(msg.text());
      }
    });

    await page.goto(fbSecondUrl);
    const pagePromise = page.context().waitForEvent('page');
    await page.getByRole('button', {name: `Open form builder (Default)`}).click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState('domcontentloaded');
    mainPO = new MainPO(newPage);
    await mainPO.loadHomePage();
    await expect(mainPO.page.getByText(MainPO.windowOpenerNotice)).toBeVisible();
  });

  test('should demo cancel event', async ({page}): Promise<void> => {
    const messageData = {data: null};

    messageData.data = await getMessage(page, 'initialized');
    expect(messageData.data.type).toBe('initialized');
    messageData.data = await getMessage(page, 'updateQuestionnaire');
    expect(messageData.data.type).toBe('updateQuestionnaire');

    await mainPO.page.getByRole('button', {name: 'Cancel'}).click();
    await mainPO.page.getByRole('button', {name: 'No'}).click();
    await mainPO.page.getByRole('button', {name: 'Cancel'}).click();
    await mainPO.page.getByRole('button', {name: 'Yes'}).click().catch(PWUtils.ignorePageCloseError);

    messageData.data = await getMessage(page, 'canceled');
  });

});

test.describe('Embed form builder in an iframe', () => {
  const initialQTitle = 'Form loaded from window-open-test.html';
  let frame: FrameLocator;

  test.beforeEach(async ({page}) => {
    page.on('console', msg => {
      if(msg.type() === 'error') {
        console.error(msg.text());
      }
      else {
        console.log(msg.text());
      }
    });

    await page.goto(fbSecondUrl);
    // The route also applies to the requests of the iframe.
    await new MainPO(page).mockSnomedEditions();
    await page.getByRole('button', {name: 'Embed form builder (R4)'}).click();
    // Playwright does not scroll the test page for elements in a cross-origin iframe. The iframe is above the
    // message panels, which grow while testing, and is 80vh high, so all of it stays visible after this.
    await page.locator('#fbFrame').scrollIntoViewIfNeeded();
    frame = page.frameLocator('#fbFrame');
    await frame.locator('#acceptLoinc').click();
    await frame.locator('#useSnomed').click();
    await frame.locator('#acceptSnomed').click();
    await frame.locator('lfb-loinc-notice button').filter({hasText: 'Accept'}).click();

    expect((await getMessage(page, 'initialized')).type).toBe('initialized');
    await expect(titleLocator(frame)).toHaveValue(initialQTitle);
    await expect(frame.getByText(MainPO.windowOpenerNotice)).not.toBeAttached();
  });

  test('should send closed with the final questionnaire on Save & Close', async ({page}) => {
    await titleLocator(frame).fill('Edited in iframe');
    const updated = await getMessage(page, 'updateQuestionnaire');
    expect(updated.questionnaire.meta.profile[0]).toBe('http://hl7.org/fhir/4.0/StructureDefinition/Questionnaire');

    await frame.getByRole('button', {name: 'Save & Close'}).click();

    const closed = await getMessage(page, 'closed');
    expect(closed.questionnaire.title).toBe('Edited in iframe');
    expect(closed.questionnaire.meta.profile[0]).toBe('http://hl7.org/fhir/4.0/StructureDefinition/Questionnaire');
    // The test page removes the iframe when it receives the message.
    await expect(page.locator('#fbFrame')).not.toBeAttached();
  });

  test('should send canceled on Cancel', async ({page}) => {
    await frame.getByRole('button', {name: 'Cancel'}).click();
    await frame.getByRole('button', {name: 'No'}).click();
    await expect(page.locator('#fbFrame')).toBeAttached();

    await frame.getByRole('button', {name: 'Cancel'}).click();
    await frame.getByRole('button', {name: 'Yes'}).click();

    expect((await getMessage(page, 'canceled')).type).toBe('canceled');
    await expect(page.locator('#closedQ')).toBeEmpty();
    await expect(page.locator('#fbFrame')).not.toBeAttached();
  });

  test('should stay open and show the error if the questionnaire cannot be sent', async ({page}) => {
    const errorTitle = 'Questionnaire update not sent';
    // The "ad" Quantity comparator is supported only in FHIR R5, so the questionnaire cannot be sent as R4.
    await page.evaluate(() => {
      const q = {
        resourceType: 'Questionnaire', status: 'draft', title: 'R5 only',
        useContext: [{
          code: {system: 'http://terminology.hl7.org/CodeSystem/usage-context-type', code: 'age'},
          valueQuantity: {value: 10, comparator: 'ad', unit: 'mL'}
        }],
        item: [{text: 'q one', linkId: 'q-1', type: 'string'}]
      };
      // @ts-ignore - fbWindow and originUrl are globals of window-open-test.html.
      fbWindow.postMessage({type: 'initialQuestionnaire', questionnaire: q}, originUrl);
    });
    await expect(frame.getByText(errorTitle)).toBeVisible();
    await frame.getByRole('dialog').locator('button.btn-primary', {hasText: 'Close'}).click();
    await expect(frame.getByRole('dialog')).toHaveCount(0);

    // The dialog is shown again, even though the same error was already reported.
    await frame.getByRole('button', {name: 'Save & Close'}).click();
    await expect(frame.getByText(errorTitle)).toBeVisible();
    await expect(page.locator('#closedQ')).toBeEmpty();
    await expect(page.locator('#fbFrame')).toBeAttached();
  });

  test.describe('when the parent page hides the iframe instead of removing it', () => {
    // The form builder sends updateQuestionnaire 500 ms after the last change.
    const updateDebounceMs = 500;

    test.beforeEach(async ({page}) => {
      await page.getByLabel('Hide the embedded form builder on closed or canceled').check();
    });

    test('should send nothing after canceled', async ({page}) => {
      await frame.getByRole('button', {name: 'Cancel'}).click();
      // Change the questionnaire right before confirming, so its update is still pending when the session ends.
      await page.getByRole('button', {name: 'Post questionnaire'}).click();
      await frame.getByRole('button', {name: 'Yes'}).click();

      expect((await getMessage(page, 'canceled')).type).toBe('canceled');
      await expect(page.locator('#fbFrame')).toBeHidden();
      // A pending update would arrive within the debounce time.
      await page.waitForTimeout(2 * updateDebounceMs);
      expect(await messagesAfter(page, 'canceled')).toEqual([]);
    });

    test('should send nothing after closed', async ({page}) => {
      await titleLocator(frame).fill('Edited before Save & Close');
      await frame.getByRole('button', {name: 'Save & Close'}).click();

      expect((await getMessage(page, 'closed')).questionnaire.title).toBe('Edited before Save & Close');
      await expect(page.locator('#fbFrame')).toBeHidden();
      // A pending update would arrive within the debounce time.
      await page.waitForTimeout(2 * updateDebounceMs);
      expect(await messagesAfter(page, 'closed')).toEqual([]);
    });
  });
});

/**
 * Get the types of the messages the test page received after the first message of the given type.
 *
 * @param page - Test page.
 * @param type - Message type, e.g. 'closed'.
 * @returns Message types received after it, in order.
 */
async function messagesAfter(page: Page, type: string): Promise<string[]> {
  const types = (await page.locator('#msgLog').textContent()).split('\n').filter(Boolean);
  expect(types).toContain(type);
  return types.slice(types.indexOf(type) + 1);
}

/**
 * Get the Title field of the form builder in the given frame.
 *
 * @param frame - Frame locator of the embedded form builder.
 * @returns Locator of the Title field.
 */
function titleLocator(frame: FrameLocator) {
  return frame.locator('lfb-form-fields').getByLabel('Title', {exact: true});
}

/**
 * Wait for the test page to show the last message of the given type, and get it.
 *
 * @param page - Test page.
 * @param type - Message type: 'initialized', 'updateQuestionnaire', 'closed', 'canceled', or 'aborted'.
 * @returns The message data, or null for another type.
 */
async function getMessage(page: Page, type: string) {
    let ret = null;
    const eventElementMap = {
      initialized: '#initW',
      updateQuestionnaire: '#updateQ',
      closed: '#closedQ',
      canceled: '#canceledQ',
      aborted: '#abortedQ'
    };

    const loc = eventElementMap[type];
    if(loc) {
      await expect(page.locator(loc)).toContainText(type); // Wait until the page is updated.
      const str = await page.locator(loc).textContent();
      ret = JSON.parse(str);
    }

    return ret;
}

test.describe('Open form builder in a new window', () => {

  test.beforeEach(async ({page}) => {
    page.on('console', msg => {
      if(msg.type() === 'error') {
        console.error(msg.text());
      }
      else {
        console.log(msg.text());
      }
    });

    await page.goto(fbSecondUrl);
  });

  [
    {fhirVersion: 'Default', expectedProfile: 'http://hl7.org/fhir/4.0/StructureDefinition/Questionnaire'},
    {fhirVersion: 'STU3', expectedProfile: 'http://hl7.org/fhir/3.0/StructureDefinition/Questionnaire'},
    {fhirVersion: 'R4', expectedProfile: 'http://hl7.org/fhir/4.0/StructureDefinition/Questionnaire'},
    {fhirVersion: 'R5', expectedProfile: 'http://hl7.org/fhir/5.0/StructureDefinition/Questionnaire'}
  ].forEach(({fhirVersion, expectedProfile}) => {
    test(`should return ${fhirVersion} questionnaire`, async ({page}) => {

      const pagePromise = page.context().waitForEvent('page');
      await page.getByRole('button', {name: `Open form builder (${fhirVersion})`}).click();
      const newPage = await pagePromise;
      await newPage.waitForLoadState('domcontentloaded');
      const formBuilderPO = new MainPO(newPage);
      await formBuilderPO.loadHomePage();
      await expect(formBuilderPO.page.getByText(MainPO.windowOpenerNotice)).toBeVisible();

      const initialQTitle = 'Form loaded from window-open-test.html';
      const messageData = {data: null};
      messageData.data = await getMessage(page, 'initialized');
      expect(messageData.data.type).toBe('initialized');
      messageData.data = await getMessage(page, 'updateQuestionnaire');
      expect(messageData.data.type).toBe('updateQuestionnaire');
      await page.getByRole('button', {name: 'Clear messages'}).click();
      await page.getByRole('button', {name: 'Post questionnaire'}).click();
      await expect(formBuilderPO.titleLocator).toHaveValue(initialQTitle);
      messageData.data = await getMessage(page, 'updateQuestionnaire');
      expect(messageData.data.type).toBe('updateQuestionnaire');
      expect(messageData.data.questionnaire.title).toBe(initialQTitle);
      expect(messageData.data.questionnaire.meta.profile[0]).toBe(expectedProfile);

      await page.getByRole('button', {name: 'Clear messages'}).click();
      await formBuilderPO.titleLocator.fill('');
      await formBuilderPO.titleLocator.fill('xxxx');
      messageData.data = await getMessage(page, 'updateQuestionnaire');
      expect(messageData.data.questionnaire.title).toBe('xxxx');
      expect(messageData.data.questionnaire.meta.profile[0]).toBe(expectedProfile);

      await page.getByRole('button', {name: 'Clear messages'}).click();
      await formBuilderPO.titleLocator.fill('');
      await formBuilderPO.titleLocator.fill('yyyy');

      const saveButton = formBuilderPO.page.getByRole('button', { name: 'Save & Close' });
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();

      await Promise.all([
        formBuilderPO.page.waitForEvent('close'),
        saveButton.click().catch(PWUtils.ignorePageCloseError),
      ]);

      messageData.data = await getMessage(page, 'closed');
      expect(messageData.data.questionnaire.title).toBe('yyyy');
      expect(messageData.data.questionnaire.meta.profile[0]).toBe(expectedProfile);
    });
  });

  test('should send aborted if the window is closed when the questionnaire cannot be sent', async ({page}) => {
    const errorTitle = 'Questionnaire update not sent';
    const pagePromise = page.context().waitForEvent('page');
    await page.getByRole('button', {name: 'Open form builder (R4)'}).click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState('domcontentloaded');
    const formBuilderPO = new MainPO(newPage);
    await formBuilderPO.loadHomePage();
    expect((await getMessage(page, 'initialized')).type).toBe('initialized');

    // The "ad" Quantity comparator is supported only in FHIR R5, so the questionnaire cannot be sent as R4.
    await page.evaluate(() => {
      const q = {
        resourceType: 'Questionnaire', status: 'draft', title: 'R5 only',
        useContext: [{
          code: {system: 'http://terminology.hl7.org/CodeSystem/usage-context-type', code: 'age'},
          valueQuantity: {value: 10, comparator: 'ad', unit: 'mL'}
        }],
        item: [{text: 'q one', linkId: 'q-1', type: 'string'}]
      };
      // @ts-ignore - fbWindow and originUrl are globals of window-open-test.html.
      fbWindow.postMessage({type: 'initialQuestionnaire', questionnaire: q}, originUrl);
    });
    const errorDialog = formBuilderPO.page.getByRole('dialog');
    await expect(formBuilderPO.page.getByText(errorTitle)).toBeVisible();
    await errorDialog.locator('button.btn-primary', {hasText: 'Close'}).click();

    // Save & Close fails and keeps the window open, then the user closes the window.
    await formBuilderPO.page.getByRole('button', {name: 'Save & Close'}).click();
    await expect(formBuilderPO.page.getByText(errorTitle)).toBeVisible();
    await errorDialog.locator('button.btn-primary', {hasText: 'Close'}).click();
    await formBuilderPO.page.close({runBeforeUnload: true});

    const aborted = await getMessage(page, 'aborted');
    expect(aborted.error).toContain('Quantity comparator "ad" is supported only in FHIR R5.');
    expect(aborted.questionnaire).toBeUndefined();
    await expect(page.locator('#closedQ')).toBeEmpty();
    expect(await messagesAfter(page, 'initialized')).not.toContain('closed');
  });
});
