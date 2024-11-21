import {test, expect, Page} from '@playwright/test';

import {MainPO} from "./po/main-po";

test.describe('Window opener notice', async () => {

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

test.describe('Open form builder in a new window', async () => {
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

    await page.goto('/tests/window-open-test.html');
    const pagePromise = page.context().waitForEvent('page');
    await page.getByRole('button', {name: 'Open form builder'}).click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState('domcontentloaded');
    mainPO = new MainPO(newPage);
    await mainPO.loadHomePage();
    await expect(mainPO.page.getByText(MainPO.windowOpenerNotice)).toBeVisible();
  });

  test('should open form builder in a new window', async ({page}) => {
    const initialQTitle = 'Form loaded from window-open-test.html';
    const messageData = {data: null};
    messageData.data = await getMessage(page, 'initialized');
    expect(messageData.data.type).toBe('initialized');
    messageData.data = await getMessage(page, 'updateQuestionnaire');
    expect(messageData.data.type).toBe('updateQuestionnaire');
    await page.getByRole('button', {name: 'Clear messages'}).click();
    await page.getByRole('button', {name: 'Post questionnaire'}).click();
    await expect(mainPO.titleLocator).toHaveValue(initialQTitle);
    messageData.data = await getMessage(page, 'updateQuestionnaire');
    expect(messageData.data.type).toBe('updateQuestionnaire');
    expect(messageData.data.questionnaire.title).toBe(initialQTitle);

    await page.getByRole('button', {name: 'Clear messages'}).click();
    await mainPO.titleLocator.fill('');
    await mainPO.titleLocator.fill('xxxx');
    messageData.data = await getMessage(page, 'updateQuestionnaire');
    expect(messageData.data.questionnaire.title).toBe('xxxx');

    await page.getByRole('button', {name: 'Clear messages'}).click();
    await mainPO.titleLocator.fill('');
    await mainPO.titleLocator.fill('yyyy');
    await mainPO.page.getByRole('button', {name: 'Save & Close'}).click();
    messageData.data = await getMessage(page, 'closed');
    expect(messageData.data.questionnaire.title).toBe('yyyy');
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
    await mainPO.page.getByRole('button', {name: 'Yes'}).click();

    messageData.data = await getMessage(page, 'canceled');
  });

  async function getMessage(page: Page, type: string) {
    let ret = null;
    const eventElementMap = {
      initialized: '#initW',
      updateQuestionnaire: '#updateQ',
      closed: '#closedQ'
    };

    const loc = eventElementMap[type];
    if(loc) {
      await expect(page.locator(loc)).toContainText(type); // Wait until the page is updated.
      const str = await page.locator(loc).textContent();
      ret = JSON.parse(str);
    }

    return ret;
  }
});

