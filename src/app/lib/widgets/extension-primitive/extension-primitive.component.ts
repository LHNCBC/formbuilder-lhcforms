import {AfterViewInit, Component, OnDestroy, inject} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {LabelComponent} from '../label/label.component';
import {IntegerDirective} from '../../directives/integer.directive';

@Component({
  selector: 'lfb-extension-primitive',
  imports: [FormsModule, ReactiveFormsModule, NgClass, LabelComponent, IntegerDirective],
  template: `
    <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
      @if (!nolabel) {
        <lfb-label
          [for]="id"
          [title]="schema.title"
          [helpMessage]="schema.description"
          [ngClass]="labelClasses"
          [labelId]="id + '_label'"
        ></lfb-label>
      }
      <div class="{{controlClasses}}">
        @if (schema.enum?.length && schema.widget?.buttonRadio) {
          <div class="btn-group btn-group-sm" role="radiogroup" [attr.id]="id" [attr.aria-labelledby]="id + '_label'">
            @for (option of schema.enum; track option) {
              <input
                class="btn-check"
                [attr.id]="id + '.' + option"
                [name]="id"
                type="radio"
                [formControl]="control"
                [value]="option"
                autocomplete="off"
              >
              <label class="btn btn-outline-success" [attr.for]="id + '.' + option">
                {{getOptionLabel(option)}}
              </label>
            }
            @if (schema.widget?.addEmptyOption) {
              <input
                class="btn-check"
                [attr.id]="id + '.unspecified'"
                [name]="id"
                type="radio"
                [formControl]="control"
                [value]="schema.widget?.emptyOptionValue ?? ''"
                autocomplete="off"
              >
              <label class="btn btn-outline-success" [attr.for]="id + '.unspecified'">
                {{schema.widget?.emptyOptionLabel || 'Unspecified'}}
              </label>
            }
          </div>
        } @else if (schema.enum?.length) {
          <select
            [attr.id]="id"
            name="{{name}}"
            class="form-select form-select-sm"
            [formControl]="control"
          >
            @if (schema.widget?.addEmptyOption) {
              <option [ngValue]="schema.widget?.emptyOptionValue ?? null">{{schema.widget?.emptyOptionLabel || 'Not specified'}}</option>
            }
            @for (option of schema.enum; track option) {
              <option [ngValue]="option">{{getOptionLabel(option)}}</option>
            }
          </select>
        } @else {
          <input
            lfbInteger
            [attr.id]="id"
            name="{{name}}"
            class="form-control form-control-sm"
            [class.is-invalid]="!!errorMessages?.length"
            [formControl]="control"
            type="number"
            [min]="schema.minimum"
            [max]="schema.maximum"
            [step]="schema.widget?.step || 1"
            [attr.placeholder]="schema.placeholder"
          >
          @if (errorMessages?.length) {
            @for (errorMessage of errorMessages; track errorMessage) {
              <small class="text-danger form-text" role="alert">{{errorMessage}}</small>
            }
          }
        }
      </div>
    </div>
  `
})
export class ExtensionPrimitiveComponent extends LfbControlWidgetComponent implements AfterViewInit, OnDestroy {
  private extensionsService = inject(ExtensionsService);
  private formService = inject(FormService);

  ngAfterViewInit() {
    super.ngAfterViewInit();

    // visibleIf destroys this widget while retaining the proxy field value. When the widget is recreated,
    // errorsChanges emits immediately and synchronizes that retained value back into its FHIR extension.
    const sub = this.formProperty.errorsChanges.subscribe((errors) => {
      if (this.formService.loading) {
        return;
      }

      const extUrl = this.schema.widget?.extensionUrl;
      const valueX = this.schema.widget?.valueX;
      if (!extUrl || !valueX) {
        return;
      }

      if (errors?.length) {
        this.removeLegacyExtensions();
        this.extensionsService.removeExtensionsByUrl(extUrl);
        return;
      }

      const value = this.formProperty.value;
      if (value !== null && value !== undefined && value !== '') {
        const ext: any = {url: extUrl};
        ext[valueX] = this.toFhirValue(value, valueX);
        this.removeLegacyExtensions();
        this.extensionsService.resetExtension(extUrl, ext, valueX, false);
      }
      else {
        this.removeLegacyExtensions();
        this.extensionsService.removeExtensionsByUrl(extUrl);
      }
    });
    this.subscriptions.push(sub);
  }

  getOptionLabel(option: string): string {
    return this.schema.widget?.optionLabels?.[option] || option;
  }

  private toFhirValue(value: any, valueX: string): any {
    return valueX === 'valueInteger' || valueX === 'valuePositiveInt' ? Number(value) : value;
  }

  private removeLegacyExtensions(): void {
    (this.schema.widget?.legacyExtensionUrls || []).forEach((url: string) => {
      this.extensionsService.removeExtensionsByUrl(url);
    });
  }
}
