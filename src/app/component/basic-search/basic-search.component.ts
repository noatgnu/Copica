import { Component, OnInit } from '@angular/core';
import {WebService} from "../../service/web.service";
import {SettingsService} from "../../service/settings.service";
import {fromCSV} from "data-forge";
import {Observable, OperatorFunction} from "rxjs";
import {debounceTime, distinctUntilChanged, map} from "rxjs/operators";

@Component({
  selector: 'app-basic-search',
  templateUrl: './basic-search.component.html',
  styleUrls: ['./basic-search.component.css']
})
export class BasicSearchComponent implements OnInit {
  loading: string = "loading..."
  loaded: boolean = false
  tableFilterModel: string = ""
  genes: string[] = []
  results: any[] = []
  graphData: any[] = []
  graphLayout: any = {
    title: {
      font: {
        family: "Arial Black",
        size: 24,
      }
    },
    margin: {l:300, r:10, t:50, b:50},
    height: 200,
    responsive: true,
    xaxis: {
      "title": "<b>Copy number</b>"
    },
    yaxis: {
      "title" : "<b>Samples</b>",
      "type" : "category",
      "tickmode": "array",
      //"tickvals": [],
      "tickfont": {
        "size": 17,
        "color": 'black'
      }
    }
  }
  constructor(private web: WebService, private settings: SettingsService) {
    this.settings.databaseEnableSettings.asObservable().subscribe(data => {
      if (data) {
        this.loaded = false
        this.loading = "loading..."
        const s = settings.getDatasetSettings()
        this.getData(s).then(r => {
          this.loaded = true
          this.loading = "Gene name search"
        })
      }
    })
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

  ngOnInit(): void {
  }

  async getData(s: any) {
    for (const d in s) {
      if (s[d]) {
        const res = await this.web.getDBtext(d).toPromise()
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
    this.results = []
    this.searchGene().then()
  }

  async searchGene() {
    const chosen = this.tableFilterModel.split(";")
    const s = this.settings.getDatasetSettings()
    const temp: any = {}
    const texts: string[] = []
    const vals: string[] = []
    let height: number = 200
    for (const d in s) {
      if (s[d]) {
        const res = await this.web.getDBtext(d).toPromise()
        if (res.body) {
          const df = fromCSV(<string>res.body)
          for (const r of df) {
            const intersect = r["Gene names"].split(";").filter((value: string) => chosen.includes(value))
            if (intersect.length > 0) {
              if (!temp[r["Cell type"]]) {
                temp[r["Cell type"]] = {
                  type: "bar",
                  x: [],
                  y: [],
                  orientation: 'h',
                  showlegend: false
                }
              }
              this.results.push(r)
              temp[r["Cell type"]].x.push(parseFloat(r["Copy number"]))
              temp[r["Cell type"]].y.push(r["label"]+"_"+r["Fraction"])
              height = height + 25
            }
          }
        }
      }
    }
    const graph: any[] = []
    for (const t in temp) {
      graph.push(temp[t])
    }
    this.graphData = graph
    this.graphLayout.title = "<b>Copy number data for " + this.tableFilterModel + " </b>",
    this.graphLayout.height = height
    console.log(this.results)
  }
}
