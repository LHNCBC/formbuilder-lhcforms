import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import fhir from 'fhir/r4';
import {FhirService} from '../../../services/fhir.service';
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

  constructor(
    private fhirService: FhirService,
    public dialogRef: MatDialogRef<PreviewDlgComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewData,
  ) {
    LForms.Util.setFHIRContext(this.fhirService.getSmartClient());
  }
}
