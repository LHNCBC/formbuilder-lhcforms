import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {Subscription} from 'rxjs';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {LabelComponent} from '../label/label.component';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, LabelComponent],
  selector: 'lfb-terminology-server',
  templateUrl: './terminology-server.component.html',
  styleUrls: ['./terminology-server.component.css']
})
export class TerminologyServerComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {

  static PREFERRED_TERMINOLOGY_SERVER_URI = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-preferredTerminologyServer';
  subscriptions: Subscription[] = [];
  tsExtension: fhir4.Extension = {
    url: TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI,
    valueUrl: ''
  }

  @ViewChild('hint', {read: ElementRef}) hintEl: ElementRef;
  @ViewChild('urlInput', {read: ElementRef}) urlInput: ElementRef;
  urlValid = true;

  constructor(private extensionService: ExtensionsService, private liveAnnouncer: LiveAnnouncer) {
    super();
  }

  /**
   * Announce hint text. Used on focus event of input element.
   */
  announceHint() {
    this.liveAnnouncer.announce(this.hintEl.nativeElement.textContent);
  }

  ngOnInit() {
    super.ngOnInit();
    const ext = this.extensionService.getFirstExtensionByUrl(TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI);
    if(ext?.valueUrl) {
      this.tsExtension.valueUrl = ext.valueUrl;
    }
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    const subscription = this.extensionService.extensionsObservable.subscribe((extensions) => {
      const tsExt = this.extensionService.getFirstExtensionByUrl(TerminologyServerComponent.PREFERRED_TERMINOLOGY_SERVER_URI);
      if(tsExt?.valueUrl) {
        this.tsExtension.valueUrl = tsExt.valueUrl;
      }
      else {
        this.tsExtension.valueUrl = '';
      }
    });
    setTimeout(() => {
      this.urlValid = this.urlInput.nativeElement.checkValidity();
    }, 0);
    this.subscriptions.push(subscription);
  }

  /**
   * Angular event handler for the url input.
   * @param url - The value emitted.
   */
  urlChanged(url) {
    this.urlValid = this.urlInput.nativeElement.checkValidity();
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
