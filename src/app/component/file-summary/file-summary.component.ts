import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DataFrame, IDataFrame, Series} from "data-forge";
import {UntypedFormBuilder, FormControl, UntypedFormGroup} from "@angular/forms";
import {Query} from "../../class/query";
import {UniprotService} from "../../service/uniprot.service";
import {BehaviorSubject, Observable} from "rxjs";

@Component({
  selector: 'app-file-summary',
  templateUrl: './file-summary.component.html',
  styleUrls: ['./file-summary.component.css']
})
export class FileSummaryComponent implements OnInit {
  column: string[] = [];
  columnNum = 0;
  rowNum = 0;
  columnForm: UntypedFormGroup = new UntypedFormGroup({});
  get dataframe(): IDataFrame {
    return this._dataframe;
  }
  accList: string[] = []
  private _dataframe: IDataFrame = new DataFrame<number, any>();

  @Input() set dataframe(value: IDataFrame) {
    this._dataframe = value;
    this.column = this._dataframe.getColumnNames();
    this.columnNum = this.column.length;
    this.rowNum = this._dataframe.count();
    const columns = this._dataframe.getColumnNames()
    let mmass = ""
    if (columns.includes("Mol. weight [kDa]")) {
      mmass = "Mol. weight [kDa]"
    }
    let proteinID = ""
    if (columns.includes("Major protein IDs")) {
      proteinID = "Majority protein IDs"
    }
    let geneNames = ""
    if (columns.includes("Gene names")) {
      geneNames = "Gene names"
    }

    this.columnForm.setValue({
      IntensityCols: this.columnForm.value.IntensityCols,
      IdentifierCol: proteinID,
      MolecularMassCol: mmass,
      GeneNameCol: geneNames,
      fetchUniProt: this.columnForm.value.fetchUniProt,
      Ploidy: 2
    })
    //this.uniprotFetch(this._dataframe)
  }

  emitTriggerBehavior: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  emitTriggerObserver: Observable<boolean> = this.emitTriggerBehavior.asObservable();

  @Output() selectedData: EventEmitter<Query> = new EventEmitter<Query>();

  constructor(private fb: UntypedFormBuilder, private uniprot: UniprotService) {
    this.uniprot.uniprotParseStatusObserver.subscribe(status => {
      if (status) {
        console.log(this.accList)
        const result: any = {"Gene names": [], "Mass": []}
        console.log(this.uniprot.results.size)

        for (const a of this.accList) {
          for (const c of ["Gene names", "Mass"]) {

            if (this.uniprot.results.has(a)) {
              if (c === "Mass") {
                result[c].push(parseFloat(this.uniprot.results.get(a)[c].replace(",", "")))
              } else {
                result[c].push(this.uniprot.results.get(a)[c])
              }
            } else {
              if (c === "Mass") {
                result[c].push(1)
              } else {
                result[c].push("")
              }
            }
          }
        }
        console.log(result)
        for (const c of ["Gene names", "Mass"]) {
          this._dataframe = this._dataframe.withSeries(c, new Series(result[c])).bake()
        }
        this.column = this._dataframe.getColumnNames()
        this.columnNum = this.column.length
        this.columnForm.setValue(
          {
            IntensityCols: this.columnForm.value["IntensityCols"],
            IdentifierCol: this.columnForm.value["IdentifierCol"],
            MolecularMassCol: "Mass",
            GeneNameCol: "Gene names",
            fetchUniProt: this.columnForm.value["fetchUniProt"],
            Ploidy: this.columnForm.value["Ploidy"]
          }
        )
        this.emitTriggerBehavior.next(true)
      }
    })

    this.emitTriggerObserver.subscribe(status => {
      if (status) {
        const query = new Query()
        query.df = this._dataframe
        query.IntensityCols = this.columnForm.value["IntensityCols"]
        query.IdentifierCol = this.columnForm.value["IdentifierCol"]
        query.MolecularMassCol = this.columnForm.value["MolecularMassCol"]
        query.GeneNameCol = this.columnForm.value["GeneNameCol"]
        query.Ploidy = this.columnForm.value["Ploidy"]
        console.log(query)
        this.selectedData.emit(query)
      }
    })

    this.columnForm = fb.group({
      IntensityCols: [],
      IdentifierCol: "",
      MolecularMassCol: "",
      GeneNameCol: "",
      fetchUniProt: false,
      Ploidy: 2
    })
  }

  selectData() {
    const selected = this.columnForm.value["IntensityCols"].concat(this.columnForm.value["IdentifierCol"])
    const notSelected = []
    if (this.columnForm.value["IntensityCols"].length > 0 && this.columnForm.value["IdentifierCol"].length > 0) {


      for (const c of this.column) {
        if (!selected.includes(c)) {
          notSelected.push(c)
        }
      }
      if (this.columnForm.value.fetchUniProt) {
        this.uniprotFetch(this.dataframe, this.columnForm.value.IdentifierCol);
      } else {
        this.emitTriggerBehavior.next(true)
      }



    } else {
      alert("Please select at least one Intensity and one Identifier columns")
    }


  }

  private uniprotFetch(df: IDataFrame, accessionCol: string) {
    this.uniprot.uniprotParseStatus.next(false)
    const accessions = df.getSeries(accessionCol).bake().toArray()

    for (const a of accessions) {
      const d = a.split(";")
      const accession = this.uniprot.Re.exec(d[0])
      if (accession !== null) {
        this.accList.push(accession[0])
      }
    }
    console.log(this.accList.length)
    try {
      this.uniprot.UniProtParseGet([...this.accList], false)
    } catch (e) {
      console.log(e);
    }
  }

  ngOnInit(): void {
  }

}
