import { test, expect } from '@playwright/test';
import { MainPO } from './po/main-po';
import { PWUtils } from './pw-utils';

test.describe('Meta field tests', () => {
  let mainPO: MainPO;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    mainPO = new MainPO(page);
    await mainPO.loadFLPage();
  });

  test('should populate meta subfields and verify readonly fields', async ({ page }) => {
    // Open Advanced fields to access meta
    await page.getByRole('button', { name: 'Advanced fields' }).click();
    
    // Wait for Meta section to be visible
    await page.getByLabel('Meta').waitFor({ state: 'visible' });
    
    // Verify versionId is readonly by checking the input with label
    const versionIdInput = page.getByRole('textbox', { name: 'Version ID (Read-only)' });
    await expect(versionIdInput).toHaveAttribute('readonly', '');
    await expect(versionIdInput).toHaveValue(''); // Should be empty initially
    
    // Verify lastUpdated is readonly
    const lastUpdatedInput = page.getByRole('textbox', { name: 'Last updated (Read-only)' });
    await expect(lastUpdatedInput).toHaveAttribute('readonly', '');
    await expect(lastUpdatedInput).toHaveValue(''); // Should be empty initially
    
    // Populate source field (should be editable)
    const sourceInput = page.locator('input[name="meta.source_2"]');
    await sourceInput.fill('https://example.org/fhir/source');
    await expect(sourceInput).toHaveValue('https://example.org/fhir/source');
    
    // Add 2 profiles
    const addProfileButton = page.getByRole('button', { name: 'Add profile' });
    
    // First profile
    await addProfileButton.click();
    const profile0Input = page.locator('[id^="meta.profile.0_"]').first();
    await profile0Input.fill('http://hl7.org/fhir/5.0/StructureDefinition/Questionnaire');
    
    // Second profile
    await addProfileButton.click();
    const profile1Input = page.locator('[id^="meta.profile.1_"]').first();
    await profile1Input.fill('http://example.org/fhir/StructureDefinition/CustomProfile');
    
    // Add 2 security labels using table
    const securityTableData = [
      ['test health data', 'HTEST', 'http://terminology.hl7.org/CodeSystem/v3-ActReason'],
      ['restricted', 'R', 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality']
    ];
    const securityTable = page.locator('lfb-table table')
      .filter({ has: page.locator('input[name^="meta.security."]') })
      .first();
    await mainPO.loadTable(securityTable, securityTableData);
    
    // Add 2 tags using table
    const tagTableData = [
      ['Patient Survey', 'survey', 'http://example.org/tags'],
      ['Version 2', 'v2', 'http://example.org/tags']
    ];
    const tagTable = page.locator('lfb-table table')
      .filter({ has: page.locator('input[name^="meta.tag."]') })
      .first();
    await mainPO.loadTable(tagTable, tagTableData);
    
    // Verify the data in the questionnaire JSON
    const q = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    
    // Check source
    expect(q.meta.source).toBe('https://example.org/fhir/source');
    
    // Check profiles
    expect(q.meta.profile).toEqual([
      'http://hl7.org/fhir/5.0/StructureDefinition/Questionnaire',
      'http://example.org/fhir/StructureDefinition/CustomProfile'
    ]);
    
    // Check security labels
    const inputSecurity = q.meta.security.slice(0, 2);
    expect(inputSecurity).toEqual([
      {
        display: 'test health data',
        code: 'HTEST',
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason'
      },
      {
        display: 'restricted',
        code: 'R',
        system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality'
      }
    ]);
    
    // Check tags
    const inputTags = q.meta.tag.slice(0, 2);
    expect(inputTags).toEqual([
      {
        display: 'Patient Survey',
        code: 'survey',
        system: 'http://example.org/tags'
      },
      {
        display: 'Version 2',
        code: 'v2',
        system: 'http://example.org/tags'
      }
    ]);
  });

  test('should load questionnaire with meta from fixture and display correctly', async ({ page }) => {
    // Upload the fixture file
    const q = await PWUtils.uploadFile(page, 'meta-sample.json');
    
    // Open Advanced fields to access meta
    await page.getByRole('button', { name: 'Advanced fields' }).click();
    
    // Wait for Meta section to be visible
    await page.getByLabel('Meta').waitFor({ state: 'visible' });
    
    // Verify versionId is displayed (readonly)
    const versionIdInput = page.getByRole('textbox', { name: 'Version ID (Read-only)' });
    await expect(versionIdInput).toHaveValue('v1.0.0');
    await expect(versionIdInput).toHaveAttribute('readonly', '');
    
    // Verify lastUpdated is displayed (readonly)
    const lastUpdatedInput = page.getByRole('textbox', { name: 'Last updated (Read-only)' });
    await expect(lastUpdatedInput).toHaveValue('2024-01-15T10:30:00.000Z');
    await expect(lastUpdatedInput).toHaveAttribute('readonly', '');
    
    // Verify source is displayed
    const sourceInput = page.locator('input[name="meta.source_2"]');
    await expect(sourceInput).toHaveValue('https://example.org/fhir/questionnaire/source');
    
    // Verify profiles are displayed
    const profile0Input = page.locator('[id^="meta.profile.0_"]').first();
    await expect(profile0Input).toHaveValue('http://hl7.org/fhir/5.0/StructureDefinition/Questionnaire');
    
    const profile1Input = page.locator('[id^="meta.profile.1_"]').first();
    await expect(profile1Input).toHaveValue('http://example.org/fhir/StructureDefinition/MyCustomProfile');
    
    // Verify security labels has exactly 2 rows for meta.security
    const securityRows = page.locator('lfb-table tbody > tr')
      .filter({ has: page.locator('input[id^="meta.security."]') });
    const securityCount = await securityRows.count();
    console.log('Security rows count:', securityCount);
    expect(securityCount).toBe(2);

    // Verify tags has exactly 2 rows for meta.tag
    const tagRows = page.locator('lfb-table tbody > tr')
      .filter({ has: page.locator('input[id^="meta.tag."]') });
    const tagCount = await tagRows.count();
    console.log('Tag rows count:', tagCount);
    expect(tagCount).toBe(2);
    
    // Verify the JSON output matches the fixture
    const qJson = await PWUtils.getQuestionnaireJSONWithoutUI(page, 'R5');
    
    // Check meta fields match fixture
    expect(qJson.meta.versionId).toBe(q.meta.versionId);
    expect(qJson.meta.lastUpdated).toBe(q.meta.lastUpdated);
    expect(qJson.meta.source).toBe(q.meta.source);
    expect(qJson.meta.profile).toEqual(q.meta.profile);
    
    // Check security labels (filter out any generated ones)
    const outputSecurity = qJson.meta.security.slice(0, 2);
    expect(outputSecurity).toEqual(q.meta.security);
    
    // Check tags (filter out any generated ones)
    const outputTags = qJson.meta.tag.slice(0, 2);
    expect(outputTags).toEqual(q.meta.tag);
  });
});
