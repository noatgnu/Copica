import { Component, OnInit } from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {HistoneDb} from "./class/histone-db";
import {WebService} from "./service/web.service";
import {BehaviorSubject, Observable} from "rxjs";
import {Query} from "./class/query";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Copica';
  histoneDB: HistoneDb = new HistoneDb(this.http)
  data: IDataFrame = new DataFrame<number, any>();
  finishedLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  observeLoad: Observable<boolean> = new Observable<boolean>();
  loadScatterSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  observeScatter: Observable<boolean> = new Observable<boolean>()

  scatterData: any[] = [];

  constructor(private http: WebService) {
    this.histoneDB.getHistones()
    this.observeLoad = this.finishedLoaded.asObservable()
    this.observeScatter = this.loadScatterSubject.asObservable()
    const a = new DataFrame([{A:1, B:2}, {A:3, B:4}])
    console.log(a.dropSeries("A"))
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
    this.scatterData = e.toArray();
    this.loadScatterSubject.next(true);
  }
}
