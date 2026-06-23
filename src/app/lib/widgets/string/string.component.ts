/**
 * Component for general input box
 */
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';
import {ReactiveFormsModule} from "@angular/forms";
import {AsyncPipe, NgClass} from "@angular/common";
import {LabelComponent} from "../label/label.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {LfbDisableControlDirective} from "../../directives/lfb-disable-control.directive";
import { Observable, of } from 'rxjs';
import { EnableWhenAnswerOptionsService } from '../../../services/enable-when-answer-options.service';
import { EnableWhenAnswerOptionsDirective } from '../../directives/enable-when-answer-options.directive';

@Component({
  selector: 'lfb-string',
  imports: [ReactiveFormsModule, MatTooltipModule, NgClass, AsyncPipe, LfbDisableControlDirective, LabelComponent, EnableWhenAnswerOptionsDirective],
  providers: [EnableWhenAnswerOptionsService],
  templateUrl: './string.component.html'
})
export class StringComponent extends LfbControlWidgetComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('inputEl') inputElRef!: ElementRef;
  showTooltip = true;
  enableWhenAnswerOptionsService = inject(EnableWhenAnswerOptionsService, { optional: true });
  hasAnswerOptions$: Observable<boolean> = of(false);

  Array = Array; // To use in templates.

  cdr = inject(ChangeDetectorRef);
  constructor() {
    super();
  }

  /**
   * Initializes the string widget and any enableWhen answer-option behavior.
   *
   */
  ngOnInit() {
    super.ngOnInit();
    this.subscribeToErrors();
    this.initEnableWhenAnswerOptions();
    this.controlClasses = this.controlClasses || '';
  }

  /**
   * Initializes answer-option autocomplete support when this string field is an enableWhen answer field.
   *
   */
  initEnableWhenAnswerOptions(): void {
    const canonicalPath = (this.formProperty as any).__canonicalPathNotation || '';
    if (canonicalPath.match(/^enableWhen\.(\d+)\.answer(\w+).*$/) && this.enableWhenAnswerOptionsService) {
      this.enableWhenAnswerOptionsService.init(this.formProperty, this.control);
      this.hasAnswerOptions$ = this.enableWhenAnswerOptionsService.hasAnswerOptions$;
    }
  }

  /**
   * Get the value shown in the tooltip, formatting JSON fields when requested.
   */
  getTooltipValue(): string | null {
    if(!this.showTooltip) {
      return null;
    }
    const value = this.formProperty.value;
    if(this.shouldFormatTooltipAsJson()) {
      return this.formatJsonTooltip(value);
    }
    return value == null ? null : String(value);
  }

  /**
   * Check whether the current string field should show formatted JSON in its tooltip.
   */
  private shouldFormatTooltipAsJson(): boolean {
    return this.widgetInfo?.tooltipFormat === 'json' ||
      this.schema.widget?.tooltipFormat === 'json' ||
      this.formProperty.path?.endsWith('/__$stringify') ||
      this.formProperty.canonicalPathNotation?.endsWith('.__$stringify') ||
      this.id?.includes('__$stringify');
  }

  /**
   * Pretty-print a JSON string for tooltip display, falling back to the original value.
   */
  private formatJsonTooltip(value: unknown): string | null {
    if(typeof value !== 'string') {
      return value == null ? null : String(value);
    }
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    }
    catch {
      return value;
    }
  }

  /**
   * Gives the answer-options service a chance to attach autocomplete and updates tooltip overflow state.
   *
   */
  ngAfterViewChecked(): void {
    if(this.inputElRef?.nativeElement.clientWidth) {
      this.showTooltip = this.inputElRef.nativeElement.scrollWidth > this.inputElRef.nativeElement.clientWidth;
      this.cdr.detectChanges();
    }
  }

  /**
   * Clears invalid date/time-like values from string-derived widgets.
   *
   * @param event - Blur event from the input element.
   */
  suppressInvalidValue(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.classList.contains('ng-invalid')) {
      this.formProperty.setValue(null, false);
    } else if (this.findParentTdWithInvalid(inputEl)) {
      inputEl.value = '';
      this.formProperty.setValue('', false);
    }
  }

  /**
   * Cleans up the answer-options autocomplete service and base widget resources.
   *
   */
  ngOnDestroy() {
    this.enableWhenAnswerOptionsService?.destroy();
    super.ngOnDestroy();
  }

  /**
   * Checks whether an input is inside a table cell marked invalid.
   *
   * @param inputEl - Input element where the blur event originated.
   * @returns True if the nearest parent table cell has the invalid marker class.
   */
  findParentTdWithInvalid(inputEl: HTMLElement): boolean {
    let el: HTMLElement | null = inputEl;
    while (el && el.tagName !== 'TD') {
      el = el.parentElement;
    }
    return !!el && el.classList.contains('invalid');
  }
}
