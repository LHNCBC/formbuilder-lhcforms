import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { StringComponent } from '../string/string.component';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { ExtensionsService } from '../../../services/extensions.service';
import { EXTENSION_URL_ENTRY_FORMAT } from '../../constants/constants';
import {LabelComponent} from "../label/label.component";
import {NgClass} from "@angular/common";
import {ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'lfb-entry-format',
  imports: [ReactiveFormsModule, NgClass, LabelComponent],
  templateUrl: './entry-format.component.html'
})
export class EntryFormatComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {
  private extensionsService = inject(ExtensionsService);

  /**
   * Setup required observers
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();

    let sub = this.formProperty.valueChanges.subscribe((entryFormValue: string) => {
      if (entryFormValue) {
        const ext = {
          url: EXTENSION_URL_ENTRY_FORMAT,
          valueString: entryFormValue
        }
        this.extensionsService.resetExtension(
          EXTENSION_URL_ENTRY_FORMAT,
          ext,
          'valueString',
          false);

      } else {
        this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_ENTRY_FORMAT);
      }
    });
    this.subscriptions.push(sub);
  }
}
