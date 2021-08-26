import { Component, OnInit } from '@angular/core';
import {WebService} from "../../service/web.service";
import {DataFrame, IDataFrame, fromCSV} from "data-forge";
import {BehaviorSubject, Observable} from "rxjs";
import {SettingsService} from "../../service/settings.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {

  indexData: IDataFrame = new DataFrame()
  loadFinishedCheck: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  loadFinishedObserver: Observable<boolean> = this.loadFinishedCheck.asObservable()
  constructor(private http: WebService) {
    this.http.getIndexText().subscribe(data => {
      this.indexData = fromCSV(<string>data.body)
      this.loadFinishedCheck.next(true)
    })
  }

  ngOnInit(): void {
  }

}
