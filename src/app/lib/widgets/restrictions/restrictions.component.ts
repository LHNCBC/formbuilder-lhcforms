import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {TableComponent} from '../table/table.component';
import {PropertyGroup} from '@lhncbc/ngx-schema-form';
import fhir from 'fhir/r4';
import {RestrictionOperatorService} from '../../../services/restriction-operator.service';
import {AcceptChange} from '../restrictions-operator/restrictions-operator.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';

/**
 * Restrictions are based on table component.
 * Combines maxLength field which is part of standard FHIR with SDC extensions.
 */
@Component({
  standalone: false,
  selector: 'lfb-restrictions',
  templateUrl: '../table/table.component.html',
  styleUrls: ['../table/table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RestrictionOperatorService] // A service for this instance of component.
})
export class RestrictionsComponent extends TableComponent implements OnInit {

  // Map display strings and urls to restrictions.
  static optionsDef = {
    maxLength: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/maxLength',
      display: 'Maximum length'
    },
    minLength: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/minLength',
      display: 'Minimum length'
    },
    regex: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/regex',
      display: 'Regex pattern'
    },
    minValue: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/minValue',
      display: 'Minimum value'
    },
    maxValue: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/maxValue',
      display: 'Maximum value'
    },
    maxSize: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/maxSize',
      display: 'Maximum size'
    },
    mimeType: {
      extUrl: 'http://hl7.org/fhir/StructureDefinition/mimeType',
      display: 'Mime type'
    }
  };

  static stringOptions = RestrictionsComponent.getOptions(['maxLength', 'minLength', 'regex']);
  static numberOptions = RestrictionsComponent.getOptions(['maxValue', 'minValue', 'maxLength', 'minLength']);
  static attachOptions = RestrictionsComponent.getOptions(['maxSize', 'mimeType']);

  static typeToOptions = {
    decimal: RestrictionsComponent.numberOptions,
    integer: RestrictionsComponent.numberOptions,
    //date: RestrictionsComponent.numberOptions,
    //dateTime: RestrictionsComponent.numberOptions,
    //time: RestrictionsComponent.numberOptions,
    string: RestrictionsComponent.stringOptions,
    text: RestrictionsComponent.stringOptions,
    attachment: RestrictionsComponent.attachOptions
  };

  // Map extension urls to options.
  static extUrlToOptionsMap = ((): any => {
    const ret = {};
    Object.keys(RestrictionsComponent.optionsDef).forEach((k) => {
      const url = RestrictionsComponent.optionsDef[k].extUrl;
      ret[url] = k;
    })
    return ret;
  })();

  // maxLength = -1;
  appliedOptions = [];
  dataType: string;

  selectedOptions: Set<string> = new Set<string>();

  /**
   * Get list of optionsDef objects for list of options.
   * @param optKeys - List of keys as defined in this.optionsDef.
   */
  static getOptions(optKeys: string[]) {
    return optKeys.map((opt) => {
      return RestrictionsComponent.optionsDef[opt];
    });
  }

  constructor(private restrictionOperatorService: RestrictionOperatorService,
              private extensionsService: ExtensionsService,
              private formService: FormService) {
    super();
  }


  ngOnInit(): void {
    super.ngOnInit();
    let sub = this.formProperty.root.getProperty('type').valueChanges.subscribe((type) => {
      this.dataType = type;
      this.appliedOptions = RestrictionsComponent.typeToOptions[type];
      const restrictions = this.getRestrictions(this.formProperty.root, this.appliedOptions);
      this.updateSelectedOptions(restrictions);
      this.formProperty.setValue(restrictions, true);
    });
    this.subscriptions.push(sub);
    let initializing = false;
    let updating = false;
    sub = this.extensionsService.extensionsObservable.subscribe((extensions) => {
      if(!updating) {
        // Initialization. Set up the widget reading the values from extensions.
        const restrictions = this.getRestrictions(this.formProperty.root, this.appliedOptions);
        this.updateSelectedOptions(restrictions); // Cache the selections.
        initializing = true;
        this.formProperty.setValue(restrictions, true);
        initializing = false;
      }
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.valueChanges.subscribe((restrictionsArray) => {
      if(!initializing) {
        // formProperty => __$restricions. Read all user actions, but not initialization.
        this.updateSelectedOptions(restrictionsArray); // Reset cache.
        const extensionProperty = this.formProperty.root.getProperty('extension');
        this.updateRelevantExtensions(extensionProperty.value, restrictionsArray);
        updating = true;
        extensionProperty.setValue(extensionProperty.value, true);
        updating = false;
      }
    });
    this.subscriptions.push(sub);

    // Watch changes in operator to reject unwanted selections.
    sub = this.restrictionOperatorService.subscribe((change: AcceptChange) => {
      if(this.selectedOptions.has(change.newValue)) {
        change.reject = true;
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Reset cache of selections
   * @param restrictions - Array of restriction objects.
   */
  updateSelectedOptions(restrictions ) {
    this.selectedOptions.clear();
    restrictions?.forEach((res) => {
      this.selectedOptions.add(res.operator);
    });
  }

  /**
   * Handle booleanControlled change event.
   * @param event - Angular event emitted value.
   */
  onBooleanControlledChange(event: boolean) {
    super.onBooleanControlledChange(event);
    if(this.booleanControlledOption) {
      this.formProperty.reset(null, false);
    }
  }

  /**
   * Get list of restrictions reading the fhir extensions and maxLength.
   * @param rootProperty - Root form property which represents an item level data.
   * @param appliedOptions - The options that are applicable to selected data type.
   */
  getRestrictions(rootProperty: PropertyGroup, appliedOptions: any []): any [] {
    const ret = [];
    this.selectedOptions.clear();
    const maxLength = rootProperty.getProperty('maxLength').value;
    if(maxLength) {
      ret.push({operator: 'maxLength', value: `${maxLength}`});
      this.selectedOptions.add('maxLength');
    }
    const extensions = rootProperty.getProperty('extension').value;
    const extensionsFound = extensions?.filter((el) => {
      return  !!appliedOptions?.find((opt) => {
        return opt.extUrl === el.url;
      });
    });
    extensionsFound?.forEach((ext) => {
      const restriction = this.getRestrictionValue(ext);
      if(restriction) {
        ret.push(restriction);
        this.selectedOptions.add(restriction.operator);
      }
    });
    return ret;
  }

  /**
   * Return object with relevant extension url as key and extension's index in array as value
   * @param extensions - Full array of fhir extensions belonging to the item.
   */
  getRelevantExtensionIndices(extensions: fhir.Extension []): any [] {
    let ret: any = null;
    Object.keys(RestrictionsComponent.optionsDef).forEach((opt) => {
      const index = extensions?.findIndex((ext) => {
        return ext.url === RestrictionsComponent.optionsDef[opt].extUrl;
      });
      if(index >= 0) {
        if(!ret) {
          ret = {};
        }
        ret[extensions[index].url] = index;
      }
    });
    return ret;
  }

  /**
   * Max length is not part of extensions.
   * @param maxLength - String representation of input value.
   */
  updateMaxLength(maxLength: string) {
    const val: number = maxLength ? parseInt(maxLength, 0) : null;
    this.formProperty.root.getProperty('maxLength').setValue(val);
  }

  /**
   * Update item level fhir extensions array with relevant restrictions.
   * @param extensions - Array of item level extensions.
   * @param restrictions - Arary of internally defined restriction objects.
   */
  updateRelevantExtensions(extensions: fhir.Extension [], restrictions: any []) {
    const indices = this.getRelevantExtensionIndices(extensions);
    Object.keys(RestrictionsComponent.optionsDef).forEach((opt) => {
      let ext: fhir.Extension;
      const extUrl = RestrictionsComponent.optionsDef[opt].extUrl;
      const restriction = restrictions.find((r) => r.operator === opt);
      if(opt === 'maxLength') {
        this.updateMaxLength(restriction?.value || null);
      }
      else if(restriction?.value) {
        if(indices && indices[extUrl] !== undefined && indices[extUrl] !== null) {
          // Update
          ext = extensions[indices[extUrl]];
          for(const key in ext) {
            if(/^value/.test(key)) delete ext[key];
          }
        }
        else {
          // new
          ext = {url: extUrl};
          extensions.push(ext);
        }
        const fieldInfo = this.getValueFieldName(opt, this.dataType);
        ext[fieldInfo.fieldName] = this.getValue(restriction.value, fieldInfo.fieldType);
      }
      else if(indices && indices[extUrl] !== undefined && indices[extUrl] !== null) {
        // delete
        extensions.splice(indices[extUrl], 1);
      }
    });
  }

  /**
   * Convert to string representation of value to appropriate value
   * @param value - String representation of value.
   * @param valueType - fhir data type of the value.
   */
  getValue(value: string, valueType: string): number | string {
    let ret: number | string = value;
    switch (valueType) {
      case 'integer':
        ret = parseInt(value, 10);
        break;
      case 'decimal':
        ret = parseFloat(value);
        break;
      case 'date':
      case 'dateTime':
      case 'time':
        ret = (new Date(value)).toISOString();
    }
    return ret;
  }


  /**
   * Given a fhir extension, convert to restriction object.
   * @param ext - fhir extension representing a restriction.
   */
  getRestrictionValue(ext: fhir.Extension) {
    let ret = null;
    const operator = RestrictionsComponent.extUrlToOptionsMap[ext.url];
    const valField = this.getValueFieldName(operator, this.dataType);
    if(valField.fieldName) {
      ret = {operator, value: `${ext[valField.fieldName]}`};
    }
    return ret;
  }


  /**
   * Return value[x] field based on option and data type.
   * @param option - 'maxLength'|'minLength'|'maxSize'|'minValue'|'maxValue'|'mimeType'|'regex'
   * @param type - one of the fhir data types.
   */
  getValueFieldName(option: string, type: string): any {
    const ret = {fieldName: '', fieldType: ''};
    switch (option) {
      case 'minLength':
      case 'maxSize':
        ret.fieldName = 'valueInteger';
        ret.fieldType = 'integer';
        break;

      case 'regex':
        ret.fieldName = 'valueString';
        ret.fieldType = 'string';
        break;

      case 'mimeType':
        ret.fieldName = 'valueCode';
        ret.fieldType = 'string';
        break;

      case 'minValue':
      case 'maxValue':
        ret.fieldName = type ? 'value' + type.charAt(0).toUpperCase() + type.slice(1) : '';
        ret.fieldType = type;
        break;
    }
    return ret;
  }
}
