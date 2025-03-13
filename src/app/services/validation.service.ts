import { ChangeDetectorRef, Injectable } from '@angular/core';
import { FormService } from './form.service';
import { Util } from '../lib/util';
import {TreeNode} from '@bugsplat/angular-tree-component';

interface EnableWhenFieldValidationObject {
  canonicalPath: string;
  canonicalPathNotation: string;
  value: any;
}

export interface EnableWhenValidationObject {
  id: string;
  linkId: string;
  conditionKey: string;
  q: EnableWhenFieldValidationObject;
  aType: string;
  answerTypeProperty?: string;
  op: EnableWhenFieldValidationObject;
  aField: string;
  answerX: EnableWhenFieldValidationObject;
  operatorOptions: any [];
}

@Injectable({
  providedIn: 'root'
})

export class ValidationService {
  static readonly LINKID_PATTERN = /^[^\s]+(\s[^\s]+)*$/;

  constructor(private formService: FormService) { }

  validators = {
    '/type': this.validateType.bind(this),
    '/enableWhen': this.validateEnableWhenAll.bind(this),
    '/linkId': this.validateLinkId.bind(this)
  };

  /**
   * Iterates through each node in the 'validationNodes' array and invokes the custom validators for each node.
   * @param validationNodes - list of tree nodes.
   * @param startIndex - starting index for validation.
   * @returns - A promise that resolves when all items have been validated.
   */
  validateAllItems(validationNodes: TreeNode[], startIndex = 0): Promise<any[]> {
    const promises = [];
    const validatorKeys = Object.keys(this.validators);
    const self = this;

    for (let i = startIndex; i < validationNodes.length; i++) {
      const itemData = JSON.parse(JSON.stringify(validationNodes[i].data));
      itemData.id = ''+itemData[FormService.TREE_NODE_ID];

      for (let j = 0; j < validatorKeys.length; j++) {
        const validatorKey = validatorKeys[j];
        promises.push(new Promise((resolve) => {
          setTimeout(() => {
            itemData.cannoncial = validatorKey;
            itemData.canonicalPathNotation = self.convertToDotNotationPath(validatorKey);
            itemData.value = itemData[self.getLastPathSegment(itemData.canonicalPathNotation)];
            const error = self.validators[validatorKey](itemData, false);

            resolve( error ? error : {} );
          }, 0);
        }));
      }
    }
    return Promise.all(promises);
  };

  /**
   * Create a validation object specifically for the 'enableWhen' field validation.
   * @param id - tree node id
   * @param linkId - linkId associated with item of the node.
   * @param enableWhen - EnableWhen object which consists of question, operator, and answer sub-fields.
   * @param index - position within the 'EnableWhen' arrays to be validated.
   * @returns - EnableWhen validation object.
   */
  createEnableWhenValidationObj(id: string, linkId: string, enableWhen: any, index: number): EnableWhenValidationObject {
    const questionItem = this.formService.getTreeNodeByLinkId(enableWhen.question);
    let aType = '';
    if (questionItem) {
      aType = questionItem.data.type;
    }

    const aField = Util.getAnswerFieldName(aType || 'string');
    const enableWhenObj: EnableWhenValidationObject = {
      'id': id,
      'linkId': linkId,
      'conditionKey': '' + index,
      'q': this.createEnableWhenFieldValidationObject(enableWhen, 'question', index),
      'aType': aType,
      'op': this.createEnableWhenFieldValidationObject(enableWhen, 'operator', index),
      'aField': aField,
      'answerX': this.createEnableWhenFieldValidationObject(enableWhen, aField, index),
      'operatorOptions': this.formService.getEnableWhenOperatorListByAnswerType(aType)
    };
    return enableWhenObj;
  }

  /**
   * Create sub-field validation object for the EnableWhen field. The includes the sub-field: 'question', 'operator', or 'answer'.
   * @param enableWhenObj - EnableWhen validation object.
   * @param fieldName - sub-field name (question, operator, or answer)
   * @param index - position within the 'EnableWhen' arrays to be validated.
   * @returns - EnableWhen field validation object.
   */
  createEnableWhenFieldValidationObject(enableWhenObj: any, fieldName: string, index: number): EnableWhenFieldValidationObject {
    return {
      canonicalPath: `/enableWhen/${index}/${fieldName}`,
      canonicalPathNotation: `enableWhen.${index}.${fieldName}`,
      value: enableWhenObj[fieldName]
    };
  }


  /**
   * Handle the 'linkId' validation result by updating the 'linkIdTracker' and the validation status
   * accordingly, depending on the outcome of the validation.
   * @param hasDuplicateError - True if there is a duplicate 'linkId', otherwise false.
   * @param prevLinkId - existing linkId associated with item of the node.
   * @param newLinkId - updated linkId associated with item of the node.
   * @param errors - Array of errors from the validation or null.
   */
  handleLinkIdValidationResult(hasDuplicateError: boolean, prevLinkId: string, nodeId: any, newLinkId: string, errors: any[]): void {
    let nodeIds: string[] | null = null;

    // Obtaining nodeIds (should return one or more node ids for the given linkId where multiple node ids indicate a duplication of the linkId.)
    // scenario 1: No error and the linkId value was modified (the 'prevLinkId' and 'newLinkId' are avaiable).
    //             - Load the linkIdTracker by the previous linkId.
    // scenario 2: No error and the linkId was not modified (the 'prevLinkId' is undefined. Only the 'newLinkId' (current value) is available).
    //             - Load the linkIdTracker by the new linkId.
    // scenario 3: Error and 'newLinkId' is empty/null
    //             - Load the linkIdTracker by the previous linkId.
    // scenario 4: Error(s) and hasDuplicateError.
    //             - The linkIdTracker is updated. Node id is removed from the 'prevLinkId' and add into the 'newLinkId' (which result in having
    //               more than 1 node ids for the same linkId).
    //             - Load the linkIdTracker by the new linkId.
    // scenario 5: Error(s) and no duplicate (hasDuplicateError is false).
    //             - Load the linkIdTracker by the new linkId.
    if ((!errors && prevLinkId) || (errors && !newLinkId)) {
      nodeIds = this.formService.getNodeIdsByLinkId(prevLinkId);
    } else {
      if (hasDuplicateError)
        this.formService.updateLinkIdForLinkIdTracker(prevLinkId, newLinkId, nodeId);

      nodeIds = this.formService.getNodeIdsByLinkId(newLinkId);
    }

    // Remove or insert errors
    // scenario 1: No errors and nodeIds has 1 or 2 node ids.
    //             - Since there is no longer a duplicate, remove error from both nodes (if block).
    // scenario 2: No errors and nodeIds has more than 3 node ids (more than two duplicates of the same linkId).
    //             - In this case, there is still duplicate nodes. Remove the error from only the current linkId (else block).
    // scenario 3: Has error(s) and nodeIds has 1 node id.
    //             - Populate the error from the (if block). Could have been done in the (else block) if adding more condition.
    // scenario 4: Has error(s) and nodeIds has more than 1 node ids (duplicateError).
    //             - Populate the error for all nodes. Make sense for 2 node ids. If more than 2, some may already have error populated.
    if (nodeIds && ((!errors && nodeIds.length < 3) || errors)) {
      nodeIds.forEach(id => {
        const val = (id === nodeId || !prevLinkId) ? newLinkId : prevLinkId;
        this.formService.updateValidationStatus(id, val, 'linkId', errors);
      });
    } else {
      this.formService.updateValidationStatus(nodeId, newLinkId, 'linkId', errors);
    }

    if (!hasDuplicateError) {
      this.formService.updateLinkIdForLinkIdTracker(prevLinkId, newLinkId, nodeId);
    }
  }


  /**
   * Converts a given canonical path into a dot notation path by removing the
   * leading slash and replacing all remaining slashes with periods.
   * @param canonicalPath - the input canonical path string to be converted.
   * @returns - dot notation path string.
   */
  convertToDotNotationPath(canonicalPath: string): string {
    return canonicalPath.replace(/^\/+|\/+$/g, '')
                        .replace(/\//g, '.');
  }

  /**
   * Retrieves the last property key from a canonical path notation string.
   * A canonical path is typically a string with properties separated by dots.
   * If there are no dots, it returns the string itself as the key.
   * @param canonicalPathNotation - the dot-separated string representing the path to
   *                                a nested property.
   * @returns - property key in the canonical path or the original string if no dots
   *            are present.
   */
  getLastPathSegment(canonicalPathNotation: string): string {
    return (canonicalPathNotation || '').split('.').pop();
  }
/** ---------------------------------------------------------------------------------
 *  CUSTOM VALIDATORS
 *  --------------------------------------------------------------------------------- */

  /**
   * Custom validator for the 'type' (Data Type) field.
   * @param validationObj - an object that contains field data for validation.
   * @param isSchemaFormValidation - indicates whether this is a specific schema form validation (true)
   *                                 or a validation for all items (false).
   * @returns Array of errors if validation fails, or null if it passes. This returns an error in the case:
   *          1. (INVALID TYPE) - Data type is 'display' and the item has sub-items.
   */
  validateType(validationObj: any, isSchemaFormValidation = true): any[] | null {
    let errors: any[] = [];

    const type = validationObj.value;

    if (type !== 'display' && !isSchemaFormValidation)
      return null;

    if (type === 'display') {
      if (!validationObj.id) {
        return null;
      }

      const node = this.formService.getTreeNodeById(validationObj.id);

      if (node.data?.item?.length > 0) {
        const errorCode = 'INVALID_TYPE';
        const err: any = {};
        err.code = errorCode;
        err.path = `#${validationObj.canonicalPathNotation}`;
        err.indexPath = Util.getIndexPath(node).join('.');
        err.message = `'${validationObj.value}' data type cannot contain sub-items.`;
        err.params = [{'linkId': validationObj.linkId, 'id': validationObj.id, 'field': validationObj.canonicalPathNotation}];
        errors.push(err);
      }
    }

    if (!errors.length) errors = null;

    // Update validate status if there are errors or if 'isSchemaFormValidation' is true.
    if (isSchemaFormValidation || errors)
      this.formService.updateValidationStatus(validationObj.id,
                                              validationObj.linkId,
                                              this.getLastPathSegment(validationObj.canonicalPathNotation),
                                              errors);

    return errors;
  }


  /**
   * Custom validator for the 'enableWhen' (Array of conditions) field.
   * @param validationObj - an object that contains field data for validation.
   * @param isSchemaFormValidation - indicates whether this is a specific schema form validation (true)
   *                                 or a validation for all items (false).
   * @returns Array of errors if validation fails, or null if it passes.
   */
  validateEnableWhenAll(validationObj: any, isSchemaFormValidation = true): any[] | null {
    let errors: any[] = [];
    const enableWhenList = validationObj.value;

    if (!validationObj.id || !validationObj.value) {
      return null;
    }

    enableWhenList.forEach((enableWhen, index) => {
      const enableWhenObj = this.createEnableWhenValidationObj(validationObj.id, validationObj.linkId, enableWhen, index);
      if (!enableWhenObj)
        return null;

      const error = this.validateEnableWhenSingle(enableWhenObj, isSchemaFormValidation);
      if (error) {
        errors = errors || []
        errors.push(error)
      }
    });

    return errors;
  }


  /**
   * Custom validator for single condition in 'enableWhen' field.
   * @param enableWhenObj - an object that contains field data for validation.
   * @param isSchemaFormValidation - indicates whether this is a specific schema form validation (true)
   *                                 or a validation for all items (false).
   * @returns Array of errors if validation fails, or null if it passes. This returns an error in the following cases:
   *          1. (ENABLEWHEN_INVALID_QUESTION) - The question, which is the 'linkId', is an invalid 'linkId'.
   *          2. (ENABLEWHEN_INVALID_OPERATOR) - The selected operator value does not match the available operator
   *                                             options.
   *          3. (ENABLEWHEN_ANSWER_REQUIRED)  - The question is provided and valid, the operator is provided and not
   *                                             equal to 'exists', and the answer is empty.
   */
  validateEnableWhenSingle(enableWhenObj: any, isSchemaFormValidation = true): any[] | null {
    let errors: any[] = [];
    if(enableWhenObj?.op?.value?.length > 0 || (!enableWhenObj?.aType && enableWhenObj?.answerTypeProperty)) {
      const aValue = enableWhenObj.answerX?.value;

      const node = this.formService.getTreeNodeById(enableWhenObj.id);
      const indexPath = Util.getIndexPath(node).join('.');

      // Validate whether the  'linkId' specified in the question exists.
      // If not, then throw the 'ENABLEWHEN_INVALID_QUESTION' error.
      if (!enableWhenObj.aType) {
        const errorCode = 'ENABLEWHEN_INVALID_QUESTION';
        const errorMsg = `Question not found for the linkId '${enableWhenObj.q.value}'.`;
        const err: any = {};
        err.code = errorCode;
        err.path = `#${enableWhenObj.q.canonicalPathNotation}`;
        err.message = errorMsg;
        err.indexPath = indexPath;
        const valStr = JSON.stringify(aValue);
        err.params = [enableWhenObj.q.value, enableWhenObj.op.value, valStr];
        errors.push(err);
        if (isSchemaFormValidation) {
          const i = enableWhenObj.q._errors?.findIndex((e) => e.code === errorCode);
          if(!(i >= 0)) { // Check if the error is already processed.
            enableWhenObj.q.extendErrors(err);
          }
        }
      } else {
        const opExists = enableWhenObj?.op ? enableWhenObj.operatorOptions.some(operatorOption => operatorOption.option === enableWhenObj.op.value) : false;
        if (!opExists) {
          const errorCode = 'ENABLEWHEN_INVALID_OPERATOR';
          const err: any = {};
          err.code = errorCode;
          err.path = `#${enableWhenObj.op.canonicalPathNotation}`;
          err.message = `Invalid operator \'${enableWhenObj.op.value}\' for type \'${enableWhenObj.aType}\'.`;
          const valStr = JSON.stringify(aValue);
          err.params = [enableWhenObj.q.value, enableWhenObj.op.value, valStr];
          errors.push(err);
          if (isSchemaFormValidation) {
            const i = enableWhenObj.op._errors?.findIndex((e) => e.code === errorCode);
            if(!(i >= 0)) { // Check if the error is already processed.
              enableWhenObj.op.extendErrors(err);
            }
          }
        } else if(enableWhenObj.answerX && (Util.isEmpty(aValue)) && enableWhenObj.op?.value !== 'exists') {
          const errorCode = 'ENABLEWHEN_ANSWER_REQUIRED';
          const err: any = {};
          err.code = errorCode;
          err.path = `#${enableWhenObj.answerX.canonicalPathNotation}`;
          err.message = `Answer field is required when you choose an operator other than 'Not empty' or 'Empty'.`;
          const valStr = JSON.stringify(aValue);
          err.params = [enableWhenObj.q.value, enableWhenObj.op.value, valStr];
          errors.push(err);
          if (isSchemaFormValidation) {
            const i = enableWhenObj.answerX._errors?.findIndex((e) => e.code === errorCode);
            if(!(i >= 0)) { // Check if the error is already processed.
              enableWhenObj.answerX.extendErrors(err);
            }
          }
        }
      }
    }

    if (!errors.length)
      errors = null;

    // Update validate status if there are errors or if 'isSchemaFormValidation' is true.
    if (isSchemaFormValidation || errors)
      this.formService.updateValidationStatus(enableWhenObj.id, enableWhenObj.linkId,
                                              `enableWhen_${enableWhenObj.conditionKey}`,
                                              errors);

    return errors;
  }


  /**
   * Custom validator for the 'linkId' field.
   * @param validationObj - an object that contains field data for validation.
   * @param isSchemaFormValidation - indicates whether this is a specific schema form validation (true)
   *                                 or a validation for all items (false).
   * @returns Array of errors if validation fails, or null if it passes.  This returns an error in the following cases:
   *          1. (REQUIRED)          - linkId is empty.
   *          2. (PATTERN)           - linkId does not match the required pattern.
   *          3. (DUPLICATE_LINK_ID) - duplicate linkId.
   *          4. (MAX_LENGTH)        - linkId is 255 characters or longer.
   */
  validateLinkId(validationObj: any, isSchemaFormValidation = true): any[] | null {
    let errors: any[] = [];
    let hasDuplicateError = false;

    const node = this.formService.getTreeNodeById(validationObj.id);
    const indexPath = Util.getIndexPath(node).join('.');

    if (!validationObj.value) {
      const errorCode = 'REQUIRED';
      const err: any = {};
      err.code = errorCode;
      err.path = `#${validationObj.canonicalPathNotation}`;
      err.indexPath = indexPath;
      err.message = `Link Id is required.`;
      err.params = [{'linkId': validationObj.prevLinkId, 'id': validationObj.id, 'field': validationObj.canonicalPathNotation}];
      errors.push(err);
    } else {
      if (!ValidationService.LINKID_PATTERN.test(validationObj.value)) {
        const errorCode = 'PATTERN';
        const err: any = {};
        err.code = errorCode;
        err.path = `#${validationObj.canonicalPathNotation}`;
        err.indexPath = indexPath;
        err.message = `Spaces are not allowed at the beginning or end, and only a single space is allowed between words.`;
        err.params = [{'linkId': validationObj.value, 'id': validationObj.id, 'field': validationObj.canonicalPathNotation}];
        errors.push(err);
      } else if (this.formService.treeNodeHasDuplicateLinkIdByLinkIdTracker(validationObj.value, validationObj.id)) {
        hasDuplicateError = true;

        const errorCode = 'DUPLICATE_LINK_ID';
        const err: any = {};
        err.code = errorCode;
        err.path = `#${validationObj.canonicalPathNotation}`;
        err.indexPath = indexPath;
        err.message = `Entered linkId is already used.`;
        err.params = [{'linkId': validationObj.value, 'id': validationObj.id, 'field': validationObj.canonicalPathNotation}];
        errors.push(err);
      } else if (validationObj.value.length > 255) {
        const errorCode = 'MAX_LENGTH';
        const err: any = {};
        err.code = errorCode;
        err.path = `#${validationObj.canonicalPathNotation}`;
        err.indexPath = indexPath;
        err.message = `LinkId cannot exceed 255 characters.`;
        err.params = [{'linkId': validationObj.value, 'id': validationObj.id, 'field': validationObj.canonicalPathNotation}];
        errors.push(err);
      }
    }

    if (!errors.length) errors = null;

    // Update validate status if there are errors or if 'isSchemaFormValidation' is true.
    if (isSchemaFormValidation || errors)
      this.handleLinkIdValidationResult(hasDuplicateError, validationObj.prevLinkId, validationObj.id, validationObj.value, errors);

    return errors;
  };
}

