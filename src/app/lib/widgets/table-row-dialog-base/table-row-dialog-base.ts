import {AfterViewInit, ElementRef, ChangeDetectorRef, Directive, OnInit, signal} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import {MessageDlgComponent, MessageType} from '../message-dlg/message-dlg.component';
import {DialogData} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';

/**
 * Shared behavior for dialogs that edit one row from a table-backed array field.
 */
@Directive()
export abstract class TableRowDialogBase<T> implements OnInit, AfterViewInit {
  inputModel: T;
  changedValue: T;
  path: string = '';
  dlgContent: ElementRef;
  dlgContainer: ElementRef;
  disableSave = signal(true);

  rowIndex = 0;
  previous_origin: {left: number, top: number};

  private initialValueJson = '';

  protected constructor(
    public data: DialogData,
    protected matDialogRef: MatDialogRef<DialogData>,
    protected matDialogService: MatDialog,
    protected ngbModalService: NgbModal,
    protected hostEl: ElementRef,
    protected cdr: ChangeDetectorRef
  ) {
  }

  /**
   * Create an empty row value for add-new dialogs.
   */
  protected abstract createNewModel(): T;

  /**
   * Additional save validation supplied by the concrete row dialog.
   */
  protected isSaveAllowed(): boolean {
    return true;
  }

  /**
   * Allow concrete dialogs to normalize the row value immediately before saving.
   */
  protected beforeSave(value: T): T {
    return value;
  }

  /**
   * Allow concrete dialogs to adapt the stored row model for their UI controls.
   */
  protected prepareInputModel(value: T): T {
    return value;
  }

  /**
   * Return the stored value used to initialize an existing row.
   *
   * Concrete dialogs can override this when the schema-form row value omits
   * data that is preserved separately.
   */
  protected getExistingRowValue(rowProperty: FormProperty): T {
    return rowProperty.value as T;
  }

  /**
   * Return the value to use when checking whether the dialog has unsaved changes.
   */
  protected getCurrentValueForChangeDetection(): unknown {
    return this.changedValue;
  }

  /**
   * Ng OnInit lifecycle hook.
   */
  ngOnInit() {
    const rawInputModel = this.data.rowIndex >= 0
      ? this.getExistingRowValue(this.data.arrayProperty.properties[this.data.rowIndex] as FormProperty)
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
    // Dirty state is derived from value changes emitted through onChange(), so no
    // DOM MutationObserver is needed to detect edits.
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
   */
  getInputModel(): T {
    return this.inputModel;
  }

  /**
   * Handle changes emitted by the row object form.
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
   * Update the disableSave signal based on dirty state, model changes, and validation.
   */
  protected updateDisableSave() {
    const hasChanges = this.hasModelChanged();
    this.disableSave.set(!hasChanges || !this.isSaveAllowed());
  }

  /**
   * Rebuild the current value from a form-property tree instead of relying on cached parent values.
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
      const value: {[key: string]: any} = {};
      Object.keys(property.properties).forEach((key) => {
        const child = property.properties[key];
        if (child?.visible === false || key.startsWith('__$')) {
          return;
        }
        const childValue = this.getCurrentFormPropertyValue(child);
        if (!this.isEmptyValue(childValue)) {
          value[key] = childValue;
        }
      });
      return Object.keys(value).length ? value : undefined;
    }

    return property.value;
  }

  /**
   * Build the table row path shown in the dialog.
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
   */
  protected hasModelChanged(currentValue: unknown = this.getCurrentValueForChangeDetection()): boolean {
    return this.stringifyForChange(currentValue) !== this.initialValueJson;
  }

  /**
   * Convert a model value into a stable string for change detection.
   */
  private stringifyForChange(value: unknown): string {
    return JSON.stringify(this.normalizeForChange(value) ?? null);
  }

  /**
   * Remove internal helper fields and produce deterministic key ordering for model comparisons.
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
