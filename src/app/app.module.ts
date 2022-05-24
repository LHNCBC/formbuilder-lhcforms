import { BrowserModule } from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import { SchemaFormModule, WidgetRegistry } from 'ngx-schema-form';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';
import { ItemComponent } from './item/item.component';
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
import { TreeModule } from '@circlon/angular-tree-component';
import { ItemJsonEditorComponent } from './lib/widgets/item-json-editor/item-json-editor.component';
import { GridComponent } from './lib/widgets/grid.component/grid.component';
import { TableComponent } from './lib/widgets/table/table.component';
import { LformsWidgetRegistry} from './lib/lforms-widget-registry';
import { StringComponent } from './lib/widgets/string/string.component';
import { SelectComponent } from './lib/widgets/select/select.component';
import { CheckboxComponent } from './lib/widgets/checkbox.component/checkbox.component';
import { IntegerComponent } from './lib/widgets/integer/integer.component';
import { FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { AppFormElementComponent } from './lib/widgets/form-element/form-element.component';
import { LabelComponent } from './lib/widgets/label/label.component';
import { TitleComponent } from './lib/widgets/title/title.component';
import { ElementChooserComponent } from './lib/widgets/element-chooser/element-chooser.component';
import { AutoCompleteComponent } from './lib/widgets/auto-complete/auto-complete.component';
import { RadioComponent } from './lib/widgets/radio/radio.component';
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
import { ExtensionsComponent } from './lib/widgets/extensions/extensions.component';
import { TotalScoreComponent } from './lib/widgets/total-score/total-score.component';
import { RuleEditorModule } from 'rule-editor';
import { AnswerOptionComponent } from './lib/widgets/answer-option/answer-option.component';
import { InitialComponent } from './lib/widgets/initial/initial.component';
import { HelpTextComponent } from './lib/widgets/help-text/help-text.component';
import { SfFormWrapperComponent } from './sf-form-wrapper/sf-form-wrapper.component';
import { TypeComponent } from './lib/widgets/type/type.component';
import { PreviewDlgComponent } from './lib/widgets/preview-dlg/preview-dlg.component';
import { FhirExportDlgComponent } from './lib/widgets/fhir-export-dlg/fhir-export-dlg.component';
import { LoincNoticeComponent } from './lib/widgets/loinc-notice/loinc-notice.component';
import { StringWithCssComponent } from './lib/widgets/string-with-css/string-with-css.component';
import { RestrictionsComponent } from './lib/widgets/restrictions/restrictions.component';
import { RestrictionsOperatorComponent } from './lib/widgets/restrictions-operator/restrictions-operator.component';
import { ObservationLinkPeriodComponent } from './lib/widgets/observation-link-period/observation-link-period.component';
import { LfbDisableControlDirective } from './lib/directives/lfb-disable-control.directive';

@NgModule({
  declarations: [
    AppComponent,
    NgxSchemaFormComponent,
    ItemComponent,
    ItemJsonEditorComponent,
    GridComponent,
    TableComponent,
    StringComponent,
    SelectComponent,
    CheckboxComponent,
    IntegerComponent,
    AppFormElementComponent,
    LabelComponent,
    TitleComponent,
    ElementChooserComponent,
    AutoCompleteComponent,
    RadioComponent,
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
    ExtensionsComponent,
    TotalScoreComponent,
    AnswerOptionComponent,
    InitialComponent,
    HelpTextComponent,
    SfFormWrapperComponent,
    TypeComponent,
    PreviewDlgComponent,
    FhirExportDlgComponent,
    LoincNoticeComponent,
    StringWithCssComponent,
    RestrictionsComponent,
    RestrictionsOperatorComponent,
    ObservationLinkPeriodComponent,
    LfbDisableControlDirective,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    FontAwesomeModule,
    HttpClientModule,
    LayoutModule,
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
    RuleEditorModule,
    SchemaFormModule.forRoot(),
    TreeModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatDialogModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [{provide: WidgetRegistry, useClass: LformsWidgetRegistry}, AppJsonPipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
