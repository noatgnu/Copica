import {Component, Input, OnInit, QueryList, SimpleChanges, ViewChild} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {BaseChartDirective} from "ng2-charts";
import {ChartOptions, ChartDataSets, ChartType, Chart} from "chart.js";
import {Observable, OperatorFunction} from "rxjs";
import {debounceTime, distinctUntilChanged, map} from "rxjs/operators";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit {
  graphData: any[] = []
  graphLayout = {width: 1000, height: 500, title: 'Graph',
    xaxis: {
      title: "Cell type"
    },
    yaxis: {
      title: "Copy number"
    }
  }
  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.geneList.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10))
    )
  model: any = "";
  origin: IDataFrame = new DataFrame()
  geneList: string[] = []
  selectedProteins: string[] = []
  get data(): IDataFrame {
    return this._data;
  }

  private _data: IDataFrame = new DataFrame()
  labels: string[] = []

  @Input() set data(value: IDataFrame) {
    this.origin = value
    this.geneList = this.origin.getSeries("Gene names").distinct().bake().toArray()
    const a = this.assignData();
    this._data = a;
  }

  currentDf: IDataFrame = new DataFrame()

  private assignData(selected: string[] = ["LRRK2"]) {
    this.graphData = []

    this.selectedProteins = selected
    this.chartData = []
    const filtered: any[] = []
    const temp: any = {}
    const result: any = {}
    this.labels = this.origin.getSeries("Cell type").distinct().bake().toArray()
    for (const g of this.origin.groupBy(row => row.label)) {
      const gFirst = g.first()
      const currentCellType = gFirst["Cell type"]
      const currentCondition = gFirst["Condition"]
      for (const c of g.groupBy(row => row["Cell type"])) {
        for (const gn of c.groupBy(row => row["Gene names"])) {
          const first = gn.first()
          if (first["Gene names"] in selected) {
            if (!(first["Gene names"] in result)) {
              result[first["Gene names"]] = {x: [], y: [], error_y: {
                  type: "data",
                  array: [],
                  visible: true
                },
                type: 'scatter',
                name: first["Gene names"]
              }
            }
            if (gn.count() > 1) {
              const d = gn.getSeries("Copy number").bake().toArray()
              console.log(d)
            }
          }
        }
      }
    }
    for (const r of this.origin) {
      if (!(r["Cell type"] in temp)) {
        temp[r["Cell type"]] = {}
      }
      for (const s of selected) {
        if (!(s in temp[r["Cell type"]])) {
          temp[r["Cell type"]][s] = 0
        }
      }
      temp[r["Cell type"]][r["Gene names"]] = r["Copy number"]
      if (selected.includes(r["Gene names"])) {
        filtered.push(r)
      }
    }

    for (const s of selected) {
      const a: ChartDataSets = {data: [], label: s}
      const barGraph = {x: [], y: [], type: 'bar', name: s}

      for (const t of this.labels) {
        a.data?.push(temp[t][s])
        barGraph.x.push(<never>t)
        barGraph.y.push(<never>temp[t][s])

      }
      this.graphData.push(barGraph)
      this.chartData.push(a)
    }
    console.log(filtered)
    this.currentDf = new DataFrame(filtered)

    return this.currentDf;
  }

  chartData: ChartDataSets[] = []

  @ViewChild(BaseChartDirective) chart?: QueryList<BaseChartDirective>;
  colors: string[] = [];
  pointRadius: number[] = []
  options: ChartOptions = {
    scales: {
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Copy Number",
            fontStyle: "bold"
          },
          ticks: {
            fontStyle: "bold"
          }
        }
      ],
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Cell Type",
            fontStyle: "bold"
          },
          ticks: {
            fontStyle: "bold"
          }
        }
      ]
    },
    responsive: true,
    //maintainAspectRatio: true,
    animation: {
      duration: 10
    },
    plugins : {
      chartJsPluginErrorBars: {
        color: '#666',
        width: '60%',
        lineWidth: 2,
        absoluteValues: false
      }
    }
  }
  optionsradar: ChartOptions = {
    responsive: true,
    //maintainAspectRatio: true,
    animation: {
      duration: 10
    },
  }
  chartType:ChartType = "bar";
  ngOnChanges(changes: SimpleChanges) {
    for (const p in changes) {
      if (p==="data") {
        this.data = changes["data"].currentValue;
      }
    }
  }
  constructor() {

  }

  ngOnInit(): void {
  }

  searchSelectedProtein(){
    if (this.model.length > 2) {
      if (this.geneList.includes(this.model)) {
        if (!(this.selectedProteins.includes(this.model))) {
          this.selectedProteins.push(this.model)
        }
        this.assignData(this.selectedProteins)
      }
    }
  }

  removeSelected(p:string) {
    for (let i = 0; i < this.selectedProteins.length; i ++) {
      if (this.selectedProteins[i] === p) {
        this.selectedProteins.splice(i, 1)
        console.log(this.selectedProteins)
        this.assignData(this.selectedProteins)
        break
      }
    }
  }

  downloadSelectedData(data: IDataFrame) {
    const blob = new Blob([data.toCSV()], {type: 'text/csv'})
    const url = window.URL.createObjectURL(blob);

    if (typeof(navigator.msSaveOrOpenBlob)==="function") {
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
}
