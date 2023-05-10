import { Component, OnInit } from '@angular/core';
import {StringComponent} from '../string/string.component';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import fhir from 'fhir/r4';
import {Util} from '../../util';

@Component({
  selector: 'lfb-string-with-css',
  templateUrl: './string-with-css.component.html'
})
export class StringWithCssComponent extends StringComponent implements OnInit {

  static RENDERING_STYLE_EXT_URL = 'http://hl7.org/fhir/StructureDefinition/rendering-style';
  cssValue: string;
  name: string;
  elementTypeFieldFormProperty: FormProperty;
  elementTypeFieldValue; any;

  extensionTmpl: fhir.Extension = {
    url: StringWithCssComponent.RENDERING_STYLE_EXT_URL
  };


  constructor() {
    super();
  }


  /**
   * Initialize member variables.
   */
  ngOnInit() {
    super.ngOnInit();
    this.name = this.formProperty.canonicalPathNotation;
    this.elementTypeFieldFormProperty = this.getCorrespondingFieldElementProperty();
    this.elementTypeFieldValue = this.elementTypeFieldFormProperty?.value;
    const ext = Util.findExtensionByUrl(this.elementTypeFieldValue?.extension,
      StringWithCssComponent.RENDERING_STYLE_EXT_URL);
    this.cssValue = ext?.valueString || '';
  }


  /**
   * Handle change of css input
   * @param cssString - new CSS input
   */
  cssChanged(cssString) {
    const ind = Util.findExtensionIndexByUrl(
      this.elementTypeFieldValue.extension, StringWithCssComponent.RENDERING_STYLE_EXT_URL);
    let ext;
    this.cssValue = cssString.trim();
    if(this.cssValue) {
      if(ind < 0) {
        ext = Object.assign({}, this.extensionTmpl);
      }
      else {
        ext = this.elementTypeFieldValue.extension[ind];
      }

      ext.valueString = this.cssValue;
      if(!this.elementTypeFieldValue.extension) {
        this.elementTypeFieldValue.extension = [];
      }
      if(this.elementTypeFieldValue.extension.length === 0) {
        this.elementTypeFieldValue.extension.push(ext);
      }
    }
    else if(ind >= 0) { // Empty value, remove any existing extension.
      this.elementTypeFieldValue.extension.splice(ind, 1);
    }

    this.elementTypeFieldFormProperty.reset(this.elementTypeFieldValue, false);
  }


  /**
   * Get sibling FHIR element type field of this field. Ex: _text for text, _prefix for prefix.
   */
  getCorrespondingFieldElementProperty() {
    let elName = this.formProperty?.canonicalPathNotation?.replace(/^.*\./, '');
    elName = elName ? '_' + elName : null;
    return this.formProperty.parent.getProperty(elName);
  }

  /**
   * Create button label based on css content
   */
  cssButtonLabel() {
    const labelPrefix = (this.cssValue && this.cssValue.trim().length > 0) ? 'Edit' : 'Add';
    return labelPrefix + ' css styles';
  }
}
