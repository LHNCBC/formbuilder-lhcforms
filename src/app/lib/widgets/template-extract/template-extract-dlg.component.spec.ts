import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ArrayProperty, FormProperty, PropertyGroup} from '@lhncbc/ngx-schema-form';
import type {DisplaySectionControl, ExpressionValueType} from '@lhncbc/expression-editor/ngx-expression-editor';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import copy from 'fast-copy';
import fhir from 'fhir/r4';
import {Subject} from 'rxjs';
import {SharedObjectService} from '../../../services/shared-object.service';
import {DialogService} from '../../../services/dialog.service';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../../constants/constants';
import {ExpressionEditorDlgComponent} from '../expression-editor-dlg/expression-editor-dlg.component';
import {MessageDlgComponent, MessageDlgOptions, MessageType} from '../message-dlg/message-dlg.component';
import {TemplateExtractDialogData, TemplateExtractDlgComponent} from './template-extract-dlg.component';
import {TemplateExtractExpressionUrl} from './template-extract.util';

interface EditorInputs {
  questionnaire?: fhir.Questionnaire;
  linkId?: string;
  expressionUri?: string;
  expressionValueType?: ExpressionValueType;
  expressionParentIndex?: number;
  expressionLabel?: string;
  display?: DisplaySectionControl;
}

/**
 * Create an occurrence whose template reference is deliberately shared by other rows.
 *
 * @param expression - FHIRPath expression stored in the fullUrl child.
 * @returns A templateExtract extension referencing '#patient-template'.
 */
function templateExtension(expression: string): fhir.Extension {
  return {
    url: EXTENSION_URL_TEMPLATE_EXTRACT,
    extension: [
      {url: 'template', valueReference: {reference: '#patient-template'}},
      {url: 'fullUrl', valueString: expression}
    ]
  };
}

describe('TemplateExtractDlgComponent', () => {
  let component: TemplateExtractDlgComponent;
  let fixture: ComponentFixture<TemplateExtractDlgComponent>;
  let questionnaire: fhir.Questionnaire;
  let data: TemplateExtractDialogData;
  let sharedObjectService: SharedObjectService;
  let modalService: jasmine.SpyObj<NgbModal>;
  let dialogService: jasmine.SpyObj<DialogService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<TemplateExtractDlgComponent>>;
  let editorInputs: EditorInputs;
  let modalResult: Subject<fhir.Questionnaire | false>;

  beforeEach(async () => {
    const unrelated: fhir.Extension = {url: 'http://example.org/unrelated', valueString: 'retained'};
    questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      title: 'Current questionnaire',
      contained: [
        {resourceType: 'Patient', id: 'patient-template'},
        {resourceType: 'Patient', id: 'other-template'}
      ],
      extension: [
        copy(unrelated), templateExtension("'root-first'"),
        copy(unrelated), templateExtension("'root-second'")
      ],
      item: [{
        linkId: 'parent',
        type: 'group',
        item: [{
          linkId: 'target',
          type: 'string',
          extension: [
            copy(unrelated), templateExtension("'item-first'"),
            copy(unrelated), templateExtension("'item-second'")
          ]
        }]
      }, {
        linkId: 'sibling',
        type: 'string',
        extension: [templateExtension("'sibling'")]
      }]
    };
    data = {arrayProperty: jasmine.createSpyObj<ArrayProperty>('arrayProperty', ['findRoot']), rowIndex: 1};
    dialogRef = jasmine.createSpyObj('dialogRef', ['close']);
    dialogService = jasmine.createSpyObj('dialogService', ['showDialog']);
    modalService = jasmine.createSpyObj('modalService', ['open']);
    modalService.open.and.callFake(() => {
      editorInputs = {};
      modalResult = new Subject<fhir.Questionnaire | false>();
      return jasmine.createSpyObj<NgbModalRef>('modalRef', ['close'], {
        componentInstance: editorInputs,
        closed: modalResult.asObservable()
      });
    });
    await TestBed.configureTestingModule({
      imports: [TemplateExtractDlgComponent, NoopAnimationsModule],
      providers: [
        SharedObjectService,
        {provide: MAT_DIALOG_DATA, useValue: data},
        {provide: MatDialogRef, useValue: dialogRef},
        {provide: NgbModal, useValue: modalService},
        {provide: DialogService, useValue: dialogService}
      ]
    }).compileComponents();
    sharedObjectService = TestBed.inject(SharedObjectService);
    sharedObjectService.questionnaire = questionnaire;
    sharedObjectService.currentQuestionnaire = questionnaire;
  });

  afterEach(() => modalResult?.complete());

  /**
   * Check that an expression-editor problem is shown to the user and the editor is not opened.
   * @param message - Expected error message.
   */
  function expectExpressionError(message: string): void {
    expect(dialogService.showDialog).toHaveBeenCalledOnceWith(MessageType.DANGER, 'Unable to edit expression', message);
    expect(modalService.open).not.toHaveBeenCalled();
  }

  /**
   * Create the dialog with the same form-property scope and filtered rows as the table.
   * @param scope - Questionnaire root or nested item being edited.
   * @param rowIndex - Filtered occurrence index, or -1 for a new occurrence.
   * @param linkId - Item-level model linkId, e.g. '' for a cleared Link Id.
   */
  async function createDialog(scope: 'form' | 'item' = 'item', rowIndex = 1, linkId = 'target'): Promise<void> {
    const scopeValue = scope === 'form' ? questionnaire : questionnaire.item[0].item[0];
    const root = jasmine.createSpyObj<PropertyGroup>('root', ['getProperty'], {value: scopeValue});
    if(scope === 'item') {
      root.getProperty.withArgs('linkId').and.returnValue(
        jasmine.createSpyObj<FormProperty>('linkId', ['setValue'], {value: linkId})
      );
    }
    const rows = (scopeValue.extension || [])
      .filter(extension => extension.url === EXTENSION_URL_TEMPLATE_EXTRACT)
      .map(extension => jasmine.createSpyObj<FormProperty>('row', ['setValue'], {value: extension}));
    const arrayProperty = jasmine.createSpyObj<ArrayProperty>('arrayProperty', ['findRoot'], {properties: rows});
    arrayProperty.findRoot.and.returnValue(root);
    data.arrayProperty = arrayProperty;
    data.rowIndex = rowIndex;
    fixture = TestBed.createComponent(TemplateExtractDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const fields: TemplateExtractExpressionUrl[] = [
    'fullUrl', 'resourceId', 'ifNoneMatch', 'ifModifiedSince', 'ifMatch', 'ifNoneExist'
  ];
  fields.forEach(field => {
    it(`passes ${field} as a native valueString field in the selected item occurrence`, async () => {
      await createDialog();
      component.model[field] = "'draft expression'";
      const original = copy(questionnaire);

      component.editExpression(field);

      expect(modalService.open).toHaveBeenCalledOnceWith(ExpressionEditorDlgComponent, {size: 'lg', fullscreen: 'lg'});
      expect(editorInputs.linkId).toBe('target');
      expect(editorInputs.expressionUri).toBe(field);
      expect(editorInputs.expressionValueType).toBe('valueString');
      expect(editorInputs.expressionParentIndex).toBe(3);
      expect(editorInputs.expressionLabel).toBe(`${field} FHIRPath expression`);
      expect(editorInputs.display).toEqual({
        titleSection: true,
        uneditableVariablesSection: true,
        itemVariablesSection: false,
        outputExpressionSection: true
      });
      const extensions = editorInputs.questionnaire.item[0].item[0].extension;
      expect(extensions[3].extension.find(extension => extension.url === field)).toEqual({
        url: field, valueString: "'draft expression'"
      });
      expect(extensions.slice(0, 3)).toEqual(original.item[0].item[0].extension.slice(0, 3));
      expect(editorInputs.questionnaire.extension).toEqual(original.extension);
      expect(editorInputs.questionnaire.item[1]).toEqual(original.item[1]);
      expect(questionnaire).toEqual(original);
    });
  });

  it('uses an empty linkId and the selected root occurrence in the current form model', async () => {
    Object.assign(questionnaire, {__$editorState: true});
    sharedObjectService.currentQuestionnaire = {...copy(questionnaire), title: 'Stale shared questionnaire'};
    await createDialog('form');
    component.model.templateReference = '#other-template';
    component.model.fullUrl = "'unsaved root draft'";
    const original = copy(questionnaire);

    component.editExpression('fullUrl');

    expect(editorInputs.questionnaire.title).toBe('Current questionnaire');
    expect(editorInputs.linkId).toBe('');
    expect(editorInputs.expressionParentIndex).toBe(3);
    expect(editorInputs.questionnaire.item).toEqual(original.item);
    expect(editorInputs.questionnaire.extension.slice(0, 3)).toEqual(original.extension.slice(0, 3));
    expect(editorInputs.questionnaire.extension[3].extension).toEqual([
      {url: 'template', valueReference: {reference: '#other-template'}},
      {url: 'fullUrl', valueString: "'unsaved root draft'"}
    ]);
    expect(JSON.stringify(editorInputs.questionnaire)).not.toContain('__$');
    expect(questionnaire).toEqual(original);
  });

  it('gives the form-level expression editor the current items, which the form model excludes', async () => {
    const currentQuestionnaire = copy(questionnaire);
    sharedObjectService.currentQuestionnaire = currentQuestionnaire;
    // Like the form-level editor model, the root value has no items.
    delete questionnaire.item;
    await createDialog('form');

    component.editExpression('fullUrl');

    expect(editorInputs.linkId).toBe('');
    expect(editorInputs.questionnaire.title).toBe('Current questionnaire');
    expect(editorInputs.questionnaire.item).toEqual(currentQuestionnaire.item);
    expect(questionnaire.item).toBeUndefined();
  });

  (['form', 'item'] as const).forEach(scope => {
    it(`appends a new ${scope} occurrence without replacing existing rows`, async () => {
      await createDialog(scope, -1);
      expect(component.model.templateReference).toBe('#patient-template');
      expect(component.bundleFieldsCollapsed).toBeTrue();
      component.model.resourceId = "'new resource'";
      const original = copy(questionnaire);

      component.editExpression('resourceId');

      const target = scope === 'form'
        ? editorInputs.questionnaire
        : editorInputs.questionnaire.item[0].item[0];
      const existing = scope === 'form'
        ? original.extension
        : original.item[0].item[0].extension;
      expect(editorInputs.linkId).toBe(scope === 'form' ? '' : 'target');
      expect(editorInputs.expressionParentIndex).toBe(existing.length);
      expect(target.extension.slice(0, -1)).toEqual(existing);
      expect(target.extension[existing.length].extension).toEqual([
        {url: 'template', valueReference: {reference: '#patient-template'}},
        {url: 'resourceId', valueString: "'new resource'"}
      ]);
      expect(questionnaire).toEqual(original);
    });
  });

  it('edits a new root occurrence without requiring items or existing extensions', async () => {
    delete questionnaire.item;
    delete questionnaire.extension;
    await createDialog('form', -1);
    const original = copy(questionnaire);

    component.editExpression('fullUrl');

    expect(editorInputs.linkId).toBe('');
    expect(editorInputs.expressionParentIndex).toBe(0);
    expect(editorInputs.questionnaire.item).toBeUndefined();
    expect(editorInputs.questionnaire.extension).toEqual([{
      url: EXTENSION_URL_TEMPLATE_EXTRACT,
      extension: [{url: 'template', valueReference: {reference: '#patient-template'}}]
    }]);
    const result = copy(editorInputs.questionnaire);
    result.extension[0].extension.push({url: 'fullUrl', valueString: "'new root expression'"});

    modalResult.next(result);

    expect(component.model.fullUrl).toBe("'new root expression'");
    expect(questionnaire).toEqual(original);
  });

  it('targets the existing parent when the edited child is missing', async () => {
    await createDialog();

    component.editExpression('resourceId');

    expect(editorInputs.expressionParentIndex).toBe(3);
    expect(editorInputs.questionnaire.item[0].item[0].extension[3])
      .toEqual(questionnaire.item[0].item[0].extension[3]);
    expect(editorInputs.questionnaire.item[0].item[0].extension[3].extension
      .some(extension => extension.url === 'resourceId')).toBeFalse();
  });

  (['form', 'item'] as const).forEach(scope => {
    it(`reads only the selected ${scope} field and preserves metadata when saving the outer dialog`, async () => {
      const source = (scope === 'form' ? questionnaire : questionnaire.item[0].item[0]).extension[3];
      source.id = 'selected-occurrence';
      source.extension.push({url: 'http://example.org/custom-slice', valueCode: 'keep'});
      await createDialog(scope);
      const original = copy(questionnaire);
      const originalModel = copy(component.model);
      component.editExpression('fullUrl');
      const result = copy(editorInputs.questionnaire);
      result.title = 'Must not be imported';
      const target = scope === 'form' ? result : result.item[0].item[0];
      const otherTarget = scope === 'form' ? result.item[0].item[0] : result;
      otherTarget.extension[3].extension[1].valueString = "'wrong scope'";
      target.extension[1].extension[1].valueString = "'wrong occurrence'";
      const edited = target.extension[3];
      edited.extension[0].valueReference.reference = '#other-template';
      edited.extension[1].valueString = "'saved expression'";
      edited.extension.push({url: 'ifMatch', valueString: "'must not be imported'"});

      modalResult.next(result);

      expect(component.model).toEqual({...originalModel, fullUrl: "'saved expression'"});
      expect(questionnaire).toEqual(original);
      expect(dialogRef.close).not.toHaveBeenCalled();
      component.save();
      const expected = copy(source);
      expected.extension[1].valueString = "'saved expression'";
      expect(dialogRef.close).toHaveBeenCalledOnceWith(expected);
    });
  });

  it('seeds later expression edits with earlier unsaved changes', async () => {
    await createDialog();
    component.editExpression('fullUrl');
    const result = copy(editorInputs.questionnaire);
    result.item[0].item[0].extension[3].extension[1].valueString = "'first edit'";
    modalResult.next(result);
    modalResult.complete();

    component.editExpression('resourceId');

    expect(editorInputs.questionnaire.item[0].item[0].extension[3].extension[1].valueString)
      .toBe("'first edit'");
    expect(questionnaire.item[0].item[0].extension[3].extension[1].valueString).toBe("'item-second'");
  });

  it('does not borrow another occurrence when the returned child is absent', async () => {
    await createDialog();
    component.editExpression('fullUrl');
    const result = copy(editorInputs.questionnaire);
    result.item[0].item[0].extension[3].extension.pop();

    modalResult.next(result);

    expect(component.model.fullUrl).toBe('');
    expect(questionnaire.item[0].item[0].extension[3].extension[1].valueString).toBe("'item-second'");
  });

  it('leaves the draft unchanged on expression cancellation or dismissal', async () => {
    await createDialog();
    const originalModel = copy(component.model);
    component.editExpression('fullUrl');
    modalResult.next(false);
    modalResult.complete();
    component.editExpression('resourceId');
    modalResult.complete();

    expect(component.model).toEqual(originalModel);
    expect(dialogRef.close).not.toHaveBeenCalled();
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledOnceWith(false);
  });

  describe('discarding changes', () => {
    let confirmInputs: {options?: MessageDlgOptions};
    let confirmClosed: Subject<string>;
    let confirmHidden: Subject<void>;

    /**
     * Change the fullUrl expression through the expression editor, then make the next modal
     * a discard confirmation.
     */
    async function changeExpression(): Promise<void> {
      await createDialog();
      component.editExpression('fullUrl');
      const result = copy(editorInputs.questionnaire);
      result.item[0].item[0].extension[3].extension
        .find(extension => extension.url === 'fullUrl').valueString = "'changed'";
      modalResult.next(result);
      modalService.open.and.callFake(() => {
        confirmInputs = {};
        confirmClosed = new Subject<string>();
        confirmHidden = new Subject<void>();
        return jasmine.createSpyObj<NgbModalRef>('confirmRef', ['close'], {
          componentInstance: confirmInputs,
          closed: confirmClosed.asObservable(),
          hidden: confirmHidden.asObservable()
        });
      });
    }

    /**
     * Answer the discard confirmation and wait for the dialog to close after the modal hides.
     * @param value - Value of the chosen button.
     */
    async function answer(value: string): Promise<void> {
      confirmClosed.next(value);
      confirmHidden.next();
      await new Promise(resolve => setTimeout(resolve));
    }

    it('closes an unchanged new dialog without confirmation', async () => {
      await createDialog('item', -1);

      component.cancel();

      expect(modalService.open).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledOnceWith(false);
    });

    it('asks for confirmation with a header before discarding a changed expression', async () => {
      await changeExpression();

      component.cancel();

      expect(modalService.open).toHaveBeenCalledWith(MessageDlgComponent, {scrollable: true});
      expect(confirmInputs.options.title).toBe('Confirm');
      expect(confirmInputs.options.type).toBe(MessageType.INFO);
      expect(dialogRef.close).not.toHaveBeenCalled();
      await answer('yes');
      expect(dialogRef.close).toHaveBeenCalledOnceWith(false);
    });

    it('keeps the dialog open when the user does not discard the changes', async () => {
      await changeExpression();

      component.cancel();
      await answer('no');

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(component.model.fullUrl).toBe("'changed'");
    });

    it('asks for confirmation after the template is changed', async () => {
      await createDialog();
      modalService.open.and.callFake(() => jasmine.createSpyObj<NgbModalRef>('confirmRef', ['close'], {
        componentInstance: {},
        closed: new Subject<string>().asObservable(),
        hidden: new Subject<void>().asObservable()
      }));
      component.model.templateReference = '#other-template';

      component.cancel();

      expect(modalService.open).toHaveBeenCalledOnceWith(MessageDlgComponent, {scrollable: true});
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  it('reports a missing item rather than silently using Questionnaire-level extensions', async () => {
    await createDialog();
    questionnaire.item[0].item = [];

    component.editExpression('fullUrl');

    expectExpressionError('Cannot edit template extraction: item "target" was not found.');
  });

  it('reports an empty item linkId rather than editing Questionnaire-level extensions', async () => {
    await createDialog('item', 1, '');

    component.editExpression('fullUrl');

    expectExpressionError(
      'Cannot edit template extraction: this item has no Link Id. Enter a unique Link Id, then try again.'
    );
  });

  it('reports a duplicated item linkId rather than editing the first match', async () => {
    questionnaire.item[1].linkId = 'target';
    await createDialog();

    component.editExpression('fullUrl');

    expectExpressionError(
      'Cannot edit template extraction: Link Id "target" is used by 2 items. Make it unique, then try again.'
    );
  });

  it('reports an editor result without the selected occurrence and keeps the draft', async () => {
    await createDialog();
    const originalModel = copy(component.model);
    component.editExpression('fullUrl');
    const result = copy(editorInputs.questionnaire);
    result.item[0].item[0].extension.splice(3, 1);

    modalResult.next(result);

    expect(component.model).toEqual(originalModel);
    expect(dialogService.showDialog).toHaveBeenCalledOnceWith(
      MessageType.DANGER,
      'Unable to edit expression',
      'Cannot read template extraction expression: the selected occurrence was not returned.'
    );
  });

  (['form', 'item'] as const).forEach(scope => {
    it(`reports a missing existing ${scope} occurrence rather than editing another row`, async () => {
      await createDialog(scope);
      (scope === 'form' ? questionnaire : questionnaire.item[0].item[0]).extension.pop();

      component.editExpression('fullUrl');

      expectExpressionError('Cannot edit template extraction: the selected occurrence was not found.');
    });
  });

  describe('missing template', () => {
    /**
     * Read the rendered template warning.
     * @returns Warning element, or null when it is not displayed.
     */
    function getTemplateWarningElement(): HTMLElement | null {
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('.template-extract-template-warning');
    }

    it('shows a missing template as a disabled selected option with a warning', async () => {
      questionnaire.extension[3].extension[0].valueReference.reference = '#gone';
      await createDialog('form', 1);
      fixture.detectChanges();
      await fixture.whenStable();

      const select: HTMLSelectElement = fixture.nativeElement.querySelector('#template-extract-resource');
      const missingOption = select.options[0];
      expect(missingOption.textContent.trim()).toBe('#gone (missing)');
      expect(missingOption.disabled).toBeTrue();
      expect(select.selectedIndex).toBe(0);
      expect(component.canSave()).toBeFalse();
      expect(getTemplateWarningElement().textContent.trim()).toBe(
        'The template #gone is not a contained resource in this form. ' +
        'Choose another template to save this template extraction.'
      );

      component.model.templateReference = '#other-template';
      expect(getTemplateWarningElement()).toBeNull();
      expect(component.canSave()).toBeTrue();
    });

    it('explains that a contained resource is needed when there is none', async () => {
      questionnaire.contained = [];
      await createDialog('form', 0);

      expect(component.canSave()).toBeFalse();
      expect(getTemplateWarningElement().textContent.trim()).toBe(
        'This form has no contained resources to use as a template. ' +
        'Add one under Contained resources in the form-level fields, then edit this template extraction again.'
      );
    });

    it('does not warn when the template exists', async () => {
      await createDialog('form', 0);
      expect(component.missingTemplateReference).toBe('');
      expect(getTemplateWarningElement()).toBeNull();
    });
  });

  describe('duplicate warning', () => {
    /**
     * Read the rendered duplicate warning.
     * @returns Warning element, or null when it is not displayed.
     */
    function getWarningElement(): HTMLElement | null {
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('.template-extract-duplicate-warning');
    }

    it('warns without blocking save when a new occurrence duplicates another row', async () => {
      await createDialog('item', -1);
      expect(getWarningElement()).toBeNull();

      component.model.fullUrl = " 'item-first' ";
      const warning = getWarningElement();
      expect(warning.getAttribute('role')).toBe('alert');
      expect(warning.textContent.trim()).toBe(
        'Row 1 at this level already uses the same template with identical expressions. ' +
        'Each occurrence is extracted separately, which may create duplicate or conflicting Bundle entries.'
      );
      expect(component.canSave()).toBeTrue();
      component.save();
      expect(dialogRef.close).toHaveBeenCalledOnceWith(jasmine.objectContaining({url: EXTENSION_URL_TEMPLATE_EXTRACT}));
    });

    it('does not compare the edited row with itself and clears when the template differs', async () => {
      await createDialog('form', 0);
      expect(getWarningElement()).toBeNull();

      component.model.fullUrl = "'root-second'";
      expect(getWarningElement().textContent).toContain('Row 2 at this level already uses');

      component.model.templateReference = '#other-template';
      expect(getWarningElement()).toBeNull();
    });
  });
});
