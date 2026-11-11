import { Component, computed, effect, inject, input, linkedSignal, output, untracked } from '@angular/core';
import { DataFrame, IDataFrame, Series } from "data-forge";
import { UntypedFormBuilder, ReactiveFormsModule } from "@angular/forms";
import { Query } from "../../class/query";
import { UniprotService } from "../../service/uniprot.service";

@Component({
  selector: 'app-file-summary',
  templateUrl: './file-summary.component.html',
  styleUrls: ['./file-summary.component.css'],
  imports: [ReactiveFormsModule]
})
export class FileSummaryComponent {
  private uniprot = inject(UniprotService);
  private accList: string[] = [];
  private fetchPending = false;
  readonly dataframe = input<IDataFrame>(new DataFrame<number, any>());
  readonly selectedData = output<Query>();
  readonly frame = linkedSignal(() => this.dataframe());
  readonly column = computed(() => this.frame().getColumnNames());
  readonly columnNum = computed(() => this.column().length);
  readonly rowNum = computed(() => this.frame().count());
  readonly columnForm = inject(UntypedFormBuilder).group({
    IntensityCols: [[]],
    IdentifierCol: "",
    MolecularMassCol: "",
    GeneNameCol: "",
    fetchUniProt: false,
    Ploidy: 2
  });

  constructor() {
    effect(() => {
      const columns = this.dataframe().getColumnNames();
      untracked(() => this.columnForm.patchValue({
        IdentifierCol: columns.includes("Major protein IDs") ? "Majority protein IDs" : "",
        MolecularMassCol: columns.includes("Mol. weight [kDa]") ? "Mol. weight [kDa]" : "",
        GeneNameCol: columns.includes("Gene names") ? "Gene names" : "",
        Ploidy: 2
      }));
    });

    effect(() => {
      if (this.uniprot.parseComplete() && this.fetchPending) {
        untracked(() => this.applyUniprotResults());
      }
    });
  }

  private applyUniprotResults() {
    this.fetchPending = false;
    const result: Record<string, any[]> = {"Gene names": [], "Mass": []};
    for (const a of this.accList) {
      const entry = this.uniprot.results.get(a);
      result["Gene names"].push(entry ? entry["Gene names"] : "");
      result["Mass"].push(entry ? parseFloat(entry["Mass"].replace(",", "")) : 1);
    }
    let df = this.frame();
    for (const c of ["Gene names", "Mass"]) {
      df = df.withSeries(c, new Series(result[c])).bake();
    }
    this.frame.set(df);
    this.columnForm.patchValue({MolecularMassCol: "Mass", GeneNameCol: "Gene names"});
    this.emitQuery();
  }

  private emitQuery() {
    const value = this.columnForm.value;
    const query = new Query();
    query.df = this.frame();
    query.IntensityCols = value["IntensityCols"];
    query.IdentifierCol = value["IdentifierCol"];
    query.MolecularMassCol = value["MolecularMassCol"];
    query.GeneNameCol = value["GeneNameCol"];
    query.Ploidy = value["Ploidy"];
    this.selectedData.emit(query);
  }

  selectData() {
    const value = this.columnForm.value;
    if (value["IntensityCols"].length > 0 && value["IdentifierCol"].length > 0) {
      if (value.fetchUniProt) {
        this.uniprotFetch(this.frame(), value.IdentifierCol);
      } else {
        this.emitQuery();
      }
    } else {
      alert("Please select at least one Intensity and one Identifier columns");
    }
  }

  private uniprotFetch(df: IDataFrame, accessionCol: string) {
    this.uniprot.parseComplete.set(false);
    this.fetchPending = true;
    for (const a of df.getSeries(accessionCol).bake().toArray()) {
      const accession = this.uniprot.Re.exec(a.split(";")[0]);
      if (accession !== null) {
        this.accList.push(accession[0]);
      }
    }
    this.uniprot.UniProtParseGet([...this.accList], false);
  }
}
