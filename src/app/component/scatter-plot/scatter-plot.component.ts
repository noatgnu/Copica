import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  OnChanges,
  ViewChild,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';
import {ChartDataSets, ChartType, ChartOptions, ChartColor} from "chart.js"
import {BaseChartDirective, Label} from "ng2-charts";
import {Observable, OperatorFunction} from "rxjs";
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import {DataFrame, IDataFrame} from "data-forge";
import {WebService} from "../../service/web.service";
import {Location} from "@angular/common";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BatchSearchModalComponent} from "../batch-search-modal/batch-search-modal.component";

@Component({
  selector: 'app-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.css'],
})
export class ScatterPlotComponent implements OnInit, AfterViewInit, OnChanges {
  searchType: string = "Gene names"
  closeResult: string = ""

  openBatchSelection() {
    const ref = this.modalService.open(BatchSearchModalComponent, {size: "xl"})
    ref.closed.subscribe((data) => {
      if (data) {
        this.searchType = data.searchType
        this.closeResult = data.closeResult
        this.batchSelection()
      }
    })
  }

  batchSelection() {
    const data = []
    for (const r of this.closeResult.split("\n")) {
      const a = r.trim()
      const e = a.split(";")
      let selected = false
      for (let f of e) {
        f = f.trim()
        if (f !== "") {
          switch (this.searchType) {
            case "Gene names":
              for (const b of this.label) {
                const c = b.split(";")
                for (const d of c) {
                  if (f === d) {
                    selected = true
                    data.push(b)
                    break
                  }
                }
              }
              break
            default:
              break
          }
          if (selected) {
            break
          }
        }
      }
    }
    if (this.cellTypes.length > 0) {
      for (const c of this.cellTypes) {
        const g = this.original.where(row => row["label"] === c).bake()
        const l = g.getSeries("Gene names").bake().toArray()
        for (const d of data) {
          if (!(this.selectedProtein[c].includes(d))) {
            if (l.includes(d)) {
              this.selectedProtein[c].push(d)
            }
          }
        }
      }
    } else {
      for (const a of this.original.groupBy(row => row["label"]).bake()) {
        const g = a.first()
        const l = a.getSeries("Gene names").bake().toArray()
        for (const d of data) {
          console.log(d)
          if (l.includes(d)) {
            if (!(g["label"] in this.selectedProtein)) {
              this.selectedProtein[g["label"]] = []
            }
            this.selectedProtein[g["label"]].push(d)
            console.log(this.selectedProtein[g["label"]].length)
          }
        }
      }
    }

    console.log(this.selectedProtein)
    this.assignData(this.selectedProtein, "")
  }
  @ViewChild('myTable') table: any;
  tableFilterModel:any = "";
  @Output() heatmap: EventEmitter<IDataFrame> = new EventEmitter<IDataFrame>()
  tempRows: any[] = []

  updateFilter() {
    const val = this.tableFilterModel.toLowerCase()
    if (val.length !== 0) {
      const temp = this.rows.filter(function (d) {
        return d["Gene names"].toLowerCase().indexOf(val) !== -1 || !val;
      })
      this.rows = temp
    } else {
      this.rows = [...this.tempRows]
    }
    this.table.offset = 0

  }

  toggleExpandGroup(group: any) {
    this.table.groupHeader.toggleExpandGroup(group);
  }
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
    legend: {
      labels: {
        fontStyle: "bold",
        fontSize: 14
      }
    },
    scales: {

      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "log10 Copy Number",
            fontStyle: "bold",
            fontSize: 20
          },
          ticks: {
            fontStyle: "bold",
            fontSize: 14
          },
        }
      ],
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Rank",
            fontStyle: "bold",
            fontSize: 20
          },
          ticks: {
            fontStyle: "bold",
            fontSize: 14
          },
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


  constructor(private modalService: NgbModal, private http: WebService, private location: Location) {
    if (this.http.scatterData.length > 0) {
      this.closeResult = this.http.scatterData.join("\n")
    }

    for (const f in this.http.filters) {
      this.sampleColors[f] = this.getRandomColor()
    }
  }
  get data(): IDataFrame {
    return this._data;
  }
  private _data: IDataFrame = new DataFrame();
  label: string[] = []
  changed: boolean|undefined = undefined
  @Input() set data(value: IDataFrame) {
    if (value.count() >0) {
      this.original = value
      this.label = this.original.getSeries("Gene names").distinct().bake().toArray()
      if (this.changed === undefined) {
        this.changed = true
      } else {
        this.changed = this.selectedFiles !== this.location.path(true).replace("/copybrowse/", "").replace("/ruler", "");

      }
      if (this.changed) {


        this.selectedFiles = this.location.path(true).replace("/copybrowse/", "").replace("/ruler", "")
        if (this.closeResult !== "") {
          this.batchSelection()
        } else {
          this.assignData();
        }
      }
    }

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

  heatmapData: IDataFrame = new DataFrame()
  private assignData(selectedProteins: any = {}, pathway: string = "Lrrk2") {

    this.closeResult = ""
    if (Object.keys(selectedProteins).length > 0){
      this.selectedProtein = selectedProteins
    }
    const heatmapData: any = {}
    this.pointRadius = []
    this.lrrk2 = []
    const temp: any = {}
    const filtered: any[] = []
    this.scatterChartData = []
    const tempTypes: any = {}
    const group = this.original.getSeries("label").distinct().bake().toArray()
    console.log(this.original)
    for (const r of group) {
      const tempLabel = r
      if (!(tempLabel in tempTypes)) {
        tempTypes[tempLabel] = true
      }
    }
    console.log(selectedProteins, pathway)
    //const tempTypes: any[] = this.original.getSeries("label").distinct().bake().toArray()
    this.cellTypes = []
    for (const t in tempTypes) {
      if (t !== "") {
        this.cellTypes.push(t)
      }
    }
    console.log(this.cellTypes)
    for (const c of this.cellTypes) {
      if (!(c in this.sampleColors)) {
        this.sampleColors[c] = this.getRandomColor()
      }
      if (!(c in this.selectedProtein)) {
        this.selectedProtein[c] = []
      }
    }
    console.log(selectedProteins)
    for (const g of this.original.groupBy(row => row.label)) {
      for (const re of g.groupBy(row => row["Gene names"])) {

        for (const rem of re.groupBy(row => row["Accession IDs"])) {
          const r = rem.first()
          if (r["Rank"] !== "" && r["Rank"]!==0) {
            let b = ["Undefined"]
            if (r["Gene names"] !== undefined) {
              b = r["Gene names"].split(";")
            }

            const tempLabel = r["label"]
            if (!(tempLabel in temp)) {
              temp[tempLabel] = {}
            }

            if (!(r["Gene names"] in temp[tempLabel])) {
              temp[tempLabel][r["Gene names"]] = {x: 0, y: 0}
            }

            let x = parseFloat(r["Rank"])
            let y = parseFloat(r["Copy number"])
            if (rem.count() > 1) {
              //console.log(rem)
              const xArray = rem.getSeries("Rank").bake().toArray()
              const yArray = rem.getSeries("Copy number").bake().toArray()
              let rank = 0
              let copyNumber = 0
              for (let i = 0; i < xArray.length; i ++) {
                if (typeof xArray[i] === "string") {
                  rank = rank + parseFloat(xArray[i])
                } else {
                  rank = rank + xArray[i]
                }
                if (typeof yArray[i] === "string") {
                  copyNumber = copyNumber + parseFloat(yArray[i])
                } else {
                  copyNumber = copyNumber + yArray[i]
                }
              }
              x = rank/xArray.length
              y = copyNumber/yArray.length
              r["Rank"] = x
              r["Copy number"] = y
            }
            if (x !== 0 && y !== 0) {
              temp[tempLabel][r["Gene names"]].y = Math.log10(y)
              temp[tempLabel][r["Gene names"]].x = x
              if (tempLabel in selectedProteins) {
                if (selectedProteins[tempLabel].includes(r["Gene names"])) {
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


        }

      }
    }
    console.log(temp)
    console.log(selectedProteins)
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

        if (temp[c][t] !== undefined) {
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
              if (temp[c][t] !== undefined){
                this.selectedProtein[c].push(t)
              }
            }

            this.sampleColors[t] = this.sampleColors[pathway]
            color.push(this.sampleColors[pathway])
            radius.push(5)
          } else {
            color.push(this.sampleColors[c])
            radius.push(1)
          }
        }

      }
      a.pointBackgroundColor = color
      a.pointBorderColor = color
      a.pointRadius = radius
      this.scatterChartData.push(a)
    }
    this._data = new DataFrame(filtered);
    this.rows = this._data.toArray();
    this.tempRows = this._data.toArray();
    for (let i = 0; i < this.rows.length; i++) {
      if (typeof this.rows[i]["Copy number"] === "number") {
        this.rows[i]["Copy number"] = this.rows[i]["Copy number"].toFixed(2)
      }
      const temp_name = this.rows[i]["Accession IDs"] + "(" +  this.rows[i]["Gene names"] + ")"
      if (!(temp_name in heatmapData)) {
        heatmapData[temp_name] = {"ID": temp_name}
      }
      const sample_name = this.rows[i]["label"] + "_" + this.rows[i]["Fraction"]
      if (!(sample_name in heatmapData[temp_name])) {
        heatmapData[temp_name][sample_name] = this.rows[i]["Copy number"]
      }
    }
    const heatmapDF: any[] = []
    for (const k in heatmapData) {
      heatmapDF.push(heatmapData[k])
    }
    if (heatmapDF.length > 0) {
      this.heatmapData = new DataFrame(heatmapDF)
    }
    this.chart?.chart.update();
  }


  rows: any[] = []
  columns = [
    {prop: "Gene names"}, {name: "Accession", prop: "Accession IDs"}, {name: "Copy #", prop: "Copy number"}, {name: "Rank", prop: "Rank"}, {name: "Type", prop: "Cell type"}, {name: "Replicate", prop: "Fraction"}, {name: "Condition", prop: "Condition"}
  ]
  scatterChartData: ChartDataSets[] = []
  scatterPlotType: ChartType = "scatter";

  width = 750
  height = 750
  min_x = 0
  min_y = 0
  selectedFiles: string = ""

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
  shareUrl = ""
  getUrl() {
    const data: string[] = []
    for (const s in this.selectedProtein) {
      for (const p of this.selectedProtein[s]) {
        if (!(data.includes(p))) {
          data.push(p)
        }
      }
    }
    this.shareUrl = window.location.origin +"/#/copybrowse/" + this.http.scatterFiles.join(",") + "/" + data.join(",")
  }
}
