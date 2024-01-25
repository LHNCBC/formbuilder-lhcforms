import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {SnomedComponent} from './snomed/snomed.component';
import {BasePageComponent} from './base-page/base-page.component';

const routes: Routes = [
  {path: '', component: BasePageComponent},
  {path: 'snomed', component: SnomedComponent},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
