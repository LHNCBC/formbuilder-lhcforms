/**
 * Registry for custom widgets.
 *
 * The widget is identified by its id. The id is associated
 * with the field in the schema.json.
 */
import { DefaultWidgetRegistry } from '@lhncbc/ngx-schema-form';
import {RowLayoutComponent} from './widgets/row-layout/row-layout.component';
import {GridComponent} from './widgets/grid.component/grid.component';
import {TableComponent} from './widgets/table/table.component';
import {StringComponent} from './widgets/string/string.component';
import {SelectComponent} from './widgets/select/select.component';
import {CheckboxComponent} from './widgets/checkbox.component/checkbox.component';
import {IntegerComponent} from './widgets/integer/integer.component';
import { Injectable } from '@angular/core';
import {EnableWhenSourceComponent} from './widgets/enable-when-source/enable-when-source.component';
import {EnableOperatorComponent} from './widgets/enable-operator/enable-operator.component';
import {LeftLabelFormGroupComponent} from './widgets/left-label-form-group/left-label-form-group.component';
import {SideLabelCheckboxComponent} from './widgets/side-label-checkbox/side-label-checkbox.component';
import {EnablewhenAnswerCodingComponent} from './widgets/enablewhen-answer-coding/enablewhen-answer-coding.component';
import {LabelRadioComponent} from './widgets/label-radio/label-radio.component';
import {EnableBehaviorComponent} from './widgets/enable-behavior/enable-behavior.component';
import {BooleanRadioComponent} from './widgets/boolean-radio/boolean-radio.component';
import {UnitsComponent} from './widgets/units/units.component';
import {AnswerOptionComponent} from './widgets/answer-option/answer-option.component';
import {AnswerOptionMethodsComponent} from './widgets/answer-option-methods/answer-option-methods.component';
import {StringWithCssComponent} from './widgets/string-with-css/string-with-css.component';
import {RestrictionsComponent} from './widgets/restrictions/restrictions.component';
import {RestrictionsOperatorComponent} from './widgets/restrictions-operator/restrictions-operator.component';
import {ObservationLinkPeriodComponent} from './widgets/observation-link-period/observation-link-period.component';
import {ObservationExtractComponent} from './widgets/observation-extract/observation-extract.component';
import {EnableWhenComponent} from './widgets/enable-when/enable-when.component';
import {QuantityUnitComponent} from './widgets/quantity-unit/quantity-unit.component';
import {NumberComponent} from './widgets/number/number.component';
import {TerminologyServerComponent} from './widgets/terminology-server/terminology-server.component';
import {AnswerValueSetComponent} from './widgets/answer-value-set/answer-value-set.component';
import {ItemControlComponent} from './widgets/item-control/item-control.component';
import {DateComponent} from './widgets/date/date.component';
import {TextAreaComponent} from './widgets/textarea/textarea.component';
import {DatetimeComponent} from './widgets/datetime/datetime.component';
import {EditableLinkIdComponent} from './widgets/editable-link-id/editable-link-id.component';
import {HelpTextComponent} from "./widgets/help-text/help-text.component";


@Injectable()
export class LformsWidgetRegistry extends DefaultWidgetRegistry {
  constructor() {
    super();
    this.register('answer-value-set', AnswerValueSetComponent);
    this.register('row-layout',  RowLayoutComponent);
    this.register('grid', GridComponent);
    this.register('table', TableComponent);
    this.register('string', StringComponent);
    this.register('textarea', TextAreaComponent);
    this.register('date', DateComponent);
    this.register('datetime', DatetimeComponent);
    this.register('url', StringComponent);
    this.register('select', SelectComponent);
    this.register('checkbox', CheckboxComponent);
    this.register('boolean', CheckboxComponent);
    this.register('integer', IntegerComponent);
    this.register('number', NumberComponent);
    this.register('lb-radio', LabelRadioComponent);
    this.register('enable-when', EnableWhenComponent);
    this.register('enable-when-source', EnableWhenSourceComponent);
    this.register('enable-operator', EnableOperatorComponent);
    this.register('left-label-form-group', LeftLabelFormGroupComponent);
    this.register('left-label-checkbox', SideLabelCheckboxComponent);
    this.register('enable-when-answer-choice', EnablewhenAnswerCodingComponent);
    this.register('enable-behavior', EnableBehaviorComponent);
    this.register('boolean-radio', BooleanRadioComponent);
    this.register('units', UnitsComponent);
    this.register('answer-option', AnswerOptionComponent);
    this.register('answer-option-methods', AnswerOptionMethodsComponent);
    this.register('item-control', ItemControlComponent);
    this.register('help-text', HelpTextComponent);
    this.register('string-with-css', StringWithCssComponent);
    this.register('restrictions', RestrictionsComponent);
    this.register('restrictions-operator', RestrictionsOperatorComponent);
    this.register('observation-link-period', ObservationLinkPeriodComponent);
    this.register('observation-extract', ObservationExtractComponent);
    this.register('quantity-unit', QuantityUnitComponent);
    this.register('terminology-server', TerminologyServerComponent);
    this.register('editable-link-id', EditableLinkIdComponent);

  }
}
