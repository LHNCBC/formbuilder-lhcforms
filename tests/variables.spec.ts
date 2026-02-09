import {test, expect, Page} from '@playwright/test';
import { MainPO } from './po/main-po';
import {PWUtils, VariableTestCase} from "./pw-utils";

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

  test.beforeEach(async ({page}) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadILPage();

    fileJson = await PWUtils.uploadFile(page, './fixtures/value-methods-sample.json', true);
    await page.getByRole('button', { name: 'Edit questions' }).last().click();
  });

  test.describe('should create various item variables in the expression editor', () => {

    for (const t of variableTests) {
      test(`should create ${t.name}`, async ({ page }) => {
        await PWUtils.clickTreeNode(page, 'None');
        await page.getByRole('button', {name: 'Add new item', exact: true}).click();
        await PWUtils.createSingleVariable(page, t);
      });
    }
  });
});
