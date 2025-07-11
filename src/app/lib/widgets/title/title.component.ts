/**
 * Component for creating a title for a control.
 */
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lfb-title',
  imports: [MatTooltipModule, FontAwesomeModule, CommonModule],
  template: `
    <span *ngIf="title" class="horizontal control-label">
      {{title}}
      <div *ngIf="helpMessage" tabindex="0" [attr.aria-label]="'Tooltip for '+title+': '+helpMessage" class="btn border-0 m-0 p-0" [matTooltip]="helpMessage">
        <fa-icon [icon]="helpIcon" aria-hidden="true"></fa-icon>
      </div>
    </span>
  `
})
export class TitleComponent {

  // Input properties
  @Input()
  title: string;
  @Input()
  helpMessage: string;
  @Input()
  helpIcon = faInfoCircle;
  constructor() { }

}
