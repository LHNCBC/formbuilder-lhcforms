import { TestBed } from '@angular/core/testing';

import { FormService } from './form.service';
import sampleJson from '../../../tests/fixtures/help-text-sample1.json';
import traverse from 'traverse';
import {provideHttpClient} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CommonTestingModule} from '../testing/common-testing.module';
import fhir from "fhir/r4";

describe('FormService', () => {
  let service: FormService;

  CommonTestingModule.setUpTestBedConfig({providers: [NgbModal, provideHttpClient()]});

  beforeEach(async () => {
    service = TestBed.inject(FormService);
    await service.initialize();
    expect(window['LForms']).toBeDefined();
  });

  it('should be created', async () => {
    expect(service).toBeTruthy();
    expect(service.lformsVersion).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
  });

  it('should apply explicitly requested widget presets without sharing mutable objects', () => {
    const layout: any = {
      widgetPresetMap: {
        string: 'dialogStringField',
        locallyCustomized: 'dialogStringField'
      },
      widgets: {
        locallyCustomized: {id: 'custom-string'}
      }
    };
    const presets = {
      dialogStringField: {
        id: 'string',
        controlClasses: 'col-sm-10'
      }
    };

    service.applyWidgetPresets(layout, presets);

    expect(layout.widgets.string).toEqual(presets.dialogStringField);
    expect(layout.widgets.string).not.toBe(presets.dialogStringField);
    expect(layout.widgets.locallyCustomized).toEqual({id: 'custom-string'});
  });

  it('should reject an unknown widget preset', () => {
    const layout: any = {
      widgetPresetMap: {string: 'missingPreset'},
      widgets: {}
    };

    expect(() => service.applyWidgetPresets(layout, {}))
      .toThrowError('Unknown widget preset "missingPreset" requested for "string".');
  });

  it('should scope empty Select invalid-style suppression to the configured dialog fields', () => {
    const usageContextSchema = service.cloneUsageContextSchema() as any;
    const identifierSchema = service.cloneIdentifierSchema() as any;

    expect(usageContextSchema.properties.__$valueType.widget.suppressEmptyInvalidStyle)
      .withContext('Usage Context value type')
      .toBeTrue();
    expect(usageContextSchema.properties.valueQuantity.properties.comparator.widget.suppressEmptyInvalidStyle)
      .withContext('Usage Context quantity comparator')
      .toBeTrue();
    expect(identifierSchema.properties.use.widget.suppressEmptyInvalidStyle)
      .withContext('Identifier use')
      .toBeTrue();
  });

  it('should remove invalid comparator fields from UsageContext Range endpoints', () => {
    const usageContextSchema = service.cloneUsageContextSchema() as any;

    expect(usageContextSchema.properties.valueRange.properties.low.properties.comparator)
      .toBeUndefined();
    expect(usageContextSchema.properties.valueRange.properties.high.properties.comparator)
      .toBeUndefined();
  });

  it('should use the extensible UsageContextType editor for UsageContext.code', () => {
    const usageContextSchema = service.cloneUsageContextSchema() as any;

    expect(usageContextSchema.properties.code.widget.id).toBe('usage-context-code');
  });

  it('should update __$helpText', () => {
    const clonedSample = traverse(sampleJson).clone();
    service.updateFhirQuestionnaire(clonedSample);
    expect(clonedSample.item[0].__$helpText).toEqual(sampleJson.item[0].item[2]);
    expect(clonedSample.item[0].item[2]).toBeUndefined();
  });

  it('should remove lforms code from meta.tag[].code', () => {
    const q: fhir.Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      meta: {
        tag: [
          { code: 'c1', system: 's1', display: 'd1' },
          { code: 'lformsVersion:xxxxx', system: 's2', display: 'd2' },
          { code: 'c3', system: 's3', display: 'd3' },
        ]
      }
    };

    const updatedQ = service.updateFhirQuestionnaire(q);
    expect(updatedQ.meta.tag).toEqual([
      {code: 'c1', system: 's1', display: 'd1'},
      {code: 'c3', system: 's3', display: 'd3'}
    ]);
  });

  it('should handle deleting an enableWhen row when the node has no errors', () => {
    service.treeNodeStatusMap = {
      node1: {
        treeNodeId: 'node1',
        linkId: 'q1'
      }
    };

    expect(() => service.deleteErrorAndAdjustEnableWhenIndexes('node1', 0)).not.toThrow();
    expect(service.treeNodeStatusMap.node1.hasError).toBeFalse();
    expect(service.treeNodeStatusMap.node1.errors).toEqual({});
  });

  it('should remove deleted enableWhen errors and shift later enableWhen error indexes', () => {
    service.treeNodeStatusMap = {
      node1: {
        treeNodeId: 'node1',
        linkId: 'q1',
        hasError: true,
        errors: {
          enableWhen_0: [{message: 'first'}],
          enableWhen_2: [{message: 'third'}],
          linkId: [{message: 'duplicate'}]
        }
      }
    };

    service.deleteErrorAndAdjustEnableWhenIndexes('node1', 1);

    expect(service.treeNodeStatusMap.node1.errors.enableWhen_0).toEqual([{message: 'first'}]);
    expect(service.treeNodeStatusMap.node1.errors.enableWhen_1).toEqual([{message: 'third'}]);
    expect(service.treeNodeStatusMap.node1.errors.enableWhen_2).toBeUndefined();
    expect(service.treeNodeStatusMap.node1.errors.linkId).toEqual([{message: 'duplicate'}]);
    expect(service.treeNodeStatusMap.node1.hasError).toBeTrue();
  });

  it('should restore recursive Identifier.assigner.identifier schema', () => {
    const identifierItems = service.getFormLevelSchema()?.properties?.identifier?.items as any;
    const firstLevelIdentifier = identifierItems?.properties?.assigner?.properties?.identifier;
    expect(firstLevelIdentifier)
      .withContext('Identifier.assigner.identifier should be an object in the form-level schema')
      .toBeDefined();
    expect(firstLevelIdentifier?.type).toBe('object', 'Should keep FHIR object shape');

    const dialogIdentifier = service.cloneIdentifierSchema() as any;
    const firstLevelArray = dialogIdentifier?.properties?.assigner?.properties?.identifier;
    expect(firstLevelArray)
      .withContext('Identifier.assigner.identifier should be an array in the dialog schema')
      .toBeDefined();
    expect(firstLevelArray?.type).toBe('array', 'Dialog schema should use array type for table editing');
    expect(firstLevelArray?.maxItems).toBe(1, 'Dialog schema should have maxItems: 1 for 0..1 cardinality');

    const secondLevelArray = firstLevelArray?.items?.properties?.assigner?.properties?.identifier;
    expect(secondLevelArray)
      .withContext('Identifier recursion should include nested assigner.identifier at second level')
      .toBeDefined();
    expect(secondLevelArray?.type).toBe('array', 'Second level should also be array type');
    expect(secondLevelArray?.maxItems).toBe(1, 'Second level should also have maxItems: 1');

    const thirdLevelArray = secondLevelArray?.items?.properties?.assigner?.properties?.identifier;
    expect(thirdLevelArray)
      .withContext('Identifier recursion should include nested assigner.identifier at third level')
      .toBeDefined();
    expect(thirdLevelArray?.type).toBe('array', 'Third level should also be array type');
    expect(thirdLevelArray?.maxItems).toBe(1, 'Third level should also have maxItems: 1');
  });

});
