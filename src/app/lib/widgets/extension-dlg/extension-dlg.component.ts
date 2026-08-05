import {
  ViewChild,
  Component,
  inject,
  ElementRef,
  OnInit,
  signal,
  AfterViewInit,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import fhir from 'fhir/r4';
import { FormService } from 'src/app/services/form.service';
import {
  DuplicateUrlErrorState,
  ExtensionObjComponent
} from '../extension-obj/extension-obj.component';
import {ExtensionMaxCardinality, getExtensionMaxCardinality} from '../../extension-defs';
import {
  ExtensionCardinalityCandidate,
  ExtensionCardinalityService
} from '../../../services/extension-cardinality.service';
import {Subscription} from 'rxjs';
import {
  ExtensionCardinalitySelectionDlgComponent
} from '../extension-cardinality-selection-dlg/extension-cardinality-selection-dlg.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {TableRowDialogBase} from '../table-row-dialog-base/table-row-dialog-base';

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
export class ExtensionDlgComponent extends TableRowDialogBase<fhir.Extension> implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dlgContent', {static: false, read: ElementRef}) declare dlgContent: ElementRef;
  @ViewChild('dlgContainer', {static: false, read: ElementRef}) declare dlgContainer: ElementRef;
  @ViewChild(ExtensionObjComponent) extensionObj: ExtensionObjComponent;

  formService: FormService = inject(FormService);
  extensionsService = inject(ExtensionsService);
  extensionCardinalityService = inject(ExtensionCardinalityService);
  public override ngbModalService = inject(NgbModal);
  duplicateUrlError = signal<DuplicateUrlErrorState | null>(null);
  checkingExtensionCardinality = signal(false);
  cardinalityWarning = signal<string | null>(null);

  cardinalityLookupSubscription: Subscription;
  cardinalitySelectionModalRef?: NgbModalRef;

  /**
   * Create a new Extension row model.
   *
   * @returns Empty Extension model.
   */
  protected createNewModel(): fhir.Extension {
    return {url: ''};
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
   *
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
   *
   * @param maxCardinality - Resolved maximum cardinality.
   * @param url - Extension URL whose sibling occurrences should be counted.
   * @returns True when the proposed occurrence exceeds a known finite maximum.
   */
  private wouldExceedMaximum(maxCardinality: ExtensionMaxCardinality, url: string): boolean {
    return maxCardinality !== '*' && maxCardinality !== 'unknown'
      && this.countMatchingSiblingExtensions(url) >= Number(maxCardinality);
  }

  /**
   * Update Save availability using row changes, URL validity, and resolved cardinality.
   */
  protected override updateDisableSave(): void {
    const url = (this.changedValue?.url || '').trim();
    const hasDuplicateUrl = this.countMatchingSiblingExtensions(url) > 0;
    const localCardinality = getExtensionMaxCardinality(url);

    this.cardinalityWarning.set(null);

    this.cardinalityLookupSubscription?.unsubscribe();
    if (hasDuplicateUrl && localCardinality === 'unknown') {
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

          if (resolution.status === 'unverified') {
            this.finishCardinalitySelection(url, 'unknown', true);
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
   * Apply duplicate validation state and ask the base dialog to recalculate Save availability.
   *
   * @param hasDisallowedDuplicateUrl - Whether the proposed occurrence exceeds its maximum.
   * @param isPending - Whether remote cardinality resolution is still pending.
   * @param maxCardinality - Cardinality used to construct the validation message.
   */
  private applyDuplicateValidation(
    hasDisallowedDuplicateUrl: boolean,
    isPending = false,
    maxCardinality: ExtensionMaxCardinality = 'unknown'
  ): void {
    this.duplicateUrlError.set(hasDisallowedDuplicateUrl
      ? {
        url: this.changedValue.url.trim(),
        message: maxCardinality === '1'
          ? 'An extension with this URL already exists here and does not allow multiple occurrences.'
          : `This extension allows at most ${maxCardinality} occurrences here.`
      }
      : null);
    this.checkingExtensionCardinality.set(isPending);
    super.updateDisableSave();
  }

  /**
   * Open a dialog for choosing among StructureDefinitions with conflicting maxima.
   *
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
        this.extensionCardinalityService.rememberUnverified(url);
        this.finishCardinalitySelection(url, 'unknown', true);
      }
    });
    modalRef.dismissed.subscribe(() => {
      if (this.cardinalitySelectionModalRef !== modalRef) {
        return;
      }
      this.cardinalitySelectionModalRef = undefined;
      this.extensionCardinalityService.rememberUnverified(url);
      this.finishCardinalitySelection(url, 'unknown', true);
    });
  }

  /**
   * Apply the selected or unverified cardinality result to the extension editor.
   *
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
   * Require a valid URL and a completed cardinality check before saving an Extension row.
   *
   * @returns True when URL and cardinality validation allow the row to be saved.
   */
  protected override isSaveAllowed(): boolean {
    return this.isUrlValid()
      && !this.duplicateUrlError()
      && !this.checkingExtensionCardinality();
  }

  /**
   * Revalidate cardinality immediately before saving the Extension row.
   */
  override save(): void {
    this.updateDisableSave();
    if (!this.disableSave()) {
      super.save();
    }
  }

  /**
   * Refresh Extension helper fields after structural edits such as nested row deletion.
   *
   * @param value - Current Extension row value.
   * @returns Extension value with helper fields refreshed.
   */
  protected override beforeSave(value: fhir.Extension): fhir.Extension {
    const currentValue = this.extensionObj?.sfFormRootProperty
      ? this.getCurrentFormPropertyValue(this.extensionObj.sfFormRootProperty) as fhir.Extension
      : value;
    return this.extensionsService.updateExtension(currentValue);
  }

  /**
   * Stop observers, subscriptions, and any open cardinality selection dialog.
   */
  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.cardinalityLookupSubscription?.unsubscribe();
    const modalRef = this.cardinalitySelectionModalRef;
    this.cardinalitySelectionModalRef = undefined;
    modalRef?.dismiss();
  }

  /**
   * Use the live form-property tree so structural table edits are included in dirty checks.
   *
   * @returns Current Extension value represented by the form-property tree.
   */
  protected override getCurrentValueForChangeDetection(): unknown {
    return this.extensionObj?.sfFormRootProperty
      ? this.getCurrentFormPropertyValue(this.extensionObj.sfFormRootProperty)
      : this.changedValue;
  }
}
