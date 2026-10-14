import { Component, inject } from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'lfb-loinc-notice',
  templateUrl: './loinc-notice.component.html',
  styleUrls: ['./loinc-notice.component.css']
})
export class LoincNoticeComponent {
  private activeModal = inject(NgbActiveModal);


  acceptedTerms: {acceptedLoinc: boolean, acceptedSnomed: boolean} = {
    acceptedLoinc: false,
    acceptedSnomed: false
  };
  useSnomed = false;

  /**
   * Handle the "use SNOMED CT" checkbox change. If the user unchecks it, any
   * earlier SNOMED terms acceptance is cleared so it can't be submitted by mistake.
   *
   * @param useSnomed - True if the user wants to use SNOMED CT.
   */
  onUseSnomedChange(useSnomed: boolean) {
    this.useSnomed = useSnomed;
    if (!useSnomed) {
      this.acceptedTerms.acceptedSnomed = false;
    }
  }


  /**
   * Close the dialog. If the user accepts, the modal result is the terms they
   * accepted. SNOMED acceptance only counts if the user also chose to use SNOMED
   * CT. If the user declines, the modal result is null.
   *
   * @param accept - True to close with the accepted terms (the Accept button
   *   does this). False to close without accepting.
   */
  close(accept: boolean) {
    if(accept) {
      this.acceptedTerms.acceptedSnomed = this.useSnomed && this.acceptedTerms.acceptedSnomed;
      this.activeModal.close(this.acceptedTerms);
    } else {
      this.activeModal.close(null);
    }
  }
}
