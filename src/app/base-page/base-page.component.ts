import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {FormService} from '../services/form.service';
import {fhir} from '../fhir';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, switchMap, takeUntil} from 'rxjs/operators';
import {MessageType} from '../lib/widgets/message-dlg/message-dlg.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AutoCompleteResult} from '../lib/widgets/auto-complete/auto-complete.component';
import {FetchService} from '../fetch.service';
import {FhirService} from '../services/fhir.service';
import {FhirServersDlgComponent} from '../lib/widgets/fhir-servers-dlg/fhir-servers-dlg.component';
import {FhirSearchDlgComponent} from '../lib/widgets/fhir-search-dlg/fhir-search-dlg.component';
import { PreviewDlgComponent } from '../lib/widgets/preview-dlg/preview-dlg.component';
import {AppJsonPipe} from '../lib/pipes/app-json.pipe';
import {Util} from '../lib/util';
import {MatTabChangeEvent} from '@angular/material/tabs';
import {MatDialog} from '@angular/material/dialog';
declare var LForms: any;


@Component({
  selector: 'lfb-base-page',
  templateUrl: './base-page.component.html',
  styleUrls: ['./base-page.component.css']
})
export class BasePageComponent implements OnDestroy {

  private unsubscribe = new Subject<void>()
  @Input()
  guidingStep = 'home'; // 'choose-start', 'home', 'item-editor'
  startOption = 'scratch';
  importOption = '';
  editMode = 'fresh';
  questionnaire: fhir.Questionnaire = null;
  formFields: fhir.Questionnaire = null;
  formValue: fhir.Questionnaire;
  formSubject = new Subject<fhir.Questionnaire>();
  @Output()
  state = new EventEmitter<string>();
  objectUrl: any;
  acResult: AutoCompleteResult = null;
  @ViewChild('lhcFormPreview') previewEl: ElementRef;
  selectedPreviewTab = 0;


  constructor(private formService: FormService,
              private modalService: NgbModal,
              private dataSrv: FetchService,
              private fhirService: FhirService,
              private appJsonPipe: AppJsonPipe,
              private cdr: ChangeDetectorRef,
              private matDlg: MatDialog
              ) {
    const isAutoSaved = this.formService.isAutoSaved();
    if(isAutoSaved) {
      this.startOption = 'from_autosave';
    }
    this.formSubject.asObservable().pipe(
      debounceTime(500),
      switchMap((fhirQ) => {
        this.formService.autoSaveForm(fhirQ);
        return of(fhirQ);
      }),
      takeUntil(this.unsubscribe)
    ).subscribe(() => console.log('Saved'));

    formService.guidingStep$.subscribe((step) => {this.guidingStep = step;});

  }


  get lfData(): any {
    const q = Util.convertToQuestionnaireJSON(this.formValue);
    return LForms.Util.convertFHIRQuestionnaireToLForms(q, 'R4');
  }

  /**
   * Create bare minimum form.
   */
  createDefaultForm(): fhir.Questionnaire {
    return {
      title: 'New Form',
      status: 'draft',
      // item: [{text: 'Item 0', linkId: null, type: 'string'}]
      item: []
    }
  }


  /**
   * Notify changes to form.
   * @param event - form object, a.k.a questionnaire
   */
  notifyChange(form) {
    this.formSubject.next(form);
  }


  /**
   * Handle value changes in form-fields component.
   * @param event - Emits questionnaire (Form level copy)
   */
  formFieldsChanged(event) {
    const itemList = this.formValue.item;
    Util.mirrorObject(this.formValue, Util.convertToQuestionnaireJSON(event));
    this.formValue.item = itemList;
    this.notifyChange(this.formValue);
  }


  /**
   * Handle value changes in item-component.
   * @param itemList - Emits item list. Form level fields should be untouched.
   */
  itemComponentChanged(itemList) {
    this.formValue.item = itemList;
    this.notifyChange(this.formValue);
  }


  /**
   * Set questionnaire.
   * Make
   * @param questionnaire - Input FHIR questionnaire
   */
  setQuestionnaire(questionnaire) {
    this.questionnaire = questionnaire;
    this.formValue = Object.assign({}, questionnaire);
    this.formFields = Object.assign({}, questionnaire);
    delete this.formFields.item;
    this.notifyChange(this.formValue);
  }


  /**
   * Switch guiding step
   * @param step - a
   */
  setStep(step: string) {
    this.formService.setGuidingStep(step);
    this.formService.autoSave('state', step);
  }

  /**
   * Check auto save status
   */
  isAutoSaved() {
    return this.formService.isAutoSaved();
  }
  /**
   * Handle continue button.
   */
  onContinue() {
    // TODO - Rethink the logic.
    if(this.startOption === 'from_autosave') {
      this.formService.setGuidingStep(this.formService.autoLoad('state'));
      this.setQuestionnaire(this.formService.autoLoadForm());
    }
    else if (this.startOption === 'scratch') {
      this.setStep('fl-editor');
      this.setQuestionnaire(this.createDefaultForm());
    } else if (this.startOption === 'existing' && this.importOption === 'loinc') {
      this.setStep('choose-start');
      this.setQuestionnaire(this.createDefaultForm());
    }
  }

  /**
   * Remove subscriptions before removing the component.
   */
  ngOnDestroy() {
    this.unsubscribe.next();
  }

/////////////////////////////////////////

  /**
   * Set guiding to step to switch the page.
   */
  /*
  setGuidingStep(step: string) {
    // this.guidingStep = step;
    this.formService.autoSave('state', step);
  }
*/
  /**
   * Select form from local file system. Copied from current form builder.
   *
   * @param event - Object having selected file from the browser file dialog.
   */
  onFileSelected(event) {
    const fileReader = new FileReader();
    const selectedFile = event.target.files[0];
    event.target.value = null; //
    fileReader.onload = () => {
      try {
        this.setQuestionnaire(this.formService.parseQuestionnaire(fileReader.result as string));
      }
      catch (e) {
        this.showError(e);
      }
    }
    fileReader.onerror = (error) => {
      this.showError('Error occurred reading file: ${selectedFile.name}');
    }
    fileReader.readAsText(selectedFile, 'UTF-8');
  }

  showError(error: any) {
    this.formService.showMessage('Error', error.message || error, MessageType.DANGER);
  }

  /**
   * View full Questionnaire json
   */
  showDlg(dialogTemplateRef) {
    this.modalService.open(dialogTemplateRef, {scrollable: true, centered: true, size: 'xl'});
    // this.guidingStep = 'qJSON';
  }

  showDlgMat() {
    this.matDlg.open(PreviewDlgComponent, {data: {questionnaire: this.formValue, lfData: this.lfData}, width: '80vw', height: '80vh'});
  }

  /**
   * Format result item for auto complete.
   * @param acResult - Result item.
   */
  formatter(acResult: any) {
    return acResult.id + ': ' + acResult.title;
  }

  /**
   * Save form to local file, mostly copied from current form builder.
   */
  saveToFile() {
    const content = this.toString(this.questionnaire);
    const blob = new Blob([content], {type: 'application/json;charset=utf-8'});
    const formName = this.questionnaire.title;
    const formShortName = this.questionnaire.name;
    const exportFileName = formShortName ?  formShortName.replace(/\s/g, '-') : (formName ? formName.replace(/\s/g, '-') : 'form');

    // Use hidden anchor to do file download.
    // const downloadLink: HTMLAnchorElement = document.createElement('a');
    const downloadLink = document.getElementById('exportAnchor');
    const urlFactory = (window.URL || window.webkitURL);
    if(this.objectUrl != null) {
      // First release any resources on existing object url
      urlFactory.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.objectUrl = urlFactory.createObjectURL(blob);
    downloadLink.setAttribute('href', this.objectUrl);
    downloadLink.setAttribute('download', exportFileName + '.R4.json');
    // Avoid using downloadLink.click(), which will display down content in the browser.
    downloadLink.dispatchEvent(new MouseEvent('click'));
  }

  /**
   * Call back to auto complete search.
   * @param term - Search term
   */
  acSearch = (term$: Observable<string>): Observable<AutoCompleteResult []> => {
    return term$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term) => term.length < 2 ? [] : this.dataSrv.searchForms(term)));
  }

  /**
   * Get questionnaire by id
   * @param questionnaireId - Id of the questionnaire to fetch. If empty, return empty questionnaire.
   */
  getForm(questionnaireId: string) {
    if (!questionnaireId) {
      this.setQuestionnaire({status: 'draft', item: []});
    } else {
      this.dataSrv.getFormData(questionnaireId).subscribe((data) => {
        this.setQuestionnaire(data);
        this.acResult = null;
      });
    }
  }

  /**
   * Change button text based on context
   */
  createButtonLabel(): string {
    let ret = 'Create questions';
    if(this.questionnaire && this.questionnaire.item && this.questionnaire.item.length > 0) {
      ret = 'Edit questions'
    }
    return ret;
  }


  /**
   * Close menu handler.
   */
  newStart() {
    localStorage.clear();
    this.setQuestionnaire(this.createDefaultForm());
    this.setStep('home');
  }

  /**
   * Import FHIR server menu handler.
   */
  importFromFHIRServer() {
    this.modalService.open(FhirServersDlgComponent, {size: 'lg'}).result.then((result) => {
      if(result) { // Server picked, invoke search dialog.
        this.modalService.open(FhirSearchDlgComponent, {size: 'lg', scrollable: true}).result.then((selected) => {
          if(selected !== false) { // Questionnaire picked, get the item from the server.
            this.fhirService.read(selected).subscribe((resp)=>{
              this.setQuestionnaire(resp);
            });
          }
        });
      }
    }, (reason) => {
      console.error(reason);
    });
  }

  /**
   * Transform questionnaire model to FHIR compliant questionnaire in string format.
   *
   * The questionnaire, although mostly a FHIR questionnaire object, has some internal fields for processing.
   * Get a fully compliant FHIR questionnaire in string format.
   *
   * @param questionnaire - Questionnaire model is in the form builder.
   */
  toString(questionnaire: fhir.Questionnaire): string {
    return this.appJsonPipe.transform(questionnaire);
  }

}
