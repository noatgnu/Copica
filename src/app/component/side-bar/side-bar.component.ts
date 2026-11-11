import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-side-bar',
    templateUrl: './side-bar.component.html',
    styleUrls: ['./side-bar.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SideBarComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
