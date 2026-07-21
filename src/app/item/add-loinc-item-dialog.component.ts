import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FetchService, LoincItemType } from '../services/fetch.service';
import {AutoCompleteLoincItem} from "../services/fetch.service";

/**
 * Captures the state of a LOINC item selection for a single LOINC item type,
 * so it can be remembered while the user toggles between item types.
 */
interface LoincSelection {
  loincItem: AutoCompleteLoincItem;
  loincItemDisplayTexts: Record<string, string>;
  selectedDisplayField: string;
}

/**
 * Dialog to search and select a LOINC item (panel or question) to add to the
 * questionnaire. This was extracted from the `#addItemDlg` template that used
 * to live in `ItemComponent`.
 *
 * The dialog is opened via `NgbModal` and returns the selected auto-complete
 * result through `NgbActiveModal.close()`. The selected `loincType` is exposed
 * so the caller knows how to resolve the selection.
 */
@Component({
  standalone: false,
  selector: 'lfb-add-loinc-item-dialog',
  templateUrl: './add-loinc-item-dialog.component.html',
  styleUrls: ['./item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddLoincItemDialogComponent {

  loincType = LoincItemType.PANEL;

  loincTypeOpts = [
    {
      value: LoincItemType.PANEL,
      display: 'Panel'
    },
    {
      value: LoincItemType.QUESTION,
      display: 'Question'
    }
  ];

  loincItem: AutoCompleteLoincItem;

  selectedDisplayField: string = 'text';
  loincItemDisplayTexts: Record<string, string> = {};

  /**
   * Remembers the selection made for each LOINC item type. This lets the dialog
   * preserve the item (search box value, available display texts and the chosen
   * display field) the user already selected when they toggle the LOINC item
   * type radio group back and forth.
   */
  private readonly loincSelectionsByType: Record<LoincItemType, LoincSelection> = {
    [LoincItemType.PANEL]: {loincItem: null, loincItemDisplayTexts: {}, selectedDisplayField: 'text'},
    [LoincItemType.QUESTION]: {loincItem: null, loincItemDisplayTexts: {}, selectedDisplayField: 'text'}
  };

  activeModal = inject(NgbActiveModal);
  dataSrv = inject(FetchService);

  /**
   * A function variable to pass into ng bootstrap typeahead for call back.
   * Wait at least for two characters, 200 millis of inactivity and not the
   * same string as previously searched.
   *
   * @param term$ - User typed string
   */
  acSearch = (term$: Observable<string>): Observable<any []> => {
    return term$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term) => term.length < 2 ? [] : this.dataSrv.searchLoincItems(term, this.loincType)));
  };

  /**
   * Auto complete result formatting used in add loinc item dialog
   * @param acResult - Selected result item.
   */
  formatter1(acResult: any) {
    return acResult.code[0].code + ': ' + acResult.text;
  }

  /**
   * Auto complete result formatting used in add loinc item dialog
   * @param acResult - Selected result item.
   */
  formatter(acResult: any) {
    return acResult.LOINC_NUM + ': ' + acResult.text;
  }

  /**
   * Handle a change of the LOINC item type radio group. The currently active
   * selection is stored under the type being switched away from and any
   * selection previously made for the newly selected type is restored. This
   * preserves the selected LOINC item based on the LOINC item type selection.
   *
   * @param newLoincType - The newly selected LOINC item type.
   */
  onLoincTypeChange(newLoincType: LoincItemType) {
    if(newLoincType === this.loincType) {
      return;
    }
    // Preserve the active selection under the type being switched away from.
    this.captureCurrentSelection();
    this.loincType = newLoincType;
    // Restore whatever was previously selected for the newly selected type.
    this.restoreSelection(newLoincType);
  }

  /**
   * Store the active selection (search box item, display texts and the selected
   * display field) under the currently selected LOINC item type.
   */
  private captureCurrentSelection() {
    this.loincSelectionsByType[this.loincType] = {
      loincItem: this.loincItem,
      loincItemDisplayTexts: this.loincItemDisplayTexts,
      selectedDisplayField: this.selectedDisplayField
    };
  }

  /**
   * Restore the active bindings from the selection stored for the given type.
   *
   * @param loincType - The LOINC item type whose selection should become active.
   */
  private restoreSelection(loincType: LoincItemType) {
    const saved = this.loincSelectionsByType[loincType];
    this.loincItem = saved.loincItem;
    this.loincItemDisplayTexts = saved.loincItemDisplayTexts;
    this.selectedDisplayField = saved.selectedDisplayField;
  }

  onSelectLoincQuestion(loincItem: AutoCompleteLoincItem) {
    this.loincItem = loincItem;
    const textFields = ['text', 'COMPONENT', 'LONG_COMMON_NAME', 'SHORTNAME', 'CONSUMER'];
    const uniqueTexts = new Set();
    this.loincItemDisplayTexts = Object.fromEntries(Object.entries(loincItem).filter(([key, value]) => {
      let ret = false;
      if(value && !uniqueTexts.has(value) && textFields.indexOf(key) > -1) {
        uniqueTexts.add(value);
        ret = true;
      }
      return ret;
    }));
    if(Object.keys(this.loincItemDisplayTexts).length <= 1) {
      this.loincItemDisplayTexts = {};
    }
    this.selectedDisplayField = this.loincItemDisplayTexts[this.selectedDisplayField] ? this.selectedDisplayField : 'text';
    // Keep the stored selection for the current type in sync with the new pick.
    this.captureCurrentSelection();
  }

  /**
   * Whether there is a tangible LOINC item selected that can be added to the
   * questionnaire. Used to enable/disable the dialog's Add button so the user
   * cannot confirm an empty selection.
   */
  get canAddLoincItem(): boolean {
    return !!this.loincItem;
  }

  onAddLoincItem() {
    if(this.loincType === LoincItemType.QUESTION) {
      const qItem = this.dataSrv.convertLoincQToItem(this.loincItem, this.selectedDisplayField);
      this.activeModal.close(qItem);
    }
    else {
      this.activeModal.close(this.loincItem);
    }
  }

  protected readonly Object = Object;
  protected readonly LoincItemType = LoincItemType;
}

