/**
 * A label with help icon and associated help message.
 */
import { Component, OnInit, Input } from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'lfb-label',
  template: `
    <label *ngIf="title" [attr.for]="for" class="col-form-label align-self-center p-0"
    >{{title}}&nbsp;<div *ngIf="helpMessage" tabindex="0" class="btn border-0 p-0 b-0" [matTooltip]="helpMessage"
                            [attr.aria-label]="'Tooltip for '+title+': '+helpMessage"
    ><fa-icon [icon]="helpIcon" aria-hidden="true"></fa-icon></div
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
