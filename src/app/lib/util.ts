/**
 * A utility class
 */
import {PropertyGroup} from 'ngx-schema-form/lib/model';
import {FormProperty} from 'ngx-schema-form';

export class Util {
  // Capitalize the camel case strings.
  static capitalize(str) {
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
   * @param json - Input to test the empty ness.
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
      for(let i = 0, keys = Object.keys(json); ret && i < keys.length; i++) {
        if(json.hasOwnProperty(keys[i])) {
          ret = Util.isEmpty(json[keys[i]]);
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
      case 'YEAR':
        ret = 'date';
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
    }
    return ret;
  }


  /**
   * Convert lforms units to equivalent FHIR extensions.
   * @param units
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
}
