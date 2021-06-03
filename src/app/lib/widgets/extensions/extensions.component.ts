import { Component, OnInit } from '@angular/core';
import {LfbArrayWidgetComponent} from '../lfb-array-widget/lfb-array-widget.component';
import {ArrayProperty} from 'ngx-schema-form';
import {fhir} from '../../../fhir';
import uri = fhir.uri;

@Component({
  selector: 'lfb-extensions',
  template: ``,
  styles: [
  ]
})
export class ExtensionsComponent extends LfbArrayWidgetComponent implements OnInit {
  extensionsProp: ArrayProperty;
  _extMap: Map<fhir.uri, fhir.Extension []> = new Map();

  constructor() {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.extensionsProp = this.formProperty.searchProperty('extension') as ArrayProperty;
    this.extensionsProp.valueChanges.subscribe();
    this._extMap = this.extensionsProp.value.reduce((acc: Map<uri, any>, ext: fhir.Extension, index: number) => {
      let e: fhir.Extension [] = acc.get(ext.url);
      if(!e) {
        e = [];
        acc.set(ext.url, e);
      }
      e.push(ext);
      return acc;
    }, this._extMap);
  }


  removeExt(url: fhir.uri, code: string, system?: fhir.uri) {
    const i = this.extensionsProp.value.find((ext) => {
      return ext.url === url &&
        ext.valueCoding.code === code &&
        ext.valueCoding.system === system;
    });
    this.removeItem(i);
  }

  removeExtension(ext: fhir.Extension): void {
    this.removeExt(ext.url, ext.valueCoding.code, ext.valueCoding.system);
  }


  addExtension(ext: fhir.Extension) {
    this.extensionsProp.addItem(ext);
  }


}
