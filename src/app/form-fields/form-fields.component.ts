/**
 * Handles editing of form level fields.
 */
import {Component, OnInit, Input, OnDestroy, Output, EventEmitter} from '@angular/core';
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
                   (onChange)="notifyChange()"
          ></sf-form>
        </div>
        <hr/>
        <div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
            <button type="button" class="btn btn-sm btn-primary mt-4 mr-2" (click)="allFields()">Show advanced form fields</button>
            <button type="button" class="btn btn-sm btn-primary mt-4 mr-2 ml-auto" (click)="goToItemEditor()">{{ createButtonLabel() }}</button>
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
export class FormFieldsComponent implements OnInit {

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
  }

  /**
   * Merge schema and layout
   */
  ngOnInit() {
    // ngx-fl.schema.json is schema extracted from FHIR Questionnaire schema.
    this.http.get('/assets/ngx-fl.schema.json', { responseType: 'json' }).pipe(
      switchMap((schema: any) => this.http.get('/assets/fl-fields-layout.json', { responseType: 'json' }).pipe(
        map((layout: any) => {
          schema.layout = layout;
          return schema;
        })
      ))
    ).subscribe((schema) => {
      this.qlSchema = schema;
    });

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
  notifyChange() {
    this.questionnaireChange.emit(this.questionnaire);
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
    if(this.questionnaire.item.length === 0) {
      this.questionnaire.item.push({text: 'Item 0', linkId: null, type: 'string'});
    }
    this.setGuidingStep('item-editor');
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
}
