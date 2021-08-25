import {IDataFrame} from "data-forge";

export class UniprotResult {
  constructor(DataFrame: IDataFrame, Entries: string[]) {
    this._DataFrame = DataFrame;
    this._Entries = Entries;
  }
  get DataFrame(): IDataFrame {
    return this._DataFrame;
  }

  set DataFrame(value: IDataFrame) {
    this._DataFrame = value;
  }

  get Entries(): string[] {
    return this._Entries;
  }

  set Entries(value: string[]) {
    this._Entries = value;
  }
  private _DataFrame: IDataFrame;
  private _Entries: string[];
}
