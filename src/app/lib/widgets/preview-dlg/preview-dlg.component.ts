import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {fhir} from '../../../fhir';

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
    public dialogRef: MatDialogRef<PreviewDlgComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewData,
  ) {}
}
