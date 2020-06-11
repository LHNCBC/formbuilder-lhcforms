import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SchemaFormModule, WidgetRegistry, DefaultWidgetRegistry } from 'ngx-schema-form';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { JsonEditorComponent } from './json-editor/json-editor.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MainContentComponent } from './main-content/main-content.component';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule} from '@angular/material/card';
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
import {DropdownModule, PanelModule, RadioButtonModule} from 'primeng';
import { ToolbarModule } from 'primeng';
import { TreeModule } from 'angular-tree-component';
import { ItemJsonEditorComponent } from './item-json-editor/item-json-editor.component';
import { RowLayoutComponent } from './lib/widgets/row-layout.component';
import { ArrayGridComponent } from './lib/widgets/array-grid.component';
import { GridComponent } from './lib/widgets/grid.component';
import { TableComponent } from './lib/widgets/table.component';
import { LformsWidgets} from './lib/lforms-widgets';
import { StringComponent } from './lib/widgets/string.component';
import { SelectComponent } from './lib/widgets/select.component';
import { CheckboxComponent } from './lib/widgets/checkbox.component';
import { IntegerComponent } from './lib/widgets/integer.component';
import { FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import { AppFormElementComponent } from './lib/widgets/form-element.component';
import { LabelComponent } from './lib/widgets/label.component';
import { TitleComponent } from './lib/widgets/title.component';
import { ElementChooserComponent } from './lib/widgets/element-chooser.component';
import { AutoCompleteComponent } from './lib/widgets/auto-complete.component';
import { RadioComponent } from './lib/widgets/radio.component';
import { StepperGridComponent } from './lib/widgets/stepper-grid.component';
import { SidebarModule} from 'primeng';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ItemtypeComponent } from './lib/widgets/itemtype.component';
import {MatSelectModule} from '@angular/material/select';

@NgModule({
  declarations: [
    AppComponent,
    JsonEditorComponent,
    NgxSchemaFormComponent,
    MainContentComponent,
    ItemJsonEditorComponent,
    RowLayoutComponent,
    ArrayGridComponent,
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
    StepperGridComponent,
    HeaderComponent,
    FooterComponent,
    ItemtypeComponent
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
    PanelModule,
    SchemaFormModule.forRoot(),
    SidebarModule,
    ToolbarModule,
    TreeModule.forRoot(),
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatSelectModule,
    DropdownModule,
    RadioButtonModule
  ],
  entryComponents:
    [RowLayoutComponent, ArrayGridComponent, TableComponent, StepperGridComponent,
    GridComponent, StringComponent, SelectComponent, CheckboxComponent, IntegerComponent, RadioComponent],
  providers: [{provide: WidgetRegistry, useClass: LformsWidgets}],
  bootstrap: [AppComponent]
})
export class AppModule { }
