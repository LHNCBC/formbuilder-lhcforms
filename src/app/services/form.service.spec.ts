import { TestBed } from '@angular/core/testing';

import { FormService } from './form.service';
import sampleJson from '../../../tests/fixtures/help-text-sample1.json';
import traverse from 'traverse';
import {provideHttpClient} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CommonTestingModule} from '../testing/common-testing.module';
import fhir from "fhir/r4";
import {MessageType} from '../lib/widgets/message-dlg/message-dlg.component';
import {ISchema, SchemaPreprocessor} from '@lhncbc/ngx-schema-form';

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
    expect(usageContextSchema.properties.valueQuantity.properties.comparator.enum)
      .withContext('R5 Usage Context quantity comparators')
      .toContain('ad');
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

  it('should configure question and help text as multiline string-with-css fields', () => {
    expect(service.itemSchema.properties.text.widget).toEqual(jasmine.objectContaining({
      id: 'string-with-css',
      rows: 1
    }));
    expect(service.itemSchema.properties.__$helpText.properties.text.widget).toEqual(jasmine.objectContaining({
      id: 'string-with-css',
      rows: 1
    }));
    expect(service.itemSchema.properties.prefix.widget.id).toBe('string-with-css');
    expect(service.itemSchema.properties.prefix.widget.rows).toBeUndefined();
  });

  it('should configure questionnaire description and purpose as multiline fields', () => {
    expect(service.flSchema.properties.description.widget).toEqual(jasmine.objectContaining({
      id: 'textarea',
      rows: 1
    }));
    expect(service.flSchema.properties.purpose.widget).toEqual(jasmine.objectContaining({
      id: 'textarea',
      rows: 1
    }));
    expect(service.flSchema.properties.implicitRules.widget.id).toBe('string');
    expect(service.flSchema.properties.copyright.widget.rows).toBeUndefined();
  });

  it('should configure ValueSet description and purpose as multiline fields', () => {
    expect(service.valueSetSchema.properties.description.widget).toEqual(jasmine.objectContaining({
      id: 'textarea',
      rows: 1
    }));
    expect(service.valueSetSchema.properties.purpose.widget).toEqual(jasmine.objectContaining({
      id: 'textarea',
      rows: 1
    }));
    expect(service.valueSetSchema.properties.implicitRules.widget.id).toBe('string');
    expect(service.valueSetSchema.properties.copyright.widget.rows).toBeUndefined();
  });

  it('should preserve the R5 ad Quantity comparator and reject older-version conversion', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      useContext: [{
        code: {code: 'age'},
        valueQuantity: {
          value: 10,
          comparator: 'ad',
          unit: 'mL'
        }
      }]
    } as unknown as fhir.Questionnaire;

    expect(service.convertFromR5(questionnaire, 'R5')).toBe(questionnaire);
    expect(() => service.convertFromR5(questionnaire, 'R4'))
      .toThrowError(FormService.R5_QUANTITY_COMPARATOR_ERROR);
    expect(() => service.convertFromR5(questionnaire, 'STU3'))
      .toThrowError(FormService.R5_QUANTITY_COMPARATOR_ERROR);
  });

  it('should reject older-version conversion when a contained resource has an ad Quantity comparator', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      contained: [{
        resourceType: 'ValueSet',
        id: 'contained-valueset',
        status: 'active',
        useContext: [{
          code: {code: 'age'},
          valueQuantity: {
            value: 10,
            comparator: 'ad',
            unit: 'a'
          }
        }]
      }]
    } as unknown as fhir.Questionnaire;

    expect(service.convertFromR5(questionnaire, 'R5')).toBe(questionnaire);
    expect(() => service.convertFromR5(questionnaire, 'R4'))
      .toThrowError(FormService.R5_QUANTITY_COMPARATOR_ERROR);
    expect(() => service.convertFromR5(questionnaire, 'STU3'))
      .toThrowError(FormService.R5_QUANTITY_COMPARATOR_ERROR);
  });

  it('should normalize root and nested initial attachments after STU3 conversion without changing the R5 form', () => {
    const sizeMetadata: fhir.Element = {id: 'size-note'};
    const url = 'https://example.org/image.png';
    const questionnaire: fhir.Questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      item: [{
        linkId: 'attachment',
        type: 'attachment',
        initial: [{valueAttachment: {url, size: 5}}]
      }, {
        linkId: 'group',
        type: 'group',
        item: [{
          linkId: 'nested-attachment',
          type: 'attachment',
          initial: [{valueAttachment: {url, size: 2147483647}}]
        }]
      }]
    };
    const imported = service.convertToR5(questionnaire);
    const rootItem = imported.item[0];
    const nestedItem = imported.item[1].item[0];
    for(const item of [rootItem, nestedItem]) {
      const attachment = {
        ...item.initial[0].valueAttachment,
        _size: sizeMetadata,
        height: 480,
        _height: {id: 'height-note'},
        width: 640,
        _width: {id: 'width-note'},
        frames: 2,
        _frames: {id: 'frames-note'},
        duration: 1.5,
        _duration: {id: 'duration-note'},
        pages: 3,
        _pages: {id: 'pages-note'}
      };
      item.initial[0].valueAttachment = attachment;
    }
    expect(rootItem.initial[0].valueAttachment).toEqual(jasmine.objectContaining({size: '5'}));
    expect(nestedItem.initial[0].valueAttachment).toEqual(jasmine.objectContaining({size: '2147483647'}));
    const originalR5 = JSON.stringify(imported);

    const exported = service.convertFromR5(imported, 'STU3');

    expect(exported).toEqual(jasmine.objectContaining({
      item: [{
        linkId: 'attachment',
        type: 'attachment',
        initialAttachment: {url, size: 5, _size: sizeMetadata}
      }, {
        linkId: 'group',
        type: 'group',
        item: [{
          linkId: 'nested-attachment',
          type: 'attachment',
          initialAttachment: {url, size: 2147483647, _size: sizeMetadata}
        }]
      }]
    }));
    expect(JSON.stringify(imported)).toBe(originalR5);
  });

  ['R5', 'R4', 'STU3'].forEach((version) => {
    it(`should preserve extension-only Attachment.size metadata through import and ${version} export`, () => {
      const sizeMetadata: fhir.Element = {
        id: 'size-note',
        extension: [{
          url: 'http://hl7.org/fhir/StructureDefinition/data-absent-reason',
          valueCode: 'unknown'
        }]
      };
      const expectedAttachment = {
        url: 'https://example.org/report.pdf',
        _size: sizeMetadata
      };
      const questionnaire: fhir.Questionnaire = {
        resourceType: 'Questionnaire',
        status: 'draft',
        item: [{
          linkId: 'attachment',
          type: 'attachment',
          initial: [{
            valueAttachment: {...expectedAttachment}
          }]
        }]
      };

      const imported = service.convertToR5(questionnaire);
      expect(imported.item[0].initial[0].valueAttachment).toEqual(expectedAttachment);
      expect(imported.item[0].initial[0].valueAttachment.size).toBeUndefined();

      const exported = service.convertFromR5(imported, version);
      if(version === 'STU3') {
        expect(exported).toEqual(jasmine.objectContaining({
          item: [{
            linkId: 'attachment',
            type: 'attachment',
            initialAttachment: expectedAttachment
          }]
        }));
      }
      else {
        expect(exported.item[0].initial[0].valueAttachment).toEqual(expectedAttachment);
        expect(exported.item[0].initial[0].valueAttachment.size).toBeUndefined();
      }
    });
  });

  it('should retain primitive metadata in inline and referenced Attachment schema-form models', () => {
    const extensionSchema = service.getExtensionSchema();
    const attachment = {
      url: 'https://example.org/report',
      _url: {id: 'url-note'},
      _data: {
        extension: [{
          url: 'http://hl7.org/fhir/StructureDefinition/data-absent-reason',
          valueCode: 'unknown'
        }]
      },
      _contentType: {
        id: 'content-type-note',
        extension: [{
          url: 'https://example.org/StructureDefinition/note',
          valueString: 'Preserve this note'
        }]
      }
    };
    for(const referenced of [false, true]) {
      const schema: ISchema = JSON.parse(JSON.stringify(extensionSchema));
      if(referenced) {
        schema.properties.valueAttachment = {$ref: '#/definitions/Attachment'};
      }
      SchemaPreprocessor.preprocess(schema);
      const property = CommonTestingModule.createProperty(schema, {
        url: 'https://example.org/StructureDefinition/attachment',
        __$isValueX: true,
        __$valueType: 'valueAttachment',
        __$valueTypeCategory: '__$valueGeneralPurposeDatatype',
        __$valueGeneralPurposeDatatype: 'valueAttachment',
        valueAttachment: attachment
      });

      expect(property.value.valueAttachment._url.id).toBe('url-note');
      expect(property.value.valueAttachment._data.extension).toEqual(attachment._data.extension);
      expect(property.value.valueAttachment._contentType).toEqual(attachment._contentType);
    }
  });

  describe('configured LHC-Forms source', () => {
    function docWithMeta(meta: {[name: string]: string}): Document {
      const doc = document.implementation.createHTMLDocument('test');
      Object.entries(meta).forEach(([name, content]) => {
        const tag = doc.createElement('meta');
        tag.setAttribute('name', name);
        tag.setAttribute('content', content);
        doc.head.appendChild(tag);
      });
      return doc;
    }

    it('should return the source and version from the meta tags', () => {
      const doc = docWithMeta({'lforms-source': ' /fhir/r4/forms/lforms-44.1.0/ ', 'lforms-version': '44.1.0'});
      expect(FormService.getConfiguredLFormsSource(doc))
        .toEqual({source: '/fhir/r4/forms/lforms-44.1.0', version: '44.1.0'});
    });

    it('should return null if the source or the version is missing', () => {
      expect(FormService.getConfiguredLFormsSource(docWithMeta({}))).toBeNull();
      expect(FormService.getConfiguredLFormsSource(docWithMeta({'lforms-source': '/lforms'}))).toBeNull();
      expect(FormService.getConfiguredLFormsSource(docWithMeta({'lforms-version': '44.1.0'}))).toBeNull();
      expect(FormService.getConfiguredLFormsSource(docWithMeta({'lforms-source': '', 'lforms-version': '44.1.0'})))
        .toBeNull();
    });

    it('should accept X.Y.Z versions from 33.0.0, with an optional pre-release suffix', () => {
      for (const version of ['33.0.0', '44.1.0', '44.1.0-beta.1']) {
        expect(FormService.getConfiguredLFormsSource(docWithMeta({'lforms-source': '/lforms', 'lforms-version': version})))
          .withContext(version)
          .toEqual({source: '/lforms', version});
      }
    });

    it('should throw an error naming the meta tag if the version is invalid or too old', () => {
      for (const version of ['v44.1.0', 'latest', '44', '44.1', '44.1.0.1', '32.9.9']) {
        expect(() => FormService.getConfiguredLFormsSource(docWithMeta({'lforms-source': '/lforms', 'lforms-version': version})))
          .withContext(version)
          .toThrowError(`Invalid lforms-version meta tag "${version}": expected the X.Y.Z version (33.0.0 or later) ` +
            'of the LHC-Forms copy at /lforms.');
      }
    });

    describe('loadLFormsLib()', () => {
      let addedTags: HTMLMetaElement[];
      let loadLForms: jasmine.Spy;
      let getSupportedLFormsVersions: jasmine.Spy;

      /**
       * Adds lforms-source and lforms-version meta tags to the test page's document.
       * @param source - The lforms-source content.
       * @param version - The lforms-version content.
       */
      function configureSource(source: string, version: string) {
        Object.entries({'lforms-source': source, 'lforms-version': version}).forEach(([name, content]) => {
          const tag = document.createElement('meta');
          tag.setAttribute('name', name);
          tag.setAttribute('content', content);
          document.head.appendChild(tag);
          addedTags.push(tag);
        });
      }

      beforeEach(() => {
        addedTags = [];
        // The common testing setup stubs loadLFormsLib(); exercise the real method with a stubbed loader.
        (service.loadLFormsLib as jasmine.Spy).and.callThrough();
        loadLForms = spyOn(FormService.lformsLoader, 'loadLForms').and.resolveTo('44.1.0');
        getSupportedLFormsVersions = spyOn(FormService.lformsLoader, 'getSupportedLFormsVersions')
          .and.resolveTo(['45.0.0', '44.1.0']);
      });

      afterEach(() => {
        addedTags.forEach((tag) => tag.remove());
      });

      it('should load the configured copy without querying the NLM version list', async () => {
        configureSource('/lforms-44.1.0/', '44.1.0');
        await expectAsync(service.loadLFormsLib()).toBeResolvedTo('44.1.0');
        expect(loadLForms).toHaveBeenCalledOnceWith('44.1.0', undefined, '/lforms-44.1.0');
        expect(getSupportedLFormsVersions).not.toHaveBeenCalled();
      });

      it('should reject with an error naming the configured source if it fails to load', async () => {
        configureSource('/no-such-dir', '44.1.0');
        loadLForms.and.rejectWith(new Event('error'));
        spyOn(console, 'error');
        await expectAsync(service.loadLFormsLib()).toBeRejectedWithError('Failed to load LHC-Forms from /no-such-dir');
        expect(console.error).toHaveBeenCalledWith(
          'lforms-loader.loadLForms() failed to load LHC-Forms from /no-such-dir');
      });

      it('should reject an invalid configured version without loading LHC-Forms', async () => {
        configureSource('/lforms-44.1.0', 'v44.1.0');
        await expectAsync(service.loadLFormsLib()).toBeRejectedWithError(/^Invalid lforms-version meta tag "v44\.1\.0"/);
        expect(loadLForms).not.toHaveBeenCalled();
        expect(getSupportedLFormsVersions).not.toHaveBeenCalled();
      });

      it('should load the latest NLM version if no source is configured', async () => {
        await expectAsync(service.loadLFormsLib()).toBeResolvedTo('45.0.0');
        expect(getSupportedLFormsVersions).toHaveBeenCalledTimes(1);
        expect(loadLForms).toHaveBeenCalledOnceWith('45.0.0');
      });
    });
  });

  it('should report an incompatible opener notification without repeating the dialog', () => {
    const questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      useContext: [{
        code: {code: 'age'},
        valueQuantity: {
          value: 10,
          comparator: 'ad',
          unit: 'mL'
        }
      }]
    } as unknown as fhir.Questionnaire;
    service.windowOpenerUrl = 'https://parent.example.com';
    service['_windowOpenerFhirVersion'] = 'R4';
    spyOn(console, 'error');
    const showMessage = spyOn(service, 'showMessage');

    expect(service.notifyWindowOpener({
      type: 'updateQuestionnaire',
      questionnaire
    })).toBeFalse();
    expect(service.notifyWindowOpener({
      type: 'updateQuestionnaire',
      questionnaire
    })).toBeFalse();
    expect(console.error).toHaveBeenCalledWith(
      'Unable to send the questionnaire to the opener window.',
      jasmine.any(Error)
    );
    expect(showMessage).toHaveBeenCalledOnceWith(
      'Questionnaire update not sent',
      FormService.R5_QUANTITY_COMPARATOR_ERROR +
        ' The opener application has not received the latest Questionnaire.',
      MessageType.DANGER
    );
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

  it('should limit Attachment enableWhen operators to existence checks', () => {
    expect(service.getEnableWhenOperatorListByAnswerType('attachment').map((option) => option.option))
      .toEqual(['exists', 'notexists']);
  });

  it('should restore lazy Identifier.assigner.identifier schema', () => {
    const identifierItems = service.getFormLevelSchema()?.properties?.identifier?.items as any;
    const firstLevelIdentifier = identifierItems?.properties?.assigner?.properties?.identifier;
    expect(firstLevelIdentifier)
      .withContext('Identifier.assigner.identifier should be an object in the form-level schema')
      .toBeDefined();
    expect(firstLevelIdentifier?.type).toBe('object', 'Should keep FHIR object shape');
    expect(firstLevelIdentifier?.properties?.assigner?.properties?.identifier)
      .withContext('Form-level schema should not pre-expand nested identifier levels')
      .toBeUndefined();
    expect(firstLevelIdentifier?.properties?.assigner?.additionalProperties)
      .withContext('Form-level child assigner should preserve deeper identifiers returned from dialogs')
      .toBeTrue();

    const dialogIdentifier = service.cloneIdentifierSchema() as any;
    const firstLevelArray = dialogIdentifier?.properties?.assigner?.properties?.identifier;
    expect(firstLevelArray)
      .withContext('Identifier.assigner.identifier should be an array in the dialog schema')
      .toBeDefined();
    expect(firstLevelArray?.type).toBe('array', 'Dialog schema should use array type for table editing');
    expect(firstLevelArray?.maxItems).toBe(1, 'Dialog schema should have maxItems: 1 for 0..1 cardinality');

    expect(firstLevelArray?.items?.properties?.assigner?.properties?.identifier)
      .withContext('Dialog schema should add only the next editable level; nested dialogs get a fresh schema')
      .toBeUndefined();
    expect(firstLevelArray?.items?.properties?.assigner?.additionalProperties)
      .withContext('Dialog child assigner should preserve deeper identifiers returned from nested dialogs')
      .toBeTrue();
  });

  it('should restore Reference.identifier only in cycle-safe scoped schemas', () => {
    const valueSetSchema = service.getResourceSchema('ValueSet') as any;
    expect(valueSetSchema?.definitions?.Reference?.properties?.identifier)
      .withContext('Contained ValueSet References should preserve imported identifiers')
      .toBeDefined();
    expect(valueSetSchema?.definitions?.Reference?.properties?.identifier?.properties?.assigner?.$ref)
      .withContext('The scoped Identifier assigner must not point back to the shared Reference')
      .toBeUndefined();
    expect(valueSetSchema?.definitions?.Reference?.properties?.identifier?.properties?.assigner?.additionalProperties)
      .withContext('Deeper imported assigner identifiers should remain preserved')
      .toBeTrue();

    const formUsageContext = service.getFormLevelSchema()?.properties?.useContext?.items as any;
    expect(formUsageContext?.properties?.valueReference?.properties?.identifier)
      .withContext('Form-level Usage Context should retain Reference.identifier')
      .toBeDefined();

    const dialogUsageContext = service.cloneUsageContextSchema() as any;
    const dialogIdentifier = dialogUsageContext?.properties?.valueReference?.properties?.identifier;
    expect(dialogIdentifier)
      .withContext('Usage Context dialog should retain Reference.identifier')
      .toBeDefined();
    expect(dialogIdentifier?.type).toBe('array');
    expect(dialogIdentifier?.maxItems).toBe(1);

    const importedValueSet = {
      resourceType: 'ValueSet',
      status: 'active',
      identifier: [{
        system: 'http://example.org/identifier',
        value: 'example',
        assigner: {
          identifier: {
            system: 'http://example.org/assigner-identifier',
            value: 'nested-example',
            assigner: {
              identifier: {value: 'deep-example'}
            }
          }
        }
      }],
      useContext: [{
        code: {
          system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
          code: 'focus'
        },
        valueReference: {
          reference: 'PlanDefinition/example',
          identifier: {value: 'reference-identifier'}
        }
      }]
    };
    const valueSetProperty = CommonTestingModule.createProperty(valueSetSchema, importedValueSet);
    expect(valueSetProperty.value.identifier[0].assigner.identifier.value)
      .withContext('Imported ValueSet Identifier.assigner.identifier should be preserved')
      .toBe('nested-example');
    expect(valueSetProperty.value.identifier[0].assigner.identifier.assigner.identifier.value)
      .withContext('Identifier descendants beyond the scoped schema should be preserved')
      .toBe('deep-example');
    expect(valueSetProperty.value.useContext[0].valueReference.identifier.value)
      .withContext('Imported ValueSet UsageContext Reference.identifier should be preserved')
      .toBe('reference-identifier');
  });

});
