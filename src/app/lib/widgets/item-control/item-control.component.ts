import {AfterViewInit, Component, OnInit} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {FormService} from '../../../services/form.service';

@Component({
  selector: 'lfb-item-control',
  templateUrl: './item-control.component.html',
  styleUrls: ['./item-control.component.css']
})
export class ItemControlComponent extends LfbControlWidgetComponent implements OnInit, AfterViewInit {
  static itemControlUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl';

  static autoCompleteCoding = {
    code: 'autocomplete',
    display: 'Auto-complete',
    system: 'http://hl7.org/fhir/questionnaire-item-control'
  };

  static itemControlExtension = {
    url: ItemControlComponent.itemControlUrl,
    valueCodeableConcept: {
      coding: [ItemControlComponent.autoCompleteCoding],
      text: 'Questionnaire Item UI Control Codes' // TODO - Revisit the text
    }
  }
  autoComplete = false;
  // TODO - Revisit the text
  hintMessage = 'Selecting the checkbox makes the answer list an auto-complete input control.';

  constructor(private extensionsService: ExtensionsService, private formService: FormService) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.autoComplete = this.hasAutoCompleteExt();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.formService.formReset$.subscribe(() => {
      this.autoComplete = this.hasAutoCompleteExt();
    });
  }


  /**
   * Check if autocomplete extension is present.
   */
  hasAutoCompleteExt() {
    let ret = false;
    const extensions = this.extensionsService.getExtensionsByUrl(ItemControlComponent.itemControlUrl);
    if(extensions?.length) {
      const codings = extensions[0].valueCodeableConcept.coding;
      if(codings?.length) {
        ret = codings.some((coding) => {
          return coding.code === 'autocomplete';
        })
      }
    }
    return ret;
  }


  /**
   * Handler for checkbox
   * @param event - Angular event (boolean)
   */
  autoCompleteChanged(event) {
    this.autoComplete = event;
    if(event) {
      this.addAutoCompleteExt();
    }
    else {
      this.removeAutoCompleteExt();
    }
  }

  /**
   * Add autocomplete extension, only if it does not exist.
   */
  addAutoCompleteExt() {
    const exts = this.extensionsService.getExtensionsByUrl(ItemControlComponent.itemControlUrl);
    if(exts?.length) {
      // Has item control extension. Check for autocomplete coding.
      const codings = exts[0].valueCodeableConcept.coding;
      const exist = codings.some((coding) => {
        return coding.code === 'autocomplete';
      });

      if(!exist) {
        codings.push(ItemControlComponent.autoCompleteCoding);
      }
    }
    else {
      this.extensionsService.addExtension(ItemControlComponent.itemControlExtension, 'valueCodeableConcept');
    }
  }

  /**
   * Remove autocomplete extension, if exists.
   */
  removeAutoCompleteExt() {
    const exts = this.extensionsService.getExtensionsByUrl(ItemControlComponent.itemControlUrl);
    if(exts?.length) {
      const codings = exts[0].valueCodeableConcept.coding;
      if(codings?.length) {
        // Remove coding if exists
        const i = codings.findIndex((coding) => {
          return coding.code === 'autocomplete';
        });
        if(i >= 0) {
          codings.splice(i, 1);
        }
      }
      if(codings?.length === 0) { // If no other codings exist, remove the extension
        this.extensionsService.removeExtensionsByUrl(ItemControlComponent.itemControlUrl);
      }
    }
  }
}
