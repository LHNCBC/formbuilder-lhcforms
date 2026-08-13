import {CommonModule} from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatTooltipModule} from '@angular/material/tooltip';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TableComponent} from '../table/table.component';
import {PropertyGroup} from '@lhncbc/ngx-schema-form';
import fhir from 'fhir/r4';
import {RestrictionOperatorService} from '../../../services/restriction-operator.service';
import {AcceptChange} from '../restrictions-operator/restrictions-operator.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';
import {IsDisabledPipe} from '../../pipes/is-disabled.pipe';
import {BooleanControlledComponent} from '../boolean-controlled/boolean-controlled.component';
import {AppFormElementComponent} from '../form-element/form-element.component';
import {LabelComponent} from '../label/label.component';
import {TitleComponent} from '../title/title.component';

/**
 * Restrictions are based on table component.
 * Combines maxLength field which is part of standard FHIR with SDC extensions.
 */
@Component({
  selector: 'lfb-restrictions',
  imports: [
    AppFormElementComponent,
    BooleanControlledComponent,
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    IsDisabledPipe,
    LabelComponent,
    MatTooltipModule,
    NgbModule,
    TitleComponent
  ],
  templateUrl: '../table/table.component.html',
  styleUrls: ['../table/table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RestrictionOperatorService] // A service for this instance of component.
})
export class RestrictionsComponent extends TableComponent implements OnInit {
  private restrictionOperatorService = inject(RestrictionOperatorService);
  private extensionsService = inject(ExtensionsService);
  private formService = inject(FormService);


  // Map display strings and urls to restrictions.
  static optionsDef: {[key:string]: {extUrl: string, display: string}} = {
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
  // dataType: string;

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
        const extensions = this.extensionsService.getExtensionsValue();
        const changed = this.updateRelevantExtensions(extensions, restrictionsArray);
        if(changed) {
          updating = true;
          this.extensionsService.resetExtensions(extensions);
          updating = false;
        }
      }
    });
    this.subscriptions.push(sub);

    // Watch changes in operator to reject unwanted selections.
    sub = this.restrictionOperatorService.subscribe((change: AcceptChange) => {
      if(this.selectedOptions.has(change.newValue) && !this.isRepeatableOption(change.newValue)) {
        change.reject = true;
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * MIME type is the only repeatable restriction for an attachment item.
   * Its extension cardinality is independent of whether the item allows
   * repeating answers.
   */
  isRepeatableOption(option: string): boolean {
    const root = this.formProperty.root;
    return option === 'mimeType' &&
      root.getProperty('type').value === 'attachment';
  }

  /**
   * Enforce the FHIR extension cardinalities represented by this widget.
   */
  normalizeRestrictionCardinality(restrictions: any[]): any[] {
    const seenOptions = new Set<string>();
    return (restrictions || []).filter((restriction) => {
      if(this.isRepeatableOption(restriction.operator)) {
        return true;
      }
      if(seenOptions.has(restriction.operator)) {
        return false;
      }
      seenOptions.add(restriction.operator);
      return true;
    });
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
    if(!event) {
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
    const extensions = this.extensionsService.getExtensionsValue();
    const extensionsFound = extensions?.filter((el) => {
      return  !!appliedOptions?.find((opt) => {
        return opt.extUrl === el.url;
      });
    });
    extensionsFound?.forEach((ext) => {
      const restriction = this.getRestrictionValue(ext);
      if(restriction &&
        (this.isRepeatableOption(restriction.operator) || !this.selectedOptions.has(restriction.operator))) {
        ret.push(restriction);
        this.selectedOptions.add(restriction.operator);
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
    let ret = false; // Return true if extensions are changed.
    Object.keys(RestrictionsComponent.optionsDef).forEach((opt) => {
      const optionRestrictions = (restrictions || []).filter((restriction) => {
        return restriction.operator === opt &&
          restriction.value !== null &&
          restriction.value !== undefined &&
          `${restriction.value}` !== '';
      });
      if(opt === 'maxLength') {
        this.updateMaxLength(optionRestrictions[0]?.value || null);
      }
      else {
        const allowedRestrictions = this.isRepeatableOption(opt) ?
          optionRestrictions : optionRestrictions.slice(0, 1);
        ret = this.updateOptionExtensions(extensions, opt, allowedRestrictions) || ret;
      }
    });
    return ret;
  }

  /**
   * Synchronize all extensions for one restriction operator. This deliberately
   * handles every matching extension rather than only the first, so singular
   * restrictions cannot leave duplicate extensions behind.
   */
  updateOptionExtensions(extensions: fhir.Extension[], option: string, restrictions: any[]): boolean {
    const extUrl = RestrictionsComponent.optionsDef[option].extUrl;
    const fieldInfo = this.getValueFieldName(option, this.dataType);
    const extensionIndices = extensions.reduce((indices, extension, index) => {
      if(extension.url === extUrl) {
        indices.push(index);
      }
      return indices;
    }, [] as number[]);
    let changed = false;

    restrictions.forEach((restriction, index) => {
      const value = this.getValue(restriction.value, fieldInfo.fieldType);
      if(index < extensionIndices.length) {
        const extension = extensions[extensionIndices[index]];
        const valueFields = Object.keys(extension).filter((key) => /^value/.test(key));
        if(valueFields.length !== 1 || valueFields[0] !== fieldInfo.fieldName ||
          extension[fieldInfo.fieldName] !== value) {
          valueFields.forEach((key) => delete extension[key]);
          extension[fieldInfo.fieldName] = value;
          changed = true;
        }
      }
      else {
        extensions.push({url: extUrl, [fieldInfo.fieldName]: value} as fhir.Extension);
        changed = true;
      }
    });

    for(let index = extensionIndices.length - 1; index >= restrictions.length; index--) {
      extensions.splice(extensionIndices[index], 1);
      changed = true;
    }

    return changed;
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
        ret.fieldName = 'valueInteger';
        ret.fieldType = 'integer';
        break;

      case 'maxSize':
        ret.fieldName = 'valueDecimal';
        ret.fieldType = 'decimal';
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
