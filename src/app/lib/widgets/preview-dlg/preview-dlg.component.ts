import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import fhir from 'fhir/r4';
import {FhirService} from '../../../services/fhir.service';
import {FormService} from '../../../services/form.service';
declare var LForms: any;

/**
 * Define data structure for dialog
 */
export interface PreviewData {
  questionnaire: fhir.Questionnaire;
  lfData?: any;
}

@Component({
  selector: 'lfb-preview-dlg',
  templateUrl: './preview-dlg.component.html',
  styleUrls: ['./preview-dlg.component.css']
})
export class PreviewDlgComponent {

  @ViewChild('lhcForm', {read: ElementRef}) wcForm: ElementRef;
  format = 'R4';

  lformsErrors: string;

  constructor(
    public formService: FormService,
    private fhirService: FhirService,
    public dialogRef: MatDialogRef<PreviewDlgComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewData,
  ) {
    LForms.Util.setFHIRContext(this.fhirService.getSmartClient());
  }

  close() {
    this.dialogRef.close();
  }

  /**
   * Access different versions of questionnaire.
   * @param version - 'STU3' | 'R4' and other defined version types in LForms.
   */
  getFormat(version = 'R4') {
    return this.formService.convertFromR4(this.data.questionnaire, version);
  }

  /**
   * Handle errors from <wc-lhc-form>
   * @param event - event object emitted by wc-lhc-form.
   */
  handleLFormsError(event) {
    this.lformsErrors = event.detail;
  }
}
