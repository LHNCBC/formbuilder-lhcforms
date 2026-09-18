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
import {NgbTypeahead, NgbTypeaheadSelectItemEvent} from '@ng-bootstrap/ng-bootstrap';
import {merge, Observable, Subject, of} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {EnableWhenAnswerOptionsDirective} from "../../directives/enable-when-answer-options.directive";
import { EnableWhenAnswerOptionsService } from '../../../services/enable-when-answer-options.service';
import { suppressInvalidInputValue } from '../../validation-utils';

type StringSuggestion = string | {value: string; label?: string};

@Component({
  selector: 'lfb-string',
  imports: [
    ReactiveFormsModule,
    MatTooltipModule,
    NgClass,
    AsyncPipe,
    LfbDisableControlDirective,
    LabelComponent,
    NgbTypeahead,
    EnableWhenAnswerOptionsDirective
  ],
  providers: [EnableWhenAnswerOptionsService],
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
export class StringComponent extends LfbControlWidgetComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('inputEl') inputElRef!: ElementRef;
  @ViewChild('suggestionTypeahead') suggestionTypeahead?: NgbTypeahead;
  showTooltip = false;
  enableWhenAnswerOptionsService = inject(EnableWhenAnswerOptionsService, { optional: true });
  hasAnswerOptions$: Observable<boolean> = of(false);
  suggestionFocus$ = new Subject<string>();
  suggestionClick$ = new Subject<string>();

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
   * Check whether the rendered input text exceeds its visible width.
   */
  hasOverflow(): boolean {
    const el = this.inputElRef?.nativeElement;
    const width = el?.clientWidth;
    if(!width) {
      return false;
    }
    return el.scrollWidth > width;
  }

  /**
   * Refresh tooltip visibility immediately before hover or focus display.
   */
  updateTooltipVisibility(): void {
    this.showTooltip = this.hasOverflow();
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

  /** Filter schema-provided suggestions for the reusable typeahead menu. */
  searchSuggestions = (input$: Observable<string>): Observable<StringSuggestion[]> => {
    const typedInput$ = input$.pipe(debounceTime(100), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.suggestionClick$.pipe(
      filter(() => !this.suggestionTypeahead?.isPopupOpen())
    );
    return merge(typedInput$, this.suggestionFocus$, clicksWithClosedPopup$).pipe(
      map((term) => {
        const searchTerm = (term || '').trim().toLowerCase();
        return (this.schema.widget?.suggestions || []).filter((suggestion: StringSuggestion) => {
          const value = this.suggestionValue(suggestion).toLowerCase();
          const label = this.suggestionLabel(suggestion).toLowerCase();
          return !searchTerm || value.includes(searchTerm) || label.includes(searchTerm);
        });
      })
    );
  };

  /** Render each suggestion as one display line. */
  suggestionLabel = (suggestion: StringSuggestion): string =>
    typeof suggestion === 'string' ? suggestion : suggestion.label || suggestion.value;

  /** Store the suggestion's underlying code instead of its display label. */
  onSuggestionSelected(event: NgbTypeaheadSelectItemEvent<StringSuggestion>): void {
    event.preventDefault();
    this.control.setValue(this.suggestionValue(event.item));
    this.control.markAsDirty();
  }

  /** Resolve the value stored by a primitive or labeled suggestion. */
  private suggestionValue(suggestion: StringSuggestion): string {
    return typeof suggestion === 'string' ? suggestion : suggestion.value;
  }

  /**
   * Get the value shown in the tooltip, formatting JSON fields when requested.
   */
  getTooltipValue(): string {
    if(!this.showTooltip) {
      return '';
    }
    const value = this.formProperty.value;
    if(this.shouldFormatTooltipAsJson()) {
      return this.formatJsonTooltip(value);
    }
    return value == null ? '' : String(value);
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
  private formatJsonTooltip(value: unknown): string {
    if(typeof value !== 'string') {
      return value == null ? '' : String(value);
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
    const el = this.inputElRef?.nativeElement;
    const width = el?.clientWidth;
    if(!width) {
      return;
    }

    const nextShowTooltip = el.scrollWidth > width;
    if(nextShowTooltip !== this.showTooltip) {
      this.showTooltip = nextShowTooltip;
      this.cdr.markForCheck();
    }
  }

  /**
   * Clears invalid date/time-like values from string-derived widgets.
   *
   * @param event - Blur event from the input element.
   */
  suppressInvalidValue(event: Event): void {
    suppressInvalidInputValue(event, (value) => this.formProperty.setValue(value, false), '');
  }

  /**
   * Cleans up the answer-options autocomplete service and base widget resources.
   *
   */
  ngOnDestroy() {
    this.enableWhenAnswerOptionsService?.destroy();
    super.ngOnDestroy();
  }

}
