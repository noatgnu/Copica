import { Component, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { Location } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { ChartConfiguration, ChartDataset } from "chart.js";
import { BaseChartDirective } from "ng2-charts";
import { Observable, OperatorFunction, debounceTime, distinctUntilChanged, map } from "rxjs";
import { DataFrame, IDataFrame } from "data-forge";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap/typeahead';
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownButtonItem, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { DatatableComponent, DatatableGroupHeaderDirective, DatatableGroupHeaderTemplateDirective, DataTableColumnDirective, DataTableColumnCellDirective } from '@swimlane/ngx-datatable';
import { WebService } from "../../service/web.service";

@Component({
  selector: 'app-scatter-plot',
  templateUrl: './scatter-plot.component.html',
  styleUrls: ['./scatter-plot.component.css'],
  imports: [NgbTypeahead, FormsModule, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownButtonItem, NgbDropdownItem, BaseChartDirective, DatatableComponent, DatatableGroupHeaderDirective, DatatableGroupHeaderTemplateDirective, DataTableColumnDirective, DataTableColumnCellDirective]
})
export class ScatterPlotComponent {
  private modalService = inject(NgbModal);
  private http = inject(WebService);
  private location = inject(Location);
  private original: IDataFrame = new DataFrame();
  private selection: Record<string, string[]> = {};
  private sampleColors: Record<string, string> = {};
  private annotation: Record<string, string[]> = {};
  private tempRows: any[] = [];
  private changed: boolean | undefined = undefined;

  readonly data = input<IDataFrame>(new DataFrame());
  readonly heatmap = output<IDataFrame>();
  readonly table = viewChild<DatatableComponent>('myTable');

  readonly searchType = signal("Gene names");
  readonly closeResult = signal("");
  readonly model = signal("");
  readonly tableFilterModel = signal("");
  readonly label = signal<string[]>([]);
  readonly cellTypes = signal<string[]>([]);
  readonly selectedProtein = signal<Record<string, string[]>>({});
  readonly scatterChartData = signal<ChartDataset<"scatter">[]>([]);
  readonly filtered = signal<IDataFrame>(new DataFrame());
  readonly heatmapData = signal<IDataFrame>(new DataFrame());
  readonly rows = signal<any[]>([]);
  readonly selectedFiles = signal("");
  readonly shareUrl = signal("");
  readonly scatterPlotType = "scatter" as const;
  readonly columns = [
    {prop: "Gene names"}, {name: "Accession", prop: "Accession IDs"}, {name: "Copy #", prop: "Copy number"}, {name: "Rank", prop: "Rank"}, {name: "Type", prop: "Cell type"}, {name: "Replicate", prop: "Fraction"}, {name: "Condition", prop: "Condition"}
  ];
  readonly options: ChartConfiguration<"scatter">["options"] = {
    plugins: {
      legend: {
        labels: {
          font: {weight: "bold", size: 14}
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const labels = context.chart.data.labels
            if (labels && typeof context.parsed.y === "number") {
              return labels[context.dataIndex] + "[" + (10 ** context.parsed.y).toFixed(2) + "]"
            }
            return ""
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "log10 Copy Number",
          font: {weight: "bold", size: 20}
        },
        ticks: {
          font: {weight: "bold", size: 14}
        }
      },
      x: {
        title: {
          display: true,
          text: "Rank",
          font: {weight: "bold", size: 20}
        },
        ticks: {
          font: {weight: "bold", size: 14}
        }
      }
    },
    responsive: true,
    animation: {
      duration: 0
    }
  };

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.label().filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )

  constructor() {
    if (this.http.scatterData.length > 0) {
      this.closeResult.set(this.http.scatterData.join("\n"));
    }
    for (const f in this.http.filters) {
      this.sampleColors[f] = this.getRandomColor();
    }
    effect(() => {
      const value = this.data();
      untracked(() => this.loadData(value));
    });
  }

  private currentPath() {
    return this.location.path(true).replace("/copybrowse/", "").replace("/ruler", "");
  }

  private loadData(value: IDataFrame) {
    if (value.count() > 0) {
      this.original = value
      this.label.set(this.original.getSeries("Gene names").distinct().bake().toArray())
      if (this.changed === undefined) {
        this.changed = true
      } else {
        this.changed = this.selectedFiles() !== this.currentPath()
      }
      if (this.changed) {
        this.selectedFiles.set(this.currentPath())
        if (this.closeResult() !== "") {
          this.batchSelection()
        } else {
          this.assignData()
        }
      }
    }
  }

  openModal(modal: any) {
    this.modalService.open(modal, {ariaLabelledBy: "batch-selection", size: "xl"});
  }

  batchSelection(modal?: any) {
    if (modal) {
      modal.close()
    }

    const data = []
    for (const r of this.closeResult().toUpperCase().split("\n")) {
      const e = r.trim().split(";")
      let selected = false
      for (let f of e) {
        f = f.trim()
        if (f !== "") {
          if (this.searchType() === "Gene names") {
            for (const b of this.label()) {
              for (const d of b.split(";")) {
                if (f === d) {
                  selected = true
                  data.push(b)
                  break
                }
              }
            }
          }
          if (selected) {
            break
          }
        }
      }
    }
    if (this.cellTypes().length > 0) {
      for (const c of this.cellTypes()) {
        const l = this.original.where(row => row["label"] === c).bake().getSeries("Gene names").bake().toArray()
        for (const d of data) {
          if (!(this.selection[c].includes(d)) && l.includes(d)) {
            this.selection[c].push(d)
          }
        }
      }
    } else {
      for (const a of this.original.groupBy(row => row["label"]).bake()) {
        const g = a.first()
        const l = a.getSeries("Gene names").bake().toArray()
        for (const d of data) {
          if (l.includes(d)) {
            if (!(g["label"] in this.selection)) {
              this.selection[g["label"]] = []
            }
            this.selection[g["label"]].push(d)
          }
        }
      }
    }
    this.assignData(this.selection, "")
  }

  updateFilter() {
    const val = this.tableFilterModel().toLowerCase()
    if (val.length !== 0) {
      this.rows.update(rows => rows.filter(d => d["Gene names"].toLowerCase().indexOf(val) !== -1))
    } else {
      this.rows.set([...this.tempRows])
    }
    const table = this.table()
    if (table) {
      table.offset.set(0)
    }
  }

  toggleExpandGroup(group: any) {
    this.table()?.groupHeader?.toggleExpandGroup(group);
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  highlight(pathway: string) {
    this.assignData([], pathway)
  }

  private assignData(selectedProteins: any = {}, pathway: string = "Lrrk2") {
    this.closeResult.set("")
    if (Object.keys(selectedProteins).length > 0) {
      this.selection = selectedProteins
    }
    const heatmapData: any = {}
    const temp: any = {}
    const filtered: any[] = []
    const scatterChartData: ChartDataset<"scatter">[] = []
    const cellTypes: string[] = []
    for (const t of this.original.getSeries("label").distinct().bake().toArray()) {
      if (t !== "" && !cellTypes.includes(t)) {
        cellTypes.push(t)
      }
    }
    for (const c of cellTypes) {
      if (!(c in this.sampleColors)) {
        this.sampleColors[c] = this.getRandomColor()
      }
      if (!(c in this.selection)) {
        this.selection[c] = []
      }
    }
    for (const g of this.original.groupBy(row => row.label)) {
      for (const re of g.groupBy(row => row["Gene names"])) {
        for (const rem of re.groupBy(row => row["Accession IDs"])) {
          const r = rem.first()
          if (r["Rank"] !== "" && r["Rank"] !== 0) {
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
              const xArray = rem.getSeries("Rank").bake().toArray()
              const yArray = rem.getSeries("Copy number").bake().toArray()
              let rank = 0
              let copyNumber = 0
              for (let i = 0; i < xArray.length; i++) {
                rank = rank + (typeof xArray[i] === "string" ? parseFloat(xArray[i]) : xArray[i])
                copyNumber = copyNumber + (typeof yArray[i] === "string" ? parseFloat(yArray[i]) : yArray[i])
              }
              x = rank / xArray.length
              y = copyNumber / yArray.length
              r["Rank"] = x
              r["Copy number"] = y
            }
            if (x !== 0 && y !== 0) {
              temp[tempLabel][r["Gene names"]].y = Math.log10(y)
              temp[tempLabel][r["Gene names"]].x = x
              if (tempLabel in selectedProteins && selectedProteins[tempLabel].includes(r["Gene names"])) {
                filtered.push(r)
              }

              for (const v of b) {
                for (const f in this.http.filters) {
                  if (!(f in this.annotation)) {
                    this.annotation[f] = []
                  }
                  if (this.http.filters[f].includes(v) && !(this.annotation[f].includes(r["Gene names"]))) {
                    this.annotation[f].push(r["Gene names"])
                  }
                }
              }
              if (Object.keys(selectedProteins).length === 0 && pathway in this.annotation && this.annotation[pathway].includes(r["Gene names"])) {
                filtered.push(r)
              }
            }
          }
        }
      }
    }
    for (const c of cellTypes) {
      const a: ChartDataset<"scatter"> = {
        backgroundColor: this.sampleColors[c],
        data: [],
        label: c,
        pointRadius: [],
        borderWidth: 0,
        borderColor: "transparent"
      }
      const color: string[] = []
      const radius: number[] = []
      for (const t of this.label()) {
        if (temp[c][t] !== undefined) {
          a.data.push(temp[c][t])

          if (Object.keys(selectedProteins).length > 0) {
            if (selectedProteins[c].includes(t)) {
              if (!(t in this.sampleColors)) {
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
            if (!this.selection[c].includes(t)) {
              this.selection[c].push(t)
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
      scatterChartData.push(a)
    }
    const filteredDF = new DataFrame(filtered)
    const rows = filteredDF.toArray()
    this.tempRows = filteredDF.toArray()
    for (const row of rows) {
      if (typeof row["Copy number"] === "number") {
        row["Copy number"] = row["Copy number"].toFixed(2)
      }
      const tempName = row["Accession IDs"] + "(" + row["Gene names"] + ")"
      if (!(tempName in heatmapData)) {
        heatmapData[tempName] = {"ID": tempName}
      }
      const sampleName = row["label"] + "_" + row["Fraction"]
      if (!(sampleName in heatmapData[tempName])) {
        heatmapData[tempName][sampleName] = row["Copy number"]
      }
    }
    const heatmapDF = Object.values(heatmapData)
    if (heatmapDF.length > 0) {
      this.heatmapData.set(new DataFrame(heatmapDF))
    }
    this.filtered.set(filteredDF)
    this.rows.set(rows)
    this.cellTypes.set(cellTypes)
    this.scatterChartData.set(scatterChartData)
    this.publishSelection()
  }

  private publishSelection() {
    this.selectedProtein.set(Object.fromEntries(Object.entries(this.selection).map(([k, v]) => [k, [...v]])))
  }

  removeProtein(protein: string, cellType: string) {
    const selected = this.selection[cellType]
    if (selected.includes(protein)) {
      selected.splice(selected.indexOf(protein), 1)
    }
    this.assignData(this.selection)
  }

  resetSelection() {
    this.selection = {}
    this.assignData({}, "")
  }

  searchSelectedProtein() {
    const query = this.model().trim().toUpperCase()
    const gene = query.length > 2 ? this.label().find(g => g.toUpperCase() === query) : undefined
    if (gene) {
      for (const c of this.cellTypes()) {
        if (!(this.selection[c].includes(gene))) {
          this.selection[c].push(gene)
        }
      }
    }
    this.assignData(this.selection, "")
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

  getUrl() {
    const data: string[] = []
    for (const s in this.selection) {
      for (const p of this.selection[s]) {
        if (!(data.includes(p))) {
          data.push(p)
        }
      }
    }
    this.shareUrl.set(window.location.origin + "/#/copybrowse/" + this.http.scatterFiles.join(",") + "/" + data.join(","))
  }
}
