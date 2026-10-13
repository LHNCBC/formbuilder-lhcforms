import {expect, Page, test} from '@playwright/test';
import fhir from 'fhir/r4';
import {MainPO} from './po/main-po';
import {PWUtils} from './pw-utils';
import {EXTENSION_URL_TEMPLATE_EXTRACT, EXTENSION_URL_VARIABLE} from '../src/app/lib/constants/constants';

/**
 * Import same-template occurrences at both scopes with distinct allocated-ID environments.
 * @param page - Browser page displaying a new questionnaire.
 */
async function importRepeatedExtractionQuestionnaire(page: Page): Promise<void> {
  const allocateIdUrl = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-extractAllocateId';

  /**
   * Create a scope containing unrelated extensions and two occurrences of the same template.
   *
   * @param scope - Prefix for the allocated id, variable name, and fullUrl values, e.g. 'root'.
   * @returns allocateId and variable extensions followed by two templateExtract extensions.
   */
  function scopeExtensions(scope: string): fhir.Extension[] {
    return [
      {url: allocateIdUrl, valueString: `${scope}Id`},
      {
        url: EXTENSION_URL_VARIABLE,
        valueExpression: {name: `${scope}Variable`, language: 'text/fhirpath', expression: '1'}
      },
      ...['first', 'second'].map(occurrence => ({
        url: EXTENSION_URL_TEMPLATE_EXTRACT,
        extension: [
          {url: 'template', valueReference: {reference: '#patient-template'}},
          {url: 'fullUrl', valueString: `'${scope}-${occurrence}'`}
        ]
      }))
    ];
  }

  const questionnaire: fhir.Questionnaire = {
    resourceType: 'Questionnaire',
    meta: {profile: ['http://hl7.org/fhir/5.0/StructureDefinition/Questionnaire']},
    status: 'draft',
    title: 'Repeated template extraction expressions',
    contained: [{resourceType: 'ValueSet', id: 'patient-template', status: 'draft'}],
    extension: scopeExtensions('root'),
    item: [{
      linkId: 'parent',
      text: 'Parent',
      type: 'group',
      extension: [{url: allocateIdUrl, valueString: 'ancestorId'}],
      item: [{
        linkId: 'measurement',
        text: 'Measurement',
        type: 'decimal',
        extension: scopeExtensions('item')
      }]
    }, {
      linkId: '__formbuilder_template_extract_expression__',
      text: 'Existing sibling',
      type: 'group',
      extension: scopeExtensions('sibling')
    }]
  };
  const chooserPromise = page.waitForEvent('filechooser');
  await PWUtils.clickMenuBarDropdownItem(page, 'Import', 'Import from file...');
  await (await chooserPromise).setFiles({
    name: 'repeated-template-extract.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(questionnaire))
  });
  await PWUtils.expandAdvancedFields(page);
  await expect(page.locator('lfb-form-fields lfb-template-extract tbody > tr')).toHaveCount(2);
}

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

    // #observation-template is referenced only by an item, which the form-level model excludes.
    const itemReferencedResourceRow = containedTable.locator('tbody > tr').nth(1);
    await expect(PWUtils.getTableCell(containedTable, 2, 2)).toHaveText('observation-template');
    await itemReferencedResourceRow.getByRole('button', {name: 'Remove this row'}).click();
    await expect(inUseDialog).toContainText(
      'The contained resource #observation-template is referenced by Template-based extraction and cannot be deleted.'
    );
    await inUseDialog.getByRole('button', {name: 'Close', exact: true}).last().click();
    await expect(inUseDialog).toHaveCount(0);
    await expect(containedTable.locator('tbody > tr')).toHaveCount(2);

    await formWidget.getByRole('button', {name: 'Add new template extraction', exact: true}).click();
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
    await expect(itemWidget.getByRole('button', {name: 'Add new template extraction', exact: true})).toBeVisible();
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

  for(const scope of ['form', 'item'] as const) {
    test(`edits only the selected ${scope} occurrence using its extraction variable scope`, async ({page}) => {
      await importRepeatedExtractionQuestionnaire(page);
      if(scope === 'item') {
        await PWUtils.getButton(page, 'Toolbar with button groups', 'Edit questions').click();
        await expect(page.locator('.spinner-border')).not.toBeVisible();
        await PWUtils.clickAndToggleTreeNode(page, 'Parent');
        await PWUtils.clickTreeNode(page, 'Measurement');
      }
      await PWUtils.expandAdvancedFields(page);
      const widget = page.locator(scope === 'form'
        ? 'lfb-form-fields lfb-template-extract'
        : 'lfb-sf-form-wrapper lfb-template-extract');
      await widget.getByRole('button', {name: 'Edit this row'}).nth(1).click();
      const dialog = page.getByRole('dialog', {name: 'Edit template extraction'});
      const original = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
      const expectedExpression = scope === 'form' ? '%rootId' : '%itemId';
      const originalExpression = scope === 'form' ? "'root-second'" : "'item-second'";

      for(const field of ['fullUrl', 'resourceId']) {
        await dialog.getByRole('button', {name: `Create or edit ${field} FHIRPath expression`}).click();
        const editor = page.locator('lhc-expression-editor');
        await expect(editor.locator('#final-expression')).toHaveValue(field === 'fullUrl' ? originalExpression : '');
        await expect(editor.locator('#variables-section')).toHaveCount(0);
        const allocations = editor.locator('#uneditable-variables-section');
        await expect(allocations).toContainText('rootId');
        if(scope === 'item') {
          await expect(allocations).toContainText('ancestorId');
          await expect(allocations).toContainText('itemId');
        }
        else {
          await expect(allocations).not.toContainText('ancestorId');
          await expect(allocations).not.toContainText('itemId');
        }
        for(const excluded of ['rootVariable', 'itemVariable', 'siblingId']) {
          await expect(allocations).not.toContainText(excluded);
        }
        await editor.locator('#final-expression').fill(expectedExpression);
        await editor.locator('#export').click();
        await expect(editor).toHaveCount(0);
        await expect(dialog.getByRole('textbox', {name: `${field} FHIRPath expression`}))
          .toHaveValue(expectedExpression);
        expect(await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).toEqual(original);
      }

      await dialog.getByRole('button', {name: 'Save and close'}).click();
      await expect(dialog).toBeHidden();
      await expect(widget.locator('tbody > tr').nth(1)).toContainText(expectedExpression);
      const expected = structuredClone(original);
      const extensions = scope === 'form' ? expected.extension : expected.item[0].item[0].extension;
      extensions[3].extension = [
        {url: 'template', valueReference: {reference: '#patient-template'}},
        {url: 'fullUrl', valueString: expectedExpression},
        {url: 'resourceId', valueString: expectedExpression}
      ];
      expect(await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).toEqual(expected);
    });
  }

  test('keeps a cleared expression unsaved and discards draft edits without changing the questionnaire', async ({page}) => {
    await importRepeatedExtractionQuestionnaire(page);
    await PWUtils.expandAdvancedFields(page);
    const original = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    const widget = page.locator('lfb-form-fields lfb-template-extract');
    await widget.getByRole('button', {name: 'Edit this row'}).nth(1).click();
    const dialog = page.getByRole('dialog', {name: 'Edit template extraction'});
    await dialog.getByRole('button', {name: 'Create or edit fullUrl FHIRPath expression'}).click();
    const editor = page.locator('lhc-expression-editor');
    await expect(editor.locator('#final-expression')).toHaveValue("'root-second'");

    await editor.locator('#final-expression').fill('');
    await editor.locator('#export').click();

    await expect(editor.locator('#expression-error')).toContainText('Expression is required.');
    await expect(editor.locator('#export')).toHaveClass(/disabled/);
    await expect(page.locator('lfb-template-extract-dlg #template-extract-fullUrl')).toHaveValue("'root-second'");
    expect(await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).toEqual(original);

    await editor.locator('#final-expression').fill("'unsaved draft'");
    await editor.locator('#export').click();
    await expect(editor).toHaveCount(0);
    await expect(dialog.getByRole('textbox', {name: 'fullUrl FHIRPath expression'})).toHaveValue("'unsaved draft'");
    await dialog.getByRole('button', {name: 'Discard changes'}).first().click();
    await expect(dialog).toBeHidden();
    expect(await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).toEqual(original);
    await widget.getByRole('button', {name: 'Edit this row'}).nth(1).click();
    await expect(dialog.getByRole('textbox', {name: 'fullUrl FHIRPath expression'})).toHaveValue("'root-second'");
  });
});
