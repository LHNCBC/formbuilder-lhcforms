import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { StringComponent } from '../string/string.component';
import { Subscription } from 'rxjs';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { ExtensionsService } from '../../../services/extensions.service';


interface EntryFormat {
  url: string;
  valueString: string;
}

@Component({
  standalone: false,
  selector: 'lfb-entry-format',
  templateUrl: './entry-format.component.html'
})
export class EntryFormatComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {
  subscriptions: Subscription[] = [];
  entryFormat;

  constructor(private extensionsService: ExtensionsService) {
    super();
  }

  /**
   * Initialize the component
   */
  ngOnInit() {
    super.ngOnInit();
  }

  /**
   * Setup required observers
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();

    this.entryFormat = this.extensionsService.getFirstExtensionByUrl(ExtensionsService.ENTRY_FORMAT);

    if (this.entryFormat && this.entryFormat?.valueString) {
      this.formProperty.setValue(this.entryFormat?.valueString, false);
    }

    let sub = this.formProperty.valueChanges.subscribe((entryFormValue: string) => {
      if (entryFormValue) {
        if (!this.entryFormat) {
          this.entryFormat = {
            url: ExtensionsService.ENTRY_FORMAT 
          };
        }
        this.entryFormat.valueString = entryFormValue;
        this.extensionsService.replaceExtensions(ExtensionsService.ENTRY_FORMAT, [this.entryFormat]);

      } else {
        this.entryFormat = null;
        this.extensionsService.removeExtensionsByUrl(ExtensionsService.ENTRY_FORMAT);
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Clear all subscriptions.
   */
  unsubscribe() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.subscriptions = [];
  }

  /**
   * Implement OnDestroy
   */
  ngOnDestroy() {
    this.unsubscribe();
  }
}
