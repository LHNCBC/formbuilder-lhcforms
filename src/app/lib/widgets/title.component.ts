import { Component, OnInit, Input } from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-title',
  template: `
    <span *ngIf="title" class="horizontal control-label">
      {{title}}
      <span *ngIf="helpMessage"  matTooltipPosition="above" [matTooltip]="helpMessage">
        <fa-icon [icon]="helpIcon"></fa-icon>
      </span>
    </span>
  `
})
export class TitleComponent implements OnInit {

  @Input()
  title: string;
  @Input()
  helpMessage: string;
  @Input()
  helpIcon = faInfoCircle;
  constructor() { }

  ngOnInit() {
  }
}
