/**
 * Customize spinner to disable interaction while the spinner is on.
 */
import {Component, Input, OnChanges, SimpleChanges, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal, NgbModalOptions, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: false,
  selector: 'lfb-spinner',
  templateUrl: './lfb-spinner.component.html',
  styleUrls: ['./lfb-spinner.component.css']
})
export class LfbSpinnerComponent implements OnChanges {

  @Input()
  show: boolean;
  @ViewChild('lfbSpinner') templateRef: TemplateRef<any>;

  /**
   * Options for modal dialog. Center the spinner, make background transparent etc.
   */
  modalOptions: NgbModalOptions = {
    keyboard: false,
    backdrop: 'static',
    centered: true,
    backdropClass: 'bg-transparent',
    // This class is mainly to help create selector for
    // .modal-content intended for spinner. .modal-content for spinner is defined in styles.css
    modalDialogClass: 'lfb-spinner'
  };

  modalRef: NgbModalRef;
  constructor(private modalService: NgbModal) { }


  /**
   * Watch input to trigger spinner's action.
   *
   * @param changes - SimpleChanges
   */
  ngOnChanges(changes: SimpleChanges) {
    if(changes.show) {
      if(this.show) {
        this.showSpinner();
      }
      else {
        this.hideSpinner();
      }
    }
  }

  /**
   * Open screen size modal dialog with spinner.
   */
  showSpinner() {
    this.modalRef = this.modalService.open(this.templateRef, this.modalOptions);
  }

  /**
   * Dismiss modal dialog
   */
  hideSpinner() {
    if(this.modalRef) {
      this.modalRef.close(true);
      this.modalRef = null;
    }
  }
}
