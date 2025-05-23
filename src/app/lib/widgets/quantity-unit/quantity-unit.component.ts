import {AfterViewInit, Component} from '@angular/core';
import {UnitsComponent} from '../units/units.component';
import { UnitsDisplayComponent } from '../units-display/units-display.component';

declare var LForms: any;

@Component({
  standalone: false,
  selector: 'lfb-quantity-unit',
  templateUrl: './quantity-unit.component.html',
  styleUrls: ['./quantity-unit.component.css']
})
export class QuantityUnitComponent extends UnitsDisplayComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    this.options.toolTip = this.schema.placeholder;

    this.elementId = this.id;
    this.options.valueCols = [1];
    this.resetAutocomplete();
    const sub = this.formProperty.valueChanges.subscribe((val) => {
      this.autoComp.element.value = val;
    });
    this.subscriptions.push(sub);

    LForms.Def.Autocompleter.Event.observeListSelections(this.elementId, (data) => {
      const updateUnitValueQuantity = (code: string, system: string, unit?: string) => {
        if (unit !== undefined) {
          this.formProperty.parent.setValue({
            code: code,
            system: system,
            unit: unit
          }, false);
        }
      };
      
      if (data.used_list || data.on_list) {
        if (data.item_code) {
          const selectedUnit = data.list.find((unit) => {
            return unit[0] === data.item_code;
          });
          this.unitStorage.push(selectedUnit);
          this.unitStorageService.addUnit(selectedUnit);

          updateUnitValueQuantity(data.item_code, UnitsComponent.ucumSystemUrl, selectedUnit[1]);
        } else {
          const orgFinalVal = data.final_val;
          data.final_val = this.unitStorageService.translateUnitDisplayToCode(data.final_val, data.list, this.unitTokenizeStr);

          // item_code is not found, so this might be a tokenizer
          const parseResp = LForms.ucumPkg.UcumLhcUtils.getInstance().validateUnitString(data.final_val);

          if (parseResp.status === "valid" || (parseResp.status === "invalid" && parseResp.ucumCode)) {
            updateUnitValueQuantity(parseResp.ucumCode, UnitsComponent.ucumSystemUrl, orgFinalVal);
          } else {
            updateUnitValueQuantity('', '', orgFinalVal);
          }
        }
      } else {
        const unitExt = this.getUnitExtension();
        if (unitExt?.valueCoding?.display !== data.final_val) {
          const parseResp = LForms.ucumPkg.UcumLhcUtils.getInstance().validateUnitString(data.final_val);

          if (parseResp.status === "valid" || (parseResp.status === "invalid" && parseResp.ucumCode)) {
            updateUnitValueQuantity(parseResp.ucumCode, UnitsComponent.ucumSystemUrl, data.final_val);
          } else {
            updateUnitValueQuantity('', '', data.final_val);
          }
        }
      }
    });
  }
}
