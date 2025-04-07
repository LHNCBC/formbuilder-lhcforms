import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';
import {Util} from '../../util';
import {LiveAnnouncer} from "@angular/cdk/a11y";

@Component({
  standalone: false,
  selector: 'lfb-item-control',
  templateUrl: './item-control.component.html',
  styleUrls: ['./item-control.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemControlComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  static itemControlUrl = Util.ITEM_CONTROL_EXT_URL;

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

  constructor(private extensionsService: ExtensionsService, private formService: FormService,
              private cdr: ChangeDetectorRef, private liveAnnouncer: LiveAnnouncer) {
    super();
  }

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
    const defaultItemControl = (this.dataType === 'group' || this.dataType === 'display') ? '' : 'drop-down';
    if (dataTypeChanged)
      return defaultItemControl;

    return ext ? ext.valueCodeableConcept.coding[0].code : defaultItemControl;
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
    this.isRepeat = !!this.formProperty.searchProperty('/repeats').value;
    this.answerMethod = this.formProperty.searchProperty('/__$answerOptionMethods').value;

    this.hasCodeSystemItemControl = (this.formProperty?.schema?.oneOf && this.formProperty.schema.oneOf.length > 0);
    if (this.hasCodeSystemItemControl) {
      this.composeCodeSystemItemControlObject();
      this.isItemControlDeprecated = this.checkDeprecatedItemControl(this.option);
    }
  }

  /**
   * Setup subscriptions.
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();

    let sub = this.formProperty.searchProperty('/repeats').valueChanges.subscribe((isRepeat) => {
      this.isRepeat = !!isRepeat;
      // If repeats is changed, change to appropriate extension.
      this.updateItemControlExt(this.option);
      this.cdr.markForCheck();
    })
    this.subscriptions.push(sub);

    sub = this.formProperty.searchProperty('/type').valueChanges.subscribe((type) => {
      const changed = !(this.dataType === type);
      this.dataType = type;
      // If type is not coding, cleanup the extension.
      if (type !== 'coding' && type !== 'group' && type !== 'display') {
        this.extensionsService.removeExtensionsByUrl(ItemControlComponent.itemControlUrl);
      } else {
        this.option = this.getItemControl(changed);
        this.updateItemControlExt(this.option);
      }
      this.cdr.markForCheck();
    })
    this.subscriptions.push(sub);

    sub = this.formProperty.searchProperty('/__$answerOptionMethods').valueChanges.subscribe((method) => {
      this.answerMethod = method;
      // No autocomplete for answerOption.
      this.updateItemControlExt(this.option);
      this.cdr.markForCheck();
    })
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
    else if(this.isRepeat && this.option === 'radio-button') {
      this.option = 'check-box';
    }
    else if(!this.isRepeat && this.option === 'check-box') {
      this.option = 'radio-button';
    }
    else {
      this.option = option;
    }

    const ext = this.getItemControlExtension();
    if (option) {
      this.isItemControlDeprecated = this.checkDeprecatedItemControl(option);

      if(!ext) {
        this.extensionsService.addExtension(this.createExtension(option), 'valueCodeableConcept');
      }
      else {
        delete ext.valueCodeableConcept.text;
        ext.valueCodeableConcept.coding[0].code = option;
        ext.valueCodeableConcept.coding[0].display = this.optionsObj[option];
      }
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
      label += "Please note that this item control is not supported by the LHC-Forms preview.";
    return label;
  }

  /**
   * Clear extension for the 'Item Control' radio button.
   */
  clearExtensionItemControlSelection() {
    this.option = '';
    this.isItemControlDeprecated = this.checkDeprecatedItemControl(this.option);
    this.extensionsService.removeExtensionsByUrl(ItemControlComponent.itemControlUrl);

    const type = this.dataType.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    this.liveAnnouncer.announce(`${type} item control selection has been cleared.`);
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
}
