import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { StringComponent } from '../string/string.component';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { ExtensionsService } from '../../../services/extensions.service';
import { EXTENSION_URL_ENTRY_FORMAT } from '../../constants/constants';
import {LabelComponent} from "../label/label.component";
import {NgClass} from "@angular/common";
import {ReactiveFormsModule} from "@angular/forms";
import {FormService} from "../../../services/form.service";

@Component({
  selector: 'lfb-entry-format',
  imports: [ReactiveFormsModule, NgClass, LabelComponent],
  templateUrl: './entry-format.component.html'
})
export class EntryFormatComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {
  private extensionsService = inject(ExtensionsService);
  private formService = inject(FormService);

  /**
   * Setup required observers
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();

    let sub = this.formProperty.valueChanges.subscribe((entryFormValue: string) => {
      if (this.formService.loading) {
        return;
      }

      if (entryFormValue) {
        const ext = {
          url: EXTENSION_URL_ENTRY_FORMAT,
          valueString: entryFormValue
        }
        // Get the last entryFormat form property (if duplicates exist)
        const props = this.extensionsService.getExtensionFormPropertiesByUrl(EXTENSION_URL_ENTRY_FORMAT);
        if (props && props.length > 0) {
          // Update the last entryFormat extension in-place
          props[props.length - 1].reset(ext, false);
        } else {
          this.extensionsService.addExtension(ext, 'valueString');
        }

      } else {
        this.extensionsService.removeExtensionsByUrl(EXTENSION_URL_ENTRY_FORMAT);
      }
    });
    this.subscriptions.push(sub);
  }
}
