import { Component, computed, inject, input } from '@angular/core';
import { DataFrame, IDataFrame } from "data-forge";
import { PlotlyService, PlotlyComponent } from "angular-plotly.js";

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.css'],
  imports: [PlotlyComponent]
})
export class HeatmapComponent {
  private plotly = inject(PlotlyService);
  readonly data = input<IDataFrame>(new DataFrame());

  readonly graphData = computed(() => {
    const data = this.data();
    if (data.count() <= 1) {
      return [];
    }
    const columns = data.getColumnNames();
    const trace = {z: [] as number[][], x: columns.slice(1), y: [] as any[], type: "heatmap", hoverongaps: false};
    for (const r of data) {
      trace.y.push(r[columns[0]]);
      const values: number[] = [];
      for (const i of Object.values(r).slice(1)) {
        if (typeof i === "string") {
          values.push(parseFloat(i));
        } else if (typeof i === "number") {
          values.push(i);
        }
      }
      trace.z.push(values);
    }
    return [trace];
  });

  readonly graphLayout = computed(() => {
    const trace = this.graphData()[0];
    const rows = trace ? trace.y.length : 0;
    return {
      title: "",
      margin: {b: 200, l: 200},
      responsive: true,
      yaxis: {dtick: 1},
      width: 900,
      height: trace ? 40 * rows + 200 : 1000,
      xaxis: {tickangle: 90, dtick: 1},
      yaxis_nticks: rows,
      xaxis_nticks: trace ? trace.x.length : 0,
    };
  });

  async downloadPlotlyExtra(format: string) {
    const graph = this.plotly.getInstanceByDivId("heatmap");
    const p = await this.plotly.getPlotly();
    await p.downloadImage(graph, {format: format, width: 1000, height: 1000, filename: "image." + format});
  }
}
