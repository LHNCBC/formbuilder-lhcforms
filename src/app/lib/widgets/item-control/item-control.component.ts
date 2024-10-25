import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';
import {Util} from '../../util';
import {LiveAnnouncer} from "@angular/cdk/a11y";

@Component({
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
   * Compose a Group Item Control object from the schema.
   */
  composeGroupItemControlObject() {
    if (this.formProperty?.schema?.oneOf) {
      this.formProperty.schema.oneOf.forEach((groupItemControl) => {
        this.optionsObj[groupItemControl.enum[0]] = groupItemControl.display;
      });
    }
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
    const defaultItemControl = (this.dataType === 'group') ? '' : 'drop-down';
    if (dataTypeChanged)
      return defaultItemControl;

    return ext ? ext.valueCodeableConcept.coding[0].code : defaultItemControl;
  }

  /**
   * Read formProperty values.
   */
  init() {
    this.dataType = this.formProperty.searchProperty('/type').value;
    this.option = this.getItemControl(false);
    this.isRepeat = !!this.formProperty.searchProperty('/repeats').value;
    this.answerMethod = this.formProperty.searchProperty('/__$answerOptionMethods').value;

    this.composeGroupItemControlObject();
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
      // If type is not choice, cleanup the extension.
      if (type !== 'choice' && type !== 'open-choice' && type !== 'group') {
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
   * Compose the Group item control label to be announced by the screen reader.
   * @param opt - JSON schema
   * @returns - text to be read by the screen reader.
   */
  composeGroupItemControlLabel(opt: any): string {
    let label = `Group item control ${opt.display}. ${opt.description}  `;
    if (!opt.support)
      label += "Please note that this item control is not supported by the LHC-Forms preview.";
    return label;
  }

  /**
   * Clear selection for the 'Group Item Control' radio button.
   */
  clearGroupItemControlSelection() {
    this.option = '';
    this.extensionsService.removeExtensionsByUrl(ItemControlComponent.itemControlUrl);
    this.liveAnnouncer.announce('Group item control selection has been cleared.');
  }

  getClearGroupItemControlSelectionLabel(): string {
    return "Clear group item control selection button is used for clearing the selection.";
  }

}
