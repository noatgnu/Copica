import { Component, OnInit } from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import * as dataforge from "data-forge"
import {WebService} from "../../service/web.service";
import {BehaviorSubject, Observable} from "rxjs";
import {FormBuilder} from "@angular/forms";
import {UserDataService} from "../../service/user-data.service";
import {SettingsService} from "../../service/settings.service";

@Component({
  selector: 'app-db-cell-browse',
  templateUrl: './db-cell-browse.component.html',
  styleUrls: ['./db-cell-browse.component.css']
})
export class DbCellBrowseComponent implements OnInit {
  dda: boolean = true;
  dia: boolean = true;
  indDataframe: IDataFrame = new DataFrame();
  dataArray: IDataFrame[] = []
  geneList: string[] = []
  organism: string[] = []
  experiment: string[] = []
  dataMap: any = {}
  dfMap: any = {}
  fileLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  fileLoadedObserver: Observable<boolean> = this.fileLoaded.asObservable()
  selectedData: IDataFrame = new DataFrame();
  form = this.fb.group({
    organisms: "",
    experiment: "",
    dda: true,
    dia: true,
    userData: false
  });

  userDF: IDataFrame = new DataFrame()
  datasetSettings: any = {}
  constructor(private http: WebService, private fb: FormBuilder, private userData: UserDataService, private settings: SettingsService) {
    this.userData.dataObserver.subscribe(data => {
      this.userDF = data
    })
    this.http.getIndexText().subscribe(data => {
      this.datasetSettings = this.settings.getDatasetSettings()
      this.indDataframe = dataforge.fromCSV(<string>data.body)
      const temp: any[] = []
      for (const r of this.indDataframe) {
        if (r.File in this.datasetSettings) {
          if (this.datasetSettings[r.File]) {
            temp.push(r)
          }
        } else {
          this.datasetSettings[r.File] = true
          temp.push(r)
        }
      }
      console.log(this.datasetSettings)
      this.indDataframe = new DataFrame(temp)
      const first = this.indDataframe.first();
      console.log(first)
      this.form.setValue({
        organisms: first["Organisms"],
        experiment: first["Experiment type"],
        dia: true,
        dda: true,
        userData: false},
        )

      this.organism = this.indDataframe.getSeries("Organisms").distinct().bake().toArray()
      //this.experiment = this.indDataframe.getSeries("Experiment Type").distinct().bake().toArray()

      const rowNumb = this.indDataframe.getSeries("File").bake().count()

      this.getData();
    })
  }

  getData(experiment:boolean = false, remap: boolean = false) {
    let co = 0
    const rfile = []
    this.dataMap = {}
    this.dfMap = {}
    if (experiment) {
      this.experiment = []
    }
    const expo = this.experiment
    for (const r of this.indDataframe) {
      let get = false;
      if (r["Acquisition Method"] == "DDA") {
        if (this.form.value["dda"]) {
          get = true
        }
      } else if (r["Acquisition Method"] == "DIA") {
        if (this.form.value["dia"]) {
          get = true

        }
      }

      if (get) {
        rfile.push(r)
        if (!(r["Organisms"] in this.dataMap)) {
          this.dataMap[r["Organisms"]] = {}
          this.dfMap[r["Organisms"]] = {}
        }
        if (!(r["Experiment type"] in this.dataMap[r["Organisms"]])) {
          this.dataMap[r["Organisms"]][r["Experiment type"]] = []
          this.dfMap[r["Organisms"]][r["Experiment type"]] = new DataFrame();
        }
      }
    }
    for (const r of rfile) {
      this.http.getDBtext(r["File"]).subscribe(data => {
        co++
        const a = dataforge.fromCSV(<string>data.body)
        this.dataMap[r["Organisms"]][r["Experiment type"]].push(a)
        if (co === rfile.length) {
          for (const o in this.dataMap) {
            for (const e in this.dataMap[o]) {
              this.dfMap[o][e] = DataFrame.concat(this.dataMap[o][e]).bake()
            }
          }

          for (const e in this.dfMap[this.form.value["organisms"]]) {
            if (!(expo.includes(e))) {
              expo.push(e)
            }
          }

          let exp = this.form.value["experiment"]
          if (experiment) {
            if (!(expo.includes(exp))) {
              exp = expo[0]
            }
          }

          this.form.setValue({
            organisms: this.form.value["organisms"],
            experiment: exp,
            dda: this.form.value["dda"],
            dia: this.form.value["dia"],
            userData: this.form.value["userData"]
          })
          this.experiment = expo
          this.selectData()
          //this.geneList = this.entireData.getSeries("Gene names").distinct().bake().toArray()
          this.fileLoaded.next(true);
          console.log(this.dfMap);
        }
      })
    }
  }

  ngOnInit(): void {

  }

  updateCellType() {
    this.selectData()
  }

  selectData() {
    console.log("select data")

    this.selectedData = this.dfMap[this.form.value["organisms"]][this.form.value["experiment"]]
    if (this.form.value["userData"]) {
      if (this.userDF.count() > 0) {
        this.selectedData = DataFrame.concat([this.selectedData, this.userDF])
      }
    }
  }
}
