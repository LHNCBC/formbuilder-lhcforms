import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { LabelRadioComponent } from '../label-radio/label-radio.component';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  CONDITIONAL_METHOD_ENABLEWHEN, CONDITIONAL_METHOD_ENABLEWHEN_EXPRESSION, CONDITIONAL_METHOD_NONE,
  EXTENSION_URL_ENABLEWHEN_EXPRESSION
 } from '../../constants/constants';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { LabelComponent } from '../label/label.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ExtensionsService } from 'src/app/services/extensions.service';

@Component({
  selector: 'lfb-enable-when-method',
  imports: [ CommonModule, LabelComponent, ReactiveFormsModule ],
  templateUrl: './enable-when-method.component.html',
  styles: []
})
export class EnableWhenMethodComponent extends LabelRadioComponent implements OnInit, AfterViewInit, OnDestroy {
  subscriptions: Subscription [] = [];

  liveAnnouncer = inject(LiveAnnouncer);
  extensionsService = inject(ExtensionsService);
  currentEnableWhenMethod;


  /**
   * Initialize
   */
  ngOnInit(): void {
    super.ngOnInit();
    this.updateUI();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();

    let sub: Subscription;

    sub = this.formProperty.valueChanges.subscribe((val) => {
      const changed = val !== this.currentEnableWhenMethod;

      if (changed) {
        this.currentEnableWhenMethod = val;
        this.formProperty.setValue(val, false);

        if (this.currentEnableWhenMethod === CONDITIONAL_METHOD_ENABLEWHEN) {
          this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_ENABLEWHEN_EXPRESSION);

        } else if (this.currentEnableWhenMethod === CONDITIONAL_METHOD_ENABLEWHEN_EXPRESSION) {
          const enableWhenExpression = this.formProperty.findRoot().getProperty('__$enableWhenExpression').value;
          if (enableWhenExpression) {
            this.extensionsService.updateOrAppendExtensionByUrl(EXTENSION_URL_ENABLEWHEN_EXPRESSION, enableWhenExpression);
          }
        } else {
          this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_ENABLEWHEN_EXPRESSION);
        }
      }
    });
    this.subscriptions.push(sub);
  }

  updateUI() {
    const enableWhen = this.formProperty.searchProperty('enableWhen').value;
    const enableWhenExp = this.extensionsService.getFirstExtensionByUrl(EXTENSION_URL_ENABLEWHEN_EXPRESSION);
    if (Array.isArray(enableWhen) && enableWhen.length > 0) {
      this.formProperty.setValue(CONDITIONAL_METHOD_ENABLEWHEN, false);

    } else if (enableWhenExp) {
      this.formProperty.setValue(CONDITIONAL_METHOD_ENABLEWHEN_EXPRESSION, false);
    }
  }


  /**
   * Angular lifecycle hook
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
