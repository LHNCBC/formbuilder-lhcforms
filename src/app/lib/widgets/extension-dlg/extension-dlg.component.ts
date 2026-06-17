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
import {ExtensionsService} from "../../../services/extensions.service";
import { DialogData } from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {ExtensionObjComponent} from "../extension-obj/extension-obj.component";
import {TableRowDialogBase} from "../table-row-dialog-base/table-row-dialog-base";
import {Util} from "../../util";

/**
 * A dialog component to edit a FHIR Extension object.
 */
@Component({
  selector: 'lfb-extension-dlg',
  imports: [ExtensionObjComponent, MatDialogTitle, MatDialogContent, MatIconButton, MatDialogActions, MatIconModule, MatTabsModule, MatTooltip ],
  templateUrl: './extension-dlg.component.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    .extension-dlg-container {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 0;
    }

    .dlg-content {
      flex: 1 1 auto;
      max-height: none;
      min-height: 0;
    }

    .close-button {
      float: right;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtensionDlgComponent extends TableRowDialogBase<fhir.Extension> implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dlgContent', {static: false, read: ElementRef}) declare dlgContent: ElementRef;
  @ViewChild('dlgContainer', {static: false, read: ElementRef}) declare dlgContainer: ElementRef;
  @ViewChild(ExtensionObjComponent) extensionObj: ExtensionObjComponent;

  formService: FormService = inject(FormService);
  extensionsService = inject(ExtensionsService);

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
   * Create a new Extension row model.
   */
  protected createNewModel(): fhir.Extension {
    return {url: ''};
  }

  /**
   * Check if the URL field has a valid URI (non-empty).
   */
  private isUrlValid(): boolean {
    const url = (this.changedValue?.url || '').trim();
    return url.length > 0;
  }

  /**
   * Require a valid URL before saving an Extension row.
   */
  protected override isSaveAllowed(): boolean {
    return this.isUrlValid();
  }

  /**
   * Refresh Extension helper fields after structural edits such as nested row deletion.
   */
  protected override beforeSave(value: fhir.Extension): fhir.Extension {
    const currentValue = this.getCurrentFormPropertyValue(this.extensionObj?.sfFormRootProperty) as fhir.Extension || value;
    return this.extensionsService.updateExtension(currentValue);
  }

  /**
   * Rebuild the current value from the form-property tree instead of relying on cached parent values.
   */
  private getCurrentFormPropertyValue(property: any): any {
    if (!property) {
      return undefined;
    }

    if (Array.isArray(property.properties)) {
      return property.properties
        .map((child) => this.getCurrentFormPropertyValue(child))
        .filter((childValue) => !Util.isEmpty(childValue));
    }

    if (property.properties && typeof property.properties === 'object') {
      const value: {[key: string]: any} = {};
      Object.keys(property.properties).forEach((key) => {
        const child = property.properties[key];
        if (child?.visible === false) {
          return;
        }
        const childValue = this.getCurrentFormPropertyValue(child);
        if (!Util.isEmpty(childValue)) {
          value[key] = childValue;
        }
      });
      return value;
    }

    return property.value;
  }
}
