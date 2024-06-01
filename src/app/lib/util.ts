/**
 * A utility class
 */
import {PropertyGroup} from '@lhncbc/ngx-schema-form/lib/model';
import traverse from 'traverse';
import fhir from 'fhir/r4';
import {isEqual} from 'lodash-es';
import {ITreeNode} from '@bugsplat/angular-tree-component/lib/defs/api';
import copy from 'fast-copy';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import {DateUtil} from './date-util';

export type GuidingStep = 'home' | 'fl-editor' | 'item-editor';

export class Util {
  static ITEM_CONTROL_EXT_URL = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl';
  static helpItemTemplate = {
    text: '',  // Update with value from input box.
    type: 'display',
    linkId: '', // Update at run time.
    extension: [{
      url: Util.ITEM_CONTROL_EXT_URL,
      valueCodeableConcept: {
        text: 'Help-Button',
        coding: [
          {
            code: 'help',
            display: 'Help-Button',
            system: 'http://hl7.org/fhir/questionnaire-item-control'
          }
        ]
      }
    }]
  };

  private static _defaultForm = {
    resourceType: 'Questionnaire',
    title: 'New Form',
    status: 'draft',
    item: []
  };

  private static _answerTypeMap = {
    boolean: 'answerBoolean',
    integer: 'answerInteger',
    decimal: 'answerDecimal',
    date: 'answerDate',
    dateTime: 'answerDateTime',
    time: 'answerTime',
    string: 'answerString',
    text: 'answerString',
    choice: 'answerCoding',
    'open-choice': 'answerCoding',
    quantity: 'answerQuantity',
    reference: 'answerReference'
  };

  /**
   * See if the guiding step is one of the defined type. The flag is store in localStorage/sessionStorage.
   * This function is to help sanitize the stored values.
   * @param step - Potentially a defined guiding step.
   */
  static isGuidingStep(step: GuidingStep): step is GuidingStep {
    return (step === 'home' || step === 'fl-editor' || step === 'item-editor');
  }

  /**
   * Helps to sanitize the file name read from DOM input element.
   * @param file - File object to validate.
   */
  static validateFile(file: File): File {
    return (file?.name?.trim().length > 0 && !/^[\.\~]|[\/\\]/.test(file.name)) ? file : null;
  }

  // Capitalize the camel case strings.
  static capitalize(str): string {
    let ret = '';
    if (str && str.length > 0) {
      ret = str.split(/(?=[A-Z])/).join(' ');
      ret = ret.charAt(0).toUpperCase() + ret.substring(1);
    }
    return ret;
  }


  /**
   * Identify if a particular widget under the group is visible.
   *
   * @param group - Group property of the widget
   * @param propertyId - It is '.' delimited property name of its descendants.
   */
  static isVisible(group: PropertyGroup, propertyId: string) {
    const path = propertyId.split('.');
    let visible = group.visible;
    for (let i = 0; i < path.length && visible; i++) {
      group = group.getProperty(path[i]);
      visible = group.visible;
    }
    return visible;

  }


  /**
   * Identify if an input is empty, typically intended to detect user input.
   * The definition of empty:
   * Anything null, undefined or empty string is empty.
   * Any object or an array containing all empty elements is empty.
   *
   * @param json - Input to test the emptiness.
   * @return boolean - True if empty.
   */
  static isEmpty(json: unknown): boolean {
    let ret = true;
    if (typeof json === 'number') {
      ret = false; // Any number is non-empty
    }
    else if(typeof json === 'boolean') {
      ret = false; // Any boolean is non-empty
    }
    else if(!json) {
      ret = true; // empty string, null and undefined are empty
    }
    else if (json instanceof Date) {
      ret = false; // Date is non-empty
    }
    else if(Array.isArray(json)) { // Iterate through array
      for(let i = 0; ret && i < json.length; i++) {
        ret = Util.isEmpty(json[i]);
      }
    }
    else if (typeof json === 'object') { // Iterate through object properties
      if(Object.keys(json).length === 0) {
        ret = true;
      }
      else {
        for(let i = 0, keys = Object.keys(json); ret && i < keys.length; i++) {
          if(json.hasOwnProperty(keys[i])) {
            ret = Util.isEmpty(json[keys[i]]);
          }
        }
      }
    }
    else {
      ret = false;
    }
    return ret;
  }


  /**
   * Convert lforms answers to FHIR equivalent.
   * @param lformsAnswers - Lforms answers.
   */
  static getFhirAnswerOption(lformsAnswers: any []) {
    if(!lformsAnswers) {
      return null;
    }
    const answerOption: any [] = [];
    lformsAnswers.forEach((answer) => {
      answerOption.push({code: answer.AnswerStringID, system: 'http://loinc.org', display: answer.DisplayText});
    });
    return answerOption;
  }


  /**
   * Convert lforms data type to FHIR data type
   * @param lformsType - Lforms data type.
   */
  static getFhirType(lformsType: string): string {
    let ret = 'string';
    switch (lformsType) {
      case 'INT':
        ret = 'integer';
        break;
      case 'REAL':
        ret = 'decimal';
        break;
      case 'DT':
      case 'DAY':
      case 'MONTH':
      case 'YEAR':
        ret = 'date';
        break;
      case 'DTM':
        ret = 'dateTime';
        break;
      case 'ST':
      case 'EMAIL':
      case 'PHONE':
        ret = 'string';
        break;
      case 'TITLE':
        ret = 'display';
        break;
      case 'TM':
        ret = 'time';
        break;
      case 'SECTION':
      case null: // Null type for panels.
        ret = 'group';
        break;
      case 'URL':
        ret = 'url';
        break;
      case 'QTY':
        ret = 'quantity';
        break;
      case 'CNE':
        ret = 'choice';
        break;
      case 'CWE':
        ret = 'open-choice';
        break;
    }
    return ret;
  }


  /**
   * Convert lforms units to equivalent FHIR extensions.
   * @param units - units in lforms format.
   */
  static convertUnitsToExtensions(units): any [] {
    if(!units) {
      return null;
    }
    const ret: any [] = [];
    units.forEach((unit) => {
      ret.push({
        url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit',
        valueCoding: {
          code: unit,
          system: 'http://unitsofmeasure.org',
          display: unit
        }
      });
    });
    return ret;
  }


  /**
   * Find index of the item containing help text.
   * @param itemsArray - List of items to search for.
   */
  static findItemIndexWithHelpText(itemsArray) {
    if(!itemsArray) {
      return -1;
    }
    return itemsArray?.findIndex((item) => {
      let ret = false;
      if (item.type === 'display') {
        ret = item.extension?.some((e) => {
          return e.url === Util.ITEM_CONTROL_EXT_URL &&
            e.valueCodeableConcept?.coding?.some((coding) => coding.code === 'help');
        });
      }
      return ret;
    });
  }

  /**
   * Create help text item. Most of it is boilerplate structure except item.text and item.linkId.
   *
   * @param item - Item for which help text item is created, mainly to help assign linkId.
   * @param helpText - Help text, typically obtained from user input box.
   */
  static createHelpTextItem(item, helpText) {
    let helpTextItem;
    if(helpText) {
      helpTextItem = JSON.parse(JSON.stringify(Util.helpItemTemplate));
      helpTextItem.linkId = item.linkId + '_helpText';
      helpTextItem.text = helpText;
    }
    return helpTextItem;
  }


  /**
   * Prunes the questionnaire model using the following conditions:
   * . Removes 'empty' values from the object. Emptiness is defined in Util.isEmpty().
   *   The following are considered empty: undefined, null, {}, [], and  ''.
   * . Removes any thing with __$* keys.
   * . Removes functions.
   * . Converts __$helpText to appropriate FHIR help text item.
   * . Converts converts enableWhen[x].question object to linkId.
   *
   * @param fhirQInternal - Questionnaire object used in the form builder.
   */
  static convertToQuestionnaireJSON(fhirQInternal) {
    const value = copy(fhirQInternal); // Deep copy. Leave the internal model untouched.
    traverse(value).forEach(function (node) {
      this.before(function () {
        if(node && Array.isArray(node)) {
          // Remove empty elements, nulls and undefined from the array. Note that empty elements do not trigger callbacks.
          this.update(node.filter((e)=>{return e !== null && e !== undefined}));
        }
        else if (node?.__$helpText?.trim().length > 0) {
          const index = Util.findItemIndexWithHelpText(node.item);
          let helpTextItem;
          if (index < 0) {
            helpTextItem = Util.createHelpTextItem(node, node.__$helpText.trim());
            if (!node.item) {
              node.item = [];
            }
            node.item.push(helpTextItem);
          } else {
            helpTextItem = node.item[index];
            helpTextItem.text = node.__$helpText;
          }
          // Replace helpText with sub item
          delete node.__$helpText;
          this.update(node);
        }
        // Internally the question is target TreeNode. Change that to node's linkId.
        else if (this.key === 'question' && typeof node?.data === 'object') {
          this.update(node.data.linkId);
        }
        // Update type for header
        else if(this.key === 'type' && (node === 'group' || node === 'display')) {
          const type = this.parent.node.item?.length > 0 ? 'group' : 'display';
          this.update(type);
        }
      });

      this.after(function () {
        // Remove all custom fields starting with __$ and empty fields.
        if(this.key?.startsWith('__$') || typeof node === 'function' || Util.isEmpty(node)) {
          if (this.notRoot) {
            this.remove(); // Splices off any array elements.
          }
        }
      });
    });
    return value;
  }


  /**
   * Remove the content of target and copy (shallow) source to target.
   * More like a clone of source, without changing target reference.
   * @param target - object to be mirrored
   * @param source - source to copy.
   */
  static mirrorObject(target, source): any {
    Object.keys(target).forEach((k) => {
      if(target.hasOwnProperty(k)) {
        delete target[k];
      }
    });

    return Object.assign(target, source);
  }


  /**
   * Create bare minimum form.
   */
  static createDefaultForm(): fhir.Questionnaire {
    return Util.cloneDefaultForm();
  }

  /**
   * Clone default form, mainly to create a new form.
   */
  static cloneDefaultForm(): fhir.Questionnaire {
    return JSON.parse(JSON.stringify(Util._defaultForm));
  }

  /**
   * Compare with default form with deep equal.
   * @param q - Questionnaire to compare with default.
   */
  static isDefaultForm(q: fhir.Questionnaire): boolean {
    return isEqual(Util._defaultForm, q);
  }

  /**
   * Find the extension based on a given url from an array.
   * @param extensions - Array of extensions.
   * @param url - The url of the extension to search for.
   */
  static findExtensionByUrl(extensions: fhir.Extension [], url: string) {
    const i = this.findExtensionIndexByUrl(extensions, url);
    return i >= 0 ? extensions[i] : null;
  }


  /**
   * Find the first index of the extension based on a given url.
   * @param extensions - Array of extensions.
   * @param url - The url of the extension to search for.
   */
  static findExtensionIndexByUrl(extensions: fhir.Extension [], url: string) {
    let ret = -1;
    if(extensions?.length) {
      ret = extensions.findIndex((ext) => {
        return ext.url === url;
      });
    }
    return ret;
  }


  /**
   * Utility to identify answer[x] field.
   * @param f - Field name
   */
  static isAnswerField(f): boolean {
    return f && f.startsWith('answer');
  }


  /**
   * Map type to answer[x] field.
   * @param type - question type
   */
  static getAnswerFieldName(type: string): string {
    return Util._answerTypeMap[type];
  }

  /**
   * Compute tree hierarchy sequence numbering.
   * @param node - Target node of computation
   */
  static getIndexPath(node: ITreeNode): number[] {
    const ret: number [] = [];
    if (node) {
      ret.push(node.index + 1);
      while (node?.level > 1) {
        node = node.parent;
        const index = node ? node.index : 0;
        ret.push(index + 1);
      }
    }
    return ret.reverse();
  }


  /**
   * Format Node item for some display cases, for example search results of node items.
   * @param node - Input node to format the display.
   */
  static formatNodeForDisplay(node: ITreeNode) {
    let ret: string;
    if (node && node.data) {
      ret = `${Util.getIndexPath(node).join('.')}: ${node.data.text}`;
    }
    return ret;
  }


  /**
   * Truncate string to display node text on the sidebar.
   * @param text - String to truncate.
   * @param limit - Length to limit the truncation.
   */
  static truncateString(text: string, limit: number = 15): string {
    return text?.length > limit ? (text.substring(0, limit).trim() + '...') : text;
  }

  /**
   * Date type validator. Flags error for invalid dates such as 2023-11-31.
   * @param value - value from formProperty, which is in ISO format.
   * @param formProperty - FormProperty of the field.
   */
  static dateValidator(value: string, formProperty: FormProperty): any [] {
    let errors: any[] = [];
    const dateValidation = DateUtil.validateDate(value);
    if(value?.trim().length > 0 && !dateValidation.validDate && dateValidation.validFormat) {
        const errorCode = 'INVALID_DATE';
        const err: any = {};
        err.code = errorCode;
        err.path = `#${formProperty.canonicalPathNotation}`;
        err.message = 'Invalid date.';
        err.params = [value];
        errors.push(err);
    }
    if(errors.length) {
      formProperty.extendErrors(errors);
    }
    else {
      errors = null;
    }
    return errors;
  }

  /**
   * Validator for datetime type. For now passing through the date validator.
   * @param value - formProperty value in ISO format.
   * @param formProperty - FormProperty of the field.
   */
  static dateTimeValidator(value: string, formProperty: FormProperty): any [] {
    return Util.dateValidator(value, formProperty);
  }

  /**
   * Traverse up the chain of tree invoking a callback for each node visited. The callback should return false to terminate the traversal.
   * @param sourceNode - The node to start the traversal.
   * @param callback - Callback method with the argument of node visited. The function should return true to continue, and false to
   * terminate the traversal.
   *
   * @return - Returns an array consisting the nodes in the order it visited.
   */
  static traverseAncestors(sourceNode: ITreeNode, callback: (node: ITreeNode) => boolean): any[] {
    const ret = [];
    let n = sourceNode;
    let traverseAncestor = true;
    while (n && traverseAncestor) {
      ret.push(n);
      traverseAncestor = callback(n);
      n = n.parent;
    }
    return ret;
  }

}
