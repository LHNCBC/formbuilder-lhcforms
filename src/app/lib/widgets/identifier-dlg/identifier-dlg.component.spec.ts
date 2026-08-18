import type {FormProperty} from '@lhncbc/ngx-schema-form';
import type fhir from 'fhir/r4';
import {IdentifierDlgComponent} from './identifier-dlg.component';

type IdentifierDialogInternals = {
  inputModel: fhir.Identifier;
  rawValueStore: {
    getIdentifier: (property: FormProperty) => undefined;
    getIdentifierTable: (property: FormProperty) => undefined;
    isIdentifierDeleted: (property: FormProperty) => false;
  };
  getCurrentFormPropertyValue(property: FormProperty): unknown;
};

describe('IdentifierDlgComponent', () => {
  it('should preserve an original nested Identifier when lifecycle seeding did not run', () => {
    const component = Object.create(IdentifierDlgComponent.prototype) as IdentifierDlgComponent;
    const internals = component as unknown as IdentifierDialogInternals;
    const tableProperty = {
      path: '/assigner/identifier',
      value: [{value: 'level-1'}],
      properties: [{
        value: {value: 'level-1'},
        properties: {
          value: {value: 'level-1'}
        }
      }],
      schema: {widget: {id: 'identifier'}}
    } as unknown as FormProperty;
    internals.inputModel = {
      assigner: {
        identifier: [{
          value: 'level-1',
          assigner: {
            identifier: {
              value: 'level-2'
            }
          }
        }]
      }
    } as unknown as fhir.Identifier;
    internals.rawValueStore = {
      getIdentifier: () => undefined,
      getIdentifierTable: () => undefined,
      isIdentifierDeleted: () => false
    };

    const currentValue = internals.getCurrentFormPropertyValue(tableProperty) as fhir.Identifier[];

    expect(currentValue[0].assigner?.identifier?.value).toBe('level-2');
  });
});
