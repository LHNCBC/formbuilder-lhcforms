import {AfterViewInit, Component, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  selector: 'lfb-boolean-radio',
  templateUrl: 'boolean-radio.component.html',
  styles: [`
    label:hover {
      opacity: 0.5;
    }
  `]
})
export class BooleanRadioComponent  extends LfbControlWidgetComponent implements AfterViewInit {
  static ID = 0;
  _id = BooleanRadioComponent.ID++;
  options: Map<boolean, string> = new Map([[false, 'No'], [true, 'Yes']]);
  optionsKeys = []
  ngAfterViewInit() {
    if(this.formProperty.schema.widget?.optionLabels) {
      this.options = new Map(this.formProperty.schema.widget.optionLabels);
    }
    this.optionsKeys = Array.from(this.options.keys());
    this.labelPosition = 'left';
    super.ngAfterViewInit();
  }
}
