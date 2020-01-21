import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {JsonEditorComponent} from './json-editor/json-editor.component';
import {NgxSchemaFormComponent} from './ngx-schema-form/ngx-schema-form.component';


const routes: Routes = [
    {path: 'json-editor', component: JsonEditorComponent},
    {path: 'ngx', component: NgxSchemaFormComponent},
    {path: '**', component: NgxSchemaFormComponent}
  ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
