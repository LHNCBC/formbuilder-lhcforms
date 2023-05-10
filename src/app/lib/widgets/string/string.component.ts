/**
 * Component for general input box
 */
import {AfterViewInit, Component, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  selector: 'lfb-string',
  templateUrl: './string.component.html'
})
export class StringComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit {

  modifiedMessages = {
    PATTERN: null,
    MIN_LENGTH: null,
    MAX_LENGTH: null
  }
  errors: [{code: string, originalMessage: string, modifiedMessage: string}] = null;

  ngOnInit() {
    super.ngOnInit();
    this.controlClasses = this.controlClasses || 'form-control form-control-sm';
  }

  /**
   * Add formProperty change subscriptions.
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.formProperty.errorsChanges.subscribe((errors) => {
      // For some reason, errors have duplicates. Remove them.
      this.errors = errors ? errors.filter((error, ind) => {
        return errors.findIndex((e, i) => {return e.code === error.code}) === ind;
      }).map((e) => {return {code: e.code, originalMessage: e.message, modifiedMessage: this.modifiedMessages[e.code]}}) : null;
    });
  }
}
