import {Directive, ElementRef, HostListener} from '@angular/core';
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

  /**
   * Constructor
   * @param hostEl - Host element
   * @param liveAnnouncer - Angular Live Announcer service
   * @param renderer - service to interact with the DOM
   */
  constructor(private hostEl: ElementRef, public liveAnnouncer: LiveAnnouncer, private renderer: Renderer2) {
  }

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
    // Handle numbers that has leading 0.
    // For example: 00000, 000123
    if (el.value.startsWith('0') && el.value.length >= 1 && event.key !== 'Delete' && event.key !== 'Backspace') {
      event.preventDefault();
    }

    if (
      event.key === '.' ||
      event.key.toLowerCase() === 'e' ||
      (event.key === '-' && (event.target as HTMLInputElement).value.startsWith('-'))) {
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

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const val = event.clipboardData.getData('text/plain');
    let ignorePaste = true; // Ignore paste when current input state is invalid.
    if ((event.target as HTMLInputElement).validity.valid) {
      const currentValue = (event.target as HTMLInputElement).value;
      if(currentValue.length > 0) {
        // Current value is valid. Accept only positive integer from clipboard.
        if(val.match(/^\d+$/)) {
          ignorePaste = false;
        }
      }
      else if (currentValue === '') {
        // Current value is empty. Accept positive or negative integer from clipboard.
        if (val.match(/^[-+]?\d+$/)) {
          ignorePaste = false;
        }
      }
    }
    if(ignorePaste) {
      event.preventDefault();
    }
  }
}
