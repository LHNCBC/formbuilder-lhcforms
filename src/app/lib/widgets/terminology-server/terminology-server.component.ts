import { Component, OnInit } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {fhir} from '../../../fhir';

@Component({
  selector: 'lfb-terminology-server',
  templateUrl: './terminology-server.component.html',
  styleUrls: ['./terminology-server.component.css']
})
export class TerminologyServerComponent extends LfbControlWidgetComponent implements OnInit {

  static PREFERRED_TERMINOLOGY_SERVER_URI = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-preferredTerminologyServer';
  yesNo = false;
  url: fhir.uri = null;
  extension: fhir.Extension = {
    url: TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI
  };
  constructor(private extensionService: ExtensionsService) {
    super();
  }

  ngOnInit(): void {
    const url = this.extensionService.getFirstExtensionByUrl(TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI);
    this.formProperty.setValue(url, true);
    this.yesNo = !!this.formProperty.value;
    this.formProperty.valueChanges.subscribe((val) => {
      this.updateExtension();
    });
    this.extensionService.extensionsObservable.subscribe((extensions) => {
      const tsExt = this.extensionService.getFirstExtensionByUrl(TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI);
      if(tsExt && tsExt.valueUri !== this.formProperty.value) {
        this.formProperty.setValue(tsExt.valueUri, true);
      }
    });
  }

  updateExtension() {
    const url = this.formProperty.value;
    if(!!url && this.yesNo) {
      this.extension.valueUri = url;
      this.extensionService.resetExtension(
        TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI,
        this.extension,
        'url',
        false);
    }
    else {
      this.extensionService.removeExtensionsByUrl(TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI);
    }
  }
  onBooleanChange(event: boolean) {
    this.yesNo = event;
    this.updateExtension();
  }
}
