import {AfterViewInit, Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {FormService} from '../../../services/form.service';
import {EXTENSION_URL_QUESTIONNAIRE_HIDDEN} from '../../constants/constants';
import {BooleanRadioComponent} from '../boolean-radio/boolean-radio.component';
import {LabelComponent} from '../label/label.component';

/**
 * Item-level editor for the FHIR questionnaire-hidden extension.
 *
 * The imported extension is not rewritten during initialization. Once the
 * user changes the control, Yes produces the canonical true extension and No
 * removes the extension entirely.
 */
@Component({
  imports: [CommonModule, ReactiveFormsModule, LabelComponent],
  selector: 'lfb-questionnaire-hidden',
  templateUrl: '../boolean-radio/boolean-radio.component.html'
})
export class QuestionnaireHiddenComponent extends BooleanRadioComponent implements AfterViewInit {
  private formService = inject(FormService);

  override ngAfterViewInit() {
    super.ngAfterViewInit();

    const sub = this.formProperty.valueChanges.subscribe((hidden: boolean) => {
      if (this.formService.loading) {
        return;
      }

      this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_QUESTIONNAIRE_HIDDEN);
      if (hidden === true) {
        this.extensionsService.addExtension({
          url: EXTENSION_URL_QUESTIONNAIRE_HIDDEN,
          valueBoolean: true
        }, 'valueBoolean');
      }
    });
    this.subscriptions.push(sub);
  }
}
