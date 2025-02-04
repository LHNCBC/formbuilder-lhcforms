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
import { ValidationService, EnableWhenValidationObject } from '../services/validation.service';

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
    '/type': this.validateType.bind(this),
    '/enableWhen': this.validateEnableWhenAll.bind(this),
    '/enableWhen/*': this.validateEnableWhenSingle.bind(this),
    '/linkId': this.validateLinkId.bind(this),
    '/__$pickInitial': this.validatePickInitial.bind(this),
    // Currently not used.
    //'/initial': this.validateInitialAll.bind(this),
    '/initial/*/valueDecimal': this.validateInitialSingle.bind(this),
    '/initial/*/valueInteger': this.validateInitialSingle.bind(this)
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
              private validationService: ValidationService,
              private modelService: SharedObjectService) {
    this.mySchema = formService.getItemSchema();
  }

  ngOnInit(): void {
    // Subscribe to changes to the questionnaire and obtain a set of
    // unique link ids as a result.
    this.modelService.questionnaire$.subscribe((questionnaire) => {
      this.questionnaire = questionnaire;
    });
  };

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
   * Creates a validation object using data from the ngx-schema-form model,
   * FormProperty, and tree node to be used for the validation process.
   * @param id - tree node id.
   * @param linkId - linkId associated with item of the node.
   * @param value - the value of the field to be validated.
   * @param formProperty - Object form property of the 'enableWhen' field.
   * @returns - validation object to be used for the validation.
   */
  createValidationObj(id: string, linkId: string, value: any, formProperty: FormProperty): any {
    return {
      'id': id,
      'linkId': linkId,
      'value': value,
      'canonicalPath': formProperty._canonicalPath,
      'canonicalPathNotation': formProperty.canonicalPathNotation
    };
  }

  /**
   * Create a validation object specifically for the 'enableWhen' field validation using 'formProperty'.
   * @param formProperty - Object form property of the 'enableWhen' field.
   * @returns - EnableWhen validation object.
   */
  createEnableWhenValidationObj(formProperty: ObjectProperty): EnableWhenValidationObject {
    const q = formProperty.getProperty('question');
    const questionItem = this.formService.getTreeNodeByLinkId(q.value);

    let aType = '';

    if (questionItem) {
      aType = questionItem.data.type;
    }

    // The condition key is used to differentiate between each enableWHen conditions.
    let condKey = '';
    if (q._canonicalPath) {
      const match = q._canonicalPath.match(/enableWhen\/(.*?)\/question/);
      condKey = match ? match[1] : '';
    }
    const op = formProperty.getProperty('operator');
    const aField = Util.getAnswerFieldName(aType || 'string');
    const answerType = formProperty.getProperty('__$answerType').value;
    const answerX = formProperty.getProperty(aField);
    const linkIdProperty = formProperty.findRoot().getProperty('linkId');

    const enableWhenObj: EnableWhenValidationObject = {
      'id': this.model?.[FormService.TREE_NODE_ID],
      'linkId': linkIdProperty.value,
      'conditionKey': condKey,
      'q': q,
      'aType': aType,
      'answerTypeProperty': formProperty.getProperty('__$answerType').value,
      'op': op,
      'aField': aField,
      'answerX': answerX,
      'operatorOptions': this.formService.getEnableWhenOperatorListByAnswerType(aType)
    };

    return enableWhenObj;
  }

  /**
   * Determines whether the provided array of answer options contains data. The array may
   * contain an empty object; therefore, it is necessary to validate the 'display' and
   * 'code' fields. 
   * @param ansOpts - An array of Answer Options objects
   * @returns - true if the Answer Option array is empty or contain one empty item, otherwise false.
   */
  isEmptyAnswerOption(ansOpts: any): boolean {
    if (!ansOpts || ansOpts.length === 0) {
      return true;
    }
    if (ansOpts.length > 1)
      return false;
    return ansOpts.some(ansOpt => !(ansOpt?.valueCoding?.display && ansOpt?.valueCoding?.code));
  }

  /**
   * Custom validator wrapper for the 'type' field in ngx-schema-form. Creates a validation object using data
   * from the 'value', and 'formProperty' and then invokes the actual validation function provided by
   * the 'ValidationService'.
   * @param value - Value of the 'type' field
   * @param formProperty - Object form property of the 'type' field
   * @param rootProperty - Root form property
   * @returns Array of errors if validation fails, or null if it passes. This returns an error in the case:
   *          1. (INVALID TYPE) - Data type is 'display' and the item has sub-items.
   */
  validateType(value, formProperty: FormProperty, rootProperty: PropertyGroup): any[] | null {
    let errors: any[] = [];

    if (!this.model) {
      return null;
    }
    const nodeId = this.model?.[FormService.TREE_NODE_ID];

    if (!nodeId) {
      return null;
    }

    const node = this.formService.getTreeNodeById(nodeId);
    const linkId = node.data.linkId;
    const validationObj = this.createValidationObj(nodeId, linkId, value, formProperty);
    errors = this.validationService.validateType(validationObj);

    if(errors?.length) {
      formProperty.extendErrors(errors);
    }

    return errors;
  }

  /**
   * Custom validator wrapper for the 'enableWhen' field in ngx-schema-form. Iterates through each 'enableWhen' condition
   * array and validate each one of them.
   * @param value - Value of 'enableWhen' field which can be array of 1 or more 'enableWhen' conditions.
   * @param arrayProperty - Array of form property of the 'enable' field.
   * @param rootProperty - Root form property.
   * @returns Array of errors if validation fails, or null if it passes. This returns an error in the following cases:
   *          1. (ENABLEWHEN_INVALID_QUESTION) - The question, which is the 'linkId', is an invalid 'linkId'.
   *          2. (ENABLEWHEN_INVALID_OPERATOR) - The selected operator value does not match the available operator
   *                                             options. 
   *          3. (ENABLEWHEN_ANSWER_REQUIRED)  - The question is provided and valid, the operator is provided and not 
   *                                            and not equal to 'exists', and the answer is empty. 
   */
  validateEnableWhenAll (value: any, arrayProperty: ArrayProperty, rootProperty: PropertyGroup): any[] | null {
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
   * Custom validator wrapper for single condition in enableWhen. Creates a validation object using data from the 'formProperty'
   * and then invokes the actual validation function provided by the 'ValidationService'.
   * @param value - Value of single enableWhen condition.
   * @param formProperty - Object form property of the condition.
   * @param rootProperty - Root form property.
   * @returns Array of errors if validation fails, or null if it passes. This returns an error in the following cases:
   *          1. (ENABLEWHEN_INVALID_QUESTION) - The question, which is the 'linkId', is an invalid 'linkId'.
   *          2. (ENABLEWHEN_INVALID_OPERATOR) - The selected operator value does not match the available operator
   *                                             options. 
   *          3. (ENABLEWHEN_ANSWER_REQUIRED)  - The question is provided and valid, the operator is provided and not 
   *                                            and not equal to 'exists', and the answer is empty. 
   */
  validateEnableWhenSingle (value: any, formProperty: ObjectProperty, rootProperty: PropertyGroup): any[] | null {
    let errors: any[] = [];

    if (!this.model) {
      return null;
    }

    const enableWhenObj = this.createEnableWhenValidationObj(formProperty);
    if (!enableWhenObj || enableWhenObj.conditionKey === "*")
      return null;

    errors = this.validationService.validateEnableWhenSingle(enableWhenObj);


    if(errors && errors.length) {
      formProperty.extendErrors(errors);
    }
    return errors;
  }

  /**
   * Custom validator wrapper for the 'linkId' field in ngx-schema-form. Creates a validation object using data
   * from the 'value', 'formProperty' and/or 'rootProperty' and then invokes the actual validation function provided by
   * the 'ValidationService'.
   * @param value - Value of the 'linkId' field.
   * @param formProperty - Object form property of the 'linkId' field.
   * @param rootProperty - Root form property
   * @returns Array of errors if validation fails, or null if it passes.  This returns an error in the following cases:
   *          1. (REQUIRED)          - linkId is empty.
   *          2. (PATTERN)           - linkId does not match the required pattern.
   *          3. (DUPLICATE_LINK_ID) - duplicate linkId.
   *          4. (MAX_LENGTH)        - linkId is 255 characters or longer.
   */
  validateLinkId (value: any, formProperty: FormProperty, rootProperty: PropertyGroup): any[] | null {
    let errors: any[] = [];

    if (!this.model) {
      return null;
    }

    const nodeId = this.model?.[FormService.TREE_NODE_ID];
    const prevLinkId = rootProperty.value['linkId'];

    if (!nodeId) {
      return null;
    }

    const propertyName = this.validationService.getLastPathSegment(formProperty.canonicalPathNotation);
    if (!prevLinkId && value === '') {
      // Check to see if the node already has errors, otherwise null
      const nodeStatus = this.formService.getTreeNodeStatusById(nodeId);
      errors = nodeStatus?.errors?.[propertyName] ?? null;
      return errors;
    }

    const changed = (value !== prevLinkId);
    if (changed) {
      const validationObj = this.createValidationObj(nodeId, value, value, formProperty);
      validationObj['prevLinkId'] = prevLinkId;
      errors = this.validationService.validateLinkId(validationObj);

      if (errors?.length) {
        formProperty.extendErrors(errors);
      }
    } else {
      const nodeStatus = this.formService.getTreeNodeStatusById(nodeId);
      errors = nodeStatus?.errors?.[propertyName] ?? null;
    }
    this.validationErrorsChanged.next(errors);

    return errors;
  }

  /**
   * Custom validator for the 'Pick initial' option in the Value Method. This validates data requirements
   * for each of the 'Answer list source' field: 'answer-option', 'snomed-value-set', and 'value-set'.
   * @param value - not used.
   * @param formProperty - Object form property of the 'linkId' field. 
   * @param rootProperty - Root form property. 
   * @returns Array of errors if validation fails, or null if it passes.  This returns an error in the following cases:
   *          1. (ANSWER_OPTION_REQUIRED)               - linkId is empty.
   *          2. (SNOMED_ANSWER_VALUE_SET_URI_REQUIRED) - linkId does not match the required pattern.
   *          3. (ANSWER_VALUE_SET_URI_REQUIRED)         - duplicate linkId.
   */
  validatePickInitial (value: any, formProperty: FormProperty, rootProperty: PropertyGroup): any[] | null {
    let errors: any[] = [];

    if (!this.model) {
      return null;
    }
    const nodeId = this.model?.[FormService.TREE_NODE_ID];

    if (!nodeId) {
      return null;
    }

    const node = this.formService.getTreeNodeById(nodeId);
    const linkId = node.data.linkId;

    const asMethod = formProperty.findRoot().getProperty("__$answerOptionMethods").value;
    // Answer Choices shows up with Answer Option Method = "answer-option" and 
    const ansOpts = formProperty.findRoot().getProperty("answerOption").value;

    // Answer Value Set field shows up when the Answer Option Method = "value-set" or "snomed-value-set"
    const answerValueSetUri = formProperty.findRoot().getProperty("answerValueSet").value;

    const valueMethod = formProperty.findRoot().getProperty("__$valueMethod").value;

    if (asMethod === "answer-option" && valueMethod === "pick-initial" && this.isEmptyAnswerOption(ansOpts)) {
      const errorCode = 'ANSWER_OPTION_REQUIRED';
      const err: any = {};
      err.code = errorCode;
      err.path = `#/__$pickInitial`;
      err.message = `Answer choices must be populated.`;
      errors.push(err);
    } else if (asMethod === "snomed-value-set" && !answerValueSetUri) {
      const errorCode = 'SNOMED_ANSWER_VALUE_SET_URI_REQUIRED';
      const err: any = {};
      err.code = errorCode;
      err.path = `#/__$pickInitial`;
      err.message = `SNOMED answer value set URI is required.`;
      errors.push(err);
    } else if (asMethod === "value-set" && !answerValueSetUri) {
      const errorCode = 'ANSWER_VALUE_SET_URI_REQUIRED';
      const err: any = {};
      err.code = errorCode;
      err.path = `#/__$pickInitial`;
      err.message = `Answer value set URI is required.`;
      errors.push(err);
    }

    if(errors.length) {
      formProperty.extendErrors(errors);
    }
    else {
      errors = null;
    }

    this.formService.updateValidationStatus(nodeId,
                                            linkId,
                                            this.validationService.getLastPathSegment(formProperty.canonicalPathNotation),
                                            errors);

    this.validationErrorsChanged.next(errors);
    return errors;
  }

  /**
   * Currently not used.
   * Custom validator wrapper for the 'initial' field in ngx-schema-form, specifically for the 'integer' and 'decimal'
   * data types. Iterates through each 'initial' value array and validate each one of them.
   * @param value - Value of 'intial' field. Not used.
   * @param arrayProperty - Array of form property of the 'initial' value.
   * @param rootProperty - Root form property.
   * @returns Array of errors if validation fails, or null if it passes. This returns an error in the following cases:
   *          1. (PATTERN) - The entered value does not match the required 'integer' or 'decimal' format pattern.
   */
  validateInitialAll (value: any, arrayProperty: ArrayProperty, rootProperty: PropertyGroup): any[] | null {
    let errors = null;

    const dataType = rootProperty.getProperty('type').value;

    if (dataType !== 'integer' && dataType !== 'decimal') {
      return null;
    }

    // iterate all properties
    arrayProperty.forEachChild((property: ObjectProperty) => {
      const value = (dataType === 'integer') ? property.value.valueInteger : property.value.valueDecimal;
      const error = this.validateInitialSingle(value, property, rootProperty)
      if (error) {
        errors = errors || []
        errors.push(error)
      }
    });
    this.errorsChanged.next(errors);
    return errors;
  }

  /**
   * Custom validator wrapper for single initial value, specifically of the 'integer' or 'decimal' data types.
   * Creates a validation object using data from the 'formProperty'and then invokes the actual validation
   * function provided by the 'ValidationService'.
   * @param value - Value of single initial value.
   * @param formProperty - Object form property of the initial.
   * @param rootProperty - Root form property.
   * @returns Array of errors if validation fails, or null if it passes. This returns an error in the following cases:
   *          1. (PATTERN) - The entered value does not match the required 'integer' or 'decimal' format
   */
  validateInitialSingle (value: any, formProperty: ObjectProperty, rootProperty: PropertyGroup): any[] | null {
    let errors: any[] = [];
    const dataType = rootProperty.getProperty('type').value;
    if (dataType !== 'integer' && dataType !== 'decimal') {
      return null;
    }

    if (!this.model) {
      return null;
    }
    const nodeId = this.model?.[FormService.TREE_NODE_ID];

    if (!nodeId) {
      return null;
    }
    const node = this.formService.getTreeNodeById(nodeId);
    const linkId = node.data.linkId;

    const validationObj = this.createValidationObj(nodeId, linkId, value, formProperty);

    let condKey = '';
    if (formProperty._canonicalPath) {
      const match = formProperty._canonicalPath.match(/initial\/(\d+)\/(valueDecimal|valueInteger)/);
      condKey = match ? match[1] : '';

      if (!match || condKey === "*")
        return null;
    }

    validationObj['dataType'] = dataType;
    validationObj['conditionKey'] = condKey;

    errors = this.validationService.validateInitialSingle(validationObj);

    if(errors && errors.length) {
      formProperty.extendErrors(errors);
    }
    this.validationErrorsChanged.next(errors);
    return errors;
  }  
}
