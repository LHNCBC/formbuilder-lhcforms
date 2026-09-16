import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {ComponentType} from '@angular/cdk/portal';
import {ExtensionDlgComponent} from "../extension-dlg/extension-dlg.component";
import {
  DialogData,
  TableEditRowInDlgComponent
} from "../table-edit-row-in-dlg/table-edit-row-in-dlg.component";
import {AppFormElementComponent} from "../form-element/form-element.component";
import {BooleanControlledComponent} from "../boolean-controlled/boolean-controlled.component";
import {LabelComponent} from "../label/label.component";
import {TitleComponent} from "../title/title.component";
import {
  ArrayProperty,
  ISchema,
  ObjectProperty,
  SchemaFormModule
} from "@lhncbc/ngx-schema-form";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {MAT_DIALOG_DATA, MatDialogModule} from "@angular/material/dialog";
import {MatTooltip} from "@angular/material/tooltip";
import {ExtensionEditorScope, ExtensionsService} from "../../../services/extensions.service";
import {IsDisabledPipe} from "../../pipes/is-disabled.pipe";
import fhir from "fhir/r4";
import {FormService} from "../../../services/form.service";
import {SharedObjectService} from "../../../services/shared-object.service";

/**
 * A component to edit FHIR extensions as a table with each row representing an extension.
 * Each row can be edited in a dialog.
 *
 */
@Component({
  selector: 'lfb-extension',
  imports: [
    AppFormElementComponent,
    BooleanControlledComponent,
    LabelComponent,
    TitleComponent,
    SchemaFormModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    FontAwesomeModule,
    NgbModule,
    MatDialogModule,
    MatTooltip,
    IsDisabledPipe
  ],
  templateUrl: '../table/table.component.html',
  styleUrl: '../table/table.component.css',
})
export class ExtensionComponent extends TableEditRowInDlgComponent implements OnInit, AfterViewInit /*, OnChanges*/ {
  extensionsService: ExtensionsService = inject(ExtensionsService);
  formService = inject(FormService);
  modelService = inject(SharedObjectService);
  cdr = inject(ChangeDetectorRef);
  private readonly parentDialogData = inject<Partial<DialogData>>(MAT_DIALOG_DATA, {optional: true});

  extensionSchema: ISchema = {};

  constructor() {
    super();
    this.dialogComponentType = ExtensionDlgComponent;

  }

  /**
   * Add the owning Questionnaire scope so managed-extension guidance can point
   * to fields that only exist on the form or on an item.
   */
  override openDialog(contentData: DialogData, contentDlg: ComponentType<unknown>) {
    const inheritedScope = this.parentDialogData?.extensionEditorScope;
    const rootProperties = this.formProperty?.findRoot()?.schema?.properties || {};
    let extensionEditorScope: ExtensionEditorScope = 'form';
    if(Object.prototype.hasOwnProperty.call(rootProperties, 'linkId')) {
      extensionEditorScope = 'item';
    }
    else if(inheritedScope === 'form' || inheritedScope === 'item') {
      // A nested Extension form has no linkId, so retain the scope passed to
      // the dialog that owns it instead of treating it as a form-level field.
      extensionEditorScope = inheritedScope;
    }
    return super.openDialog({...contentData, extensionEditorScope}, contentDlg);
  }

  ngOnInit(): void {
    this.addDefaultItemIfEmpty = false;
    this.extensionSchema = this.formService.getExtensionSchema();
    this._adjustControlClassesForTableCellWidgets();
    super.ngOnInit();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub = this.modelService.modelInitialized$.subscribe(() => {
      this.init();
    });
    this.subscriptions.push(sub);
  }

  init() {
    const valueArray = this.valueUpdate(this.formProperty.value);
    this.formProperty.setValue(valueArray, false);
  }
  /**
   * Update extension values of __$[x] fields in the given array.
   * @param valueArray - The array of extensions to update.
   */
  valueUpdate(valueArray: fhir.Extension[]) {
    (valueArray || []).forEach((ext: fhir.Extension) => {
      this.extensionsService.updateExtension(ext);
    });
    return valueArray;
  }

  /**
   * Override to update extension value before adding it to the table row.
   * @param newValue
   */
  override addNewItem(newValue: fhir.Extension) {
    this.extensionsService.updateExtension(newValue);
    super.addNewItem(newValue);
  }

  /**
   * Determine if the extension property at the given index is disabled (not editable) in the dialog.
   * @param arrayProperty - The array property representing the extensions.
   * @param index - The index of the extension property in the array.
   * @returns true if the extension is not editable in the dialog, false otherwise.
   */
  _isDisabled(arrayProperty: ArrayProperty, index: number): boolean {
    const extensionProp = arrayProperty.properties[index] as ObjectProperty;
    const url = extensionProp.value.url;
    return this.extensionsService.isNotEditableInDlg(url) || this.isExtensionUrlOwnedByWidget(url);
  }

  /**
   * Check if an extension URL is edited by a schema-backed custom widget on this form.
   * This keeps widget-owned proxy fields from becoming editable in the generic
   * extension table while allowing those URLs to be managed in other schemas.
   * @param url - The canonical URL of the extension to check.
   * @returns true if a schema-backed custom widget owns the extension URL, false otherwise.
   */
  isExtensionUrlOwnedByWidget(url: string): boolean {
    const rootSchema = this.formProperty.findRoot()?.schema;
    return this.extensionsService.isExtensionUrlOwnedByWidget(url, rootSchema);
  }

  /**
   * Adjust controlClasses of extension property widgets to fit in table cells.
   */
  _adjustControlClassesForTableCellWidgets() {
    const mergeClasses = (list1: string, list2: string) => {
      const s1 = new Set(list1?.split(/\s+/).filter(e => !!e));
      const s2 = new Set(list2?.split(/\s+/).filter(e => !!e));
      Array.from(s2).forEach((cls) => s1.add(cls));
      const ret = Array.from(s1).join(' ');
      return ret || null;
    };
    // Add padding 0 to all extension property widgets to fit in table cells.
    Object.keys(this.extensionSchema.properties).forEach((key) => {
      const widgetObj = this.extensionSchema.properties[key].widget;
      if(widgetObj) {
        widgetObj.controlClasses = mergeClasses(widgetObj.controlClasses, 'p-0');
      }
    });
  }

  /**
   * Hide rows in the extension table that are not editable in the dialog.
   * Uses the same global and schema-scoped ownership rules as the row actions.
   */
  hideUneditableRows() {
    const extArray = this.formProperty.value;
    this.hideRows.clear();
    for(let i = 0; i < extArray.length; i++) {
      if(this._isDisabled(this.formProperty, i)) {
        this.hideRows.add(i);
      }
    }
  }

  /**
   * Show all rows in the extension table.
   */
  showAllRows() {
    this.hideRows.clear();
  }

  override isDisabled = this._isDisabled.bind(this);

}
