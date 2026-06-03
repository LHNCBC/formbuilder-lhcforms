import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { EXTENSION_URL_ANSWER_EXPRESSION } from '../../constants/constants';

@Component({
  standalone: false,
  selector: 'lfb-boolean-radio',
  templateUrl: 'boolean-radio.component.html'
})
export class BooleanRadioComponent  extends LfbControlWidgetComponent implements AfterViewInit {
  options: Map<any, string> = new Map([['false', 'No'], ['true', 'Yes'], ['null', 'Unspecified']]);
  optionsKeys = []
  extensionsService: ExtensionsService = inject(ExtensionsService);

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
