import {AfterViewInit, Component} from '@angular/core';
import {UnitsComponent} from '../units/units.component';
import { UnitsDisplayComponent } from '../units-display/units-display.component';
import { EXTENSION_URL_UCUM_SYSTEM } from '../../constants/constants';

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
      const updateQuantityFormProperty = (code: string, system: string, unit?: string) => {
        if (unit !== undefined) {
          this.formProperty.parent.setValue({
            code: code,
            system: system,
            unit: unit
          }, false);
        }
      };

      // Only call if data contains a space
      if (data && typeof data.final_val === 'string' && data.final_val.includes(' ')) {
        const completionOptions = document.getElementById('completionOptions');
        this.unitService.replaceTokensWithCompletionOptions(data, completionOptions, this.options.wordBoundaryChars);
      }

      if (data.used_list || data.on_list) {
        if (data.item_code && !this.unitService.hasDelimiter(data.final_val)) {
          const selectedUnit = data.list.find((unit) => {
            return unit[0] === data.item_code;
          });
          this.unitStorage.push(selectedUnit);
          this.unitService.addUnit(selectedUnit);

          updateQuantityFormProperty(data.item_code, EXTENSION_URL_UCUM_SYSTEM, selectedUnit[1]);
        } else {
          const orgFinalVal = data.final_val;

          // item_code is not found, so this might be a tokenizer
          data.final_val = this.unitService.translateUnitDisplayToCode(data.final_val, data.list);

          const parseResp = this.unitService.validateWithUcumUnit(data.final_val);

          if (parseResp.status === "valid" || (parseResp.status === "invalid" && parseResp.ucumCode)) {
            updateQuantityFormProperty(parseResp.ucumCode, EXTENSION_URL_UCUM_SYSTEM, parseResp.unit.name);
          } else {
            updateQuantityFormProperty(null, null, orgFinalVal);
          }
        }
      } else {
        const unitExt = this.getUnitExtension();
        if (unitExt?.valueCoding?.display !== data.final_val) {
          data.final_val = this.unitService.translateUnitDisplayToCode(data.final_val, data.list);

          const parseResp = this.unitService.validateWithUcumUnit(data.final_val);

          if (parseResp.status === "valid" || (parseResp.status === "invalid" && parseResp.ucumCode)) {
            updateQuantityFormProperty(parseResp.ucumCode, EXTENSION_URL_UCUM_SYSTEM, parseResp.unit.name);
          } else {
            updateQuantityFormProperty(null, null, data.final_val);
          }
        }
      }
    });
  }
}
