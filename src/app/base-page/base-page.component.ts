import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
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
import {AppJsonPipe} from '../lib/pipes/app-json.pipe';

@Component({
  selector: 'lfb-base-page',
  template: `
    <div class="page-defaults container bg-white">
      <lfb-header id="fixedTop" [isFirebaseEnabled]="false"></lfb-header>
      <div id="resizableMiddle">

        <nav class="navbar navbar-light bg-light" aria-label="Menu bar" *ngIf="guidingStep !== 'home'">
          <div class="btn-group-sm mr-2" ngbDropdown role="group" aria-label="Export menu">
            <button class="btn btn-sm btn-secondary" ngbDropdownToggle>
              Export
            </button>
            <div class="dropdown-menu" ngbDropdownMenu>
              <button ngbDropdownItem (click)="saveToFile()">Export to file ...</button>
              <button ngbDropdownItem>Create a new questionnaire on a FHIR server...</button>
              <button ngbDropdownItem>Update the questionnaire on the server</button>
            </div>
          </div>
          <div class="btn-group-sm mr-2" ngbDropdown role="group" aria-label="Import menu">
            <button class="btn btn-sm btn-secondary" ngbDropdownToggle>
              Import
            </button>
            <div class="dropdown-menu" ngbDropdownMenu>
              <button ngbDropdownItem (click)="fileInput.click()">Import from file...</button>
              <!-- <button ngbDropdownItem (click)="importLoinc()">Import a LOINC form...</button> -->
              <button ngbDropdownItem (click)="importFromFHIRServer()">Import from a FHIR server...</button>
              <div class="dropdown-divider"></div>
              <form class="px-4 py-3">
                <label>Import LOINC forms:</label>
                <input type="text"
                       placeholder="Search LOINC"
                       [(ngModel)]="acResult"
                       [ngModelOptions]="{standalone: true}"
                       [ngbTypeahead]="acSearch"
                       (selectItem)="getForm($event.item.id)"
                       [resultFormatter]="formatter"
                       [inputFormatter]="formatter"
                       [editable]='false' />
              </form>
            </div>
          </div>

          <div class="btn-group-sm mr-2" role="group" aria-label="Edit form attributes">
            <button type="button" class="btn btn-secondary"
                    (click)="setStep('fl-editor')" [attr.disabled]="guidingStep === 'fl-editor' ? '' : null">Edit form attributes</button>
          </div>
          <div class="btn-group-sm mr-2 ml-auto" role="group" aria-label="View Questionnaire JSON">
            <button type="button" class="btn btn-secondary"
                    (click)="viewQuestionnaire(showQuestionnaireJson)"
                    [attr.disabled]="guidingStep === 'qJSON' ? '' : null">View Questionnaire JSON</button>
          </div>
          <div class="btn-group-sm mr-2" role="group" aria-label="Close editor">
            <button type="button" class="btn btn-secondary " (click)="newStart()">Close</button>
          </div>
        </nav>
        <a target="_self" id="exportAnchor" class="d-none">Export</a>
        <input #fileInput class="d-none" type="file" (change)="onFileSelected($event)">

        <ng-container *ngIf="guidingStep === 'home'">
          <ng-container *ngTemplateOutlet="home"></ng-container>
        </ng-container>
        <ng-container *ngIf="guidingStep === 'fl-editor'">
          <ng-container *ngTemplateOutlet="formLevelFields"></ng-container>
        </ng-container>
        <ng-container *ngIf="guidingStep === 'item-editor'">
          <ng-container *ngTemplateOutlet="itemLevelFields"></ng-container>
        </ng-container>
      </div>
      <lfb-footer id="fixedBottom"></lfb-footer>
    </div>

    <ng-template #home>
      <div class="card-body container">
        <div>
          <p class="lead">How do you want to create your form?</p>
          <ul class="list-unstyled ml-5" ngbRadioGroup [(ngModel)]="startOption" >
            <li *ngIf="isAutoSaved()">
              <label ngbButtonLabel>
                <input ngbButton value="from_autosave" type="radio">
                Would you like to start from where you left off before?
              </label>
            </li>
            <li>
              <label ngbButtonLabel>
                <input ngbButton value="scratch" type="radio">
                Start from scratch
              </label>
            </li>
            <li>
              <label ngbButtonLabel>
                <input ngbButton value="existing" type="radio">
                Start with existing form
              </label>
              <ul *ngIf="startOption === 'existing'" class="list-unstyled ml-5"  ngbRadioGroup [(ngModel)]="importOption" >
                <li>
                  <label ngbButtonLabel>
                    <input ngbButton value="local" type="radio">
                    Import from local file
                  </label>
                </li>
                <li>
                  <label ngbButtonLabel>
                    <input ngbButton value="fhirServer" type="radio">
                    Import from FHIR server
                  </label>
                </li>
                <li>
                  <label ngbButtonLabel>
                    <input ngbButton value="loinc" type="radio">
                    Import from LOINC
                  </label>
                </li>
              </ul>
            </li>
          </ul>
          <hr>
          <div class="btn-toolbar float-right mb-2" role="toolbar" aria-label="Toolbar with button groups">
            <div class="btn-group" role="group" aria-label="Last group">
              <button type="button" class="btn-sm btn-primary" (click)="onContinue()">Continue</button>
            </div>
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #formLevelFields>
      <lfb-form-fields (state)="setStep($event)"
                       [questionnaire]="formFields"
                       (questionnaireChange)="formFieldsChanged($event)"
                       [questionsButtonLabel]="createButtonLabel()"
      ></lfb-form-fields>
    </ng-template>

    <ng-template #itemLevelFields>
      <button type="button"
              class="ml-2 font-weight-bold btn btn-link"
              (click)="setStep('fl-editor')"
      >{{questionnaire.title}}</button>
      <lfb-item-component [questionnaire]="questionnaire"
                          (itemChange)="itemComponentChanged($event)"
      ></lfb-item-component>
    </ng-template>

    <ng-template #showQuestionnaireJson  let-modal>
      <div class="modal-header btn-primary">
        <h4 class="modal-title" id="modal-basic-title">FHIR Questionnaire JSON</h4>
        <button type="button" class="close btn-primary text-white" aria-label="Close" (click)="modal.close('Cross click')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <pre>{{ questionnaire | appJson }}</pre>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" (click)="modal.close('Close click')">Close</button>
      </div>
    </ng-template>

  `,
  styles: [`
    .page-defaults {

    }

    #fixedTop {
      /* position:absolute; */
      top:0;
      left:0;
      height:84px;
      right:0;
      overflow:hidden;
    }

    #fixedBottom {
     /* position:absolute; */
      bottom:0;
      height:65px;
      left:0;
      right:0;
      overflow:hidden;
    }

    #resizableMiddle {
     /* position:absolute; */
      top:84px;
      bottom:65px;
      left:0;
      right:0;
      overflow:auto;
    }

    .radio-group {
      border: lightgray 1px solid;
      vertical-align: center;
      margin: 5px 0 5px 0;
    }
    .radio-button {
      margin: 5px;
    }
  `]
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
  formSubject: Subject<fhir.Questionnaire>;
  initialForm: fhir.Questionnaire;
  @Output()
  state = new EventEmitter<string>();
  objectUrl: any;
  acResult: AutoCompleteResult = null;


  constructor(private formService: FormService,
              private modal: NgbModal,
              private dataSrv: FetchService,
              private fhirService: FhirService,
              private appJsonPipe: AppJsonPipe) {
    this.initialForm = this.createDefaultForm();
    const isAutoSaved = this.formService.isAutoSaved();
    if(isAutoSaved) {
      this.startOption = 'from_autosave';
      this.initialForm = formService.autoLoadForm();
    }
    this.formSubject = new Subject<fhir.Questionnaire>();
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
    Object.assign(this.questionnaire, event);
    this.notifyChange(this.questionnaire);
  }


  /**
   * Handle value changes in item-component.
   * @param event - Emits questionnaire (with items). Form level fields should be untouched.
   */
  itemComponentChanged(event) {
    this.notifyChange(this.questionnaire);
  }


  /**
   * Set questionnaire.
   * Make
   * @param questionnaire - Input FHIR questionnaire
   */
  setQuestionnaire(questionnaire) {
    this.questionnaire = questionnaire;
    this.formFields = Object.assign({}, questionnaire);
    delete this.formFields.item;
    this.notifyChange(this.questionnaire);
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
    const selectedFile = event.target.files[0];
    event.target.value = null; //
    const fileReader = new FileReader();
    fileReader.readAsText(selectedFile, 'UTF-8');
    fileReader.onload = () => {
      try {
        this.setQuestionnaire(this.formService.parseQuestionnaire(fileReader.result as string))
      }
      catch (e) {
        this.showError(e);
      }
    }
    fileReader.onerror = (error) => {
      this.showError('Error occurred reading file: ${selectedFile.name}');
    }
  }

  showError(error: any) {
    this.formService.showMessage('Error', error.message || error, MessageType.DANGER);
  }

  /**
   * View full Questionnaire json
   */
  viewQuestionnaire(dialogTemplateRef) {
    this.modal.open(dialogTemplateRef, {scrollable: true, centered: true, size: 'xl'});
    // this.guidingStep = 'qJSON';
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
    this.modal.open(FhirServersDlgComponent, {size: 'lg'}).result.then((result) => {
      if(result) { // Server picked, invoke search dialog.
        this.modal.open(FhirSearchDlgComponent, {size: 'lg', scrollable: true}).result.then((selected) => {
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
