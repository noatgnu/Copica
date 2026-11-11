import { Component, OnInit, inject, signal } from '@angular/core';
import { DataFrame, IDataFrame } from "data-forge";
import { ActivatedRoute } from "@angular/router";
import { WebService } from "../../service/web.service";
import { DbBrowserComponent } from '../db-browser/db-browser.component';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';

@Component({
  selector: 'app-db-scatter',
  templateUrl: './db-scatter.component.html',
  styleUrls: ['./db-scatter.component.css'],
  imports: [DbBrowserComponent, ScatterPlotComponent]
})
export class DbScatterComponent implements OnInit {
  private web = inject(WebService);
  private route = inject(ActivatedRoute);
  readonly scatterData = signal<IDataFrame | undefined>(undefined);
  readonly heatmapData = signal<IDataFrame>(new DataFrame());

  scatterDataHandler(e: IDataFrame) {
    this.scatterData.set(e);
  }

  downloadSelectedData(data: IDataFrame) {
    const blob = new Blob([data.toCSV()], {type: 'text/csv'})
    const url = window.URL.createObjectURL(blob);

    // @ts-ignore
    if (typeof(navigator.msSaveOrOpenBlob)==="function") {
      // @ts-ignore
      navigator.msSaveBlob(blob, "data.csv")
    } else {
      const a = document.createElement("a")
      a.href = url
      a.download = "data.csv"
      document.body.appendChild(a)
      a.click();
      document.body.removeChild(a);
    }
    window.URL.revokeObjectURL(url)
  }

  handleHeatmap(data: IDataFrame) {
    this.heatmapData.set(data);
  }

  ngOnInit() {
    this.route.params.subscribe(res => {
      if (res["gene"]) {
        this.web.scatterData = res["gene"].split(",");
      }
      if (res["datasets"]) {
        this.web.scatterFiles = res["datasets"].split(",");
      }
    });
  }
}
