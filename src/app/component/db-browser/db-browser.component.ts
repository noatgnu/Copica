import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {WebService} from "../../service/web.service";
import * as dataforge from "data-forge"
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder, FormGroup} from "@angular/forms";
import {UserDataService} from "../../service/user-data.service";

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
  constructor(private http: WebService, private fb: FormBuilder, private userData: UserDataService) {
    this.userData.dataObserver.subscribe(data => {
      this.userDF = data
      console.log(this.userDF)
    })
    this.http.getIndexText().subscribe(data => {
      const a = dataforge.fromCSV(<string>data.body)
      this.dataframe = dataforge.fromCSV(<string>data.body)

      const firstEntry = this.dataframe.first()
      console.log(firstEntry)
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
    console.log(this.cellType)
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
    const dataDF: IDataFrame[] = []
    for (const s of this.selectedFile) {
      this.http.getDBtext(s).subscribe(data => {
        let result: IDataFrame = new DataFrame()
        if (this.selectedFile.length > 1) {

          dataDF.push(dataforge.fromCSV(<string>data.body))
          if (this.selectedFile.length === dataDF.length) {
            result = DataFrame.concat(dataDF).bake()

          }
        } else {
          result = dataforge.fromCSV(<string>data.body)
        }
        console.log(result)
        if (this.form.value["userData"]) {
          if (this.userDF.count() > 0) {
            result = DataFrame.concat([result, this.userDF]).bake()
          }
        }
        console.log(result)
        this.selectedDataframe.emit(result);
      })
    }
  }

  ngOnInit(): void {
  }



}
