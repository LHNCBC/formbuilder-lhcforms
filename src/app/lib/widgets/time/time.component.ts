import { Component } from '@angular/core';
import {StringComponent} from "../string/string.component";
import {LabelComponent} from "../label/label.component";
import {NgIf, NgClass, CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {LfbDisableControlDirective} from "../../directives/lfb-disable-control.directive";

/**
 * TimeComponent is a component for handling time input in the format HH:MM:SS.mmm.
 * It uses native input type="time" for user input and ensures the value is always in the correct format.
 * The exact UI is browser-dependent.
 */
@Component({
  selector: 'lfb-time',
  imports: [
    LabelComponent,
    NgIf,
    NgClass,
    LfbDisableControlDirective,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './time.component.html',
  styles: [`
    .form-control-like {
      border: var(--bs-border-width) solid var(--bs-border-color);
    }
  `]
})
export class TimeComponent extends StringComponent {

  /**
   * Set the value of the time input to the current time in HH:MM:SS.mmm format.
   */
  now() {
    const dt = new Date();
    const str = String(dt.getHours()).padStart(2, '0')+':'+
                        String(dt.getMinutes()).padStart(2, '0')+':'+
                        String(dt.getSeconds()).padStart(2, '0')+'.'+
                        String(dt.getMilliseconds()).padStart(3, '0');
    this.formProperty.setValue(str, false);
  }

  /**
   * Clear the time input value.
   */
  clear() {
    this.formProperty.setValue('', false);
  }
}
