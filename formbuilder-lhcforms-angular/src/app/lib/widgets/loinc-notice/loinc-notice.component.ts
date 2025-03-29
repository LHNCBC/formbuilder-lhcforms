import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'lfb-loinc-notice',
  templateUrl: './loinc-notice.component.html',
  styleUrls: ['./loinc-notice.component.css']
})
export class LoincNoticeComponent {

  acceptedTerms: {acceptedLoinc: boolean, acceptedSnomed: boolean} = {
    acceptedLoinc: false,
    acceptedSnomed: false
  };
  useSnomed: false;
  constructor(private activeModal: NgbActiveModal) { }


  /**
   * Close the dialog after accepting the terms.
   *
   */
  close(accept: boolean) {
    if(accept) {
      this.activeModal.close(this.acceptedTerms);
    } else {
      this.activeModal.close(null);
    }
  }
}
