import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import {NgClass} from '@angular/common';
import {FormProperty, ObjectLayoutWidget} from '@lhncbc/ngx-schema-form';
import type fhir from 'fhir/r4';
import {Subscription} from 'rxjs';
import {AppFormElementComponent} from '../form-element/form-element.component';
import {LabelComponent} from '../label/label.component';
import {Util} from '../../util';

export const USAGE_CONTEXT_TYPE_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/usage-context-type';

export const USAGE_CONTEXT_TYPE_VALUE_SET =
  'http://terminology.hl7.org/ValueSet/usage-context-type';

export const CUSTOM_USAGE_CONTEXT_TYPE = '__custom';

export const USAGE_CONTEXT_TYPE_OPTIONS: ReadonlyArray<Readonly<{
  code: string;
  display: string;
}>> = [
  {code: 'gender', display: 'Gender'},
  {code: 'age', display: 'Age Range'},
  {code: 'focus', display: 'Clinical Focus'},
  {code: 'user', display: 'User Type'},
  {code: 'workflow', display: 'Workflow Setting'},
  {code: 'task', display: 'Workflow Task'},
  {code: 'venue', display: 'Clinical Venue'},
  {code: 'species', display: 'Species'},
  {code: 'program', display: 'Program'},
  {code: 'jurisdiction', display: 'Jurisdiction'},
  {code: 'topic', display: 'Topic'}
];

/**
 * Editor for UsageContext.code, which has an extensible UsageContextType binding.
 *
 * Standard selections populate a complete Coding from the bound value set.
 * The custom mode keeps the Coding fields editable because an extensible
 * binding permits another coding when no standard concept applies.
 */
@Component({
  standalone: true,
  selector: 'lfb-usage-context-code',
  imports: [
    AppFormElementComponent,
    LabelComponent,
    NgClass
  ],
  templateUrl: './usage-context-code.component.html'
})
export class UsageContextCodeComponent extends ObjectLayoutWidget implements OnInit, OnDestroy {
  readonly customType = CUSTOM_USAGE_CONTEXT_TYPE;
  readonly typeOptions = USAGE_CONTEXT_TYPE_OPTIONS;
  readonly valueSetHelpMessage = 'Standard choices come from the UsageContextType value set.';

  selectedType = signal('');
  widgetInfo: {[key: string]: any} = {};
  formProperties: {[key: string]: FormProperty} = {};
  private valueSubscriptions: Subscription[] = [];
  private applyingSelection = false;
  private customModeSelected = false;

  /**
   * Combine the FHIR field description with guidance about the terminology binding.
   */
  get codeHelpMessage(): string {
    return [this.schema?.description, this.valueSetHelpMessage].filter(Boolean).join(' ');
  }

  /**
   * Initialize the selected standard concept or preserve an imported custom Coding.
   */
  ngOnInit(): void {
    this.widgetInfo = this.formProperty.schema.widget || {};
    this.formProperties = this.formProperty.properties as {[key: string]: FormProperty};
    this.syncTypeSelection();

    this.valueSubscriptions.push(this.formProperty.valueChanges.subscribe((value: fhir.Coding | undefined) => {
      if(this.applyingSelection || (this.customModeSelected && this.selectedType() === CUSTOM_USAGE_CONTEXT_TYPE)) {
        return;
      }
      this.syncTypeSelection(value);
    }));
    [this.formProperties.code, this.formProperties.system]
      .filter((property): property is FormProperty => !!property)
      .forEach((property) => {
        this.valueSubscriptions.push(property.valueChanges.subscribe(() => {
          if(this.applyingSelection || (this.customModeSelected && this.selectedType() === CUSTOM_USAGE_CONTEXT_TYPE)) {
            return;
          }
          this.syncTypeSelection();
        }));
      });

  }

  /**
   * Release the FormProperty value subscription.
   */
  ngOnDestroy(): void {
    this.valueSubscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  /**
   * Apply the selected standard concept or switch to manual Coding entry.
   *
   * @param event - UsageContext type selection event.
   */
  selectType(event: Event): void {
    this.setType((event.target as HTMLSelectElement).value);
  }

  /**
   * Apply a UsageContext type selection.
   *
   * Exposed separately from the DOM handler for focused unit testing.
   *
   * @param selectedType - Standard code, custom marker, or empty selection.
   */
  setType(selectedType: string): void {
    const previousType = this.selectedType();
    this.selectedType.set(selectedType);
    this.customModeSelected = selectedType === CUSTOM_USAGE_CONTEXT_TYPE;
    this.applyingSelection = true;

    try {
      if(selectedType === CUSTOM_USAGE_CONTEXT_TYPE) {
        if(previousType !== CUSTOM_USAGE_CONTEXT_TYPE) {
          this.formProperty.reset({}, false);
        }
        return;
      }

      const option = USAGE_CONTEXT_TYPE_OPTIONS.find(({code}) => code === selectedType);
      const coding: fhir.Coding = option
        ? {
            system: USAGE_CONTEXT_TYPE_SYSTEM,
            code: option.code,
            display: option.display
          }
        : {};
      this.formProperty.reset(coding, false);
    }
    finally {
      this.applyingSelection = false;
    }
  }

  /**
   * Resolve how an existing Coding should be represented by the editor.
   *
   * @param coding - Imported or newly initialized UsageContext Coding.
   * @returns Standard code, custom marker, or empty selection.
   */
  private getTypeSelection(coding: fhir.Coding | undefined): string {
    if(Util.isEmpty(coding)) {
      return '';
    }
    if(coding.system === USAGE_CONTEXT_TYPE_SYSTEM &&
        USAGE_CONTEXT_TYPE_OPTIONS.some(({code}) => code === coding.code)) {
      return coding.code || '';
    }
    return CUSTOM_USAGE_CONTEXT_TYPE;
  }

  /**
   * Synchronize the selector from the live child properties.
   *
   * ngx-schema-form may populate Coding children after the object widget is
   * initialized without first publishing a complete parent value.
   */
  private syncTypeSelection(parentValue = this.formProperty.value as fhir.Coding | undefined): void {
    const coding: fhir.Coding = {...parentValue};
    const code = this.formProperties.code?.value;
    const system = this.formProperties.system?.value;
    if(code !== undefined && code !== null && code !== '') {
      coding.code = code;
    }
    if(system !== undefined && system !== null && system !== '') {
      coding.system = system;
    }
    const nextType = this.getTypeSelection(coding);
    this.selectedType.set(nextType);
  }
}
