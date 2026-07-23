import {Component} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {faExclamationTriangle} from '@fortawesome/free-solid-svg-icons';
import {MatTooltipModule} from '@angular/material/tooltip';
import {StringComponent} from '../string/string.component';
import {LabelComponent} from '../label/label.component';
import {LfbDisableControlDirective} from '../../directives/lfb-disable-control.directive';

/** String widget dedicated to the URL field in the general extension dialog. */
@Component({
  selector: 'lfb-extension-url',
  imports: [
    ReactiveFormsModule,
    NgClass,
    FontAwesomeModule,
    MatTooltipModule,
    LabelComponent,
    LfbDisableControlDirective
  ],
  templateUrl: './extension-url.component.html'
})
export class ExtensionUrlComponent extends StringComponent {
  readonly errorIcon = faExclamationTriangle;

  /**
   * Check whether the URL field has the scope-aware duplicate extension error.
   * @returns True when the field contains a duplicate extension URL error.
   */
  get hasDuplicateUrlError(): boolean {
    return !!this.errors?.some((error) => error.code === 'DUPLICATE_EXTENSION_URL');
  }

  /**
   * Build the unique DOM ID used to associate the URL input with its duplicate error.
   * @returns The duplicate URL error element ID.
   */
  get duplicateErrorId(): string {
    return `duplicate-extension-url-error-${this.id}`;
  }
}
