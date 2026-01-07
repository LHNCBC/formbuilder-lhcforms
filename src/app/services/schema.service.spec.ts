import { TestBed } from '@angular/core/testing';

import { SchemaService, patternToFHIRPrimitiveType } from './schema.service';
import {FormService} from "./form.service";
import {ISchema} from "@lhncbc/ngx-schema-form";
import {provideHttpClient} from "@angular/common/http";

describe('SchemaService', () => {
  let schemaService: SchemaService, formService: FormService, extSchema: ISchema;

  beforeEach(async () => {
    TestBed.configureTestingModule({providers: [provideHttpClient()]});
    schemaService = TestBed.inject(SchemaService);
    formService = TestBed.inject(FormService);
    await formService.initialize();
    extSchema = formService.getExtensionSchema();
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
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueInteger.pattern]).toBe('integer');
    // Markdown and string are identical.
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueMarkdown.pattern]).toBe('string');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueOid.pattern]).toBe('oid');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valuePositiveInt.pattern]).toBe('positiveInt');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueString.pattern]).toBe('string');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueTime.pattern]).toBe('time');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueUnsignedInt.pattern]).toBe('unsignedInt');
    // Canonical, uri, and url are identical
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueUri.pattern]).toBe('url');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueUrl.pattern]).toBe('url');
    expect(patternToFHIRPrimitiveType[extSchema.properties.valueUuid.pattern]).toBe('uuid');
  });
});
