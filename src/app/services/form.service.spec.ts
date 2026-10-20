import { TestBed } from '@angular/core/testing';

import { FormService } from './form.service';
import sampleJson from '../../../tests/fixtures/help-text-sample1.json';
import traverse from 'traverse';
import {HttpErrorResponse, HttpHeaders, HttpResponse, provideHttpClient} from '@angular/common/http';
import {of, Subject, throwError} from 'rxjs';
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

  describe('LHC-Forms configuration file', () => {
    it('should return the trimmed source and version', () => {
      expect(FormService.parseLFormsConfig(JSON.stringify({
        source: ' /fhir/r4/forms/lforms-44.1.0/ ',
        version: ' 44.1.0 ',
        comment: 'Other keys are ignored.'
      }))).toEqual({source: '/fhir/r4/forms/lforms-44.1.0', version: '44.1.0'});
    });

    it('should return null for the default configuration', () => {
      for (const content of [null, '', ' \n', '{}', '{"source": "", "version": ""}', '{"source": " ", "version": null}']) {
        expect(FormService.parseLFormsConfig(content)).withContext(String(content)).toBeNull();
      }
    });

    it('should accept JSON5 with comments, unquoted keys, and trailing commas', () => {
      const content = `{
        // Self-hosted LHC-Forms.
        source: '/lforms-44.1.0', /* relative to the base href */
        version: "44.1.0",
      }`;
      expect(FormService.parseLFormsConfig(content)).toEqual({source: '/lforms-44.1.0', version: '44.1.0'});
    });

    it('should ship a configuration file that selects the default LHC-Forms', async () => {
      const content = await service.fetchLFormsConfig();
      expect(content).toContain('// Optional: choose the LHC-Forms version and the server it is loaded from.');
      expect(FormService.parseLFormsConfig(content)).toBeNull();
    });

    it('should accept X.Y.Z versions from 37.0.0, with an optional pre-release suffix', () => {
      for (const version of ['37.0.0', '44.1.0', '44.1.0-beta.1']) {
        expect(FormService.parseLFormsConfig(JSON.stringify({source: '/lforms', version})))
          .withContext(version)
          .toEqual({source: '/lforms', version});
      }
    });

    it('should throw an error naming the file if the version is invalid or too old', () => {
      for (const version of ['v44.1.0', 'latest', '44', '44.1', '44.1.0.1', '33.0.0', '36.20.3']) {
        expect(() => FormService.parseLFormsConfig(JSON.stringify({source: '/lforms', version})))
          .withContext(version)
          .toThrowError(`Invalid assets/lforms-config.json5: "version" "${version}" must be the X.Y.Z version ` +
            '(37.0.0 or later) of the LHC-Forms copy at /lforms.');
      }
      expect(() => FormService.parseLFormsConfig('{version: "36.20.3"}'))
        .toThrowError('Invalid assets/lforms-config.json5: "version" "36.20.3" must be the X.Y.Z version ' +
          '(37.0.0 or later) of the LHC-Forms release on the NLM server.');
    });

    it('should keep the root source "/" while removing trailing slashes', () => {
      for (const source of ['/', ' // ']) {
        expect(FormService.parseLFormsConfig(JSON.stringify({source, version: '44.1.0'})))
          .withContext(source)
          .toEqual({source: '/', version: '44.1.0'});
      }
    });

    it('should return only the version if the source is not set', () => {
      for (const config of [{version: ' 44.0.0 '}, {source: '', version: '44.0.0'}, {source: ' ', version: '44.0.0'},
        {source: null, version: '44.0.0'}]) {
        expect(FormService.parseLFormsConfig(JSON.stringify(config)))
          .withContext(JSON.stringify(config))
          .toEqual({source: null, version: '44.0.0'});
      }
    });

    it('should throw an error naming the file if the source is set without the version', () => {
      for (const config of [{source: '/lforms'}, {source: '/lforms', version: ''}, {source: '/lforms', version: null}]) {
        expect(() => FormService.parseLFormsConfig(JSON.stringify(config)))
          .withContext(JSON.stringify(config))
          .toThrowError('Invalid assets/lforms-config.json5: "version" must be set when "source" is set.');
      }
    });

    it('should throw an error naming the file if the content is not a JSON5 object of strings', () => {
      expect(() => FormService.parseLFormsConfig('{source: "/lforms", version: }'))
        .toThrowError(/^Invalid assets\/lforms-config\.json5: JSON5: .+\.$/);
      for (const content of ['[]', '"44.1.0"', 'null', '42']) {
        expect(() => FormService.parseLFormsConfig(content))
          .withContext(content)
          .toThrowError('Invalid assets/lforms-config.json5: expected a JSON5 object with "source" and "version".');
      }
      expect(() => FormService.parseLFormsConfig('{"source": "/lforms", "version": 44}'))
        .toThrowError('Invalid assets/lforms-config.json5: "version" must be a string.');
      expect(() => FormService.parseLFormsConfig('{"source": ["/lforms"], "version": "44.1.0"}'))
        .toThrowError('Invalid assets/lforms-config.json5: "source" must be a string.');
    });

    describe('fetchLFormsConfig()', () => {
      it('should return the content of the file', async () => {
        const get = spyOn(service['http'], 'get').and.returnValue(of(new HttpResponse({
          body: '{"source": "/lforms", "version": "44.1.0"}',
          headers: new HttpHeaders({'Content-Type': 'application/json5'})
        })));
        await expectAsync(service.fetchLFormsConfig()).toBeResolvedTo('{"source": "/lforms", "version": "44.1.0"}');
        expect(get).toHaveBeenCalledOnceWith('assets/lforms-config.json5',
          jasmine.objectContaining({observe: 'response', responseType: 'text'}));
      });

      it('should return null for the HTML fallback page of a single-page application server', async () => {
        spyOn(service['http'], 'get').and.returnValue(of(new HttpResponse({
          body: '<!doctype html><html></html>',
          headers: new HttpHeaders({'Content-Type': 'text/html; charset=UTF-8'})
        })));
        await expectAsync(service.fetchLFormsConfig()).toBeResolvedTo(null);
      });

      it('should return null without a warning if the file is missing', async () => {
        spyOn(service['http'], 'get').and.returnValue(throwError(() => new HttpErrorResponse({status: 404})));
        spyOn(console, 'warn');
        await expectAsync(service.fetchLFormsConfig()).toBeResolvedTo(null);
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('should return null with a warning if the file cannot be read', async () => {
        const error = new HttpErrorResponse({status: 500});
        spyOn(service['http'], 'get').and.returnValue(throwError(() => error));
        spyOn(console, 'warn');
        await expectAsync(service.fetchLFormsConfig()).toBeResolvedTo(null);
        expect(console.warn).toHaveBeenCalledOnceWith(
          'Unable to read assets/lforms-config.json5; loading the default LHC-Forms.', error);
      });
    });

    describe('loadLFormsLib()', () => {
      let fetchLFormsConfig: jasmine.Spy;
      let loadLForms: jasmine.Spy;
      let getSupportedLFormsVersions: jasmine.Spy;

      beforeEach(() => {
        // The common testing setup stubs loadLFormsLib(); exercise the real method with a stubbed loader.
        (service.loadLFormsLib as jasmine.Spy).and.callThrough();
        fetchLFormsConfig = spyOn(service, 'fetchLFormsConfig').and.resolveTo(null);
        loadLForms = spyOn(FormService.lformsLoader, 'loadLForms').and.resolveTo('44.1.0');
        getSupportedLFormsVersions = spyOn(FormService.lformsLoader, 'getSupportedLFormsVersions')
          .and.resolveTo(['45.0.0', '44.1.0']);
      });

      it('should load the configured copy without querying the NLM version list', async () => {
        fetchLFormsConfig.and.resolveTo('{"source": "/lforms-44.1.0/", "version": "44.1.0"}');
        spyOn(console, 'warn');
        await expectAsync(service.loadLFormsLib()).toBeResolvedTo('44.1.0');
        expect(loadLForms).toHaveBeenCalledOnceWith('44.1.0', undefined, '/lforms-44.1.0');
        expect(getSupportedLFormsVersions).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('should load the copy at the server root from the page origin, not from the NLM server', async () => {
        fetchLFormsConfig.and.resolveTo('{source: "/", version: "44.1.0"}');
        await expectAsync(service.loadLFormsLib()).toBeResolvedTo('44.1.0');
        // Not "/", which lforms-loader would turn into the protocol-relative "//webcomponent/...".
        expect(loadLForms).toHaveBeenCalledOnceWith('44.1.0', undefined, window.location.origin);
        expect(getSupportedLFormsVersions).not.toHaveBeenCalled();
      });

      it('should warn and resolve to the loaded version if it differs from the configured one', async () => {
        fetchLFormsConfig.and.resolveTo('{source: "/lforms", version: "44.1.0"}');
        loadLForms.and.resolveTo('45.0.0');
        spyOn(console, 'warn');
        await expectAsync(service.loadLFormsLib()).toBeResolvedTo('45.0.0');
        expect(console.warn).toHaveBeenCalledOnceWith(
          'Loaded LHC-Forms version 45.0.0 from /lforms, but assets/lforms-config.json5 sets version 44.1.0.');
      });

      it('should reject with an error naming the configured source if it fails to load', async () => {
        fetchLFormsConfig.and.resolveTo('{"source": "/no-such-dir", "version": "44.1.0"}');
        loadLForms.and.rejectWith(new Event('error'));
        spyOn(console, 'error');
        await expectAsync(service.loadLFormsLib()).toBeRejectedWithError('Failed to load LHC-Forms from /no-such-dir');
        expect(console.error).toHaveBeenCalledWith(
          'lforms-loader.loadLForms() failed to load LHC-Forms from /no-such-dir');
      });

      it('should reject an invalid configuration without loading LHC-Forms', async () => {
        fetchLFormsConfig.and.resolveTo('{"source": "/lforms-44.1.0", "version": "v44.1.0"}');
        await expectAsync(service.loadLFormsLib())
          .toBeRejectedWithError(/^Invalid assets\/lforms-config\.json5: "version" "v44\.1\.0"/);
        expect(loadLForms).not.toHaveBeenCalled();
        expect(getSupportedLFormsVersions).not.toHaveBeenCalled();
      });

      it('should load the configured version from the NLM server without querying the version list', async () => {
        fetchLFormsConfig.and.resolveTo('{version: "44.0.0"}');
        loadLForms.and.resolveTo('44.0.0');
        await expectAsync(service.loadLFormsLib()).toBeResolvedTo('44.0.0');
        expect(loadLForms).toHaveBeenCalledOnceWith('44.0.0');
        expect(getSupportedLFormsVersions).not.toHaveBeenCalled();
      });

      it('should reject with an error naming the configured version if it fails to load from the NLM server',
        async () => {
          fetchLFormsConfig.and.resolveTo('{version: "99.0.0"}');
          loadLForms.and.rejectWith(new Event('error'));
          spyOn(console, 'error');
          await expectAsync(service.loadLFormsLib()).toBeRejectedWithError('Failed to load LHC-Forms version 99.0.0');
          expect(console.error).toHaveBeenCalledWith(
            'lforms-loader.loadLForms() failed to load LHC-Forms version 99.0.0');
          expect(getSupportedLFormsVersions).not.toHaveBeenCalled();
        });

      for (const [description, content] of [
        ['is not available', null],
        ['has empty values', '{"source": "", "version": ""}']
      ]) {
        it(`should load the latest NLM version if the configuration file ${description}`, async () => {
          fetchLFormsConfig.and.resolveTo(content);
          await expectAsync(service.loadLFormsLib()).toBeResolvedTo('45.0.0');
          expect(getSupportedLFormsVersions).toHaveBeenCalledTimes(1);
          expect(loadLForms).toHaveBeenCalledOnceWith('45.0.0');
        });
      }
    });

    describe('initialize()', () => {
      let originalLFormsLoaded$: typeof FormService._lformsLoaded$;

      beforeEach(() => {
        // Erroring the shared subject would affect later tests; use a fresh one.
        originalLFormsLoaded$ = FormService._lformsLoaded$;
        FormService._lformsLoaded$ = new Subject<string>();
      });

      afterEach(() => {
        FormService._lformsLoaded$ = originalLFormsLoaded$;
      });

      it('should report an invalid configuration as an LHC-Forms loading failure, not a JSON5 one', async () => {
        const configError = 'Invalid assets/lforms-config.json5: "version" must be set when "source" is set.';
        (service.loadLFormsLib as jasmine.Spy).and.rejectWith(new Error(configError));
        spyOn(console, 'error');
        let reportedError: Error;
        FormService.lformsLoaded$.subscribe({error: (error) => reportedError = error});

        await expectAsync(service.initialize()).toBeResolvedTo(false);
        expect(reportedError?.message).toBe(`Failed to load LHC-Forms: ${configError}`);
        expect(service.lformsVersion).toBe('ERROR');
      });
    });
  });

  describe('host window of the window-open API', () => {
    afterEach(() => {
      service.windowOpenerUrl = null;
    });

    it('should use the opener window if opened with window.open()', () => {
      const opener = {postMessage: jasmine.createSpy('postMessage')};
      const originalOpener = window.opener;
      window.opener = opener;
      try {
        expect(service.getHostWindow()).toBe(opener as any);
        expect(service.isEmbedded()).toBeFalse();
      } finally {
        window.opener = originalOpener;
      }
    });

    it('should use the parent window if embedded in an iframe', () => {
      // Karma runs the specs in an iframe, unless debug.html is used.
      const embedded = window.parent !== window;
      expect(service.isEmbedded()).toBe(embedded);
      expect(service.getHostWindow()).toBe(embedded ? window.parent : null);
    });

    it('should post messages to the host window with the referrer origin as target origin', () => {
      const host = {postMessage: jasmine.createSpy('postMessage')};
      spyOn(service, 'getHostWindow').and.returnValue(host as any);
      service.windowOpenerUrl = 'https://parent.example.com/app?x=1#y';

      expect(service.windowOpenerUrl).toBe('https://parent.example.com/app?x=1#y');
      expect(service.windowOpenerOrigin).toBe('https://parent.example.com');
      expect(service.notifyWindowOpener({type: 'initialized'})).toBeTrue();
      expect(host.postMessage).toHaveBeenCalledOnceWith({type: 'initialized'}, 'https://parent.example.com');
    });

    it('should not use a referrer that is not an absolute http or https URL', () => {
      const host = {postMessage: jasmine.createSpy('postMessage')};
      spyOn(service, 'getHostWindow').and.returnValue(host as any);
      spyOn(console, 'error');
      service.windowOpenerUrl = 'https://parent.example.com/app';

      service.windowOpenerUrl = 'not-a-url';

      expect(service.windowOpenerUrl).toBeNull();
      expect(service.windowOpenerOrigin).toBeNull();
      expect(console.error).toHaveBeenCalledOnceWith(jasmine.stringContaining('"not-a-url"'));
      expect(service.notifyWindowOpener({type: 'initialized'})).toBeFalse();
      expect(host.postMessage).not.toHaveBeenCalled();
    });

    it('should reset the referrer without an error', () => {
      spyOn(console, 'error');
      service.windowOpenerUrl = 'https://parent.example.com/app';

      service.windowOpenerUrl = null;

      expect(service.windowOpenerUrl).toBeNull();
      expect(service.windowOpenerOrigin).toBeNull();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should not post messages without a host window', () => {
      spyOn(service, 'getHostWindow').and.returnValue(null);
      service.windowOpenerUrl = 'https://parent.example.com/app';

      expect(service.notifyWindowOpener({type: 'initialized'})).toBeFalse();
    });

    it('should not post messages or report errors after the session ended', () => {
      const host = {postMessage: jasmine.createSpy('postMessage')};
      spyOn(service, 'getHostWindow').and.returnValue(host as any);
      const convertSpy = spyOn(service, 'convertFromR5').and.throwError('not convertible');
      const showMessage = spyOn(service, 'showMessage');
      service.windowOpenerUrl = 'https://parent.example.com/app';

      expect(service.isWindowOpenerSessionEnded()).toBeFalse();
      service.endWindowOpenerSession();
      expect(service.isWindowOpenerSessionEnded()).toBeTrue();

      expect(service.notifyWindowOpener({type: 'canceled'})).toBeFalse();
      expect(service.notifyWindowOpener({
        type: 'updateQuestionnaire',
        questionnaire: {resourceType: 'Questionnaire', status: 'draft'}
      }, true)).toBeFalse();
      expect(host.postMessage).not.toHaveBeenCalled();
      expect(convertSpy).not.toHaveBeenCalled();
      expect(showMessage).not.toHaveBeenCalled();
    });
  });

  describe('incompatible opener notification', () => {
    let showMessage: jasmine.Spy;
    let hostWindow: {postMessage: jasmine.Spy};
    /**
     * Send an updateQuestionnaire message with a questionnaire that uses the R5-only Quantity comparator "ad",
     * so that it cannot be converted to the requested R4.
     *
     * @param alwaysReportError - Passed to notifyWindowOpener().
     * @returns Return value of notifyWindowOpener().
     */
    const notifyWithIncompatibleQuestionnaire = (alwaysReportError?: boolean): boolean => {
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
      return service.notifyWindowOpener({type: 'updateQuestionnaire', questionnaire}, alwaysReportError);
    };
    const expectedMessage = [
      'Questionnaire update not sent',
      FormService.R5_QUANTITY_COMPARATOR_ERROR +
        ' The parent application has not received the latest Questionnaire.',
      MessageType.DANGER
    ] as const;

    beforeEach(() => {
      // Independent of whether Karma runs the specs in an iframe (window.parent) or not (debug.html).
      hostWindow = {postMessage: jasmine.createSpy('postMessage')};
      spyOn(service, 'getHostWindow').and.returnValue(hostWindow as any);
      service.windowOpenerUrl = 'https://parent.example.com';
      service['_windowOpenerFhirVersion'] = 'R4';
      spyOn(console, 'error');
      showMessage = spyOn(service, 'showMessage');
    });

    afterEach(() => {
      service.windowOpenerUrl = null;
    });

    it('should report an incompatible opener notification without repeating the dialog', () => {
      expect(notifyWithIncompatibleQuestionnaire()).toBeFalse();
      expect(notifyWithIncompatibleQuestionnaire()).toBeFalse();
      expect(console.error).toHaveBeenCalledWith(
        'Unable to send the questionnaire to the parent window.',
        jasmine.any(Error)
      );
      expect(showMessage).toHaveBeenCalledOnceWith(...expectedMessage);
      expect(hostWindow.postMessage).not.toHaveBeenCalled();
    });

    it('should repeat the dialog when alwaysReportError is set', () => {
      expect(notifyWithIncompatibleQuestionnaire()).toBeFalse();
      expect(notifyWithIncompatibleQuestionnaire(true)).toBeFalse();
      expect(showMessage).toHaveBeenCalledTimes(2);
      expect(showMessage.calls.mostRecent().args).toEqual([...expectedMessage]);
      expect(hostWindow.postMessage).not.toHaveBeenCalled();
    });

    it('should keep the conversion error until a questionnaire is sent', () => {
      expect(service.getWindowOpenerNotificationError()).toBe('');
      notifyWithIncompatibleQuestionnaire();
      expect(service.getWindowOpenerNotificationError()).toBe(FormService.R5_QUANTITY_COMPARATOR_ERROR);

      expect(service.notifyWindowOpener({
        type: 'updateQuestionnaire',
        questionnaire: {resourceType: 'Questionnaire', status: 'draft'}
      })).toBeTrue();
      expect(service.getWindowOpenerNotificationError()).toBe('');
    });
  });

  describe('when the browser storage is not accessible', () => {
    beforeEach(() => {
      const securityError = new DOMException('Access is denied', 'SecurityError');
      spyOnProperty(window, 'localStorage', 'get').and.throwError(securityError);
      spyOnProperty(window, 'sessionStorage', 'get').and.throwError(securityError);
      spyOn(console, 'error');
    });

    it('should read, store, and remove items without throwing', () => {
      expect(service.getStorageItem('localStorage', 'key')).toBeNull();
      expect(() => service.setStorageItem('sessionStorage', 'key', 'value')).not.toThrow();
      expect(() => service.removeStorageItem('localStorage', 'key')).not.toThrow();
      expect(console.error).toHaveBeenCalledTimes(3);
      expect(console.error).toHaveBeenCalledWith('Unable to read "key" from localStorage.', jasmine.any(DOMException));
    });

    it('should report that no questionnaire is auto saved', () => {
      expect(service.isAutoSaved()).toBeFalse();
    });

    it('should clear the tree node status map', () => {
      service.treeNodeStatusMap = {node1: {treeNodeId: 'node1', linkId: 'q1'}};
      expect(() => service.clearAutoSavedTreeNodeStatusMap()).not.toThrow();
      expect(service.treeNodeStatusMap).toEqual({});
    });
  });

  describe('browser storage items', () => {
    afterEach(() => {
      localStorage.removeItem('formServiceSpecKey');
    });

    it('should read, store, and remove an item', () => {
      service.setStorageItem('localStorage', 'formServiceSpecKey', 'value');
      expect(localStorage.getItem('formServiceSpecKey')).toBe('value');
      expect(service.getStorageItem('localStorage', 'formServiceSpecKey')).toBe('value');
      service.removeStorageItem('localStorage', 'formServiceSpecKey');
      expect(service.getStorageItem('localStorage', 'formServiceSpecKey')).toBeNull();
    });
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
