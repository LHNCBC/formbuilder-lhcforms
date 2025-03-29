import {Component, ElementRef, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FHIRServer, FHIRServerValidityResponse, FhirService} from '../../../services/fhir.service';
import {fhirPrimitives} from '../../../fhir';

@Component({
  standalone: false,
  selector: 'lfb-user-server-dlg',
  templateUrl: './user-specified-server-dlg.component.html'
})

export class UserSpecifiedServerDlgComponent {
  inputUrl: fhirPrimitives.url;
  message: string;
  errorMessage: string;
  @ViewChild('inputEl', {read: ElementRef}) inputElRef: ElementRef;
  valid: boolean = null;
  newServerObj: FHIRServer = null;
  constructor(private fhirService: FhirService,
              public activeModal: NgbActiveModal) {
    this.newServerObj = null;
  }


  /**
   * Validate base url and set the UI error messages.
   *
   * @param baseUrl - Base url of a FHIR server.
   *
   */
  validateFHIRUrl(baseUrl: fhirPrimitives.url) {
    this.message = null;
    this.errorMessage = null;
    this.newServerObj = null;
    const invalidUrlMsg = `You entered an invalid url: ${baseUrl}`;

    this.fhirService.validateBaseUrl(baseUrl).subscribe({
      next: (resp: FHIRServerValidityResponse) => {
        if(resp.errorMessage) {
          this.errorMessage = resp.errorMessage.startsWith('Invalid url:') ? invalidUrlMsg : resp.errorMessage;
        } else {
          resp.fhirServer.id = this.fhirService.fhirServerList.length + 1;
          this.newServerObj = resp.fhirServer;
          this.message = `${baseUrl} was verified to be a FHIR server.`;
        }
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  }
}
