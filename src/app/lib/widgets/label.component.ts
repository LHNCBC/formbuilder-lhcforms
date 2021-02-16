/**
 * A label with help icon and associated help message.
 */
import { Component, OnInit, Input } from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-label',
  template: `
    <label *ngIf="title" [attr.for]="for" class="col-form-label-sm">
      {{title}}
      <span *ngIf="helpMessage" [matTooltip]="helpMessage" matTooltipPosition="above">
        <fa-icon [icon]="helpIcon"></fa-icon>
      </span>
    </label>
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
