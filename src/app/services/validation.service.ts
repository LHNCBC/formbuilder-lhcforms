import { inject, Injectable } from '@angular/core';
import { FormService } from './form.service';
import { Util } from '../lib/util';
import {TreeNode} from '@bugsplat/angular-tree-component';
import { ITreeNode } from '@bugsplat/angular-tree-component/lib/defs/api';
import {
  TYPE_CODING, TYPE_STRING, TYPE_TEXT, ANSWER_CONSTRAINT_OPTIONS_ONLY,
  ANSWER_CONSTRAINT_OPTIONS_OR_STRING, ANSWER_CONSTRAINT_OPTIONS_OR_TYPE
} from '../lib/constants/constants';
import { AnswerOptionService } from './answer-option.service';

export interface EnableWhenQuestionFieldValidationObject {
  canonicalPath: string;
  canonicalPathNotation: string;
  value: any;
  text: string;
  answerOptions?: any[];
}

interface EnableWhenFieldValidationObject {
  canonicalPath: string;
  canonicalPathNotation: string;
  value: any;
}

export interface EnableWhenValidationObject {
  id: string;
  linkId: string;
  conditionKey: string;
  q: EnableWhenQuestionFieldValidationObject;
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
  static readonly INITIAL_DECIMAL = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$/;
  static readonly INITIAL_INTEGER = /^-?([0]|([1-9][0-9]*))$/;

  answerOptionService = inject(AnswerOptionService);

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
   * @param clearStatusOnValid - Whether to clear status on valid result.
   * @param validatorKeyFilter - If provided, only this validator will run.
   * @returns - A promise that resolves when all items have been validated.
   */
  validateAllItems(validationNodes: TreeNode[], startIndex = 0, clearStatusOnValid = false, validatorKeyFilter?: string): Promise<any[]> {
    const promises = [];
    const validatorKeys = Object.keys(this.validators);
    const self = this;

    for (let i = startIndex; i < validationNodes.length; i++) {
      const itemData = JSON.parse(JSON.stringify(validationNodes[i].data));
      itemData.id = ''+itemData[FormService.TREE_NODE_ID];

      for (let j = 0; j < validatorKeys.length; j++) {
        const validatorKey = validatorKeys[j];
        if (validatorKeyFilter && validatorKey !== validatorKeyFilter) continue;
        promises.push(new Promise((resolve) => {
          setTimeout(() => {
            itemData.cannoncial = validatorKey;
            itemData.canonicalPathNotation = self.convertToDotNotationPath(validatorKey);
            itemData.value = itemData[self.getLastPathSegment(itemData.canonicalPathNotation)];
            const error = self.validators[validatorKey](itemData, clearStatusOnValid);

            resolve( error ? error : {} );
          }, 0);
        }));
      }
    }
    return Promise.all(promises);
  };


  /**
   * Validates a single tree node using all or a specific validator.
   * @param node - The tree node to validate.
   * @param clearStatusOnValid - Whether to clear status on valid result.
   * @param validatorKeyFilter - If provided, only this validator will run.
   * @returns Promise resolving to array of validation results.
   */
  validateItem(node: TreeNode, clearStatusOnValid: boolean = false, validatorKeyFilter?: string): Promise<any[]> {
    const promises: Promise<any>[] = [];
    const validatorKeys = Object.keys(this.validators);
    const itemData = JSON.parse(JSON.stringify(node.data));
    itemData.id = '' + itemData[FormService.TREE_NODE_ID];

    for (let j = 0; j < validatorKeys.length; j++) {
      const validatorKey = validatorKeys[j];
      if (validatorKeyFilter && validatorKey !== validatorKeyFilter) continue;
      promises.push(new Promise((resolve) => {
        setTimeout(() => {
          itemData.cannoncial = validatorKey;
          itemData.canonicalPathNotation = this.convertToDotNotationPath(validatorKey);
          itemData.value = itemData[this.getLastPathSegment(itemData.canonicalPathNotation)];
          const error = this.validators[validatorKey](itemData, clearStatusOnValid);
          resolve(error ? error : {});
        }, 0);
      }));
    }
    return Promise.all(promises);
  }

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

    let aField;
    if (questionItem && 'answerConstraint' in questionItem.data && questionItem.data.answerConstraint === "optionsOrString") {
      aField = Util.resolveAnswerFieldName(aType, 'string', enableWhen);
    } else {
      aField = Util.getAnswerFieldName(aType || 'string');
    }

    const enableWhenObj: EnableWhenValidationObject = {
      'id': id,
      'linkId': linkId,
      'conditionKey': '' + index,
      'q': this.createEnableWhenQuestionFieldValidationObject(enableWhen, questionItem, index),
      'aType': aType,
      'op': this.createEnableWhenFieldValidationObject(enableWhen, 'operator', index),
      'aField': aField,
      'answerX': this.createEnableWhenFieldValidationObject(enableWhen, aField, index),
      'operatorOptions': this.formService.getEnableWhenOperatorListByAnswerType(aType)
    };
    return enableWhenObj;
  }

  /**
   * Create sub-field validation object for the EnableWhen 'question' field.
   * @param enableWhenObj - EnableWhen validation object.
   * @param questionItem - tree node representing the question item.
   * @param index - position within the 'EnableWhen' arrays to be validated.
   * @returns - EnableWhen field validation object.
   */
  createEnableWhenQuestionFieldValidationObject(enableWhenObj: any, questionItem: ITreeNode, index: number): EnableWhenQuestionFieldValidationObject {
    const result: any = {
      canonicalPath: `/enableWhen/${index}/question`,
      canonicalPathNotation: `enableWhen.${index}.question`,
      value: enableWhenObj['question'],
      text: questionItem?.data?.text
    };

    if (questionItem) {
      if ('answerOption' in questionItem?.data) {
        result.answerOptions = questionItem.data.answerOption;
      }
      if ('answerConstraint' in questionItem?.data) {
        result.answerConstraint = questionItem.data.answerConstraint;
      }
    }

    return result;
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

  /**
   * Constructs a standardized error object for validation results.
   * @param code - Error code representing the type of validation error.
   * @param path - Path to the field where the error occurred.
   * @param message - Human-readable error message.
   * @param indexPath - Index path for locating the error in nested structures.
   * @param params - Additional parameters providing context for the error.
   * @returns An object containing all error details for reporting and handling.
   */
  createErrorObject(code: string, path: string, message: string, indexPath: string, params: any) {
    return { code, path, message, indexPath, params };
  }

  /**
   * Validates whether the provided answer value matches any of the available answer options for the
   * EnableWhen question. Handles different answer constraints, including options only, options or
   * string, and options or type.
   * @param enableWhenObj - The EnableWhen validation object containing question, answer, and
   *                        constraint details.
   * @returns An error if no match is found, or null if the answer is valid.
   */
  checkAnswerAgainstAnswerOptions(enableWhenObj: EnableWhenValidationObject): string | null {
    if (Array.isArray(enableWhenObj.q.answerOptions) &&
        enableWhenObj.q.answerOptions.length > 0 &&
        enableWhenObj.aType
    ) {
      const questionType = (enableWhenObj.aType === TYPE_TEXT) ? TYPE_STRING : enableWhenObj.aType;
      const key = Util.getValueDataTypeName(questionType);
      const answerValue = enableWhenObj.answerX?.value;

      const foundMatchingOption = enableWhenObj.q.answerOptions.some(opt => {
        if (questionType === TYPE_CODING) {
          return Util.areFhirCodingsEqual(opt[key], answerValue);
        } else {
          return opt[key] === answerValue;
        }
      });

      if (foundMatchingOption) {
        return null;
      }

      // If there is no answerConstraint, it can be either R4 or R5 version but without
      // any selection on the answerConstraint.  In that case, it will be treated as 'optionsOnly'
      const errorMsg = `The answer value does not match any option in the '${enableWhenObj.q.text} (linkId: '${enableWhenObj.q.value}')' answerOptions`;
      if (!('answerConstraint' in enableWhenObj.q) ||
        ('answerConstraint' in enableWhenObj.q && enableWhenObj.q.answerConstraint === ANSWER_CONSTRAINT_OPTIONS_ONLY)
      ) {
        return `${errorMsg}.`;
      } else if (enableWhenObj.q.answerConstraint === ANSWER_CONSTRAINT_OPTIONS_OR_STRING) {
        // We determine the aField (either value<Type> or valueString) earlier. If the answer does not
        // match one of those two aFields, then enableWhenObj.answerX.value will be undefined.
        if (!enableWhenObj.answerX.value || enableWhenObj.aField !== "answerString") {
          return `${errorMsg} or the answer constraint of type string.`;
        }
      } else if (enableWhenObj.q.answerConstraint === ANSWER_CONSTRAINT_OPTIONS_OR_TYPE) {
        if ((questionType === TYPE_CODING && !Util.isFhirCoding(answerValue)) ||
            (questionType !== TYPE_CODING && !enableWhenObj.answerX.value)) {
          return `${errorMsg} or the answer constraint data type (${questionType}).`;
        }
      }
    }
    return null;
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
        const err = this.createErrorObject(
          'INVALID_TYPE',
          `#${validationObj.canonicalPathNotation}`,
          `'${validationObj.value}' data type cannot contain sub-items.`,
          Util.getIndexPath(node).join('.'),
          [{'linkId': validationObj.linkId, 'id': validationObj.id, 'field': validationObj.canonicalPathNotation}]
        );
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
      let err;

      // Validate whether the  'linkId' specified in the question exists.
      // If not, then throw the 'ENABLEWHEN_INVALID_QUESTION' error.
      if (!enableWhenObj.aType) {
        const errorCode = 'ENABLEWHEN_INVALID_QUESTION';
        err = this.createErrorObject(
          errorCode,
          `#${enableWhenObj.q.canonicalPathNotation}`,
          `Question not found for the linkId '${enableWhenObj.q.value}'.`,
          indexPath,
          [enableWhenObj.q.value, enableWhenObj.op.value, JSON.stringify(aValue)]
        );
        if (isSchemaFormValidation) {
          const i = enableWhenObj.q._errors?.findIndex((e) => e.code === errorCode);
          if(!(i >= 0)) { // Check if the error is already processed.
            if (enableWhenObj.q && typeof enableWhenObj.q.extendErrors === 'function') {
              enableWhenObj.q.extendErrors(err);
            }
          }
        }
      } else {
        const opExists = enableWhenObj?.op ? enableWhenObj.operatorOptions.some(operatorOption => operatorOption.option === enableWhenObj.op.value) : false;
        if (!opExists) {
          const errorCode = 'ENABLEWHEN_INVALID_OPERATOR';
          err = this.createErrorObject(
            errorCode,
            `#${enableWhenObj.op.canonicalPathNotation}`,
            `Invalid operator \'${enableWhenObj.op.value}\' for type \'${enableWhenObj.aType}\'.`,
            indexPath,
            [enableWhenObj.q.value, enableWhenObj.op.value, JSON.stringify(aValue)]
          );

          if (isSchemaFormValidation) {
            const i = enableWhenObj.op._errors?.findIndex((e) => e.code === errorCode);
            if (!(i >= 0)) { // Check if the error is already processed.
              if (enableWhenObj.op && typeof enableWhenObj.op.extendErrors === 'function') {
                enableWhenObj.op.extendErrors(err);
              }
            }
          }
        } else if (enableWhenObj.answerX) {
          let errorCode = 'ENABLEWHEN_ANSWER_REQUIRED';
          const errorPath = `#${enableWhenObj.answerX.canonicalPathNotation}`;
          let errorMsg;
          if (Util.isEmpty(aValue) && enableWhenObj.op?.value !== 'exists') {
            errorMsg = `Answer field is required when you choose an operator other than 'Not empty' or 'Empty'.`;
          } else if (enableWhenObj.op?.value !== 'exists' && 'answerOptions' in enableWhenObj.q) {
            errorMsg = this.checkAnswerAgainstAnswerOptions(enableWhenObj);
            if (errorMsg) {
              errorCode = 'ENABLEWHEN_INVALID_ANSWER';
            } else {
              this.answerOptionService.addEnableWhenReference(enableWhenObj.q.value, node.data.linkId, node.data.text, enableWhenObj.answerX?.value);
            }
          }

          if (errorMsg) {
            err = this.createErrorObject(
              errorCode,
              `#${enableWhenObj.answerX.canonicalPathNotation}`,
              errorMsg,
              indexPath,
              [enableWhenObj.q.value, enableWhenObj.op.value, JSON.stringify(aValue)]
            );

            if (isSchemaFormValidation) {
              const i = enableWhenObj.answerX._errors?.findIndex((e) => e.code === errorCode);
              if (!(i >= 0)) { // Check if the error is already processed.
                if (enableWhenObj.answerX && typeof enableWhenObj.answerX.extendErrors === 'function') {
                  enableWhenObj.answerX.extendErrors(err);
                }
              }
            }
          }
        }
      }

      if (err) {
        errors.push(err);
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
    let err;

    if (!validationObj.value) {
      err = this.createErrorObject(
        'REQUIRED',
        `#${validationObj.canonicalPathNotation}`,
        `Link Id is required.`,
        indexPath,
        [{'linkId': validationObj.prevLinkId, 'id': validationObj.id, 'field': validationObj.canonicalPathNotation}]
      );
    } else {
      if (!ValidationService.LINKID_PATTERN.test(validationObj.value)) {
        err = this.createErrorObject(
          'PATTERN',
          `#${validationObj.canonicalPathNotation}`,
          `Spaces are not allowed at the beginning or end, and only a single space is allowed between words.`,
          indexPath,
          [{'linkId': validationObj.value, 'id': validationObj.id, 'field': validationObj.canonicalPathNotation}]
        );
      } else if (this.formService.treeNodeHasDuplicateLinkIdByLinkIdTracker(validationObj.value, validationObj.id)) {
        hasDuplicateError = true;

        const errorCode = 'DUPLICATE_LINK_ID';
        err = this.createErrorObject(
          'DUPLICATE_LINK_ID',
          `#${validationObj.canonicalPathNotation}`,
          `Entered linkId is already used.`,
          indexPath,
          [{'linkId': validationObj.value, 'id': validationObj.id, 'field': validationObj.canonicalPathNotation}]
        );
      } else if (validationObj.value.length > 255) {
        err = this.createErrorObject(
          'MAX_LENGTH',
          `#${validationObj.canonicalPathNotation}`,
          `LinkId cannot exceed 255 characters.`,
          indexPath,
          [{'linkId': validationObj.value, 'id': validationObj.id, 'field': validationObj.canonicalPathNotation}]
        );
      }
    }

    if (err) {
      errors.push(err);
    } else {
      errors = null;
    }

    // Update validate status if there are errors or if 'isSchemaFormValidation' is true.
    if (isSchemaFormValidation || errors)
      this.handleLinkIdValidationResult(hasDuplicateError, validationObj.prevLinkId, validationObj.id, validationObj.value, errors);

    return errors;
  };


}

