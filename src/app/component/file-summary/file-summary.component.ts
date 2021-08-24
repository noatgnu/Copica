import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {Query} from "../../class/query";

@Component({
  selector: 'app-file-summary',
  templateUrl: './file-summary.component.html',
  styleUrls: ['./file-summary.component.css']
})
export class FileSummaryComponent implements OnInit {
  column: string[] = [];
  columnNum = 0;
  rowNum = 0;
  columnForm: FormGroup = new FormGroup({});
  get dataframe(): IDataFrame {
    return this._dataframe;
  }

  private _dataframe: IDataFrame = new DataFrame<number, any>();

  @Input() set dataframe(value: IDataFrame) {
    this._dataframe = value;
    this.column = this._dataframe.getColumnNames();
    this.columnNum = this.column.length;
    this.rowNum = this._dataframe.count();
  }
  @Output() selectedData: EventEmitter<Query> = new EventEmitter<Query>();

  constructor(private fb: FormBuilder) {

    this.columnForm = fb.group({
      IntensityCols: [],
      IdentifierCol: "",
      MolecularMassCol: "",
      GeneNameCol: "",
    })
  }

  selectData() {
    const selected = this.columnForm.value["IntensityCols"].concat(this.columnForm.value["IdentifierCol"])
    const notSelected = []
    if (this.columnForm.value["IntensityCols"].length > 0 && this.columnForm.value["IdentifierCol"].length > 0) {
      const query = new Query()

      for (const c of this.column) {
        if (!selected.includes(c)) {
          notSelected.push(c)
        }
      }

      query.df = this.dataframe
      query.IntensityCols = this.columnForm.value["IntensityCols"]
      query.IdentifierCol = this.columnForm.value["IdentifierCol"]
      query.MolecularMassCol = this.columnForm.value["MolecularMassCol"]
      query.GeneNameCol = this.columnForm.value["GeneNameCol"]
      this.selectedData.emit(query)
    } else {
      alert("Please select at least one Intensity and one Identifier columns")
    }


  }

  ngOnInit(): void {
  }

}
