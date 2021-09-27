/**
 * A label with help icon and associated help message.
 */
import { Component, OnInit, Input } from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'lfb-label',
  template: `
    <label *ngIf="title" [attr.for]="for" class="col-form-label align-self-center p-0"
    >{{title}}&nbsp;<button *ngIf="helpMessage" class="btn border-0 p-0 b-0" [ngbTooltip]="helpMessage"
    ><fa-icon [icon]="helpIcon"></fa-icon></button
    ></label>
  `,
  styles: [`
    label {
      margin-bottom: 0;
    }
  `]
})
export class LabelComponent implements OnInit {

  // Input properties
  @Input()
  title: string;
  @Input()
  helpMessage: string;
  @Input()
  helpIcon = faInfoCircle;
  @Input()
  for: string;
  @Input()
  labelWidthClass: string;
  constructor() { }

  ngOnInit() {
  }
}
