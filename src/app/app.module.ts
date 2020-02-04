import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SchemaFormModule, WidgetRegistry, DefaultWidgetRegistry } from 'ngx-schema-form';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JsonEditorComponent } from './json-editor/json-editor.component';
import { HttpClientModule } from '@angular/common/http';
import { NgxSchemaFormComponent } from './ngx-schema-form/ngx-schema-form.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainContentComponent } from './main-content/main-content.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { TreeModule } from 'angular-tree-component';
import {MatFormFieldModule} from '@angular/material';
import {MatInputModule} from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    JsonEditorComponent,
    NgxSchemaFormComponent,
    MainContentComponent
  ],
  imports: [
    SchemaFormModule.forRoot(),
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    TreeModule
  ],
  providers: [{provide: WidgetRegistry, useClass: DefaultWidgetRegistry}],
  bootstrap: [AppComponent]
})
export class AppModule { }
