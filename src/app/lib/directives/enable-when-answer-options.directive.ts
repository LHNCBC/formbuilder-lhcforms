import { AfterViewChecked, Directive, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';
import { EnableWhenAnswerOptionsService } from '../../services/enable-when-answer-options.service';

@Directive({
  selector: 'input[lfbEnableWhenAnswerOptions]'
})
export class EnableWhenAnswerOptionsDirective implements AfterViewChecked, OnDestroy {
  @Input('lfbEnableWhenAnswerOptions') service!: EnableWhenAnswerOptionsService;
  @Input() enableWhenAnswerOptionsId = '';

  constructor(private elementRef: ElementRef<HTMLInputElement>) {}

  ngAfterViewChecked(): void {
    this.service?.initAutocomplete(this.elementRef, this.enableWhenAnswerOptionsId);
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    this.service?.onInput(event);
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event): void {
    this.service?.suppressInvalidValue(event);
  }

  ngOnDestroy(): void {
    this.service?.destroyAutocomplete();
  }
}
