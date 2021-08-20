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
  @ViewChild('myTable') table: any;
  tableFilterModel:any = "";

  tempRows: any[] = []
  replicateAverage:boolean = true;
  graphData: any[] = []
  graphLayout = {width: "100%", height: 700, title: 'Copy # versus protein rank',
    //margin: {l: 100, r:100, b:100, t:100},
    xaxis: {
      title: "Rank"
    },
    yaxis: {
      title: "log10(copy #)"
    }
  }

  updateFilter() {
    const val = this.tableFilterModel.toLowerCase()
    if (val.length !== 0) {
      const temp = this.tempRows.filter(function (d) {
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
    this.assignData({}, "Lrrk2", true);
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
  highlight(event: MouseEvent, pathway: string) {
    event.stopPropagation()
    this.currentHightlight = pathway
    this.assignData({}, pathway, true)
  }

  private assignData(selectedProteins: any = {}, pathway: string = "Lrrk2", auto: boolean = false) {
    console.log(selectedProteins)
    if (Object.keys(selectedProteins).length > 0){
      this.selectedProtein = selectedProteins
    }
    this.graphData = []
    const filtered: any[] = []
    this.cellTypes = []
    const result: any = {}
    this.label = this.original.getSeries("Gene names").bake().distinct().toArray()
    for (const g of this.original.groupBy(row => row.label)) {
      const gFirst = g.first()

      const currentCellType = gFirst["Cell type"]
      const currentCondition = gFirst["Condition"]
      let currentGroup = currentCellType + " " + currentCondition

      if (!this.replicateAverage) {
        //currentGroup += " " + gFirst["Fraction"]
        for (const r of g) {

          const currentSelection = currentGroup + " " + r["Fraction"]
          this.cellTypes.push(currentSelection)
          this.populateAnnotation(r);
          this.initializeColorsAndSelection(currentSelection)
          this.populateResultObject(selectedProteins, result, currentSelection, pathway)
          if (!(this.currentHightlight in result)) {
            this.populateResultObject(selectedProteins, result, currentSelection, this.currentHightlight);
          }
          if (pathway !== "") {
            this.addRowToFilter(selectedProteins, this.currentHightlight, r, filtered, currentSelection);
          } else {
            this.addRowToFilter(selectedProteins, "", r, filtered, currentSelection)
          }
          //this.addSizeAndColor(this.selectedProtein, currentSelection, r, result, pathway)

          const cn = parseFloat(r["Copy number"])
          if (this.annotation[this.currentHightlight].includes(r["Gene names"])) {
            if (this.selectedProtein[currentSelection].includes(r["Gene names"])) {
              result[this.currentHightlight].x.push(r["Rank"])
              result[this.currentHightlight].y.push(Math.log10(cn))
              result[this.currentHightlight].text.push(r["Gene names"] + this.currentHightlight )
            } else {
              if (this.currentHightlight === pathway || auto) {
                result[this.currentHightlight].x.push(r["Rank"])
                result[this.currentHightlight].y.push(Math.log10(cn))
                result[this.currentHightlight].text.push(r["Gene names"] + this.currentHightlight )
              }
            }
          }
          result[currentSelection].x.push(r["Rank"])
          result[currentSelection].y.push(Math.log10(cn))
          result[currentSelection].text.push(r["Gene names"])
        }
      } else {
        this.cellTypes.push(currentGroup)
        this.populateResultObject(selectedProteins, result, currentGroup, pathway);
        if (!(this.currentHightlight in result)) {
          this.populateResultObject(selectedProteins, result, currentGroup, this.currentHightlight);
        }
        this.initializeColorsAndSelection(currentGroup);
        for (const gn of g.groupBy(repl => repl["Gene names"])) {
          for (const gna of gn.groupBy(re => re["Accession IDs"])) {
            const first = gna.first()
            this.populateAnnotation(first);
            if (!(first["Gene names"] in this.sampleColors)) {
              this.sampleColors[first["Gene names"]] = this.getRandomColor()
            }
            if (gna.count() > 1) {

              for (const r of gna) {
                if (pathway !== "") {
                  this.addRowToFilter(selectedProteins, this.currentHightlight, r, filtered, currentGroup);
                } else {
                  this.addRowToFilter(selectedProteins, "", r, filtered, currentGroup);
                }

              }
              const rank_average = gna.getSeries("Rank").parseFloats().bake().average()
              const average = gna.getSeries("Copy number").parseFloats().bake().average()
              if (this.annotation[this.currentHightlight].includes(first["Gene names"])) {
                if (this.selectedProtein[currentGroup].includes(first["Gene names"])) {
                  result[this.currentHightlight].x.push(rank_average)
                  result[this.currentHightlight].y.push(Math.log10(average))
                  result[this.currentHightlight].text.push(first["Gene names"] + this.currentHightlight )
                } else {
                  if (this.currentHightlight === pathway || auto) {
                    result[this.currentHightlight].x.push(rank_average)
                    result[this.currentHightlight].y.push(Math.log10(average))
                    result[this.currentHightlight].text.push(first["Gene names"] + this.currentHightlight )
                  }
                }
              }
              result[currentGroup].x.push(rank_average)
              result[currentGroup].y.push(Math.log10(average))
              result[currentGroup].text.push(first["Gene names"])
            } else {
              if (pathway !== "") {
                this.addRowToFilter(selectedProteins, this.currentHightlight, first, filtered, currentGroup);
              } else {
                this.addRowToFilter(selectedProteins, "", first, filtered, currentGroup);
              }
              const cn = parseFloat(first["Copy number"])
              if (this.annotation[this.currentHightlight].includes(first["Gene names"])) {

                if (this.selectedProtein[currentGroup].includes(first["Gene names"])) {
                  result[this.currentHightlight].x.push(first["Rank"])
                  result[this.currentHightlight].y.push(Math.log10(cn))
                  result[this.currentHightlight].text.push(first["Gene names"] + this.currentHightlight )
                } else {
                  if (this.currentHightlight === pathway || auto) {
                    result[this.currentHightlight].x.push(first["Rank"])
                    result[this.currentHightlight].y.push(Math.log10(cn))
                    result[this.currentHightlight].text.push(first["Gene names"] + this.currentHightlight )
                  }
                }
              }
              if (Object.keys(selectedProteins).length === 0) {

              }
              result[currentGroup].x.push(first["Rank"])
              result[currentGroup].y.push(Math.log10(cn))
              result[currentGroup].text.push(first["Gene names"])
            }
            //this.addSizeAndColor(this.selectedProtein, currentGroup, first, result, pathway);
          }

        }
      }
    }
    for (const r in result) {
      this.graphData.push(result[r])
    }
    this._data = new DataFrame(filtered);
    this.rows = this._data.toArray();
    this.tempRows = this._data.toArray();
    for (let i = 0; i < this.rows.length; i++) {
      if (typeof this.rows[i]["Copy number"] === "number") {
        this.rows[i]["Copy number"] = this.rows[i]["Copy number"].toFixed(2)
      }

    }


    this.chart?.chart.update();
  }

  private addSizeAndColor(selectedProteins: any, currentGroup: string, first:any, result: any, pathway: any = "Lrrk2") {
    if (selectedProteins[currentGroup] !== undefined) {
      if (selectedProteins[pathway] !== undefined) {
        if (selectedProteins[pathway].includes(first["Gene names"])) {
          result[pathway].marker.size.push(10)
          result[pathway].marker.color.push(this.sampleColors[first["Gene names"]])
        } else {
          result[currentGroup].marker.size.push(5)
          result[currentGroup].marker.color.push(this.sampleColors[currentGroup])
        }
      } else {
        if (selectedProteins[currentGroup].includes(first["Gene names"])) {
          result[currentGroup].marker.size.push(10)
          result[currentGroup].marker.color.push(this.sampleColors[first["Gene names"]])
        } else {
          result[currentGroup].marker.size.push(5)
          result[currentGroup].marker.color.push(this.sampleColors[currentGroup])
        }
      }
    } else {
      result[currentGroup].marker.size.push(5)
      result[currentGroup].marker.color.push(this.sampleColors[currentGroup])
    }

  }

  private populateResultObject(selectedProteins: any, result: any, currentGroup: string, pathway: any) {
    if (selectedProteins[pathway] !== undefined) {
      if (pathway !== "") {
        if (!(pathway in result)) {
          result[pathway] = {
            x: [], y: [],
            mode: "markers",
            type: 'scatter',
            text: [],
            marker: {
              size: 10,
              color: this.sampleColors[pathway],
              line: {
                width: 0
              }
            },
            name: pathway
          }
        }
      }
    } else {
      if (!(pathway in result)) {
        result[pathway] = {
          x: [], y: [],
          mode: "markers",
          type: 'scatter',
          text: [],
          marker: {
            size: 10,
            color: this.sampleColors[pathway],
            line: {
              width: 0
            }
          },
          name: pathway
        }
      }
    }
    if (!(currentGroup in result)) {
      result[currentGroup] = {
        x: [], y: [],
        mode: "markers",
        type: 'scatter',
        text: [],
        opacity: 0.3,
        marker: {
          size: 4,

          color: this.sampleColors[currentGroup],
          line: {
            width: 0
          }
        },
        name: currentGroup
      }
    }

  }

  private addRowToFilter(selectedProteins: any, pathway: string, first:any, filtered: any[], currentGroup: any) {
    if (pathway !== "") {
      if (Object.keys(selectedProteins).length === 0) {
        if (pathway in this.annotation) {
          if (this.annotation[pathway].includes(first["Gene names"])) {
            filtered.push(first)
            this.selectedProtein[pathway].push(first["Gene names"])
            this.selectedProtein[currentGroup].push(first["Gene names"])
          }
        }
      }
    } else {
      if (Object.keys(selectedProteins).length !== 0) {
        if ((this.selectedProtein[currentGroup].includes(first["Gene names"]))) {
          filtered.push(first)
        }
        //filtered.push(first)
        //this.selectedProtein[currentGroup].push(first["Gene names"])
      }
    }

  }

  private populateAnnotation(first: any) {
    const b = first["Gene names"].split(";")
    for (const v of b) {
      for (const f in this.http.filters) {
        if (!(f in this.annotation)) {
          this.annotation[f] = []
        }
        if (!(f in this.sampleColors)) {
          this.sampleColors[f] = this.getRandomColor()
        }

        if (this.http.filters[f].includes(v)) {

          if (!(this.annotation[f].includes(first["Gene names"]))) {
            this.annotation[f].push(first["Gene names"])
            this.selectedProtein[f] = []
            this.sampleColors[first["Gene names"]] = this.sampleColors[f]
          }
        }
      }
    }
  }

  private initializeColorsAndSelection(currentGroup: string) {
    if (!(currentGroup in this.sampleColors)) {
      this.sampleColors[currentGroup] = this.getRandomColor()
    }
    if (!(currentGroup in this.selectedProtein)) {
      this.selectedProtein[currentGroup] = []
    }
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

  ngOnInit(): void {

  }

  selectProtein(event: MouseEvent, protein: string, cellType: string, manual: boolean =  false) {
    event.stopPropagation()
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
    console.log(this.selectedProtein)
    this.assignData(this.selectedProtein, cellType)
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
