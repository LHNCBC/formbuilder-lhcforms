import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {Subscription} from 'rxjs';
import fhir from '../../../fhir';

@Component({
  selector: 'lfb-terminology-server',
  templateUrl: './terminology-server.component.html',
  styleUrls: ['./terminology-server.component.css']
})
export class TerminologyServerComponent extends LfbControlWidgetComponent implements OnInit, OnDestroy {

  static PREFERRED_TERMINOLOGY_SERVER_URI = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-preferredTerminologyServer';
  subscriptions: Subscription[] = [];
  tsExtension: fhir4.Extension = {
    url: TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI,
    valueUrl: ''
  }

  constructor(private extensionService: ExtensionsService, private cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    const ext = this.extensionService.getFirstExtensionByUrl(TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI);
    if(ext?.valueUrl) {
      this.tsExtension.valueUrl = ext.valueUrl;
    }
    const subscription = this.extensionService.extensionsObservable.subscribe((extensions) => {
      const tsExt = this.extensionService.getFirstExtensionByUrl(TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI);
      if(tsExt?.valueUrl) {
        this.tsExtension.valueUrl = tsExt.valueUrl;
      }
      else {
        this.tsExtension.valueUrl = '';
      }
    });
    this.subscriptions.push(subscription);
  }

  /**
   * Angular event handler for the url input.
   * @param url - The value emitted.
   */
  urlChanged(url) {
    this.tsExtension.valueUrl = url.trim();
    this.updateExtension();
  }

  /**
   * Update the extension with changes in the url value.
   */
  updateExtension() {
    const url = this.tsExtension.valueUrl.trim();
    if(url) {
      this.tsExtension.valueUrl = url;
      this.extensionService.resetExtension(
        this.tsExtension.url,
        this.tsExtension,
        'valueUrl',
        false);
    }
    else {
      this.extensionService.removeExtensionsByUrl(this.tsExtension.url);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
