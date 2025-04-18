import {Component, inject, Input} from '@angular/core';
import {FhirService, FHIRServer} from '../../../services/fhir.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {BehaviorSubject} from 'rxjs';

// Search related inputs on the page.
interface State {
  fhirServer: FHIRServer;
}

enum ExportType {
  CREATE,
  UPDATE
}

@Component({
  standalone: false,
  selector: 'lfb-fhir-export-dlg',
  templateUrl: './fhir-export-dlg.component.html',
  styleUrls: ['./fhir-export-dlg.component.css']
})
export class FhirExportDlgComponent {

  private _loading$ = new BehaviorSubject<boolean>(false);
  serverResponse: any;
  error: any;
  @Input()
  questionnaire: any;

  fhirService = inject(FhirService);
  // State of the component.
  private _state: State = {
    fhirServer: this.fhirService.getFhirServer()
  };

  constructor(private activeModal: NgbActiveModal) {
  }

  // Getters and setters
  get loading$() { return this._loading$.asObservable(); }
  get selectedFHIRServer() {return this._state.fhirServer;}
  set selectedFHIRServer(fhirServer: FHIRServer) {
    this.fhirService.setFhirServer(fhirServer);
    this._set({fhirServer});
  }

  /**
   * Set partial properties of search state.
   * @param patch - Partial state fields.
   * @private
   */
  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
  }

  /**
   * Handle dialog close
   * @param value
   */
  close(value: any): void {
    this.activeModal.close(value);
  }
}
