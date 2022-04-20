import {
  AfterViewInit,
  Component,
  EventEmitter, Input,
  OnChanges,
  OnDestroy,
  OnInit, Output,
  SimpleChanges, ViewChild
} from '@angular/core';
import {SharedObjectService} from '../services/shared-object.service';
import {FormService} from '../services/form.service';
import {LinkIdCollection} from '../item/item.component';
import {FormComponent, PropertyGroup} from 'ngx-schema-form';
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
export class SfFormWrapperComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('itemForm') itemForm: FormComponent;

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
    this.extensionsService.setExtensions((this.itemForm.rootProperty as PropertyGroup).getProperty('extension'));
  }


  /**
   * Handle onChange event.
   * @param changes - Changes from host component.
   */
  ngOnChanges(changes: SimpleChanges) {
    console.log('sf-form-wrapper.ngOnChanges()');
    if(changes.model) {
      console.log('sf-form-wrapper.ngOnChanges(): model changed');
      this.extensionsService.setExtensions((this.itemForm.rootProperty as PropertyGroup).getProperty('extension'));
    }
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
