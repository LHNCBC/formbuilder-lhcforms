import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import fhir from 'fhir/r4';
import {FhirService} from '../../../services/fhir.service';
import {FormService} from '../../../services/form.service';
import {FHIR_VERSIONS, FHIR_VERSION_TYPE} from "../../util";
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
export class PreviewDlgComponent implements OnInit {

  @ViewChild('lhcForm', {read: ElementRef}) wcForm: ElementRef;
  format: FHIR_VERSION_TYPE = 'R4';
  activeTopLevelTabIndex = 0;
  activeFormatTabIndex = 0;
  lformsErrors: string;
  validationErrors: string [];

  constructor(
    public formService: FormService,
    private fhirService: FhirService,
    public dialogRef: MatDialogRef<PreviewDlgComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewData,
  ) {
    LForms.Util.setFHIRContext(this.fhirService.getSmartClient());
  }

  ngOnInit() {
    this.activeTopLevelTabIndex = 0;
    this.activeFormatTabIndex = 0;
  }

  close() {
    this.dialogRef.close();
  }

  /**
   * Access different versions of questionnaire.
   * @param version - 'STU3' | 'R4' and other defined version types in LForms.
   */
  getQuestionnaire(version = 'R4') {
    return this.formService.convertFromR4(this.data.questionnaire, version);
  }

  selectTopLevelTab(index: number) {
    this.activeTopLevelTabIndex = index;
  }

  /**
   * Handle errors from <wc-lhc-form>
   * @param event - event object emitted by wc-lhc-form.
   */
  handleLFormsError(event) {
    this.lformsErrors = event.detail;
    this.runValidations('R4');
  }

  runValidations(format: string) {
    const filterErrors = (issues: fhir.OperationOutcomeIssue[]) => {
      return  issues.filter((iss) => {return iss.severity === 'fatal' || iss.severity === 'error';})
        .map((err) => {
          let str = `${err.severity.charAt(0).toUpperCase()+err.severity.slice(1)}: ${err.diagnostics}`;
          if(err.location) {
            str += ` [${err.location?.join('; ')}]`;
          }
          return str;
        });
    };
    this.fhirService.getValidationErrors(this.getQuestionnaire(format)).subscribe({next: (issues) => {
      this.validationErrors = filterErrors(issues);
    }, error: (httpErrorResponse) => {
        this.validationErrors = filterErrors(httpErrorResponse.error.issue);
      }});
  }
}
