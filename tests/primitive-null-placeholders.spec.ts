import {test, expect, Locator, Page} from '@playwright/test';
import {MainPO} from './po/main-po';
import {PWUtils} from './pw-utils';

/**
 * Open the home page, start from scratch, and import a fixture.
 *
 * @param page - Browser page.
 * @param file - Name of the fixture file.
 * @returns The imported fixture.
 */
async function importFixture(page: Page, file: string): Promise<any> {
  await page.goto('/');
  await new MainPO(page).loadHomePage();
  await page.getByLabel('Start from scratch').click();
  await page.getByRole('button', {name: 'Continue'}).click();
  const imported = await PWUtils.uploadFile(page, file);
  await expect(page.locator('lfb-form-fields').getByLabel('Title', {exact: true}))
    .toHaveValue(imported.title);
  return imported;
}

/**
 * Show the advanced form-level fields and get the chips of the subjectType values.
 *
 * @param page - Browser page displaying the form-level fields.
 * @returns Locator of the chips.
 */
async function showSubjectTypeChips(page: Page): Promise<Locator> {
  await PWUtils.expandAdvancedFields(page);
  return page.locator('input[id^="subjectType"][id$="_ac"]:visible').first()
    .locator('xpath=..').locator('li');
}

/**
 * In FHIR JSON, a null entry in a repeating primitive element, such as derivedFrom, keeps
 * the values aligned with the entries of the parallel element array, such as _derivedFrom.
 * An element entry may have an id and/or extensions. These tests check that the nulls survive
 * import, export, editing, and autosave.
 */
test.describe('Null placeholders in repeating primitive fields', () => {
  const fixtureFile = 'primitive-null-placeholders.json';
  let fixture: any;

  /**
   * Select the fields of a Questionnaire that have null placeholders in the fixture.
   *
   * @param questionnaire - Questionnaire JSON.
   * @param version - FHIR version of the questionnaire. STU3 has no derivedFrom.
   * @returns Object with the selected fields.
   */
  function placeholderFields(questionnaire: any, version = 'R5'): any {
    const ret: any = {
      subjectType: questionnaire.subjectType,
      _subjectType: questionnaire._subjectType,
      itemExtension: questionnaire.item?.[0]?.extension,
      containedCompose: questionnaire.contained?.[0]?.compose
    };
    if(version !== 'STU3') {
      ret.derivedFrom = questionnaire.derivedFrom;
      ret._derivedFrom = questionnaire._derivedFrom;
    }
    return ret;
  }

  test.beforeEach(async ({page}) => {
    fixture = await importFixture(page, fixtureFile);
  });

  test('keeps the placeholders in R5, R4, and STU3 output', async ({page}) => {
    for(const version of ['R5', 'R4', 'STU3']) {
      const output = await PWUtils.getQuestionnaireJSONWithoutUI(page, version);
      expect(placeholderFields(output, version), version).toEqual(placeholderFields(fixture, version));
    }
  });

  test('keeps the placeholders after an edit and a restore of the autosaved form', async ({page}) => {
    const titleField = page.locator('lfb-form-fields').getByLabel('Title', {exact: true});
    await titleField.fill('Edited title');
    await PWUtils.waitUntilLocalStorageItemIsUpdated(page, 'fhirQuestionnaire', 'Edited title');
    const saved = await page.evaluate(() => JSON.parse(window.localStorage.getItem('fhirQuestionnaire')));
    expect(placeholderFields(saved)).toEqual(placeholderFields(fixture));

    await page.reload();
    // Restoring converts the form with LForms, which loads asynchronously.
    await new MainPO(page).assertLFormsLoaded();
    await page.getByLabel('Would you like to start from where you left off before?').click();
    await page.getByRole('button', {name: 'Continue'}).click();
    await expect(titleField).toHaveValue('Edited title');
    const restored = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(placeholderFields(restored)).toEqual(placeholderFields(fixture));
  });

  test('keeps the placeholders after an edit of the item', async ({page}) => {
    await PWUtils.clickButton(page, 'Toolbar with button groups', 'Edit questions');
    await PWUtils.clickTreeNode(page, 'Name');
    const textField = page.getByLabel('Question text', {exact: true});
    await expect(textField).toHaveValue('Name');
    await textField.fill('Edited name');
    await PWUtils.waitUntilLocalStorageItemIsUpdated(page, 'fhirQuestionnaire', 'Edited name');

    const output = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(output.item[0].text).toBe('Edited name');
    expect(placeholderFields(output)).toEqual(placeholderFields(fixture));
  });

  test('moves the extensions with the remaining subjectType values when a value is removed', async ({page}) => {
    const chips = await showSubjectTypeChips(page);
    await expect(chips).toHaveCount(2);
    await chips.filter({hasText: 'Patient'}).getByRole('button').click();
    await expect(chips).toHaveCount(1);

    const output = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(output.subjectType).toEqual([null, 'Practitioner']);
    expect(output._subjectType).toEqual(fixture._subjectType.slice(1));
  });

  test('shows no validation errors for the placeholders', async ({page}) => {
    const chips = await showSubjectTypeChips(page);
    await expect(chips).toHaveCount(2);
    await expect(page.locator('lfb-meta-profile input')).toHaveCount(fixture.meta.profile.length);

    const formFields = page.locator('lfb-form-fields');
    await expect(formFields.getByText('Expected type string but found type null')).toHaveCount(0);
    await expect(formFields.getByText('Data does not match any schemas')).toHaveCount(0);
  });

  test('saves an edit of the contained ValueSet that has placeholders', async ({page}) => {
    await PWUtils.expandAdvancedFields(page);
    const containedTable = PWUtils.getTableByFieldLabel(page.locator('lfb-form-fields'), 'Contained resources');
    await containedTable.getByRole('button', {name: 'Edit this row'}).first().click();
    const dialog = page.locator('lfb-resource-dlg');
    await dialog.getByLabel('Title', {exact: true}).fill('Edited value set');

    await dialog.getByRole('button', {name: 'Save and close'}).click();
    await expect(dialog).toHaveCount(0);
    const output = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(output.contained[0].title).toBe('Edited value set');
    expect(output.contained[0].compose).toEqual(fixture.contained[0].compose);
  });

  test.describe('Profiles of meta', () => {
    /**
     * Show the profile rows of meta in the advanced fields.
     *
     * @param page - Browser page displaying the form-level fields.
     * @returns Locators of the profile inputs and of their remove buttons.
     */
    async function showProfiles(page: Page): Promise<{inputs: Locator, removeButtons: Locator}> {
      await PWUtils.expandAdvancedFields(page);
      const profiles = page.locator('lfb-meta-profile');
      const inputs = profiles.locator('input');
      await expect(inputs).toHaveCount(fixture.meta.profile.length);
      return {inputs, removeButtons: profiles.getByRole('button', {name: 'Remove this row'})};
    }

    /**
     * Get meta.profile and meta._profile of the R5 output.
     *
     * @param page - Browser page displaying the form builder.
     * @returns Object with the profile and _profile fields of meta.
     */
    async function outputProfiles(page: Page): Promise<any> {
      const meta = (await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).meta;
      return {profile: meta?.profile, _profile: meta?._profile};
    }

    test('moves the extensions with the remaining profiles when a profile is removed', async ({page}) => {
      const {inputs, removeButtons} = await showProfiles(page);
      await removeButtons.first().click();
      await expect(inputs).toHaveCount(2);

      const expected = {profile: fixture.meta.profile.slice(1), _profile: fixture.meta._profile.slice(1)};
      expect(await outputProfiles(page)).toEqual(expected);
      await expect.poll(() => page.evaluate(() => {
        const meta = JSON.parse(window.localStorage.getItem('fhirQuestionnaire'))?.meta;
        return {profile: meta?.profile, _profile: meta?._profile};
      })).toEqual(expected);
    });

    test('keeps the extensions of profiles that are edited, or cleared and entered again', async ({page}) => {
      const {inputs} = await showProfiles(page);
      const [, second, third] = fixture.meta.profile;
      const elements = fixture.meta._profile;

      await inputs.nth(0).fill('http://example.org/StructureDefinition/edited');
      await expect.poll(() => outputProfiles(page)).toEqual({
        profile: ['http://example.org/StructureDefinition/edited', second, third],
        _profile: elements
      });

      await inputs.nth(2).fill('');
      await expect.poll(() => outputProfiles(page)).toEqual({
        profile: ['http://example.org/StructureDefinition/edited', second],
        _profile: elements.slice(0, 2)
      });

      await inputs.nth(2).fill(third);
      await expect.poll(() => outputProfiles(page)).toEqual({
        profile: ['http://example.org/StructureDefinition/edited', second, third],
        _profile: elements
      });
    });

    test('adds no extensions for a new profile', async ({page}) => {
      const {inputs} = await showProfiles(page);
      await page.getByRole('button', {name: 'Add profile'}).click();
      await expect(inputs).toHaveCount(4);
      await inputs.nth(3).fill('http://example.org/StructureDefinition/new');

      await expect.poll(() => outputProfiles(page)).toEqual({
        profile: [...fixture.meta.profile, 'http://example.org/StructureDefinition/new'],
        _profile: [...fixture.meta._profile, null]
      });
    });
  });
});

/**
 * In FHIR JSON, an element array, such as _subjectType, may be longer than its value array.
 * Its extra entries belong to implicit trailing null values. These tests check that they are
 * kept when values are removed or added.
 */
test.describe('Elements of implicit trailing null values', () => {
  let fixture: any;

  test.beforeEach(async ({page}) => {
    fixture = await importFixture(page, 'primitive-trailing-elements.json');
  });

  test('are kept when a subjectType value is removed', async ({page}) => {
    const chips = await showSubjectTypeChips(page);
    await expect(chips).toHaveCount(2);
    await chips.filter({hasText: 'Patient'}).getByRole('button').click();
    await expect(chips).toHaveCount(1);

    const output = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    expect(output.subjectType).toEqual(['Practitioner', null]);
    expect(output._subjectType).toEqual(fixture._subjectType.slice(1));
  });

  test('are kept when a profile is added', async ({page}) => {
    await PWUtils.expandAdvancedFields(page);
    const inputs = page.locator('lfb-meta-profile input');
    await expect(inputs).toHaveCount(1);
    await page.getByRole('button', {name: 'Add profile'}).click();
    await expect(inputs).toHaveCount(2);
    await inputs.nth(1).fill('http://example.org/StructureDefinition/new');

    await expect.poll(async () => (await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5')).meta).toEqual({
      profile: [...fixture.meta.profile, 'http://example.org/StructureDefinition/new', null],
      _profile: [null, null, ...fixture.meta._profile.slice(1)]
    });
  });
});




