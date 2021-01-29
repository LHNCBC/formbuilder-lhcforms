/**
 * A utility class
 */
import {PropertyGroup} from 'ngx-schema-form/lib/model';

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
}
