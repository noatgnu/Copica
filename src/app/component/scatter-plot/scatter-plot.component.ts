import {Component, Input, OnInit, AfterViewInit, OnChanges, ViewChild, SimpleChanges} from '@angular/core';
import {ChartDataSets, ChartType, ChartOptions, ChartColor} from "chart.js"
import {BaseChartDirective, Label} from "ng2-charts";
import {Observable, OperatorFunction} from "rxjs";
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import {DataFrame, IDataFrame} from "data-forge";
import {WebService} from "../../service/web.service";

@Component({
  selector: 'app-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.css'],
})
export class ScatterPlotComponent implements OnInit, AfterViewInit, OnChanges {
  model: any = "";
  toggleClass: boolean = true;
  selectedElement: Element[] = [];
  toggle() {
    this.toggleClass = !this.toggleClass
  }

  original: IDataFrame = new DataFrame();
  selectedProtein: any = {};
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  colors: string[] = [];
  pointRadius: number[] = []
  options: ChartOptions = {
    scales: {
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "log10 Copy Number"
          }
        }
      ],
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Rank"
          }
        }
      ]
    },
    responsive: true,
    //maintainAspectRatio: true,
    animation: {
      duration: 0
    },
    tooltips: {
      callbacks: {
        label: function (context, data) {
          let label = ""

          if (data["labels"]) {

            if (typeof context.index === "number") {
              //label = data["labels"][context.index];
              if (context.yLabel) {

                if (typeof context.yLabel === "number") {
                  label = label + data["labels"][context.index]
                    + "[" +(10**context.yLabel).toFixed(2) + "]"
                  ;
                }
              }
            }
          }
          return label
        }
      }
    }
  }

  lrrk2: string[] = []
  ngOnChanges(changes: SimpleChanges) {
    for (const p in changes) {
      if (p==="data") {
        this.data = changes["data"].currentValue;
      }
    }
  }


  constructor(private http: WebService) {
    for (const f in this.http.filters) {
      this.sampleColors[f] = this.getRandomColor()
    }
  }
  get data(): IDataFrame {
    return this._data;
  }
  private _data: IDataFrame = new DataFrame();
  label: string[] = []
  @Input() set data(value: IDataFrame) {
    this.original = value
    this.assignData();
  }
  cellTypes: string[] = []

  getRandomColor() {
    const letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (var i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  sampleColors: any = {}
  annotation: any = {}
  currentHightlight = "Lrrk2";
  highlight(pathway: string) {
    this.assignData([], pathway)
    this.currentHightlight = pathway
  }

  private assignData(selectedProteins: any = {}, pathway: string = "Lrrk2") {
    if (Object.keys(selectedProteins).length > 0){
      this.selectedProtein = selectedProteins
    }

    this.pointRadius = []
    this.lrrk2 = []
    const temp: any = {}
    const filtered: any[] = []
    this.scatterChartData = []
    const tempTypes: any[] = this.original.getSeries("Cell type").distinct().bake().toArray()
    this.cellTypes = []
    for (const t of tempTypes) {
      if (t !== "") {
        this.cellTypes.push(t)

      }
    }
    for (const c of this.cellTypes) {
      if (!(c in this.sampleColors)) {
        this.sampleColors[c] = this.getRandomColor()
      }
      if (!(c in this.selectedProtein)) {
        this.selectedProtein[c] = []
      }

    }
    this.label = this.original.getSeries("Gene names").distinct().bake().toArray()
    for (const r of this.original) {
      if (r["Gene names"] && r["Copy number"] && r["Rank"]) {
        r["Gene names"] = r["Gene names"].toUpperCase()
        const b = r["Gene names"].split(";")
        if (!(r["Cell type"] in temp)) {
          temp[r["Cell type"]] = {}
        }
        if (!(r["Gene names"] in temp[r["Cell type"]])) {
          temp[r["Cell type"]][r["Gene names"]] = {x: 0, y: 0}
        }

        temp[r["Cell type"]][r["Gene names"]].y = Math.log10(r["Copy number"])
        temp[r["Cell type"]][r["Gene names"]].x = r["Rank"]
        if (r["Cell type"] in selectedProteins) {
          if (selectedProteins[r["Cell type"]].includes(r["Gene names"])) {
            filtered.push(r)
          }
        }

        for (const v of b) {
          for (const f in this.http.filters) {
            if (!(f in this.annotation)) {
              this.annotation[f] = []
            }

            if (this.http.filters[f].includes(v)) {

                if (!(this.annotation[f].includes(r["Gene names"]))) {
                  this.annotation[f].push(r["Gene names"])
                }

            }
          }
        }
        if (Object.keys(selectedProteins).length === 0) {
          if (pathway in this.annotation) {
            if (this.annotation[pathway].includes(r["Gene names"])) {
              filtered.push(r)
            }
          }
        }
      }
    }
    for (const c of this.cellTypes) {
      const a: ChartDataSets = {
        backgroundColor: this.sampleColors[c],
        data: [],
        label: c,
        fill: false,
        //pointBorderColor: [],
        //pointBackgroundColor: [],
        pointRadius: [],
        borderWidth: 0,
        borderColor: "transparent"
      }
      const color: ChartColor[] = []
      const radius: number[] = []
      for (const t of this.label) {
        a.data?.push(temp[c][t])
        if (Object.keys(selectedProteins).length>0) {
          if (selectedProteins[c].includes(t)) {
            if (!(t in this.sampleColors)){
              this.sampleColors[t] = this.getRandomColor()
            }
            color.push(this.sampleColors[t])
            radius.push(5)
          } else {
            color.push(this.sampleColors[c])
            radius.push(1)
          }
        } else if (pathway === "") {
          color.push(this.sampleColors[c])
          radius.push(1)
        } else if (this.annotation[pathway].includes(t)) {
          if (!this.selectedProtein[c].includes(t)) {
            this.selectedProtein[c].push(t)
          }

          this.sampleColors[t] = this.sampleColors[pathway]
          color.push(this.sampleColors[pathway])
          radius.push(5)
        } else {
          color.push(this.sampleColors[c])
          radius.push(1)
        }
      }
      a.pointBackgroundColor = color
      a.pointBorderColor = color
      a.pointRadius = radius
      this.scatterChartData.push(a)
    }
    this._data = new DataFrame(filtered);
    this.rows = this._data.toArray();
    for (let i = 0; i < this.rows.length; i++) {
      if (typeof this.rows[i]["Copy number"] === "number") {
        this.rows[i]["Copy number"] = this.rows[i]["Copy number"].toFixed(2)
      }

    }
    console.log(this.rows)
    this.chart?.chart.update();
  }
  rows: any[] = []
  columns = [
    {prop: "Gene names"}, {name: "Copy #", prop: "Copy number"}, {name: "Rank", prop: "Rank"}, {name: "Type", prop: "Cell type"}
  ]
  scatterChartData: ChartDataSets[] = []
  scatterPlotType: ChartType = "scatter";

  width = 750
  height = 750
  min_x = 0
  min_y = 0

  ngOnInit(): void {

  }

  selectProtein(event: MouseEvent, protein: string, cellType: string, manual: boolean =  false) {

    const target = event.target as Element;

    if ((this.selectedProtein[cellType].includes(protein))) {

        if (target.classList.contains("badge-success")) {
          //target.classList.remove("badge-success")
          //target.classList.add("badge-danger")
          this.selectedProtein[cellType].push(protein)
          this.selectedElement.push(target)
        } else {
          //target.classList.remove("badge-danger")
          //target.classList.add("badge-success")

          //this.selectedElement.splice(ind, 1)
        }
      const ind = this.selectedProtein[cellType].indexOf(protein)

      this.selectedProtein[cellType].splice(ind, 1)

    } else {
      console.log("1")
      if (target.classList.contains("badge-success")) {
        //target.classList.remove("badge-success")
        //target.classList.add("badge-danger")
        this.selectedProtein[cellType].push(protein)
        this.selectedElement.push(target)
      } else {

        //target.classList.remove("badge-danger")
        //target.classList.add("badge-success")
        const t: string[] = []
        let ind = 0
        for (let i = 0; i < this.selectedElement.length; i++) {

          if (this.selectedProtein[cellType][i] === protein) {
            ind = i
          }

        }
        this.selectedProtein[cellType].splice(ind, 1)
        //this.selectedElement.splice(ind, 1)
      }


    }
    console.log(this.selectedProtein)
    this.assignData(this.selectedProtein)
  }

  resetSelection() {
    this.selectedProtein = {}
    for (const e of this.selectedElement) {
      e.classList.remove("badge-danger")
      e.classList.add("badge-success")
    }
    this.selectedElement = []
    this.assignData({}, "")
  }

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.label.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10))
    )

  searchSelectedProtein() {
    if (this.model.length > 2) {
      if (this.label.includes(this.model)) {
        for (const c of this.cellTypes) {
          if (!(this.selectedProtein[c].includes(this.model))) {
            this.selectedProtein[c].push(this.model)
          }
        }

      }
    }
    this.assignData(this.selectedProtein, "")
  }

  ngAfterViewInit() {
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
