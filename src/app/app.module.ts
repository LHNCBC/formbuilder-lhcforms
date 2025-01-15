import { BrowserModule } from '@angular/platform-browser';
import {ApplicationRef, CUSTOM_ELEMENTS_SCHEMA, DoBootstrap, NgModule} from '@angular/core';
import { SchemaFormModule, WidgetRegistry } from '@lhncbc/ngx-schema-form';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';
import { ItemComponent, ConfirmDlgComponent } from './item/item.component';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule} from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule} from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule} from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSchemaFormComponent } from './ngx-schema-form/ngx-schema-form.component';
import { TreeModule } from '@bugsplat/angular-tree-component';
import { GridComponent } from './lib/widgets/grid.component/grid.component';
import { TableComponent } from './lib/widgets/table/table.component';
import { LformsWidgetRegistry} from './lib/lforms-widget-registry';
import { StringComponent } from './lib/widgets/string/string.component';
import { SelectComponent } from './lib/widgets/select/select.component';
import { CheckboxComponent } from './lib/widgets/checkbox.component/checkbox.component';
import { IntegerComponent } from './lib/widgets/integer/integer.component';
import { FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { AppFormElementComponent } from './lib/widgets/form-element/form-element.component';
import { TitleComponent } from './lib/widgets/title/title.component';
import { ElementChooserComponent } from './lib/widgets/element-chooser/element-chooser.component';
import { AutoCompleteComponent } from './lib/widgets/auto-complete/auto-complete.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import {MatSelectModule} from '@angular/material/select';
import { EnableWhenSourceComponent } from './lib/widgets/enable-when-source/enable-when-source.component';
import { EnableOperatorComponent } from './lib/widgets/enable-operator/enable-operator.component';
import { LeftLabelFormGroupComponent } from './lib/widgets/left-label-form-group/left-label-form-group.component';
import { LfbControlWidgetComponent } from './lib/widgets/lfb-control-widget/lfb-control-widget.component';
import { LfbArrayWidgetComponent } from './lib/widgets/lfb-array-widget/lfb-array-widget.component';
import { SideLabelCheckboxComponent } from './lib/widgets/side-label-checkbox/side-label-checkbox.component';
import { EnablewhenAnswerCodingComponent } from './lib/widgets/enablewhen-answer-coding/enablewhen-answer-coding.component';
import { AppJsonPipe } from './lib/pipes/app-json.pipe';
import { BasePageComponent } from './base-page/base-page.component';
import { FormFieldsComponent } from './form-fields/form-fields.component';
import { LabelRadioComponent } from './lib/widgets/label-radio/label-radio.component';
import { RowLayoutComponent } from './lib/widgets/row-layout/row-layout.component';
import { BooleanControlledComponent } from './lib/widgets/boolean-controlled/boolean-controlled.component';
import { EnableBehaviorComponent } from './lib/widgets/enable-behavior/enable-behavior.component';
import { MessageDlgComponent } from './lib/widgets/message-dlg/message-dlg.component';
import { FhirServersDlgComponent } from './lib/widgets/fhir-servers-dlg/fhir-servers-dlg.component';
import { UserSpecifiedServerDlgComponent } from './lib/widgets/user-specified-server-dlg/user-specified-server-dlg.component';
import { FhirSearchDlgComponent } from './lib/widgets/fhir-search-dlg/fhir-search-dlg.component';
import { BooleanRadioComponent } from './lib/widgets/boolean-radio/boolean-radio.component';
import { UnitsComponent } from './lib/widgets/units/units.component';
import { AnswerOptionComponent } from './lib/widgets/answer-option/answer-option.component';
import { SfFormWrapperComponent } from './sf-form-wrapper/sf-form-wrapper.component';
import { PreviewDlgComponent } from './lib/widgets/preview-dlg/preview-dlg.component';
import { FhirExportDlgComponent } from './lib/widgets/fhir-export-dlg/fhir-export-dlg.component';
import { LoincNoticeComponent } from './lib/widgets/loinc-notice/loinc-notice.component';
import { StringWithCssComponent } from './lib/widgets/string-with-css/string-with-css.component';
import { RestrictionsComponent } from './lib/widgets/restrictions/restrictions.component';
import { RestrictionsOperatorComponent } from './lib/widgets/restrictions-operator/restrictions-operator.component';
import { ObservationLinkPeriodComponent } from './lib/widgets/observation-link-period/observation-link-period.component';
import { LfbDisableControlDirective } from './lib/directives/lfb-disable-control.directive';
import { LfbSpinnerComponent } from './lib/widgets/lfb-spinner/lfb-spinner.component';
import { EnableWhenComponent } from './lib/widgets/enable-when/enable-when.component';
import { QuantityUnitComponent } from './lib/widgets/quantity-unit/quantity-unit.component';
import { EwValidateDirective } from './lib/directives/ew-validate.directive';
import {NodeDialogComponent} from './item/node-dialog.component';
import { NumberComponent } from './lib/widgets/number/number.component';
import { IntegerDirective } from './lib/directives/integer.directive';
import { AnswerOptionMethodsComponent } from './lib/widgets/answer-option-methods/answer-option-methods.component';
import { ObservationExtractComponent } from './lib/widgets/observation-extract/observation-extract.component';
import { AnswerValueSetComponent } from './lib/widgets/answer-value-set/answer-value-set.component';
import { ItemControlComponent } from './lib/widgets/item-control/item-control.component';
import { DateComponent } from './lib/widgets/date/date.component';
import { TextAreaComponent } from './lib/widgets/textarea/textarea.component';
import {DatetimeComponent} from './lib/widgets/datetime/datetime.component';
import {LabelComponent} from './lib/widgets/label/label.component';
import { EditableLinkIdComponent } from './lib/widgets/editable-link-id/editable-link-id.component';
import {CdkCopyToClipboard} from "@angular/cdk/clipboard";
import {CodemirrorModule} from "@ctrl/ngx-codemirror";
import {HelpTextComponent} from "./lib/widgets/help-text/help-text.component";
import {Util} from "./lib/util";

@NgModule({
  declarations: [
    AppComponent,
    NgxSchemaFormComponent,
    ItemComponent,
    ConfirmDlgComponent,
    GridComponent,
    TableComponent,
    StringComponent,
    SelectComponent,
    CheckboxComponent,
    IntegerComponent,
    AppFormElementComponent,
    TitleComponent,
    ElementChooserComponent,
    HeaderComponent,
    FooterComponent,
    EnableWhenSourceComponent,
    EnableOperatorComponent,
    LeftLabelFormGroupComponent,
    LfbControlWidgetComponent,
    LfbArrayWidgetComponent,
    SideLabelCheckboxComponent,
    EnablewhenAnswerCodingComponent,
    AppJsonPipe,
    BasePageComponent,
    FormFieldsComponent,
    LabelRadioComponent,
    BooleanControlledComponent,
    RowLayoutComponent,
    BooleanControlledComponent,
    EnableBehaviorComponent,
    MessageDlgComponent,
    FhirServersDlgComponent,
    UserSpecifiedServerDlgComponent,
    FhirSearchDlgComponent,
    BooleanRadioComponent,
    UnitsComponent,
    AnswerOptionComponent,
    SfFormWrapperComponent,
    PreviewDlgComponent,
    FhirExportDlgComponent,
    LoincNoticeComponent,
    StringWithCssComponent,
    RestrictionsComponent,
    RestrictionsOperatorComponent,
    ObservationLinkPeriodComponent,
    LfbSpinnerComponent,
    EnableWhenComponent,
    QuantityUnitComponent,
    EwValidateDirective,
    NodeDialogComponent,
    NumberComponent,
    IntegerDirective,
    AnswerOptionMethodsComponent,
    ObservationExtractComponent,
    AnswerValueSetComponent,
    ItemControlComponent,
    DateComponent,
    TextAreaComponent,
    DatetimeComponent,
    EditableLinkIdComponent,
    HelpTextComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    FontAwesomeModule,
    HttpClientModule,
    LayoutModule,
    LfbDisableControlDirective,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatRadioModule,
    MatSidenavModule,
    MatStepperModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    NgbModule,
    SchemaFormModule.forRoot(),
    TreeModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatDialogModule,
    AutoCompleteComponent,
    LabelComponent,
    CdkCopyToClipboard,
    CodemirrorModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [{provide: WidgetRegistry, useClass: LformsWidgetRegistry},
    AppJsonPipe]
})
export class AppModule implements DoBootstrap {
  ngDoBootstrap(appRef: ApplicationRef) {
    // bootstrap AppComponent ourselves
    appRef.bootstrap(AppComponent)
    // @ts-ignore
    if (window.Cypress || window.navigator.webdriver) {
      // and save the application reference!
      // @ts-ignore
      window.appRef = appRef;
      window['basePageComponent'] = (<AppComponent> appRef.components[0].instance).basePageComponent;
      window['fbUtil'] = Util;
    }
  }
}
