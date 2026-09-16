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

export interface DuplicateUrlErrorState {
  url: string;
  message: string;
}

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
  cdr = inject(ChangeDetectorRef);
  extensionsService = inject(ExtensionsService);
  formService = inject(FormService);
  @ViewChild('sfForm', {read: FormComponent}) sfForm: FormComponent;
  @Output() changed = new EventEmitter<fhir.Extension>();

  @Input() model;
  private _duplicateUrlError: DuplicateUrlErrorState | null = null;

  @Input()
  set duplicateUrlError(error: DuplicateUrlErrorState | null) {
    this._duplicateUrlError = error;
    this.updateUrlValidationError();
  }

  private _managedUrlError: string | null = null;

  @Input()
  set managedUrlError(error: string | null) {
    this._managedUrlError = error;
    this.updateUrlValidationError();
  }

  extSchema = this.formService.getExtensionSchema();
  sfFormRootProperty: PropertyGroup;

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
    this.updateUrlValidationError();
    this.cdr.detectChanges();
  }

  /**
   * Add the dialog's URL checks to the URL form property so the URL widget
   * renders and announces them like its schema validation errors.
   */
  private updateUrlValidationError() {
    const urlProperty = this.sfFormRootProperty?.getProperty('url');
    if (!urlProperty) {
      return;
    }

    // Re-run the schema validators first to remove previous dialog errors while
    // preserving any built-in URL errors.
    urlProperty.updateValueAndValidity(true, false);
    if (this._duplicateUrlError) {
      urlProperty.extendErrors({
        code: 'DUPLICATE_EXTENSION_URL',
        path: '#url',
        message: this._duplicateUrlError.message,
        params: []
      });
    }
    if (this._managedUrlError) {
      urlProperty.extendErrors({
        code: 'MANAGED_EXTENSION_URL',
        path: '#url',
        message: this._managedUrlError,
        params: []
      });
    }
    this.cdr.markForCheck();
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
    this.changed.emit(value);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub?.unsubscribe());
  }
}
