import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { EXTENSION_URL_ANSWER_EXPRESSION, EXTENSION_URL_ENABLEWHEN_EXPRESSION } from '../../constants/constants';

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
    const pathToUrl = {
      "/__$isAnswerList": EXTENSION_URL_ANSWER_EXPRESSION,
      "/__$enableWhenMethod": EXTENSION_URL_ENABLEWHEN_EXPRESSION
    };
    const url = pathToUrl[this.formProperty.path];
    if (url) {
      const extensions = this.extensionsService.extensionsProp.value;
      if (extensions.some(ext => ext.url === url)) {
        this.formProperty.setValue(true, false);
      }
    }

    if(this.formProperty.schema.widget?.optionLabels) {
      // Overwrite default map from widget definition.
      this.options = new Map(this.formProperty.schema.widget.optionLabels);
    }
    this.optionsKeys = Array.from(this.options.keys());
    this.labelPosition = 'left';
    super.ngAfterViewInit();
  }
}
