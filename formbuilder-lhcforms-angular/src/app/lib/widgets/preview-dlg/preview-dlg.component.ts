import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import fhir from 'fhir/r4';
import {FHIRServer, FhirService} from '../../../services/fhir.service';
import {FormService} from '../../../services/form.service';
import {FHIR_VERSIONS, FHIR_VERSION_TYPE, Util} from "../../util";
import {fhirPrimitives} from "../../../fhir";
import {CodemirrorComponent} from "@ctrl/ngx-codemirror";
import {
  BehaviorSubject,
  merge,
  Observable,
  Subject,
  Subscription
} from "rxjs";
import {debounceTime, distinctUntilChanged, filter, map} from "rxjs/operators";
import {NgbAccordionItem, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {faCopy} from '@fortawesome/free-regular-svg-icons';
declare var LForms: any;

/**
 * Define data structure for dialog
 */
export interface PreviewData {
  questionnaire: fhir.Questionnaire;
  lfData?: any;
}

@Component({
  standalone: false,
  selector: 'lfb-preview-dlg',
  templateUrl: './preview-dlg.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./preview-dlg.component.css']
})
export class PreviewDlgComponent implements OnInit, OnDestroy {

  @ViewChild('lhcForm', {read: ElementRef}) wcForm: ElementRef;
  @ViewChild('dlgContent', {static: false, read: ElementRef}) dlgContent: ElementRef;
  format: FHIR_VERSION_TYPE = 'R4'; // Current default for preview.
  activeTopLevelTabIndex = 0;
  activeJsonTabIndex: 0|1|2 = FHIR_VERSIONS.R4;
  lformsErrors: string;
  inputUrlErrors: string;
  validationErrors: {FHIR_VERSION_TYPE?: string[]} = {};
  vServer: fhirPrimitives.url;
  spinner$ = new BehaviorSubject<boolean>(false);
  @ViewChild('autoCompNgb', { static: false, read: NgbTypeahead }) autoCompNgb: NgbTypeahead;
  @ViewChild('errorsItem', { static: false, read: NgbAccordionItem }) errorsItem: NgbAccordionItem;
  showNoErrorsMsg = false;
  codeMirrorModel: string = '';

  fhirValidationMsg = "Select the 'View/Validate Questionnaire JSON' tab to access a feature that validates your Questionnaire against a supplied FHIR server, offering more detailed error insights.";

  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  /**
   * Search function for url input.
   * @param text$ - Observable of text from user input.
   */
  search = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.autoCompNgb.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term) => {
        term = term?.trim();
        return this.filterServers(this.fhirService.validationServers, this.format, term).map((s) => {
          return s.endpoint;
        });
      }),
    );
  };

  /**
   * Filter server list based on version and matching text.
   *
   * @param serverList - Set of FHIRServer objects.
   * @param version - R4|STU3 etc.
   * @param term - Text to match
   */
  filterServers = (serverList: Set<FHIRServer>, version: string, term: string) => {
    return Array.from(serverList.values()).filter((server) => {
      let yes = server.version === version;
      return yes && term ? term.trim().toLowerCase().indexOf(server.endpoint.toLowerCase()) > -1 : yes;
    });
  }

  subscriptions: Subscription[] = [];

  constructor(
    public formService: FormService,
    private fhirService: FhirService,
    public dialogRef: MatDialogRef<PreviewDlgComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewData,
  ) {
    LForms.Util.setFHIRContext(this.fhirService.getSmartClient());
  }

  ngOnInit() {
    this.activeTopLevelTabIndex = 0;
    this.activeJsonTabIndex = FHIR_VERSIONS.R4;
    this.onJsonVersionSelected(this.activeJsonTabIndex);
  }

  close() {
    this.dialogRef.close();
  }

  /**
   * Update format and server based on version tab selected.
   * @param ngEvent - Angular event
   */
  onJsonVersionSelected(ngEvent: 0|1|2) {
    this.format = FHIR_VERSIONS[ngEvent] as FHIR_VERSION_TYPE;
    this.vServer = this.fhirService.getLastUsedValidationServer(this.format);
    this.codeMirrorModel = JSON.stringify(this.getQuestionnaire(this.format), null, 2);
  }

  /**
   * Access different versions of questionnaire.
   * @param version - 'STU3' | 'R4' and other defined version types in LForms.
   */
  getQuestionnaire(version = 'R5') {
    return this.formService.convertFromR5(this.data.questionnaire, version);
  }

  /**
   * Handle errors from <wc-lhc-form>
   * @param event - event object emitted by wc-lhc-form.
   */
  handleLFormsError(event) {
    this.lformsErrors = event.detail;
  }

  /**
   * Run validations and set UI elements on response.
   * @param format - R4|STU3
   * @param rawInput - Url from the input box.
   */
  runValidations(format: string, rawInput: fhirPrimitives.url) {
    const url = Util.extractBaseUrl(rawInput);
    if(!url) {
      this.validationErrors[format] = [`You entered an invalid URL: ${rawInput}`];
      return;
    }

    const urlObj = new URL(rawInput);
    this.spinner$.next(true);
    this.fhirService.runValidations(this.format, urlObj, this.getQuestionnaire(format), )
      .subscribe({
        next: (errorList: string[]) => {
          this.validationErrors[this.format] = errorList;
        },
        error: (error) => {
          this.validationErrors[this.format] = [error.message];
        },
        complete: () => {
          this.spinner$.next(false);
          this.errorsItem?.expand();
          this.showNoErrorsMsg = !this.validationErrors[this.format].length;
        }
      });
  }

  /**
   * Set the height on loading event of the code mirror. The default height 300
   * which is not acceptable. Setting it to auto has performance implications.
   * Set the based on approximate height.
   *
   * @param cm - CodemirrorComponent (angular event).
   */
  codeMirrorLoaded(cm: CodemirrorComponent) {
    const height = this.calculateJSONElementHeight();
    if(height > 0) {
      cm.codeMirror.setSize(null, height);
    }
  }

  /**
   * JSON is the last item in the dialog content box is exclusive of header and footer.
   * Subtract heights of all the boxes above and padding below.

   * Approximate offset from the top of the dialog content is 160:
   * 48 each for two tab headers, plus 39 for menu bar, plus 20 for padding from the bottom,
   * plus 5 for various lines and extra.
   */
  calculateJSONElementHeight() {
    return this.dlgContent ? this.dlgContent.nativeElement.offsetHeight - 160 : 0;
  }

  /**
   * Clean up subscriptions.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription?.unsubscribe();
    })
  }

  protected readonly faCopy = faCopy;
}
