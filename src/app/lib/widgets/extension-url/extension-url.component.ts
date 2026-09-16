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
  templateUrl: './extension-url.component.html',
  styles: [`
    .extension-url-error-icon {
      position: relative;
      top: 0.125rem;
    }
  `]
})
export class ExtensionUrlComponent extends StringComponent {
  readonly errorIcon = faExclamationTriangle;

  /**
   * Return errors that should currently be rendered below the URL field.
   * Dialog-level URL errors are always shown because they can be introduced by
   * edits to another field while the URL control remains pristine.
   */
  get displayedErrors(): typeof this.errors {
    if (this.control.dirty && (this.formProperty.value || this.schema.widget.showEmptyError)) {
      return this.errors;
    }

    return this.errors?.filter((error) =>
      error.code === 'DUPLICATE_EXTENSION_URL' || error.code === 'MANAGED_EXTENSION_URL'
    );
  }

  /**
   * Check whether the URL field has the scope-aware duplicate extension error.
   * @returns True when the field contains a duplicate extension URL error.
   */
  get hasDuplicateUrlError(): boolean {
    return !!this.errors?.some((error) => error.code === 'DUPLICATE_EXTENSION_URL');
  }

  /**
   * Check whether the URL is reserved for a dedicated Form Builder field.
   * @returns True when the general editor must reject the URL.
   */
  get hasManagedUrlError(): boolean {
    return !!this.errors?.some((error) => error.code === 'MANAGED_EXTENSION_URL');
  }

  /** @returns True when the dialog supplied a URL validation error. */
  get hasDialogUrlError(): boolean {
    return this.hasDuplicateUrlError || this.hasManagedUrlError;
  }

  /**
   * Build the unique DOM ID used to associate the URL input with its duplicate error.
   * @returns The duplicate URL error element ID.
   */
  get duplicateErrorId(): string {
    return `duplicate-extension-url-error-${this.id}${this._id}`;
  }

  /** @returns DOM ID used to associate the managed URL error with its input. */
  get managedErrorId(): string {
    return `managed-extension-url-error-${this.id}${this._id}`;
  }

  /** @returns DOM ID of the active dialog-level URL error. */
  get dialogErrorId(): string {
    return this.hasManagedUrlError ? this.managedErrorId : this.duplicateErrorId;
  }
}
