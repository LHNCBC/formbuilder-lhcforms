import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';
import {Util} from '../../util';
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {
  EXTENSION_URL_CHOICE_ORIENTATION,
  EXTENSION_URL_COLUMN_COUNT,
  EXTENSION_URL_COLUMN_COUNT_LEGACY,
  EXTENSION_URL_ITEM_CONTROL
} from '../../constants/constants';
import {SharedObjectService} from "../../../services/shared-object.service";
import {FormsModule} from "@angular/forms";
import {CommonModule, NgClass} from "@angular/common";
import {MatTooltipModule} from "@angular/material/tooltip";
import {LabelComponent} from "../label/label.component";

@Component({
  selector: 'lfb-item-control',
  imports: [CommonModule, FormsModule, MatTooltipModule, LabelComponent],
  templateUrl: './item-control.component.html',
  styleUrls: ['./item-control.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemControlComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  private extensionsService = inject(ExtensionsService);
  private formService = inject(FormService);
  private cdr = inject(ChangeDetectorRef);
  private modelService = inject(SharedObjectService);

  static itemControlUrl = EXTENSION_URL_ITEM_CONTROL;

  optionsObj = {
    'drop-down': 'Drop down',
    autocomplete: 'Auto-complete',
    'radio-button': 'Radio Button',
    'check-box': 'Check-box'
  };

  option = 'drop-down';
  isRepeat = false;
  answerMethod = 'answer-option';
  subscriptions: Subscription [] = [];
  dataType;

  hasCodeSystemItemControl = false;
  isItemControlDeprecated = false;
  deprecatedMessage = '';

  answerList = false;

  /**
   * Angular life cycle event - Initialize attributes.
   */
  ngOnInit() {
    super.ngOnInit();
    this.init();
  }

  /**
   * Compose Item Control object from the schema.
   */
  composeCodeSystemItemControlObject() {
    if (this.formProperty?.schema?.oneOf) {
      this.formProperty.schema.oneOf.forEach((itemControl) => {
        this.optionsObj[itemControl.enum[0]] = itemControl.display;
      });
    }
  }

  /**
   * Retrieves item controls that are marked as deprecated. The function iterates through
   * the schema.oneOf array and extracts the enum values of the deprecated item controls.
   * @returns - list of deprecated item control code values.
   */
  extractDeprecatedItemControls(): string[] {
    const deprecatedControls: string[] = [];
    if (this.formProperty?.schema?.oneOf) {
      this.formProperty.schema.oneOf.forEach((itemControl) => {
        if (!!itemControl?.deprecated) {
          deprecatedControls.push(itemControl.enum[0]);
        }
      });
    }
    return deprecatedControls;
  }

  /**
   * Get the default item control based on the selected data type, or the item control defined in the
   * extension.
   * @param dataTypeChanged - indicates if there is a change to the data type. True if the
   *                          data type changed; otherwise, False.
   * @returns - item control
   */
  getItemControl(dataTypeChanged: boolean = false): string {
    const ext = this.getItemControlExtension();
    return ext ? ext.valueCodeableConcept?.coding[0]?.code : '';
  }

  /**
   * Check if a given item control is present in the list of deprecated item controls.
   * @returns - True if the item control is deprecated; otherwise, False.
   */
  checkDeprecatedItemControl(itemControl: string): boolean {
    const deprecatedItemControls = this.extractDeprecatedItemControls();

    return deprecatedItemControls.includes(itemControl);
  }

  /**
   * Read formProperty values.
   */
  init() {
    this.dataType = this.formProperty.searchProperty('/type').value;
    this.option = this.getItemControl(false);
    this.syncItemControlProxyValue(this.option);
    this.isRepeat = !!this.formProperty.searchProperty('/repeats').value;
    this.answerMethod = this.formProperty.searchProperty('/__$answerOptionMethods').value;

    this.hasCodeSystemItemControl = (this.formProperty?.schema?.oneOf && this.formProperty.schema.oneOf.length > 0);
    if (this.hasCodeSystemItemControl) {
      this.composeCodeSystemItemControlObject();
      this.isItemControlDeprecated = this.checkDeprecatedItemControl(this.option);
    }

    this.cdr.markForCheck();
  }

  /**
   * Setup subscriptions.
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();

    let sub = this.formProperty.searchProperty('/repeats').valueChanges.subscribe((isRepeat) => {
      if(this.formService.loading) {
        return;
      }

      this.isRepeat = !!isRepeat;
      // If repeats is changed, change to appropriate extension.
      this.updateItemControlExt(this.option);
      this.cdr.markForCheck();
    })
    this.subscriptions.push(sub);

    sub = this.formProperty.searchProperty('/type').valueChanges.subscribe((type) => {
      if(this.formService.loading) {
        return;
      }

      const changed = !(this.dataType === type);
      this.dataType = type;
      // Clear item-control selections that do not apply to the new data type.
      if (type !== 'coding' && type !== 'group' && type !== 'display') {
        this.clearExtensionItemControlSelection(false);
        if(!this.supportsAnswerList(type)) {
          this.removeAnswerListLayoutExtensions();
        }
      } else {
        this.option = this.getItemControl(changed);
        this.updateItemControlExt(this.option);
      }
      this.cdr.markForCheck();
    })
    this.subscriptions.push(sub);

    sub = this.formProperty.searchProperty('/__$answerOptionMethods').valueChanges.subscribe((method) => {
      if(this.formService.loading) {
        return;
      }

      this.answerMethod = method;
      // No autocomplete for answerOption.
      this.updateItemControlExt(this.option);
      this.cdr.markForCheck();
    })
    this.subscriptions.push(sub);

    sub = this.formProperty.searchProperty('/__$isAnswerList').valueChanges.subscribe((answerList) => {
      if(this.formService.loading) {
        return;
      }

      this.answerList = answerList;
      if(!answerList) {
        const answerListItemControl = this.formProperty.searchProperty('/__$itemControl');
        if(answerListItemControl.value) {
          this.clearExtensionItemControlSelection(false);
          if(answerListItemControl !== this.formProperty) {
            answerListItemControl.setValue('', false);
          }
        }
        this.removeAnswerListLayoutExtensions();
      }
    })
    this.subscriptions.push(sub);

    sub = this.modelService.modelInitialized$.subscribe(() => {
      this.init();
      this.cdr.markForCheck();
    });
    this.subscriptions.push(sub);

  }

  /**
   * Get item control extension
   * @return - Extension object or null
   */
  getItemControlExtension(): fhir.Extension | null {
    const ext = this.extensionsService.getExtensionsByUrl(ItemControlComponent.itemControlUrl);
    return ext ? ext[0] : null;
  }

  /**
   * Handler radio button selection.
   * @param option - Selected option (angular event).
   */
  updateItemControlExt(option: string) {
    if(this.answerMethod === 'answer-option' && option === 'autocomplete') {
      this.option = 'drop-down';
    }
    else if(this.isRepeat && option === 'radio-button') {
      this.option = 'check-box';
    }
    else if(!this.isRepeat && option === 'check-box') {
      this.option = 'radio-button';
    }
    else {
      this.option = option;
    }
    this.syncItemControlProxyValue(this.option);

    const ext = this.getItemControlExtension();
    if (this.option) {
      this.isItemControlDeprecated = this.checkDeprecatedItemControl(this.option);

      this.extensionsService.resetExtension(
        ItemControlComponent.itemControlUrl,
        this.createExtension(this.option),
        'valueCodeableConcept',
        false
      );
    }
    else {
      this.clearExtensionItemControlSelection(false);
      return;
    }
  }

  /**
   * Get list of options based on values of isrepeats and __$answerOptionMethods.
   * isrepeats determines radio vs checkbox, answer methods determines presence of autocomplete.
   *
   * @return string[] - Appropriate list of options.
   */
  getOptions(): string [] {
    return Object.keys(this.optionsObj).filter((o) => {
      let ret = true;
      if(this.isRepeat && o === 'radio-button' || !this.isRepeat && o === 'check-box') {
        ret = false;
      }
      if(this.answerMethod === 'answer-option' && o === 'autocomplete') {
        ret = false;
      }
      return ret;
    });
  }

  /**
   * Filters the item control options based on the repeat status and answer method.
   * Excludes controls that are not appropriate for the current configuration, such as:
   * - 'radio-button' when repeats is enabled
   * - 'check-box' when repeats is disabled
   * - 'autocomplete' when the answer method is 'answer-option'
   *
   * @returns {any[]} - The filtered list of item control option objects.
   */
  getItemControlOptions(): any[] {
    return this.formProperty.schema.oneOf.filter((o) => {
      // Exclude item controls that are not supported for the current data type, repeat status, or answer method.
      if ((this.isRepeat && o.enum[0] === 'radio-button') ||
          (!this.isRepeat && o.enum[0] === 'check-box') ||
          (this.answerMethod === 'answer-option' && o.enum[0] === 'autocomplete')) {
        return false;
      }

      if (o.hasOwnProperty('dataType')) {
        // If the option has a 'dataType' property, only include it if the current data type matches.
        // Handles both array and single value cases for 'dataType'.
        if (Array.isArray(o.dataType)) {
          return o.dataType.includes(this.dataType);
        } else {
          return o.dataType === this.dataType;
        }
      }
      return true;
    });
  }

  /**
   * Create extension object based on option.
   * @param option - The code of the options.
   */
  createExtension(option: string) {
    return {
      url: ItemControlComponent.itemControlUrl,
      valueCodeableConcept: {
        coding: [{
          system: 'http://hl7.org/fhir/questionnaire-item-control',
          code: option,
          display: this.optionsObj[option]
        }]
      }
    }
  }

  /**
   * Check if at least one answer option is initially selected.
   * @param answerOptions - Array of answer option objects.
   * @returns {boolean} - True if at least one answer option has initialSelected === true, else false.
   */
  hasInitialSelectedAnswerOption(answerOptions: any[]): boolean {
    if (!Array.isArray(answerOptions)) return false;
    return answerOptions.some(opt => opt && opt.initialSelected === true);
  }

  /**
   * Remove subscriptions before removing the component.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    })
  }

  /**
   * Compose the item control label to be announced by the screen reader.
   * @param opt - JSON schema
   * @returns - text to be read by the screen reader.
   */
  composeCodeSystemItemControlLabel(opt: any): string {
    let label = `Item control ${opt.display}. ${opt.description}  `;
    if (!opt.support)
      label += "Please note that this item control is not yet supported by the LHC-Forms preview.";
    return label;
  }

  /**
   * Clear extension for the 'Item Control' radio button.
   * @param announce - Whether to announce a user-initiated clear action.
   */
  clearExtensionItemControlSelection(announce = true) {
    this.option = '';
    this.syncItemControlProxyValue(this.option);
    this.isItemControlDeprecated = this.checkDeprecatedItemControl(this.option);
    this.extensionsService.removeExtensionsByUrl(ItemControlComponent.itemControlUrl);

    if(announce) {
      const type = this.dataType.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      this.liveAnnouncer.announce(`${type} item control selection has been cleared.`);
    }
  }

  /**
   * Set the deprecated message for the deprecated item control.
   */
  composeDeprecatedMessage(): string {
    const optionDisplay = this.formProperty.schema.oneOf.find((itemControl) => itemControl.enum[0] === this.option)?.display || '';
    const deprecatedNote = this.formProperty.schema.widget.deprecatedNote;
    if (deprecatedNote && optionDisplay) {
      return deprecatedNote.replace('${deprecatedItemControl}', optionDisplay);
    }
    return '';
  }

  /**
   * Keep the internal item-control proxy field aligned so dependent visibleIf
   * rules can react to custom item-control UI changes.
   * @param option - The selected item-control option.
   */
  private syncItemControlProxyValue(option: string): void {
    if(this.formProperty.value !== option) {
      this.formProperty.setValue(option || '', false);
    }
  }

  /**
   * Determine whether a data type supports configuring an answer list.
   * @param type - The Questionnaire item data type.
   */
  private supportsAnswerList(type: string): boolean {
    return ['integer', 'date', 'time', 'string', 'text', 'coding'].includes(type);
  }

  /**
   * Remove extensions that are only applicable while the item has an answer list.
   */
  private removeAnswerListLayoutExtensions(): void {
    this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_CHOICE_ORIENTATION);
    this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_COLUMN_COUNT);
    this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_COLUMN_COUNT_LEGACY);
  }
}
