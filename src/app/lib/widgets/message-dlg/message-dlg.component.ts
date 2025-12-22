/**
 * General purpose message dialog box.
 */
import { Component, OnInit, Input, inject } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

export enum MessageType {
  INFO,
  WARNING,
  DANGER
}

/**
 * Options for the message dialog.
 */
export interface MessageDlgOptions {
  title?: string;
  message?: string;
  type?: MessageType;
  buttons?: Array<{ label: string; value: any }>;
}

@Component({
  standalone: false,
  selector: 'lfb-message-dlg',
  template: `
    <div role="dialog" aria-labelledby="msgDlgTitle" aria-describedby="msgContent">
      <div class="modal-header bg-primary">
        <h4 class="modal-title text-white" id="msgDlgTitle">{{title}}</h4>
        <button type="button" class="btn-close btn-close-white" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        </button>
      </div>
      <div class="modal-body">
        <div id="msgContent" [innerHTML]="message"></div>
      </div>
      <div class="modal-footer">
        @for(button of buttons; track $index) {
          <button type="button" class="btn btn-primary" (click)="activeModal.close(button.value)">{{button.label}}</button>
        }
      </div>
    </div>
  `,
  styles: [
  ]
})
export class MessageDlgComponent implements OnInit {
  activeModal = inject(NgbActiveModal);



  @Input()
  title?: string;
  @Input()
  message?: string;
  @Input()
  type?: MessageType = MessageType.INFO;
  @Input()
  options?: MessageDlgOptions;

  buttons = [{label: 'Close', value: 'close'}];

  ngOnInit() {
    this.title = this.title || this.options?.title;
    this.message = this.message || this.options?.message;
    this.type = this.type || this.options?.type;
    if(this.options?.buttons?.length) {
      this.buttons = this.options?.buttons;
    }
  }
}


