import { Component } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-batch-search-modal',
  templateUrl: './batch-search-modal.component.html',
  styleUrls: ['./batch-search-modal.component.css']
})
export class BatchSearchModalComponent {
  searchType: string = "gene";
  closeResult: string = ""
  constructor(private modal: NgbActiveModal) {
  }
  close() {
    this.modal.dismiss();
  }

  submit() {
    this.modal.close({searchType: this.searchType, closeResult: this.closeResult});
  }
}
