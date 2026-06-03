/**
 * A directive to disable reactive form control.
 * The solution is from https://github.com/angular/angular/issues/35330
 */
import { Directive, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * A directive to disable reactive form control.
 */
@Directive({
  standalone: true,
  selector: '[lfbDisableControl]'
})
export class LfbDisableControlDirective implements OnChanges {
  private ngControl = inject(NgControl, { self: true });

  @Input()
  lfbDisableControl: boolean;

  /**
   * An angular life-cycle hook. On input change, disable or enable the control.
   * @param changes - SimpleChanges object.
   */
  ngOnChanges(changes: SimpleChanges) {
    if(changes.lfbDisableControl) {
      // Call NgControl's disable()/enable() method.
      const action = this.lfbDisableControl ? 'disable' : 'enable';
      this.ngControl.control[action]();
    }
  }

}
