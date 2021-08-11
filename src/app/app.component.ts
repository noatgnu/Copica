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
    const d = new DataFrame([{A:1,B:2}, {A:2,B:2}, {A:1, B:2}])

    const c = d.select(r => r.A === 1)
    console.log(c)
    const e = c.bake()
    console.log(e)
  }
}
