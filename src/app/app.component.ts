import { Component} from '@angular/core';
import {DataFrame} from "data-forge";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Copica';
  public isMenuCollapsed = true;

  constructor() {

  }
}
