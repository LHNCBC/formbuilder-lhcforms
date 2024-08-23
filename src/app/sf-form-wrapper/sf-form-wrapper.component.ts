import {
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter, Input, OnChanges,
  Output, SimpleChanges,
  ViewChild
} from '@angular/core';
import {FormService} from '../services/form.service';
import {LinkIdCollection} from '../item/item.component';
import {ArrayProperty, FormComponent, FormProperty, PropertyGroup} from '@lhncbc/ngx-schema-form';
import {ExtensionsService} from '../services/extensions.service';
import {ObjectProperty} from '@lhncbc/ngx-schema-form/lib/model';
import {Util} from '../lib/util';
import { SharedObjectService } from '../services/shared-object.service';

/**
 * This class is intended to isolate customization of sf-form instance.
 */
@Component({
  selector: 'lfb-sf-form-wrapper',
  templateUrl: './sf-form-wrapper.component.html',
  styleUrls: ['./sf-form-wrapper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ExtensionsService]
})
export class SfFormWrapperComponent implements OnInit, OnChanges, AfterViewInit {
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
    '/enableWhen': this.validateEnableWhenAll.bind(this),
    '/enableWhen/*': this.validateEnableWhenSingle.bind(this),
    '/linkId': this.validateLinkId.bind(this)
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
  @Output()
  validationErrorsChanged = new EventEmitter<any []>();
  @Input()
  linkIdCollection = new LinkIdCollection();
  loading = false;

  questionnaire;
  linkId;

  constructor(private extensionsService: ExtensionsService,
              private formService: FormService,
              private modelService: SharedObjectService) {
    this.mySchema = formService.getItemSchema();
  }

  ngOnInit(): void {
    // Subscribe to changes to the questionnaire and obtain a set of
    // unique link ids as a result.
    this.modelService.questionnaire$.subscribe((questionnaire) => {
      this.questionnaire = questionnaire;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.model) {
      this.loading = true;
      // Notify the changes to the form.
      this.formService.formChanged(changes.model);
      this.formService.resetForm();
    }
  }


  ngAfterViewInit() {
    this.adjustRootFormProperty();
  }

  /**
   * Handle value change event.
   * @param value - Angular event
   */
  updateValue(value) {
    if(!this.loading) { // Avoid emitting the changes while loading.
      this.valueChange.emit(value);
    }
  }

  onModelReset(value) {
    this.loading = false;
    // console.log('sf-form.onModelReset() emitted:');
    if(!this.adjustRootFormProperty()) {
      this.valueChange.emit(value);
    }
  }

  /**
   * Make any custom adjustments to root form property of the <sf-form>.
   * Typically, these changes may be done on '__$*' fields after the form is loaded with new model.
   */
  adjustRootFormProperty(): boolean {
    let ret = false;
    const rootProperty = this.itemForm?.rootProperty;
    // Emit the value after any adjustments.
    // Set '__$codeYesNo' to true, when 'code' is present. The default is false.
    if(!Util.isEmpty(rootProperty?.searchProperty('/code').value)) {
      // Loading is done. Change of value should emit the value in valueChanged().
      rootProperty?.searchProperty('/__$codeYesNo').setValue(true, false);
      ret = true;
    }
    return ret;
  }


  /**
   * Custom validator for enableWhen (Array of conditions).
   * @param value -  Value of the field.
   * @param arrayProperty - Array form property of the field.
   * @param rootProperty - Root form property
   */
  validateEnableWhenAll (value: any, arrayProperty: ArrayProperty, rootProperty: PropertyGroup) {
    let errors = null;
    // iterate all properties
    arrayProperty.forEachChild((property: ObjectProperty) => {
      const error = this.validateEnableWhenSingle(property.value, property, rootProperty)
      if (error) {
        errors = errors || []
        errors.push(error)
      }
    });
    this.errorsChanged.next(errors);
    return errors;
  }

  /**
   * Custom validator for single condition in enableWhen
   * @param value - Value of single enableWhen condition
   * @param formProperty - Object form property of the condition
   * @param rootProperty - Root form property
   */
  validateEnableWhenSingle (value: any, formProperty: ObjectProperty, rootProperty: PropertyGroup) {
    const aType = formProperty.getProperty('__$answerType').value;
    const q = formProperty.getProperty('question');
    const op = formProperty.getProperty('operator');
    const aField = Util.getAnswerFieldName(aType || 'string');
    const answerX = formProperty.getProperty(aField);
    const linkIdProperty = formProperty.findRoot().getProperty('linkId');

    let errors: any[] = [];
    if((q?.value?.trim().length > 0) && op?.value.length > 0) {
      const aValue = answerX?.value;

      // Validate whether the  'linkId' specified in the question exists.
      // If not, then throw the 'INVALID_QUESTION' error.
      if (!this.formService.isValidLinkId(q?.value)) {
        const errorCode = 'INVALID_QUESTION';
        const err: any = {};
        err.code = errorCode;
        err.path = `#${q.canonicalPathNotation}`;
        err.message = `Question not found for the linkId '${q.value}'`;
        const valStr = JSON.stringify(aValue);
        err.params = [q.value, op.value, valStr];
        errors.push(err);
        const i = q._errors?.findIndex((e) => e.code === errorCode);
        if(!(i >= 0)) { // Check if the error is already processed.
          q.extendErrors(err);
        }
      } else if(answerX && (Util.isEmpty(aValue)) && op?.value !== 'exists') {
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

    if (this.model && linkIdProperty) {
      this.formService.updateValidationStatus(this.model.id, linkIdProperty.value, 'enableWhen', errors);
    }
    return errors;
  }

  /**
   * Handle the 'linkId' validation result by updating the 'linkIdTracker' and the validation status
   * accordingly, depending on the outcome of the validation. 
   * @param hasDuplicate - True if ther is a duplicate 'linkId', otherwise false.
   * @param prevLinkId - existing linkId associated with item of the node. 
   * @param newLinkId - updated linkId associated with item of the node. 
   * @param errors - Array of errors from the validation or null.
   */
  handleLinkIdValidationResult(hasDuplicate: boolean, prevLinkId: string, newLinkId: string, errors: any[]): void {
    let dupIds = null;
    if (!errors) {
      dupIds = this.formService.getLinkIdTrackerByLinkId(prevLinkId);
    }
    else if (hasDuplicate) {
      dupIds = this.formService.getLinkIdTrackerByLinkId(newLinkId);
      this.formService.updateLinkIdForLinkIdTracker(prevLinkId, newLinkId);
    }

    if (dupIds) {
      if ((!errors && dupIds.length < 3) || errors) {
        dupIds.forEach(id => {
          if (errors)
            errors[0].params[0].id = id;
          const val = (id == this.model.id || !prevLinkId) ? newLinkId : prevLinkId;
          this.formService.updateValidationStatus(id, val, 'linkId', errors);
        });
      } else {
        this.formService.updateValidationStatus(this.model.id, newLinkId, 'linkId', errors);
      }
    } else {
      this.formService.updateValidationStatus(this.model.id, newLinkId, 'linkId', errors);
    }

    if (!errors) {
      this.formService.updateLinkIdForLinkIdTracker(prevLinkId, newLinkId);
    }
  }

  /**
   * Custom validator for unique linkId. 
   * @param value - Value of linkId
   * @param formProperty - Object form property of the linkId
   * @param rootProperty - Root form property
   */
  validateLinkId (value: any, formProperty: FormProperty, rootProperty: PropertyGroup): any[] | null  {
    let errors: any[] = [];

    if (!this.model) {
      return null;
    }

    if (this.linkId === undefined && value === '') {
      this.linkId = value;
      return null;
    }

    const prevLinkId = this.linkId;
    let hasDuplicate = false;
    const extensionsProp = rootProperty.getProperty('extension');
    const changed = (value !== this.linkId);
    if (changed) {
      const editableLinkId = formProperty;
      this.linkId = value;

      if (!value) {
        const errorCode = 'REQUIRED';
        const err: any = {};
        err.code = errorCode;
        err.path = `#${editableLinkId.canonicalPathNotation}`;
        err.message = `Link Id is required.`;
        err.params = [{'linkId': prevLinkId, 'id': this.model.id}];
        errors.push(err);
      } else {
        if (this.formService.treeNodeHasDuplicateLinkIdByLinkIdTracker(value)) {
          hasDuplicate = true;
          
          const errorCode = 'DUPLICATE_LINK_ID';
          const err: any = {};
          err.code = errorCode;
          err.path = `#${editableLinkId.canonicalPathNotation}`;
          err.message = `Entered linkId is already used.`;
          err.params = [{'linkId': value, 'id': this.model.id}];
          errors.push(err);
        }
        if (value.length > 255) {
          const errorCode = 'MAX_LENGTH';
          const err: any = {};
          err.code = errorCode;
          err.path = `#${editableLinkId.canonicalPathNotation}`;
          err.message = `LinkId cannot exceed 255 characters.`;
          err.params = [{'linkId': value, 'id': this.model.id, 'field': 'linkId'}];
          errors.push(err);
        }
      }

      if(errors.length) {
        formProperty.extendErrors(errors);
      }
      else {
        errors = null;
      }

      this.handleLinkIdValidationResult(hasDuplicate, prevLinkId, value, errors);
    } else {
      const nodeStatus = this.formService.getTreeNodeStatusById(this.model.id);
      errors = nodeStatus?.errors?.[formProperty.canonicalPathNotation] ?? null;
    }
    this.validationErrorsChanged.next(errors);
    return errors;
  }
}
