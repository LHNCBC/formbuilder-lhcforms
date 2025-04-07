import {AfterViewInit, Component} from '@angular/core';
import {UnitsComponent} from '../units/units.component';
// import Def from 'autocomplete-lhc';

declare var LForms: any;

@Component({
  standalone: false,
  selector: 'lfb-quantity-unit',
  templateUrl: './quantity-unit.component.html',
  styleUrls: ['./quantity-unit.component.css']
})
export class QuantityUnitComponent extends UnitsComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    this.options.toolTip = this.schema.placeholder;

    this.elementId = this.id;
    this.options.valueCols = [1];
    this.resetAutocomplete();
    const sub = this.formProperty.valueChanges.subscribe((val) => {
      this.autoComp.element.value = val;
    });
    this.subscriptions.push(sub);

    // Setup selection handler
    LForms.Def.Autocompleter.Event.observeListSelections(this.elementId, (data) => {
      if (data.used_list) {
        const selected = data.list.find((el) => {
          return el[0] === data.item_code;
        });
        this.formProperty.parent.getProperty('code').setValue(data.item_code, true);
        this.formProperty.parent.getProperty('system').setValue(UnitsComponent.ucumSystemUrl, true);
        this.formProperty.setValue(selected[1], false);
      } else {
        this.formProperty.parent.getProperty('code').setValue(null, true);
        this.formProperty.parent.getProperty('system').setValue(null, true);
        this.formProperty.setValue(data.final_val, false);
      }
    });
  }

}
