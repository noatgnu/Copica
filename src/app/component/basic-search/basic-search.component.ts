import { Component, effect, inject, signal, untracked } from '@angular/core';
import { DataFrame, fromCSV } from "data-forge";
import { Observable, OperatorFunction, debounceTime, distinctUntilChanged, firstValueFrom, map } from "rxjs";
import { FormsModule } from '@angular/forms';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap/typeahead';
import { PlotlyComponent } from 'angular-plotly.js';
import { WebService } from "../../service/web.service";
import { SettingsService } from "../../service/settings.service";

@Component({
  selector: 'app-basic-search',
  templateUrl: './basic-search.component.html',
  styleUrls: ['./basic-search.component.css'],
  imports: [NgbTypeahead, FormsModule, PlotlyComponent]
})
export class BasicSearchComponent {
  private web = inject(WebService);
  private settings = inject(SettingsService);
  private genes: string[] = [];
  private uniqueY: string[] = [];
  readonly loading = signal("loading...");
  readonly loaded = signal(false);
  readonly tableFilterModel = signal("");
  readonly results = signal<any[]>([]);
  readonly graphData = signal<any[]>([]);
  readonly graphLayout = signal<any>({
    title: {
      font: {
        family: "Arial Black",
        size: 24,
      }
    },
    margin: {l:300, r:50, t:50, b:50},
    height: 200,
    responsive: true,
    xaxis: {
      "title": "<b>Copy number</b>",
      "side": "top"
    },
    yaxis: {
      "title" : "<b>Samples</b>",
      "type" : "category",
      "tickmode": "array",
      "tickfont": {
        "size": 17,
        "color": 'black'
      },
      "side": "left"
    }
  });

  constructor() {
    effect(() => {
      if (this.settings.datasetSettingsVersion() > 0) {
        untracked(() => this.reloadGenes());
      }
    });
  }

  private reloadGenes() {
    this.loaded.set(false);
    this.loading.set("loading...");
    this.getData(this.settings.getDatasetSettings()).then(() => {
      this.loaded.set(true);
      this.loading.set("Gene name search");
    });
  }

  searchFilter(term: string) {
    return this.genes.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
  }

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.searchFilter(term))
    )

  async getData(s: any) {
    for (const d in s) {
      if (s[d]) {
        const res = await firstValueFrom(this.web.getDBtext(d))
        if (res.body) {
          const df = fromCSV(<string>res.body)
          if (this.genes.length === 0) {
            this.genes = df.getSeries("Gene names").distinct().bake().toArray()
          } else {
            for (const g of df.getSeries("Gene names").distinct().bake()) {
              if (!this.genes.includes(g)) {
                this.genes.push(g)
              }
            }
          }
        }
      }
    }
  }

  searchHandler() {
    this.searchGene().then()
  }

  async searchGene() {
    const query = this.tableFilterModel()
    const chosen = query.split(";")
    const results: any[] = []
    const s = this.settings.getDatasetSettings()
    const temp: any = {}
    for (const d in s) {
      if (s[d]) {
        const res = await firstValueFrom(this.web.getDBtext(d))
        if (res.body) {
          const df = fromCSV(<string>res.body)
          for (const r of df) {
            const intersect = r["Gene names"].split(";").filter((value: string) => chosen.includes(value))
            if (intersect.length > 0) {
              if (!temp[query]) {
                temp[query] = {
                  type: "bar",
                  x: [],
                  y: [],
                  orientation: 'h',
                  showlegend: true,
                  name: query
                }
              }
              results.push(r)
              temp[query].x.push(parseFloat(r["Copy number"]))
              temp[query].y.push(r["label"]+"_"+r["Fraction"])
              if (!this.uniqueY.includes(r["label"]+"_"+r["Fraction"])) {
                this.uniqueY.push(r["label"]+"_"+r["Fraction"])
              }

            }
          }
        }
      }
    }
    this.results.update(r => [...r, ...results])
    this.graphData.update(g => [...g, ...Object.values(temp)])
    this.graphLayout.update(l => ({...l, height: 200 + 50 * this.uniqueY.length}))
  }

  clear() {
    this.results.set([])
    this.uniqueY = []
    this.graphData.set([])
  }

  download() {
    const blob = new Blob([new DataFrame(this.results()).toCSV()], {type: 'text/csv'})
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
