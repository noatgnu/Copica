import {Component, Input, OnInit, AfterViewInit, OnChanges, ViewChild, SimpleChanges} from '@angular/core';
import {ChartDataSets, ChartType, ChartOptions, ChartColor} from "chart.js"
import {BaseChartDirective, Label} from "ng2-charts";
import {Observable, OperatorFunction} from "rxjs";
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import {DataFrame, IDataFrame} from "data-forge";

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
  selectedProtein: string[] = [];
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
                    + "[" +(10**context.yLabel) + "]"
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


  constructor() {
  }
  max_y = 0;
  max_x = 0;
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

  private assignData(selectedProteins: string[] = []) {
    this.pointRadius = []
    this.lrrk2 = []
    const temp: any = {}
    const filtered: any[] = []
    this.scatterChartData = []
    console.log(selectedProteins)
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
    }
    this.sampleColors["Lrrk2"] = this.getRandomColor()
    this.label = this.original.getSeries("Gene names").distinct().bake().toArray()
    for (const r of this.original) {
      if (r["Gene names"] && r["Copy number"] && r["Rank"]) {
        if (!(r["Cell type"] in temp)) {
          temp[r["Cell type"]] = {}
        }
        if (!(r["Gene names"] in temp[r["Cell type"]])) {
          temp[r["Cell type"]][r["Gene names"]] = {x: 0, y: 0}
        }

        temp[r["Cell type"]][r["Gene names"]].y = Math.log10(r["Copy number"])
        temp[r["Cell type"]][r["Gene names"]].x = r["Rank"]
        if (selectedProteins.includes(r["Gene names"])) {
          filtered.push(r)
        }
        if (r["LRRK2 pathway"] === "Selected") {
          if (!(this.lrrk2.includes(r["Gene names"]))) {
            this.lrrk2.push(r["Gene names"])
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
        if (selectedProteins.length>0) {
          if (selectedProteins.includes(t)) {
            color.push(this.getRandomColor())
            radius.push(5)
          } else {
            color.push(this.sampleColors[c])
            radius.push(1)
          }
        } else if (this.lrrk2.includes(t)) {
          color.push(this.sampleColors["Lrrk2"])
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
    this.chart?.chart.update();
  }


  scatterChartData: ChartDataSets[] = []
  scatterPlotType: ChartType = "scatter";

  width = 750
  height = 750
  min_x = 0
  min_y = 0

  ngOnInit(): void {

  }

  selectProtein(event: MouseEvent, protein: string, manual: boolean =  false) {

    const target = event.target as Element;

    if ((this.selectedProtein.includes(protein))) {

        if (target.classList.contains("badge-success")) {
          target.classList.remove("badge-success")
          target.classList.add("badge-danger")
          this.selectedProtein.push(protein)
          this.selectedElement.push(target)
        } else {
          target.classList.remove("badge-danger")
          target.classList.add("badge-success")
          let ind = 0
          for (let i = 0; i < this.selectedElement.length; i++) {
            if (this.selectedProtein[i] === protein) {
              ind = i
            }
          }
          this.selectedProtein.splice(ind, 1)
          this.selectedElement.splice(ind, 1)
        }

    } else {
      if (target.classList.contains("badge-success")) {
        target.classList.remove("badge-success")
        target.classList.add("badge-danger")
        this.selectedProtein.push(protein)
        this.selectedElement.push(target)
      } else {

        target.classList.remove("badge-danger")
        target.classList.add("badge-success")
        const t: string[] = []
        let ind = 0
        for (let i = 0; i < this.selectedElement.length; i++) {

          if (this.selectedProtein[i] === protein) {
            ind = i
          }

        }
        this.selectedProtein.splice(ind, 1)
        this.selectedElement.splice(ind, 1)
      }


    }
    this.assignData(this.selectedProtein)
  }

  resetSelection() {
    this.selectedProtein = []
    for (const e of this.selectedElement) {
      e.classList.remove("badge-danger")
      e.classList.add("badge-success")
    }
    this.selectedElement = []
    this.assignData()
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
        this.selectedProtein.push(this.model)
        this.assignData(this.selectedProtein)
      }
    }
  }

  ngAfterViewInit() {
  }
}
