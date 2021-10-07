import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {PlotlyService} from "angular-plotly.js";

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.css']
})
export class HeatmapComponent implements OnInit {
  graphData: any[] = []
  value = {min: 0, max:0}
  minValue = 0
  minColor = "#602F72"
  minMidColor = "#B14D75"
  midColor = "#EEA96E"
  maxValue = 0
  midMaxColor = "#EDC0B4"
  maxColor = "#F9EFEF"
  graphLayout: any = {title:"", margin: {b: 200, l: 200} , responsive: true,
    yaxis: {
      dtick: 1
    },
    width: 900, height: 1000,
    xaxis:{
      "tickangle": 90,
      dtick: 1
  }}

  _data: IDataFrame = new DataFrame();
  @Input() set data(value:IDataFrame) {
    this._data = value
    this.graphHeatmap()
  }
  get data(): IDataFrame {
    return this._data
  }
  constructor(private plotly: PlotlyService) { }

  async downloadPlotlyExtra(format: string) {
    const graph = this.plotly.getInstanceByDivId("heatmap");
    const p = await this.plotly.getPlotly();
    await p.downloadImage(graph, {format: format, width: 1000, height: 1000, filename: "image."+format})

  }

  ngOnInit(): void {
  }

  graphHeatmap() {
    this.graphData = [
      {z: [], x: [], y:[], type: "heatmap", hoverongaps: false, colorscale: []}
    ]
    const columns = this.data.getColumnNames()
    for (const c of columns.slice(1)) {
      this.graphData[0].x.push(c)
    }
    let minValue = 0
    let maxValue = 0
    let setMin = false
    let setMax = false

    for (const r of this.data) {
      this.graphData[0].y.push(r[columns[0]])
      const a: number[] = []
      for (const i of Object.values(r).slice(1)) {
        if (typeof i === "string") {
          a.push(parseFloat(i))
        } else if (typeof i === "number") {
          a.push(i)
        }
      }
      const minV = Math.min(...a)
      const maxV = Math.max(...a)
      if (!setMax) {
        maxValue = maxV
        setMax = true
      } else {
        if (maxV > maxValue) {
          maxValue = maxV
        }
      }
      if (!setMin) {
        minValue = minV
        setMin = true
      } else {
        if (minV < minValue) {
          minValue = minV
        }
      }


      this.graphData[0].z.push(a)
    }
    this.graphLayout.height = 40*this.graphData[0].y.length + 200
    this.graphLayout.yaxis_nticks = this.graphData[0].y.length
    this.graphLayout.xaxis_nticks = this.graphData[0].x.length
    this.colorScale(minValue, maxValue);
    this.value.min = minValue
    this.value.max = maxValue
  }


  colorScale(minValue: number, maxValue: number) {
    const midValue = (minValue + maxValue) / 2
    console.log(midValue)
    const minMidValue = (midValue + minValue) / 2
    console.log(minMidValue)
    const midMaxValue = (midValue + maxValue) / 2
    console.log(midMaxValue)
    this.graphData[0].colorscale = [
      [minValue, this.minColor],
      [minMidValue, this.minMidColor],
      [midValue, this.midColor],
      [midMaxValue, this.midMaxColor],
      [maxValue, this.maxColor]
    ]
    this.graphData[0].zmin = minValue
    this.graphData[0].zmax = maxValue
    this.graphData = [...this.graphData]
  }

  rescale(e: Event) {
    e.stopPropagation()
    this.colorScale(this.value.min, this.value.max)
    console.log(this.graphData)
  }
}
