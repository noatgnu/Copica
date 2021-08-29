import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {WebService} from "../../service/web.service";
import * as dataforge from "data-forge"
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder, FormGroup} from "@angular/forms";
import {UserDataService} from "../../service/user-data.service";
import {SettingsService} from "../../service/settings.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Location} from "@angular/common";

@Component({
  selector: 'app-db-browser',
  templateUrl: './db-browser.component.html',
  styleUrls: ['./db-browser.component.css']
})
export class DbBrowserComponent implements OnInit {
  dataframe: IDataFrame = new DataFrame();

  form: FormGroup = this.fb.group({
    cellType: [],
    experimentType: "",
    userData: false
  });
  filename: any[] = []
  cellType: any[] = []
  oDataframe: any[] = [];
  experiment: any[] = []
  temp: any[] = [];
  selectedFile: any[] = [];
  @Output() selectedDataframe: EventEmitter<IDataFrame> = new EventEmitter<IDataFrame>()
  userDF: IDataFrame = new DataFrame();
  datasetSettings: any = {}
  constructor(private http: WebService, private fb: FormBuilder, private userData: UserDataService, private settings: SettingsService, private route: ActivatedRoute, private router: Router, private location: Location) {
    this.userData.dataObserver.subscribe(data => {
      this.userDF = data
    })
    this.http.getIndexText().subscribe(data => {
      this.dataframe = dataforge.fromCSV(<string>data.body)
      this.datasetSettings = this.settings.getDatasetSettings()
      const temp: any[] = []
      for (const r of this.dataframe) {
        if (r.File in this.datasetSettings) {
          if (this.datasetSettings[r.File]) {
            temp.push(r)
          }
        } else {
          this.datasetSettings[r.File] = true
          temp.push(r)
        }
      }
      this.dataframe = new DataFrame(temp)
      const firstEntry = this.dataframe.first()
      this.form.setValue({cellType: [{"cond": firstEntry["Condition"], "fraction": firstEntry["Fraction"], "cellType": firstEntry["Cell type"], "organism": firstEntry["Organisms"]}], experimentType: firstEntry["Experiment type"], userData: false})
      //this.selectedFile = firstEntry["File"]
      this.updateExperimentType()
      this.updateCellType()

    })


  }

  updateExperimentType() {
    this.experiment = []
    for (const a of this.dataframe) {
      if (!this.experiment.includes(a["Experiment type"])) {
        this.experiment.push(a["Experiment type"])
      }
    }
    this.updateFormValue("experimentType")
  }

  updateCellType() {
    this.cellType = []
    this.selectedFile = []
    for (const a of this.dataframe) {
      if (a["Experiment type"] == this.form.value["experimentType"]) {
        if (!this.cellType.includes(a["cellType"])) {
          if (this.selectedFile.length === 0) {
            this.selectedFile = [a["File"]]
          }
          this.cellType.push({"cellType": a["Cell type"], "organism": a["Organisms"], "cond": a["Condition"], "fraction": a["Fraction"]})

        }
      }
    }
    this.updateFormValue("cellType")

  }

  updateFormValue(target: string) {
    const a = {experimentType: this.form.value["experimentType"], cellType: this.form.value["cellType"], userData: this.form.value["userData"]}
    switch (target) {
      case "experimentType": {
        a[target] = this.experiment[0]
        break;
      }
      case "cellType": {
        a[target] = [this.cellType[0]]
        break;
      }
      default:
        break;
    }
    this.form.setValue(a)
  }

  selectCellType() {
    this.selectedFile = []
    for (const a of this.dataframe) {
      if (a["Experiment type"] === this.form.value["experimentType"]) {
        for (const a2 of this.form.value["cellType"]) {
          if (a["Organisms"] === a2["organism"] && a["Cell type"] === a2["cellType"] && a["Condition"] === a2["cond"] && a["Fraction"] === a2["fraction"]) {
            this.selectedFile.push(a["File"])
            break
          }
        }
      }
    }
    //this.http.getDBjson(this.form.value[""])
  }

  loadVisual(e: MouseEvent) {
    e.stopPropagation()
    this.selectCellType()
    this.processData();
  }

  private processData(updateUrl: boolean = true) {
    const dataDF: IDataFrame[] = []
    console.log(this.selectedFile)
    if (updateUrl) {
      this.updateURL()
    }

    for (const s of this.selectedFile) {
      console.log(s)
      console.log(this.selectedFile)
      const a = this.selectedFile
      this.http.getDBtext(s).subscribe(data => {
        console.log(a)
        let result: IDataFrame = new DataFrame()
        if (a.length > 1) {

          dataDF.push(dataforge.fromCSV(<string>data.body))
          if (a.length === dataDF.length) {
            result = DataFrame.concat(dataDF).bake()

          }
        } else {
          result = dataforge.fromCSV(<string>data.body)
        }

        if (this.form.value["userData"]) {
          if (this.userDF.count() > 0) {
            result = DataFrame.concat([result, this.userDF]).bake()
          }
        }

        this.selectedDataframe.emit(result);


      })
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(res => {
      if (res.datasets) {
        const d = res.datasets.split(",")
        if (d) {
          this.selectedFile = d
          this.processData(false)
        }
      }
    })
  }

  updateURL(): void {
    const url = this.router.createUrlTree(["copybrowse", this.selectedFile.join(",")])
    this.location.go(url.toString())
  }

}
