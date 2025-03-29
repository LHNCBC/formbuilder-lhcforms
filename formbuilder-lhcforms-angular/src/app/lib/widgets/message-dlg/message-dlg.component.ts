/**
 * General purpose message dialog box.
 */
import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

export enum MessageType {
  INFO,
  WARNING,
  DANGER
}

@Component({
  standalone: false,
  selector: 'lfb-message-dlg',
  template: `
      <div class="modal-header bg-primary">
        <h4 class="modal-title text-white">{{title}}</h4>
        <button type="button" class="btn-close btn-close-white" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        </button>
      </div>
      <div class="modal-body">
        <p>{{message}}</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" (click)="activeModal.close('Close click')">Close</button>
      </div>
  `,
  styles: [
  ]
})
export class MessageDlgComponent {


  @Input()
  title: string;
  @Input()
  message: string;
  @Input()
  type?: MessageType = MessageType.INFO;
  @Input()
  options?: any;


  constructor(public activeModal: NgbActiveModal) {}
}


