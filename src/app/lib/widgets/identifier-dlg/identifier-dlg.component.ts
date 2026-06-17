import {
  ViewChild,
  Component,
  inject,
  ElementRef,
  OnInit,
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
import { FormService } from 'src/app/services/form.service';
import { DialogData } from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {IdentifierObjComponent} from "../identifier-obj/identifier-obj.component";
import {TableRowDialogBase} from "../table-row-dialog-base/table-row-dialog-base";

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
export class IdentifierDlgComponent extends TableRowDialogBase<fhir.Identifier> implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dlgContent', {static: false, read: ElementRef}) declare dlgContent: ElementRef;
  @ViewChild('dlgContainer', {static: false, read: ElementRef}) declare dlgContainer: ElementRef;

  formService: FormService = inject(FormService);

  constructor() {
    super(
      inject<DialogData>(MAT_DIALOG_DATA),
      inject(MatDialogRef<DialogData>),
      inject(MatDialog),
      inject(NgbModal),
      inject(ElementRef),
      inject(ChangeDetectorRef)
    );
  }

  /**
   * Create a new Identifier row model.
   */
  protected createNewModel(): fhir.Identifier {
    return {} as fhir.Identifier;
  }
}
