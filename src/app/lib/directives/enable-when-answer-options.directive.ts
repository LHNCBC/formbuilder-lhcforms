import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy, Optional } from '@angular/core';
import { Subscription } from 'rxjs';
import { EnableWhenAnswerOptionsService } from '../../services/enable-when-answer-options.service';

@Directive({
  selector: 'input[lfbEnableWhenAnswerOptions]'
})
export class EnableWhenAnswerOptionsDirective implements AfterViewInit, OnDestroy {
  @Input() enableWhenAnswerOptionsId = '';
  private refreshSubscription: Subscription | null = null;

  constructor(
    private elementRef: ElementRef<HTMLInputElement>,
    @Optional() private service: EnableWhenAnswerOptionsService | null
  ) {}

  ngAfterViewInit(): void {
    this.service?.initAutocomplete(this.elementRef, this.enableWhenAnswerOptionsId);
    this.refreshSubscription = this.service?.autocompleteRefresh$?.subscribe(() => {
      this.service?.initAutocomplete(this.elementRef, this.enableWhenAnswerOptionsId);
    }) || null;
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
    this.refreshSubscription?.unsubscribe();
    this.service?.destroyAutocomplete();
  }
}
