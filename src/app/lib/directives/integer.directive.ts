import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import { Renderer2 } from '@angular/core';

/**
 * A directive to restrict input to integer characters.
 * It is intended to be used on <input type="number"> element.
 */
@Directive({
  selector: '[lfbInteger]'
})
export class IntegerDirective {
  private hostEl = inject(ElementRef);
  liveAnnouncer = inject(LiveAnnouncer);
  private renderer = inject(Renderer2);

  /**
   * Read the input's min attribute as a number when it is set.
   * @param el - Integer input element.
   * @returns The configured minimum value, or null when no minimum is set.
   */
  private getMinValue(el: HTMLInputElement): number | null {
    return el.min === '' ? null : Number(el.min);
  }

  /**
   * Read the input's max attribute as a number when it is set.
   * @param el - Integer input element.
   * @returns The configured maximum value, or null when no maximum is set.
   */
  private getMaxValue(el: HTMLInputElement): number | null {
    return el.max === '' ? null : Number(el.max);
  }

  /**
   * Check whether text represents an integer allowed by the configured range.
   * @param value - Clipboard or input text to validate.
   * @param minValue - Minimum allowed value, or null when unbounded.
   * @param maxValue - Maximum allowed value, or null when unbounded.
   * @returns True when the value is an integer within range.
   */
  private isIntegerInRange(value: string, minValue: number | null, maxValue: number | null): boolean {
    if(!value.match(/^[-+]?\d+$/)) {
      return false;
    }

    const numericValue = Number(value);
    const aboveMin = minValue === null || numericValue >= minValue;
    const belowMax = maxValue === null || numericValue <= maxValue;

    return aboveMin && belowMax;
  }

  /**
   * Keep the host element value synchronized after the browser validates number input.
   * @param event - Focus event object.
   */
  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent): void {
    const el = (event.target as HTMLInputElement);
    this.renderer.setProperty(this.hostEl.nativeElement, 'value', el.value);
  }

  /**
   * Check input validity.
   * @param event - Keyboard event object
   */
  @HostListener('keyup', ['$event'])
  OnInput(event: KeyboardEvent) {
    const el = (event.target as HTMLInputElement);
    if (! el.validity?.valid) {
      this.liveAnnouncer.announce('The value is invalid');
      event.preventDefault();
    }
  }

  /**
   * Restrict to integer characters in keydown event.
   * @param event - Keyboard event object.
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    let announce = false;
    const el = (event.target as HTMLInputElement);
    const minValue = this.getMinValue(el);
    // Handle numbers that has leading 0.
    // For example: 00000, 000123
    if (el.value.startsWith('0') && el.value.length >= 1 && event.key !== 'Delete' && event.key !== 'Backspace') {
      event.preventDefault();
    }

    if (
      event.key === '.' ||
      event.key.toLowerCase() === 'e' ||
      (event.key === '-' && ((minValue !== null && minValue >= 0) || el.value.startsWith('-')))) {
      announce = true;
      // Key is valid input for number type, but not for integer
      event.preventDefault();
    }
    else if (
      event.key.length === 1 &&
      event.code.startsWith('Key')
    ) {
      announce = true;
    }
    if (announce) {
      this.liveAnnouncer.announce(event.key + ' is not accepted for integer');
    }
  }

  /**
   * Block pasted content unless it forms an integer within the input's range.
   * @param event - Clipboard event object.
   */
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const el = event.target as HTMLInputElement;
    const val = event.clipboardData.getData('text/plain');
    const minValue = this.getMinValue(el);
    const maxValue = this.getMaxValue(el);
    let ignorePaste = true; // Ignore paste when current input state is invalid.
    if (el.validity.valid) {
      const currentValue = el.value;
      if(currentValue.length > 0) {
        // Current value is valid. Accept only digits from clipboard.
        if(val.match(/^\d+$/) && this.isIntegerInRange(currentValue + val, minValue, maxValue)) {
          ignorePaste = false;
        }
      }
      else if (currentValue === '') {
        // Current value is empty. Accept any integer allowed by the input's range.
        if (this.isIntegerInRange(val, minValue, maxValue)) {
          ignorePaste = false;
        }
      }
    }
    if (ignorePaste) {
      event.preventDefault();
    }
  }
}
