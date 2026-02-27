import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MessageDlgComponent, MessageType } from '../lib/widgets/message-dlg/message-dlg.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(private modalService: NgbModal) {}

  /**
   * Shows a dialog of the specified type (error, warning, info).
   * @param type - The MessageType (DANGER, WARNING, INFO).
   * @param title - The dialog title.
   * @param message - The dialog message.
   * @param buttons - Optional array of dialog buttons.
   */
  showDialog(type: MessageType, title: string, message?: string, buttons?: Array<{ label: string; value: any }>): NgbModalRef {
    const modalRef = this.modalService.open(MessageDlgComponent);
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message || '';
    modalRef.componentInstance.type = type;
    if (buttons) {
      modalRef.componentInstance.buttons = buttons;
    }
    return modalRef;
  }
}
