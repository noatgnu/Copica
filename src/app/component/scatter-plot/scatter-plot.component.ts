import {Component, Input, OnInit, AfterViewInit, OnChanges, ViewChild, SimpleChanges} from '@angular/core';
import {ChartDataSets, ChartType, ChartOptions} from "chart.js"
import {BaseChartDirective, Label} from "ng2-charts";
import {Observable, OperatorFunction} from "rxjs";
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.css'],
})
export class ScatterPlotComponent implements OnInit, AfterViewInit, OnChanges {
  model: any = "";
  toggleClass: boolean = true;
  defaultClass = "badge badge-pill badge-success ml-1";
  clickedClass = "badge badge-pill badge-danger ml-1"
  selectedElement: Element[] = [];
  toggle() {
    this.toggleClass = !this.toggleClass
  }

  original: any[] = [];
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
    responsive: false,
    maintainAspectRatio: true,
    animation: {
      duration: 0
    },
    tooltips: {
      callbacks: {
        label: function (context, data) {
          let label = ""
          if (data["labels"]) {
            if (context.index) {
              //label = data["labels"][context.index];
              label = label + data["labels"][context.index];
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
  get data(): any[] {
    return this._data;
  }
  private _data: any[] = [];
  label: string[] = []
  @Input() set data(value: any[]) {
    this.original = value
    this.assignData(value);
  }

  private assignData(value: any[], selectedProteins: string[] = []) {
    const a: any[] = []
    const b: string[] = []
    this.pointRadius = []
    if (selectedProteins.length === 0) {
      this.lrrk2 = []
    }

    for (let i = 0; i < value.length; i++) {
      if (value[i]["Gene names"] && value[i]["Copy number"] && value[i]["Rank"]) {
        const l = Math.log10(value[i]["Copy number"])
        if (l > this.max_y) {
          this.max_y = l;
        }
        if (value[i]["Rank"] > this.max_x) {
          this.max_x = value[i]["Rank"]
        }
        a.push(
          //name: value[i]["Gene names"],
          {x: value[i]["Rank"], y: l, name: value[i]["Gene names"]})
        b.push(value[i]["Gene names"])
        if (selectedProteins.length === 0) {
          if (value[i]["LRRK2 pathway"] !== "Selected") {
            this.colors.push('rgb(255, 99, 132, 0.2)')
            this.pointRadius.push(1)
          } else {
            this.colors.push('rgb(135,194,164, 1)')
            this.pointRadius.push(5)
            this.lrrk2.push(value[i]["Gene names"])
          }
        } else {
          if (selectedProteins.includes(value[i]["Gene names"])) {
            this.colors.push('rgb(135,194,164, 1)')
            this.pointRadius.push(5)
          } else {
            this.colors.push('rgb(255, 99, 132, 0.2)')
            this.pointRadius.push(1)
          }
        }

      }
    }
    this._data = a;
    this.label = b;
    this.generateDataSet();
    this.chart?.chart.update();
  }

  private generateDataSet() {
    this.scatterChartData = [
      {
        data: this.data,
        label: "Data",
        pointRadius: this.pointRadius,
        fill: false,
        pointBackgroundColor: this.colors,
        pointBorderColor: this.colors,
        borderWidth: 0,
        borderColor: "transparent"
      }
    ]
  }

  scatterChartData: ChartDataSets[] = []
  scatterPlotType: ChartType = "scatter";

  width = 750
  height = 750
  min_x = 0
  min_y = 0

  ngOnInit(): void {

  }

  selectProtein(event: MouseEvent, protein: string) {

    const target = event.target as Element;
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
    this.assignData(this.original, this.selectedProtein)
  }

  resetSelection() {
    this.selectedProtein = []
    for (const e of this.selectedElement) {
      e.classList.remove("badge-danger")
      e.classList.add("badge-success")
    }
    this.selectedElement = []
    this.assignData(this.original)
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
        this.assignData(this.original, [this.model])
      }
    }
  }

  ngAfterViewInit() {
  }
}
