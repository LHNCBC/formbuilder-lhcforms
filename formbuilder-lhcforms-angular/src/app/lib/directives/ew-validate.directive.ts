import {Directive, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import {Subscription} from 'rxjs';

/**
 * Check for enable when validation errors. Intended to be used on
 * elements in the scope of fields defined in enableWhen, such as
 * question, operator, and answer[x] fields.
 */
@Directive({
  standalone: false,
  selector: '[lfbEWValidate]'
})
export class EwValidateDirective implements OnChanges, OnDestroy {

  @Input()
  formProperty: FormProperty;
  @Output()
  isError: EventEmitter<boolean> = new EventEmitter<boolean>();
  subscriptions: Subscription [] = [];
  constructor() { }

  /**
   * Handle @input changes.
   */
  ngOnChanges(changes: SimpleChanges) {
    this.unsubscribe();
    const sub = changes.formProperty.currentValue.errorsChanges.subscribe(() => {
      this.validate();
    });
    this.subscriptions.push(sub);
  }

  /**
   * Validate form property errors. Look for only ENABLEWHEN* errors.
   */
  validate() {
      let ret = this.formProperty?._errors?.reduce((acc, error) => {
        if(error.code?.startsWith('ENABLEWHEN')) {
          acc.push(error.message);
        }
        return acc;
      }, []);
      ret = ret?.length ? ret : null;
      this.isError.emit(!ret);
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
