import { ResourceDlgComponent } from './resource-dlg.component';
import type fhir from 'fhir/r4';

type ResourceDialogInternals = {
  originalResourceId: string;
  changedValue: fhir.Resource;
  data: {
    formProperty: {
      findRoot: () => {
        getProperty: (path: string) => {value: unknown};
      };
    };
  };
  isReferencedResourceIdChanged(): boolean;
};

describe('ResourceDlgComponent', () => {
  it('should reject an id change that would break a Usage Context reference', () => {
    const internals = Object.create(ResourceDlgComponent.prototype) as ResourceDialogInternals;
    internals.originalResourceId = 'vs1';
    internals.changedValue = {resourceType: 'ValueSet', id: 'renamed'};
    internals.data = {
      formProperty: {
        findRoot: () => ({
          getProperty: () => ({
            value: [{
              code: {code: 'workflow'},
              valueReference: {reference: '#vs1'}
            }]
          })
        })
      }
    };

    expect(internals.isReferencedResourceIdChanged()).toBeTrue();
  });
});
