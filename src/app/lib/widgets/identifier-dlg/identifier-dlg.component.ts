import {
  ViewChild,
  Component,
  inject,
  ElementRef,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import fhir from 'fhir/r4';
import { FormService } from 'src/app/services/form.service';
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
  // Lazy recursive Identifier editing returns deeper assigner.identifier values
  // through parent dialogs whose one-level schema does not render those fields.
  protected override preserveUnknownObjectFields = true;

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
    if (this.isNestedIdentifierDialog()) {
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
    const stack = [model as any];
    const seen = new WeakSet<object>();

    while(stack.length) {
      const current = stack.pop();
      if(!this.isObjectLike(current) || seen.has(current)) {
        continue;
      }
      seen.add(current);

      const currentIdentifier = current as any;
      const assignerIdentifier = currentIdentifier.assigner?.identifier;
      if(Array.isArray(assignerIdentifier)) {
        assignerIdentifier.forEach((identifier) => {
          if(this.isObjectLike(identifier)) {
            stack.push(identifier);
          }
        });
      }
      else if(this.isObjectLike(assignerIdentifier)) {
        currentIdentifier.assigner.identifier = [assignerIdentifier];
        stack.push(assignerIdentifier);
      }
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
    const stack = [model as any];
    const seen = new WeakSet<object>();

    while(stack.length) {
      const current = stack.pop();
      if(!this.isObjectLike(current) || seen.has(current)) {
        continue;
      }
      seen.add(current);

      const currentIdentifier = current as any;
      const assignerIdentifier = currentIdentifier.assigner?.identifier;
      if(Array.isArray(assignerIdentifier)) {
        const identifier = assignerIdentifier[0];
        if(this.isObjectLike(identifier)) {
          currentIdentifier.assigner.identifier = identifier;
          stack.push(identifier);
        }
        else {
          delete currentIdentifier.assigner.identifier;
        }
      }
      else if(this.isObjectLike(assignerIdentifier)) {
        stack.push(assignerIdentifier);
      }
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
    return this.cloneValue(value || {}) as fhir.Identifier;
  }

  /**
   * Clone arbitrary identifier data without recursing through the call stack.
   *
   * @param value - Source value.
   * @returns Deep-cloned value.
   */
  private cloneValue(value: unknown): unknown {
    if(!this.isObjectLike(value)) {
      return value;
    }

    const root = Array.isArray(value) ? [] : {};
    const seen = new WeakMap<object, any>([[value, root]]);
    const stack = [{source: value as any, target: root as any}];

    while(stack.length) {
      const {source, target} = stack.pop();
      Object.keys(source).forEach((key) => {
        const child = source[key];
        if(!this.isObjectLike(child)) {
          target[key] = child;
          return;
        }

        if(seen.has(child)) {
          target[key] = seen.get(child);
          return;
        }

        const clonedChild = Array.isArray(child) ? [] : {};
        seen.set(child, clonedChild);
        target[key] = clonedChild;
        stack.push({source: child, target: clonedChild});
      });
    }

    return root;
  }

  /**
   * Check whether a value can be tracked by WeakSet/WeakMap traversal.
   *
   * @param value - Value to check.
   * @returns True when value is a non-null object.
   */
  private isObjectLike(value: unknown): value is object {
    return !!value && typeof value === 'object';
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
}
