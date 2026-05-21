import {Component} from '@angular/core';

import {IntegerComponent} from '../integer/integer.component';
import {ReactiveFormsModule} from "@angular/forms";
import {AsyncPipe, NgClass} from "@angular/common";
import {LabelComponent} from "../label/label.component";
import {IntegerDirective} from "../../directives/integer.directive";

@Component({
  selector: 'lfb-unsigned-integer-widget',
  imports: [ReactiveFormsModule, AsyncPipe, NgClass, LabelComponent, IntegerDirective],
  templateUrl: '../integer/integer.component.html',
  styles: []
})
export class UnsignedIntegerComponent extends IntegerComponent {
  protected override defaultMinimum = 0;
  protected override defaultPlaceholder = 'Enter an integer greater than or equal to 0';
}

