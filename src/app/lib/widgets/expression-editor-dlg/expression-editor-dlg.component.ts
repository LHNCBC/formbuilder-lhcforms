import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'lfb-expression-editor-dlg',
  templateUrl: './expression-editor-dlg.component.html',
  styles: [
    `::ng-deep .modal-dialog {
      margin: 0;
      min-width: 100%;
      min-height: 100%;
    }`
  ]
})
export class ExpressionEditorDlgComponent {
  private activeModal = inject(NgbActiveModal);

  linkId:string;
  expressionUri: string;
  userExpressionChoices: string;
  questionnaire:any;
  // Display the Expression Editor sections
  display: any;

  /**
   * Close the Rule Editor modal dialog.
   */
  closeRuleEditorDialog() {
    this.activeModal.close(false);
  }

  /**
   * Show a preview of the output questionnaire under the rule editor.
   */
  onSaveRuleEditor(fhirResult): void {
    const fhirPreview = JSON.stringify(fhirResult, null, 2);

    this.activeModal.close(fhirResult);
  }
}

