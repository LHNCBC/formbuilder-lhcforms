import {Directive, ElementRef, HostListener} from '@angular/core';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import { Renderer2 } from '@angular/core';

@Directive({
  selector: '[lfbDecimal]'
})
export class DecimalDirective {

  /**
   * Constructor
   * @param hostEl - Host element
   * @param liveAnnouncer - Angular Live Announcer service
   * @param renderer - service to interact with the DOM
   */
  constructor(private hostEl: ElementRef, public liveAnnouncer: LiveAnnouncer, private renderer: Renderer2) {
  }

  hasPeriod = false;
  hasE = false;

  /**
   * Restrict to integer characters in focus event.
   * @param event - Keyboard event object.
   */
  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent): void {
    const el = (event.target as HTMLInputElement);

    // if the decimal value contains 'e' and not at 0 index, skip the conversion
    const eLocIndex = el.value.indexOf('e');
    if (eLocIndex <= 0) {
      // Handles numbers like 'e', '-', '.', 0.00
      const result = parseFloat(el.value);
      if (isNaN(result)) {
        this.renderer.setProperty(this.hostEl.nativeElement, 'value', '');
      } else {
        this.renderer.setProperty(this.hostEl.nativeElement, 'value', result);
      }
    }

  }

  /**
   * Check input validity.
   * @param event - Keyboard event object
   */
  @HostListener('keyup', ['$event'])
  OnInput(event: KeyboardEvent) {
    const el = (event.target as HTMLInputElement);
    // update status whether the number still contains 'e' or '.'
    if (el.value.startsWith('0') && el.value.length > 1) {
      let periodIndexLoc = el.value.indexOf('.');
      let eIndexLoc = el.value.indexOf('e');
      if (periodIndexLoc === -1) {
        this.hasPeriod = false;
      }
      if (eIndexLoc === -1) {
        this.hasE = false;
      }
    }
    // Handles numbers that has leading 0 and has no '.'.
    // For example: 00000, 000123
    if (el.value.startsWith('0') && !this.hasPeriod) {
      const result = parseFloat(el.value);
      if (isNaN(result)) {
        this.renderer.setProperty(this.hostEl.nativeElement, 'value', '');
      } else {
        this.renderer.setProperty(this.hostEl.nativeElement, 'value', result);
      }
    }
  }

  /**
   * Restrict to integer characters in keydown event.
   * @param event - Keyboard event object.
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    let announce = false;
    //let indexLoc;
    const el = (event.target as HTMLInputElement);
    if (event.key === '.') {
      this.hasPeriod = true;
    } else if (event.key === 'e') {
      this.hasE = true;
    }

    if (el.value.startsWith('0') && el.value.length >= 1 && event.key !== 'Delete' && event.key !== 'Backspace' &&
        event.key !== '.' && !this.hasPeriod && !this.hasE) {
      event.preventDefault();
    }
  }
}
