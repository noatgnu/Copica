import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder, FormGroup} from "@angular/forms";
import {WebService} from "../../service/web.service";
import {HistoneDb} from "../../class/histone-db";
import {BehaviorSubject, Observable} from "rxjs";
import {Query} from "../../class/query";

@Component({
  selector: 'app-db-scatter',
  templateUrl: './db-scatter.component.html',
  styleUrls: ['./db-scatter.component.css']
})
export class DbScatterComponent implements OnInit {
  histoneDB: HistoneDb = new HistoneDb(this.http)
  data: IDataFrame = new DataFrame<number, any>();
  finishedLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  observeLoad: Observable<boolean> = new Observable<boolean>();
  loadScatterSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  observeScatter: Observable<boolean> = new Observable<boolean>()
  scatterDF: IDataFrame = new DataFrame();
  scatterData: IDataFrame = new DataFrame();

  constructor(private http: WebService) {
    this.histoneDB.getHistones()
    this.observeLoad = this.finishedLoaded.asObservable()
    this.observeScatter = this.loadScatterSubject.asObservable()
  }

  dataframeHandle(e: IDataFrame) {
    this.data = e;
    if (this.data.count() > 0) {
      this.finishedLoaded.next(true)
    }
  }

  selectedDataHandler(e: Query) {

  }

  scatterDataHandler(e: IDataFrame) {
    this.scatterData = e;
    this.scatterDF = e;
    this.loadScatterSubject.next(true);
  }

  downloadSelectedData() {
    const blob = new Blob([this.scatterDF.toCSV()], {type: 'text/csv'})
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

  ngOnInit() {
  }
}
