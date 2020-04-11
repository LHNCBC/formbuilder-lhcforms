import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SchemaFormModule, WidgetRegistry, DefaultWidgetRegistry } from 'ngx-schema-form';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { Bootstrap3FrameworkModule} from '@ajsf/bootstrap3';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
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
import { NgxSchemaFormComponent } from './ngx-schema-form/ngx-schema-form.component';
import { TreeModule } from 'angular-tree-component';
import { ItemJsonEditorComponent } from './item-json-editor/item-json-editor.component';
import { AjsfFormComponent } from './ajsf-form/ajsf-form.component';
import { RowLayoutComponent } from './lib/row-layout/row-layout.component';
import { ArrayGridComponent } from './lib/array-grid/array-grid.component';

@NgModule({
  declarations: [
    AppComponent,
    JsonEditorComponent,
    NgxSchemaFormComponent,
    MainContentComponent,
    ItemJsonEditorComponent,
    AjsfFormComponent,
    RowLayoutComponent,
    ArrayGridComponent
  ],
  imports: [
    AppRoutingModule,
    Bootstrap3FrameworkModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
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
    SchemaFormModule.forRoot(),
    TreeModule
  ],
  entryComponents: [RowLayoutComponent, ArrayGridComponent],
  providers: [{provide: WidgetRegistry, useClass: DefaultWidgetRegistry}],
  bootstrap: [AppComponent]
})
export class AppModule { }
