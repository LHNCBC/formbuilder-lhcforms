import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';
import { Subscription } from 'rxjs';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'lfb-initial-number',
  template: `
    <input *ngIf="schema.widget.id ==='hidden'; else notHiddenFieldBlock"
           name="{{name}}" type="hidden" [formControl]="control">
    <ng-template #notHiddenFieldBlock>
      <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}" [class.has-error]="errors">
        <lfb-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelWidthClass + ' ps-0 pe-1'"
        ></lfb-label>
        <input lfbInitialNumber [propType]="propType"
               [attr.readonly]="schema.readOnly?true:null" name="{{name}}"
               [attr.id]="id"
               class="form-control {{controlWidthClass}}" [formControl]="control"
               type="text" [attr.min]="schema.minimum" [attr.max]="schema.maximum" step="any"
               [attr.placeholder]="schema.placeholder"
               [ngClass]="{invalid: errors}"
               [attr.aria-invalid]="errors"
               [attr.maxLength]="schema.maxLength || null"
               [attr.minLength]="schema.minLength || null">
      </div>
    </ng-template>
  `
})

export class InitialNumberComponent extends LfbControlWidgetComponent implements AfterViewInit, OnDestroy {
  propType;
  subscriptions: Subscription[] = [];
  errorIcon = faExclamationTriangle;
  errors: {code: string, originalMessage: string, modifiedMessage: string} [] = null;
  cdr = inject(ChangeDetectorRef);

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.propType = this.formProperty.path.split('/').pop();

    let sub: Subscription;

    sub = this.formProperty.errorsChanges.subscribe((errors) => {
      this.errors = null;
      
      if(errors?.length) {
        const errorsObj = {};
        errors.reduce((acc: {[key: string]: any}, error: any) => {
          if (new RegExp(`^#\/initial\/.*\/${this.propType}$`).test(error.path) && error.code === "PATTERN") {
            if (!acc[error.code]) {
              acc[error.code] = error;
            }
          }
          return acc;
        }, errorsObj);

        if (Object.values(errorsObj).length > 0) {
          this.errors = Object.values(errorsObj).map((e: any) => {
            const modifiedMessage = null;  
            return {code: e.code, originalMessage: e.message, modifiedMessage, path: e.path};
          });

          // In the case of an error, the UI should still display the invalid number (decimal/integer) value.
          // But the value should not be removed from the formProperty.
          if (this.errors) {
            const originalValue = this.control.value;
            if (this.control.dirty && this.control.touched) {
              this.control.markAsUntouched();
              this.control.markAsPristine();

              this.formProperty.setValue(null, false);
              this.cdr.markForCheck();

              this.control.setValue(originalValue, { emitEvent: false });
            }
          }
        }
      } else {
        const inputValue = this.control.value;
        const dataType = this.formProperty.findRoot().getProperty('type').value;
        if (this.formProperty.value) {
          let value;
          if (dataType === "decimal") {
            value = parseFloat(this.formProperty.value);
          } else {
            value = parseInt(this.formProperty.value);   
          }
          if (!isNaN(value)) {
            this.formProperty.setValue(value, false);
            this.control.setValue(inputValue, { emitEvent: false });
          }
        }
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Remove subscriptions before removing the component.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      if(sub) {
        sub.unsubscribe();
      }
    });
  }
}