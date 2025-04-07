import {AfterViewInit, Component, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  standalone: false,
  selector: 'lfb-boolean-radio',
  templateUrl: 'boolean-radio.component.html'
})
export class BooleanRadioComponent  extends LfbControlWidgetComponent implements AfterViewInit {
  static ID = 0;
  _id = ''+BooleanRadioComponent.ID++;
  options: Map<any, string> = new Map([['false', 'No'], ['true', 'Yes'], ['null', 'Unspecified']]);
  optionsKeys = []
  ngAfterViewInit() {
    if(this.formProperty.schema.widget?.optionLabels) {
      // Overwrite default map from widget definition.
      this.options = new Map(this.formProperty.schema.widget.optionLabels);
    }
    this.optionsKeys = Array.from(this.options.keys());
    this.labelPosition = 'left';
    super.ngAfterViewInit();
  }
}
