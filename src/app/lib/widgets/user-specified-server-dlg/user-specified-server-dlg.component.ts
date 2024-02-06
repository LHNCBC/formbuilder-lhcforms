import {Component, ElementRef, ViewChild} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import fhir from 'fhir/r4';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {FHIRServer, FhirService} from '../../../services/fhir.service';
import {fhirPrimitives} from '../../../fhir';
declare var LForms: any;

@Component({
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
  constructor(private fhirService: FhirService, private _http: HttpClient,
              public activeModal: NgbActiveModal, private modalService: NgbModal) {
    this.newServerObj = null;
  }


  validateFHIRUrl(baseUrl) {
    this.message = null;
    this.errorMessage = null;
    this.newServerObj = null;
    const invalidUrlMsg = `You entered an invalid url: ${baseUrl}`;
    try {
      const url = new URL(baseUrl);
      if(!url.origin || !url.origin.match(/^https?:\/\/[^\/]+/i)) {
        this.errorMessage = invalidUrlMsg;
        return;
      }
    }
    catch(err) {
      this.errorMessage = invalidUrlMsg;
      return;
    }

    baseUrl = baseUrl.replace(/\/$/,'');
    const options: any = {};
    options.observe = 'response';
    options.responseType = 'json';
    options.params = (new HttpParams())
      .set('_format', 'json')
      .set('_elements', 'fhirVersion,implementation'); // Gives a small response. Is this reliable?

    this._http.get<fhir.CapabilityStatement>(baseUrl.replace(/\/$/,'')+'/metadata', options)
      .subscribe({
        next: (resp: HttpResponse<fhir.CapabilityStatement>) => {
          let ver: string = null;
          if (resp.status !== 200) {
            this.errorMessage = resp.statusText;
            return;
          }
          const body = resp.body;
          if (body.fhirVersion) {
            ver = LForms.Util._fhirVersionToRelease(body.fhirVersion); // Convert to R4, STU3 etc.
            if (ver === body.fhirVersion) {
              ver = null; // Not converted, unsupported version.
            }
          }
          if (ver) {
            const newServerObj: FHIRServer = {
              id: this.fhirService.fhirServerList.length + 1,
              endpoint: body.implementation?.url || baseUrl,
              desc: body.implementation?.description || '',
              version: ver
            }
            // Remove any trailing slashes.
            newServerObj.endpoint = newServerObj.endpoint.replace(/\/+$/, '');
            this.message = `${baseUrl} was verified to be a FHIR server.`;
            this.newServerObj = newServerObj;
          } else {
            this.errorMessage = `${baseUrl} returned an unsupported FHIR version: ${body.fhirVersion}`;
          }
        },
        error: (error) => {
          console.error(error.message);
          this.errorMessage = 'Unable to confirm that that URL is a FHIR server.';
        }
      });
  }
}
