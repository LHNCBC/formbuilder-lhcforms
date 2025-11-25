import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
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
import {SchemaService} from "../../../services/schema.service";
import {FormService} from "../../../services/form.service";

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
export class ExtensionComponent extends TableEditRowInDlgComponent implements OnInit, AfterViewInit {

  extensionsService: ExtensionsService = inject(ExtensionsService);
  formService = inject(FormService);
  schemaService = inject(SchemaService);

  constructor() {
    super();
    this.dialogComponentType = ExtensionDlgComponent;

  }

  ngOnInit(): void {
    this._adjustControlClassesForTableCellWidgets();
    super.ngOnInit();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    const sub = this.formProperty.valueChanges.subscribe((valueArray: fhir.Extension []) => {
      this.valueUpdate(valueArray);
    });
    this.subscriptions.push(sub);
  }

  valueUpdate(valueArray: fhir.Extension[]) {
    (valueArray || []).forEach((ext: fhir.Extension) => {
      this.updateExtension(ext);
    });
  }

  updateExtension(newValue: fhir.Extension ) {
    if(newValue) {

      const extSchema: ISchema = this.formService.getExtensionSchema();
      const valueXCategoryMap = this.schemaService.valueXCategoryMap;
      Object.keys(valueXCategoryMap).forEach(valueX => {
        delete newValue['__$valueTypeCategory'];
        delete newValue[valueXCategoryMap[valueX]];
      });
      // If the new value is an extension, we need to set the __$isValueX and __$valueType properties
      // so that the dialog can handle it correctly.
      const valueX = Object.keys(newValue).find(key => key.startsWith('value'));
      newValue['__$isValueX'] = !!valueX;
      if(newValue['__$isValueX']) {
        newValue['__$valueType'] = valueX;
        // this.categoryTypeMap is initialized in ngOnInit.
        const categoryTypeMap = this.schemaService.valueXCategoryMap;
        newValue['__$valueTypeCategory'] = categoryTypeMap[valueX];
        newValue[categoryTypeMap[valueX]] = valueX;
        newValue['__$stringify'] = JSON.stringify(newValue[valueX]);
      }
      else {
        newValue['__$valueType'] = 'extension';
        newValue['__$stringify'] = JSON.stringify(newValue.extension);
      }

    }
    return newValue;
  }

  override addNewItem(newValue: fhir.Extension) {
    this.updateExtension(newValue);
    super.addNewItem(newValue);
  }

  _isDisabled(arrayProperty: ArrayProperty, index: number): boolean {
    const extensionProp = arrayProperty.properties[index] as ObjectProperty;
    return this.extensionsService.isNotEditableInDlg(extensionProp.value.url);
  }

  _adjustControlClassesForTableCellWidgets() {
    const extSchema = this.formService.getExtensionSchema();
    Object.keys(extSchema.properties).forEach((key) => {
      const widgetObj = extSchema.properties[key].widget;
      if(widgetObj) {
        widgetObj.controlClasses += ' p-0'
      }
    });
  }

  override isDisabled = this._isDisabled.bind(this);

}
