import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DataFrame, fromCSV} from "data-forge";
import {WebService} from "../../service/web.service";

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css']
})
export class FileUploaderComponent implements OnInit {
  fileName: string = "";
  file: File|undefined;
  df: DataFrame|undefined;
  @Output() dataframe = new EventEmitter<DataFrame>();

  constructor(private http: WebService) {

  }

  handleFile(e: Event) {
    if (e.target) {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.file = target.files[0];
        this.fileName = target.files[0].name;
        const reader = new FileReader();
        reader.onload = (event) => {
          const loadedFile = reader.result;
          this.df = fromCSV(<string>loadedFile);
          this.dataframe.emit(this.df);
        };
        reader.readAsText(this.file);
      }
    }
  }

  loadTest() {
    this.http.getExampleInput().subscribe(data => {
      this.df = fromCSV(<string>data.body);
      this.dataframe.emit(this.df);
    })
  }

  ngOnInit(): void {
  }

}
