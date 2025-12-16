import {
  ViewChild,
  Component,
  inject,
  ElementRef,
  OnInit,
  signal,
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef
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
import {MessageDlgComponent} from "../message-dlg/message-dlg.component";
import { DialogData } from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {Util} from "../../util";
import {ExtensionObjComponent} from "../extension-obj/extension-obj.component";

/**
 * A dialog component to edit a FHIR Extension object.
 */
@Component({
  selector: 'lfb-extension-dlg',
  imports: [ExtensionObjComponent, MatDialogTitle, MatDialogContent, MatIconButton, MatDialogActions, MatIconModule, MatTabsModule, MatTooltip ],
  templateUrl: './extension-dlg.component.html',
  styles: [`
    .close-button {
      float: right;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtensionDlgComponent implements OnInit, AfterViewInit {
  inputModel: fhir.Extension;
  changedValue: fhir.Extension;
  path: string = '';
  @ViewChild('dlgContent', {static: false, read: ElementRef}) dlgContent: ElementRef;
  @ViewChild('dlgContainer', {static: false, read: ElementRef}) dlgContainer: ElementRef;

  matDialogService = inject(MatDialog);
  data = inject<DialogData>(MAT_DIALOG_DATA);
  matDialogRef = inject(MatDialogRef<DialogData>);
  formService: FormService = inject(FormService);
  ngbModalService: NgbModal = inject(NgbModal);
  disableSave = signal(true);

  dirtyObserver: MutationObserver;
  rowIndex = 0;
  previous_origin: {left: number, top: number};

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

  movePosition() {
    const current_origin = this.hostEl.nativeElement.parentElement.getBoundingClientRect();
    this.matDialogRef.updatePosition({top: (current_origin.top)+'px', left: (current_origin.left)+'px'});
    this.previous_origin = current_origin;
  }

  ngAfterViewInit() {

    /**
     * Observe the dialog content for changes to the form's dirty state.
     */
    this.dirtyObserver = new MutationObserver((mutationsList, observer) => {
      for(const mutation of mutationsList) {
        if (mutation.type === 'attributes' && (mutation.target as HTMLElement).classList?.contains('ng-dirty')) {
          this.disableSave.set(false);
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
   * Get the input value as a ValueSet.
   */
  getInputModel() {
    return this.inputModel as fhir.Extension;
  }


  /**
   * Handle the ValueSet change event.
   * @param event - The ValueSet object that has changed.
   */
  onChange(event: any) {
    this.changedValue = event;
    this.disableSave.set(false);
    this.cdr.detectChanges();

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
        type: 'warning',
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

  _disableSave() {
    let ret = !this.dlgContent?.nativeElement.querySelector('.ng-dirty');
    if (!ret) {
      // Check if the form is empty
      ret = Util.isEmpty(this.changedValue);
    }
    return ret;
  }
}
