import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {ObjectWidget} from '@lhncbc/ngx-schema-form';
import {FormService} from '../../../services/form.service';
import fhir from 'fhir/r4';
import {debounceTime, distinctUntilChanged, startWith, Subscription} from 'rxjs';
import {AutoCompleteOptions} from '../auto-complete/auto-complete.component';
import { ExtensionsService } from 'src/app/services/extensions.service';
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import { TableService, TableStatus } from 'src/app/services/table.service';
declare var LForms: any;

@Component({
  standalone: false,  
  selector: 'lfb-answer-value-set-coding-display',
  templateUrl: './answer-value-set-coding-display.component.html'
})
export class AnswerValueSetCodingDisplayComponent extends ObjectWidget implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('codingDisplay') codingDisplay: ElementRef;
  
  subscriptions: Subscription [] = [];
  answerOptions: any[] = [];
  _fhir = LForms.FHIR["R4"];
  sdc = this._fhir.SDC;
  
  protected readonly warningIcon = faExclamationTriangle;
  errors: {code: string, originalMessage: string, modifiedMessage: string} [] = null;
  errorIcon = faExclamationTriangle;

  acOptions: AutoCompleteOptions = {
    acOptions: {
      matchListValue: false,
      maxSelect: 1,
      suggestionMode: LForms.Def.Autocompleter.NO_COMPLETION_SUGGESTIONS,
      autocomp: true,
      showListOnFocusIfEmpty: false,
      sort: false
    },
    fhirOptions: {
      fhirServer: null,
      valueSetUri: null,
      operation: '$expand',
      count: 10
    }
  }
  model: fhir.Coding;
  extensionsService = inject(ExtensionsService);

  answerValueSet;
  extension = null;
  tableService = inject(TableService);
  answerValuseSetConfigErrorMessage: string;
  autoComplete = false;

  dataType = 'string';
  answerMethod = 'answer-option';

  /**
   * Invoke super constructor.
   *
   * @param formService - Inject form service
   */
  constructor(private formService: FormService, private cdr: ChangeDetectorRef, private renderer: Renderer2) {
    super();
  }

  ngOnInit() {
    const initValue = this.formProperty.parent.value;
    if(initValue) {
      this.model = initValue;
    }
    this.dataType = this.formProperty.findRoot().getProperty('type').value;

    this.init(true);
  }

  /**
   * Component initialization.
   */
  ngAfterViewInit(): void {
    super.ngAfterViewInit();

    let sub = this.formProperty.findRoot().getProperty("answerValueSet").valueChanges.subscribe((avs) => {
      const changed = this.answerValueSet !== avs;
      if (changed) {
        this.answerValueSet = avs;
        this.init(false);
      }
    });
    this.subscriptions.push(sub);

    
    sub = this.formProperty.searchProperty('/__$answerOptionMethods').valueChanges.subscribe((method) => {
      this.answerMethod = method;
      this.init(false);
    })
    this.subscriptions.push(sub);

    sub = this.formProperty.findRoot().getProperty("type").valueChanges.subscribe((type) => {
      this.dataType = type;
      this.init(false);
    });
    this.subscriptions.push(sub);

    sub = this.extensionsService.extensionsObservable
              .pipe(
                startWith(''),
                debounceTime(100),
                distinctUntilChanged()
              )
    .subscribe((extensions) => {
      const linkId = this.formProperty.findRoot().getProperty('linkId').value;
      const sourceNode = this.formService.getTreeNodeByLinkId(linkId);
      const extension = this.formService.getPreferredTerminologyServer(sourceNode);

      const changed = this.extension !== extension;
      if (changed) {
        this.extension = extension;
        this.init(false);
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Initialize the auto-complete widget
   */
  init(firstChange: boolean) {
    this.answerOptions = [];

    if (this.dataType === 'coding' && (this.answerMethod === 'snomed-value-set' || this.answerMethod === 'value-set')) {
      const linkId = this.formProperty.findRoot().getProperty('linkId').value;
      const sourceNode = this.formService.getTreeNodeByLinkId(linkId);
      const answerValueSetUri = this.formProperty.findRoot().getProperty("answerValueSet").value;
      const fhirServer = this.formService.getPreferredTerminologyServer(sourceNode);

      if (answerValueSetUri && fhirServer) {
        this.autoComplete = true;
        if(firstChange) {
          this.acOptions.fhirOptions.valueSetUri = decodeURI(answerValueSetUri);
          this.acOptions.fhirOptions.fhirServer = this.formService.getPreferredTerminologyServer(sourceNode);
        } else {
          const updatedFhirOptions = {
            fhirServer: fhirServer,
            valueSetUri: (answerValueSetUri) ? decodeURI(answerValueSetUri) : null,
            operation: '$expand',
            count: 10
          };
          this.acOptions = { ...this.acOptions, acOptions: this.acOptions.acOptions, fhirOptions: updatedFhirOptions};
        }

        this.tableService.setTableStatusChanged(null);  
      } else {
        this.autoComplete = false;
        if (!fhirServer) {
          this.answerValuseSetConfigErrorMessage = 'Preferred terminology server is not set.';
        } else if (!answerValueSetUri) {
          const answerMethod = this.formProperty.searchProperty('/__$answerOptionMethods').value;

          if (answerMethod === 'snomed-value-set') {
            this.answerValuseSetConfigErrorMessage = 'SNOMED CT answer value set is not set.';
          } else if (answerMethod === 'value-set') {
            this.answerValuseSetConfigErrorMessage = 'Answer value set is not set.';
          }
        }
        this.answerValuseSetConfigErrorMessage += ' The lookup feature will not be available. Initial values can still be manually typed in.';

        const status: TableStatus = {
          type: 'warning',
          message: this.answerValuseSetConfigErrorMessage
        };
        this.tableService.setTableStatusChanged(status);  
      }
    } else {
      this.tableService.setTableStatusChanged(null);
    }
  }

  /**
   * Handle model change event in <select> tag.
   * @param coding - Option value
   */
  modelChanged(coding: fhir.Coding) {
    this.model = coding || {};

    if (this.formProperty?.parent) {
      this.formProperty.parent.reset(coding, false);
    }
  }

  /**
   * Handle field change event in <input> tag.
   * @param coding - Option value
   */
  fieldChanged(display: string) {
    const coding = this.formProperty.parent.value;

    coding['display'] = display;

    if (this.formProperty?.parent) {
      this.formProperty.parent.reset(coding, false);
    }
  }

  /**
   * Lifecycle hook that is called when the component is about to be destroyed.
   * This function iterates over all subscriptions and unsubscribes from each one
   * to prevent memory leaks.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub?.unsubscribe();
    })
  }

}



