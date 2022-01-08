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
  ngAfterViewInit() {
    this.labelPosition = 'left';
    super.ngAfterViewInit();
  }
}
