/**
 * Component for general input box
 */
import {Component, inject, OnInit, ChangeDetectorRef} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { LfbOptionControlWidgetComponent } from '../lfb-option-control-widget/lfb-option-control-widget.component';

@Component({
  standalone: false,
  selector: 'lfb-string',
  templateUrl: './string.component.html',
  styles: [`
    input:disabled {
      background-color: #f8f9fa !important;
      border: 2px solid #dee2e6 !important;
      cursor: not-allowed !important;
      opacity: 1 !important;
      color: #6c757d !important;
    }
  `]
})
export class StringComponent extends LfbOptionControlWidgetComponent implements OnInit {

  liveAnnouncer = inject(LiveAnnouncer);
  cdr = inject(ChangeDetectorRef);

  Array = Array; // To use in templates.
  urlValid = true;

  constructor() {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.controlClasses = this.controlClasses || 'form-control form-control-sm';
    
    // Disable the control if schema specifies it
    if (this.schema.widget?.disabled || this.schema.disabled) {
      setTimeout(() => {
        this.control?.disable();
      });
    }
    
    // Initialize URL validation state
    if (this.schema.widget?.id === 'url' && this.formProperty.value) {
      setTimeout(() => {
        this.urlValid = true; // Start optimistic, will validate on first interaction
      });
    }
  }

  get isUrlType(): boolean {
    return this.schema.widget?.id === 'url';
  }
}
