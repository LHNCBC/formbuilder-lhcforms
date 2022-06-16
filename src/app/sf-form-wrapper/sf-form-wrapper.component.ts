import {
  AfterViewInit,
  Component,
  EventEmitter, Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import {SharedObjectService} from '../services/shared-object.service';
import {FormService} from '../services/form.service';
import {LinkIdCollection} from '../item/item.component';
import {FormComponent, FormProperty, PropertyGroup} from 'ngx-schema-form';
import {ExtensionsService} from '../services/extensions.service';

/**
 * This class is intended to isolate customization of sf-form instance.
 */
@Component({
  selector: 'lfb-sf-form-wrapper',
  templateUrl: './sf-form-wrapper.component.html',
  styleUrls: ['./sf-form-wrapper.component.css'],
  providers: [ExtensionsService]
})
export class SfFormWrapperComponent implements AfterViewInit, OnDestroy {
  @ViewChild('itemForm') itemForm: FormComponent;

  validators = {
    /**
     * __$start and ++$end are custom internal fields. They are used to identify item loading into the editor.
     * These fields are hidden type. Their validation runs only once when the item is loaded.
     */
    '/__$start': (value, formProperty: FormProperty, rootProperty: PropertyGroup) => {
      //
      this.formService.loading = true;
      return null;
    },
    '/__$end': (value, formProperty: FormProperty, rootProperty: PropertyGroup) => {
      // At the end of loading, setup extensions service.
      const extensionsProp = rootProperty.getProperty('extension');
      const formPropertyChanged = extensionsProp !== this.extensionsService.extensionsProp;
      if(formPropertyChanged) {
        this.extensionsService.setExtensions(extensionsProp);
      }
      this.formService.loading = false;
      return null;
    },
    '/type': (value: string, formProperty: FormProperty, rootProperty: PropertyGroup) => {
      // Internally represent display type as group. Identifying display/group type is deferred until
      // the form is converted to json output.
      if(value === 'display') {
        formProperty.setValue('group', true);
      }
    }
  };

  mySchema: any = {properties: {}};
  myTestSchema: any;
  @Output()
  setLinkId = new EventEmitter();
  @Input()
  model: any;
  @Output()
  modelChange = new EventEmitter<any>();
  @Output()
  valueChange = new EventEmitter<any>();
  @Input()
  linkIdCollection = new LinkIdCollection();

  constructor(private extensionsService: ExtensionsService, private modelService: SharedObjectService, private formService: FormService) {
    this.mySchema = formService.getItemSchema();
  }

  ngAfterViewInit() {
    // this.extensionsService.setExtensions((this.itemForm.rootProperty as PropertyGroup).getProperty('extension'));
  }


  /**
   * Handle value change event.
   * @param value - Angular event
   */
  updateValue(value) {
    this.valueChange.emit(value);
    this.modelChange.emit(this.model);
  }


  ngOnDestroy() {
  }
}
