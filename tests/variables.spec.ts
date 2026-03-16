import {test, expect, Page, Locator} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils, VariableTestCase} from "./pw-utils";
import { BasePageComponent } from 'src/app/base-page/base-page.component';

test.describe('variables', async () => {
  let mainPO: MainPO;
  let fileJson;

  const variableTests: VariableTestCase[] = [
    {
      name: 'FHIRPath Expression variable',
      label: 'a',
      type: 'FHIRPath Expression',
      input: {
        kind: 'text',
        selector: 'input#variable-expression-0',
        value: "%resource.item.where(linkId='/29453-7').answer.value",
      },
      expectedType: 'FHIRPath Expression',
      expectedValue: "%resource.item.where(linkId='/29453-7').answer.value"
    },
    {
      name: 'FHIR Query variable',
      label: 'b',
      type: 'FHIR Query',
      input: {
        kind: 'text',
        selector: 'input#variable-expression-0',
        value: "Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))",
      },
      expectedType: 'FHIR Query',
      expectedValue: "Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))"
    },
    {
      name: 'FHIR Query (Observation) variable',
      label: 'c',
      type: 'FHIR Query (Observation)',
      input: {
        kind: 'autocomplete',
        selector: 'lhc-query-observation #autocomplete-0',
        search: 'weight',
      },
      expectedType: 'FHIR Query (Observation)',
      expectedValue: 'Observation?code=weight&date=gt{{today()-1 months}}&patient={{%patient.id}}&_sort=-date&_count=1'
    },
    {
      name: 'Question variable',
      label: 'd',
      type: 'Question',
      input: {
        kind: 'dropdown',
        selector: 'input#question-0',
        search: "Type Initial Value (Single) (/itm1)",
      },
      expectedType: 'Question',
      expectedValue: "%resource.item.where(linkId='/itm1').answer.value"
    },
    {
      name: 'Easy Path Expression variable',
      label: 'e',
      type: 'Easy Path Expression',
      input: {
        kind: 'text',
        selector: 'input#simple-expression-0',
        value: '1',
      },
      expectedType: 'Easy Path Expression',
      expectedValue: '1'
    }
  ];
  let computeInitial: Locator;

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();

    fileJson = await PWUtils.uploadFile(page, 'value-methods-sample.json', true);
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');

    computeInitial = await PWUtils.getRadioButtonLabel(page, 'Value method', 'Compute initial value');
  });

  test('should create various types of variables', async ({ page }) => {
    await MainPO.mockFHIRQueryObservation(page);

    // Add a new item under the 'None' item
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Variables');
    await PWUtils.selectDataType(page, 'integer');

    // Click the 'Create/edit variables' button and add five different types of variables
    await page.locator('button#editVariables').click();

    const expressionEditor = page.locator('lhc-expression-editor');
    const shadowRoot = await expressionEditor.evaluateHandle(el => el.shadowRoot);

    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

    // Add a new variable 'a_fhir_exp'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
    await page.locator('#variable-label-0').clear();
    await page.locator('#variable-label-0').fill('a_fhir_exp');
    await page.locator('#variable-type-0').selectOption('FHIRPath Expression');
    await page.locator('input#variable-expression-0').fill("%resource.item.where(linkId='/29453-7').answer.value");
    await expect(page.locator('input#variable-expression-0')).not.toHaveClass(/field-error/);

    // Add a new variable 'b_fhir_query'
    await page.locator('#add-variable').click();
    await page.locator('#variable-label-1').clear();
    await page.locator('#variable-label-1').fill('b_fhir_query');
    await page.locator('#variable-type-1').selectOption('FHIR Query');
    await page.locator('input#variable-expression-1')
      .fill("Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))");
    await expect(page.locator('input#variable-expression-1')).not.toHaveClass(/field-error/);

    // Add a new variable 'c_fhir_query_obs'
    await page.locator('#add-variable').click();
    await page.locator('#variable-label-2').clear();
    await page.locator('#variable-label-2').fill('c_fhir_query_obs');
    await page.locator('#variable-type-2').selectOption('FHIR Query (Observation)');

    const queryObs = page.locator('lhc-query-observation').locator('#autocomplete-2');

    // Search for invalid code, should return empty array
    await PWUtils.selectAutocompleteOptions(
      page,
      '#autocomplete-2',
      false,
      'invalidCode',
      null,
      ['ArrowDown', 'Enter'],
      []
    );

    // Search for 'weight', should return selected result
    await PWUtils.selectAutocompleteOptions(
      page,
      '#autocomplete-2',
      true,
      'Weight',
      null,
      ['ArrowDown', 'Enter'],
      ['×Weight - 29463-7']
    );

    // Add a new variable 'd_question'
    await page.locator('#add-variable').click();
    await page.locator('#variable-label-3').clear();
    await page.locator('#variable-label-3').fill('d_question');
    await expect(page.locator('#variable-type-3')).toHaveValue('question');
    const question3 = page.locator('#question-3');
    await expect(question3).toBeVisible();
    await question3.click();
    await question3.pressSequentially('Pick Initial Value (Single)');

    await question3.press('ArrowDown');
    await question3.press('Enter');

    // Add a new variable 'e_easy_path_exp'
    await page.locator('#add-variable').click();
    await page.locator('#variable-label-4').clear();
    await page.locator('#variable-label-4').click();
    await page.locator('#variable-label-4').pressSequentially('e_easy_path_exp');

    await page.locator('#variable-type-4').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-4').fill('1');

    // Save the variables
    await page.locator('#export').click();

    // Item Variables section should now show 5 variables
    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(5);

    const firstVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(1)');
    const secondVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(2)');
    const thirdVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(3)');
    const fourthVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(4)');
    const fifthVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(5)');

    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('a_fhir_exp');
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('FHIRPath Expression');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText("%resource.item.where(linkId='/29453-7').answer.value");

    await expect(secondVariable.locator('td:nth-child(1)')).toHaveText('b_fhir_query');
    await expect(secondVariable.locator('td:nth-child(2)')).toHaveText('FHIR Query');
    await expect(secondVariable.locator('td:nth-child(3)')).toHaveText("Observation.component.where(code.memberOf(%'vs-observation-vitalsignresult'))");

    await expect(thirdVariable.locator('td:nth-child(1)')).toHaveText('c_fhir_query_obs');
    await expect(thirdVariable.locator('td:nth-child(2)')).toHaveText('FHIR Query (Observation)');
    await expect(thirdVariable.locator('td:nth-child(3)')).toHaveText("Observation?code=http%3A%2F%2Floinc.org%7C29463-7&date=gt{{today()-1 months}}&patient={{%patient.id}}&_sort=-date&_count=1");

    await expect(fourthVariable.locator('td:nth-child(1)')).toHaveText('d_question');
    await expect(fourthVariable.locator('td:nth-child(2)')).toHaveText('Question');
    await expect(fourthVariable.locator('td:nth-child(3)')).toHaveText("%resource.item.where(linkId='/itm3').answer.value");

    await expect(fifthVariable.locator('td:nth-child(1)')).toHaveText('e_easy_path_exp');
    await expect(fifthVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(fifthVariable.locator('td:nth-child(3)')).toHaveText('1');
  });

  test('should create, edit, and delete variables', async ({page}) => {
    // Add a new item under the 'None' item
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Variables');
    await PWUtils.selectDataType(page, 'integer');

    // Click the 'Create/edit variables' button and add three new variables
    await page.locator('button#editVariables').click();

    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

    // Add variable 'a'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
    await page.locator('#variable-label-0').clear();
    await page.locator('#variable-label-0').fill('a');
    await page.locator('#variable-type-0').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-0').fill('10');

    // Add variable 'b'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);
    await page.locator('#variable-label-1').clear();
    await page.locator('#variable-label-1').fill('b');
    await page.locator('#variable-type-1').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-1').fill('11');

    // Add variable 'c'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(3);
    await page.locator('#variable-label-2').clear();
    await page.locator('#variable-label-2').fill('c');
    await page.locator('#variable-type-2').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-2').fill('12');

    // Save
    await page.locator('#export').click();

    // Item Variables section should now show 3 variables
    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(3);

    const firstVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(1)');
    const secondVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(2)');
    const thirdVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(3)');

    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('a');
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText('10');

    await expect(secondVariable.locator('td:nth-child(1)')).toHaveText('b');
    await expect(secondVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(secondVariable.locator('td:nth-child(3)')).toHaveText('11');

    await expect(thirdVariable.locator('td:nth-child(1)')).toHaveText('c');
    await expect(thirdVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(thirdVariable.locator('td:nth-child(3)')).toHaveText('12');

    // Click the 'Create/edit variables' button again to edit variables
    await page.locator('button#editVariables').click();
    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(3);

    // Rename variable 'a' to 'a1' and assign new value
    await page.locator('#variable-label-0').clear();
    await page.locator('#variable-label-0').fill('a1');
    await page.locator('input#simple-expression-0').clear();
    await page.locator('input#simple-expression-0').fill('100');

    // Save the changes
    await page.locator('#export').click();

    // Check the updated variable
    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('a1');
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText('100');

    // Delete second and third variables
    await secondVariable.locator('td:nth-child(4) button').click();
    // Third variable became second
    await secondVariable.locator('td:nth-child(4) button').click();

    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(1);
  });

  test('should display variables correctly on both Item Variables field and when editing expression in Expression Editor', async ({page}) => {
    // Add a new item
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Compute initial value expression');
    await PWUtils.selectDataType(page, 'integer');

    await expect(computeInitial).toBeVisible();
    await computeInitial.click();
    await expect(page.locator('[id^="__\\$initialExpression"]')).toBeEmpty();
    await page.locator('[id^="edit__\\$initialExpression"]').click();

    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await PWUtils.expandExpressionItemVariablesSection(page);

    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

    // Add variable 'a'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
    await page.locator('#variable-label-0').clear();
    await page.locator('#variable-label-0').fill('a');
    await page.locator('#variable-type-0').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-0').fill('1');

    // Add variable 'b'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);
    await page.locator('#variable-label-1').clear();
    await page.locator('#variable-label-1').fill('b');
    await page.locator('#variable-type-1').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-1').fill('2');

    // Output expression
    await page.locator('textarea#final-expression').clear();
    await page.locator('textarea#final-expression').fill('%a + %b');

    const lines = page.locator('lhc-syntax-preview>div>div>pre');
    const count = await lines.count();

    for (let i = 0; i < count; i++) {
      await expect(lines.nth(i)).not.toHaveText('Not valid');
    }

    // Save
    await page.locator('#export').click();

    await expect(page.locator('[id^="__\\$initialExpression"]')).toHaveValue('%a + %b');

    // Item Variables section should now show 2 variables
    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(2);

    const firstVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(1)');
    const secondVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(2)');

    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('a');
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText('1');

    await expect(secondVariable.locator('td:nth-child(1)')).toHaveText('b');
    await expect(secondVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(secondVariable.locator('td:nth-child(3)')).toHaveText('2');

    // Add a new variable from the 'Item Variables' section
    await page.locator('button#editVariables').click();
    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);

    // Add variable 'c'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(3);
    await page.locator('#variable-label-2').clear();
    await page.locator('#variable-label-2').fill('c');
    await page.locator('#variable-type-2').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-2').fill('3');

    // Save
    await page.locator('#export').click();

    // Item Variables section should now show 3 variables
    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(3);
    const thirdVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(3)');

    await expect(thirdVariable.locator('td:nth-child(1)')).toHaveText('c');
    await expect(thirdVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(thirdVariable.locator('td:nth-child(3)')).toHaveText('3');

    // Go back to the Expression Editor to check that the settings are still correct
    await page.locator('[id^="edit__\\$initialExpression"]').click();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await PWUtils.expandExpressionItemVariablesSection(page);

    await expect(page.locator('#variables-section .variable-row')).toHaveCount(3);

    await expect(page.locator('#variable-label-0')).toHaveValue('a');
    await expect(page.locator('#variable-type-0')).toHaveValue('simple');
    await expect(page.locator('input#simple-expression-0')).toHaveValue('1');

    await expect(page.locator('#variable-label-1')).toHaveValue('b');
    await expect(page.locator('#variable-type-1')).toHaveValue('simple');
    await expect(page.locator('input#simple-expression-1')).toHaveValue('2');

    await expect(page.locator('#variable-label-2')).toHaveValue('c');
    await expect(page.locator('#variable-type-2')).toHaveValue('simple');
    await expect(page.locator('input#simple-expression-2')).toHaveValue('3');
  });

  test('should display variables that were added independently from the expression', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Type Initial Value (Single)');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Compute initial value expression');
    await PWUtils.selectDataType(page, 'integer');

    await expect(computeInitial).toBeVisible();
    await computeInitial.click();
    await expect(page.locator('[id^="__\\$initialExpression"]')).toBeEmpty();
    await page.locator('[id^="edit__\\$initialExpression"]').click();

    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

    // Output expression
    await page.locator('textarea#final-expression').clear();
    await page.locator('textarea#final-expression').fill('1 + 2');

    // Save
    await page.locator('#export').click();

    await expect(page.locator('[id^="__\\$initialExpression"]')).toHaveValue('1 + 2');

    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');

    expect(qJson.item[1].extension).toEqual([
      {
        "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression",
        "valueExpression": {
          "language": "text/fhirpath",
          "expression": "1 + 2"
        }
      }
    ]);

    // Add variable 'a' via the 'Item Variables' section
    await page.locator('button#editVariables').click();
    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

    // Add variable 'a'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
    await page.locator('#variable-label-0').clear();
    await page.locator('#variable-label-0').fill('a');
    await page.locator('#variable-type-0').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-0').fill('30');

    // Save
    await page.locator('#export').click();

    // Item Variables section should now show 1 variable
    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(1);
    const firstVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(1)');
    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('a');
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText('30');

    // Click the 'Create/edit expression' again
    await page.locator('[id^="edit__\\$initialExpression"]').click();

    // Variables section should show variable 'a' that was created prior
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await PWUtils.expandExpressionItemVariablesSection(page);

    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);

    await expect(page.locator('#variable-label-0')).toHaveValue('a');
    await expect(page.locator('#variable-type-0')).toHaveValue('simple');
    await expect(page.locator('input#simple-expression-0')).toHaveValue('30');

    // Update the Output expression to include variable 'a'
    await page.locator('textarea#final-expression').clear();
    await page.locator('textarea#final-expression').fill('1 + 2 + %a');

    // Save
    await page.locator('#export').click();

    await expect(page.locator('[id^="__\\$initialExpression"]')).toHaveValue('1 + 2 + %a');

    //const qJson2 = await utils.questionnaireJSON();
    const qJson2 = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');

    expect(qJson2.item[1].extension).toEqual([
      {
        "url": "http://hl7.org/fhir/StructureDefinition/variable",
        "valueExpression": {
          "name": "a",
          "language": "text/fhirpath",
          "expression": "30",
          "extension": [
            {
              "url": "http://lhcforms.nlm.nih.gov/fhirExt/expression-editor-variable-type",
              "valueString": "simple"
            },
            {
              "url": "http://lhcforms.nlm.nih.gov/fhirExt/simple-syntax",
              "valueString": "30"
            }
          ]
        }
      },
      {
        "url": "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression",
        "valueExpression": {
          "language": "text/fhirpath",
          "expression": "1 + 2 + %a"
        }
      }
    ]);

    // Click the 'Preview' button to see the initial value
    await page.locator('button:has-text("Preview")').click();
    const wcLhcForm = page.locator('wc-lhc-form');
    await expect(wcLhcForm).toBeAttached();

    // The initial value should show 33
    const lhcInput = wcLhcForm.locator('lhc-input > input').nth(1);
    await expect(lhcInput).toHaveValue('33');
  });

  test('should not allow saving an item variable with a missing value and display validation error', async ({page}) => {
    // Add a new item
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Variable validation');
    await PWUtils.selectDataType(page, 'integer');

    // Click the 'Create/edit variables' button and add two new variables
    await page.locator('button#editVariables').click();
    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);
    await expect(page.locator('lhc-variables div.no-variables')).toContainText('There are currently no variables for this item.');

    // Add variable 'a'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
    await page.locator('#variable-label-0').clear();
    await page.locator('#variable-label-0').fill('a');
    await page.locator('#variable-type-0').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-0').fill('10');

    // Add variable 'b' - intentionally not filling the value
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);
    await page.locator('#variable-label-1').clear();
    await page.locator('#variable-label-1').fill('b');
    await page.locator('#variable-type-1').selectOption('Easy Path Expression');

    // Save - should fail validation
    await page.locator('#export').click();

    // The validation should fail and display the error
    await expect(page.locator('input#simple-expression-1')).toHaveClass(/field-error/);
    await expect(page.locator('input#simple-expression-1')).toHaveClass(/ng-invalid/);

    // Check for error message
    const errorMsg = page.locator('lhc-syntax-converter#variable-expression-1 div#expression-error > p');
    await expect(errorMsg).toContainText('Expression is required.');

    // The Save button should be disabled
    await expect(page.locator('button#export')).toHaveClass(/disabled/);
  });

  test('should display type as blank if the item does not contain custom variable type extension', async ({page}) => {
    await PWUtils.clickTreeNode(page, 'Compute Initial Value with variables without custom expression-editor-variable-type');
    // Item Variables section should show 2 variables
    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(2);
    const firstVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(1)');
    const secondVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(2)');

    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('a');
    // The type column should be blank
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText("1");

    await expect(secondVariable.locator('td:nth-child(1)')).toHaveText('b');
    // The type column should be blank
    await expect(secondVariable.locator('td:nth-child(2)')).toHaveText('');
    await expect(secondVariable.locator('td:nth-child(3)')).toHaveText("2");

    // Click the 'Create/edit variables' button
    await page.locator('button#editVariables').click();
    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);

    await expect(page.locator('#variable-label-0')).toHaveValue('a');
    await expect(page.locator('#variable-type-0')).toHaveValue('simple');
    await expect(page.locator('input#simple-expression-0')).toHaveValue('1');

    await expect(page.locator('#variable-label-1')).toHaveValue('b');
    await expect(page.locator('#variable-type-1')).toHaveValue('simple');
    await expect(page.locator('input#simple-expression-1')).toHaveValue('2');

    // Save
    await page.locator('#export').click();

    // After export, the type will now show
    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('a');
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText("1");

    await expect(secondVariable.locator('td:nth-child(1)')).toHaveText('b');
    await expect(secondVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(secondVariable.locator('td:nth-child(3)')).toHaveText("2");
  });

  test('should delete all variables and verify none remain', async ({page}) => {
    // Add a new item
    await PWUtils.clickTreeNode(page, 'None');
    const addNewItemButton = PWUtils.getButton(page, null, 'Add new item');
    await addNewItemButton.scrollIntoViewIfNeeded();
    await addNewItemButton.click();
    const itemTextField = await PWUtils.getItemTextField(page);
    await itemTextField.clear();
    await itemTextField.fill('Deleting Variables');
    await PWUtils.selectDataType(page, 'integer');

    // Click the 'Create/edit variables' button and add two variables
    await page.locator('button#editVariables').click();
    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

    // Add variable 'a'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);
    await page.locator('#variable-label-0').clear();
    await page.locator('#variable-label-0').fill('a');
    await page.locator('#variable-type-0').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-0').fill('10');

    // Add variable 'b'
    await page.locator('#add-variable').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);
    await page.locator('#variable-label-1').clear();
    await page.locator('#variable-label-1').fill('b');
    await page.locator('#variable-type-1').selectOption('Easy Path Expression');
    await page.locator('input#simple-expression-1').fill('11');

    // Save
    await page.locator('#export').click();

    // Item Variables section should show 2 variables
    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(2);
    const firstVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(1)');
    const secondVariable = page.locator('lfb-variable table > tbody > tr:nth-of-type(2)');

    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('a');
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText('10');

    await expect(secondVariable.locator('td:nth-child(1)')).toHaveText('b');
    await expect(secondVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(secondVariable.locator('td:nth-child(3)')).toHaveText('11');

    // Click the 'Create/edit variables' button again
    await page.locator('button#editVariables').click();
    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(2);

    // Delete the 1st variable
    await page.locator('button#remove-variable-0').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);

    // Save
    await page.locator('#export').click();

    // Item Variables section should now show 1 variable
    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(1);

    await expect(firstVariable.locator('td:nth-child(1)')).toHaveText('b');
    await expect(firstVariable.locator('td:nth-child(2)')).toHaveText('Easy Path Expression');
    await expect(firstVariable.locator('td:nth-child(3)')).toHaveText('11');

    // Click the 'Create/edit variables' button again
    await page.locator('button#editVariables').click();
    await expect(page.locator('#expression-editor-base-dialog')).toBeAttached();

    // Variables section
    await expect(page.locator('lhc-variables > h2')).toContainText('Item Variables');
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(1);

    // Delete the variable
    await page.locator('button#remove-variable-0').click();
    await expect(page.locator('#variables-section .variable-row')).toHaveCount(0);

    // Save
    await page.locator('#export').click();

    // Item Variables section should now be empty
    await expect(page.locator('lfb-variable table > tbody > tr')).toHaveCount(0);
  });

  test.describe('should create various item variables in the expression editor', () => {

    for (const t of variableTests) {
      test(`should create ${t.name}`, async ({ page }) => {
        await PWUtils.clickTreeNode(page, 'None');
        await PWUtils.getButton(page, null, 'Add new item').click();
        await PWUtils.createSingleVariable(page, t);
      });
    }
  });
});
