import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DOCUMENT} from '@angular/common';

@Component({
  standalone: true,
  selector: 'lfb-snomed',
  imports: [FormsModule],
  templateUrl: './snomed.component.html',
  styleUrls: ['./snomed.component.css']
})
export class SnomedComponent {
  static id = 0;
  url = 'http://localhost:9031/snomed';
  prevUrl = null;
  // thisWin: Window = inject(DOCUMENT).defaultView;
  fbWindow: Window;
  messageFromOpenedWindow = 'No message yet!';
  constructor() {
    console.log('SnomedComponent:contructor()');
    window.addEventListener('message', (event) => {
      if(!this.url.startsWith(event.origin)) {
        return;
      }
      console.log(`Received message from ${event.origin}.`);
      this.messageFromOpenedWindow = `${Date.now()}: Data: ${JSON.stringify(event.data, null, 2)}`;
    });
  }
  invokeFormBuilder(event) {
    const url = new URL(this.url);
    if (!this.fbWindow || this.fbWindow.closed) {
      console.log(`Window closed or null. Opening on ${this.url}`);
      this.fbWindow = window.open(this.url, 'SNOMED_opener');
    } else if (this.prevUrl !== this.url) {
      console.log(`Previous url (${this.prevUrl}) is different. Opening on ${this.url}`);
      this.fbWindow = window.open(this.url, 'SNOMED_opener');
      /* if the resource to load is different,
         then we load it in the already opened secondary window and then
         we bring such window back on top/in front of its parent window. */
      this.fbWindow.focus();
    } else {
      console.log(`Window for ${this.url} exists.`);
      this.fbWindow.focus();
    }
    this.prevUrl = this.url;
    /* explanation: we store the current url in order to compare url
       in the event of another call of this function. */
  }

  invokeCallback(event) {
    const openerUrl = window.document.referrer;
    console.log(`Posting message to ${openerUrl}`);
    if(window.opener && window.opener.postMessage && openerUrl) {
      const data = {id: SnomedComponent.id++, time: Date.now(), message: `Reply from ${window.location.href}`};
      window.opener.postMessage(data, openerUrl);
      console.log(`Data posted (${Date.now()}): ${JSON.stringify(data, null, 2)}`);
    }
  }

  changed(url) {
    this.url = url;
  }
}
