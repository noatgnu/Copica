import { Component, OnInit } from '@angular/core';
import {Query} from "../../class/query";
import {DataFrame, IDataFrame} from "data-forge";
import {BehaviorSubject, Observable} from "rxjs";

@Component({
  selector: 'app-proteomic-ruler',
  templateUrl: './proteomic-ruler.component.html',
  styleUrls: ['./proteomic-ruler.component.css']
})
export class ProteomicRulerComponent implements OnInit {
  finishedLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  observeLoad: Observable<boolean> = new Observable<boolean>();
  data: IDataFrame = new DataFrame<number, any>();
  constructor() {
    this.observeLoad = this.finishedLoaded.asObservable()
  }

  ngOnInit(): void {

  }

  selectedDataHandler(e: Query) {

  }
  dataframeHandle(e: IDataFrame) {
    this.data = e;
    if (this.data.count() > 0) {
      this.finishedLoaded.next(true)
    }
  }
}
