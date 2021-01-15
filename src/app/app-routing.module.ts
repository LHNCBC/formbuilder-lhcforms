import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {NgxSchemaFormComponent} from './ngx-schema-form/ngx-schema-form.component';

const routes: Routes = [
    {path: 'ngx', component: NgxSchemaFormComponent}
  ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
