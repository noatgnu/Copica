import { Component, OnInit } from '@angular/core';
import {DataFrame, fromCSV, IDataFrame} from "data-forge";
import {WebService} from "../../service/web.service";
import {SettingsService} from "../../service/settings.service";
import {BehaviorSubject, Observable} from "rxjs";

@Component({
  selector: 'app-dataset-settings',
  templateUrl: './dataset-settings.component.html',
  styleUrls: ['./dataset-settings.component.css']
})
export class DatasetSettingsComponent implements OnInit {
  indexData: IDataFrame = new DataFrame()
  loadFinishedCheck: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  loadFinishedObserver: Observable<boolean> = this.loadFinishedCheck.asObservable()
  datasetsSettings: any = {}
  columns = [
    {name: "Cell type",prop: "Cell type"}, {prop: "Experiment type"}, {prop: "Organisms"}, {prop: "Condition"}, {prop: "Fraction"}
  ]
  rows: any[] = []
  enabled = 0
  constructor(private http: WebService, private settings: SettingsService) {
    this.http.getIndexText().subscribe(data => {
      this.indexData = fromCSV(<string>data.body)
      this.datasetsSettings = this.settings.getDatasetSettings()
      for (const r of this.indexData) {
        if (!(r["File"] in this.datasetsSettings)) {
          this.datasetsSettings[r["File"]] = true
          this.enabled = this.enabled + 1
        } else {
          if (this.datasetsSettings[r["File"]]) {
            this.enabled = this.enabled + 1
          }
        }
      }

      this.settings.setDatasetSettings(this.datasetsSettings)
      this.rows = this.indexData.toArray()
      this.loadFinishedCheck.next(true)
    })
  }

  ngOnInit(): void {
  }

  toggleDatasets(e: Event, file: any) {
    e.stopPropagation()
    this.datasetsSettings[file] = !this.datasetsSettings[file]
  }

  saveSettings(e: Event) {
    e.stopPropagation()
    this.settings.setDatasetSettings(this.datasetsSettings)
    this.enabled = 0
    for (const i in this.datasetsSettings) {
      if (this.datasetsSettings[i]) {
        this.enabled = this.enabled + 1
      }
    }
  }

  clearSettings(e: Event) {
    e.stopPropagation()
    for (const i in this.datasetsSettings) {
      this.datasetsSettings[i] = true
    }
    this.settings.setDatasetSettings(this.datasetsSettings)
    this.enabled = 0
    for (const i in this.datasetsSettings) {
      if (this.datasetsSettings[i]) {
        this.enabled = this.enabled + 1
      }
    }
  }

  selectAll(e: Event) {
    e.stopPropagation()
    for (const i in this.datasetsSettings) {
      this.datasetsSettings[i] = true
    }
  }
}
