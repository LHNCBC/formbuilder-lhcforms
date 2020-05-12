import {FormProperty} from 'ngx-schema-form';
import {PropertyGroup} from 'ngx-schema-form/lib/model';

export class Util {
  static capitalize(str) {
    let ret = '';
    if (str && str.length > 0) {
      ret = str.split(/(?=[A-Z])/).join(' ');
      ret = ret.charAt(0).toUpperCase() + ret.substring(1);
    }
    return ret;
  }

  static isVisible(formProperty: PropertyGroup, propertyId: string) {
    const path = propertyId.split('.');
    let visible = formProperty.visible;
    for (let i = 0; i < path.length && visible; i++) {
      formProperty = formProperty.getProperty(path[i]);
      visible = formProperty.visible;
    }
    return visible;

  }
}
