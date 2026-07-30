import {
  ViewChild,
  Component,
  inject,
  ElementRef,
  OnInit,
  signal,
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  OnDestroy
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialog
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import fhir from 'fhir/r4';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import { FormService } from 'src/app/services/form.service';
import {MessageDlgComponent, MessageType} from "../message-dlg/message-dlg.component";
import { DialogData } from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {
  DuplicateUrlErrorState,
  ExtensionObjComponent
} from "../extension-obj/extension-obj.component";
import {ExtensionMaxCardinality, getExtensionMaxCardinality} from '../../extension-defs';
import {
  ExtensionCardinalityCandidate,
  ExtensionCardinalityService
} from '../../../services/extension-cardinality.service';
import {Subscription} from 'rxjs';
import {
  ExtensionCardinalitySelectionDlgComponent
} from '../extension-cardinality-selection-dlg/extension-cardinality-selection-dlg.component';

/**
 * A dialog component to edit a FHIR Extension object.
 */
@Component({
  selector: 'lfb-extension-dlg',
  imports: [ExtensionObjComponent, MatDialogTitle, MatDialogContent, MatIconButton, MatDialogActions, MatIconModule, MatTabsModule, MatTooltip ],
  templateUrl: './extension-dlg.component.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    .extension-dlg-container {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 0;
    }

    .dlg-content {
      flex: 1 1 auto;
      max-height: none;
      min-height: 0;
    }

    .close-button {
      float: right;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtensionDlgComponent implements OnInit, AfterViewInit, OnDestroy {
  inputModel: fhir.Extension;
  changedValue: fhir.Extension;
  path: string = '';
  @ViewChild('dlgContent', {static: false, read: ElementRef}) dlgContent: ElementRef;
  @ViewChild('dlgContainer', {static: false, read: ElementRef}) dlgContainer: ElementRef;

  matDialogService = inject(MatDialog);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  matDialogRef = inject(MatDialogRef<DialogData>);
  formService: FormService = inject(FormService);
  extensionCardinalityService = inject(ExtensionCardinalityService);
  ngbModalService: NgbModal = inject(NgbModal);
  disableSave = signal(true);
  duplicateUrlError = signal<DuplicateUrlErrorState | null>(null);
  checkingExtensionCardinality = signal(false);
  cardinalityWarning = signal<string | null>(null);

  dirtyObserver: MutationObserver;
  cardinalityLookupSubscription: Subscription;
  cardinalitySelectionModalRef?: NgbModalRef;
  rowIndex = 0;
  previous_origin: {left: number, top: number};

  /**
   * Create an extension editor dialog.
   * @param hostEl - Host element used to calculate dialog position.
   * @param cdr - Change detector used after asynchronous validation updates.
   */
  constructor(protected hostEl: ElementRef, private cdr: ChangeDetectorRef) {
  }

  /**
   * Ng OnInit lifecycle hook.
   */
  ngOnInit() {
    if(this.data.rowIndex >= 0) {
      this.inputModel = this.data.arrayProperty.properties[this.data.rowIndex].value;
    }
    else {
      this.inputModel = {url: ''};
    }
    this.changedValue = this.inputModel;
    this.rowIndex = this.data.rowIndex >= 0 ? this.data.rowIndex : 0;

    const dialogRefs = this.matDialogService.openDialogs;
    const pathArray = dialogRefs.reduce((acc, dRef) => {
      const instance = dRef.componentInstance;
      if (instance instanceof ExtensionDlgComponent) {
        const data = instance.data;
        // Less than zero indicates a new item.
        let index: number = data.rowIndex;
        if(index < 0) {
          index = (data.arrayProperty.properties as FormProperty []).length;
        }
        acc.push(`${data.arrayProperty.path.substring(1)}[${index}]`);
      }
      return acc;
    }, [] as string[]);
    this.path = pathArray.join('.');
  }

  /**
   * Move the dialog back to the host element's current screen position.
   */
  movePosition() {
    const current_origin = this.hostEl.nativeElement.parentElement.getBoundingClientRect();
    this.matDialogRef.updatePosition({top: (current_origin.top)+'px', left: (current_origin.left)+'px'});
    this.previous_origin = current_origin;
  }

  /**
   * Start observing form dirtiness after the dialog view is initialized.
   */
  ngAfterViewInit() {

    /**
     * Observe the dialog content for changes to the form's dirty state.
     */
    this.dirtyObserver = new MutationObserver((mutationsList, observer) => {
      for(const mutation of mutationsList) {
        if (mutation.type === 'attributes' && (mutation.target as HTMLElement).classList?.contains('ng-dirty')) {
          this.updateDisableSave();
          this.cdr.markForCheck();
          return;
        }
      }
    });

    /**
     * Observe the form inside the dialog content for class attribute changes to detect dirty state.
     */
    this.dirtyObserver.observe(
      this.dlgContent?.nativeElement.querySelector('form'),
      {attributes: true, attributeFilter: ['class'], subtree: true}
    );

    this.disableSave.set(true);
    this.cdr.detectChanges();
  }


  /**
   * Handle the dialog save and close event.
   */
  save() {
    // Revalidate at submission time in case the containing extension array
    // changed while this dialog was open.
    this.updateDisableSave();
    if (this.disableSave()) {
      return;
    }
    this.matDialogRef.close(this.changedValue);
  }

  /**
   * Get the extension model supplied to the editor.
   * @returns Extension model being edited.
   */
  getInputModel(): fhir.Extension {
    return this.inputModel as fhir.Extension;
  }


  /**
   * Handle an extension value change and rerun save validation.
   * @param event - Updated extension object emitted by the editor.
   */
  onChange(event: any) {
    this.changedValue = event;
    // Let the form controls render their current dirty state before Save is
    // recalculated. Cached cardinality lookups may complete synchronously.
    this.cdr.detectChanges();
    this.updateDisableSave();
    this.cdr.detectChanges();

  }

  /**
   * Check if the URL field has a valid URI (non-empty).
   * @returns True when the current URL contains a non-whitespace value.
   */
  private isUrlValid(): boolean {
    const url = (this.changedValue?.url || '').trim();
    return url.length > 0;
  }

  /**
   * Count other extensions with the same URL at this exact scope.
   * The current row is ignored when editing an existing extension.
   * @param url - Extension URL to compare against sibling rows.
   * @returns Number of matching sibling extensions.
   */
  private countMatchingSiblingExtensions(url = (this.changedValue?.url || '').trim()): number {
    if (!url) {
      return 0;
    }

    return (this.data.arrayProperty?.value || []).filter((extension: fhir.Extension, index: number) =>
      index !== this.data.rowIndex && extension?.url?.trim() === url
    ).length;
  }

  /**
   * Check whether adding the current extension would exceed a finite maximum.
   * @param maxCardinality - Resolved maximum cardinality.
   * @param url - Extension URL whose sibling occurrences should be counted.
   * @returns True when the proposed occurrence exceeds a known finite maximum.
   */
  private wouldExceedMaximum(maxCardinality: ExtensionMaxCardinality, url: string): boolean {
    return maxCardinality !== '*' && maxCardinality !== 'unknown'
      && this.countMatchingSiblingExtensions(url) >= Number(maxCardinality);
  }

  /**
   * Update the disableSave signal based on dirty state and URL validity.
   */
  private updateDisableSave() {
    const url = (this.changedValue?.url || '').trim();
    const hasDuplicateUrl = this.countMatchingSiblingExtensions(url) > 0;
    const localCardinality = getExtensionMaxCardinality(url);

    this.cardinalityLookupSubscription?.unsubscribe();
    if (hasDuplicateUrl && localCardinality === 'unknown') {
      this.cardinalityWarning.set(null);
      this.checkingExtensionCardinality.set(true);
      this.applyDuplicateValidation(false, true);
      this.cardinalityLookupSubscription = this.extensionCardinalityService.resolveCardinality(url)
        .subscribe((resolution) => {
          if ((this.changedValue?.url || '').trim() !== url
            || this.countMatchingSiblingExtensions(url) === 0) {
            return;
          }

          if (resolution.status === 'ambiguous') {
            this.openCardinalitySelection(url, resolution.candidates);
            return;
          }

          const cardinality = resolution.status === 'resolved'
            ? resolution.maxCardinality
            : 'unknown';
          this.checkingExtensionCardinality.set(false);
          this.applyDuplicateValidation(this.wouldExceedMaximum(cardinality, url), false, cardinality);
          this.cdr.markForCheck();
        });
      return;
    }

    this.checkingExtensionCardinality.set(false);
    this.cardinalityWarning.set(null);
    this.applyDuplicateValidation(
      this.wouldExceedMaximum(localCardinality, url),
      false,
      localCardinality
    );
  }

  /**
   * Apply duplicate validation state and recalculate whether Save is available.
   * @param hasDisallowedDuplicateUrl - Whether the proposed occurrence exceeds its maximum.
   * @param isPending - Whether remote cardinality resolution is still pending.
   * @param maxCardinality - Cardinality used to construct the validation message.
   */
  private applyDuplicateValidation(
    hasDisallowedDuplicateUrl: boolean,
    isPending = false,
    maxCardinality: ExtensionMaxCardinality = 'unknown'
  ) {
    const isDirty = !!this.dlgContent?.nativeElement.querySelector('.ng-dirty');
    this.duplicateUrlError.set(hasDisallowedDuplicateUrl
      ? {
        url: this.changedValue.url.trim(),
        message: maxCardinality === '1'
          ? 'An extension with this URL already exists here and does not allow multiple occurrences.'
          : `This extension allows at most ${maxCardinality} occurrences here.`
      }
      : null);
    this.disableSave.set(!isDirty || !this.isUrlValid() || hasDisallowedDuplicateUrl || isPending);
  }

  /**
   * Open a dialog for choosing among StructureDefinitions with conflicting maxima.
   * @param url - Canonical extension URL being resolved.
   * @param candidates - Conflicting StructureDefinition candidates to display.
   */
  private openCardinalitySelection(
    url: string,
    candidates: ExtensionCardinalityCandidate[]
  ): void {
    if (this.cardinalitySelectionModalRef) {
      return;
    }

    const modalRef = this.ngbModalService.open(ExtensionCardinalitySelectionDlgComponent, {
      scrollable: true,
      size: 'xl'
    });
    this.cardinalitySelectionModalRef = modalRef;
    modalRef.componentInstance.candidates = candidates;

    modalRef.closed.subscribe((candidate: ExtensionCardinalityCandidate | null) => {
      if (this.cardinalitySelectionModalRef !== modalRef) {
        return;
      }
      this.cardinalitySelectionModalRef = undefined;
      if (candidate) {
        this.extensionCardinalityService.rememberSelection(url, candidate);
        this.finishCardinalitySelection(url, candidate.maxCardinality);
      } else {
        this.extensionCardinalityService.rememberUnknown(url);
        this.finishCardinalitySelection(url, 'unknown', true);
      }
    });
    modalRef.dismissed.subscribe(() => {
      if (this.cardinalitySelectionModalRef !== modalRef) {
        return;
      }
      this.cardinalitySelectionModalRef = undefined;
      this.extensionCardinalityService.rememberUnknown(url);
      this.finishCardinalitySelection(url, 'unknown', true);
    });
  }

  /**
   * Apply the selected or unverified cardinality result to the extension editor.
   * @param url - Canonical URL associated with the completed selection.
   * @param cardinality - Selected maximum or "unknown".
   * @param wasSkipped - Whether the user chose to continue without verification.
   */
  private finishCardinalitySelection(
    url: string,
    cardinality: ExtensionMaxCardinality,
    wasSkipped = false
  ): void {
    if ((this.changedValue?.url || '').trim() !== url
      || this.countMatchingSiblingExtensions(url) === 0) {
      return;
    }

    this.checkingExtensionCardinality.set(false);
    this.cardinalityWarning.set(wasSkipped
      ? 'Cardinality was not verified because no extension definition was selected. Additional occurrences will be allowed.'
      : null);
    this.applyDuplicateValidation(this.wouldExceedMaximum(cardinality, url), false, cardinality);
    this.cdr.markForCheck();
  }

  /**
   * Handle the cancel button event.
   */
  cancel() {
    // Check if the form is dirty
    const isDirty = !!this.dlgContent.nativeElement.querySelector('.ng-dirty');
    if (!isDirty) {
      this.matDialogRef.close(false);
      return;
    } else {
      // Ask for confirmation to discard changes
      const modalRef = this.ngbModalService.open(MessageDlgComponent, {scrollable: true});
      modalRef.componentInstance.options = {
        title: 'Confirm',
        message: 'Are you sure you want to discard the changes you made?',
        type: MessageType.INFO,
        buttons: [{
          label: 'Discard changes',
          value: 'yes'
        }, {
          label:  'Do not discard changes',
          value: 'no'
        }]};

      modalRef.closed.subscribe((result) => {
        if (result === 'yes') {
          this.matDialogRef.close(false);
        }
      });
    }
  }

  /**
   * Stop observers, subscriptions, and any open cardinality selection dialog.
   */
  ngOnDestroy() {
    this.dirtyObserver?.disconnect();
    this.cardinalityLookupSubscription?.unsubscribe();
    const modalRef = this.cardinalitySelectionModalRef;
    this.cardinalitySelectionModalRef = undefined;
    modalRef?.dismiss();
  }
}
