import {ContainedResourceService} from '../../../services/contained-resource.service';
import {SharedObjectService} from '../../../services/shared-object.service';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../../constants/constants';
import {TableComponent} from '../table/table.component';
import {ContainedComponent} from './contained.component';
import {of} from 'rxjs';

describe('ContainedComponent', () => {
  let component: ContainedComponent;
  let addItem: jasmine.Spy;
  let showDialog: jasmine.Spy;

  beforeEach(() => {
    component = Object.create(ContainedComponent.prototype) as ContainedComponent;
    addItem = jasmine.createSpy('addItem');
    showDialog = jasmine.createSpy('showDialog');
    Object.defineProperty(component, 'containedResourceService', {
      value: new ContainedResourceService()
    });
    component['dialogService'] = {showDialog} as any;
    component['formProperty'] = {value: [], addItem} as any;
  });

  it('adds one valid arbitrary FHIR resource selected from a local file', async () => {
    const input = {
      files: [new File([JSON.stringify({
        resourceType: 'Patient',
        id: 'patient-1',
        active: true
      })], 'patient.json', {type: 'application/fhir+json; fhirVersion=4.0'})],
      value: 'patient.json'
    };

    await component.onResourceFileSelected({target: input} as unknown as Event);

    expect(addItem).toHaveBeenCalledTimes(1);
    const resource = addItem.calls.mostRecent().args[0];
    expect(resource.active).toBeTrue();
    expect(component['containedResourceService'].getVersionInfo(resource)?.version).toBe('R4');
    expect(input.value).toBe('');
  });

  it('asks before adding a resource that requires contained-resource normalization', async () => {
    showDialog.and.returnValue({result: Promise.resolve('import')});
    const input = {
      files: [new File([JSON.stringify({
        resourceType: 'Observation',
        meta: {versionId: '3'}
      })], 'observation.json', {type: 'application/json'})],
      value: 'observation.json'
    };

    await component.onResourceFileSelected({target: input} as unknown as Event);

    expect(showDialog).toHaveBeenCalled();
    expect(addItem).toHaveBeenCalledTimes(1);
    const resource = addItem.calls.mostRecent().args[0];
    expect(resource.id).toBe('Observation-1');
    expect(resource.meta).toBeUndefined();
  });

  it('does not add an invalid resource and reports the error', async () => {
    const input = {
      files: [new File(['{"not":"fhir"}'], 'invalid.json', {type: 'application/json'})],
      value: 'invalid.json'
    };

    await component.onResourceFileSelected({target: input} as unknown as Event);

    expect(addItem).not.toHaveBeenCalled();
    expect(showDialog).toHaveBeenCalledWith(
      jasmine.anything(),
      'Unable to import contained resource',
      'The selected JSON does not have a valid resourceType.'
    );
  });

  it('imports a selected server resource through contained-resource normalization', async () => {
    showDialog.and.returnValue({result: Promise.resolve('import')});
    const configureSearch = jasmine.createSpy('configureForContainedResourceImport');
    const open = jasmine.createSpy('open');
    open.and.returnValues(
      {result: Promise.resolve(true)},
      {
        componentInstance: {configureForContainedResourceImport: configureSearch},
        result: Promise.resolve({resourceType: 'Practitioner', id: 'p2'})
      }
    );
    Object.defineProperty(component, 'modalService', {value: {open}});
    Object.defineProperty(component, 'fhirService', {value: {
      getFhirServer: () => ({version: 'R4'}),
      readResource: () => of({
        resourceType: 'Practitioner',
        id: 'p2',
        meta: {lastUpdated: '2026-09-02T12:00:00Z'},
        active: true
      })
    }});

    await component['importResourceFromFHIRServer']();

    expect(configureSearch).toHaveBeenCalled();
    expect(addItem).toHaveBeenCalledTimes(1);
    const imported = addItem.calls.mostRecent().args[0];
    expect(imported.meta).toBeUndefined();
    expect(component['containedResourceService'].getVersionInfo(imported)).toEqual({
      version: 'R4',
      confidence: 'authoritative',
      source: 'fhir-server'
    });
  });

  describe('importing a resource whose id is already used', () => {
    const existing = [
      {resourceType: 'ValueSet', id: 'vs1', status: 'active'},
      {resourceType: 'Patient', id: 'patient-template', active: false, gender: 'female'}
    ];
    let reset: jasmine.Spy;

    /**
     * Select a local file with the given resource.
     *
     * @param resource - Resource JSON to import.
     */
    async function importFile(resource: object): Promise<void> {
      const input = {
        files: [new File([JSON.stringify(resource)], 'resource.json', {type: 'application/json'})],
        value: 'resource.json'
      };
      await component.onResourceFileSelected({target: input} as unknown as Event);
    }

    beforeEach(() => {
      reset = jasmine.createSpy('reset');
      component['formProperty'] = {value: existing, addItem, reset} as any;
    });

    it('replaces the contents of a resource of the same type and keeps its id', async () => {
      showDialog.and.returnValue({result: Promise.resolve('replace')});

      await importFile({resourceType: 'Patient', id: 'patient-template', active: true});

      expect(showDialog).toHaveBeenCalledOnceWith(
        jasmine.anything(),
        'Replace contained resource',
        jasmine.stringContaining('A contained Patient with id <strong>patient-template</strong> already exists.'),
        [{label: 'Cancel', value: 'cancel'}, {label: 'Replace', value: 'replace'}]
      );
      expect(addItem).not.toHaveBeenCalled();
      expect(reset).toHaveBeenCalledTimes(1);
      const [resources, onlySelf] = reset.calls.mostRecent().args;
      expect(onlySelf).toBeFalse();
      expect(resources[0]).toBe(existing[0]);
      expect(resources[1]).toEqual(jasmine.objectContaining({resourceType: 'Patient', id: 'patient-template', active: true}));
      expect(resources[1].gender).toBeUndefined();
      expect(component['containedResourceService'].getVersionInfo(resources[1])?.confidence).toBe('unknown');
    });

    it('keeps the existing resource when replacement is canceled', async () => {
      showDialog.and.returnValue({result: Promise.resolve('cancel')});

      await importFile({resourceType: 'Patient', id: 'patient-template', active: true});

      expect(reset).not.toHaveBeenCalled();
      expect(addItem).not.toHaveBeenCalled();
    });

    it('rejects a resource of another type', async () => {
      await importFile({resourceType: 'Observation', id: 'patient-template', status: 'final'});

      expect(showDialog).toHaveBeenCalledOnceWith(
        jasmine.anything(),
        'Unable to import contained resource',
        'A contained Patient with id "patient-template" already exists. It can only be replaced by a Patient resource.'
      );
      expect(reset).not.toHaveBeenCalled();
      expect(addItem).not.toHaveBeenCalled();
    });
  });

  it('routes Add menu actions to ValueSet creation and file upload', () => {
    spyOn(component, 'addItemWithAlert');
    spyOn(component, 'openResourceFilePicker');
    const serverImport = spyOn<any>(component, 'importResourceFromFHIRServer');

    component.onAddMenuItem('create-value-set', {});
    component.onAddMenuItem('upload-file', {});
    component.onAddMenuItem('import-server', {});

    expect(component.addItemWithAlert).toHaveBeenCalledTimes(1);
    expect(component.openResourceFilePicker).toHaveBeenCalledTimes(1);
    expect(serverImport).toHaveBeenCalledTimes(1);
  });

  it('blocks deleting a resource referenced only by an item-level templateExtract', () => {
    const sharedObjectService = new SharedObjectService();
    // The form-level model has no items; they come from the current Questionnaire.
    sharedObjectService.currentQuestionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      item: [{
        linkId: 'q1',
        type: 'string',
        extension: [{
          url: EXTENSION_URL_TEMPLATE_EXTRACT,
          extension: [{url: 'template', valueReference: {reference: '#patient-template'}}]
        }]
      }]
    };
    Object.defineProperty(component, 'sharedObjectService', {value: sharedObjectService});
    const formLevelRoot = {
      value: {resourceType: 'Questionnaire', status: 'draft'},
      getProperty: () => ({value: []})
    };
    component['formProperty'] = {
      properties: [{value: {resourceType: 'Patient', id: 'patient-template'}}],
      findRoot: () => formLevelRoot
    } as any;
    const parentConfirm = spyOn(TableComponent.prototype, 'confirmRemoveProperty');

    component.confirmRemoveProperty(0);

    expect(showDialog).toHaveBeenCalledTimes(1);
    expect(showDialog.calls.mostRecent().args[2]).toBe(
      'The contained resource #patient-template is referenced by Template-based extraction and cannot be deleted.'
    );
    expect(parentConfirm).not.toHaveBeenCalled();
  });
});
