import {CommonModule} from '@angular/common';
import {Component, inject, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ExtensionCardinalityCandidate} from '../../../services/extension-cardinality.service';

/**
 * Presents conflicting StructureDefinition candidates for user selection.
 */
@Component({
  selector: 'lfb-extension-cardinality-selection-dlg',
  imports: [CommonModule, FormsModule],
  templateUrl: './extension-cardinality-selection-dlg.component.html',
  styles: [`
    .definition-table-container {
      max-height: min(50vh, 28rem);
      overflow: auto;
    }

    thead th {
      background: var(--bs-light);
      position: sticky;
      top: 0;
      white-space: nowrap;
      z-index: 1;
    }

    tbody tr {
      cursor: pointer;
    }

    td {
      vertical-align: middle;
    }

    .definition-name {
      min-width: 12rem;
    }
  `]
})
export class ExtensionCardinalitySelectionDlgComponent {
  private static nextDialogId = 0;

  activeModal = inject(NgbActiveModal);
  readonly dialogId = ++ExtensionCardinalitySelectionDlgComponent.nextDialogId;
  readonly titleId = `extensionCardinalitySelectionTitle-${this.dialogId}`;
  readonly descriptionId = `extensionCardinalitySelectionDescription-${this.dialogId}`;

  @Input()
  candidates: ExtensionCardinalityCandidate[] = [];

  selection: number | 'unknown' | null = null;

  /**
   * Get the currently selected StructureDefinition candidate.
   * @returns Selected candidate, or null for no selection or the unverified option.
   */
  get selectedCandidate(): ExtensionCardinalityCandidate | null {
    return typeof this.selection === 'number' ? this.candidates[this.selection] : null;
  }

  /**
   * Get a human-readable name for a StructureDefinition candidate.
   * @param candidate - Candidate whose name should be displayed.
   * @param index - Candidate position used for the fallback name.
   * @returns Candidate title, resource ID, or generated fallback name.
   */
  definitionName(candidate: ExtensionCardinalityCandidate, index: number): string {
    return candidate.title || candidate.id || `Definition ${index + 1}`;
  }

  /**
   * Select a StructureDefinition row.
   * @param index - Index of the candidate to select.
   */
  select(index: number): void {
    this.selection = index;
  }

  /**
   * Close the dialog with the selected candidate or the unverified choice.
   */
  applySelection(): void {
    if (this.selection === 'unknown') {
      this.activeModal.close(null);
    } else if (this.selectedCandidate) {
      this.activeModal.close(this.selectedCandidate);
    }
  }
}
