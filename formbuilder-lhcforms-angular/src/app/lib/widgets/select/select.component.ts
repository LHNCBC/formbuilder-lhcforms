/**
 * Customized pull down box.
 */
import {AfterViewInit, Component, inject, Input} from '@angular/core';
import {faExclamationTriangle, faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import { StringComponent } from '../string/string.component';
import { FormService } from '../../../services/form.service';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  standalone: false,
  selector: 'lfb-select',
  templateUrl: './select.component.html',
  styles: [`
    select.invalid {
      outline:2px solid red;
    }
    #error {
      margin-right: 5px;
    }
  `]
})
export class SelectComponent extends StringComponent implements AfterViewInit {
  faInfo = faInfoCircle;
  nolabel = false;
  errorIcon = faExclamationTriangle;

  formService = inject(FormService);

  // A mapping for options display string. Typically, the display strings are from schema definition.
  // This map helps to redefine the display string.
  @Input()
  selectOptionsMap: any = {};

  // Options list for the pull down
  allowedOptions: Array<{value: string, label: string}>;

  constructor() {
    super();
  }

  /**
   * Initialize component, mainly the options list.
   */
  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.selectOptionsMap = this.schema.widget.selectOptionsMap || {};
    const allowedOptions = this.schema.enum.map((e) => {
      return this.mapOption(e);
    });
    this.allowedOptions = allowedOptions.filter((e) => {
      return this.isIncluded(e.value) && this.isTypeAllowed(e.value);
    });
    if(this.schema.widget.addEmptyOption) {
      this.allowedOptions.unshift({value: null, label: 'None'});
    }
  }

  /**
   * Map any display strings.
   * @param opt
   */
  mapOption(opt: string): {value: string, label: string} {
    const ret = {value: opt, label: opt};
    if (this.selectOptionsMap.map && this.selectOptionsMap.map[opt]) {
      ret.label = this.selectOptionsMap.map[opt];
    }
    return ret;
  }

  /**
   * Optionally to exclude any options from the schema.
   * @param opt
   */
  isIncluded(opt: string): boolean {
    return !(this.selectOptionsMap.remove && this.selectOptionsMap.remove.indexOf(opt) >= 0);
  }

  /**
   * Allows the inclusion of the data type option based on the following conditions:
   *   - If the 'validateType' flag is not set.
   *   - If the 'validateType' flag is set and the option is not equal to 'display'.
   *   - If the 'validateType' flag is set, the option is equal to 'display', and the item does not
   *     have sub-items.
   * @param opt - data type option.
   * @returns True if the data type option should be included in the allowedOptions drop-down list
   */
  isTypeAllowed(opt: string): boolean {
    return (!this.selectOptionsMap.validateType ||
            opt !== 'display' ||
            !this.formService.hasSubItems()
           );
  }
}
