import { Component, inject, signal } from '@angular/core';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap/collapse';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';
import { WebService } from "./service/web.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [NgbCollapse, RouterLinkActive, RouterLink, RouterOutlet]
})
export class AppComponent {
  private web = inject(WebService);
  readonly title = 'Copica';
  readonly isMenuCollapsed = signal(true);

  constructor() {
    this.web.getFilter();
  }
}
