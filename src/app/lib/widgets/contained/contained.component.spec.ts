import {ContainedResourceService} from '../../../services/contained-resource.service';
import {SharedObjectService} from '../../../services/shared-object.service';
import {EXTENSION_URL_TEMPLATE_EXTRACT, EXTENSION_URL_TEMPLATE_EXTRACT_BUNDLE} from '../../constants/constants';
import {TableComponent} from '../table/table.component';
import {ContainedComponent} from './contained.component';
import fhir from 'fhir/r4';
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

    expect(showDialog).toHaveBeenCalledOnceWith(
      jasmine.anything(),
      'Normalize contained resource',
      '<p>A contained id was generated: <strong>Observation-1</strong>.</p>' +
      '<p>FHIR does not permit these fields on contained resources, so they will be removed: ' +
      '<strong>meta.versionId</strong>.</p>' +
      '<p>The source file will not be changed.</p>',
      jasmine.anything()
    );
    expect(addItem).toHaveBeenCalledTimes(1);
    const resource = addItem.calls.mostRecent().args[0];
    expect(resource.id).toBe('Observation-1');
    expect(resource.meta).toBeUndefined();
  });

  it('escapes imported values in an import error', async () => {
    const input = {
      files: [new File([JSON.stringify({
        resourceType: 'Patient',
        id: '<b>x</b>'
      })], 'patient.json', {type: 'application/json'})],
      value: 'patient.json'
    };

    await component.onResourceFileSelected({target: input} as unknown as Event);

    expect(addItem).not.toHaveBeenCalled();
    expect(showDialog).toHaveBeenCalledOnceWith(
      jasmine.anything(),
      'Unable to import contained resource',
      'The resource id &quot;&lt;b&gt;x&lt;/b&gt;&quot; is not a valid FHIR id.'
    );
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
    const server = {version: 'R4'};
    Object.defineProperty(component, 'fhirService', {value: {
      getFhirServer: () => server,
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
        'A contained Patient with id &quot;patient-template&quot; already exists. It can only be replaced by a Patient resource.'
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

  describe('deleting a resource referenced elsewhere in the questionnaire', () => {
    let parentConfirm: jasmine.Spy;

    /**
     * Set up the form-level model and the current items, then try to delete the first
     * contained resource.
     *
     * @param formLevel - Form-level fields, including contained; the first one is deleted.
     * @param items - Current Questionnaire items.
     */
    function removeFirstResource(formLevel: Partial<fhir.Questionnaire>, items: fhir.QuestionnaireItem[] = []): void {
      const sharedObjectService = new SharedObjectService();
      sharedObjectService.currentQuestionnaire = {resourceType: 'Questionnaire', status: 'draft', item: items};
      Object.defineProperty(component, 'sharedObjectService', {value: sharedObjectService});
      const formLevelRoot = {
        value: {resourceType: 'Questionnaire', status: 'draft', ...formLevel},
        getProperty: () => ({value: []})
      };
      component['formProperty'] = {
        properties: formLevel.contained.map(resource => ({value: resource})),
        findRoot: () => formLevelRoot
      } as any;
      parentConfirm = spyOn(TableComponent.prototype, 'confirmRemoveProperty');
      component.confirmRemoveProperty(0);
    }

    /**
     * Check that deletion was blocked with a message.
     *
     * @param message - Expected warning message.
     */
    function expectBlocked(message: string): void {
      expect(showDialog).toHaveBeenCalledTimes(1);
      expect(showDialog.calls.mostRecent().args.slice(1, 3)).toEqual(['Contained resource is in use', message]);
      expect(parentConfirm).not.toHaveBeenCalled();
    }

    /**
     * Build the warning for a reference found by the generic search. The message dialog
     * renders HTML, so the location is HTML-escaped, e.g. ' as &#39;.
     *
     * @param resourceId - Id of the referenced resource.
     * @param location - Unescaped location of the reference.
     * @returns Expected warning message.
     */
    function referencedAt(resourceId: string, location: string): string {
      return `The contained resource #${resourceId} is referenced at ` +
        `${location.replace(/'/g, '&#39;')} and cannot be deleted.`;
    }

    it('blocks deleting a Bundle referenced by templateExtractBundle', () => {
      removeFirstResource({
        contained: [{resourceType: 'Bundle', id: 'bundle-template', type: 'transaction'} as fhir.Bundle],
        extension: [{url: EXTENSION_URL_TEMPLATE_EXTRACT_BUNDLE, valueReference: {reference: '#bundle-template'}}]
      });

      expectBlocked(
        'The contained resource #bundle-template is referenced by Template-based extraction and cannot be deleted.'
      );
    });

    it('blocks deleting a resource referenced by any extension valueReference', () => {
      removeFirstResource({
        contained: [{resourceType: 'Patient', id: 'pt'}],
        extension: [
          {url: 'http://example.org/other', valueString: 'x'},
          {url: 'http://example.org/subject', valueReference: {reference: '#pt'}}
        ]
      });

      expectBlocked(referencedAt(
        'pt', "Questionnaire.extension('http://example.org/subject').valueReference.reference"
      ));
    });

    it('blocks deleting a ValueSet referenced by a nested item answerValueSet, and escapes the location', () => {
      removeFirstResource({contained: [{resourceType: 'ValueSet', id: 'vs1', status: 'active'} as fhir.ValueSet]}, [{
        linkId: 'group',
        type: 'group',
        item: [{linkId: "<b>q'1</b>", type: 'choice', answerValueSet: '#vs1'}]
      }]);

      expectBlocked(
        'The contained resource #vs1 is referenced at Questionnaire.item.where(linkId=&#39;group&#39;)' +
        '.item.where(linkId=&#39;&lt;b&gt;q\\&#39;1&lt;/b&gt;&#39;).answerValueSet and cannot be deleted.'
      );
    });

    it('blocks deleting a resource referenced by another contained resource', () => {
      removeFirstResource({contained: [
        {resourceType: 'ValueSet', id: 'vs1', status: 'active'} as fhir.ValueSet,
        {resourceType: 'Questionnaire', id: 'q-template', status: 'draft', item: [
          {linkId: 'a', type: 'choice', answerValueSet: '#vs1'}
        ]} as fhir.Questionnaire
      ]});

      expectBlocked(referencedAt(
        'vs1', "Questionnaire.contained.where(id='q-template').item.where(linkId='a').answerValueSet"
      ));
    });

    it('asks for confirmation when only the resource itself or form builder fields refer to it', () => {
      removeFirstResource({
        contained: [{resourceType: 'Patient', id: 'pt', link: [{other: {reference: '#pt'}, type: 'seealso'}]} as fhir.Patient],
        extension: [{url: 'http://example.org/text', valueString: 'pt'}],
        ['__$internal' as string]: '#pt'
      }, [{linkId: 'q', type: 'string', text: '#ptx'}]);

      expect(showDialog).not.toHaveBeenCalled();
      expect(parentConfirm).toHaveBeenCalledOnceWith(0, 'Are you sure you want to delete this row?');
    });
  });

  describe('importing from a FHIR server', () => {
    const originalServer = {id: 1, endpoint: 'https://example.org/r5', version: 'R5'};
    const importServer = {id: 2, endpoint: 'https://example.org/r4', version: 'R4'};
    let currentServer: typeof originalServer;
    let setFhirServer: jasmine.Spy;

    beforeEach(() => {
      currentServer = originalServer;
      setFhirServer = jasmine.createSpy('setFhirServer').and.callFake((server) => currentServer = server);
      Object.defineProperty(component, 'fhirService', {value: {
        getFhirServer: () => currentServer,
        setFhirServer,
        readResource: () => of({resourceType: 'Practitioner', id: 'p2', active: true})
      }});
    });

    /**
     * Mock the server dialog, which selects the import server, and the search dialog.
     *
     * @param selection - Result of the search dialog; a rejected promise when it is dismissed.
     */
    function mockDialogs(selection: Promise<unknown>): void {
      const open = jasmine.createSpy('open').and.returnValues(
        {result: Promise.resolve(true).then((result) => {
          currentServer = importServer;
          return result;
        })},
        {componentInstance: {configureForContainedResourceImport: () => {}}, result: selection}
      );
      Object.defineProperty(component, 'modalService', {value: {open}});
    }

    it('restores the questionnaire server after importing a resource', async () => {
      mockDialogs(Promise.resolve({resourceType: 'Practitioner', id: 'p2'}));

      await component['importResourceFromFHIRServer']();

      expect(addItem).toHaveBeenCalledTimes(1);
      expect(component['containedResourceService'].getVersionInfo(addItem.calls.mostRecent().args[0])?.version)
        .toBe('R4');
      expect(setFhirServer).toHaveBeenCalledOnceWith(originalServer);
      expect(currentServer).toBe(originalServer);
    });

    it('restores the questionnaire server when the search is canceled', async () => {
      mockDialogs(Promise.reject('dismissed'));

      await component['importResourceFromFHIRServer']();

      expect(addItem).not.toHaveBeenCalled();
      expect(setFhirServer).toHaveBeenCalledOnceWith(originalServer);
    });

    it('does not reset an unchanged server', async () => {
      const open = jasmine.createSpy('open').and.returnValue({result: Promise.reject('dismissed')});
      Object.defineProperty(component, 'modalService', {value: {open}});

      await component['importResourceFromFHIRServer']();

      expect(setFhirServer).not.toHaveBeenCalled();
    });
  });
});
