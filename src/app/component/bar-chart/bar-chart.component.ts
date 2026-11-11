import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DataFrame, IDataFrame } from "data-forge";
import { Observable, OperatorFunction, debounceTime, distinctUntilChanged, map } from "rxjs";
import { FormsModule } from '@angular/forms';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap/typeahead';
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownButtonItem, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { PlotlyService, PlotlyComponent } from "angular-plotly.js";
import { GraphData } from "../../class/graph-data";
import { WebService } from "../../service/web.service";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css'],
  imports: [NgbTypeahead, FormsModule, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownButtonItem, NgbDropdownItem, PlotlyComponent]
})
export class BarChartComponent {
  private plotly = inject(PlotlyService);
  private http = inject(WebService);
  private origin: IDataFrame = new DataFrame();
  private geneList: string[] = [];
  readonly gData = input<GraphData>(new GraphData());
  readonly updateSelection = output<string[]>();
  readonly model = signal("");
  readonly selectedProteins = signal<string[]>([]);
  readonly graphData = signal<any[]>([]);
  readonly graphLayout = {autosize:true, title: '<br>Copy number distribution</br>', margin: {l: 100, r:100, b:100, t:100},
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
  };
  currentDf: IDataFrame = new DataFrame();

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.geneList.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10))
    )

  constructor() {
    effect(() => {
      const value = this.gData();
      untracked(() => {
        this.selectedProteins.set(value.selectedProteins);
        this.updateData(value.data);
      });
    });
  }

  private arraysCompare(a: any[], b: any[]): boolean {
    if (a.length != b.length) {
      return false
    }
    a.sort()
    b.sort()
    return JSON.stringify(a) === JSON.stringify(b)
  }

  private updateData(value: IDataFrame) {
    if (this.origin.count() !== value.count()) {
      this.origin = value
      const gl = this.origin.getSeries("Gene names").distinct().bake().toArray()
      if (!this.arraysCompare(gl, this.geneList)) {
        this.geneList = gl
        this.graphData.set([])
        this.assignData(this.selectedProteins())
      }
    }
  }

  async downloadPlotlyExtra(format: string) {
    const graph = this.plotly.getInstanceByDivId('barchart');
    const p = await this.plotly.getPlotly();
    await p.downloadImage(graph, {format: format, filename: "image"})
  }

  private assignData(selected: string[] = ["LRRK2"]) {
    this.http.selected.set(selected)
    this.selectedProteins.set(selected)
    const filtered: any[] = []
    const result: any = {}
    for (const g of this.origin.groupBy(row => row.label)) {
      const gFirst = g.first()
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
    this.graphData.set(Object.values(result))

    this.currentDf = new DataFrame(filtered)

    return this.currentDf;
  }

  searchSelectedProtein() {
    const query = this.model().trim().toUpperCase()
    const gene = query.length > 2 ? this.geneList.find(g => g.toUpperCase() === query) : undefined
    if (gene) {
      const selected = this.selectedProteins()
      const next = selected.includes(gene) ? selected : [...selected, gene]
      this.assignData(next)
      this.updateSelection.emit(next)
    }
  }

  removeSelected(p: string) {
    const selected = this.selectedProteins()
    if (selected.includes(p)) {
      const next = selected.filter(s => s !== p)
      this.assignData(next)
      this.updateSelection.emit(next)
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
