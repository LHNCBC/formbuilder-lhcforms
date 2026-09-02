import {expect, test} from '@playwright/test';
import {MainPO} from './po/main-po';
import {PWUtils} from './pw-utils';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../src/app/lib/constants/constants';

test.describe('Template-based extraction', () => {
  test.beforeEach(async ({page}) => {
    const mainPO = new MainPO(page);
    await mainPO.mockSnomedEditions();
    await page.goto('/');
    await mainPO.loadHomePage();
    await page.locator('input[type="radio"][value="scratch"]').click();
    await page.getByRole('button', {name: 'Continue'}).click();
  });

  test('edits repeatable form- and item-level references to existing contained resources', async ({page}) => {
    await PWUtils.uploadFile(page, 'template-extract.json', false);
    await PWUtils.expandAdvancedFields(page);

    const formWidget = page.locator('lfb-form-fields lfb-template-extract');
    await expect(formWidget.locator('tbody > tr')).toHaveCount(1);
    await expect(formWidget.locator('tbody > tr').first()).toContainText('ValueSet #patient-template');
    await expect(formWidget.locator('tbody > tr').first()).toContainText('%patientId');

    await formWidget.getByRole('button', {name: 'Edit this row'}).click();
    let templateDialog = page.getByRole('dialog', {name: 'Edit template extraction'});
    await expect(templateDialog.getByLabel('Contained resource template')).toHaveValue('#patient-template');
    await expect(templateDialog.getByRole('button', {name: 'Bundle entry fields'}))
      .toHaveAttribute('aria-expanded', 'true');
    const fullUrlInput = templateDialog.getByRole('textbox', {name: 'fullUrl FHIRPath expression'});
    await expect(fullUrlInput).toHaveValue('%patientId');
    await expect(fullUrlInput).toHaveAttribute('readonly', '');
    await templateDialog.getByRole('button', {name: 'Discard changes'}).first().click();

    const containedTable = PWUtils.getTableByFieldLabel(
      page.locator('lfb-form-fields'),
      'Contained resources'
    );
    const referencedResourceRow = containedTable.locator('tbody > tr').first();
    await referencedResourceRow.getByRole('button', {name: 'Remove this row'}).click();
    const inUseDialog = page.getByRole('dialog', {name: 'Contained resource is in use'});
    await expect(inUseDialog).toContainText(
      'The contained resource #patient-template is referenced by Template-based extraction and cannot be deleted.'
    );
    await inUseDialog.getByRole('button', {name: 'Close', exact: true}).last().click();
    await expect(referencedResourceRow).toHaveCount(1);

    await formWidget.getByRole('button', {name: 'Add new template'}).click();
    templateDialog = page.getByRole('dialog', {name: 'Add template extraction'});
    await templateDialog.getByLabel('Contained resource template').selectOption('#observation-template');
    const bundleFieldsToggle = templateDialog.getByRole('button', {name: 'Bundle entry fields'});
    await expect(bundleFieldsToggle).toHaveAttribute('aria-expanded', 'false');
    await bundleFieldsToggle.click();
    await expect(bundleFieldsToggle).toHaveAttribute('aria-expanded', 'true');
    await templateDialog.getByRole('button', {name: 'Create or edit resourceId FHIRPath expression'}).click();
    await expect(page.getByRole('heading', {name: 'Expression Editor'})).toBeVisible();
    await page.locator('textarea#final-expression').fill("'observation-1'");
    await page.locator('#export').click();
    await expect(templateDialog.getByRole('textbox', {name: 'resourceId FHIRPath expression'}))
      .toHaveValue("'observation-1'");
    await templateDialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(formWidget.locator('tbody > tr')).toHaveCount(2);

    let questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    let extensions = questionnaire.extension.filter(extension => extension.url === EXTENSION_URL_TEMPLATE_EXTRACT);
    expect(extensions).toHaveLength(2);
    expect(extensions[1].extension).toEqual([
      {url: 'template', valueReference: {reference: '#observation-template'}},
      {url: 'resourceId', valueString: "'observation-1'"}
    ]);

    await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
    await expect(page.locator('.spinner-border')).not.toBeVisible();
    await PWUtils.expandAdvancedFields(page);

    const itemWidget = page.locator('lfb-sf-form-wrapper lfb-template-extract');
    await expect(itemWidget.locator('tbody > tr')).toHaveCount(1);
    await expect(itemWidget.locator('tbody > tr')).toContainText('ValueSet #observation-template');
    await expect(itemWidget.locator('tbody > tr')).toContainText("ifNoneExist: 'identifier=measurement'");

    await itemWidget.getByRole('button', {name: 'Edit this row'}).click();
    templateDialog = page.getByRole('dialog', {name: 'Edit template extraction'});
    await templateDialog.getByLabel('Contained resource template').selectOption('#patient-template');
    await templateDialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(itemWidget.locator('tbody > tr')).toContainText('ValueSet #patient-template');
    questionnaire = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    extensions = questionnaire.item[0].extension.filter(extension => extension.url === EXTENSION_URL_TEMPLATE_EXTRACT);
    expect(extensions[0].extension[0]).toEqual({
      url: 'template',
      valueReference: {reference: '#patient-template'}
    });
  });
});
