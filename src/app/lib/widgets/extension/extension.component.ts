import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import {ExtensionDlgComponent} from "../extension-dlg/extension-dlg.component";
import {TableEditRowInDlgComponent} from "../table-edit-row-in-dlg/table-edit-row-in-dlg.component";
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
import {MatDialogModule} from "@angular/material/dialog";
import {MatTooltip} from "@angular/material/tooltip";
import {ExtensionsService} from "../../../services/extensions.service";
import {IsDisabledPipe} from "../../pipes/is-disabled.pipe";
import fhir from "fhir/r4";
import {FormService} from "../../../services/form.service";

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
export class ExtensionComponent extends TableEditRowInDlgComponent implements OnInit, AfterViewInit, OnChanges {

  @Input()
  templateFormProperty: ArrayProperty;
  extensionsService: ExtensionsService = inject(ExtensionsService);
  formService = inject(FormService);
  cdr = inject(ChangeDetectorRef);
  extensionSchema: ISchema = {};

  constructor() {
    super();
    this.dialogComponentType = ExtensionDlgComponent;

  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.templateFormProperty) {
      this.formProperty = this.templateFormProperty;
    }
    super.ngOnChanges(changes);
  }

  ngOnInit(): void {
    this.addDefaultItemIfEmpty = false;
    this.extensionSchema = this.formService.getExtensionSchema();
    this._adjustControlClassesForTableCellWidgets();
    super.ngOnInit();
    const valueArray = this.valueUpdate(this.formProperty.value);
    this.formProperty.setValue(valueArray, true);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    const sub = this.formProperty.valueChanges.subscribe((valueArray: fhir.Extension []) => {
      this.valueUpdate(valueArray);
    });
    this.subscriptions.push(sub);
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
    return this.extensionsService.isNotEditableInDlg(extensionProp.value.url);
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
   * Used to hide standard extensions that should not be modified. These extensions are
   * defined in the ExtensionsService.
   */
  hideUneditableRows() {
    const extArray = this.formProperty.value;
    this.hideRows.clear();
    for(let i = 0; i < extArray.length; i++) {
      const ext = extArray[i];
      if(this.extensionsService.isNotEditableInDlg(ext.url)) {
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
