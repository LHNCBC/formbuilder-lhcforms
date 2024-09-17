import {test, expect} from '@playwright/test';
import { MainPO } from './po/main-po';
import path from 'path';
import fs from 'node:fs/promises';
import {PWUtils} from "./pw-utils";

test.describe('retain-additional-fields', async () => {
  let mainPO: MainPO;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.clearSession();
    await mainPO.loadFLPage();
  });

  test('should retain contained field', async ({page}) => {
    const {fileJson, fbJson} = await PWUtils.loadFile(page, '../cypress/fixtures/contained-example.json');
    expect(fbJson.contained).toEqual(fileJson.contained);
  });
});
