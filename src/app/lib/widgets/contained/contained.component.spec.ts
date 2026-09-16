import {ContainedResourceService} from '../../../services/contained-resource.service';
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
});
