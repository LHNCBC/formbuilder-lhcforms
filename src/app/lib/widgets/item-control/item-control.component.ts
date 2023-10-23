import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';

@Component({
  selector: 'lfb-item-control',
  templateUrl: './item-control.component.html',
  styleUrls: ['./item-control.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemControlComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  static itemControlUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl';

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

  constructor(private extensionsService: ExtensionsService, private formService: FormService, private cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.init();
  }

  /**
   * Read formProperty values.
   */
  init() {
    const ext = this.getItemControlExtension();
    this.option = ext ? ext.valueCodeableConcept.coding[0].code : 'drop-down';
    this.isRepeat = !!this.formProperty.searchProperty('/repeats').value;
    this.answerMethod = this.formProperty.searchProperty('/__$answerOptionMethods').value;
  }
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
      // If type is not choice, cleanup the extension.
      if (type !== 'choice' && type !== 'open-choice') {
        this.extensionsService.removeExtensionsByUrl(ItemControlComponent.itemControlUrl);
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
    if(!ext) {
      this.extensionsService.addExtension(this.createExtension(option), 'valueCodeableConcept');
    }
    else {
      ext.valueCodeableConcept.coding[0].code = option;
      ext.valueCodeableConcept.coding[0].display = this.optionsObj[option];
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
   * @param option - One of the options.
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

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    })
  }
}
