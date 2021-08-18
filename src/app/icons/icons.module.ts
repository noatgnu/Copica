import { NgModule } from '@angular/core';
import {BootstrapIconsModule} from "ng-bootstrap-icons";
import {Trash} from "ng-bootstrap-icons/icons"

const icons = {
  Trash
}

@NgModule({
  declarations: [],
  imports: [
    BootstrapIconsModule.pick(icons)
  ],
  exports: [
    BootstrapIconsModule
  ]
})
export class IconsModule { }
