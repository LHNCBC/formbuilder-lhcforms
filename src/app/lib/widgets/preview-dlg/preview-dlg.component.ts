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
import {MatSnackBar} from '@angular/material/snack-bar';
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
import {hasTemplateExtractReference} from '../template-extract/template-extract.util';
import {ObservationExtractComponent} from '../observation-extract/observation-extract.component';
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

/** How long copy/download feedback stays visible, in milliseconds. */
const ACTION_MESSAGE_DURATION = 3000;

/** Session storage key of the last visited top-level preview tab. */
const PREVIEW_TAB_STORAGE_KEY = 'previewTab';

/** Top-level preview tabs; the values are the tab indices in display order. */
export enum PreviewTab {
  QuestionnaireJSON,
  RenderedForm,
  QuestionnaireResponse,
  ExtractedResources
}

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
  private snackBar = inject(MatSnackBar);
  dialogRef = inject<MatDialogRef<PreviewDlgComponent>>(MatDialogRef);
  data = inject<PreviewData>(MAT_DIALOG_DATA);


  @ViewChild('lhcForm', {read: ElementRef}) wcForm: ElementRef;
  @ViewChild('extractionFormContainer', {read: ElementRef}) extractionFormContainer: ElementRef<HTMLElement>;
  @ViewChild('dlgContent', {static: false, read: ElementRef}) dlgContent: ElementRef;
  format: FHIR_VERSION_TYPE = 'R4'; // Current default for preview.
  activeTopLevelTabIndex: PreviewTab = PreviewTab.RenderedForm;
  // Snapshot tab to select once the rendered form is ready; see selectInitialTab().
  private pendingSnapshotTab: PreviewTab;
  activeJsonTabIndex: number = FHIR_VERSIONS.R4;
  readonly extractionFHIRVersion = 'R5';
  formReady = false;
  extractionInProgress = false;
  hasTemplateExtraction = false;
  hasObservationExtraction = false;
  // linkIds of items whose observation extraction relationship has no extracted ancestor.
  unextractedRelationshipLinkIds: string[] = [];
  // Whether extraction ran without error but produced no resources.
  noResourcesExtracted = false;
  // Extraction messages belong to the Extracted Resources tab only.
  extractionError = '';
  extractionUnavailable = '';
  // Response export failures belong to the Questionnaire Response tab only.
  responseError = '';
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
    "Select the 'Questionnaire JSON' tab to access a feature that validates your " +
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
    this.selectInitialTab();
    this.activeJsonTabIndex = FHIR_VERSIONS.R4;
    this.hasTemplateExtraction = this.hasContainedTemplate(this.data.questionnaire);
    this.hasObservationExtraction = this.hasObservationExtract(this.data.questionnaire);
    this.unextractedRelationshipLinkIds = [];
    this.findUnextractedRelationshipItems(this.data.questionnaire?.item, [this.data.questionnaire?.extension || []]);
    this.missingTerminologyServerLinkIds = Util.getItemsMissingPreferredTerminologyServer(this.data.questionnaire);
    this.preferredTerminologyServerMsg = this.buildPreferredTerminologyServerMsg(this.missingTerminologyServerLinkIds);
    this.renderedFormCompatibilityWarning = this.containedResourceService.getCompatibilityWarning(
      this.data.containedResourceVersionRecords,
      'R5'
    );
    this.onJsonVersionSelected(this.activeJsonTabIndex);
  }

  /**
   * Select the tab visited last in this browser session, or Rendered Form by default.
   * Snapshot tabs read answers from the rendered form, which is created only when its
   * tab is first shown. For them, show Rendered Form first and switch once it is ready.
   */
  private selectInitialTab(): void {
    const storedName = this.formService.getStorageItem('sessionStorage', PREVIEW_TAB_STORAGE_KEY) ?? '';
    const stored: unknown = PreviewTab[storedName as keyof typeof PreviewTab];
    // Tabs are stored by name; ignore missing or unknown values.
    const lastTab = typeof stored === 'number' ? stored as PreviewTab : PreviewTab.RenderedForm;
    const isSnapshotTab = lastTab === PreviewTab.QuestionnaireResponse || lastTab === PreviewTab.ExtractedResources;
    this.pendingSnapshotTab = isSnapshotTab ? lastTab : undefined;
    this.activeTopLevelTabIndex = isSnapshotTab ? PreviewTab.RenderedForm : lastTab;
  }

  /** Select the remembered snapshot tab, if any, after the rendered form is ready or has failed. */
  private selectPendingSnapshotTab(): void {
    if(this.pendingSnapshotTab !== undefined) {
      this.onPreviewTabSelected(this.pendingSnapshotTab);
    }
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
    this.noResourcesExtracted = false;
    this.extractedResourcesJSON = '';
    this.questionnaireResponseJSON = '';
    this.extractionError = `The rendered form is unavailable: ${event.detail}`;
    this.responseError = this.extractionError;
    this.selectPendingSnapshotTab();
  }

  /** Return the JSON snapshot selected in the extraction preview. */
  get extractionJSON(): string {
    return this.activeTopLevelTabIndex === PreviewTab.ExtractedResources ?
      this.extractedResourcesJSON : this.questionnaireResponseJSON;
  }

  /** Return the accessible name of the selected extraction snapshot. */
  get extractionViewLabel(): string {
    return this.activeTopLevelTabIndex === PreviewTab.ExtractedResources ? 'extracted resources' : 'QuestionnaireResponse';
  }

  /** Return whether either of the paired extraction snapshot tabs is selected. */
  get isExtractionTabSelected(): boolean {
    return this.activeTopLevelTabIndex === PreviewTab.QuestionnaireResponse ||
      this.activeTopLevelTabIndex === PreviewTab.ExtractedResources;
  }

  /**
   * Return whether snapshot tabs can show their results. Content is hidden while the
   * export runs or while waiting for the rendered form, so tabs show only final results.
   */
  get snapshotsSettled(): boolean {
    return !this.extractionInProgress && (this.formReady || !!this.responseError);
  }

  /**
   * Return whether a snapshot tab already shows why it has no JSON, which makes the
   * generic empty message redundant.
   * @param view - 'qr' for Questionnaire Response JSON, 'er' for Extracted Resources JSON.
   * @returns Whether an error or an explanation of the missing output is shown on the tab.
   */
  hasEmptySnapshotCause(view: 'qr' | 'er'): boolean {
    if(view === 'qr') {
      return !!this.responseError;
    }
    const noExtractionConfigured = !this.hasTemplateExtraction && !this.hasObservationExtraction;
    return noExtractionConfigured || this.noResourcesExtracted || !!this.extractionUnavailable || !!this.extractionError;
  }

  /**
   * Collect linkIds of items whose observation extraction relationship (valueCode) has no
   * extracted ancestor. Such items are not extracted.
   * @param items - Items to inspect, including their descendants.
   * @param ancestorExtensions - Extension lists of the ancestors, from the nearest ancestor up
   *   to the questionnaire.
   */
  private findUnextractedRelationshipItems(items: fhir.QuestionnaireItem[] = [], ancestorExtensions: fhir.Extension[][]): void {
    for(const item of items) {
      const extension = item.extension?.find(ext => ext.url === ObservationExtractComponent.extUrl);
      if(extension?.valueCode &&
        !ObservationExtractComponent.isRelationshipItemExtracted(ancestorExtensions, item.code)) {
        this.unextractedRelationshipLinkIds.push(item.linkId);
      }
      this.findUnextractedRelationshipItems(item.item, [item.extension || [], ...ancestorExtensions]);
    }
  }

  /**
   * Check whether template extraction is usable: a templateExtract or templateExtractBundle
   * extension references a resource that exists in Questionnaire.contained.
   * @param questionnaire - Questionnaire to inspect.
   * @returns Whether a referenced contained template exists.
   */
  private hasContainedTemplate(questionnaire: fhir.Questionnaire): boolean {
    return !!questionnaire?.contained?.some(resource => hasTemplateExtractReference(questionnaire, resource.id));
  }

  /**
   * Look for an enabled observationExtract extension on the questionnaire, items, or item codes.
   * @param scope - Questionnaire or item whose extensions and children should be inspected.
   * @returns Whether observation-based extraction is configured in this scope or its descendants.
   */
  private hasObservationExtract(scope: fhir.Questionnaire | fhir.QuestionnaireItem): boolean {
    /**
     * Check a list of extensions for an observationExtract that is not disabled.
     * @param extensions - Extensions to inspect.
     * @returns Whether an enabled observationExtract extension is present.
     */
    const isEnabled = (extensions: fhir.Extension[] = []): boolean => extensions.some(extension =>
      extension.url === ObservationExtractComponent.extUrl && extension.valueBoolean !== false);
    return !!scope && (isEnabled(scope.extension) ||
      !!(scope as fhir.QuestionnaireItem).code?.some(coding => isEnabled(coding.extension)) ||
      !!scope.item?.some(item => this.hasObservationExtract(item)));
  }

  /**
   * Refresh both snapshots when entering from a non-extraction tab. Switching between
   * the response and resources keeps the pair intact, including generated references.
   * Copy/download pop-up messages are closed so they are not shown on another tab.
   * The tab is remembered for the next time the preview opens in this browser session.
   * @param index - Selected top-level tab index.
   */
  onPreviewTabSelected(index: PreviewTab): void {
    const wasExtractionTabSelected = this.isExtractionTabSelected;
    this.activeTopLevelTabIndex = index;
    // A tab chosen before the rendered form is ready replaces the remembered one.
    this.pendingSnapshotTab = undefined;
    this.formService.setStorageItem('sessionStorage', PREVIEW_TAB_STORAGE_KEY, PreviewTab[index]);
    this.snackBar.dismiss();
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
    this.selectPendingSnapshotTab();
  }

  /** Schedule extraction after allowing pending input changes to settle. */
  refreshExtraction(): void {
    if(!this.formReady || this.extractionInProgress) {
      return;
    }
    this.extractionInProgress = true;
    this.extractionError = '';
    this.extractionUnavailable = '';
    this.noResourcesExtracted = false;
    this.responseError = '';
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
      if(this.hasTemplateExtraction && !supportsTemplates) {
        this.extractionUnavailable = `Template extraction requires LForms 38.7.0 or later. Loaded version: ${version || 'unknown'}.`;
      }

      // Request extraction only when something is configured to extract; otherwise LForms
      // returns just the QuestionnaireResponse.
      const extract = this.hasObservationExtraction || (this.hasTemplateExtraction && !!supportsTemplates);
      const result = extract ?
        LForms.Util.getFormFHIRData('QuestionnaireResponse', this.extractionFHIRVersion, container, {extract: true}) :
        LForms.Util.getFormFHIRData('QuestionnaireResponse', this.extractionFHIRVersion, container);
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
      // Older versions can return standalone Observations alongside the template Bundle.
      // With no resources, the tab explains why when extraction was requested.
      if(extracted.length) {
        this.extractedResourcesJSON = JSON.stringify(extracted.length === 1 ? extracted[0] : extracted, null, 2);
      }
      this.noResourcesExtracted = extract && !extracted.length;
    }
    catch(error) {
      this.extractedResourcesJSON = '';
      this.extractionError = this.errorMessage(error);
      if(!this.questionnaireResponseJSON) {
        this.exportResponseOnly(container);
      }
    }
    finally {
      this.extractionInProgress = false;
    }
  }

  /**
   * Export the QuestionnaireResponse alone after extraction failed before returning it,
   * so the Questionnaire Response tab still shows the answers or its own export error.
   * @param container - Element containing the preview widget, if available.
   */
  private exportResponseOnly(container: HTMLElement | undefined): void {
    try {
      if(!container || typeof LForms.Util.getFormFHIRData !== 'function') {
        throw new Error('The LForms response export API is unavailable.');
      }
      const response = LForms.Util.getFormFHIRData('QuestionnaireResponse', this.extractionFHIRVersion, container);
      if(response?.resourceType !== 'QuestionnaireResponse') {
        throw new Error('LForms did not return a QuestionnaireResponse.');
      }
      this.questionnaireResponseJSON = JSON.stringify(response, null, 2);
    }
    catch(error) {
      this.responseError = this.errorMessage(error);
    }
  }

  /**
   * Convert a thrown value to displayable text.
   * @param error - Thrown value.
   * @returns The error message, or the value as a string.
   */
  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  /** Download the selected snapshot without submitting it to a FHIR server. */
  downloadExtractionJSON(): void {
    if(!this.extractionJSON || this.extractionInProgress) {
      return;
    }
    const name = this.activeTopLevelTabIndex === PreviewTab.ExtractedResources ?
      'extracted-resources' : 'questionnaire-response';
    this.downloadJSON(this.extractionJSON, `${name}.${this.extractionFHIRVersion}.json`);
  }

  /**
   * Download the questionnaire shown on the selected version tab. The file is named like
   * the Export menu's file: the questionnaire name, else its title, else 'form'.
   */
  downloadQuestionnaireJSON(): void {
    if(!this.codeMirrorModel) {
      return;
    }
    const questionnaire = this.data.questionnaire;
    const baseName = (questionnaire?.name || questionnaire?.title || 'form').replace(/\s/g, '-');
    this.downloadJSON(this.codeMirrorModel, `${baseName}.${this.format}.json`);
  }

  /**
   * Save JSON text as a file, releasing the previous download URL. Failures are shown
   * in a pop-up message.
   * @param json - JSON text to save.
   * @param fileName - Suggested file name.
   */
  private downloadJSON(json: string, fileName: string): void {
    try {
      if(this.downloadObjectUrl) {
        URL.revokeObjectURL(this.downloadObjectUrl);
      }
      this.downloadObjectUrl = URL.createObjectURL(new Blob([json], {type: 'application/json;charset=utf-8'}));
      const anchor = document.createElement('a');
      anchor.href = this.downloadObjectUrl;
      anchor.download = fileName;
      anchor.dispatchEvent(new MouseEvent('click'));
    }
    catch(error) {
      this.showActionMessage(`Download failed: ${this.errorMessage(error)}`);
    }
  }

  /**
   * Announce clipboard results in a pop-up message, including failures.
   * @param copied - Whether the browser accepted the clipboard write.
   */
  onExtractionCopied(copied: boolean): void {
    this.showActionMessage(copied ?
      `Copied ${this.extractionViewLabel} JSON.` : 'Copy failed. Try Download JSON instead.');
  }

  /**
   * Show copy/download feedback in a short-lived pop-up, also announced to screen readers.
   * @param message - Text to show.
   */
  private showActionMessage(message: string): void {
    this.snackBar.open(message, undefined, {duration: ACTION_MESSAGE_DURATION});
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
   * Clean up subscriptions, scheduled extraction, download URLs, and pop-up messages.
   */
  ngOnDestroy() {
    clearTimeout(this.extractionTimer);
    this.snackBar.dismiss();
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







