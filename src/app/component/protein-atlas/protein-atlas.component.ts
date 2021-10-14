import { Component, OnInit } from '@angular/core';
import {WebService} from "../../service/web.service";
import {DataFrame, fromCSV, IDataFrame} from "data-forge";
import {forkJoin, Observable, Subscription} from "rxjs";

@Component({
  selector: 'app-protein-atlas',
  templateUrl: './protein-atlas.component.html',
  styleUrls: ['./protein-atlas.component.css']
})
export class ProteinAtlasComponent implements OnInit {
  graphData: any = []
  graphLayout: any = {autosize:true, title: '<br>Copy number distribution</br>', margin: {l: 100, r:100, b:100, t:100},
    xaxis: {
      title: "<b>Cell type</b>",
      type: "category",
      tickfont: {
        size: "12"
      }
    },
    yaxis: {
      title: "<b>NX</b>"
    }
  }

  proteinAtlastColumnsMap: IDataFrame = new DataFrame()
  columnsMap: any = {}
  columnsOption: string[] = []
  selectedOption = ""
  observe: Observable<boolean>|undefined;
  constructor(private http: WebService) {
    this.http.getProteinAtlasColumnsMap().subscribe(data => {
      if (data) {
        console.log(data.body)
        this.columnsOption = []
        this.proteinAtlastColumnsMap = fromCSV(<string>data.body)
        for (const c of this.proteinAtlastColumnsMap) {
          if (c["Column name"].indexOf("RNA") >= 0 &&  c["Column name"].indexOf(" - ") >= 0) {
            const p = c["Column name"].split(" - ")
            if (!(p[0].replace(" RNA", "") in this.columnsMap)) {
              this.columnsMap[p[0].replace(" RNA", "")] = []
              this.columnsOption.push(p[0].replace(" RNA", ""))
            }
            this.columnsMap[p[0].replace(" RNA", "")].push(c["Columns parameter value"])
            this.selectedOption = "Brain"

          }
        }
        this.observe = this.http.updateSelected.asObservable();
        this.observe.subscribe(d => {
          if (d) {
            this.getColumns()
          }
        })
      }
    })
  }

  ngOnInit(): void {
  }

  getColumns() {
    const obs = []
    const data: any = {}
    for (const s of this.http.selected) {
      obs.push(this.http.getProteinAtlas([s], this.columnsMap[this.selectedOption]))
    }
    this.graphData = []
    forkJoin(obs).subscribe(d => {
      for (const h of d) {
        if (h.body) {
          for (const r of Object.values(h.body)) {
            if (this.http.selected.includes(r["Gene"])) {
              data[r["Gene"]] = {
                x: [],
                y: [],
                type: 'bar',
                name: r["Gene"]
              }
              console.log(r)
              for (const k in r) {
                const d = k.replace(" [NX]", "").split(" - ")

                if (k.indexOf("[NX]") >= 0) {
                  data[r["Gene"]].y.push(parseFloat(r[k]))
                  data[r["Gene"]].x.push(d[1])
                }
              }
            }
          }
        }
      }
      for (const d in data) {
        this.graphData.push(data[d])
      }

      console.log(this.graphData)
    })

  }
}
