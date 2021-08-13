import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {AppRoutingModule} from "./app-routing/app-routing.module";
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FileUploaderComponent } from './component/file-uploader/file-uploader.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {HttpClientModule} from "@angular/common/http";
import {WebService} from "./service/web.service";
import { FileSummaryComponent } from './component/file-summary/file-summary.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { DbBrowserComponent } from './component/db-browser/db-browser.component';
import { ScatterPlotComponent } from './component/scatter-plot/scatter-plot.component';
import { ChartsModule} from 'ng2-charts';
import { DbCellBrowseComponent } from './component/db-cell-browse/db-cell-browse.component';
import { DbScatterComponent } from './component/db-scatter/db-scatter.component';
import { HomeComponent } from './component/home/home.component';
import { BarChartComponent } from './component/bar-chart/bar-chart.component';
import {NgxDatatableModule} from "@swimlane/ngx-datatable";


@NgModule({
  declarations: [
    AppComponent,
    FileUploaderComponent,
    FileSummaryComponent,
    DbBrowserComponent,
    ScatterPlotComponent,
    DbCellBrowseComponent,
    DbScatterComponent,
    HomeComponent,
    BarChartComponent,

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgbModule,
    ReactiveFormsModule,
    ChartsModule,
    AppRoutingModule,
    FormsModule,
    NgxDatatableModule
  ],
  providers: [WebService],
  bootstrap: [AppComponent]
})
export class AppModule { }
