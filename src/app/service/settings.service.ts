import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  databaseEnableSettings: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  constructor() { }

  getDatasetSettings() {
    const s = localStorage.getItem("datasets")

    if (s) {
      const settings = JSON.parse(s)
      console.log(settings)
      return settings
    }
    return {}
  }

  setDatasetSettings(datasetSettings: any) {
    console.log(datasetSettings)
    const s = JSON.stringify(datasetSettings)
    localStorage.setItem("datasets", s)
    this.databaseEnableSettings.next(true)
  }
}
