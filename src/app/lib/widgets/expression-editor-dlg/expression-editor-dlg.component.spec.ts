import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ExpressionEditorComponent, ExpressionEditorModule} from '@lhncbc/expression-editor/ngx-expression-editor';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import fhir from 'fhir/r4';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../../constants/constants';
import {ExpressionEditorDlgComponent} from './expression-editor-dlg.component';

describe('ExpressionEditorDlgComponent', () => {
  let component: ExpressionEditorDlgComponent;
  let fixture: ComponentFixture<ExpressionEditorDlgComponent>;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    activeModal = jasmine.createSpyObj('activeModal', ['close']);
    await TestBed.configureTestingModule({
      imports: [ExpressionEditorModule, NoopAnimationsModule],
      providers: [{provide: NgbActiveModal, useValue: activeModal}],
      declarations: [ExpressionEditorDlgComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpressionEditorDlgComponent);
    component = fixture.componentInstance;
    component.questionnaire = {
      resourceType: 'Questionnaire',
      status: 'draft',
      item: [{
        linkId: 'target',
        text: 'Target',
        type: 'string',
        extension: [{
          url: 'Output Expression',
          valueExpression: {language: 'text/fhirpath', expression: "'standard expression'"}
        }]
      }]
    } satisfies fhir.Questionnaire;
    component.linkId = 'target';
    component.display = {
      titleSection: true,
      uneditableVariablesSection: true,
      itemVariablesSection: false,
      outputExpressionSection: true
    };
  });

  /** Render the wrapper and return the actual package component receiving its inputs. */
  function renderEditor(): ExpressionEditorComponent {
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(ExpressionEditorComponent)).componentInstance;
  }

  it('preserves valueExpression defaults for existing expression callers', () => {
    const editor = renderEditor();

    expect(editor.expressionValueType).toBe('valueExpression');
    expect(editor.expressionParentIndex).toBeNull();
    expect(editor.finalExpression).toBe("'standard expression'");
    expect(editor.isExtractionExpression).toBeFalse();
  });

  it('forwards native string storage and the absolute parent index to the package', () => {
    component.questionnaire.item[0].extension.push(...["'first'", "'second'"].map(valueString => ({
      url: EXTENSION_URL_TEMPLATE_EXTRACT,
      extension: [
        {url: 'template', valueReference: {reference: '#template'}},
        {url: 'fullUrl', valueString}
      ]
    })));
    component.expressionUri = 'fullUrl';
    component.expressionValueType = 'valueString';
    component.expressionParentIndex = 2;

    const editor = renderEditor();

    expect(editor.expressionUri).toBe('fullUrl');
    expect(editor.expressionValueType).toBe('valueString');
    expect(editor.expressionParentIndex).toBe(2);
    expect(editor.finalExpression).toBe("'second'");
    expect(editor.isExtractionExpression).toBeTrue();
  });

  it('preserves the empty linkId for form-level variable callers', () => {
    component.linkId = '';
    component.display.outputExpressionSection = false;

    const editor = renderEditor();

    expect(editor.itemLinkId).toBe('');
    expect(editor.expressionValueType).toBe('valueExpression');
    expect(editor.expressionParentIndex).toBeNull();
    expect(editor.isExtractionExpression).toBeFalse();
  });

  for(const hasItems of [true, false]) {
    for(const field of ['fullUrl', 'resourceId']) {
      it(`edits root ${field} with an empty linkId ${hasItems ? 'with' : 'without'} items`, fakeAsync(() => {
        component.linkId = '';
        component.expressionUri = field;
        component.expressionValueType = 'valueString';
        component.expressionParentIndex = 2;
        component.questionnaire.extension = [
          {url: 'http://example.org/unrelated', valueString: 'retained'},
          ...["'first'", "'second'"].map(valueString => ({
            url: EXTENSION_URL_TEMPLATE_EXTRACT,
            extension: [
              {url: 'template', valueReference: {reference: '#template'}},
              {url: 'fullUrl', valueString}
            ]
          }))
        ];
        if(!hasItems) {
          delete component.questionnaire.item;
        }
        const original = structuredClone(component.questionnaire);

        const editor = renderEditor();

        expect(editor.itemLinkId).toBe('');
        expect(editor.loadError).toBeFalse();
        expect(editor.isExtractionExpression).toBeTrue();
        expect(editor.finalExpression).toBe(field === 'fullUrl' ? "'second'" : '');
        const editorElement = fixture.debugElement.query(By.directive(ExpressionEditorComponent)).nativeElement;
        expect(editorElement.shadowRoot.querySelector('#final-expression')).not.toBeNull();

        editor.finalExpression = "'saved root expression'";
        editor.export();
        tick(100);

        const expected = structuredClone(original);
        const children = expected.extension[2].extension;
        if(field === 'fullUrl') {
          children[1].valueString = "'saved root expression'";
        }
        else {
          children.push({url: field, valueString: "'saved root expression'"});
        }
        expect(activeModal.close).toHaveBeenCalledOnceWith(expected);
        expect(component.questionnaire).toEqual(original);
      }));
    }
  }

  it('returns the saved Questionnaire and the existing cancellation sentinel', () => {
    const editor = renderEditor();

    editor.save.emit(component.questionnaire);
    expect(activeModal.close).toHaveBeenCalledOnceWith(component.questionnaire);
    activeModal.close.calls.reset();
    editor.cancel.emit();
    expect(activeModal.close).toHaveBeenCalledOnceWith(false);
  });
});
