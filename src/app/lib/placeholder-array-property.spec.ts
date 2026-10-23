import {
  ArrayProperty,
  DefaultLogService,
  FormPropertyFactory,
  ISchema,
  JEXLExpressionCompilerFactory,
  PROPERTY_TYPE_MAPPING,
  PropertyBindingRegistry,
  PropertyGroup,
  SchemaPreprocessor,
  ValidatorRegistry,
  ZSchemaValidatorFactory
} from '@lhncbc/ngx-schema-form';
import {
  ElementArrayProperty,
  ELEMENT_ARRAY_KEYWORD,
  isPrimitiveArraySchema,
  PlaceholderArrayProperty,
  registerPlaceholderArrayProperty,
  removePlaceholderErrors
} from './placeholder-array-property';

describe('PlaceholderArrayProperty', () => {
  const schema: ISchema = {
    type: 'object',
    properties: {
      title: {type: 'string'},
      derivedFrom: {type: 'array', items: {type: 'string'}},
      profile: {type: 'array', items: {$ref: '#/definitions/canonical'}},
      given: {type: 'array', items: {type: 'string'}},
      _given: {type: 'array', items: {anyOf: [{type: 'object'}, {type: 'null'}]}, [ELEMENT_ARRAY_KEYWORD]: true},
      codes: {type: 'array', items: {type: 'object', properties: {code: {type: 'string'}}}}
    },
    definitions: {
      canonical: {type: 'string', pattern: '^\\S*$'}
    }
  };
  let originalArrayMapping;
  let originalObjectMapping;

  /**
   * Create the root form property of a schema, loaded with a value.
   *
   * @param value - Value to load.
   * @param formSchema - Schema of the form. Defaults to the test schema.
   * @returns The root form property.
   */
  function createForm(value: object, formSchema: ISchema = schema): PropertyGroup {
    const factory = new FormPropertyFactory(new ZSchemaValidatorFactory(), new ValidatorRegistry(),
      new PropertyBindingRegistry(), new JEXLExpressionCompilerFactory(), new DefaultLogService(1));
    const rootSchema = structuredClone(formSchema);
    SchemaPreprocessor.preprocess(rootSchema); // Changes the schema in place.
    const root = factory.createProperty(rootSchema) as PropertyGroup;
    root.reset(value, false);
    return root;
  }

  beforeAll(() => {
    originalArrayMapping = PROPERTY_TYPE_MAPPING.array;
    originalObjectMapping = PROPERTY_TYPE_MAPPING.object;
    registerPlaceholderArrayProperty();
  });

  afterAll(() => {
    PROPERTY_TYPE_MAPPING.array = originalArrayMapping;
    PROPERTY_TYPE_MAPPING.object = originalObjectMapping;
  });

  it('should be created for the arrays of a schema once registered', () => {
    const root = createForm({});

    expect(root.getProperty('derivedFrom') instanceof PlaceholderArrayProperty).toBeTrue();
    expect(root.getProperty('derivedFrom') instanceof ArrayProperty).toBeTrue();
  });

  it('should keep loaded null placeholders after a change of another field', () => {
    const root = createForm({title: 'A', derivedFrom: [null, 'http://example.org/b', '']});

    expect(root.value.derivedFrom).toEqual([null, 'http://example.org/b', null]);

    root.getProperty('title').setValue('B', false);

    expect(root.value.title).toBe('B');
    expect(root.value.derivedFrom).toEqual([null, 'http://example.org/b', null]);
  });

  it('should output an entered value in a placeholder, and null again when it is cleared', () => {
    const root = createForm({derivedFrom: [null, 'http://example.org/b']});
    const placeholder = root.getProperty('derivedFrom/0');

    placeholder.setValue('http://example.org/a', false);
    expect(root.value.derivedFrom).toEqual(['http://example.org/a', 'http://example.org/b']);

    placeholder.setValue('', false);
    expect(root.value.derivedFrom).toEqual([null, 'http://example.org/b']);
  });

  it('should drop empty entries added by the user', () => {
    const root = createForm({derivedFrom: ['http://example.org/b']});
    const derivedFrom = root.getProperty('derivedFrom') as ArrayProperty;

    derivedFrom.addItem();
    derivedFrom.updateValueAndValidity(false, true);

    expect(derivedFrom.properties.length).toBe(2);
    expect(root.value.derivedFrom).toEqual(['http://example.org/b']);
  });

  it('should forget the placeholders of a previous value when a new value is set', () => {
    const root = createForm({derivedFrom: [null, 'http://example.org/b']});
    const derivedFrom = root.getProperty('derivedFrom') as ArrayProperty;

    derivedFrom.setValue(['http://example.org/a', 'http://example.org/b'], false);
    root.getProperty('derivedFrom/0').setValue('', false);

    expect(root.value.derivedFrom).toEqual(['http://example.org/b']);
  });

  it('should not output a removed placeholder', () => {
    const root = createForm({derivedFrom: [null, 'http://example.org/b']});
    const derivedFrom = root.getProperty('derivedFrom') as ArrayProperty;

    derivedFrom.removeItem(root.getProperty('derivedFrom/0'));

    expect(root.value.derivedFrom).toEqual(['http://example.org/b']);
  });

  it('should reduce arrays of objects as ArrayProperty does', () => {
    const value = {codes: [null, {code: 'x'}, {}]};
    const placeholderValue = createForm(value).value.codes;
    const placeholderMapping = PROPERTY_TYPE_MAPPING.array;
    PROPERTY_TYPE_MAPPING.array = originalArrayMapping;
    try {
      expect(placeholderValue).toEqual(createForm(value).value.codes);
    }
    finally {
      PROPERTY_TYPE_MAPPING.array = placeholderMapping;
    }
  });

  it('should keep null placeholders of arrays of FHIR primitive type references', () => {
    const root = createForm({title: 'A', profile: [null, 'http://example.org/p']});

    root.getProperty('title').setValue('B', false);

    expect(root.value.profile).toEqual([null, 'http://example.org/p']);
  });

  describe('element arrays', () => {
    const elements = [
      null,
      {id: 'g2', extension: [{url: 'http://example.org/a', extension: [{url: 'b', valueString: 'nested'}]}]},
      {id: 'g3'}
    ];

    it('should be kept as loaded, including null entries and nested extensions', () => {
      const root = createForm({title: 'A', given: ['Alice', null, null], _given: structuredClone(elements)});

      expect(root.getProperty('_given') instanceof ElementArrayProperty).toBeTrue();

      root.getProperty('title').setValue('B', false);

      expect(root.value.given).toEqual(['Alice', null, null]);
      expect(root.value._given).toEqual(elements);
      expect(root.getProperty('_given')._errors).toBeNull();
    });

    it('should be omitted without validation errors when missing', () => {
      const root = createForm({given: ['Alice']});

      expect(Object.prototype.hasOwnProperty.call(root.value, '_given')).toBeFalse();
      expect(root.getProperty('_given')._errors).toBeNull();
    });

    it('should be replaced by a new value', () => {
      const root = createForm({given: ['Alice', null], _given: structuredClone(elements).slice(0, 2)});

      root.getProperty('_given').setValue([{id: 'g1'}], false);

      expect(root.value._given).toEqual([{id: 'g1'}]);
    });
  });

  describe('realignment of element arrays', () => {
    const e1 = {id: 'g1'};
    const e2 = {extension: [{url: 'http://example.org/a', valueString: 'e2'}]};
    const e3 = {id: 'g3'};

    it('should move the elements with the remaining values when a value is removed', () => {
      const root = createForm({given: ['A', 'B', 'C'], _given: [null, e2, e3]});

      (root.getProperty('given') as ArrayProperty).removeItem(root.getProperty('given/0'));

      expect(root.value.given).toEqual(['B', 'C']);
      expect(root.value._given).toEqual([e2, e3]);
    });

    it('should remove the element of a removed placeholder', () => {
      const root = createForm({given: [null, 'B'], _given: [e1, null]});

      (root.getProperty('given') as ArrayProperty).removeItem(root.getProperty('given/0'));

      expect(root.value.given).toEqual(['B']);
      expect(root.value._given).toEqual([null]);
    });

    it('should restore the element of a value that is cleared and entered again', () => {
      const root = createForm({given: ['A', 'B'], _given: [e1, e2]});
      const first = root.getProperty('given/0');

      first.setValue('', false);
      expect(root.value.given).toEqual(['B']);
      expect(root.value._given).toEqual([e2]);

      first.setValue('A2', false);
      expect(root.value.given).toEqual(['A2', 'B']);
      expect(root.value._given).toEqual([e1, e2]);
    });

    it('should not change the elements when a value is edited in place', () => {
      const root = createForm({given: ['A', 'B'], _given: [e1, e2]});

      root.getProperty('given/1').setValue('B2', false);

      expect(root.value.given).toEqual(['A', 'B2']);
      expect(root.value._given).toEqual([e1, e2]);
    });

    it('should add null to the elements for a value added by the user', () => {
      const root = createForm({given: ['A'], _given: [e1]});

      (root.getProperty('given') as ArrayProperty).addItem('B');

      expect(root.value.given).toEqual(['A', 'B']);
      expect(root.value._given).toEqual([e1, null]);
    });

    it('should match the entries of a replaced array by value, in order', () => {
      const root = createForm({given: ['A', 'B', 'A'], _given: [e1, null, e3]});

      root.getProperty('given').setValue(['B', 'A', 'A', 'C'], false);

      expect(root.value.given).toEqual(['B', 'A', 'A', 'C']);
      expect(root.value._given).toEqual([null, e1, e3, null]);
    });

    it('should match the null placeholders of a replaced array in order', () => {
      const root = createForm({given: ['A', null, null], _given: [null, e2, e3]});

      root.getProperty('given').setValue([null, null, 'C'], false);

      expect(root.value.given).toEqual([null, null, 'C']);
      expect(root.value._given).toEqual([e2, e3, null]);
    });

    it('should load the values set by the parent as is, in any order of the fields', () => {
      const root = createForm({given: ['A', 'B'], _given: [e1, e2]});

      root.setValue({_given: [e3, null], given: ['X', 'Y']}, false);

      expect(root.value.given).toEqual(['X', 'Y']);
      expect(root.value._given).toEqual([e3, null]);
    });

    it('should realign an element array that is an additional property', () => {
      const openSchema: ISchema = {
        type: 'object',
        additionalProperties: true,
        properties: {derivedFrom: {type: 'array', items: {type: 'string'}}}
      };
      const root = createForm({derivedFrom: ['a', 'b'], _derivedFrom: [null, e2]}, openSchema);

      (root.getProperty('derivedFrom') as ArrayProperty).removeItem(root.getProperty('derivedFrom/0'));

      expect(root.value.derivedFrom).toEqual(['b']);
      expect(root.value._derivedFrom).toEqual([e2]);
    });

    it('should not create a missing element array', () => {
      const root = createForm({given: ['A', 'B']});

      (root.getProperty('given') as ArrayProperty).removeItem(root.getProperty('given/0'));
      root.getProperty('given').setValue(['C'], false);

      expect(root.value.given).toEqual(['C']);
      expect(Object.prototype.hasOwnProperty.call(root.value, '_given')).toBeFalse();
    });

    describe('with elements of implicit trailing null values', () => {
      const suffix = {id: 'suffix'};

      it('should keep them when a value is added', () => {
        const root = createForm({given: ['A'], _given: [e1, suffix]});

        (root.getProperty('given') as ArrayProperty).addItem('B');

        expect(root.value.given).toEqual(['A', 'B']);
        expect(root.value._given).toEqual([e1, null, suffix]);
      });

      it('should keep them when a value is removed', () => {
        const root = createForm({given: ['A', 'B'], _given: [e1, null, suffix]});

        (root.getProperty('given') as ArrayProperty).removeItem(root.getProperty('given/0'));

        expect(root.value.given).toEqual(['B']);
        expect(root.value._given).toEqual([null, suffix]);
      });

      it('should keep them when a value is cleared and entered again', () => {
        const root = createForm({given: ['A'], _given: [e1, suffix]});
        const first = root.getProperty('given/0');

        first.setValue('', false);
        expect(root.value._given).toEqual([suffix]);

        first.setValue('A2', false);
        expect(root.value.given).toEqual(['A2']);
        expect(root.value._given).toEqual([e1, suffix]);
      });

      it('should keep them when the array is replaced', () => {
        const root = createForm({given: ['A'], _given: [e1, suffix]});

        root.getProperty('given').setValue(['B', 'A'], false);

        expect(root.value.given).toEqual(['B', 'A']);
        expect(root.value._given).toEqual([null, e1, suffix]);
      });
    });
  });

  describe('validation', () => {
    const codesSchema: ISchema = {
      type: 'object',
      properties: {
        subjectType: {type: 'array', items: {type: 'string', oneOf: [{enum: ['Patient']}, {enum: ['Practitioner']}]}},
        include: {
          type: 'array',
          items: {type: 'object', properties: {valueSet: {type: 'array', items: {type: 'string', pattern: '^\\S*$'}}}}
        }
      }
    };

    it('should accept null placeholders in the arrays and in their ancestors', () => {
      const root = createForm({
        subjectType: ['Patient', null, 'Practitioner'],
        include: [{valueSet: ['http://example.org/a', null]}]
      }, codesSchema);

      expect(root.value.subjectType).toEqual(['Patient', null, 'Practitioner']);
      expect(root.value.include).toEqual([{valueSet: ['http://example.org/a', null]}]);
      ['', 'subjectType', 'subjectType/1', 'include', 'include/0', 'include/0/valueSet', 'include/0/valueSet/1']
        .forEach((path) => {
          const property = path ? root.getProperty(path) : root;
          expect(property._errors).withContext(path).toBeNull();
        });
    });

    it('should still report invalid values', () => {
      const root = createForm({subjectType: ['Patient', null, 'Unknown']}, codesSchema);

      expect(root._errors?.map((error) => error.path)).toEqual(['#/subjectType/2']);
    });

    it('should validate a value entered in a placeholder', () => {
      const root = createForm({subjectType: ['Patient', null]}, codesSchema);
      const placeholder = root.getProperty('subjectType/1');

      placeholder.setValue('Unknown', false);
      expect(placeholder._errors?.length).toBeGreaterThan(0);

      placeholder.setValue('', false);
      expect(placeholder._errors).toBeNull();
      expect(root._errors).toBeNull();
    });
  });

  it('should recognize arrays of primitive values', () => {
    expect(isPrimitiveArraySchema({type: 'array', items: {type: 'string'}})).toBeTrue();
    expect(isPrimitiveArraySchema({type: 'array', items: {type: ['integer', 'null']}})).toBeTrue();
    expect(isPrimitiveArraySchema({type: 'array', items: {$ref: '#/definitions/canonical'}})).toBeTrue();
    expect(isPrimitiveArraySchema({type: 'array', items: {$ref: '#/definitions/Coding'}})).toBeFalse();
    expect(isPrimitiveArraySchema({type: 'array', items: {type: 'object'}})).toBeFalse();
    expect(isPrimitiveArraySchema({type: 'array'})).toBeFalse();
    expect(isPrimitiveArraySchema({type: 'string'})).toBeFalse();
    expect(isPrimitiveArraySchema(undefined)).toBeFalse();
  });

  it('should remove only the validation errors of null array entries', () => {
    const value = {a: ['x', null], 'b/c': [null], d: null};
    const errors = [
      {code: 'INVALID_TYPE', path: '#/a/1'},
      {code: 'ENUM_MISMATCH', path: '#/a/0'},
      {code: 'INVALID_TYPE', path: '#/b~1c/0'},
      {code: 'INVALID_TYPE', path: '#/d'},
      {code: 'INVALID_TYPE', path: '#/'}
    ];

    expect(removePlaceholderErrors(errors, value)).toEqual([errors[1], errors[3], errors[4]]);
    expect(removePlaceholderErrors([errors[0]], value)).toBeNull();
    expect(removePlaceholderErrors(null, value)).toBeNull();
  });
});







