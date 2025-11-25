import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { StringComponent } from '../string/string.component';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { ExtensionsService } from '../../../services/extensions.service';


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

    this.entryFormat = this.extensionsService.getLastExtensionByUrl(ExtensionsService.ENTRY_FORMAT_URI);

    if (this.entryFormat && this.entryFormat?.valueString) {
      this.formProperty.setValue(this.entryFormat?.valueString, false);
    }

    let sub = this.formProperty.valueChanges.subscribe((entryFormValue: string) => {
      if (entryFormValue) {
        const ext = {
          url: ExtensionsService.ENTRY_FORMAT_URI,
          valueString: entryFormValue
        }
        this.extensionsService.resetExtension(
          ExtensionsService.ENTRY_FORMAT_URI,
          ext,
          'valueString',
          false);

      } else {
        this.entryFormat = null;
        this.extensionsService.removeExtensionsByUrl(ExtensionsService.ENTRY_FORMAT_URI);
      }
    });
    this.subscriptions.push(sub);
  }
}
