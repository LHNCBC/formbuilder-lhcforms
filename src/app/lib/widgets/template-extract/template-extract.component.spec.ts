import {BehaviorSubject, Subject} from 'rxjs';
import fhir from 'fhir/r4';
import {SharedObjectService} from '../../../services/shared-object.service';
import {TableEditRowInDlgComponent} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {TemplateExtractComponent} from './template-extract.component';

describe('TemplateExtractComponent', () => {
  const patient: fhir.Patient = {resourceType: 'Patient', id: 'patient-template'};
  let component: TemplateExtractComponent;
  let sharedObjectService: SharedObjectService;

  /**
   * Create the component without rendering, with a root model that may own Questionnaire.contained.
   *
   * @param rootValue - Value of the editor's root model.
   * @param containedChanges - Value changes of the root 'contained' property; omitted at item level.
   */
  function createComponent(rootValue: any, containedChanges?: BehaviorSubject<fhir.Resource[]>): void {
    component = Object.create(TemplateExtractComponent.prototype) as TemplateExtractComponent;
    Object.defineProperty(component, 'sharedObjectService', {value: sharedObjectService});
    Object.defineProperty(component, 'extensionsService', {
      value: {extensionsObservable: new Subject<void>(), extensionsProp: {value: []}}
    });
    component['cdr'] = jasmine.createSpyObj('cdr', ['markForCheck']);
    component['subscriptions'] = [];
    component.containedResources = [];
    const root = {
      value: rootValue,
      getProperty: (name: string) => name === 'contained' && containedChanges
        ? {valueChanges: containedChanges}
        : undefined
    };
    component['formProperty'] = {findRoot: () => root, properties: []} as any;
  }

  beforeEach(() => {
    sharedObjectService = new SharedObjectService();
    spyOn(TableEditRowInDlgComponent.prototype, 'ngAfterViewInit');
    spyOn(TableEditRowInDlgComponent.prototype, 'isAddButtonDisabled').and.returnValue(false);
  });

  afterEach(() => component['subscriptions'].forEach(subscription => subscription.unsubscribe()));

  it('enables Add when the first contained resource is added at form level, and disables it when removed', () => {
    // A new form: the shared questionnaire, published on load, has no contained resources.
    sharedObjectService.questionnaire = {resourceType: 'Questionnaire', status: 'draft'};
    const contained = new BehaviorSubject<fhir.Resource[]>([]);
    createComponent({resourceType: 'Questionnaire', status: 'draft'}, contained);

    component.ngAfterViewInit();
    expect(component.isAddButtonDisabled()).toBeTrue();

    contained.next([patient]);
    expect(component.isAddButtonDisabled()).toBeFalse();
    expect(component.containedResources).toEqual([
      {reference: '#patient-template', label: 'Patient #patient-template'}
    ]);

    contained.next([]);
    expect(component.isAddButtonDisabled()).toBeTrue();
  });

  it('uses the working Questionnaire at item level instead of the questionnaire published on load', () => {
    sharedObjectService.questionnaire = {resourceType: 'Questionnaire', status: 'draft'};
    sharedObjectService.currentQuestionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      contained: [patient]
    };
    createComponent({linkId: 'q1', type: 'string'});

    component.ngAfterViewInit();

    expect(component.isAddButtonDisabled()).toBeFalse();
  });
});


