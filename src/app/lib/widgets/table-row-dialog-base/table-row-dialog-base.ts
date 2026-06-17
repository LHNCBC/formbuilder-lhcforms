import {ElementRef, ChangeDetectorRef, Directive, signal} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import {MessageDlgComponent, MessageType} from '../message-dlg/message-dlg.component';
import {DialogData} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';

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
   * Ng OnInit lifecycle hook.
   */
  ngOnInit() {
    if(this.data.rowIndex >= 0) {
      this.inputModel = this.data.arrayProperty.properties[this.data.rowIndex].value;
    }
    else {
      this.inputModel = this.createNewModel();
    }
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
    const isDirty = this.hasDirtyControl() || this.hasModelChanged();
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
    const hasChanges = this.hasDirtyControl() || this.hasModelChanged();
    this.disableSave.set(!hasChanges || !this.isSaveAllowed());
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
   * Check whether any form control has been marked dirty.
   */
  private hasDirtyControl(): boolean {
    return !!this.dlgContent?.nativeElement.querySelector('.ng-dirty');
  }

  /**
   * Check whether the emitted model differs from the original input.
   */
  private hasModelChanged(): boolean {
    return this.stringifyForChange(this.changedValue) !== this.initialValueJson;
  }

  /**
   * Convert a model value into a stable string for change detection.
   */
  private stringifyForChange(value: unknown): string {
    return JSON.stringify(value ?? null);
  }
}
