import {
  Component,
  EventEmitter, Input,
  Output,
  ViewChild
} from '@angular/core';
import {SharedObjectService} from '../services/shared-object.service';
import {FormService} from '../services/form.service';
import {LinkIdCollection} from '../item/item.component';
import {FormComponent, FormProperty, PropertyGroup} from 'ngx-schema-form';
import {ExtensionsService} from '../services/extensions.service';
import {ObjectProperty} from 'ngx-schema-form/lib/model';
import {Util} from '../lib/util';

/**
 * This class is intended to isolate customization of sf-form instance.
 */
@Component({
  selector: 'lfb-sf-form-wrapper',
  templateUrl: './sf-form-wrapper.component.html',
  styleUrls: ['./sf-form-wrapper.component.css'],
  providers: [ExtensionsService]
})
export class SfFormWrapperComponent {
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
      return null;
    },
    '/enableWhen/*': (value: any, formProperty: ObjectProperty, rootProperty: PropertyGroup) => {
      const aType = formProperty.getProperty('__$answerType').value;
      const q = formProperty.getProperty('question');
      const op = formProperty.getProperty('operator');
      const aField = Util.getAnswerFieldName(aType || 'string');
      const answerX = formProperty.getProperty(aField);
      let errors: any[] = [];
      if((q?.value?.trim().length > 0) ) {
        if(!(op?.value?.trim().length > 0)) {
          const errorCode = 'ENABLEWHEN_OP_REQUIRED';
          const err: any = {};
          err.code = errorCode;
          err.path = `#${op.canonicalPathNotation}`;
          err.message = `Operator is required when you choose to add a condition`;
          err.params = [q.value, op.value];
          errors.push(err);
          const i = op._errors?.findIndex((e) => e.code === errorCode);
          if(!(i >= 0)) { // Check if the error is already processed.
            op.extendErrors(err);
          }
        }
        const aValue = answerX?.value;
        if(answerX && (Util.isEmpty(aValue)) && op?.value !== 'exists') {
          const errorCode = 'ENABLEWHEN_ANSWER_REQUIRED';
          const err: any = {};
          err.code = errorCode;
          err.path = `#${answerX.canonicalPathNotation}`;
          err.message = `Answer field is required when you choose an operator other than 'Not empty' or 'Empty'`;
          const valStr = JSON.stringify(aValue);
          err.params = [q.value, op.value, valStr];
          errors.push(err);
          const i = answerX._errors?.findIndex((e) => e.code === errorCode);
          if(!(i >= 0)) { // Check if the error is already processed.
            answerX.extendErrors(err);
          }
        }
      }
      if(errors.length) {
        formProperty.extendErrors(errors);
      }
      else {
        errors = null;
      }
      this.errorsChanged.next(errors);
      return errors;
    }
  };

  mySchema: any = {properties: {}};
  @Output()
  setLinkId = new EventEmitter();
  @Input()
  model: any;
  @Output()
  valueChange = new EventEmitter<any>();
  @Output()
  errorsChanged = new EventEmitter<any []>();
  @Input()
  linkIdCollection = new LinkIdCollection();

  constructor(private extensionsService: ExtensionsService, private modelService: SharedObjectService, private formService: FormService) {
    this.mySchema = formService.getItemSchema();
  }


  /**
   * Handle value change event.
   * @param value - Angular event
   */
  updateValue(value) {
    if(!this.formService.loading) { // Avoid emitting the changes while loading.
      // console.log('sf-form.onChange() emitted:');
      this.valueChange.emit(value);
    }
  }
}
