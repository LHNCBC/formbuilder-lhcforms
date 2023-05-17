import {Component, Input, OnInit, EventEmitter, Output} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'lfb-loinc-notice',
  templateUrl: './loinc-notice.component.html',
  styleUrls: ['./loinc-notice.component.css']
})
export class LoincNoticeComponent implements OnInit {

  acceptedTerms: {acceptLoinc: boolean, acceptSnomed: boolean} = {
    acceptLoinc: false,
    acceptSnomed: false
  };
  useSnomed: false;
  constructor(private activeModal: NgbActiveModal) { }

  ngOnInit(): void {
  }

  close(accept: boolean) {
    if(accept) {
      this.activeModal.close(this.acceptedTerms);
    } else {
      this.activeModal.close(null);
    }
  }
}
