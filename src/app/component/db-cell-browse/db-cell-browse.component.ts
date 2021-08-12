import { Component, OnInit } from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {WebService} from "../../service/web.service";
import {BehaviorSubject, Observable} from "rxjs";
import {FormBuilder} from "@angular/forms";

@Component({
  selector: 'app-db-cell-browse',
  templateUrl: './db-cell-browse.component.html',
  styleUrls: ['./db-cell-browse.component.css']
})
export class DbCellBrowseComponent implements OnInit {
  indDataframe: IDataFrame = new DataFrame();
  dataArray: IDataFrame[] = []
  entireData: IDataFrame = new DataFrame();
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
    experiment: ""
  });

  constructor(private http: WebService, private fb: FormBuilder) {
    this.http.getIndex().subscribe(data => {
      this.indDataframe = new DataFrame(<Object>data.body)
      const first = this.indDataframe.first();
      console.log(first)
      this.form.setValue({
        organisms: first["Organisms"],
        experiment: first["Experiment Type"]})

      this.organism = this.indDataframe.getSeries("Organisms").distinct().bake().toArray()
      //this.experiment = this.indDataframe.getSeries("Experiment Type").distinct().bake().toArray()

      const rowNumb = this.indDataframe.getSeries("File").bake().count()
      let co = 0
      for (const r of this.indDataframe) {

        if (!(r["Organisms"] in this.dataMap)) {
          this.dataMap[r["Organisms"]] = {}
          this.dfMap[r["Organisms"]] = {}
        }
        if (!(r["Experiment Type"] in this.dataMap[r["Organisms"]])) {
          this.dataMap[r["Organisms"]][r["Experiment Type"]] = []
          this.dfMap[r["Organisms"]][r["Experiment Type"]] = new DataFrame();

        }

        this.http.getDBjson(r["File"]).subscribe(data => {
          co ++
          const a =new DataFrame(<Object>data.body)
          this.dataMap[r["Organisms"]][r["Experiment Type"]].push(a)
          if (co === rowNumb) {
            console.log("concat")
            for (const o in this.dataMap) {
              for (const e in this.dataMap[o]) {
                this.dfMap[o][e] = DataFrame.concat(this.dataMap[o][e]).bake()
              }
            }

            for (const e in this.dfMap[r["Organisms"]]) {
              this.experiment.push(e)
            }
            this.form.setValue({
              organisms: r["Organisms"],
              experiment: this.experiment[0]})
            this.selectData()
            //this.geneList = this.entireData.getSeries("Gene names").distinct().bake().toArray()
            this.fileLoaded.next(true);
          }
        })
      }
    })
  }

  ngOnInit(): void {

  }

  updateExperimentType() {
    console.log(this.form.value)

    const experiment: string[] = []
    console.log(this.dfMap[this.form.value["organism"]])
    for (const i in this.dfMap[this.form.value["organism"]]) {
      console.log(i)
      experiment.push(i[0])
    }
    this.experiment = experiment;
    this.form.setValue({
      organism: this.form.value["organism"],
      experiment: experiment[0]
    })
    this.selectData()
  }

  updateCellType() {
    this.selectData()
  }

  selectData() {

    this.selectedData = this.dfMap[this.form.value["organisms"]][this.form.value["experiment"]]
  }
}
