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
});
