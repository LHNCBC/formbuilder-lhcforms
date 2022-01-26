/**
 * Dialog to select FHIR server from the list of servers.
 */
import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FHIRServer, FhirService} from '../../../services/fhir.service';
import { UserSpecifiedServerDlgComponent } from '../user-specified-server-dlg/user-specified-server-dlg.component';

@Component({
  selector: 'lfb-fhir-servers-dlg',
  template: `
    <div class="modal-header bg-primary">
      <h4 class="modal-title text-white">Choose a FHIR server</h4>
      <button type="button" class="close" aria-label="Close" (click)="dismiss()">
        <span class="text-white" aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <table class="table table-sm table-striped table-bordered">
        <thead>
        <tr>
          <th scope="col"></th>
          <th scope="col">Fhir Server</th>
          <th scope="col">FHIR Version</th>
          <th scope="col">Description</th>
        </tr>
        </thead>
        <tbody ngbRadioGroup name="fhirServer" [(ngModel)]="selectedServer">
        <tr *ngFor="let fhirServer of fhirServerList; index as i">
          <th scope="row" class="align-middle">
            <label ngbButtonLabel class="m-0 p-0"><input ngbButton type="radio" [value]="fhirServer"></label>
          </th>
          <td class="align-middle">{{fhirServer.endpoint}}</td>
          <td class="align-middle">{{ fhirServer.version}}</td>
          <td class="align-middle">{{ fhirServer.desc}}</td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="modal-footer btn-group-sm border-0">
      <button type="button" class="btn btn-primary" (click)="addFHIRServer()">Add your FHIR server...</button>
      <button type="button" class="btn btn-primary" (click)="continue()">Continue</button>
      <button type="button" class="btn btn-primary" (click)="dismiss()">Cancel</button>
    </div>
  `,
  styles: [
  ]
})
export class FhirServersDlgComponent implements OnInit {

  @Input()
  fhirServerList: any [];
  selectedServer: any;

  constructor(private fhirService: FhirService,
              private modalService: NgbModal,
              private activeModal: NgbActiveModal) {
    this.fhirServerList = this.fhirService.fhirServerList;
    this.selectedServer = this.fhirService.getFhirServer();
  }

  ngOnInit(): void {
  }

  /**
   * Button handler to add user specified FHIR server to the list.
   */
  addFHIRServer() {
    const modalRef = this.modalService.open(UserSpecifiedServerDlgComponent);
    modalRef.result.then((fhirServer: FHIRServer) => {
      if(!this.fhirService.hasFhirServer(fhirServer.endpoint)) {
        this.fhirService.addNewFhirServer(fhirServer);
      }
      this.selectedServer = this.fhirService.getFhirServer();
    }, (cancelled) => {});
  }


  /**
   * Handler for continue button
   */
  continue() {
    this.fhirService.setFhirServer(this.selectedServer);
    this.activeModal.close(true);
  }

  /**
   * Handle dialog dismiss
   */
  dismiss() {
    this.activeModal.close(false);
  }
}
