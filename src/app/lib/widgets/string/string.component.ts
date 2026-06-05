/**
 * Component for general input box
 */
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild
} from '@angular/core';
import { LfbOptionControlWidgetComponent } from '../lfb-option-control-widget/lfb-option-control-widget.component';
import {ReactiveFormsModule} from "@angular/forms";
import {AsyncPipe, NgClass} from "@angular/common";
import {LabelComponent} from "../label/label.component";
import {MatTooltipModule} from "@angular/material/tooltip";
import {LfbDisableControlDirective} from "../../directives/lfb-disable-control.directive";

@Component({
  selector: 'lfb-string',
  imports: [ReactiveFormsModule, MatTooltipModule, NgClass, AsyncPipe, LfbDisableControlDirective, LabelComponent],
  templateUrl: './string.component.html',
  styles: [`
    input:disabled {
      background-color: #f8f9fa !important;
      border: 2px solid #dee2e6 !important;
      cursor: not-allowed !important;
      opacity: 1 !important;
      color: #6c757d !important;
    }
  `]
})
export class StringComponent extends LfbOptionControlWidgetComponent implements OnInit, AfterViewChecked {

  @ViewChild('inputEl') inputElRef: ElementRef;
  showTooltip = true;

  Array = Array; // To use in templates.

  cdr = inject(ChangeDetectorRef);
  constructor() {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.controlClasses = this.controlClasses || '';
  }

  ngAfterViewChecked() {
    if(this.inputElRef?.nativeElement.clientWidth) {
      this.showTooltip = this.inputElRef.nativeElement.scrollWidth > this.inputElRef.nativeElement.clientWidth;
      this.cdr.detectChanges();
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

}
