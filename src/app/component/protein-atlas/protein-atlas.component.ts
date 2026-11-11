import { Component, effect, inject, signal, untracked } from '@angular/core';
import { fromCSV } from "data-forge";
import { forkJoin } from "rxjs";
import { FormsModule } from '@angular/forms';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap/popover';
import { PlotlyComponent } from 'angular-plotly.js';
import { WebService } from "../../service/web.service";

interface ShareLink {
  ensembl: string;
  gene: string;
  description: string;
}

@Component({
  selector: 'app-protein-atlas',
  templateUrl: './protein-atlas.component.html',
  styleUrls: ['./protein-atlas.component.css'],
  imports: [FormsModule, NgbPopover, PlotlyComponent]
})
export class ProteinAtlasComponent {
  private web = inject(WebService);
  private columnsMap: Record<string, string[]> = {};
  private readonly columnsLoaded = signal(false);
  readonly columnsOption = signal<string[]>([]);
  readonly selectedOption = signal("");
  readonly sharelinks = signal<ShareLink[]>([]);
  readonly graphData = signal<any[]>([]);
  readonly graphLayout = signal<any>(this.createLayout([], '<br>RNA-seq data distribution</br>'));

  constructor() {
    this.web.getProteinAtlasColumnsMap().subscribe(data => {
      if (data) {
        const options: string[] = [];
        for (const c of fromCSV(<string>data.body)) {
          if (c["Column name"].indexOf("RNA") >= 0 && c["Column name"].indexOf(" - ") >= 0) {
            const tissue = c["Column name"].split(" - ")[0].replace(" RNA", "");
            if (!(tissue in this.columnsMap)) {
              this.columnsMap[tissue] = [];
              options.push(tissue);
            }
            this.columnsMap[tissue].push(c["Columns parameter value"]);
            this.selectedOption.set("Brain");
          }
        }
        this.columnsOption.set(options);
        this.columnsLoaded.set(true);
      }
    });

    effect(() => {
      const selected = this.web.selected();
      if (this.columnsLoaded()) {
        untracked(() => this.fetchColumns(selected));
      }
    });
  }

  private createLayout(ticktext: string[], title: string) {
    return {
      autosize: true,
      title: title,
      margin: {l: 100, r: 100, b: 100, t: 100},
      xaxis: {
        title: "<b>Cell type</b>",
        tickmode: "array",
        ticktext: ticktext,
        tickfont: {size: "12"}
      },
      yaxis: {
        title: "<b>NX</b>"
      }
    };
  }

  getColumns() {
    this.fetchColumns(this.web.selected());
  }

  private fetchColumns(selected: string[]) {
    const option = this.selectedOption();
    const requests = selected.map(s => this.web.getProteinAtlas([s], this.columnsMap[option]));
    this.sharelinks.set([]);
    this.graphData.set([]);
    forkJoin(requests).subscribe(responses => {
      const data: Record<string, any> = {};
      const ticktext: string[] = [];
      const sharelinks: ShareLink[] = [];
      for (const h of responses) {
        if (h.body) {
          for (const r of Object.values(h.body) as any[]) {
            if (selected.includes(r["Gene"])) {
              data[r["Gene"]] = {x: [], y: [], type: 'bar', name: r["Gene"]};
              sharelinks.push({ensembl: r["Ensembl"], gene: r["Gene"], description: r["Gene description"]});
              for (const k in r) {
                const d = k.replace(" [nTPM]", "").split(" - ");
                if (k.indexOf("[nTPM]") >= 0) {
                  data[r["Gene"]].y.push(parseFloat(r[k]));
                  data[r["Gene"]].x.push(d[1]);
                }
                if (!ticktext.includes(d[1])) {
                  ticktext.push(d[1]);
                }
              }
            }
          }
        }
      }
      this.sharelinks.set(sharelinks);
      this.graphData.set(Object.values(data));
      this.graphLayout.set(this.createLayout(ticktext, "<b>" + option + " RNA-seq data distribution</b>"));
    });
  }
}
