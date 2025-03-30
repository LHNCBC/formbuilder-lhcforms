import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {StringComponent} from '../string/string.component';
import fhir from 'fhir/r4';
import {fhirPrimitives} from '../../../fhir';
import {Util} from '../../util';

@Component({
  standalone: false,
  selector: 'lfb-string-with-css',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './string-with-css.component.html'
})
export class StringWithCssComponent extends StringComponent implements OnInit {

  Util = Util;
  extValObj = {};
  elName: string;
  elementTypeField: fhir.Element;

  constructor() {
    super();
    this.extValObj[Util.RENDERING_STYLE_EXT_URL] = '';
    this.extValObj[Util.RENDERING_XHTML_EXT_URL] = '';
  }


  /**
   * Initialize member variables.
   */
  ngOnInit() {
    super.ngOnInit();
    this.name = this.formProperty.canonicalPathNotation;
    this.elName = '_' + this.name.replace(/^.*\./, '');
    this.elementTypeField = this.formProperty.parent.getProperty(this.elName)?.value;
    if(this.elementTypeField) {
      [Util.RENDERING_STYLE_EXT_URL, Util.RENDERING_XHTML_EXT_URL].forEach((url) => {
        const ext = Util.findExtensionByUrl(this.elementTypeField.extension, url);
        this.extValObj[url] = ext?.valueString || '';
      });
    }
  }


  /**
   * Handle change of css/xhtml extension value input
   * @param extValue - new extension value
   * @param extUrl - Util.RENDERING_STYLE_EXT_URL || Util.RENDERING_XHTML_EXT_URL
   */
  extChanged(extValue: string, extUrl: fhirPrimitives.url) {
    const ind = Util.findExtensionIndexByUrl(this.elementTypeField.extension, extUrl);
    let ext: fhir.Extension;
    this.extValObj[extUrl] = extValue.trim();
    if(this.extValObj[extUrl]) {
      if(ind < 0) {
        ext = {url: extUrl};
        this.elementTypeField.extension.push(ext);
      }
      else {
        ext = this.elementTypeField.extension[ind];
      }
      ext.valueString = this.extValObj[extUrl];
    }
    else if(ind >= 0) { // Empty value, delete the extension.
      this.elementTypeField.extension.splice(ind, 1);
    }

    this.formProperty.parent.getProperty(this.elName)?.reset(this.elementTypeField, false);
  }
}
