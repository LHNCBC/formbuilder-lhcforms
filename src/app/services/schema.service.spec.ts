import { TestBed } from '@angular/core/testing';

import { SchemaService, patternToFHIRPrimitiveType } from './schema.service';
import {FormService} from "./form.service";
import {ISchema} from "@lhncbc/ngx-schema-form";
import {provideHttpClient} from "@angular/common/http";

describe('SchemaService', () => {
  let schemaService: SchemaService, formService: FormService, extSchema: ISchema, flSchema: ISchema;

  beforeEach(async () => {
    TestBed.configureTestingModule({providers: [provideHttpClient()]});
    schemaService = TestBed.inject(SchemaService);
    formService = TestBed.inject(FormService);
    await formService.initialize();
    extSchema = formService.getExtensionSchema();
    flSchema = formService.getFormLevelSchema();
  });

  it('should be created', () => {
    expect(schemaService).toBeTruthy();
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueBase64Binary.pattern]).toBe('base64Binary');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueBoolean.pattern]).toBe('boolean');
    // Canonical, uri, and url are identical
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueCanonical.pattern]).toBe('url');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueCode.pattern]).toBe('code');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueDate.pattern]).toBe('date');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueDateTime.pattern]).toBe('dateTime');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueDecimal.pattern]).toBe('decimal');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueId.pattern]).toBe('id');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueInstant.pattern]).toBe('instant');
    expect(schemaService.primitiveFHIRTypeToWidgetMap['instant']).toBe('instant');
    expect(extSchema.properties.valueInstant.widget.id).toBe('instant');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueInteger.pattern]).toBe('integer');
    // Markdown and string are identical.
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueMarkdown.pattern]).toBe('string');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueOid.pattern]).toBe('oid');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valuePositiveInt.pattern]).toBe('positiveInt');
    expect(schemaService.primitiveFHIRTypeToWidgetMap['positiveInt']).toBe('positive-integer');
    expect(extSchema.properties.valuePositiveInt.widget.id).toBe('positive-integer');
    expect(extSchema.properties.valuePositiveInt.minimum).toBe(1);
    expect(extSchema.definitions.positiveInt.minimum).toBe(1);
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueString.pattern]).toBe('string');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueTime.pattern]).toBe('time');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueUnsignedInt.pattern]).toBe('unsignedInt');
    expect(schemaService.primitiveFHIRTypeToWidgetMap['unsignedInt']).toBe('unsigned-integer');
    expect(extSchema.properties.valueUnsignedInt.widget.id).toBe('unsigned-integer');
    expect(extSchema.properties.valueUnsignedInt.minimum).toBe(0);
    // Canonical, uri, and url are identical
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueUri.pattern]).toBe('url');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueUrl.pattern]).toBe('url');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueUuid.pattern]).toBe('uuid');
  });

  it('should use date range widget for extension valuePeriod', () => {
    expect(extSchema.properties.valuePeriod.widget.id).toBe('date-range');
    expect(extSchema.properties.valuePeriod.properties.start.widget.id).toBe('datetime');
    expect(extSchema.properties.valuePeriod.properties.end.widget.id).toBe('datetime');
  });

  it('should use date range widget for shared Period definitions', () => {
    expect(extSchema.definitions.Period.widget.id).toBe('date-range');
    expect(extSchema.definitions.Identifier.properties.period.$ref).toBe('#/definitions/Period');
  });

  it('should use date range widget for form level effectivePeriod from layout', () => {
    expect(flSchema.properties.effectivePeriod.widget.id).toBe('date-range');
    expect(flSchema.definitions.Period.widget.id).toBe('date-range');
  });

  it('should prepare every Attachment primitive while preserving existing schemas and widgets', () => {
    const scalar: ISchema = {type: 'string', widget: {id: 'custom-url'}};
    const companion: ISchema = {
      $ref: '#/definitions/Element',
      title: 'URL metadata',
      widget: {id: 'custom-metadata'}
    };
    const existingSize: ISchema = {$ref: '#/definitions/Element'};
    const attachment: ISchema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {type: 'string'},
        extension: {type: 'array'},
        contentType: {type: 'string'},
        language: {type: 'string'},
        data: {type: 'string'},
        url: scalar,
        _url: companion,
        size: {type: 'string'},
        _size: existingSize,
        hash: {type: 'string'},
        title: {type: 'string'},
        creation: {type: 'string'},
        height: {type: 'integer'},
        width: {type: 'integer'},
        frames: {type: 'integer'},
        duration: {type: 'number'},
        pages: {type: 'integer'},
        __$summary: {type: 'string'}
      }
    };
    const schema: ISchema = {properties: {valueAttachment: attachment}};

    schemaService.addAttachmentPrimitiveMetadata(schema);
    const prepared = JSON.stringify(schema);
    schemaService.addAttachmentPrimitiveMetadata(schema);

    expect(JSON.stringify(schema)).toBe(prepared);
    expect(attachment.additionalProperties).toBeFalse();
    expect(attachment.properties.url).toBe(scalar);
    expect(scalar.widget).toEqual({id: 'custom-url'});
    expect(attachment.properties._url).toBe(companion);
    expect(companion).toEqual({
      $ref: '#/definitions/Element',
      title: 'URL metadata',
      widget: {id: 'custom-metadata'}
    });
    expect(attachment.properties._size).toBe(existingSize);
    expect(existingSize.widget).toBeUndefined();
    for(const field of [
      'contentType', 'language', 'data', 'hash', 'title', 'creation',
      'height', 'width', 'frames', 'duration', 'pages'
    ]) {
      expect(attachment.properties[`_${field}`]).withContext(field).toEqual({
        $ref: '#/definitions/Element', widget: {id: 'hidden'}
      });
    }
    expect(attachment.properties._id).toBeUndefined();
    expect(attachment.properties._extension).toBeUndefined();
    expect(attachment.properties.___$summary).toBeUndefined();
    expect(attachment.properties._data).not.toBe(attachment.properties._hash);
    expect(attachment.properties._data.widget).not.toBe(attachment.properties._hash.widget);
  });

  it('should handle shared references and nested Attachment properties without modifying other types', () => {
    const reference: ISchema = {$ref: '#/definitions/Attachment'};
    const unrelated: ISchema = {
      properties: {url: {type: 'string'}, size: {type: 'number'}},
      additionalProperties: false
    };
    const originalUnrelated = JSON.stringify(unrelated);
    const schema: ISchema = {
      definitions: {
        Attachment: {properties: {url: {type: 'string'}}},
        Other: unrelated
      },
      properties: {
        valueAttachment: reference,
        item: {
          type: 'array',
          items: {
            properties: {
              initialAttachment: {properties: {size: {type: 'number'}}},
              answerAttachment: {properties: {data: {type: 'string'}}},
              other: unrelated
            }
          }
        }
      }
    };

    schemaService.addAttachmentPrimitiveMetadata(schema);

    expect(schema.definitions.Attachment.properties._url.widget.id).toBe('hidden');
    expect(schema.definitions.Attachment.properties._pages).toBeUndefined();
    expect(reference).toEqual({$ref: '#/definitions/Attachment'});
    const nested = schema.properties.item.items.properties;
    expect(nested.initialAttachment.properties._size.widget.id).toBe('hidden');
    expect(nested.answerAttachment.properties._data.widget.id).toBe('hidden');
    expect(JSON.stringify(unrelated)).toBe(originalUnrelated);
  });

  it('should prepare Attachment schemas on every initialized editor surface', () => {
    const itemSchema = formService.getItemSchema();
    const initialAttachment = itemSchema.properties.initial.items.properties.valueAttachment;
    expect(initialAttachment.properties.url.widget.id).toBe('url');
    expect(initialAttachment.properties._size.widget.id).toBe('hidden');
    expect(initialAttachment.properties._pages.widget.id).toBe('hidden');

    for(const schema of [
      itemSchema, flSchema, extSchema,
      formService.getResourceSchema('ValueSet'), formService.getResourceSchema('Binary')
    ]) {
      expect(schema.definitions.Attachment.properties._url).toEqual({
        $ref: '#/definitions/Element', widget: {id: 'hidden'}
      });
      expect(schema.definitions.Extension.properties.valueAttachment.properties._data.widget.id)
        .toBe('hidden');
    }
    expect(extSchema.properties.valueAttachment.properties._url.widget.id).toBe('hidden');
    expect(itemSchema.properties._type).toBeUndefined();
    expect(extSchema.properties._valueString).toBeUndefined();
  });
});
