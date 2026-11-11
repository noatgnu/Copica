import { Component, OnInit, inject, signal } from '@angular/core';
import { DataFrame, IDataFrame, fromCSV } from "data-forge";
import { UntypedFormBuilder, ReactiveFormsModule, FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap/alert';
import { WebService } from "../../service/web.service";
import { UserDataService } from "../../service/user-data.service";
import { SettingsService } from "../../service/settings.service";
import { GraphData } from "../../class/graph-data";
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { ProteinAtlasComponent } from '../protein-atlas/protein-atlas.component';

@Component({
  selector: 'app-db-cell-browse',
  templateUrl: './db-cell-browse.component.html',
  styleUrls: ['./db-cell-browse.component.css'],
  imports: [NgbAlert, ReactiveFormsModule, FormsModule, BarChartComponent, ProteinAtlasComponent]
})
export class DbCellBrowseComponent implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private http = inject(WebService);
  private userData = inject(UserDataService);
  private settings = inject(SettingsService);
  private selectedGenes: string[] = [];
  private dda = false;
  private dia = false;
  private indDataframe: IDataFrame = new DataFrame();
  private dataMap: any = {};
  private dfMap: any = {};
  private datasetSettings: Record<string, boolean> = {};
  private selectedFiles: string[] = [];
  readonly viewProteinAtlast = signal(false);
  readonly customData = signal(false);
  readonly customDataName = signal<string[]>([]);
  readonly graphData = signal<GraphData>(new GraphData());
  readonly organism = signal<string[]>([]);
  readonly experiment = signal<string[]>([]);
  readonly fileLoaded = signal(false);
  readonly form = inject(UntypedFormBuilder).group({
    organisms: "",
    experiment: "",
    dda: false,
    dia: false,
    userData: false
  });

  constructor() {
    this.http.getIndexText().subscribe(data => {
      this.datasetSettings = this.settings.getDatasetSettings();
      const temp: any[] = [];
      const customDataName: string[] = [];
      const index = fromCSV(<string>data.body);
      if (this.selectedFiles.length > 0) {
        for (const r of index) {
          if (this.selectedFiles.includes(r.File)) {
            temp.push(r);
            customDataName.push(r["Cell type"] + "(" + r["Condition"] + ")");
          }
        }
      } else {
        for (const r of index) {
          if (r.File in this.datasetSettings) {
            if (this.datasetSettings[r.File]) {
              temp.push(r);
            }
          } else {
            this.datasetSettings[r.File] = true;
            temp.push(r);
          }
        }
      }
      this.customDataName.set(customDataName);
      this.indDataframe = new DataFrame(temp);
      const first = this.indDataframe.first();
      this.form.setValue({
        organisms: first["Organisms"],
        experiment: first["Experiment type"],
        dia: this.dia,
        dda: this.dda,
        userData: false
      });
      this.organism.set(this.indDataframe.getSeries("Organisms").distinct().bake().toArray());
      this.getData();
    });
  }

  getData(experiment:boolean = false, remap: boolean = false) {
    let co = 0
    const rfile = []
    this.dataMap = {}
    this.dfMap = {}
    const expo = experiment ? [] : this.experiment().slice()
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
        const a = fromCSV(<string>data.body)
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
          this.experiment.set(expo)
          this.selectData()
          this.fileLoaded.set(true)
        }
      })
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(res => {
      this.selectedGenes = res["gene"] ? res["gene"].toUpperCase().split(",") : []
      if (res["methods"]) {
        const d = res["methods"].toLowerCase().split(",")
        if (d.includes("dda")) {
          this.dda = true
        }
        if (d.includes("dia")) {
          this.dia = true
        }
      }
      if (res["datasets"]) {
        this.customData.set(true)
        this.selectedFiles = res["datasets"].split(",")
      }
    })
  }

  updateCellType() {
    this.selectData()
  }

  selectData() {
    let selectedData: IDataFrame = this.dfMap[this.form.value["organisms"]][this.form.value["experiment"]]
    const userDF = this.userData.data()
    if (this.form.value["userData"] && userDF.count() > 0) {
      selectedData = DataFrame.concat([selectedData, userDF])
    }
    const graphData = new GraphData()
    graphData.data = selectedData
    graphData.selectedProteins = this.selectedGenes
    this.graphData.set(graphData)
    this.updateURL(this.selectedGenes)
  }

  updateSelected(e: string[]) {
    this.selectedGenes = e
    this.updateURL(this.selectedGenes)
  }

  updateURL(e: string[]) {
    const methods = []
    if (this.form.value.dia) {
      methods.push("dia")
    }
    if (this.form.value.dda) {
      methods.push("dda")
    }

    const url = this.router.createUrlTree(["/cellbrowse", e.join(","), methods.join(","), this.selectedFiles.join(",")])
    if (this.location.path() !== url.toString()) {
      this.location.go(url.toString())
    }
  }
}
