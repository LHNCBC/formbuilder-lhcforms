import { Component, OnInit } from '@angular/core';
import {LfbArrayWidgetComponent} from '../lfb-array-widget/lfb-array-widget.component';
import {ArrayProperty, FormProperty} from '@lhncbc/ngx-schema-form';
import {fhir} from '../../../fhir';
import uri = fhir.uri;

@Component({
  selector: 'lfb-extensions',
  template: ``,
  styles: [
  ]
})
export class ExtensionsComponent extends LfbArrayWidgetComponent implements OnInit {
  extensionsProp: ArrayProperty;
  _extMap: Map<fhir.uri, fhir.Extension []> = new Map();

  constructor() {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.extensionsProp = this.formProperty.searchProperty('extension') as ArrayProperty;
    /* this.extensionsProp.valueChanges.subscribe((val) => {}); */
    this._extMap = this.extensionsProp.value.reduce((acc: Map<uri, any>, ext: fhir.Extension, index: number) => {
      let e: fhir.Extension [] = acc.get(ext.url);
      if(!e) {
        e = [];
        acc.set(ext.url, e);
      }
      e.push(ext);
      return acc;
    }, this._extMap);
  }


  /**
   * Remove extension from the array, matching url, code and system. Code and system are optional
   * and should be used to match with increased specificity.
   * @param url
   * @param code
   * @param system
   */
  removeExt(url: fhir.uri, code?: string, system?: fhir.uri) {
    const extension: FormProperty = (this.extensionsProp.properties as FormProperty[]).find((ext) => {
      let ret = ext.value.url === url;
      ret = code ? (ret && ext.value.valueCoding && ext.value.valueCoding.code === code) : ret;
      return system ? (ret && ext.value.valueCoding.system === system) : ret;
    });
    this.extensionsProp.removeItem(extension);
  }


  /**
   * Remove extensions by extension url.
   * @param extUrl
   */
  removeExtensionsByUrl(extUrl: string) {
    const otherExts: any [] = (this.extensionsProp.properties as FormProperty[]).filter((ext) => {
      return ext.value.url !== extUrl;
    }).map(p => p.value);

    if(otherExts.length !== this.extensionsProp.properties.length) {
      this.extensionsProp.reset(otherExts);
    }
  }


  /**
   * Remove extension comparing the fields of given extension.
   * @param ext
   */
  removeExtension(ext: fhir.Extension): void {

    this.removeExt(ext.url, ext.valueCoding.code, ext.valueCoding.system);
  }


  /**
   * Add extension property.
   * Extension will include only one of several possible value[x] fields. If the value type is passed, removes all other
   * empty value[x].
   *
   * @param ext - Extension object
   * @param valueType - Key of valueType. It starts with 'value' prefix. If given,
   *                    all other value[x] will be deleted from the property value.
   *
   */
  addExtension(ext: fhir.Extension, valueType) {
    const extProp = this.extensionsProp.addItem(ext);
    if(valueType) {
      this.pruneUnusedValues(extProp, valueType);
    }
    return extProp;
  }


  /**
   * Remove unused value[x] fields from extension.
   *
   * @param extProperty - Extension form property
   * @param keepValueType - value[x] to keep.
   */
  pruneUnusedValues(extProperty: FormProperty, keepValueType) {
    const value = extProperty.value;
    const keys = Object.keys(value);
    for (const key of keys) {
      if(value.hasOwnProperty(key) && key.startsWith('value') && key !== keepValueType) {
        delete value[key];
      }
    }
    return extProperty;
  }

}
