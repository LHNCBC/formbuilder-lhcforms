import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import fhir from 'fhir/r4';
import {FHIRServer, FhirService} from '../../../services/fhir.service';
import {FormService} from '../../../services/form.service';
import {FHIR_VERSIONS, FHIR_VERSION_TYPE, Util} from "../../util";
import {fhirPrimitives} from "../../../fhir";
import {CodemirrorModule, CodemirrorComponent} from "@ctrl/ngx-codemirror";
import {
  BehaviorSubject,
  merge,
  Observable,
  Subject,
  Subscription
} from "rxjs";
import {debounceTime, distinctUntilChanged, filter, map} from "rxjs/operators";
import {NgbAccordionItem, NgbAccordionModule, NgbAlertModule, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {faCopy} from '@fortawesome/free-regular-svg-icons';
import {faDownload} from '@fortawesome/free-solid-svg-icons';
import {MatIconModule} from "@angular/material/icon";
import {MatTabsModule} from "@angular/material/tabs";
import {AsyncPipe, CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {ClipboardModule} from "@angular/cdk/clipboard";
import {LfbSpinnerComponent} from "../lfb-spinner/lfb-spinner.component";
import {MatButtonModule} from "@angular/material/button";
import {SubjectTypeService} from "../../../services/subject-type.service";
import {
  ContainedResourceService,
  ContainedResourceVersionRecord
} from '../../../services/contained-resource.service';
import {EXTENSION_URL_TEMPLATE_EXTRACT} from '../../constants/constants';
declare var LForms: any;

/**
 * Define data structure for dialog
 */
export interface PreviewData {
  questionnaire: fhir.Questionnaire;
  lfData?: any;
  containedResourceVersionRecords?: ContainedResourceVersionRecord[];
}

type NoErrorsMap = {
  [key in FHIR_VERSION_TYPE]: boolean;
};

@Component({
  selector: 'lfb-preview-dlg',
  templateUrl: './preview-dlg.component.html',
  imports: [
    CodemirrorModule,
    CommonModule,
    FontAwesomeModule,
    NgbTypeahead,
    NgbAccordionModule,
    NgbAlertModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTabsModule,
    AsyncPipe,
    FormsModule,
    ClipboardModule,
    LfbSpinnerComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./preview-dlg.component.css']
})
export class PreviewDlgComponent implements OnInit, OnDestroy {
  formService = inject(FormService);
  private fhirService = inject(FhirService);
  private subjectTypeService = inject(SubjectTypeService);
  private containedResourceService = inject(ContainedResourceService);
  dialogRef = inject<MatDialogRef<PreviewDlgComponent>>(MatDialogRef);
  data = inject<PreviewData>(MAT_DIALOG_DATA);


  @ViewChild('lhcForm', {read: ElementRef}) wcForm: ElementRef;
  @ViewChild('extractionFormContainer', {read: ElementRef}) extractionFormContainer: ElementRef<HTMLElement>;
  @ViewChild('dlgContent', {static: false, read: ElementRef}) dlgContent: ElementRef;
  format: FHIR_VERSION_TYPE = 'R4'; // Current default for preview.
  activeTopLevelTabIndex = 0;
  activeJsonTabIndex: number = FHIR_VERSIONS.R4;
  readonly extractionFHIRVersion = 'R5';
  formReady = false;
  extractionInProgress = false;
  hasTemplateExtraction = false;
  extractionStatus = 'Waiting for the rendered form to be ready.';
  extractionError = '';
  extractionUnavailable = '';
  extractionNotice = '';
  extractedResourcesJSON = '';
  questionnaireResponseJSON = '';
  private extractionTimer: ReturnType<typeof setTimeout>;
  private downloadObjectUrl: string;
  lformsErrors: string;
  inputUrlErrors: string;
  validationErrors: {FHIR_VERSION_TYPE?: string[]} = {};
  compatibilityWarnings: {[key: string]: string} = {};
  conversionErrors: {[key: string]: string} = {};
  vServer: fhirPrimitives.url;
  spinner$ = new BehaviorSubject<boolean>(false);
  @ViewChild('autoCompNgb', { static: false, read: NgbTypeahead }) autoCompNgb: NgbTypeahead;
  @ViewChild('errorsItem', { static: false, read: NgbAccordionItem }) errorsItem: NgbAccordionItem;
  showNoErrorsMsg: NoErrorsMap = {
    R4: false,
    R5: false,
    STU3: false
  };

  codeMirrorModel: string = '';

  fhirValidationMsg =
    "Select the 'Validate Questionnaire JSON' tab to access a feature that validates your " +
    "Questionnaire against a supplied FHIR server, offering more detailed error insights.";

  // linkIds of items that use an external answerValueSet but have no preferred terminology
  // server in scope. The preview renders answer lists using a default terminology server,
  // but that default is not part of the questionnaire output.
  missingTerminologyServerLinkIds: string [] = [];

  // Warning shown in the rendered-form tab, built in ngOnInit to include the affected linkIds.
  preferredTerminologyServerMsg = '';
  renderedFormCompatibilityWarning = '';

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

  constructor() {
    LForms.Util.setFHIRContext(this.fhirService.getSmartClient());
  }

  /**
   * Initialize the tabs and build the warnings shown on the rendered-form tab:
   * missing preferred terminology servers and contained resources that may not be
   * compatible with R5. Then select the default JSON version tab.
   */
  ngOnInit() {
    this.activeTopLevelTabIndex = 0;
    this.activeJsonTabIndex = FHIR_VERSIONS.R4;
    this.hasTemplateExtraction = this.hasExtractionTemplate(this.data.questionnaire);
    this.missingTerminologyServerLinkIds = Util.getItemsMissingPreferredTerminologyServer(this.data.questionnaire);
    this.preferredTerminologyServerMsg = this.buildPreferredTerminologyServerMsg(this.missingTerminologyServerLinkIds);
    this.renderedFormCompatibilityWarning = this.containedResourceService.getCompatibilityWarning(
      this.data.containedResourceVersionRecords,
      'R5'
    );
    this.onJsonVersionSelected(this.activeJsonTabIndex);
  }

  /**
   * Build the warning about items that use an answer value set without a preferred terminology
   * server in scope, naming the affected items by linkId.
   * @param linkIds - linkIds of the affected items.
   * @return Warning message text, or an empty string when there are no affected items.
   */
  private buildPreferredTerminologyServerMsg(linkIds: string []): string {
    if(!linkIds.length) {
      return '';
    }
    const formatted = linkIds.map((linkId) => `'${linkId}'`).join(', ');
    return "This questionnaire uses an answer value set but does not specify a preferred " +
      "terminology server for the following item(s): " + formatted + ". Answer lists in this " +
      "preview are loaded using a default terminology server (" + this.fhirService.getFhirServer().endpoint +
      "), but that server is not saved in the questionnaire. To make sure answer value sets can be expanded " +
      "wherever the questionnaire is used, set a terminology server in the form-level or item-level " +
      "'Advanced fields'.";
  }

  close() {
    this.dialogRef.close();
  }

  /**
   * Update format and server based on version tab selected, and build the JSON and the
   * combined subjectType and contained-resource compatibility warnings for that version.
   * @param ngEvent - Index of the selected version tab (an FHIR_VERSIONS value).
   */
  onJsonVersionSelected(ngEvent: number) {
    this.format = FHIR_VERSIONS[ngEvent] as FHIR_VERSION_TYPE;
    this.vServer = this.fhirService.getLastUsedValidationServer(this.format);
    const conversionError = this.formService.getQuantityComparatorCompatibilityError(
      this.data.questionnaire,
      this.format
    );
    this.conversionErrors[this.format] = conversionError;
    this.codeMirrorModel = conversionError
      ? ''
      : JSON.stringify(this.getQuestionnaire(this.format), null, 2);
    this.compatibilityWarnings[this.format] = this.combineCompatibilityWarnings([
      this.subjectTypeService.getSubjectTypeCompatibilityWarning(this.data.questionnaire, this.format, 'preview'),
      this.containedResourceService.getCompatibilityWarning(this.data.containedResourceVersionRecords, this.format)
    ]);
  }

  /**
   * Combine independently produced compatibility warnings for one preview format.
   *
   * @param warnings - Warning HTML fragments, including optional empty values.
   * @returns Combined warning HTML.
   */
  private combineCompatibilityWarnings(warnings: Array<string | null | undefined>): string {
    return warnings.filter(Boolean).join('<hr>');
  }

  /**
   * Access different versions of questionnaire.
   * @param version - 'STU3' | 'R4' and other defined version types in LForms.
   */
  getQuestionnaire(version = 'R5') {
    return this.formService.convertFromR5(this.data.questionnaire, version);
  }

  /**
   * Handle errors from <wc-lhc-form> and discard unavailable extraction snapshots.
   * @param event - Event object emitted by wc-lhc-form.
   */
  handleLFormsError(event) {
    this.lformsErrors = event.detail;
    this.formReady = false;
    clearTimeout(this.extractionTimer);
    this.extractionInProgress = false;
    this.extractedResourcesJSON = '';
    this.questionnaireResponseJSON = '';
    this.extractionError = `The rendered form is unavailable: ${event.detail}`;
    this.extractionStatus = 'Extraction is unavailable.';
  }

  /** Return the JSON snapshot selected in the extraction preview. */
  get extractionJSON(): string {
    return this.activeTopLevelTabIndex === 2 ? this.extractedResourcesJSON : this.questionnaireResponseJSON;
  }

  /** Return the accessible name of the selected extraction snapshot. */
  get extractionViewLabel(): string {
    return this.activeTopLevelTabIndex === 2 ? 'extracted resources' : 'QuestionnaireResponse';
  }

  /** Return whether either of the paired extraction snapshot tabs is selected. */
  get isExtractionTabSelected(): boolean {
    return this.activeTopLevelTabIndex === 1 || this.activeTopLevelTabIndex === 2;
  }

  /**
   * Look for template extraction on the questionnaire or any nested item.
   * @param scope - Questionnaire or item whose extensions and children should be inspected.
   * @returns Whether a template extraction setting exists in this scope or its descendants.
   */
  private hasExtractionTemplate(scope: fhir.Questionnaire | fhir.QuestionnaireItem): boolean {
    return !!scope && (!!scope.extension?.some(extension =>
      extension.url === EXTENSION_URL_TEMPLATE_EXTRACT ||
      extension.url === `${EXTENSION_URL_TEMPLATE_EXTRACT}Bundle`
    ) || !!scope.item?.some(item => this.hasExtractionTemplate(item)));
  }

  /**
   * Refresh both snapshots when entering from a non-extraction tab. Switching between
   * the response and resources keeps the pair intact, including generated references.
   * @param index - Selected top-level tab index.
   */
  onPreviewTabSelected(index: number): void {
    const wasExtractionTabSelected = this.isExtractionTabSelected;
    this.activeTopLevelTabIndex = index;
    if(this.isExtractionTabSelected && !wasExtractionTabSelected) {
      this.refreshExtraction();
    }
  }

  /** Allow extraction only after the widget has finished its initial processing and rendering. */
  handleFormReady(): void {
    this.formReady = true;
    this.lformsErrors = '';
    if(this.isExtractionTabSelected) {
      this.refreshExtraction();
    }
  }

  /** Mark an existing snapshot stale without running extraction on every input change. */
  handleFormChange(): void {
    if(this.questionnaireResponseJSON && !this.extractionInProgress) {
      this.extractionStatus = 'Form answers changed. Return from Rendered Form to update both snapshots.';
    }
  }

  /** Schedule extraction after allowing the busy state and pending input changes to render. */
  refreshExtraction(): void {
    if(!this.formReady || this.extractionInProgress) {
      return;
    }
    this.extractionInProgress = true;
    this.extractionStatus = 'Generating extraction preview...';
    this.extractionError = '';
    this.extractionUnavailable = '';
    this.extractionNotice = '';
    this.extractedResourcesJSON = '';
    this.questionnaireResponseJSON = '';
    this.extractionTimer = setTimeout(() => this.generateExtraction(), 0);
  }

  /**
   * Export one response and its extracted resources from the preserved widget.
   * Older runtimes can still export a response, but must not silently omit templates.
   */
  private generateExtraction(): void {
    const container = this.extractionFormContainer?.nativeElement;
    try {
      if(!container || typeof LForms.Util.getFormFHIRData !== 'function') {
        throw new Error('The LForms response export API is unavailable.');
      }
      const version = this.formService.lformsVersion || '';
      const match = /^(\d+)\.(\d+)\./.exec(version);
      const supportsTemplates = match && (+match[1] > 38 || (+match[1] === 38 && +match[2] >= 7));
      if(!supportsTemplates) {
        this.extractionUnavailable = `Template extraction requires LForms 38.7.0 or later. Loaded version: ${version || 'unknown'}. Only the QuestionnaireResponse is available.`;
      }

      const result = LForms.Util.getFormFHIRData(
        'QuestionnaireResponse', this.extractionFHIRVersion,
        container, {extract: !!supportsTemplates}
      );
      const resources = Array.isArray(result) ? result : [result];
      const response = resources[0];
      if(response?.resourceType !== 'QuestionnaireResponse') {
        throw new Error('LForms did not return a QuestionnaireResponse.');
      }
      this.questionnaireResponseJSON = JSON.stringify(response, null, 2);
      const extracted = resources.slice(1);
      if(extracted.some(resource => !resource?.resourceType)) {
        throw new Error('LForms returned an unexpected extraction result.');
      }
      if(extracted.length) {
        // Older versions can return standalone Observations alongside the template Bundle.
        this.extractedResourcesJSON = JSON.stringify(extracted.length === 1 ? extracted[0] : extracted, null, 2);
        // The JSON itself shows success; keep the live status region empty.
        this.extractionStatus = '';
      }
      else if(supportsTemplates) {
        this.extractionNotice = 'Extraction completed; no resources were produced.';
        this.extractionStatus = this.extractionNotice;
      }
      else {
        this.extractionStatus = 'QuestionnaireResponse updated; template extraction is unavailable.';
      }
    }
    catch(error) {
      this.extractedResourcesJSON = '';
      this.extractionError = error instanceof Error ? error.message : String(error);
      this.extractionStatus = 'Extraction failed. Review the error details and correct the form or extraction settings.';
      // Extraction can throw before returning its response. Export a separate diagnostic
      // snapshot, explicitly labelled so it cannot be mistaken for successful engine input.
      if(!this.questionnaireResponseJSON && container && typeof LForms.Util.getFormFHIRData === 'function') {
        try {
          const response = LForms.Util.getFormFHIRData(
            'QuestionnaireResponse', this.extractionFHIRVersion, container
          );
          if(response?.resourceType !== 'QuestionnaireResponse') {
            throw new Error('LForms did not return a QuestionnaireResponse.');
          }
          this.questionnaireResponseJSON = JSON.stringify(response, null, 2);
          this.extractionNotice = 'The QuestionnaireResponse was exported separately for debugging after extraction failed; generated IDs may differ.';
        }
        catch(responseError) {
          this.extractionError += ` Response export also failed: ${responseError instanceof Error ? responseError.message : String(responseError)}`;
        }
      }
    }
    finally {
      this.extractionInProgress = false;
    }
  }

  /** Download the selected snapshot without submitting it to a FHIR server. */
  downloadExtractionJSON(): void {
    if(!this.extractionJSON || this.extractionInProgress) {
      return;
    }
    try {
      if(this.downloadObjectUrl) {
        URL.revokeObjectURL(this.downloadObjectUrl);
      }
      this.downloadObjectUrl = URL.createObjectURL(new Blob([this.extractionJSON], {type: 'application/json;charset=utf-8'}));
      const anchor = document.createElement('a');
      anchor.href = this.downloadObjectUrl;
      anchor.download = `${this.activeTopLevelTabIndex === 2 ? 'extracted-resources' : 'questionnaire-response'}.${this.extractionFHIRVersion}.json`;
      anchor.dispatchEvent(new MouseEvent('click'));
    }
    catch(error) {
      this.extractionError = `Download failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Announce clipboard results, including failures rather than silently ignoring them.
   * @param copied - Whether the browser accepted the clipboard write.
   */
  onExtractionCopied(copied: boolean): void {
    this.extractionStatus = copied ? `Copied ${this.extractionViewLabel} JSON.` : 'Copy failed. Try Download JSON instead.';
  }

  /**
   * Run validations and set UI elements on response.
   * @param format - R4|STU3
   * @param rawInput - Url from the input box.
   */
  runValidations(format: FHIR_VERSION_TYPE, rawInput: fhirPrimitives.url) {
    const url = Util.extractBaseUrl(rawInput);
    if(!url) {
      this.validationErrors[format] = [`You entered an invalid URL: ${rawInput}`];
      return;
    }

    this.showNoErrorsMsg[format] = false;
    const urlObj = new URL(rawInput);
    this.spinner$.next(true);
    this.fhirService.runValidations(format, urlObj, this.getQuestionnaire(format))
      .subscribe({
        next: (errorList: string[]) => {
          this.validationErrors[format] = errorList;
        },
        error: (error) => {
          this.validationErrors[format] = [error.message];
        },
        complete: () => {
          this.spinner$.next(false);
          this.errorsItem?.expand();
          this.showNoErrorsMsg[format] = !this.validationErrors[format].length;
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
   * Clean up subscriptions, scheduled extraction, and download URLs.
   */
  ngOnDestroy() {
    clearTimeout(this.extractionTimer);
    if(this.downloadObjectUrl) {
      URL.revokeObjectURL(this.downloadObjectUrl);
    }
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription?.unsubscribe();
    })
  }

  protected readonly faCopy = faCopy;
  protected readonly faDownload = faDownload;
}
