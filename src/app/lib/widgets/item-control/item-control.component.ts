import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';

@Component({
  selector: 'lfb-item-control',
  templateUrl: './item-control.component.html',
  styleUrls: ['./item-control.component.css']
})
export class ItemControlComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  static itemControlUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl';

  Object = Object;
  autoCompleteCoding = {
    code: 'autocomplete',
    display: 'Auto-complete',
    system: 'http://hl7.org/fhir/questionnaire-item-control'
  };

  itemControlExtension = {
    url: ItemControlComponent.itemControlUrl,
    valueCodeableConcept: {
      coding: [this.autoCompleteCoding]
    }
  }

  optionList = {
    'drop-down': 'Drop-down',
    'radio-button': 'Radio button',
    'check-box': 'Check box',
    autocomplete: 'Autocomplete'
  };

  option = 'drop-down';
  subscriptions: Subscription [] = [];
  autoComplete = false;
  readonly = false;
  // TODO - Revisit the text
  label = 'Make the answer list an autocomplete input control.';

  extensionJson = '';

  constructor(private extensionsService: ExtensionsService, private formService: FormService) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.autoComplete = this.hasAutoCompleteExt();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub = this.formService.formReset$.subscribe(() => {
      this.autoComplete = this.hasAutoCompleteExt();
      this.option = this.getOption();
    });
    this.subscriptions.push(sub);
    sub = this.extensionsService.extensionsObservable.subscribe((extensions) => {
      this.extensionJson = JSON.stringify(extensions, null, 2);
    });
    this.subscriptions.push(sub);
  }


  getItemControlExtension(): fhir.Extension {
    const exts = this.extensionsService.getExtensionsByUrl(ItemControlComponent.itemControlUrl);
    return exts ? exts[0] : null;
  }

  getOption() {
    const ext = this.getItemControlExtension();
    return ext ? ext.valueCodeableConcept.coding[0].code : null;
  }


  /**
   * Check if autocomplete extension is present.
   */
  hasAutoCompleteExt() {
    let ret = false;
    const extensions = this.extensionsService.getExtensionsByUrl(ItemControlComponent.itemControlUrl);
    if(extensions?.length) {
      const codings = extensions[0].valueCodeableConcept.coding;
      if(codings?.length) {
        ret = codings.some((coding) => {
          return coding.code === 'autocomplete';
        })
      }
    }
    return ret;
  }


  /**
   * Handler for checkbox
   * @param event - Angular event (boolean)
   */
  autoCompleteChanged(event) {
    this.autoComplete = event;
    if(event) {
      this.addAutoCompleteExt();
    }
    else {
      this.removeAutoCompleteExt();
    }
  }

  updateItemControlExt(option: string) {
    if(!option || option === 'drop-down') {
      this.removeAutoCompleteExt();
    }
    else {
      this.itemControlExtension.valueCodeableConcept.coding[0].code = option;
      this.itemControlExtension.valueCodeableConcept.coding[0].display = this.optionList[option];
      const ext = this.getItemControlExtension();
      if(!ext) {
        this.itemControlExtension.valueCodeableConcept.coding[0].code = option;
        this.itemControlExtension.valueCodeableConcept.coding[0].display = this.optionList[option];
        this.addAutoCompleteExt();
      }
      else {
        ext.valueCodeableConcept.coding[0].code = option;
        ext.valueCodeableConcept.coding[0].display = this.optionList[option];
      }
    }
  }
  /**
   * Add autocomplete extension, only if it does not exist.
   */
  addAutoCompleteExt() {
    const exts = this.extensionsService.getExtensionsByUrl(ItemControlComponent.itemControlUrl);
    if(exts?.length) {
      // Has item control extension. Check for autocomplete coding.
      const codings = exts[0].valueCodeableConcept.coding;
      const exist = codings.some((coding) => {
        return coding.code === 'autocomplete';
      });

      if(!exist) { // Not autocomplete, remove the extension.
        this.extensionsService.removeExtensionsByUrl(ItemControlComponent.itemControlUrl);
      }
    }
    this.extensionsService.addExtension(this.itemControlExtension, 'valueCodeableConcept');
  }

  /**
   * Remove autocomplete extension, if exists.
   */
  removeAutoCompleteExt() {
    const exts = this.extensionsService.getExtensionsByUrl(ItemControlComponent.itemControlUrl);
    if(exts?.length) {
      const codings = exts[0].valueCodeableConcept.coding;
      if(codings?.length) {
        // Remove coding if exists
        const i = codings.findIndex((coding) => {
          return coding.code === 'autocomplete';
        });
        if(i >= 0) { // Remove the extension.
          this.extensionsService.removeExtensionsByUrl(ItemControlComponent.itemControlUrl);
        }
      }
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    })
  }
}
