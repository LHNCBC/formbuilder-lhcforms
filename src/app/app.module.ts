import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SchemaFormModule, WidgetRegistry, DefaultWidgetRegistry } from 'ngx-schema-form';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { Bootstrap3FrameworkModule} from '@ajsf/bootstrap3';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { JsonEditorComponent } from './json-editor/json-editor.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MainContentComponent } from './main-content/main-content.component';
import { MatButtonModule } from '@angular/material/button';
import { MaterialDesignFrameworkModule } from '@ajsf/material';
import { MatExpansionModule } from '@angular/material';
import { MatFormFieldModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule} from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSchemaFormComponent } from './ngx-schema-form/ngx-schema-form.component';
import { TreeModule } from 'angular-tree-component';
import { ItemJsonEditorComponent } from './item-json-editor/item-json-editor.component';
import { AjsfFormComponent } from './ajsf-form/ajsf-form.component';
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

@NgModule({
  declarations: [
    AppComponent,
    JsonEditorComponent,
    NgxSchemaFormComponent,
    MainContentComponent,
    ItemJsonEditorComponent,
    AjsfFormComponent,
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
    ElementChooserComponent
  ],
  imports: [
    AppRoutingModule,
    Bootstrap3FrameworkModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    FontAwesomeModule,
    HttpClientModule,
    LayoutModule,
    MatButtonModule,
    MaterialDesignFrameworkModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatRadioModule,
    MatSidenavModule,
    MatTabsModule,
    MatToolbarModule,
    NgbModule,
    SchemaFormModule.forRoot(),
    TreeModule,
    ReactiveFormsModule
  ],
  entryComponents:
    [RowLayoutComponent, ArrayGridComponent, TableComponent,
    GridComponent, StringComponent, SelectComponent, CheckboxComponent, IntegerComponent],
  providers: [{provide: WidgetRegistry, useClass: LformsWidgets}],
  bootstrap: [AppComponent]
})
export class AppModule { }
