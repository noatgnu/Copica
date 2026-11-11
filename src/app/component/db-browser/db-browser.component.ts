import { Component, OnInit, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataFrame, IDataFrame, fromCSV } from "data-forge";
import { UntypedFormBuilder, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { WebService } from "../../service/web.service";
import { UserDataService } from "../../service/user-data.service";
import { SettingsService } from "../../service/settings.service";

@Component({
  selector: 'app-db-browser',
  templateUrl: './db-browser.component.html',
  styleUrls: ['./db-browser.component.css'],
  imports: [ReactiveFormsModule]
})
export class DbBrowserComponent implements OnInit {
  private http = inject(WebService);
  private userData = inject(UserDataService);
  private settings = inject(SettingsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private datasetSettings: Record<string, boolean> = {};
  private selectedFile: string[] = [];
  readonly dataframe = signal<IDataFrame>(new DataFrame());
  readonly experiment = signal<string[]>([]);
  readonly cellType = signal<any[]>([]);
  readonly selectedDataframe = output<IDataFrame>();
  readonly form = inject(UntypedFormBuilder).group({
    cellType: [[]],
    experimentType: "",
    userData: false
  });
  readonly experimentType = toSignal(this.form.controls["experimentType"].valueChanges, {initialValue: ""});

  constructor() {
    this.http.getIndexText().subscribe(data => {
      this.datasetSettings = this.settings.getDatasetSettings();
      const temp: any[] = [];
      for (const r of fromCSV(<string>data.body)) {
        if (r.File in this.datasetSettings) {
          if (this.datasetSettings[r.File]) {
            temp.push(r);
          }
        } else {
          this.datasetSettings[r.File] = true;
          temp.push(r);
        }
      }
      const dataframe = new DataFrame(temp);
      const firstEntry = dataframe.first();
      this.form.setValue({cellType: [{"cond": firstEntry["Condition"], "fraction": firstEntry["Fraction"], "cellType": firstEntry["Cell type"], "organism": firstEntry["Organisms"]}], experimentType: firstEntry["Experiment type"], userData: false});
      this.dataframe.set(dataframe);
      this.updateExperimentType();
      this.updateCellType();
    });
  }

  updateExperimentType() {
    const experiment: string[] = []
    for (const a of this.dataframe()) {
      if (!experiment.includes(a["Experiment type"])) {
        experiment.push(a["Experiment type"])
      }
    }
    this.experiment.set(experiment)
    this.updateFormValue("experimentType")
  }

  updateCellType() {
    const cellType: any[] = []
    this.selectedFile = []
    for (const a of this.dataframe()) {
      if (a["Experiment type"] == this.form.value["experimentType"]) {
        if (this.selectedFile.length === 0) {
          this.selectedFile = [a["File"]]
        }
        cellType.push({"cellType": a["Cell type"], "organism": a["Organisms"], "cond": a["Condition"], "fraction": a["Fraction"]})
      }
    }
    this.cellType.set(cellType)
    this.updateFormValue("cellType")

  }

  updateFormValue(target: string) {
    const a = {experimentType: this.form.value["experimentType"], cellType: this.form.value["cellType"], userData: this.form.value["userData"]}
    switch (target) {
      case "experimentType": {
        a[target] = this.experiment()[0]
        break;
      }
      case "cellType": {
        a[target] = [this.cellType()[0]]
        break;
      }
      default:
        break;
    }
    this.form.setValue(a)
  }

  selectCellType() {
    this.selectedFile = []
    for (const a of this.dataframe()) {
      if (a["Experiment type"] === this.form.value["experimentType"]) {
        for (const a2 of this.form.value["cellType"]) {
          if (a["Organisms"] === a2["organism"] && a["Cell type"] === a2["cellType"] && a["Condition"] === a2["cond"] && a["Fraction"] === a2["fraction"]) {
            this.selectedFile.push(a["File"])
            break
          }
        }
      }
    }
  }

  loadVisual(e: MouseEvent) {
    e.stopPropagation()
    this.selectCellType()
    this.processData();
  }

  private processData(updateUrl: boolean = true) {
    const dataDF: IDataFrame[] = []
    if (updateUrl) {
      this.updateURL()
    }

    for (const s of this.selectedFile) {
      const a = this.selectedFile
      this.http.scatterFiles = this.selectedFile
      this.http.getDBtext(s).subscribe(data => {
        let result: IDataFrame = new DataFrame()
        if (a.length > 1) {

          dataDF.push(fromCSV(<string>data.body))
          if (a.length === dataDF.length) {
            result = DataFrame.concat(dataDF).bake()

          }
        } else {
          result = fromCSV(<string>data.body)
        }

        const userDF = this.userData.data()
        if (this.form.value["userData"] && userDF.count() > 0) {
          result = DataFrame.concat([result, userDF]).bake()
        }

        this.selectedDataframe.emit(result);


      })
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(res => {
      if (res["datasets"]) {
        this.selectedFile = res["datasets"].split(",")
        this.processData(false)
      }
      if (res["gene"]) {
        this.http.scatterData = res["gene"].split(",")
      }
    })
  }

  updateURL(): void {
    const url = this.router.createUrlTree(["copybrowse", this.selectedFile.join(",")])
    this.location.go(url.toString())
  }

}
