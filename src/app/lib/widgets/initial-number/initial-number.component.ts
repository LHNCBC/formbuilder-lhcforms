import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';
import { Subscription } from 'rxjs';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FormService } from 'src/app/services/form.service';
import { FormControl } from '@angular/forms';
import { InitialNumberDirective } from '../../directives/initial-number.directive';

@Component({
  standalone: false,
  selector: 'lfb-initial-number',
  template: `
      <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}" [class.has-error]="errors">
        <lfb-label *ngIf="!nolabel"
                   [for]="id"
                   [title]="schema.title"
                   [helpMessage]="schema.description"
                   [ngClass]="labelWidthClass + ' ps-0 pe-1'"
        ></lfb-label>
        <input lfbInitialNumber [propType]="propType" [formProperty]="formProperty"
               [attr.readonly]="schema.readOnly?true:null" name="{{name}}"
               [attr.id]="id"
               class="form-control {{controlWidthClass}}" [formControl]="control"
               type="text"
               [attr.placeholder]="schema.placeholder"
               [ngClass]="{invalid: errors}"
               [attr.aria-invalid]="errors">
      </div>
  `
})

export class InitialNumberComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(InitialNumberDirective) customInput!: InitialNumberDirective;
  propType;
  linkId: string;
  control = new FormControl(null);
  subscriptions: Subscription[] = [];
  errorIcon = faExclamationTriangle;
  errors: {code: string, originalMessage: string, modifiedMessage: string} [] = null;
  cdr = inject(ChangeDetectorRef);
  formService = inject(FormService);

  /**
   * Initialize
   */
  ngOnInit(): void {
    this.linkId = this.formProperty.findRoot().getProperty('linkId').value;
  }

  /**
   * Setup required observers
   */
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
            const node  = this.formService.getTreeNodeByLinkId(this.linkId);
            this.formService.updateValidationStatus(node.data.__$treeNodeId, this.linkId, this.formProperty.canonicalPathNotation, this.errors);
            this.formService._validationStatusChanged$.next(null);
          }
        }
      } else {
        const inputValue = this.control.value;

        // Clear the error message
        const node  = this.formService.getTreeNodeByLinkId(this.linkId);
        this.formService.updateValidationStatus(node.data.__$treeNodeId, this.linkId, this.formProperty.canonicalPathNotation, null);
        this.formService._validationStatusChanged$.next(null);

        // If the data is loaded from the file, then update the UI.
        if (this.customInput && inputValue && this.customInput.value === '') {
          setTimeout(() => {
            this.customInput.value = this.control.value;
          });
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