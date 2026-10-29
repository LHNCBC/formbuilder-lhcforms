import {
  DefaultLogService,
  FormProperty,
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
import {ELEMENT_ARRAY_KEYWORD, registerPlaceholderArrayProperty} from '../../placeholder-array-property';
import {TableRowDialogBase} from './table-row-dialog-base';

class TestRowDialog extends TableRowDialogBase<object> {
  protected createNewModel(): object {
    return {};
  }

  currentValue(property: FormProperty): any {
    return this.getCurrentFormPropertyValue(property);
  }
}

describe('TableRowDialogBase', () => {
  const elementArray: ISchema = {
    type: 'array',
    items: {anyOf: [{type: 'object'}, {type: 'null'}]},
    [ELEMENT_ARRAY_KEYWORD]: true
  };
  const schema: ISchema = {
    type: 'object',
    properties: {
      url: {type: 'string'},
      valueHumanName: {
        type: 'object',
        properties: {
          family: {type: 'string'},
          given: {type: 'array', items: {type: 'string'}},
          _given: elementArray,
          prefix: {type: 'array', items: {type: 'string'}}
        }
      }
    }
  };
  let originalArrayMapping;
  let originalObjectMapping;
  let dialog: TestRowDialog;

  /**
   * Create the root form property of the test schema, loaded with a value.
   *
   * @param value - Value to load.
   * @returns The root form property.
   */
  function createForm(value: object): PropertyGroup {
    const factory = new FormPropertyFactory(new ZSchemaValidatorFactory(), new ValidatorRegistry(),
      new PropertyBindingRegistry(), new JEXLExpressionCompilerFactory(), new DefaultLogService(1));
    const rootSchema = structuredClone(schema);
    SchemaPreprocessor.preprocess(rootSchema);
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

  beforeEach(() => {
    // The constructor needs an injection context, which the tested method does not use.
    dialog = Object.create(TestRowDialog.prototype);
  });

  it('should keep the null placeholders that align a primitive array with its element array', () => {
    const root = createForm({
      url: 'http://example.org/name',
      valueHumanName: {given: [null, 'B', null], _given: [{id: 'g1'}, null, {id: 'g3'}]}
    });

    expect(dialog.currentValue(root)).toEqual({
      url: 'http://example.org/name',
      valueHumanName: {given: [null, 'B', null], _given: [{id: 'g1'}, null, {id: 'g3'}]}
    });
  });

  it('should keep the elements aligned after a value is removed in the dialog', () => {
    const root = createForm({
      url: 'http://example.org/name',
      valueHumanName: {given: [null, 'B', 'C'], _given: [{id: 'g1'}, null, {id: 'g3'}]}
    });
    const given = root.getProperty('valueHumanName/given');
    given.removeItem(given.properties[1]);

    expect(dialog.currentValue(root).valueHumanName).toEqual({
      given: [null, 'C'],
      _given: [{id: 'g1'}, {id: 'g3'}]
    });
  });

  it('should still drop the empty entries of an array without an element array', () => {
    const root = createForm({
      url: 'http://example.org/name',
      valueHumanName: {family: 'F', prefix: ['Dr', null]}
    });

    expect(dialog.currentValue(root).valueHumanName).toEqual({family: 'F', prefix: ['Dr']});
  });
});
