import {ElementRef, ChangeDetectorRef, Directive, inject, signal} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import {MessageDlgComponent, MessageType} from '../message-dlg/message-dlg.component';
import {DialogData} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import copy from 'fast-copy';

/**
 * Shared behavior for dialogs that edit one row from a table-backed array field.
 */
@Directive()
export abstract class TableRowDialogBase<T> {
  inputModel: T;
  changedValue: T;
  path: string = '';
  dlgContent: ElementRef;
  dlgContainer: ElementRef;
  disableSave = signal(true);

  dirtyObserver: MutationObserver;
  rowIndex = 0;
  previous_origin: {left: number, top: number};

  public data = inject<DialogData>(MAT_DIALOG_DATA);
  protected matDialogRef = inject(MatDialogRef<DialogData>);
  protected matDialogService = inject(MatDialog);
  protected ngbModalService = inject(NgbModal);
  protected hostEl = inject(ElementRef);
  protected cdr = inject(ChangeDetectorRef);

  // Keep the default save reconstruction schema-driven. Identifier overrides this
  // because lazy recursive dialogs must preserve deeper assigner.identifier data
  // that is returned from child dialogs but not rendered by the current schema.
  // Extension does not override it, so it keeps the previous behavior of dropping
  // schema-unknown fields during save reconstruction.
  protected preserveUnknownObjectFields = false;

  private initialValueJson = '';

  /**
   * Create an empty row value for add-new dialogs.
   *
   * @returns Empty model for a new table row.
   */
  protected abstract createNewModel(): T;

  /**
   * Additional save validation supplied by the concrete row dialog.
   *
   * @returns True when the current row can be saved.
   */
  protected isSaveAllowed(): boolean {
    return true;
  }

  /**
   * Allow concrete dialogs to normalize the row value immediately before saving.
   *
   * @param value - Current row value to normalize.
   * @returns Row value to close the dialog with.
   */
  protected beforeSave(value: T): T {
    return value;
  }

  /**
   * Allow concrete dialogs to adapt the stored row model for their UI controls.
   *
   * @param value - Stored row value loaded into the dialog.
   * @returns Row value adapted for the dialog UI.
   */
  protected prepareInputModel(value: T): T {
    return value;
  }

  /**
   * Return the value to use when checking whether the dialog has unsaved changes.
   *
   * @returns Current value used for dirty checking.
   */
  protected getCurrentValueForChangeDetection(): unknown {
    return this.changedValue;
  }

  /**
   * Ng OnInit lifecycle hook.
   */
  ngOnInit() {
    const rawInputModel = this.data.rowIndex >= 0
      ? this.data.arrayProperty.properties[this.data.rowIndex].value
      : this.createNewModel();
    this.inputModel = this.prepareInputModel(rawInputModel);
    this.changedValue = this.inputModel;
    this.initialValueJson = this.stringifyForChange(this.inputModel);
    this.rowIndex = this.data.rowIndex >= 0 ? this.data.rowIndex : 0;
    this.path = this.buildPath();
  }

  /**
   * Move the dialog to match the host element's current screen position.
   */
  movePosition() {
    const currentOrigin = this.hostEl.nativeElement.parentElement.getBoundingClientRect();
    this.matDialogRef.updatePosition({top: currentOrigin.top + 'px', left: currentOrigin.left + 'px'});
    this.previous_origin = currentOrigin;
  }

  /**
   * Ng AfterViewInit lifecycle hook.
   */
  ngAfterViewInit() {
    this.dirtyObserver = new MutationObserver((mutationsList) => {
      for(const mutation of mutationsList) {
        if (mutation.type === 'attributes' && (mutation.target as HTMLElement).classList?.contains('ng-dirty')) {
          this.updateDisableSave();
          this.cdr.markForCheck();
          return;
        }
      }
    });

    const formElement = this.dlgContent?.nativeElement.querySelector('form');
    if (formElement) {
      this.dirtyObserver.observe(
        formElement,
        {attributes: true, attributeFilter: ['class'], subtree: true}
      );
    }

    this.disableSave.set(true);
    this.cdr.detectChanges();
  }

  /**
   * Handle the dialog save and close event.
   */
  save() {
    this.changedValue = this.beforeSave(this.changedValue);
    this.matDialogRef.close(this.changedValue);
  }

  /**
   * Get the input value supplied to the dialog.
   *
   * @returns Initial row model used by the dialog.
   */
  getInputModel(): T {
    return this.inputModel;
  }

  /**
   * Handle changes emitted by the row object form.
   *
   * @param event - Updated row value emitted by the form.
   */
  onChange(event: T) {
    this.changedValue = event;
    this.updateDisableSave();
    this.cdr.detectChanges();
  }

  /**
   * Handle the cancel button event.
   */
  cancel() {
    const isDirty = this.hasModelChanged();
    if (!isDirty) {
      this.matDialogRef.close(false);
      return;
    }

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

  /**
   * Clean up observers when the dialog is destroyed.
   */
  ngOnDestroy() {
    this.dirtyObserver?.disconnect();
  }

  /**
   * Update the disableSave signal based on dirty state, model changes, and validation.
   */
  protected updateDisableSave() {
    const hasChanges = this.hasModelChanged();
    this.disableSave.set(!hasChanges || !this.isSaveAllowed());
  }

  /**
   * Rebuild the current value from a form-property tree instead of relying on cached parent values.
   *
   * @param property - Form property node to read.
   * @returns Current value represented by the form-property tree.
   */
  protected getCurrentFormPropertyValue(property: any): any {
    if (!property) {
      return undefined;
    }

    if (Array.isArray(property.properties)) {
      const value = property.properties
        .map((child) => this.getCurrentFormPropertyValue(child))
        .filter((childValue) => !this.isEmptyValue(childValue));
      return value.length ? value : undefined;
    }

    if (property.properties && typeof property.properties === 'object') {
      const value: {[key: string]: any} = this.preserveUnknownObjectFields
        ? this.getObjectValueCopy(property.value)
        : {};
      Object.keys(property.properties).forEach((key) => {
        const child = property.properties[key];
        if (child?.visible === false) {
          delete value[key];
          return;
        }
        const childValue = this.getCurrentFormPropertyValue(child);
        if (!this.isEmptyValue(childValue)) {
          value[key] = childValue;
        }
        else {
          delete value[key];
        }
      });
      return Object.keys(value).length ? value : undefined;
    }

    return property.value;
  }

  /**
   * Copy raw object values so schema-unknown fields returned from nested dialogs are preserved.
   *
   * @param value - Raw property value to copy.
   * @returns Object copy, or an empty object when the value is not a plain object.
   */
  private getObjectValueCopy(value: unknown): {[key: string]: any} {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? copy(value as {[key: string]: any})
      : {};
  }

  /**
   * Build the table row path shown in the dialog.
   *
   * @returns Dot/bracket path for the row being edited.
   */
  private buildPath(): string {
    const dialogType = this.constructor;
    const pathArray = this.matDialogService.openDialogs.reduce((acc, dRef) => {
      const instance = dRef.componentInstance;
      if (instance instanceof dialogType) {
        const data = (instance as TableRowDialogBase<T>).data;
        let index: number = data.rowIndex;
        if(index < 0) {
          index = (data.arrayProperty.properties as FormProperty []).length;
        }
        acc.push(`${data.arrayProperty.path.substring(1)}[${index}]`);
      }
      return acc;
    }, [] as string[]);
    return pathArray.join('.');
  }

  /**
   * Check whether the emitted model differs from the original input.
   *
   * @returns True when the current model differs from the initial model.
   */
  private hasModelChanged(): boolean {
    return this.stringifyForChange(this.getCurrentValueForChangeDetection()) !== this.initialValueJson;
  }

  /**
   * Convert a model value into a stable string for change detection.
   *
   * @param value - Model value to serialize.
   * @returns Stable JSON string for comparison.
   */
  private stringifyForChange(value: unknown): string {
    return JSON.stringify(this.normalizeForChange(value) ?? null);
  }

  /**
   * Remove internal helper fields and produce deterministic key ordering for model comparisons.
   *
   * @param value - Value to normalize.
   * @returns Normalized value for comparison, or undefined when empty.
   */
  private normalizeForChange(value: unknown): unknown {
    if (Array.isArray(value)) {
      const normalized = value
        .map((entry) => this.normalizeForChange(entry))
        .filter((entry) => !this.isEmptyValue(entry));
      return normalized.length ? normalized : undefined;
    }

    if (value && typeof value === 'object') {
      const normalized: {[key: string]: unknown} = {};
      Object.keys(value as {[key: string]: unknown})
        .sort()
        .forEach((key) => {
          if (key.startsWith('__$')) {
            return;
          }
          const child = this.normalizeForChange((value as {[key: string]: unknown})[key]);
          if (!this.isEmptyValue(child)) {
            normalized[key] = child;
          }
        });
      return Object.keys(normalized).length ? normalized : undefined;
    }

    return value;
  }

  /**
   * Check whether a normalized value is empty.
   *
   * @param value - Value to check.
   * @returns True when the value should be treated as empty.
   */
  private isEmptyValue(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
      return true;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return typeof value === 'object' && Object.keys(value).length === 0;
  }
}
