import { Component, OnInit, Input } from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-label',
  template: `
    <label *ngIf="title" [attr.for]="for" class="horizontal control-label">
      {{title}}
      <span *ngIf="helpMessage"  placement="top" [ngbTooltip]="helpMessage" data-container="body">
        <fa-icon [icon]="helpIcon"></fa-icon>
      </span>
    </label>
  `
})
export class LabelComponent implements OnInit {

  @Input()
  title: string;
  @Input()
  helpMessage: string;
  @Input()
  helpIcon = faInfoCircle;
  @Input()
  for: string;
  constructor() { }

  ngOnInit() {
  }
}
