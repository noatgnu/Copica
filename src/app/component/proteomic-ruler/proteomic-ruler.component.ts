import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DataFrame, IDataFrame } from "data-forge";
import { Query } from "../../class/query";
import { WebService } from "../../service/web.service";
import { HistoneDb } from "../../class/histone-db";
import { ProteomicRuler } from "../../class/proteomic-ruler";
import { UserDataService } from "../../service/user-data.service";
import { FileUploaderComponent } from '../file-uploader/file-uploader.component';
import { FileSummaryComponent } from '../file-summary/file-summary.component';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';

@Component({
  selector: 'app-proteomic-ruler',
  templateUrl: './proteomic-ruler.component.html',
  styleUrls: ['./proteomic-ruler.component.css'],
  imports: [FileUploaderComponent, FileSummaryComponent, ScatterPlotComponent]
})
export class ProteomicRulerComponent implements OnInit {
  private userData = inject(UserDataService);
  private histoneDB = new HistoneDb(inject(WebService));
  private ruler?: ProteomicRuler;
  readonly data = signal<IDataFrame>(new DataFrame<number, any>());
  readonly loaded = computed(() => this.data().count() > 0);
  readonly scatterData = signal<IDataFrame | undefined>(undefined);

  ngOnInit(): void {
    this.histoneDB.getHistones();
  }

  selectedDataHandler(e: Query) {
    this.ruler = new ProteomicRuler(this.histoneDB, e.df, e.IntensityCols, e.IdentifierCol, e.MolecularMassCol, e.Ploidy)
    const data: any[] = []
    const columns = this.ruler.intensityCols
    for (const r of this.ruler.df) {
      if (r[e.IdentifierCol] !== "") {
        for (let i = 0; i < columns.length; i++) {
          data.push({
            "Gene names": r[e.GeneNameCol],
            "Accession IDs": r[e.IdentifierCol].toUpperCase(),
            "Copy number": r[columns[i]+"_copyNumber"],
            "Rank": r[columns[i]+"_copyNumber_rank"],
            "Cell type": "UserCellType_"+columns[i], "Experiment type": "Experiment"+i, "Fraction": i, "Condition": "Standard", "label": "UserCellType_"+columns[i]+"_Standard"
          })
        }
      }
    }
    const scatterData = new DataFrame(data);
    this.userData.updateData(scatterData);
    this.scatterData.set(scatterData);
  }

  dataframeHandle(e: IDataFrame) {
    this.scatterData.set(undefined);
    this.data.set(e);
  }

  downloadProcessedData() {
    if (this.ruler) {
      const blob = new Blob([this.ruler.df.toCSV()], {type: 'text/csv'})
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
}
