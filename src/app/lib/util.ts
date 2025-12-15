/**
 * A utility class
 */
import traverse from 'traverse';
import fhir from 'fhir/r4';
import {isEqual} from 'lodash-es';
import {ITreeNode} from '@bugsplat/angular-tree-component/lib/defs/api';
import copy from 'fast-copy';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import {DateUtil} from './date-util';
import {v4 as uuidv4} from 'uuid';
import {fhirPrimitives} from "../fhir";
import {PropertyGroup} from "@lhncbc/ngx-schema-form";
import { convert } from 'questionnaire-version-converter';
import {
  EXTENSION_URL_ITEM_CONTROL, EXTENSION_URL_RENDERING_XHTML,
  TYPE_DECIMAL, TYPE_INTEGER, TYPE_STRING, TYPE_TEXT, TYPE_QUANTITY, TYPE_CODING, TYPE_GROUP, TYPE_URL, TYPE_DISPLAY,
  TYPE_DATE, TYPE_DATETIME, TYPE_TIME,
  EXTENSION_URL_UCUM_SYSTEM, EXTENSION_URL_QUESTIONNAIRE_UNIT, EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION
} from './constants/constants';


declare var LForms: any;

export type GuidingStep = 'home' | 'fl-editor' | 'item-editor';
export enum FHIR_VERSIONS {
  R5,
  R4,
  STU3
}
export type FHIR_VERSION_TYPE = keyof typeof FHIR_VERSIONS;

export class Util {
  static HELP_BUTTON_EXTENSION = {
      url: EXTENSION_URL_ITEM_CONTROL,
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
  };

  static helpItemTemplate = {
    // text: '',  Update with value from input box.
    type: TYPE_DISPLAY,
    linkId: '', // Update at run time.
    extension: [Util.HELP_BUTTON_EXTENSION]
  };

  static R5_PROFILE_URL = 'http://hl7.org/fhir/5.0/StructureDefinition/Questionnaire';
  private static _defaultForm = {
    resourceType: 'Questionnaire',
    title: 'New Form',
    status: 'draft',
    meta: {
      profile: [Util.R5_PROFILE_URL]
    },
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
    coding: 'answerCoding',
    quantity: 'answerQuantity',
    reference: 'answerReference'
  };

  private static _valueTypeMap = {
    boolean: 'valueBoolean',
    integer: 'valueInteger',
    decimal: 'valueDecimal',
    date: 'valueDate',
    dateTime: 'valueDateTime',
    time: 'valueTime',
    string: 'valueString',
    text: 'valueString',
    coding: 'valueCoding',
    quantity: 'valueQuantity',
    reference: 'valueReference',
    url: 'valueUri'
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
    return (typeof file?.name === 'string'  && !/^[.~]|[\/\\]/.test(file.name)) ? file : null;
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
   * @param formProperty - FormProperty of the widget. If it is not of PropertyGroup type,
   * or no property id is specified, its own visibility is returned.
   *
   * @param propertyId - (Optional) It is '.' delimited property name of its descendant.
   *
   * @return boolean - Visibility of the desired widget.
   */
  static isVisible(formProperty: PropertyGroup, propertyId?: string): boolean {
    let visible = formProperty.visible;
    // formProperty.getProperty => formProperty is PropertyGroup
    if(formProperty.getProperty && propertyId) {
      const path = propertyId.split('.');
      for (let i = 0; i < path.length && visible; i++) {
        formProperty = formProperty.getProperty(path[i]);
        visible = !!formProperty?.visible;
      }
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
    else if(typeof json === 'string' && json.trim().length === 0) {
      ret = true; // empty string or only whitespace is empty
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
        ret = TYPE_INTEGER;
        break;
      case 'REAL':
        ret = TYPE_DECIMAL;
        break;
      case 'DT':
      case 'DAY':
      case 'MONTH':
      case 'YEAR':
        ret = TYPE_DATE;
        break;
      case 'DTM':
        ret = TYPE_DATETIME;
        break;
      case 'ST':
      case 'EMAIL':
      case 'PHONE':
        ret = TYPE_STRING;
        break;
      case 'TITLE':
        ret = TYPE_DISPLAY;
        break;
      case 'TM':
        ret = TYPE_TIME;
        break;
      case 'SECTION':
      case null: // Null type for panels.
        ret = TYPE_GROUP;
        break;
      case 'URL':
        ret = TYPE_URL;
        break;
      case 'QTY':
        ret = TYPE_QUANTITY;
        break;
      case 'CNE':
      case 'CWE':
        ret = TYPE_CODING;
        break;
    }
    return ret;
  }


  /**
   * Convert lforms units to equivalent FHIR extensions. For quantity type, all
   * units are converted, and for decimal or integer, only the first unit is converted.
   *
   * @param units - units in lforms format.
   * @param dataType - 'quantity' || 'decimal' || 'integer'
   */
  static convertUnitsToExtensions(units, dataType: string): any [] {
    if(!units) {
      return null;
    }
    const ret: any [] = [];
    const unitUri = dataType === 'quantity' ?
      EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION :
      EXTENSION_URL_QUESTIONNAIRE_UNIT;
    units.some((unit) => {
      const display = LForms.ucumPkg.UcumLhcUtils.getInstance().validateUnitString(unit.unit)?.unit?.name || unit.unit;
      ret.push({
        url: unitUri,
        valueCoding: {
          code: unit.unit,
          system: EXTENSION_URL_UCUM_SYSTEM,
          display: display
        }
      });
      // For quantity convert all units. For decimal or integer pick the first one.
      return (dataType !== TYPE_QUANTITY);
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
    return itemsArray.findIndex((item) => {
      let ret = false;
      if (item.type === 'display') {
        ret = item.extension?.some((e) => {
          return e.url === EXTENSION_URL_ITEM_CONTROL &&
            e.valueCodeableConcept?.coding?.some((coding) => coding.code === 'help');
        });
      }
      return ret;
    });
  }

  /**
   * Check for existence of help text values. The values are plain text, and valueStrings from css/xhtml
   * rendering extensions
   *
   * @param node - fhir.QuestionnaireItem.
   */
  static hasHelpText(node): boolean {
    return node?.__$helpText?.text?.trim().length > 0 ||
      node?.__$helpText?._text?.extension?.some((ext: fhir.Extension) => {
        return ext.url === EXTENSION_URL_RENDERING_XHTML && ext.valueString?.trim().length > 0;
      });
  }

  /**
   * Prunes the questionnaire model using the following conditions:
   * . Removes 'empty' values from the object. Emptiness is defined in Util.isEmpty().
   *   The following are considered empty: undefined, null, {}, [], and  ''.
   * . Removes anything with __$* keys.
   * . Removes functions.
   * . Converts __$helpText to appropriate FHIR help text item.
   * . Converts enableWhen[x].question object to linkId.
   *
   * @param fhirQInternal - Questionnaire object used in the form builder.
   */
  static convertToQuestionnaireJSON(fhirQInternal) {
    const value = copy(fhirQInternal); // Deep copy. Leave the internal model untouched.
    traverse(value).forEach(function (node) {
      this.before(function () {
        if(node && Array.isArray(node)) {
          // There is a bug in one of the package which caused issue if there is objects with empty fields in the array.
          // The array index is not updated properly which caused an error. This is a work-around to clean up the empty fields.
          Util.eliminateEmptyFields(node);
          this.update(node);
        }
        if (Util.hasHelpText(node)) {
          Util.eliminateEmptyFields(node.__$helpText);
          if(!node.item) {
            node.item = [];
          }
          node.item.push(node.__$helpText);
          delete node.__$helpText;
          this.update(node);
        }
        // Internally the question is target TreeNode. Change that to node's linkId.
        if (this.key === 'question' && typeof node?.data === 'object') {
          this.update(node.data.linkId);
        }
      });

      this.after(function () {
        // Remove all custom fields starting with __$ excluding any fields defined in excludeCustomFields array and empty fields.
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
   * Remove empty fields from a json object.
   * @param json - JSON object
   */
  static eliminateEmptyFields(json) {
    traverse(json).forEach(function (node) {
      this.before(function () {
        if(node && Array.isArray(node)) {
          // Remove empty elements, nulls and undefined from the array. Note that empty elements do not trigger callbacks.
          this.update(node.filter((e)=>{return e !== null && e !== undefined}));
        }
      });

      this.after(function () {
        // Remove all empty fields.
        if(typeof node === 'function' || Util.isEmpty(node)) {
          if (this.notRoot) {
            this.remove(); // Splices off any array elements.
          }
        }
      });
    });
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
   * Map type to value[x] field.
   * @param type - question type
   */
  static getValueFieldName(type: string): string {
    if (type === TYPE_TEXT) {
      type = TYPE_STRING;
    }
    return Util._valueTypeMap[type];
  }

  /**
   * Map type to answer[x] field.
   * @param type - question type
   */
  static getAnswerFieldName(type: string): string {
    return Util._answerTypeMap[type];
  }

  /**
   * Returns the appropriate answer[x] field name for a given type and data object.
   * If the field for the primary type exists in the data object, it is returned.
   * Otherwise, checks the alternate type and returns its field name if present.
   * If neither is found, returns the field name for the primary type.
   * @param type - The primary FHIR data type (e.g., 'string', 'integer', 'coding').
   * @param altType - An alternate FHIR data type to check if the primary is not present.
   * @param dataObj - The object to check for the presence of answer[x] fields.
   * @returns The answer[x] field name found in the object, or the default for the primary type.
   */
  static resolveAnswerFieldName(type: string, altType: string, dataObj: object) {
    const answerType = Util._answerTypeMap[type];
    if (answerType in dataObj) {
      return answerType;
    } else {
      const answerAltType = Util._answerTypeMap[altType];
      return (answerAltType in dataObj) ? answerAltType : answerType;
    }
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
  static dateValidator(value: string, formProperty: FormProperty): any[] {
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

  /**
   * Generates a unique identifier string using UUID v4 format.
   *
   * This function creates a unique identifier in the format of
   * "xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx", consisting of 36 characters,
   * including four hyphens.
   * @returns - A string that represents a UUID v4.
   */
  static generateUniqueId(): string {
    return uuidv4();
  }

  /**
   * Return base url from input. Input could be base plus /Questionnaire/$validate, in addition to possible
   * search parameters.
   *
   * @param fhirUrl - Input url.
   *
   * @return baseUrl of the fhir server.
   */
  static extractBaseUrl(fhirUrl: fhirPrimitives.url): fhirPrimitives.url {
    let url: URL;
    try {
      url = new URL(fhirUrl);
      if(!/^https?:$/i.test(url.protocol)) {
        return null;
      }
    } catch(e) {
      return null;
    }

    let ret: fhirPrimitives.url; // If the input is baseUrl or url with search params, return as it is.
    const re = /(\/questionnaire\/\$validate)$/i;
    if(url.pathname && re.test(url.pathname)) {
      ret = url.origin + url.pathname.replace(re, '');
    } else if(url.pathname && url.pathname.length > 1) {
      ret = url.origin + url.pathname;
    } else {
      ret = url.origin;
    }

    return ret;
  }


  /**
   * Removes the anchor tags (<a> and </a>) from a given string and replaces them with a specified string.
   * @param str - the input string that potentiallly including anchor tags.
   * @param replaceWith - string to insert either before or after the text inside the removed anchor tags.
   * @param position - defines whether to insert the replace string 'before' or 'after' the replacement string.
   * @returns - a new string with the anchor tags removed and replaced according to the specified position.
   */
  static removeAnchorTagFromString(str: string, replaceWith: string, position: string = 'after'): string {
    const regex = /<a[^>]*>(.*?)<\/a>/g;
    let replacement;

    if (position === 'before') {
      replacement = replaceWith + '$1';
    } else {
      replacement = '$1' + replaceWith;
    }

    return str.replace(regex, replacement);
  }

  /**
   * Detect FHIR version of a resource. Uses LForms library, which currently supports Questionnaire and
   * QuestionnaireResponse.
   *
   * @param resource - FHIR Resource to examine. In form builder it is almost always Questionnaire.
   * @return - Detected FHIR version such as STU3, R4, R5 etc., or null if fails to detect.
   */
  static detectFHIRVersion(resource: fhir.Resource): string {
    if(Util.isDefaultForm(resource as fhir.Questionnaire)) {
      return 'R5';
    }
    let ret: string = LForms.Util.detectFHIRVersion(resource);
    if(!ret) {
      ret = LForms.Util.guessFHIRVersion(resource);
    }
    return ret;
  }
  /**
   * Convert a given questionnaire to desired version. R5 is also the internal format.
   * Other formats are converted to internal format using LForms library when loading an external form.
   *
   * @param initialQ - A given questionnaire. Could be STU3, R4, R5 etc.
   * @param version - A valid versions string, i.e. STU3|R4|R5 etc.
   */
  static convertQuestionnaire(initialQ: fhir.Questionnaire, version: string): fhir.Questionnaire {
    let ret = initialQ;
    const v = Util.detectFHIRVersion(initialQ);
    if(v !== version) {
      const resp: any = convert(initialQ, v, version);
      // Remove tags added by the converter.
      Util.removeElementsFromArray(resp?.data?.meta?.tag, (tag: fhir.Coding) => {
        return (/^lhc-qnvconv-(STU3|R4|R5|R6)-to-(STU3|R4|R5|R6)$/i.test(tag?.code));
      });
      if(resp?.data?.meta?.tag && resp.data.meta.tag.length === 0) {
        delete resp.data.meta.tag;
      }
      ret = resp.data;
    }
    return ret;
  }

  /**
   * Returns the name of the value field for a given FHIR data type.
   * @param type - one of the fhir data types.
   * @returns - a field name in the format 'value' + CamelCase(type).
   */
  static getValueDataTypeName(type: string): string {
    if (type === TYPE_TEXT) {
      type = TYPE_STRING;
    }
    return 'value' + type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Remove elements based on the boolean value returned by the callback.
   *
   * @param arr - Array to prune
   * @param callback - Truthy call back. The function will be passed the element and its index in the array.
   */
  static removeElementsFromArray(arr: any [], callback) {
    for(let i = arr?.length - 1; arr && i >= 0; i--) {
      if(callback(arr[i], i)) {
        arr.splice(i, 1);
      }
    }
  }

  /**
   * Checks if a value has FHIR Coding-like properties (system and code).
   *
   * @param value - The value to check
   * @returns True if the value is an object containing 'system' and 'code'
   */
  static hasSystemAndCode(value: any): value is Partial<fhir.Coding> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    return 'code' in value && 'system' in value;
  }

  /**
   * Compares two FHIR Coding objects for equality.
   * Returns true if both codings have system and code, and all of the following match:
   *   - system (ignoring leading/trailing whitespace)
   *   - code (ignoring leading/trailing whitespace)
   *   - version (treats undefined, null, and empty as equivalent)
   *
   * @param a - The first FHIR Coding object.
   * @param b - The second FHIR Coding object.
   * @returns True if the codings are considered equal, otherwise false.
   */
  static areFhirCodingsEqual(a: fhir.Coding, b: fhir.Coding): boolean {
    if (!this.hasSystemAndCode(a) || !this.hasSystemAndCode(b)) {
      return false;
    }

    if (!a.system || !b.system || !a.code || !b.code) {
      return false;
    }

    const systemMatch = a.system.trim() === b.system.trim();
    const codeMatch = a.code.trim() === b.code.trim();

    // Treat undefined/null/empty the same way
    const aVersion = a.version?.trim() || null;
    const bVersion = b.version?.trim() || null;
    const versionMatch = aVersion === bVersion;

    return systemMatch && codeMatch && versionMatch;
  }

  /**
   * Determines whether a valueCoding object is considered empty.
   * A valueCoding is considered empty if either its 'display' or 'code' property is missing or falsy.
   *
   * @param valueCoding - The valueCoding object to check.
   * @returns - true if valueCoding is empty; otherwise, false.
   */
  static isEmptyValueCoding(valueCoding: any): boolean {
    return !(valueCoding?.display && valueCoding?.code);
  }

  /**
   * Determines whether the provided array of answer options is empty for a given FHIR data type.
   * For 'coding' type, checks if any answer option has both 'display' and 'code' in 'valueCoding'.
   * For other types, checks if any answer option has a value for the corresponding value[x] field.
   *
   * @param ansOpts - An array of answer option objects.
   * @param type - The FHIR data type (e.g., 'coding', 'string', 'boolean', etc.).
   * @returns true if the answer option array is empty for the given type, otherwise false.
   */
  static isEmptyAnswerOptionForType(ansOpts: any, type: string): boolean {
    if (!ansOpts || ansOpts.length === 0) {
      return true;
    }

    if (type === TYPE_CODING) {
      return !ansOpts.some(ansOpt => (ansOpt?.valueCoding?.code));
    } else {
      const valueFieldName = this.getValueFieldName(type);
      return !ansOpts.some(ansOpt => ansOpt[valueFieldName]);
    }
  }

  /**
   * Traverses up the tree from a given descendant node and invokes a callback function for each ancestor node. It
   * returns the first ancestor node for which the callback returns true.
   *
   * @param descendant - The descendant node from which to start the search.
   * @param callback - A function that takes a node as an argument and returns a boolean value.
   * The search stops when this function returns true.
   * @return - The first ancestor node for which the callback returns true, or null if no such node is found.
   */
  static findAncestralNode(descendant: ITreeNode, callback: (node: ITreeNode) => boolean): ITreeNode {
    let ret: ITreeNode = null;
    let targetNode = descendant?.parent;
    while (targetNode) {
      const found = callback(targetNode);
      if (found) {
        ret = targetNode; // Found the target node that meets the criteria.
        break;
      }
      targetNode = targetNode.parent;
    }
    return ret;
  }

  /**
   * Determines whether the provided array of initials is empty for a given FHIR data type.
   * For 'coding' type, checks if any initial has a value for the corresponding value[x] field.
   *
   * @param initials - An array of initial objects.
   * @param type - The FHIR data type (e.g., 'coding', 'string', 'boolean', etc.).
   * @returns true if the initials array is empty for the given type, otherwise false.
   */
  static isEmptyInitialForType(initials: any, type: string): boolean {
    if (!initials || initials.length === 0) {
      return true;
    }

    const valueFieldName = this.getValueFieldName(type);
    return !initials.some(initial => initial[valueFieldName]);
  }
}

