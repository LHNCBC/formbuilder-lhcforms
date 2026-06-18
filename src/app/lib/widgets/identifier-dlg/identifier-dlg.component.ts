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
  @ViewChild(IdentifierObjComponent) identifierObj: IdentifierObjComponent;

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

  /**
   * Wrap Reference.identifier as an array for the table-based UI.
   */
  protected override prepareInputModel(value: fhir.Identifier): fhir.Identifier {
    const model = this.cloneIdentifier(value);
    return this.wrapAssignerIdentifierForUi(model);
  }

  /**
   * Unwrap Reference.identifier from the table UI shape back to FHIR shape.
   */
  protected override beforeSave(value: fhir.Identifier): fhir.Identifier {
    const currentValue = this.identifierObj?.sfFormRootProperty
      ? this.getCurrentFormPropertyValue(this.identifierObj.sfFormRootProperty) as fhir.Identifier
      : value;
    const model = this.cloneIdentifier(currentValue);
    return this.unwrapAssignerIdentifierForFhir(model);
  }

  /**
   * Use the live form-property tree so structural table edits are included in dirty checks.
   */
  protected override getCurrentValueForChangeDetection(): unknown {
    return this.identifierObj?.sfFormRootProperty
      ? this.getCurrentFormPropertyValue(this.identifierObj.sfFormRootProperty)
      : this.changedValue;
  }

  /**
   * Wrap nested Reference.identifier values as arrays for table-based editing.
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
   */
  private cloneIdentifier(value: fhir.Identifier): fhir.Identifier {
    return JSON.parse(JSON.stringify(value || {}));
  }
}
