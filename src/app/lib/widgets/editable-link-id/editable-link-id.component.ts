import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { StringComponent } from '../string/string.component';
import { Subscription } from 'rxjs';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

@Component({
  standalone: false,
  selector: 'lfb-editable-link-id',
  templateUrl: './editable-link-id.component.html',
  styleUrl: './editable-link-id.component.css'
})
export class EditableLinkIdComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {
  linkId;
  subscriptions: Subscription[] = [];
  errorIcon = faExclamationTriangle;

  constructor() {
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
          if (error.path === "#linkId" && error.code !== "OBJECT_MISSING_REQUIRED_PROPERTY") {
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
