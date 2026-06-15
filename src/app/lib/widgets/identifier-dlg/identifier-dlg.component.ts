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
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import fhir from 'fhir/r4';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import { FormService } from 'src/app/services/form.service';
import {MessageDlgComponent, MessageType} from "../message-dlg/message-dlg.component";
import { DialogData } from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {IdentifierObjComponent} from "../identifier-obj/identifier-obj.component";

/**
 * A dialog component to edit a FHIR Identifier object.
 */
@Component({
  selector: 'lfb-identifier-dlg',
  imports: [IdentifierObjComponent, MatDialogTitle, MatDialogContent, MatIconButton, MatDialogActions, MatIconModule, MatTabsModule, MatTooltip ],
  templateUrl: './identifier-dlg.component.html',
  styles: [`
    .close-button {
      float: right;
    }

    :host ::ng-deep lfb-identifier-obj select.invalid[name="use"] {
      outline: none;
    }

    :host ::ng-deep lfb-identifier-obj select[name="use"] ~ fa-icon {
      display: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentifierDlgComponent implements OnInit, AfterViewInit, OnDestroy {
  inputModel: fhir.Identifier;
  changedValue: fhir.Identifier;
  path: string = '';
  @ViewChild('dlgContent', {static: false, read: ElementRef}) dlgContent: ElementRef;
  @ViewChild('dlgContainer', {static: false, read: ElementRef}) dlgContainer: ElementRef;

  matDialogService = inject(MatDialog);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  matDialogRef = inject(MatDialogRef<DialogData>);
  hostEl = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  formService: FormService = inject(FormService);
  ngbModalService: NgbModal = inject(NgbModal);
  disableSave = signal(true);

  dirtyObserver: MutationObserver;
  rowIndex = 0;
  previous_origin: {left: number, top: number};

  /**
   * Ng OnInit lifecycle hook.
   */
  ngOnInit() {
    if(this.data.rowIndex >= 0) {
      this.inputModel = this.data.arrayProperty.properties[this.data.rowIndex].value;
    }
    else {
      this.inputModel = {} as fhir.Identifier;
    }
    this.changedValue = this.inputModel;
    this.rowIndex = this.data.rowIndex >= 0 ? this.data.rowIndex : 0;

    const dialogRefs = this.matDialogService.openDialogs;
    const pathArray = dialogRefs.reduce((acc, dRef) => {
      const instance = dRef.componentInstance;
      if (instance instanceof IdentifierDlgComponent) {
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
   * Move the dialog to match the host element's current screen position.
   */
  movePosition() {
    const current_origin = this.hostEl.nativeElement.parentElement.getBoundingClientRect();
    this.matDialogRef.updatePosition({top: (current_origin.top)+'px', left: (current_origin.left)+'px'});
    this.previous_origin = current_origin;
  }

  /**
   * Ng AfterViewInit lifecycle hook.
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
    this.matDialogRef.close(this.changedValue);
  }

  /**
   * Get the input value as a FHIR Identifier.
   *
   * @returns Identifier model supplied to the dialog.
   */
  getInputModel() {
    return this.inputModel as fhir.Identifier;
  }


  /**
   * Handle the Identifier change event.
   *
   * @param event - The Identifier object that has changed.
   */
  onChange(event: any) {
    this.changedValue = event;
    this.updateDisableSave();
    this.cdr.detectChanges();

  }

  /**
   * Update the disableSave signal based on dirty state and use-field validity.
   */
  private updateDisableSave() {
    const isDirty = !!this.dlgContent?.nativeElement.querySelector('.ng-dirty');
    this.disableSave.set(!isDirty);
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
   * Clean up observers when the dialog is destroyed.
   */
  ngOnDestroy() {
    this.dirtyObserver?.disconnect();
  }
}
