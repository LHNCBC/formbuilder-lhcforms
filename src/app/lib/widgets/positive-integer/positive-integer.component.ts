import {Component} from '@angular/core';

import {IntegerComponent} from '../integer/integer.component';
import {ReactiveFormsModule} from "@angular/forms";
import {AsyncPipe, NgClass} from "@angular/common";
import {LabelComponent} from "../label/label.component";
import {IntegerDirective} from "../../directives/integer.directive";

@Component({
  selector: 'lfb-positive-integer-widget',
  imports: [ReactiveFormsModule, AsyncPipe, NgClass, LabelComponent, IntegerDirective],
  templateUrl: '../integer/integer.component.html',
  styles: []
})
export class PositiveIntegerComponent extends IntegerComponent {
  protected override defaultMinimum = 1;
  protected override minimumFloor = 1;
  protected override defaultPlaceholder = 'Enter an integer greater than 0';
}
