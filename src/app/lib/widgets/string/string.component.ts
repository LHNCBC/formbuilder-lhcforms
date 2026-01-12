/**
 * Component for general input box
 */
import {Component, inject, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { LfbOptionControlWidgetComponent } from '../lfb-option-control-widget/lfb-option-control-widget.component';

@Component({
  standalone: false,
  selector: 'lfb-string',
  templateUrl: './string.component.html'
})
export class StringComponent extends LfbOptionControlWidgetComponent implements OnInit {

  liveAnnouncer = inject(LiveAnnouncer);

  Array = Array; // To use in templates.

  constructor() {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.controlClasses = this.controlClasses || 'form-control form-control-sm';
  }
}
