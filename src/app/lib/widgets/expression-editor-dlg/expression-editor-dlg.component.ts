import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'lfb-expression-editor-dlg',
  templateUrl: './expression-editor-dlg.component.html',
  styles: [
    `::ng-deep .modal-dialog {
      margin: 0px;
      min-width: 100%;
      min-height: 100%;
    }`
  ]
})
export class ExpressionEditorDlgComponent {
  linkId:string;
  expressionUri = "Output Expression";
  userExpressionChoices: string;
  questionnaire:any;
  // Display the Expression Editor sections
  display: any;
  expressionLabel: string;

  constructor(private activeModal: NgbActiveModal) {};

  /**
   * Close the Expression Editor modal dialog.
   */
  closeExpressionEditorDialog() {
    this.activeModal.close(false);
  }

  /**
   * Show a preview of the output questionnaire under the expression editor.
   */
  onSaveExpressionEditor(fhirResult): void {
    const fhirPreview = JSON.stringify(fhirResult, null, 2);

    this.activeModal.close(fhirResult);
  }
}

