import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
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
import {SharedObjectService} from "../../../services/shared-object.service";

@Component({
  selector: 'lfb-enable-when-method',
  imports: [ CommonModule, LabelComponent, ReactiveFormsModule ],
  templateUrl: '../label-radio/label-radio.component.html',
  styles: [`
    span.ms-1 {
      margin-left: 0 !important;
    }
    span.me-3 {
      margin-right: 0 !important;
    }
  `]
})
export class EnableWhenMethodComponent extends LabelRadioComponent implements OnInit, AfterViewInit {

  liveAnnouncer = inject(LiveAnnouncer);
  extensionsService = inject(ExtensionsService);
  modelService = inject(SharedObjectService);
  currentEnableWhenMethod: string;
  updating = false;


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

    // New Questionnaire item is assigned. Reset the component fields and let the formProperty changes be handled in its valueChanges() subscription.
    sub = this.modelService.modelInitialized$.subscribe(() => {
      this.currentEnableWhenMethod = null;
      this.updateUI();
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.valueChanges.subscribe((val) => {
      const changed = val !== this.currentEnableWhenMethod;

      if (changed) {
        this.currentEnableWhenMethod = val;

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
    if(this.updating) {
      return;
    }
    this.updating = true;
    const enableWhen = this.formProperty.searchProperty('enableWhen').value;
    const enableWhenExp = this.extensionsService.getFirstExtensionByUrl(EXTENSION_URL_ENABLEWHEN_EXPRESSION);
    if (Array.isArray(enableWhen) && enableWhen.length > 0) {
      this.formProperty.setValue(CONDITIONAL_METHOD_ENABLEWHEN, false);

    } else if (enableWhenExp) {
      this.formProperty.setValue(CONDITIONAL_METHOD_ENABLEWHEN_EXPRESSION, false);
    }
    else {
      this.formProperty.setValue(CONDITIONAL_METHOD_NONE, false);
    }
    this.updating = false;
  }
}
