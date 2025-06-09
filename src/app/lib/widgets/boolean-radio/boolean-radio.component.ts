import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import { ExtensionsService } from 'src/app/services/extensions.service';

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
  extensionsService: ExtensionsService = inject(ExtensionsService);

  ngAfterViewInit() {

    // If the schema property is '__$isAnswerList' and contains the Answer Expression,
    // then set the value to 'Yes'
    if (this.formProperty.path === "/__$isAnswerList") {
      const extensions = this.extensionsService.extensionsProp.value;
  
      const expression = extensions.filter(ext =>
        ext.url === ExtensionsService.ANSWER_EXPRESSION
      );
      
      // if the expression is available and it is the answer expression
      if (expression[0]?.url === ExtensionsService.ANSWER_EXPRESSION) {
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
