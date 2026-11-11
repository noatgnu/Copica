import { Component, inject, output, signal } from '@angular/core';
import { DataFrame, fromCSV } from "data-forge";
import { WebService } from "../../service/web.service";

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css']
})
export class FileUploaderComponent {
  private web = inject(WebService);
  readonly fileName = signal("");
  readonly dataframe = output<DataFrame>();

  handleFile(e: Event) {
    const target = e.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (file) {
      this.fileName.set(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        this.dataframe.emit(fromCSV(<string>reader.result));
      };
      reader.readAsText(file);
    }
  }

  loadTest() {
    this.web.getExampleInput().subscribe(data => {
      this.dataframe.emit(fromCSV(<string>data.body));
    });
  }
}
