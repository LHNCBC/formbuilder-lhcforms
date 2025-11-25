import { TestBed } from '@angular/core/testing';
// @ts-ignore
import fhirSchemaDefinitions from '../../assets/fhir-definitions.schema.json5';

import { SchemaService, patternToFHIRPrimitiveType } from './schema.service';

describe('SchemaService', () => {
  let service: SchemaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SchemaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueBase64Binary.pattern]).toBe('base64Binary');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueBoolean.pattern]).toBe('boolean');
    // Canonical, uri, and url are identical
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueCanonical.pattern]).toBe('url');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueCode.pattern]).toBe('code');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueDate.pattern]).toBe('date');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueDateTime.pattern]).toBe('dateTime');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueDecimal.pattern]).toBe('decimal');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueId.pattern]).toBe('id');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueInstant.pattern]).toBe('instant');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueInteger.pattern]).toBe('integer');
    // Markdown and string are identical.
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueMarkdown.pattern]).toBe('string');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueOid.pattern]).toBe('oid');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valuePositiveInt.pattern]).toBe('positiveInt');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueString.pattern]).toBe('string');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueTime.pattern]).toBe('time');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueUnsignedInt.pattern]).toBe('unsignedInt');
    // Canonical, uri, and url are identical
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueUri.pattern]).toBe('url');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueUrl.pattern]).toBe('url');
    expect(patternToFHIRPrimitiveType[fhirSchemaDefinitions.definitions.Extension.properties.valueUuid.pattern]).toBe('uuid');
  });
});
