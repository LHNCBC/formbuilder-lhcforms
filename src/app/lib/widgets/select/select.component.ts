/**
 * Customized pull down box.
 */
import {AfterViewInit, Component, Input} from '@angular/core';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';


@Component({
  selector: 'lfb-select',
  templateUrl: './select.component.html'
})
export class SelectComponent extends LfbControlWidgetComponent implements AfterViewInit {
  faInfo = faInfoCircle;
  nolabel = false;

  // A mapping for options display string. Typically, the display strings are from schema definition.
  // This map helps to redefine the display string.
  @Input()
  selectOptionsMap: any = {};

  // Options list for the pull down
  allowedOptions: Array<{value: string, label: string}>;

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
      return this.isIncluded(e.value);
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
}
