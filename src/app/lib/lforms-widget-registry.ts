import { DefaultWidgetRegistry } from 'ngx-schema-form';
import {RowLayoutComponent} from './widgets/row-layout.component';
import {ArrayGridComponent} from './widgets/array-grid.component';
import {GridComponent} from './widgets/grid.component';
import {TableComponent} from './widgets/table.component';
import {StringComponent} from './widgets/string.component';
import {SelectComponent} from './widgets/select.component';
import {CheckboxComponent} from './widgets/checkbox.component';
import {IntegerComponent} from './widgets/integer.component';
import {RadioComponent} from './widgets/radio.component';
import {StepperGridComponent} from './widgets/stepper-grid.component';
import { Injectable } from '@angular/core';
import {ItemtypeComponent} from './widgets/itemtype.component';
import {ChoiceComponent} from './widgets/choice.component';
import {RowGridComponent} from './widgets/row-grid.component';
import {CodingOperatorComponent} from './widgets/coding-operator.component';
import {LeftLabelFormGroupComponent} from './widgets/left-label-form-group.component';
import {ExpandablePanelsComponent} from './widgets/expandable-panels.component';
import {SideLabelCheckboxComponent} from './widgets/side-label-checkbox.component';
import {EnablewhenAnswerCodingComponent} from './widgets/enablewhen-answer-coding.component';
import {LabelRadioComponent} from './widgets/label-radio.component';

@Injectable()
export class LformsWidgetRegistry extends DefaultWidgetRegistry {
  constructor() {
    super();
    this.register('row-layout',  RowLayoutComponent);
    this.register('array-grid', ArrayGridComponent);
    this.register('grid', GridComponent);
    this.register('stepper-grid', StepperGridComponent);
    this.register('table', TableComponent);
    this.register('string', StringComponent);
    this.register('select', SelectComponent);
    this.register('checkbox', CheckboxComponent);
    this.register('boolean', CheckboxComponent);
    this.register('integer', IntegerComponent);
    this.register('number', IntegerComponent);
    this.register('radio', RadioComponent);
    this.register('lb-radio', LabelRadioComponent),
    this.register('item-type', ItemtypeComponent);
    this.register('choice', ChoiceComponent);
    this.register('row-grid', RowGridComponent);
    this.register('coding-operator', CodingOperatorComponent);
    this.register('left-label-form-group', LeftLabelFormGroupComponent);
    this.register('expandable-panels', ExpandablePanelsComponent);
    this.register('left-label-checkbox', SideLabelCheckboxComponent);
    this.register('enable-when-answer-choice', EnablewhenAnswerCodingComponent);
  }
}
