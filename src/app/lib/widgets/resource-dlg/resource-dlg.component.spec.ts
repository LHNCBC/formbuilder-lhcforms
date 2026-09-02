import { ResourceDlgComponent } from './resource-dlg.component';
import type fhir from 'fhir/r4';

type ResourceDialogInternals = {
  input?: fhir.Resource;
  readonly resourceJson: string;
  originalResourceId: string;
  changedValue: fhir.Resource;
  data: {
    formProperty: {
      findRoot: () => {
        value?: fhir.Questionnaire;
        getProperty: (path: string) => {value: unknown};
      };
    };
  };
  isReferencedResourceIdChanged(): boolean;
};

describe('ResourceDlgComponent', () => {
  it('should remove internal Form Builder fields from read-only resource JSON', () => {
    const internals = Object.create(ResourceDlgComponent.prototype) as ResourceDialogInternals;
    internals.input = {
      resourceType: 'Patient',
      id: 'patient-1',
      __$fhirVersionInfo: {version: 'R4'},
      meta: {
        tag: [{
          code: 'visible',
          __$internalCodingState: true
        }]
      }
    } as unknown as fhir.Resource;

    expect(JSON.parse(internals.resourceJson)).toEqual({
      resourceType: 'Patient',
      id: 'patient-1',
      meta: {tag: [{code: 'visible'}]}
    });
  });

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

  it('should reject an id change that would break a templateExtract reference', () => {
    const internals = Object.create(ResourceDlgComponent.prototype) as ResourceDialogInternals;
    internals.originalResourceId = 'vs1';
    internals.changedValue = {resourceType: 'ValueSet', id: 'renamed'};
    internals.data = {
      formProperty: {
        findRoot: () => ({
          value: {
            resourceType: 'Questionnaire',
            status: 'draft',
            extension: [{
              url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-templateExtract',
              extension: [{url: 'template', valueReference: {reference: '#vs1'}}]
            }]
          },
          getProperty: () => ({value: []})
        })
      }
    };

    expect(internals.isReferencedResourceIdChanged()).toBeTrue();
  });
});
