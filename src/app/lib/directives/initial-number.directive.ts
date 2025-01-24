import {Directive, HostListener, Input, Output} from '@angular/core';
import { EventEmitter } from '@angular/core';

@Directive({
  selector: '[lfbInitialNumber]'
})
export class InitialNumberDirective {
  @Input() propType: string = '';
  @Output() validationResult = new EventEmitter<any [] | null>();

  private allowedDecimalKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '-', '+', 'e', 'E', 'Backspace', 'Delete'];
  private allowedIntegerKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '+', 'Backspace', 'Delete'];

  /**
   * Restrict key inputs for 'integer' or 'decimal' data types.
   * @param event - Keyboard event object.
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    let allowedKeys;
    if (this.propType === 'valueDecimal') {
      allowedKeys = this.allowedDecimalKeys;
    } else if (this.propType === 'valueInteger') {
      allowedKeys = this.allowedIntegerKeys;
    }

    if (allowedKeys && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }
}

