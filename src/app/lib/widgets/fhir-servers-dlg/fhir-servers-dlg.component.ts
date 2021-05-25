/**
 * Dialog to select FHIR server from the list of servers.
 */
import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FhirService} from '../../../services/fhir.service';

@Component({
  selector: 'lfb-fhir-servers-dlg',
  template: `
    <div class="modal-header bg-primary text-white">
      <h4 class="modal-title">Choose a FHIR server</h4>
      <button type="button" class="close text-white" aria-label="Close" (click)="dismiss()">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <table class="table table-striped">
        <thead>
        <tr>
          <th scope="col"></th>
          <th scope="col">Fhir Server</th>
          <th scope="col">Description</th>
        </tr>
        </thead>
        <tbody ngbRadioGroup name="fhirServer" [(ngModel)]="selectedServer">
        <tr *ngFor="let fhirServer of fhirServerList; index as i">
          <th scope="row">
            <label ngbButtonLabel><input ngbButton type="radio" [value]="fhirServer"></label>
          </th>
          <td>{{fhirServer.displayName}}</td>
          <td>{{ fhirServer.desc}}</td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="modal-footer btn-group-sm">
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
