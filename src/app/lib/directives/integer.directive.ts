import {Directive, ElementRef, HostListener} from '@angular/core';
import {LiveAnnouncer} from '@angular/cdk/a11y';
declare var LForms: any;

@Directive({
  selector: '[lfbInteger]'
})
export class IntegerDirective {

  constructor(private el: ElementRef, public liveAnnouncer: LiveAnnouncer) {
  }
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === '.' || event.key.toLowerCase() === 'e' || (event.key === '-' && this.el.nativeElement.value.startsWith('-')) ) {
      this.liveAnnouncer.announce(event.key + ' is not accepted for integer input');
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const val = event.clipboardData.getData('text/plain');
    const parsedVal = String(parseInt(val, 10));
    if (val !== parsedVal) {
      if (parsedVal !== 'NaN') {
        this.el.nativeElement.value += parsedVal;
      }
      event.preventDefault();
    }
  }
}
