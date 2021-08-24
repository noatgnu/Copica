import { Component, OnInit } from '@angular/core';
import {Query} from "../../class/query";
import {DataFrame, IDataFrame} from "data-forge";
import {BehaviorSubject, Observable} from "rxjs";
import {WebService} from "../../service/web.service";
import {HistoneDb} from "../../class/histone-db";
import {ProteomicRuler} from "../../class/proteomic-ruler";
import {UserDataService} from "../../service/user-data.service";

@Component({
  selector: 'app-proteomic-ruler',
  templateUrl: './proteomic-ruler.component.html',
  styleUrls: ['./proteomic-ruler.component.css']
})
export class ProteomicRulerComponent implements OnInit {
  finishedLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  observeLoad: Observable<boolean> = new Observable<boolean>();
  finishedProcessing: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  observeProcess: Observable<boolean> = new Observable<boolean>();
  data: IDataFrame = new DataFrame<number, any>();
  histoneDB: HistoneDb = new HistoneDb(this.http)
  ruler?: ProteomicRuler
  constructor(private http: WebService, private userData: UserDataService) {
    //this.histoneDB.getHistones()
    this.observeLoad = this.finishedLoaded.asObservable()
    this.observeProcess = this.finishedProcessing.asObservable()
  }

  ngOnInit(): void {
    this.histoneDB.getHistones()
  }

  selectedDataHandler(e: Query) {
    this.ruler = new ProteomicRuler(this.histoneDB, this.data, e.IntensityCols, e.IdentifierCol, e.MolecularMassCol)
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
            "Cell type": "UserCellType"+i, "Experiment type": "Experiment"+i, "Fraction": i, "Condition": "Standard", "label": "UserCellType"+i+"Standard"
          })
        }
      }
    }
    this.userData.updateData(new DataFrame(data))
    this.finishedProcessing.next(true)
  }

  dataframeHandle(e: IDataFrame) {
    this.finishedLoaded.next(false)
    this.finishedProcessing.next(false)
    this.data = e;
    if (this.data.count() > 0) {
      this.finishedLoaded.next(true)
    }
  }

  downloadProcessedData() {
    if (this.ruler) {
      const blob = new Blob([this.ruler.df.toCSV()], {type: 'text/csv'})
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
}
