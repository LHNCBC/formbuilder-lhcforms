import { Injectable } from '@angular/core';
import {ArrayProperty, FormProperty} from '@lhncbc/ngx-schema-form';
import fhir from 'fhir/r4';
import {Observable, Subject, Subscription} from 'rxjs';
import {fhirPrimitives} from '../fhir';

/**
 * This class is intended for components which needs to interact with extension field.
 * The service is instantiated along with sf-form. The host component instantiating sf-form,
 * should instantiate this service. Also make sure to get fresh reference
 * to extension: ArrayProperty whenever the model has changed, typically in ngOnChanges().
 */

@Injectable({
  // Provide a service in the root, which is accessed by form-level fields. The item level fields have their instance of this service.
  providedIn: 'root'
})
// @ts-ignore
export class ExtensionsService {
  static __ID = 0;
  _id = 'extensionServiceInstance_';
  extensionsProp: ArrayProperty;
  _propertyMap: Map<fhirPrimitives.url, FormProperty []> = new Map();
  _extMap: Map<fhirPrimitives.url, fhir.Extension []> = new Map();
  subscriptions: Subscription [] = [];
  extensionsChange$: Subject<fhir.Extension []> = new Subject<fhir.Extension []>();

  constructor() {
    this._id = this._id + ExtensionsService.__ID++;
  }


  /**
   * Set extensions ArrayProperty. This is the form property obtained
   * from form.rootProperty.get('extension'). It should be set any time the form's model is changed.
   *
   * @param extensions - ArrayProperty of 'extension' field.
   */
  setExtensions(extensions: ArrayProperty) {
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
    this.subscriptions = [];
    this.extensionsProp = extensions;
    const sub = this.extensionsProp.valueChanges.subscribe((vals) => {
      this.updateMaps();
      this.extensionsChange$.next(vals);
    });
    this.subscriptions.push(sub);
  }


  /**
   * Access observable to subscribe for notifications on changes.
   */
  get extensionsObservable(): Observable<fhir.Extension[]> {
    return this.extensionsChange$.asObservable();
  }


  /**
   * Group the extensions by their url.
   */
  updateMaps() {
    this._extMap.clear();
    this._propertyMap.clear();
    this._propertyMap = (this.extensionsProp.properties as FormProperty [])
      .reduce((acc: Map<fhirPrimitives.url, FormProperty[]>, property: FormProperty, index: number) => {
      let properties: FormProperty [] = acc.get(property.value.url);
      let values = this._extMap.get(property.value.url);
      if(!properties) {
        properties = [];
        values = [];
        acc.set(property.value.url, properties);
        this._extMap.set(property.value.url, values);
      }
      properties.push(property);
      values.push(property.value);
      return acc;
    }, this._propertyMap);
  }


  /**
   * Get an array of all extension objects identified by the url.
   * @param extUrl - Url to identify the extensions.
   */
  public getExtensionsByUrl(extUrl: fhirPrimitives.url): fhir.Extension [] {
    return this._extMap.get(extUrl);
  }


  /**
   * Get first extension object identified by the url.
   * @param extUrl - Url to identify the extension.
   */
  public getFirstExtensionByUrl(extUrl: fhirPrimitives.url): fhir.Extension {
    const extensions = this._extMap.get(extUrl);
    return extensions?.length > 0 ? extensions[0] : null;
  }


  /**
   * Get an array of all extension form properties for a given extension url.
   * @param extUrl - Url to identify the extension.
   */
  getExtensionFormPropertiesByUrl(extUrl: fhirPrimitives.url): FormProperty [] {
    return this._propertyMap.get(extUrl);
  }


  /**
   * Get a single extension form property.
   * @param extUrl - Url to identify the extension.
   */
  getFirstExtensionFormPropertyByUrl(extUrl: fhirPrimitives.url): FormProperty {
    const props = this._propertyMap.get(extUrl);
    return props?.length > 0 ? props[0] : null;
  }


  /**
   * Remove all extensions matching the given url.
   * @param extUrl - Url to identify the extension.
   */
  removeExtensionsByUrl(extUrl: string) {
    this.removeAllExtensions((ext) => {
      return ext.value.url === extUrl;
    });
  }


  /**
   * Remove all extensions that match a given criteria.
   * A callback method 'match` is called for each extension. Al
   * If it returns true, that extension is included in the removal list.
   * @param match - Callback with argument of FormProperty for an extension in the ArrayProperty.
   */
  removeAllExtensions(match: (e: FormProperty)=>boolean): void {
    const otherExts: any [] = (this.extensionsProp.properties as FormProperty[]).filter((ext) => {
      return !match(ext);
    }).map(p => p.value);

    if(otherExts.length !== this.extensionsProp.properties.length) {
      this.extensionsProp.reset(otherExts, false);
    }
  }


  /**
   * Remove the first extension that matches a criteria. A callback method 'match` is called for each extension
   * The first extension that returns true is removed.
   * @param match - Callback with argument of FormProperty for an extension in the ArrayProperty.
   */
  removeExtension(match: (e: FormProperty)=>boolean): void {
    const extension: FormProperty = (this.extensionsProp.properties as FormProperty[]).find((ext) => {
      return match(ext);
    });
    this.extensionsProp.removeItem(extension);
    this.extensionsChange$.next(this.extensionsProp.value);
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
  addExtension(ext: fhir.Extension, valueType: string): FormProperty {
    const extProp = this.extensionsProp.addItem(ext);
    if(valueType) {
      this.pruneUnusedValues(extProp, valueType);
    }
    this.extensionsChange$.next(this.extensionsProp.value);

    return extProp;
  }


  /**
   * Remove unused value[x] fields from extension.
   *
   * @param extProperty - Extension form property
   * @param keepValueType - value[x] to keep.
   */
  pruneUnusedValues(extProperty: FormProperty, keepValueType: string) {
    const value = extProperty.value;
    const keys = Object.keys(value);
    for (const key of keys) {
      if(value.hasOwnProperty(key) && key.startsWith('value') && key !== keepValueType) {
        delete value[key];
      }
    }
    return extProperty;
  }


  /**
   * Reset the extension's form property
   * @param extUrl - Url of the extension to identify
   * @param value - New value to reset with.
   * @param valueType - This is one of the value[x] applicable to this extension
   * @param selfOnly - Emit change event to only self. False, emits the event to parent.
   *   Refer angular's reactive form documentation for more information.
   */
  resetExtension(extUrl: fhirPrimitives.url, value: fhir.Extension, valueType: string, selfOnly: boolean) {
    const extProp: FormProperty = this.getFirstExtensionFormPropertyByUrl(extUrl);
    if(extProp) {
      extProp.reset(value, selfOnly);
    }
    else {
      this.addExtension(value, valueType);
    }
  }
}
