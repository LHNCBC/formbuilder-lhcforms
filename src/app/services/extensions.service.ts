import {DestroyRef, inject, Injectable } from '@angular/core';
import {ArrayProperty, FormProperty} from '@lhncbc/ngx-schema-form';
import fhir from 'fhir/r4';
import {Observable, Subject, Subscription} from 'rxjs';
import {fhirPrimitives} from '../fhir';
import {SchemaService} from "./schema.service";
import {
  EXTENSION_URL_ENTRY_FORMAT,
  EXTENSION_URL_VARIABLE,
  EXTENSION_URL_CUSTOM_VARIABLE_TYPE,
  EXTENSION_URL_INITIAL_EXPRESSION,
  EXTENSION_URL_CALCULATED_EXPRESSION,
  EXTENSION_URL_CHOICE_ORIENTATION,
  EXTENSION_URL_COLUMN_COUNT,
  EXTENSION_URL_COLUMN_COUNT_LEGACY,
  EXTENSION_URL_ANSWER_EXPRESSION,
  EXTENSION_URL_ENABLEWHEN_EXPRESSION,
  EXTENSION_URL_ITEM_CONTROL,
  EXTENSION_URL_MAX_SIZE,
  EXTENSION_URL_MAX_VALUE,
  EXTENSION_URL_MIME_TYPE,
  EXTENSION_URL_MIN_LENGTH,
  EXTENSION_URL_MIN_VALUE,
  EXTENSION_URL_QUESTIONNAIRE_UNIT,
  EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
  EXTENSION_URL_REGEX,
  PREFERRED_TERMINOLOGY_SERVER_URI
} from '../lib/constants/constants';
import {ObservationLinkPeriodComponent} from "../lib/widgets/observation-link-period/observation-link-period.component";
import {ObservationExtractComponent} from "../lib/widgets/observation-extract/observation-extract.component";
import {Util} from "../lib/util";

export type ExtensionEditorScope = 'form' | 'item';

interface DedicatedExtensionDefinition {
  url: string;
  fieldName: string;
  fieldNameByScope?: Partial<Record<ExtensionEditorScope, string>>;
  fieldLocationByScope?: Partial<Record<ExtensionEditorScope, string>>;
  alternativeFieldNames?: ReadonlyArray<string>;
  fieldScope: ExtensionEditorScope | 'both';
  fieldSection?: 'advanced';
}

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
export class ExtensionsService {
  static __ID = 0;

  /** URLs, labels, and locations for extensions managed outside the general editor. */
  private readonly dedicatedExtensionDefinitions: ReadonlyArray<DedicatedExtensionDefinition> = [
    {url: EXTENSION_URL_ENTRY_FORMAT, fieldName: 'Entry format', fieldScope: 'item'},
    {
      url: EXTENSION_URL_VARIABLE,
      fieldName: 'Variables',
      fieldNameByScope: {item: 'Item variables'},
      fieldScope: 'both'
    },
    {
      url: EXTENSION_URL_CUSTOM_VARIABLE_TYPE,
      fieldName: 'Variable Type',
      fieldLocationByScope: {
        form: ' in the “Create/edit variables” dialog opened from the “Variables” section',
        item: ' in the “Create/edit variables” dialog opened from the “Item variables” section'
      },
      fieldScope: 'both'
    },
    {url: EXTENSION_URL_INITIAL_EXPRESSION, fieldName: 'Value method', fieldScope: 'item'},
    {url: EXTENSION_URL_CALCULATED_EXPRESSION, fieldName: 'Value method', fieldScope: 'item'},
    {url: EXTENSION_URL_ANSWER_EXPRESSION, fieldName: 'Answer list source', fieldScope: 'item'},
    {
      url: EXTENSION_URL_ENABLEWHEN_EXPRESSION,
      fieldName: 'Conditional method',
      fieldScope: 'item',
      fieldSection: 'advanced'
    },
    {
      url: EXTENSION_URL_ITEM_CONTROL,
      fieldName: 'Answer list layout',
      alternativeFieldNames: [
        'Question item control',
        'Group Item Control',
        'Display Item Control'
      ],
      fieldScope: 'item'
    },
    {url: EXTENSION_URL_CHOICE_ORIENTATION, fieldName: 'Choice orientation', fieldScope: 'item'},
    {url: EXTENSION_URL_COLUMN_COUNT, fieldName: 'Column count', fieldScope: 'item'},
    {url: EXTENSION_URL_COLUMN_COUNT_LEGACY, fieldName: 'Column count', fieldScope: 'item'},
    {url: EXTENSION_URL_MIN_LENGTH, fieldName: 'Restrictions', fieldScope: 'item'},
    {url: EXTENSION_URL_REGEX, fieldName: 'Restrictions', fieldScope: 'item'},
    {url: EXTENSION_URL_MIN_VALUE, fieldName: 'Restrictions', fieldScope: 'item'},
    {url: EXTENSION_URL_MAX_VALUE, fieldName: 'Restrictions', fieldScope: 'item'},
    {url: EXTENSION_URL_MAX_SIZE, fieldName: 'Restrictions', fieldScope: 'item'},
    {url: EXTENSION_URL_MIME_TYPE, fieldName: 'Restrictions', fieldScope: 'item'},
    {url: EXTENSION_URL_QUESTIONNAIRE_UNIT, fieldName: 'Units', fieldScope: 'item'},
    {url: EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION, fieldName: 'Units', fieldScope: 'item'},
    {url: PREFERRED_TERMINOLOGY_SERVER_URI, fieldName: 'Terminology server', fieldScope: 'both'},
    {
      url: ObservationLinkPeriodComponent.extUrl,
      fieldName: 'Add link to pre-populate FHIR Observation?',
      fieldScope: 'item',
      fieldSection: 'advanced'
    },
    {
      url: ObservationExtractComponent.extUrl,
      fieldName: 'Use FHIR Observation extraction?',
      fieldScope: 'item',
      fieldSection: 'advanced'
    }
  ];

  private readonly dedicatedExtensionFields: ReadonlyMap<string, DedicatedExtensionDefinition> = new Map([
    ...this.dedicatedExtensionDefinitions.map((definition) => [definition.url, definition] as const),
    // This field is supplied by the questionnaire-hidden feature. Keeping its
    // metadata here makes the central validation message ready when its URL is
    // registered in extensionsEditedInWidgets.
    ['http://hl7.org/fhir/StructureDefinition/questionnaire-hidden', {
      url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-hidden',
      fieldName: 'Hide this item from users?',
      fieldScope: 'item'
    }]
  ]);

  extensionsEditedInWidgets: Set<string> = new Set(
    this.dedicatedExtensionDefinitions.map(({url}) => url)
  );

  _id = 'extensionServiceInstance_';
  extensionsProp: ArrayProperty;
  _propertyMap: Map<fhirPrimitives.url, FormProperty []> = new Map();
  _extMap: Map<fhirPrimitives.url, fhir.Extension []> = new Map();
  subscriptions: Subscription [] = [];
  extensionsChange$: Subject<fhir.Extension []> = new Subject<fhir.Extension []>();

  schemaService = inject(SchemaService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this._id = this._id + ExtensionsService.__ID++;
    this.destroyRef.onDestroy(() => {
      this.subscriptions.forEach((s) => {
        s.unsubscribe();
      });
    });
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
   * Reset form property with new extensions.
   *
   * @param extensions
   */
  resetExtensions(extensions: fhir.Extension []) {
    this.extensionsProp.setValue(extensions, false);
  }

  /**
   * Get current value from the extension'`s form property.
   */
  getExtensionsValue(): fhir.Extension [] {
    return this.extensionsProp.value;
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
        const url = property.value.url;
        if(url) {
          let properties: FormProperty [] = acc.get(url);
          let values = this._extMap.get(url);
          if(!properties) {
            properties = [];
            values = [];
            acc.set(url, properties);
            this._extMap.set(url, values);
          }
          properties.push(property);
          values.push(property.value);
        }
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
   * Get the last extension object identified by the url.
   * @param extUrl - Url to identify the extension.
   */
  public getLastExtensionByUrl(extUrl: fhirPrimitives.url): fhir.Extension {
    const extensions = this._extMap.get(extUrl);
    return extensions?.length > 0 ? extensions[extensions?.length - 1] : null;
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
   * Remove expression extensions
   * @returns - returns the array of extensions excluding the extensions of type Initial Expression, Calculated Expression, or Answer Expression.
   */
  removeExpressionExtensions(): any {
    this.removeAllExtensions((ext) => {
      return (ext.value.url === EXTENSION_URL_INITIAL_EXPRESSION || ext.value.url === EXTENSION_URL_CALCULATED_EXPRESSION || ext.value.url === EXTENSION_URL_ANSWER_EXPRESSION);
    });
  }

  /**
   * Remove all extensions that match a given criteria.
   * A callback method 'match` is called for each extension.
   * If it returns true, the extension is removed.
   * @param match - Callback with arguments of FormProperty and its index in the ArrayProperty.
   *     arguments:
   *       e: FormProperty - Element in the array.
   *       index: number - Index of the element in the array.
   */
  removeAllExtensions(match: (e: FormProperty, index: number)=>boolean): void {
    const otherExts: any [] = (this.extensionsProp.properties as FormProperty[]).filter((ext, ind) => {
      return !match(ext, ind);
    }).map(p => p.value);

    if(otherExts.length !== this.extensionsProp.properties.length) {
      this.extensionsProp.reset(otherExts, false);
    }
  }

  /**
   * Updates the last extension in the array that matches the given URL with the provided extension object.
   * If no extension with the specified URL exists, appends the new extension to the array.
   * Notifies subscribers of the change.
   * @param extUrl - The URL used to identify the extension to update or append.
   * @param newExtensionJSON - The new extension object to insert or update.
   */
  updateOrAppendExtensionByUrl(extUrl: fhirPrimitives.url, newExtensionJSON: fhir.Extension): void {
    let endIndex = this.extensionsProp?.value?.findLastIndex(ext => ext.url === extUrl);

    if (endIndex === -1) {
      this.extensionsProp.addItem(newExtensionJSON);
    } else {
      this.extensionsProp?.value.splice(endIndex, 1, newExtensionJSON);
      this.extensionsChange$.next(this.extensionsProp.value);
    }
  }

  /**
   * Remove extensions by url and index.
   * @param extUrl - Url to identify the extension.
   * @param index - Index occurrence of the given url.
   */
  removeExtensionByUrlAtIndex(extUrl: fhirPrimitives.url, matchIndex: number) {
    const matchingIndexes = (this.extensionsProp.properties as FormProperty[])
                                .map((ext: any, i: number) => (ext.value.url === extUrl ? i : -1))
                                .filter((i) => i !== -1);

    if (matchIndex >= 0 && matchIndex < matchingIndexes.length) {
      const arrayIndex = matchingIndexes[matchIndex];
      this.extensionsProp.removeItem(this.extensionsProp.properties[arrayIndex]);
    }
  }

  /**
   * Replace extensions for the given url.
   * @param extUrl - Url to identify the extension.
   * @param newExtensionsJSON - New extensions to replace with.
   */
  replaceExtensions(extUrl: fhirPrimitives.url, newExtensionsJSON: any): void {
    const originalExtensions = this.extensionsProp.value;

    // If there are no original extensions, assign the new one.
    if (!originalExtensions.length) {
      this.extensionsProp.reset(newExtensionsJSON, false);
      return;
    }

    if (newExtensionsJSON && newExtensionsJSON.length > 0) {
      // Find the start and end indexes of the consecutive block of variable extensions.
      let startIndex = originalExtensions.findIndex((ext) => ext.url === extUrl);
      if (startIndex === -1) {
        // Not in the original list, append the new ones.
        this.extensionsProp.reset([...originalExtensions, ...newExtensionsJSON]);
        return;
      };

      let endIndex = startIndex + 1;
      while (endIndex < originalExtensions.length && originalExtensions[endIndex].url === extUrl) {
        endIndex++;
      }

      // Replace the original extensions with the new ones.
      this.extensionsProp.reset([
        ...originalExtensions.slice(0, startIndex),
        ...newExtensionsJSON,
        ...originalExtensions.slice(endIndex)
      ]);
    } else {
      // newExtensionsJSON is undefined, so reset it to empty.
      // This is the case where all variables got deleted via the Expression Editor
      this.removeExtensionsByUrl(extUrl);
    }
  }

  /**
   * Replace extensions for the given url.
   * @param extUrl - Url to identify the extension.
   * @param newExtensionsJSON - New extensions to replace with.
   */
  insertExtensionAfterURL(extUrl: fhirPrimitives.url, newExtensionsJSON: any): void {
    const originalExtensions = this.extensionsProp.value;

    // If there are no original extensions, assign the new one.
    if (!originalExtensions.length) {
      this.extensionsProp.reset(newExtensionsJSON, false);
      return;
    }

    // Find the start and end indexes of the consecutive block of variable extensions.
    const indexFromEnd = originalExtensions.slice().reverse().findIndex((ext) => ext.url === extUrl);
    if (indexFromEnd === -1) {
      this.extensionsProp.reset([...originalExtensions, ...newExtensionsJSON,]);
      return;
    };

    const startIndex = originalExtensions.length - indexFromEnd;

    // Replace the original extensions with the new ones.
    this.extensionsProp.reset([
      ...originalExtensions.slice(0, startIndex),
      ...newExtensionsJSON,
      ...originalExtensions.slice(startIndex)
    ]);
  }

  /**
   * The function checks if either 'url' or 'valueExpression.expression' is missing or empty.
   * @param valueExpression - input object that may contain 'url' and 'valueExpression.expression'
   * @return - True if either or both 'url' or 'valueExpression.expression' are missing or empty, otherwise false.
   */
  isEmptyValueExpression(valueExpression: any): boolean {
    return !(valueExpression?.url && valueExpression?.valueExpression?.expression);
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
    this.updateExtension(ext);
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

  /**
   * Check if the extension is editable in the extension dialog.
   * Surrounding whitespace is ignored so the same comparison can be used while
   * validating URLs entered in the general Extensions editor.
   *
   * @param url - Extension URL to check.
   * @returns - True if the extension is not editable in dialog.
   */
  isNotEditableInDlg(url: fhirPrimitives.url): boolean {
    return this.extensionsEditedInWidgets.has(url?.trim());
  }

  /**
   * Build the validation message shown when a managed URL is entered in the
   * general Extensions editor.
   *
   * @param url - Managed extension URL entered by the user.
   * @param editorScope - Scope containing the general Extensions editor.
   * @returns Guidance pointing to the dedicated field when its label is known.
   */
  getManagedExtensionValidationMessage(
    url: fhirPrimitives.url,
    editorScope?: ExtensionEditorScope
  ): string {
    const field = this.dedicatedExtensionFields.get(url?.trim());
    let location = field?.fieldLocationByScope?.[editorScope] || '';
    if(!location && editorScope === 'form' && field?.fieldScope === 'item') {
      location = field.fieldSection === 'advanced'
        ? ' under a questionnaire item’s Advanced fields'
        : ' on a questionnaire item';
    }
    else if(!location && editorScope === 'item' && field?.fieldScope === 'form') {
      location = ' in the form attributes';
    }
    if(!field) {
      return 'This extension is managed by a dedicated Form Builder field and cannot be added here.';
    }

    const primaryFieldName = field.fieldNameByScope?.[editorScope] || field.fieldName;
    const fieldNames = [primaryFieldName, ...(field.alternativeFieldNames || [])];
    if(fieldNames.length === 1) {
      return `This extension cannot be added here. Use the dedicated “${primaryFieldName}” field${location} instead.`;
    }

    const quotedFieldNames = fieldNames.map((fieldName) => `“${fieldName}”`);
    const lastFieldName = quotedFieldNames.pop();
    return `This extension cannot be added here. Use one of the dedicated ${quotedFieldNames.join(', ')}, or ${lastFieldName} fields${location} instead.`;
  }

  updateExtension(newValue: fhir.Extension) {
    if(newValue) {

      // If the new value is an extension, we need to set the __$isValueX and __$valueType properties
      // so that the dialog can handle it correctly.
      Util.eliminateEmptyFields(newValue);
      const valueX = Object.keys(newValue).find((key) => {
        return key.startsWith('value');
      });
      newValue['__$isValueX'] = !!valueX;
      if(newValue['__$isValueX']) {
        newValue['__$valueType'] = valueX;
        const categoryMap = this.schemaService.valueXCategoryMap;
        newValue[categoryMap[valueX]] = valueX;
        newValue['__$valueTypeCategory'] = categoryMap[valueX];
        newValue['__$stringify'] = JSON.stringify(newValue[valueX]);
      }
      else {
        delete newValue[newValue['__$valueTypeCategory']];
        delete newValue['__$valueTypeCategory'];
        newValue['__$valueType'] = 'extension';
        newValue['__$stringify'] = JSON.stringify(newValue.extension,
          (k, v) => k.startsWith('__$') ? undefined : v);
      }

    }
    return newValue;
  }
}
