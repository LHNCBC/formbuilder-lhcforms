import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy, OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {FormComponent, PropertyGroup, SchemaFormModule, TemplateSchemaModule} from "@lhncbc/ngx-schema-form";
import fhir from "fhir/r4";
import {FormsModule} from "@angular/forms";

import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';
import {TableService} from "../../../services/table.service";
import {Subscription} from "rxjs";

/**
 * A component to edit a FHIR Extension object.
 */
@Component({
  selector: 'lfb-extension-obj',
  imports: [
    TemplateSchemaModule,
    FormsModule,
    SchemaFormModule
  ],
  templateUrl: './extension-obj.component.html',
  providers: [TableService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExtensionObjComponent implements AfterViewInit, OnDestroy {

  subscriptions: Subscription [] = [];
  extensionsService = inject(ExtensionsService);
  formService = inject(FormService);
  @ViewChild('sfForm', {read: FormComponent}) sfForm: FormComponent;
  @Output() onChange = new EventEmitter<fhir.Extension>();

  @Input() model;
  extSchema = this.formService.getExtensionSchema();
  sfFormRootProperty: PropertyGroup;

  constructor(private cdr: ChangeDetectorRef) {
  }

  ngAfterViewInit() {
    this.sfFormRootProperty = this.sfForm.rootProperty as PropertyGroup;
    // Subscribe to value type category changes to update the value[x] field accordingly.
    // This observes the category radio buttons on the UI.
    const sub = this.sfFormRootProperty.getProperty('__$valueTypeCategory').valueChanges.subscribe((newCategory) => {
      this.handler(newCategory);
    });
    this.subscriptions.push(sub);
    // These fields have their own select controls listing their value[x] options.
    ['__$valueTypePrimitive', '__$valueGeneralPurposeDatatype', '__$valueMetadataType', '__$valueSpecialPurposeDatatype'].forEach((category) => {
      const sub = this.sfFormRootProperty.getProperty(category).valueChanges.subscribe((valueX: string) => {
        this.handler(category);
      });
      this.subscriptions.push(sub);
    });
    this.handler(this.sfFormRootProperty.getProperty('__$valueTypeCategory').value);
    this.cdr.detectChanges();
  }

  /**
   *
   * @param typeCategory
   */
  handler (typeCategory: string)  {
    const valueXProp = this.sfFormRootProperty.getProperty('__$valueType');
    const categoryTypeProp = this.sfFormRootProperty.getProperty(typeCategory);
    if (categoryTypeProp.visible && categoryTypeProp.value !== valueXProp.value) {
      valueXProp.setValue(categoryTypeProp.value, false);
    }
  }

  /**
   * Handle changes to the <sf-form>.
   * @param value
   */
  handleChange(value: fhir.Extension) {
    this.extensionsService.updateExtension(value);
    this.onChange.emit(value);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub?.unsubscribe());
  }
}
