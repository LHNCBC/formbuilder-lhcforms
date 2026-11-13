/**
 * Widget to represent enableBehaviour field.
 */
import { Component, OnInit } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  standalone: false,
  selector: 'lfb-enable-behavior',
  template: `
    @if (schema.widget.id ==='hidden') {
      <input
        name="{{name}}" type="hidden" [formControl]="control">
    } @else {
      <div class="row">
        <div [ngClass]="schema.widget.labelWidthClass"></div>
        <div [ngClass]="schema.widget.controlWidthClass">
          <lfb-label [helpMessage]="schema.description" [title]="schema.title"
            [labelId]="'label_'+id"></lfb-label>
          <div [ngClass]="{row: schema.widget.layout === 'row'}"
            role="radiogroup" [attr.aria-labelledby]="'label_'+id" [attr.id]="id">
            @if (schema.widget.emptyOptionLabel) {
              <div [ngClass]="{col: schema.widget.layout === 'row'}">
                <input [attr.id]="id + '.empty'" name="{{id}}" type="radio"
                  [checked]="isEmptySelection()"
                  [disabled]="schema.readOnly || control.disabled"
                  (change)="clearSelection()" (blur)="control.markAsTouched()">
                <lfb-label [for]="id + '.empty'" class="horizontal control-label ms-sm-2"
                  [title]="schema.widget.emptyOptionLabel"></lfb-label>
              </div>
            }
            @for (option of schema.oneOf; track option[0]) {
              <div>
                <label class="horizontal control-label">
                  <input [formControl]="control" [attr.id]="id + '.' + option.enum[0]"
                    value="{{option.enum[0]}}" type="radio"  [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
                  {{option.description}}
                </label>
              </div>
            }
            @for (option of schema.enum; track option) {
              <div [ngClass]="{col: schema.widget.layout === 'row'}">
                <input [formControl]="control" [attr.id]="id + '.' + option" name="{{id}}"
                  value="{{option}}" type="radio"  [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
                <lfb-label [for]="id + '.' + option" class="horizontal control-label ms-sm-2" [title]="displayTexts[option]"></lfb-label>
              </div>
            }
          </div>
        </div>
      </div>
    }
    `,
  styles: [
  ]
})
export class EnableBehaviorComponent extends LfbControlWidgetComponent {
  displayTexts = {
    all: 'All conditions are true',
    any: 'Any condition is true',
    hidden: 'Hide',
    protected: 'Show as protected'
  }

  /**
   * Check whether no option is selected, i.e. the value is null, undefined or empty.
   *
   * @returns True if the empty option should be checked.
   */
  isEmptySelection(): boolean {
    const value = this.control.value;
    return value === null || value === undefined || value === '';
  }

  /**
   * Clear the optional value so serialization omits it, and mark the user's edit as dirty.
   */
  clearSelection(): void {
    this.control.setValue(null);
    this.control.markAsDirty();
  }
}
