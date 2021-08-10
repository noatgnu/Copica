import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FileUploaderComponent } from './component/file-uploader/file-uploader.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {HttpClientModule} from "@angular/common/http";
import {WebService} from "./service/web.service";
import { FileSummaryComponent } from './component/file-summary/file-summary.component';
import {ReactiveFormsModule} from "@angular/forms";
import { DbBrowserComponent } from './component/db-browser/db-browser.component';
import { ScatterPlotComponent } from './component/scatter-plot/scatter-plot.component';
import { ChartsModule} from 'ng2-charts';


@NgModule({
  declarations: [
    AppComponent,
    FileUploaderComponent,
    FileSummaryComponent,
    DbBrowserComponent,
    ScatterPlotComponent,

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    NgbModule,
    ReactiveFormsModule,
    ChartsModule
  ],
  providers: [WebService],
  bootstrap: [AppComponent]
})
export class AppModule { }
