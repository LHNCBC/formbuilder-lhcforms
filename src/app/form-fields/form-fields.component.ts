/**
 * Handles editing of form level fields.
 */
import {
  Component,
  OnInit,
  Input,
  OnDestroy,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  AfterViewInit
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ShareObjectService} from '../share-object.service';
import {FetchService} from '../fetch.service';
import {debounceTime, distinctUntilChanged, map, switchMap, takeUntil} from 'rxjs/operators';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {AutoCompleteResult} from '../lib/widgets/auto-complete/auto-complete.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormService} from '../services/form.service';
import { fhir } from '../fhir';
import {MessageType} from '../lib/widgets/message-dlg/message-dlg.component';
import {Util} from '../lib/util';

@Component({
  selector: 'lfb-form-fields',
  template: `
    <div class="card-body content">
      <div  *ngIf="true">
        <h4 class="ml-2">Form level attributes</h4>
        <p class="ml-4">Enter basic information about the form.</p>
        <hr/>
        <div class="container">
          <sf-form [schema]="qlSchema"
                   [(model)]="questionnaire"
                   (onChange)="valueChanged($event)"
          ></sf-form>
        </div>
        <hr/>
        <div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
            <button type="button" class="btn btn-sm btn-primary mt-4 mr-2" (click)="allFields()">Show advanced form fields</button>
            <button type="button" class="btn btn-sm btn-primary mt-4 mr-2 ml-auto" (click)="goToItemEditor()">{{ questionsButtonLabel }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .content {
      padding: 0.5rem;
    }
  `]
})
export class FormFieldsComponent implements OnInit, AfterViewInit, OnChanges {

  @Input()
  questionsButtonLabel = 'Create questions';
  @Input()
  questionnaire: fhir.Questionnaire;
  qlSchema: any = {properties: {}}; // Combines questionnaire schema with layout schema.
  notHidden = true;
  acResult: AutoCompleteResult = null;

  objectUrl: any;

  @Output()
  state = new EventEmitter<string>();
  @Output()
  questionnaireChange = new EventEmitter<fhir.Questionnaire>();

  constructor(
    private http: HttpClient,
    private modelService: ShareObjectService,
    private dataSrv: FetchService,
    private modal: NgbModal,
    private formService: FormService
  ) {
    this.qlSchema = this.formService.getFormLevelSchema();
  }

  /**
   * Merge schema and layout
   */
  ngOnInit() {
    // this.modelService.questionnaire = this.questionnaire;
  }

  ngAfterViewInit() {
    this.modelService.questionnaire = this.questionnaire;
  }

  ngOnChanges(changes: SimpleChanges) {
    const qChange = changes.questionnaire;
    if(qChange) {
      this.modelService.questionnaire = qChange.currentValue;
    }
  }

  /**
   * Send message to base page to switch the view.
   */
  setGuidingStep(step: string) {
    this.formService.setGuidingStep(step);
    this.formService.autoSave('state', step); // Record change of state.
  }

  /**
   * Emit the change event.
   */
  valueChanged(event) {
    this.questionnaireChange.emit(Util.pruneEmptyValues(event.value));
  }


  /**
   * Json formatting
   * @param json - JSON object
   */
  stringify(json): string {
    return JSON.stringify(json, null, 2);
  }


  /**
   * TODO
   */
  allFields() {
  }


  /**
   * Button handler for edit questions
   */
  goToItemEditor(): void {
    this.setGuidingStep('item-editor');
  }
}
