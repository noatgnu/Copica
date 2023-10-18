import {Component, EventEmitter, Input, OnInit, Output, QueryList, SimpleChanges, ViewChild} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {BaseChartDirective} from "ng2-charts";
import {ChartOptions, ChartDataSets, ChartType, Chart} from "chart.js";
import {BehaviorSubject, Observable, OperatorFunction} from "rxjs";
import {debounceTime, distinctUntilChanged, map} from "rxjs/operators";
import {GraphData} from "../../class/graph-data";
import {PlotlyService} from "angular-plotly.js";
import {WebService} from "../../service/web.service";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit {
  graphData: any[] = []
  graphLayout = {autosize:true, title: '<br>Copy number distribution</br>', margin: {l: 100, r:100, b:100, t:100},
    xaxis: {
      title: "<b>Cell type</b>",
      type: "category",
      tickfont: {
        size: "12"
      }
    },
    yaxis: {
      title: "<b>Copy number</b>"
    }
  }

  drawTriggerSubject = new BehaviorSubject<boolean>(false)
  @Output() updateSelection = new EventEmitter<string[]>()

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
  _selectedProteins: string[] = []
  set selectedProteins(values: string[]) {
    this._selectedProteins = values
  }

  get selectedProteins(): string[] {
    return this._selectedProteins
  }
  get data(): IDataFrame {
    return this._data;
  }

  private _data: IDataFrame = new DataFrame()
  labels: string[] = []

  arraysCompare(a: any[], b: any[]):boolean {
    if (a.length != b.length) {
      return false
    } else {
      a.sort()
      b.sort()
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        return false
      }
    }
    return true
  }

  initialLoad = true
  updateTrigger = 0

  _gData:GraphData = new GraphData()

  get gData(): GraphData {
    return this._gData
  }

  @Input() set gData(value: GraphData) {
    this._gData = value;
    this.selectedProteins = value.selectedProteins
    this.data = value.data
  }


  set data(value: IDataFrame) {
    console.log("update bar-chart")
    if (this.origin.count() !== value.count()) {
      this.origin = value
      const gl = this.origin.getSeries("Gene names").distinct().bake().toArray()
      if (!this.arraysCompare(gl, this.geneList)) {
        this.geneList = gl
        this.graphData = []
        this._data = this.assignData(this.selectedProteins);
      }
    }
  }

  async downloadPlotlyExtra(format: string) {
    const graph = this.plotly.getInstanceByDivId('barchart');
    const p = await this.plotly.getPlotly();
    await p.downloadImage(graph, {format: format, filename: "image"})

  }
  currentDf: IDataFrame = new DataFrame()

  private assignData(selected: string[] = ["LRRK2"]) {
    this.http.updateSelected.next(true)
    this.http.selected = selected
    this.graphData = []
    this.selectedProteins = selected
    const filtered: any[] = []
    const result: any = {}
    for (const g of this.origin.groupBy(row => row.label)) {
      const gFirst = g.first()
      console.log(gFirst)
      const currentCellType = gFirst["Cell type"].toString()
      const currentCondition = gFirst["Condition"]
      for (const gn of g.groupBy(rowg => rowg["Gene names"])) {
        const first = gn.first()
        if (selected.includes(first["Gene names"])) {
          for (const ga of gn.groupBy(acc => acc["Accession IDs"])) {
            const firstA = ga.first()
            const name = firstA["Gene names"] + ":" + firstA["Accession IDs"]
            if (!(name in result)) {
              result[name] = {x: [], y: [], error_y: {
                  type: "data",
                  array: [],
                  visible: false
                },
                type: 'bar',
                name: name
              }
            }
            for (const r of ga) {
              filtered.push(r)
            }
            if (gn.count() > 1) {
              const average = gn.getSeries("Copy number").parseFloats().bake().average()
              const std = gn.getSeries("Copy number").parseFloats().bake().std()
              const sterr = std/Math.sqrt(gn.count())
              if (currentCondition !== "Standard") {
                result[name].x.push(currentCellType + " " + currentCondition)
              } else {
                result[name].x.push(currentCellType)
              }

              result[name].y.push(average)
              result[name].error_y.visible = true
              result[name].error_y.array.push(sterr)
            } else {
              if (currentCondition !== "Standard") {
                result[name].x.push(currentCellType + " " + currentCondition)
              } else {
                result[name].x.push(currentCellType)
              }
              result[name].y.push(firstA["Copy number"])
            }
          }

        }
      }
    }
    for (const r in result) {
      this.graphData.push(result[r])
    }

    this.currentDf = new DataFrame(filtered)

    return this.currentDf;
  }

  colors: string[] = [];
  pointRadius: number[] = []

  chartType:ChartType = "bar";
  ngOnChanges(changes: SimpleChanges) {
    for (const p in changes) {
      if (p==="data") {
        this.data = changes["data"].currentValue;
      }
    }
  }
  constructor(private plotly: PlotlyService, private http: WebService) {

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
        this.updateSelection.next(this.selectedProteins)
      }
    }
  }

  removeSelected(p:string) {
    for (let i = 0; i < this.selectedProteins.length; i ++) {
      if (this.selectedProteins[i] === p) {
        this.selectedProteins.splice(i, 1)
        this.assignData(this.selectedProteins)
        this.updateSelection.next(this.selectedProteins)
        break
      }
    }
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
}
