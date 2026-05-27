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
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {PREFERRED_TERMINOLOGY_SERVER_URI} from "../../constants/constants";
import {FormService} from "../../../services/form.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, LabelComponent, ReactiveFormsModule],
  selector: 'lfb-terminology-server',
  templateUrl: './terminology-server.component.html',
  styleUrls: ['./terminology-server.component.css']
})
export class TerminologyServerComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  private formService = inject(FormService);
  private extensionService = inject(ExtensionsService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('hint', {read: ElementRef}) hintEl: ElementRef;
  urlValid = true;

  /**
   * Announce hint text. Used on focus event of input element.
   */
  announceHint() {
    this.liveAnnouncer.announce(this.hintEl.nativeElement.textContent);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub = this.formProperty.valueChanges.subscribe((value) => {
      if(this.formService.loading) {
        return;
      }
      this.urlChanged();
    });
    this.subscriptions.push(sub);
  }

  /**
   * Angular event handler for the url input.
   */
  urlChanged() {
    this.updateExtension();
  }

  /**
   * Update the extension with changes in the url value.
   */
  updateExtension() {
    const valueUrl = this.formProperty.value?.trim();
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
