import {test, expect, Page} from '@playwright/test';
import {MainPO} from "./po/main-po";
import {PWUtils} from "./pw-utils";
import fhir from 'fhir/r4';

/**
 * Map UI field labels to fields in the questionnaire item.
 */
const fieldsMap = {
  'Question text': 'text',
  'Prefix': 'prefix',
  'Help text': 'text' // .text of child item.
};


/**
 * Assert component's field input along with its element's (i.e. _{field}) value.
 * @param fieldLabel - Field's label
 * @param actualItem - Value of fhir.QuestionnaireItem to which the field belongs.
 * @param expectedInput - Expected value of input box.
 * @param expectedElement - Expected value of _{field} element
 */
function assertFieldAndElement(fieldLabel: string,
                               actualItem: fhir.QuestionnaireItem,
                               expectedInput: string,
                               expectedElement: fhir.Element) {
  const fieldName = fieldsMap[fieldLabel];
  const elementName = '_'+fieldName;
  const fieldType = fieldLabel === 'Help text' ? 'display' : 'string';
  expect(actualItem.type).toEqual(fieldType);
  expect(actualItem[fieldName]).toEqual(expectedInput);
  expect(actualItem[elementName]).toEqual(expectedElement);
}

/**
 * Edit and check UI elements where this component is used.
 *
 * @param page - Page from browser
 * @param fieldLabel - Field label in the UI such as 'Question text',
 * 'Prefix', and 'Help text' etc.
 */
async function assertInputs(page, fieldLabel) {
  let inputEl = page.getByLabel(fieldLabel, {exact: true});
  const inputGroup = inputEl.locator('..');
  await expect(inputEl).toHaveValue(fieldLabel + ': plain text');
  await inputEl.clear();
  await inputEl.fill(fieldLabel + ': modified plain text');
  await inputGroup.getByRole('button', {name: 'CSS Styles'}).click();
  inputEl = inputGroup.getByLabel('Specify CSS Styles');
  await expect(inputEl).toHaveValue('color: red; /*' + fieldLabel + ': CSS*/');
  await inputEl.clear();
  await inputEl.fill('/*'+fieldLabel + ': modified CSS*/');
  await inputGroup.getByRole('button', {name: 'Close'}).click();

  await inputGroup.getByRole('button', {name: 'XHTML'}).click();
  inputEl = inputGroup.getByLabel('Specify XHTML');
  await expect(inputEl).toHaveValue(fieldLabel + ': <b>XHTML</b>');
  await inputEl.clear();
  await inputEl.fill(fieldLabel + ': modified <b>XHTML</b>');
  await inputGroup.getByRole('button', {name: 'Close'}).click();
}

const FIELD_LABELS = ['Question text', 'Prefix', 'Help text'];

test.describe('string-with-css.component.spec.ts', async () => {
  let mainPO: MainPO;
  test.beforeEach(async ({page}) => {
        await page.goto('/');
        mainPO = new MainPO(page);
        await mainPO.cleanLoadILPage();
  });

  FIELD_LABELS.forEach((fieldLabel) => {
    test(fieldLabel + ': Should add plain text/CSS/XHTML', async ({page}) => {
      const inputGroup = page.getByLabel(fieldLabel).locator('..');
      await inputGroup.locator('input').clear();
      await inputGroup.locator('input').fill(fieldLabel+' plain text');
      await inputGroup.getByRole('button', {name: 'CSS Styles'}).click();
      let dropdown = await inputGroup.locator('div.dropdown-menu.show');
      await expect(dropdown).toBeVisible();
      await inputGroup.getByLabel('Specify CSS Styles').fill('font-style: italic /*'+fieldLabel+'*/');
      await dropdown.getByRole('button', {name: 'Close'}).click();
      await expect(dropdown).not.toBeVisible();

      await inputGroup.getByRole('button', {name: 'XHTML'}).click();
      dropdown = await inputGroup.locator('div.dropdown-menu.show');
      await expect(dropdown).toBeVisible();

      await inputGroup.getByLabel('Specify XHTML').fill(fieldLabel + '<b>XHTML</b> text');
      await dropdown.getByRole('button', {name: 'Close'}).click();
      await expect(dropdown).not.toBeVisible();
      const q = await PWUtils.getQuestionnaireJSON(page, 'R5');
      let item = q.item[0];

      if(fieldLabel === 'Help text') {
        // Switch to child item for assertions of input and element.
        item = item.item[0];
        // Assert help button item control extension on the child item.
        expect(item.extension).toEqual([{
          url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
          valueCodeableConcept: {
            text: 'Help-Button',
            coding: [
              {
                code: 'help',
                system: 'http://hl7.org/fhir/questionnaire-item-control',
                display: 'Help-Button'
              }
            ]
          }
        }]);
      }

      assertFieldAndElement(
        fieldLabel,
        item,
        fieldLabel + ' plain text',
        {
          extension: [{
            url: 'http://hl7.org/fhir/StructureDefinition/rendering-style',
            valueString: 'font-style: italic /*'+fieldLabel+'*/'
          }, {
            url: 'http://hl7.org/fhir/StructureDefinition/rendering-xhtml',
            valueString: fieldLabel + '<b>XHTML</b> text'
          }]
        }
      );
    });
  });

  test('should import items with CSS styles, XHTML, and help text', async ({page}) => {

    const fileJson = await PWUtils.uploadFile(page, 'fixtures/css-xhtml-sample.json', true);
    let q = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(q).toEqual(fileJson);
    await page.getByRole('button', {name: 'Edit questions'}).click();

    await assertInputs(page, 'Question text');
    await assertInputs(page, 'Prefix');
    await assertInputs(page, 'Help text');

    q = await PWUtils.getQuestionnaireJSON(page, 'R5');
    expect(q.item[0].text).toEqual('Question text: modified plain text');
    expect(q.item[0]._text.extension[0].valueString).toEqual('/*Question text: modified CSS*/');
    expect(q.item[0]._text.extension[1].valueString).toEqual('Question text: modified <b>XHTML</b>');

    expect(q.item[0].prefix).toEqual('Prefix: modified plain text');
    expect(q.item[0]._prefix.extension[0].valueString).toEqual('/*Prefix: modified CSS*/');
    expect(q.item[0]._prefix.extension[1].valueString).toEqual('Prefix: modified <b>XHTML</b>');

    expect(q.item[0].item[0].text).toEqual('Help text: modified plain text');
    expect(q.item[0].item[0]._text.extension[0].valueString).toEqual('/*Help text: modified CSS*/');
    expect(q.item[0].item[0]._text.extension[1].valueString).toEqual('Help text: modified <b>XHTML</b>');
  });

  test('Bugfix: should detect help text on the second item in the tree', async ({page}) => {
    await PWUtils.uploadFile(page, 'fixtures/help-text-sample1.json', true);
    await page.getByRole('button', {name: 'Edit questions'}).click();
    await PWUtils.clickAndToggleTreeNode(page,'Parent');
    await PWUtils.clickTreeNode(page, 'First');
    const inputEl = page.getByLabel('Help text', {exact: true});
    await expect(inputEl).toHaveValue(/^First item help/);
    await PWUtils.clickTreeNode(page, 'Second');
    await expect(inputEl).toHaveValue(/^<code>Text<\/code> instructions,/);
  });
});
