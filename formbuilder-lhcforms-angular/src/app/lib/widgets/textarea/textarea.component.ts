import { Component } from '@angular/core';
import {StringComponent} from '../string/string.component';

@Component({
  standalone: false,
  selector: 'lfb-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.css']
})
export class TextAreaComponent extends StringComponent {

}
