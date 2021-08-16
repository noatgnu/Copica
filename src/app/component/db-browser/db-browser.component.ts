import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {WebService} from "../../service/web.service";
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-db-browser',
  templateUrl: './db-browser.component.html',
  styleUrls: ['./db-browser.component.css']
})
export class DbBrowserComponent implements OnInit {
  dataframe: IDataFrame = new DataFrame();

  form: FormGroup = this.fb.group({
    cellType: [],
    experimentType: ""
  });
  filename: any[] = []
  cellType: any[] = []
  oDataframe: any[] = [];
  experiment: any[] = []
  temp: any[] = [];
  selectedFile: any[] = [];
  @Output() selectedDataframe: EventEmitter<IDataFrame> = new EventEmitter<IDataFrame>()

  constructor(private http: WebService, private fb: FormBuilder) {
    this.http.getIndex().subscribe(data => {
      this.dataframe = new DataFrame(<Object>data.body)
      const firstEntry = this.dataframe.first()
      this.form.setValue({cellType: {"cellType": firstEntry["Cell type"], "organism": firstEntry["Organisms"]}, experimentType: firstEntry["Experiment Type"]})
      //this.selectedFile = firstEntry["File"]
      this.updateExperimentType()
      this.updateCellType()

    })


  }

  updateExperimentType() {
    this.experiment = []
    for (const a of this.dataframe) {
      if (!this.experiment.includes(a["Experiment Type"])) {
        this.experiment.push(a["Experiment Type"])
      }
    }
    this.updateFormValue("experimentType")
  }

  updateCellType() {
    this.cellType = []
    this.selectedFile = []
    for (const a of this.dataframe) {
      if (a["Experiment Type"] == this.form.value["experimentType"]) {
        if (!this.cellType.includes(a["cellType"])) {
          if (this.selectedFile.length === 0) {
            this.selectedFile = [a["File"]]
          }
          this.cellType.push({"cellType": a["Cell type"], "organism": a["Organisms"]})

        }
      }
    }
    console.log(this.cellType)
    this.updateFormValue("cellType")

  }

  updateFormValue(target: string) {
    const a = {experimentType: this.form.value["experimentType"], cellType: this.form.value["cellType"]}
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
      if (a["Experiment Type"] === this.form.value["experimentType"]) {
        for (const a2 of this.form.value["cellType"]) {
          if (a["Organisms"] === a2["organism"] && a["Cell type"] === a2["cellType"]) {
            this.selectedFile.push(a["File"])
            break
          }
        }
      }
    }
    //this.http.getDBjson(this.form.value[""])
  }

  loadVisual() {
    this.selectCellType()
    const dataDF: IDataFrame[] = []
    for (const s of this.selectedFile) {
      this.http.getDBjson(s).subscribe(data => {
        if (this.selectedFile.length > 1) {
          dataDF.push(new DataFrame(<Object>data.body))
          if (this.selectedFile.length === dataDF.length) {
            this.selectedDataframe.emit(DataFrame.concat(dataDF).bake());
          }
        } else {
          this.selectedDataframe.emit(new DataFrame(<Object>data.body))
        }
      })
    }


  }

  downloadSelected() {

  }

  ngOnInit(): void {
  }


}
