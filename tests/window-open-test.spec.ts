import {test, expect, Page} from '@playwright/test';

import {MainPO} from "./po/main-po";
test.describe('Open formbuilder in a new window', () => {
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

    await page.goto('/test/open-window-test.html');
    const pagePromise = page.context().waitForEvent('page');
    await page.getByRole('button', {name: 'Open form builder'}).click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState('domcontentloaded');
    mainPO = new MainPO(newPage);
    mainPO.clearSession();
    await mainPO.loadFLPage();
  });
/*
  test.afterEach(async () => {
    if(!mainPO.page.isClosed()) {
      await mainPO.clearSession();
    }
  });
*/
  test('should open formbuilder in a new window', async ({page}) => {
    const initialQTitle = 'Form loaded from open-window-test.html';
    const messageData = {data: null};
    messageData.data = await getMessage(page, 'initialized');
    expect(messageData.data.type).toBe('initialized');
    await page.getByRole('button', {name: 'Clear messages'}).click();
    messageData.data = await getMessage(page, 'updateQuestionnaire');
    await page.getByRole('button', {name: 'Post questionnaire'}).click();
    await expect(await mainPO.titleLocator).toHaveValue(initialQTitle);
    messageData.data = await getMessage(page, 'updateQuestionnaire');
    await expect(messageData.data.type).toBe('updateQuestionnaire');
    await expect(messageData.data.questionnaire.title).toBe(initialQTitle);

    await page.getByRole('button', {name: 'Clear messages'}).click();
    await mainPO.titleLocator.fill('');
    await mainPO.titleLocator.fill('xxxx');
    messageData.data = await getMessage(page, 'updateQuestionnaire');
    await expect(messageData.data.questionnaire.title).toBe('xxxx');

    await page.getByRole('button', {name: 'Clear messages'}).click();
    await mainPO.titleLocator.fill('');
    await mainPO.titleLocator.fill('yyyy');
    await mainPO.page.getByRole('button', {name: 'Close'}).click();
    messageData.data = await getMessage(page, 'closed');
    await expect(messageData.data.questionnaire.title).toBe('yyyy');
  });

  async function getMessage(page: Page, type: string) {
    let ret = null;
    let str = '';
    const eventElementMap = {
      initialized: '#initW',
      updateQuestionnaire: '#updateQ',
      closed: '#closedQ'
    };

    const loc = eventElementMap[type];
    if(loc) {
      await expect(page.locator(loc)).toContainText(type, {timeout: 10000}); // Wait until the page is updated.
      const str = await page.locator(loc).textContent();
      ret = JSON.parse(str);
    }

    return ret;
  }
});

