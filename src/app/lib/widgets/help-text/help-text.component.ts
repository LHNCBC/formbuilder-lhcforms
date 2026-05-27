import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from "../lfb-control-widget/lfb-control-widget.component";
import { EXTENSION_URL_ITEM_CONTROL } from '../../constants/constants';
import {FormService} from "../../../services/form.service";
import {AppFormElementComponent} from "../form-element/form-element.component";

@Component({
  selector: 'lfb-help-text',
  imports: [AppFormElementComponent],
  template: `<lfb-form-element [formProperty]="formProperty.searchProperty('/__$helpText/text')"></lfb-form-element>`
})
export class HelpTextComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit {
  formService = inject(FormService);
  initializing: boolean = false;

  /**
   * Init life cycle hook.
   */
  ngOnInit() {
    super.ngOnInit();
    this.init();
  }

  /**
   * Initialize
   */
  init() {
    // Prevent circular update of the self.
    if(this.initializing) {
      return;
    }

    this.initializing = true;
    let changed = false;
    const value = this.formProperty.value;
    if(!value.linkId  && this.formProperty.parent.value?.linkId) {
      value.linkId = this.formProperty.parent.value.linkId.trim() + '_helpText';
      changed = true;
    }
    if(!value.type) {
      value.type = 'display';
      changed = true;
    }
    if(!value.extension) {
      value.extension = [];
      changed = true;
    }
    const ind = value.extension.findIndex((ext) => {
      return ext.url === EXTENSION_URL_ITEM_CONTROL && ext.valueCodeableConcept.coding.some((coding) => coding.code === 'help');
    });
    if(ind < 0) {
      value.extension.push({
        url: EXTENSION_URL_ITEM_CONTROL,
        valueCodeableConcept: {
          text: 'Help-Button',
          coding: [
            {
              code: 'help',
              display: 'Help-Button',
              system: 'http://hl7.org/fhir/questionnaire-item-control'
            }
          ]
        }
      });
      changed = true;
    }
    if(changed) {
      this.formProperty.setValue(value, false);
    }
    this.initializing = false;
  }

  /**
   * After view life cycle hook.
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
    const sub = this.formProperty.valueChanges.subscribe(() => {
      if(this.formService.loading) {
        return;
      }

      this.init();
    });
    this.subscriptions.push(sub);
  }
}
