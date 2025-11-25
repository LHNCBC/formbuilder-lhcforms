import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { StringComponent } from '../string/string.component';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { ExtensionsService } from '../../../services/extensions.service';
import { EXTENSION_URL_ENTRY_FORMAT } from '../../constants/constants';

@Component({
  standalone: false,
  selector: 'lfb-entry-format',
  templateUrl: './entry-format.component.html'
})
export class EntryFormatComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {
  entryFormat;

  constructor(private extensionsService: ExtensionsService) {
    super();
  }

  /**
   * Setup required observers
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();

    this.entryFormat = this.extensionsService.getLastExtensionByUrl(EXTENSION_URL_ENTRY_FORMAT);

    if (this.entryFormat && this.entryFormat?.valueString) {
      this.formProperty.setValue(this.entryFormat?.valueString, false);
    }

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
        this.entryFormat = null;
        this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_ENTRY_FORMAT);
      }
    });
    this.subscriptions.push(sub);
  }
}
