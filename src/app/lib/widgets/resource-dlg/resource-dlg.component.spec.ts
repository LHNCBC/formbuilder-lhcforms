import { ResourceDlgComponent } from './resource-dlg.component';
import { SharedObjectService } from '../../../services/shared-object.service';
import { MessageDlgOptions, MessageType } from '../message-dlg/message-dlg.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
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

  describe('message dialogs', () => {
    /**
     * Create a dialog whose message dialogs are recorded instead of opened.
     *
     * @param dirty - Whether the dialog content has a changed field.
     * @returns The dialog and the options of the opened message dialogs.
     */
    function createDialog(dirty: boolean): {dialog: ResourceDlgComponent; opened: MessageDlgOptions[]} {
      const dialog = Object.create(ResourceDlgComponent.prototype) as ResourceDlgComponent;
      const opened: MessageDlgOptions[] = [];
      const modalService = jasmine.createSpyObj<NgbModal>('ngbModalService', ['open']);
      modalService.open.and.callFake(() => {
        const componentInstance: {options?: MessageDlgOptions} = {};
        setTimeout(() => opened.push(componentInstance.options));
        return {componentInstance, closed: new Subject<string>()} as unknown as NgbModalRef;
      });
      dialog.ngbModalService = modalService;
      dialog.matDialogRef = jasmine.createSpyObj('matDialogRef', ['close']);
      dialog.dlgContent = {nativeElement: {querySelector: () => dirty ? {} : null}};
      return {dialog, opened};
    }

    it('should confirm discarding changes with a colored header', async () => {
      const {dialog, opened} = createDialog(true);

      dialog.cancel();
      await new Promise(resolve => setTimeout(resolve));

      expect(opened.length).toBe(1);
      expect(opened[0].title).toBe('Confirm');
      expect(opened[0].type).toBe(MessageType.INFO);
      expect(dialog.matDialogRef.close).not.toHaveBeenCalled();
    });

    it('should alert errors with a danger header', async () => {
      const {dialog, opened} = createDialog(false);

      dialog.alertErrors('Bad');
      await new Promise(resolve => setTimeout(resolve));

      expect(opened[0].title).toBe('Fix errors');
      expect(opened[0].type).toBe(MessageType.DANGER);
    });
  });
});
