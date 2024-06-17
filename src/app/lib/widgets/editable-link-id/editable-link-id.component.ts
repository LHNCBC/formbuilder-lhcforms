import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { StringComponent } from '../string/string.component';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { Subscription } from 'rxjs';
import { SharedObjectService } from 'src/app/services/shared-object.service';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FormService } from 'src/app/services/form.service';

@Component({
  selector: 'lfb-editable-link-id',
  templateUrl: './editable-link-id.component.html',
  styleUrl: './editable-link-id.component.css'
})
export class EditableLinkIdComponent extends StringComponent implements OnInit, AfterViewInit, OnDestroy {
  linkId;
  editableLinkId;
  subscriptions: Subscription[] = [];
  questionnaire;
  errorIcon = faExclamationTriangle;
  errors;

  maxLengthErrorMessage = "Link Id cannot be more than 255 characters long.";
  modelService = inject(SharedObjectService);
  formService = inject(FormService);
  extensionsService = inject(ExtensionsService);

  /**
   * Initialize the component
   */
  ngOnInit() {
    super.ngOnInit();
 
    this.linkId = this.extensionsService.extensionsProp.searchProperty('/linkId').value;
    this.editableLinkId = this.extensionsService.extensionsProp.searchProperty('/editableLinkId')?.value;

    if (this.linkId) {
      const node = this.formService.getTreeNodeByLinkId(this.linkId);
  
      // Display the __$editableLinkId if it contains value instead of the linkId
      // so the id that may contain error will be displayed.
      if (node.data?.__$editableLinkId)
        this.formProperty.setValue(node.data?.__$editableLinkId, false);
      else
        this.formProperty.setValue(this.linkId, false);
    }
  }

  /**
   * Setup required observers
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub: Subscription;

    this.formProperty.errorsChanges.subscribe((errors) => {
      this.errors = null;
      if(errors?.length) {
        // For some reason, errors have duplicates. Remove them.
        const errorsObj = {};
        errors.reduce((acc, error) => {
          if(!acc[error.code]) {
            acc[error.code] = error;
          }
          return acc;
        }, errorsObj);
        this.errors = Object.values(errorsObj).map((e: any) => {
            const modifiedMessage = this.modifiedMessages[e.code];  
          return {code: e.code, originalMessage: e.message, modifiedMessage};
        });
      }
    });
  }

  /**
   * LinkId on change event.
   * @param linkId - Selected linkId
   */
  linkIdChanged(linkId: string): void {
    if (linkId && this.linkId !== linkId && !this.errors)  {
      this.formProperty.findRoot().getProperty('linkId').setValue(linkId, false);
    } else if (this.errors) {
      this.formProperty.findRoot().getProperty('__$editableLinkId').setValue(linkId, false);
    }
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
