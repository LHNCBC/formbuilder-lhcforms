import {Component, OnDestroy, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from "../lfb-control-widget/lfb-control-widget.component";
import {StringComponent} from "../string/string.component";
import {Subscription} from "rxjs";
import {ArrayProperty} from "ngx-schema-form";

@Component({
  selector: 'lfb-help-text',
  templateUrl: '../string/string.component.html',
  styleUrls: ['./help-text.component.css']
})
export class HelpTextComponent extends StringComponent implements OnInit, OnDestroy {
  static ITEM_CONTROL_EXT_URL = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl'
  helpItem = {
    text: '',  // Update with value from input box.
    type: 'display',
    linkId: '', // Update at run time.
    extension: [{
      url: HelpTextComponent.ITEM_CONTROL_EXT_URL,
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
    }]
  };


  subscriptions: Subscription [] = [];

  ngOnInit(): void {
    super.ngOnInit();
    const itemProp = this.formProperty.searchProperty('/item');
    let subscription = itemProp.valueChanges.subscribe((items) => {
      let helpTextItem = this.findItemWithHelpText(items);
      if(!helpTextItem) {
        helpTextItem = JSON.parse(JSON.stringify(this.helpItem));
        helpTextItem.linkId = this.formProperty.searchProperty('/linkId').value+'_helpText';
      }
      this.formProperty.setValue(helpTextItem.text, false);
    });

    this.subscriptions.push(subscription);

    subscription = this.formProperty.valueChanges.subscribe((val) => {
      const itemsProp = this.formProperty.searchProperty('/item');
      let helpTextItem = this.findItemWithHelpText(itemsProp.value);
      if(!helpTextItem) {
        helpTextItem = JSON.parse(JSON.stringify(this.helpItem));
        helpTextItem.linkId = this.formProperty.searchProperty('/linkId').value+'_helpText';
        (itemsProp as ArrayProperty).addItem(helpTextItem);
      }
      helpTextItem.text = val;
    });

    this.subscriptions.push(subscription);
  }

  findItemWithHelpText(itemsArray) {
    return itemsArray?.find((item) => {
      let ret = false;
      if (item.type === 'display') {
        ret = item.extension?.some((e) => {
          return e.url === HelpTextComponent.ITEM_CONTROL_EXT_URL &&
            e.valueCodeableConcept?.coding?.some((coding) => coding.code === 'help');
        });
      }
      return ret;
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }
}
