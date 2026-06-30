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
  imports: [IdentifierObjComponent, MatDialogTitle, MatDialogContent, MatIconButton, MatDialogActions, MatIconModule, MatTooltip ],
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
  @ViewChild(IdentifierObjComponent) identifierObj!: IdentifierObjComponent;

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
   *
   * @returns Empty Identifier model for add-new flow.
   */
  protected createNewModel(): fhir.Identifier {
    return {} as fhir.Identifier;
  }

  /**
   * Wrap Reference.identifier as an array for the table-based UI.
   *
   * @param value - Identifier value loaded into the dialog.
   * @returns Identifier model adapted for table-based recursive editing.
   */
  protected override prepareInputModel(value: fhir.Identifier): fhir.Identifier {
    const model = this.cloneIdentifier(value);
    return this.wrapAssignerIdentifierForUi(model);
  }

  /**
   * Unwrap Reference.identifier from the table UI shape back to FHIR shape.
   *
   * @param value - Identifier value collected from the dialog form.
   * @returns Identifier model normalized for persistence.
   */
  protected override beforeSave(value: fhir.Identifier): fhir.Identifier {
    const currentValue = this.identifierObj?.sfFormRootProperty
      ? this.getCurrentFormPropertyValue(this.identifierObj.sfFormRootProperty) as fhir.Identifier
      : value;
    const model = this.cloneIdentifier(currentValue);
    // Nested identifier dialogs must keep the UI array wrapper so parent dialogs
    // can continue editing recursive rows without type-mismatch resets.
    if (this.isNestedIdentifierDialog() || this.isUsageContextReferenceIdentifierDialog()) {
      return model;
    }
    return this.unwrapAssignerIdentifierForFhir(model);
  }

  /**
   * Use the live form-property tree so structural table edits are included in dirty checks.
   *
   * @returns Current form tree value used for change detection.
   */
  protected override getCurrentValueForChangeDetection(): unknown {
    return this.identifierObj?.sfFormRootProperty
      ? this.getCurrentFormPropertyValue(this.identifierObj.sfFormRootProperty)
      : this.changedValue;
  }

  /**
   * Wrap nested Reference.identifier values as arrays for table-based editing.
   *
   * @param model - Identifier model to transform.
   * @returns Identifier model with recursive identifier nodes array-wrapped.
   */
  private wrapAssignerIdentifierForUi(model: fhir.Identifier): fhir.Identifier {
    const assignerIdentifier = model.assigner?.identifier;
    if(assignerIdentifier && !Array.isArray(assignerIdentifier)) {
      this.wrapAssignerIdentifierForUi(assignerIdentifier as fhir.Identifier);
      (model.assigner as any).identifier = [assignerIdentifier];
    }
    else if(Array.isArray(assignerIdentifier)) {
      assignerIdentifier.forEach((identifier) => this.wrapAssignerIdentifierForUi(identifier as fhir.Identifier));
    }
    return model;
  }

  /**
   * Unwrap nested Reference.identifier table arrays back to FHIR object shape.
   *
   * @param model - Identifier model to transform.
   * @returns Identifier model with recursive identifier nodes unwrapped.
   */
  private unwrapAssignerIdentifierForFhir(model: fhir.Identifier): fhir.Identifier {
    const assignerIdentifier = model.assigner?.identifier;
    if(Array.isArray(assignerIdentifier)) {
      if(assignerIdentifier.length) {
        const identifier = this.unwrapAssignerIdentifierForFhir(assignerIdentifier[0] as fhir.Identifier);
        (model.assigner as any).identifier = identifier;
      }
      else {
        delete (model.assigner as any).identifier;
      }
    }
    else if(assignerIdentifier) {
      this.unwrapAssignerIdentifierForFhir(assignerIdentifier as fhir.Identifier);
    }
    return model;
  }

  /**
   * Clone identifier data before adapting UI-only fields.
   *
   * @param value - Source identifier value.
   * @returns Deep-cloned identifier object.
   */
  private cloneIdentifier(value: fhir.Identifier): fhir.Identifier {
    return JSON.parse(JSON.stringify(value || {}));
  }

  /**
   * True when another Identifier dialog is already open above the current one.
   *
   * @returns True when current dialog is nested; otherwise false.
   */
  private isNestedIdentifierDialog(): boolean {
    const count = this.matDialogService.openDialogs.filter((dialogRef) =>
      dialogRef.componentInstance instanceof IdentifierDlgComponent
    ).length;
    return count > 1;
  }

  /**
   * True when this Identifier row is owned by UsageContext.valueReference.identifier.
   *
   * That parent field is array-wrapped for the table UI and gets unwrapped by
   * UsageContextDlgComponent on save, so the identifier dialog must keep nested
   * assigner.identifier rows in UI shape while returning to that parent.
   *
   * @returns True when this dialog is editing UsageContext.valueReference.identifier.
   */
  private isUsageContextReferenceIdentifierDialog(): boolean {
    const path = this.data.arrayProperty?.path || '';
    return path.includes('valueReference') && path.includes('identifier');
  }
}
