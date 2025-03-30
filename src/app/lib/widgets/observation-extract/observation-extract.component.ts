import {Component, OnInit} from '@angular/core';
import fhir from 'fhir/r4';
import {Subscription} from 'rxjs';
import {ExtensionsService} from '../../../services/extensions.service';
import {BooleanRadioComponent} from '../boolean-radio/boolean-radio.component';
import {fhirPrimitives} from '../../../fhir';

@Component({
  standalone: false,
  selector: 'lfb-observation-extract',
  template: `
    <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
      <lfb-label *ngIf="!nolabel"
                 [for]="elementId"
                 [title]="schema.title"
                 [helpMessage]="schema.description"
                 [ngClass]="labelClasses"
                 [labelId]="'label_rg_'+elementId"
      ></lfb-label>

      <div class="{{controlClasses}}">

        <div class="btn-group btn-group-sm" role="radiogroup" [attr.aria-labelledby]="'label_rg_'+elementId" [attr.id]="elementId">
          <ng-container *ngFor="let option of ['No', 'Yes']">
            <input type="radio" class="btn-check"
                   name="value"
                   [attr.id]="'radio_'+option+'_'+elementId"
                   [value]="option === 'Yes'"
                   [ngModelOptions]="{standalone: true}"
                   [ngModel]="value"
                   (ngModelChange)="onBooleanChange($event)"
                   [attr.disabled]="schema.readOnly ? '' : null">
            <label class="btn btn-sm btn-outline-success m-auto" [attr.for]="'radio_'+option+'_'+elementId">
              {{option}}
            </label>
          </ng-container>
        </div>
        <div *ngIf="value">
          <div *ngIf="!codePresent" class="row mt-1 ms-auto me-auto">
            <p class="alert alert-warning mt-1" role="alert">Extraction to FHIR Observations requires a code assigned to this item. Please enter a code before setting this field.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: []
})
export class ObservationExtractComponent extends BooleanRadioComponent implements OnInit {
  static extUrl: fhirPrimitives.url = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-observationExtract';
  static seqNum = 0;
  elementId: string;
  subscriptions: Subscription [];
  value: boolean;
  codePresent: boolean;
  adjustVAlignClass = 'd-flex';

  constructor(private extensionsService: ExtensionsService) {
    super();
    this.elementId = 'observationExtract_'+ObservationExtractComponent.seqNum++;
    this.subscriptions = [];
  }

  /**
   * Read extension and initialize properties.
   */
  ngOnInit() {
    super.ngOnInit();
    this.setValue();
    this.extensionsService.extensionsObservable.subscribe(() => {
      this.setValue();
    });
    // Watch code for warning.
    this.formProperty.root.getProperty('code').valueChanges.subscribe((code) => {
      this.codePresent = code?.length > 0 && code[0]?.code?.trim().length > 0;
      this.adjustVAlignClass = !this.codePresent && this.value ? '' : 'd-flex';
      this.updateExtension();
    });
  }

  /**
   * Set value based on extension.
   */
  setValue() {
    const oeExt = this.getExtension();
    this.value = oeExt ? oeExt.valueBoolean : false;
  }
  /**
   * Get extension object.
   */
  getExtension(): fhir.Extension {
    const ext = this.extensionsService.getExtensionsByUrl(ObservationExtractComponent.extUrl);
    return ext && ext.length > 0 ? ext[0] : null;
  }

  /**
   * Handle radio buttons for yes/no.
   * @param event - Angular event.
   */
  onBooleanChange(event: boolean) {
    this.value = event;
    this.adjustVAlignClass = !this.codePresent && this.value ? '' : 'd-flex';
    if(this.value && this.codePresent) {
      this.updateExtension();
    }
    else {
      this.extensionsService.removeExtensionsByUrl(ObservationExtractComponent.extUrl);
    }
  }

  /**
   * Update extension in the form property.
   */
  updateExtension() {
    this.reset(this.createExtension(this.value));
  }


  /**
   * Set the extension if the input has a value, otherwise remove if exists.
   * @param ext - fhir.Extension object representing observation extract.
   */
  reset(ext: fhir.Extension) {
    if(ext.valueBoolean) {
      this.extensionsService.resetExtension(ObservationExtractComponent.extUrl, ext, 'valueBoolean', false);
    }
    else {
      this.extensionsService.removeExtensionsByUrl(ext.url);
    }
  }


  /**
   * Create observation link period extension object
   *
   * @param value - Boolean value.
   */
  createExtension(value: boolean): fhir.Extension {
    return {
      valueBoolean: value,
      url: ObservationExtractComponent.extUrl
    };
  }

}
