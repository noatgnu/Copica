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
  graphLayout = {autosize:true, title: 'Copy number distribution', margin: {l: 100, r:100, b:100, t:100},
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

  @Input() set data(value: IDataFrame) {
    console.log("update bar-chart")
    if (this.origin.count() !== value.count()) {
      this.origin = value
      const gl = this.origin.getSeries("Gene names").distinct().bake().toArray()
      if (!this.arraysCompare(gl, this.geneList)) {
        this.geneList = gl
        this.graphData = []
        this._data = this.assignData();
      }
    }
  }

  currentDf: IDataFrame = new DataFrame()

  private assignData(selected: string[] = ["LRRK2"]) {
    this.graphData = []
    this.selectedProteins = selected
    const filtered: any[] = []
    const result: any = {}
    for (const g of this.origin.groupBy(row => row.label)) {
      const gFirst = g.first()

      const currentCellType = gFirst["Cell type"]
      const currentCondition = gFirst["Condition"]
      for (const gn of g.groupBy(rowg => rowg["Gene names"])) {
        const first = gn.first()
        if (selected.includes(first["Gene names"])) {
          if (!(first["Gene names"] in result)) {
            result[first["Gene names"]] = {x: [], y: [], error_y: {
                type: "data",
                array: [],
                visible: false
              },
              type: 'bar',
              name: first["Gene names"]
            }
          }
          for (const r of gn) {
            filtered.push(r)
          }
          if (gn.count() > 1) {
            const d = gn.getSeries("Copy number").parseFloats().bake().toArray()
            const average = gn.getSeries("Copy number").parseFloats().bake().average()
            const std = gn.getSeries("Copy number").parseFloats().bake().std()
            const sterr = std/Math.sqrt(gn.count())
            if (currentCondition !== "Standard") {
              result[first["Gene names"]].x.push(currentCellType + " " + currentCondition)
            } else {
              result[first["Gene names"]].x.push(currentCellType)
            }

            result[first["Gene names"]].y.push(average)
            result[first["Gene names"]].error_y.visible = true
            result[first["Gene names"]].error_y.array.push(sterr)
          } else {
            if (currentCondition !== "Standard") {
              result[first["Gene names"]].x.push(currentCellType + " " + currentCondition)
            } else {
              result[first["Gene names"]].x.push(currentCellType)
            }
            result[first["Gene names"]].y.push(first["Copy number"])
          }
        }
      }
    }
    for (const r in result) {
      this.graphData.push(result[r])
    }

    console.log(filtered)
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
