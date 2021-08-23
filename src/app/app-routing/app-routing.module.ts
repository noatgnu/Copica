import { NgModule } from '@angular/core';
import {Routes, RouterModule} from "@angular/router";
import {DbCellBrowseComponent} from "../component/db-cell-browse/db-cell-browse.component";
import {DbScatterComponent} from "../component/db-scatter/db-scatter.component";
import {HomeComponent} from "../component/home/home.component";
import {ProteomicRulerComponent} from "../component/proteomic-ruler/proteomic-ruler.component";

const routes: Routes = [
  {
    path: '', redirectTo: '/home', pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'copybrowse',
    component: DbScatterComponent
  },
  {
    path: 'cellbrowse',
    component: DbCellBrowseComponent
  },
  {
    path: 'ruler',
    component: ProteomicRulerComponent
  }
]

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes, {useHash: true})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
