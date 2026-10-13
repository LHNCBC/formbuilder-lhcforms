import { ResourceDlgComponent } from './resource-dlg.component';
import { SharedObjectService } from '../../../services/shared-object.service';
import type fhir from 'fhir/r4';

type ResourceDialogInternals = {
  input?: fhir.Resource;
  readonly resourceJson: string;
  originalResourceId: string;
  changedValue: fhir.Resource;
  sharedObjectService: SharedObjectService;
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

const TEMPLATE_EXTRACT_URL = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-templateExtract';

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
    internals.sharedObjectService = new SharedObjectService();
    internals.originalResourceId = 'vs1';
    internals.changedValue = {resourceType: 'ValueSet', id: 'renamed'};
    internals.data = {
      formProperty: {
        findRoot: () => ({
          value: {
            resourceType: 'Questionnaire',
            status: 'draft',
            extension: [{
              url: TEMPLATE_EXTRACT_URL,
              extension: [{url: 'template', valueReference: {reference: '#vs1'}}]
            }]
          },
          getProperty: () => ({value: []})
        })
      }
    };

    expect(internals.isReferencedResourceIdChanged()).toBeTrue();
  });

  it('should reject an id change that would break an item-level templateExtract reference', () => {
    const internals = Object.create(ResourceDlgComponent.prototype) as ResourceDialogInternals;
    internals.sharedObjectService = new SharedObjectService();
    // The form-level model has no items; they come from the current Questionnaire.
    internals.sharedObjectService.currentQuestionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      item: [{
        linkId: 'group',
        type: 'group',
        item: [{
          linkId: 'q1',
          type: 'string',
          extension: [{
            url: TEMPLATE_EXTRACT_URL,
            extension: [{url: 'template', valueReference: {reference: '#vs1'}}]
          }]
        }]
      }]
    };
    internals.originalResourceId = 'vs1';
    internals.changedValue = {resourceType: 'ValueSet', id: 'renamed'};
    internals.data = {
      formProperty: {
        findRoot: () => ({
          value: {resourceType: 'Questionnaire', status: 'draft'},
          getProperty: () => ({value: []})
        })
      }
    };

    expect(internals.isReferencedResourceIdChanged()).toBeTrue();
  });
});
