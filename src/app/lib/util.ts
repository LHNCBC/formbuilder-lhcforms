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
   * Identify if a particular widget under the group is visible.
   *
   * @param group - Group property of the widget
   * @param isEmptyCallback - Optional: Function to define emptyness. Takes FormProperty as argument
   */
  /*
  static isEmpty(group: PropertyGroup, isEmptyCallback?: (FormProperty) => boolean) {
    if (!isEmptyCallback) {
      isEmptyCallback = (prop: FormProperty) => {
        let ret = false;
        ret = prop.value === undefined || prop.value === null || prop.value === '';
        if(!ret) {
          prop.value;
        }
        return ret;
      }
    }
    const props = group._properties;
    let empty = true;
    for (let i = 0; i < props.length && empty; i++) {
      empty = isEmptyCallback(props[i]);
    }
    return empty;
  }
*/

  static isEmpty(json: unknown): boolean {
    let ret = true;
    if (typeof json === 'number') {
      ret = false; // number is non-empty
    }
    else if(typeof json === 'string') {
      ret = json.length === 0; // empty string is empty
    }
    else if(!json) {
      ret = true; // null and undefined
    }
    else if (json instanceof Date) {
      ret = false; // Date is non-empty
    }
    else if(Array.isArray(json)) {
      for(let i = 0; ret && i < json.length; i++) {
        ret = Util.isEmpty(json[i]);
      }
    }
    else if (typeof json === 'object') {
      for(let i = 0, keys = Object.keys(json); ret && i < keys.length && !ret; i++) {
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
}
