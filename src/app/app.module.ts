import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SchemaFormModule, WidgetRegistry, DefaultWidgetRegistry } from 'ngx-schema-form';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JsonEditorComponent } from './json-editor/json-editor.component';
import { HttpClientModule } from '@angular/common/http';
import { NgxSchemaFormComponent } from './ngx-schema-form/ngx-schema-form.component';

@NgModule({
  declarations: [
    AppComponent,
    JsonEditorComponent,
    NgxSchemaFormComponent
  ],
  imports: [
    SchemaFormModule.forRoot(),
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [{provide: WidgetRegistry, useClass: DefaultWidgetRegistry}],
  bootstrap: [AppComponent]
})
export class AppModule { }
