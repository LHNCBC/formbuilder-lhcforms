import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { StringComponent } from '../string/string.component';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { Subscription } from 'rxjs';
import { SharedObjectService } from 'src/app/services/shared-object.service';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FormService } from 'src/app/services/form.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'lfb-editable-link-id',
  templateUrl: './editable-link-id.component.html',
  styleUrl: './editable-link-id.component.css'
})
export class EditableLinkIdComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {
  linkId;
  subscriptions: Subscription[] = [];
  errorIcon = faExclamationTriangle;

  constructor(private liveAnnouncer: LiveAnnouncer) {
    super();
  }

  /**
   * Initialize the component
   */
  ngOnInit() {
    super.ngOnInit();
  }

  /**
   * Setup required observers
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();

    const sub = this.formProperty.errorsChanges.subscribe((errors) => {
      this.errors = null;
      if(errors?.length) {
        // For some reason, errors have duplicates. Remove them.
        const errorsObj = {};
        errors.reduce((acc, error) => {
          if ((error.path === "#/linkId" || error.path === "#linkId") && error.code !== "OBJECT_MISSING_REQUIRED_PROPERTY") {
            if (error.code !== "PATTERN" || (error.code === "PATTERN" && this.formProperty.value)) {
              if(!acc[error.code]) {
                acc[error.code] = error;
              }
            }
          }
          return acc;
        }, errorsObj);
        this.errors = Object.values(errorsObj).map((e: any) => {
            const modifiedMessage = null;  
          return {code: e.code, originalMessage: e.message, modifiedMessage};
        });
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Check for errors when the field is focused and announce any existing errors.
   */
  checkForErrors(): void {
    if(this.errors) {
      const combinedErrorMessage = this.errors.reduce((acc, error) => acc + error.originalMessage, '');
      this.liveAnnouncer.announce(combinedErrorMessage);
    }
  }

  /**
   * Clear all subscriptions.
   */
  unsubscribe() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.subscriptions = [];
  }

  /**
   * Implement OnDestroy
   */
  ngOnDestroy() {
    this.unsubscribe();
  }
}
