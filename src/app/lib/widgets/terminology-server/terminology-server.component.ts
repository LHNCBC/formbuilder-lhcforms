import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {LabelComponent} from '../label/label.component';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {PREFERRED_TERMINOLOGY_SERVER_URI} from "../../constants/constants";
import {FormService} from "../../../services/form.service";
import {SharedObjectService} from "../../../services/shared-object.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, LabelComponent],
  selector: 'lfb-terminology-server',
  templateUrl: './terminology-server.component.html',
  styleUrls: ['./terminology-server.component.css']
})
export class TerminologyServerComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  private modelService = inject(SharedObjectService);
  private formService = inject(FormService);
  private extensionService = inject(ExtensionsService);
  private cdr = inject(ChangeDetectorRef);

  valueUrl = '';

  @ViewChild('hint', {read: ElementRef}) hintEl: ElementRef;
  @ViewChild('urlInput', {read: ElementRef}) urlInput: ElementRef;
  urlValid = true;

  /**
   * Announce hint text. Used on focus event of input element.
   */
  announceHint() {
    this.liveAnnouncer.announce(this.hintEl.nativeElement.textContent);
  }

  ngOnInit() {
    super.ngOnInit();
    this.init();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub = this.extensionService.extensionsObservable.subscribe((extensions) => {
      if(this.formService.loading) {
        return;
      }
      this.init();
      this.cdr.detectChanges();
    });
    this.subscriptions.push(sub);
    sub = this.modelService.modelInitialized$.subscribe(model => {
      this.init();
    });
    this.subscriptions.push(sub);

    setTimeout(() => {
      this.urlValid = this.urlInput.nativeElement.checkValidity();
    }, 0);
  }

  init() {
    const tsExt = this.extensionService.getFirstExtensionByUrl(PREFERRED_TERMINOLOGY_SERVER_URI);
    this.valueUrl = tsExt?.valueUrl || '';
  }
  /**
   * Angular event handler for the url input.
   */
  urlChanged() {
    this.urlValid = this.urlInput.nativeElement.checkValidity();
    this.updateExtension();
  }

  /**
   * Update the extension with changes in the url value.
   */
  updateExtension() {
    const valueUrl = this.valueUrl.trim();
    if(valueUrl) {
      const tsExt = this.extensionService.updateExtension({url: PREFERRED_TERMINOLOGY_SERVER_URI, valueUrl});
      this.extensionService.resetExtension(
        tsExt.url,
        tsExt,
        'valueUrl',
        false);
    }
    else {
      this.extensionService.removeExtensionsByUrl(PREFERRED_TERMINOLOGY_SERVER_URI);
    }
  }
}
