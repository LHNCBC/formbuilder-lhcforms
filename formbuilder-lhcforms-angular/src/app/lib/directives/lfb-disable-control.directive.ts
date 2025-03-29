/**
 * A directive to disable reactive form control.
 * The solution is from https://github.com/angular/angular/issues/35330
 */
import {Directive, Input, OnChanges, SimpleChanges} from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  standalone: true,
  selector: '[lfbDisableControl]'
})
export class LfbDisableControlDirective implements OnChanges {

  @Input()
  lfbDisableControl;
  constructor(private ngControl: NgControl) { }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.lfbDisableControl) {
      const action = this.lfbDisableControl ? 'disable' : 'enable';
      this.ngControl.control[action]();
    }
  }

}
