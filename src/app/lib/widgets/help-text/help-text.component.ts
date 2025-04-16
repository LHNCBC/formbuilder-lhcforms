import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormProperty} from "@lhncbc/ngx-schema-form";
import {LfbControlWidgetComponent} from "../lfb-control-widget/lfb-control-widget.component";
import {Util} from "../../util";
import fhir from "fhir/r4";

type InputType = 'plain' | 'xhtml';

@Component({
  standalone: false,
  selector: 'lfb-help-text',
  template: `<lfb-form-element [formProperty]="formProperty.searchProperty('/__$helpText/text')"></lfb-form-element>`
})
export class HelpTextComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit {
  textProp: FormProperty;
  _textProp: FormProperty;
  helpTextItem: fhir.QuestionnaireItem;
  ngOnInit() {
    super.ngOnInit();
    const value = this.formProperty.value;
    value.linkId = value.linkId?.trim() || this.formProperty.parent?.value.linkId + '_helpText';
    value.type = 'display'
    value.extension = value.extension || [];
    const ind = value.extension.findIndex((ext) => {
      return ext.url === Util.ITEM_CONTROL_EXT_URL && ext.valueCodeableConcept.coding.some((coding) => coding.code === 'help');
    });
    if(ind < 0) {
      value.extension.push({
        url: Util.ITEM_CONTROL_EXT_URL,
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
      })
    }
    this.formProperty.setValue(value, false);
    // this.textProp = (this.formProperty as PropertyGroup).getProperty('text');
    // this._textProp = (this.formProperty as PropertyGroup).getProperty('_text');
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }
}
