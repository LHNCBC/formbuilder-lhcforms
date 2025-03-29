/**
 * Define auto complete options
 */
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  SimpleChanges, OnChanges
} from '@angular/core';
import {Subscription} from 'rxjs';
import fhir from 'fhir/r4';
import {fhirPrimitives} from '../../../fhir';
import integer = fhirPrimitives.integer;
import {HttpParams} from '@angular/common/http';
declare var LForms: any;

export interface FhirOptions {
  fhirServer: fhirPrimitives.url;
  valueSetUri: fhirPrimitives.uri;
  operation?: string;
  count?: number;
}
export interface LhcAutoCompleteOptions {
  url?: fhirPrimitives.url;
  matchListValue?: boolean;
  maxSelect?: integer;
  suggestionMode?: integer;
  autocomp?: boolean;
  showListOnFocusIfEmpty?: boolean;
  sort?: boolean;
  fhir?: boolean;
  search?: (element, count) => Promise<any>;
  toolTip?: string;
}

export interface AutoCompleteOptions {
  acOptions: LhcAutoCompleteOptions;
  fhirOptions?: FhirOptions;
}
export interface AutoCompleteResult {
/**
 * Define result item for auto complete results
 */
  title: string;
  id: string;
}
@Component({
  standalone: true,
  selector: 'lfb-auto-complete',
  template: `
    <input #ac [attr.id]="elId" type="text" autocomplete="off" class="form-control">
  `
})
export class AutoCompleteComponent implements AfterViewInit, OnChanges, OnDestroy {

  static _serialNumber = 0;
  subscriptions: Subscription [] = [];
  @Input()
  model: fhir.Coding;
  @Input()
  options: AutoCompleteOptions;

  @Output()
  removed = new EventEmitter<fhir.Coding>();
  @Output()
  selected = new EventEmitter<fhir.Coding>();
  @ViewChild('ac') acElementRef: ElementRef;
  el: HTMLInputElement;
  autoComp: any;
  elId: string;
  autoCompleteEventsUnsubscribe: () => void;

  constructor() {
    this.elId = 'lfb-auto-complete-' + AutoCompleteComponent._serialNumber++;
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.options && !changes.options.firstChange) {
      this.resetAutocomplete();
    }
  }

  ngAfterViewInit() {
    this.el = this.acElementRef.nativeElement;
    this.resetAutocomplete();
  }

  /**
   * Reset auto-completer with updated options.
   */
  resetAutocomplete() {
    this.destroyAutocomplete();
    if(this.options?.fhirOptions) {
      this.options.acOptions.fhir = true;
      this.options.acOptions.url = this.createValueSetUrl(this.options.fhirOptions);
    }
    this.autoComp = new LForms.Def.Autocompleter.Search(this.el.id, this.options.acOptions.url, this.options.acOptions);
    if(this.model && (this.model.display || this.model.code)) {
      this.autoComp.setFieldVal(this.model.display, false);
      this.autoComp.storeSelectedItem(this.model.display, this.model.code);
    }

    this.autoCompleteEventsUnsubscribe = LForms.Def.Autocompleter.Event.observeListSelections(this.el.id, (data) => {
      let coding = null;
      if(data.removed) {
        this.removed.emit(this.autoComp.getItemData(data.final_val));
      }
      else if(this.options.acOptions.maxSelect === 1 && !(data.final_val?.trim())) {
        this.removed.emit(null);
      }
      else if(data.used_list) {
        coding = this.autoComp.getItemData(data.final_val);
        this.selected.emit(this.convertLHCCoding(coding));
      }
      else {
        const prevDisplay = this.model?.display;
        if(prevDisplay && prevDisplay !== data.final_val.trim()) {
          const display = data.final_val?.trim();
          coding = null;
          if(display) {
            coding = {code: display.replace(/\s+/g, '_'), display};
          }
          this.selected.emit(coding);
        }
      }
    });
  }

  /**
   * Map internal format of an element from ValueSet expansion list, to fhir.Coding
   * @param lhcCoding - Selected object from Internal auto-complete selection.
   */
  convertLHCCoding(lhcCoding: any): fhir.Coding {
    if(!lhcCoding) {
      return null;
    }
    const coding: fhir.Coding = {};
    if(lhcCoding.code) {
      coding.code = lhcCoding.code;
    }
    if(lhcCoding.text) {
      coding.display = lhcCoding.text;
    }
    if(lhcCoding.code_system) {
      coding.system = lhcCoding.code_system;
    }
    return coding;
  }

  /**
   * Format url of the server request based on the request options.
   * @param fhirOptions - Options to make a request to FHIR server.
   */
  createValueSetUrl(fhirOptions: FhirOptions): fhirPrimitives.url {
    let ret = null;
    if(fhirOptions.fhirServer) {
      const baseUrl = fhirOptions.fhirServer.endsWith('/') ? fhirOptions.fhirServer : fhirOptions.fhirServer + '/';
      const url = new URL('ValueSet/'+fhirOptions.operation, baseUrl);
      if(fhirOptions.valueSetUri)  {
        // The valueSetUri is already encoded. URLSearchParams.set() encodes it again. Decode the original.
        url.searchParams.set('url', decodeURIComponent(fhirOptions.valueSetUri));
      }
      ret = url.toString();
    }
    return ret;
  }


  /**
   * Destroy autocomplete.
   * Make sure to reset value
   */
  destroyAutocomplete() {
    if(this.autoCompleteEventsUnsubscribe) {
      this.autoCompleteEventsUnsubscribe();
      this.autoCompleteEventsUnsubscribe = null;
    }
    if(this.autoComp) {
      this.autoComp.setFieldVal('', false); // autoComp.destroy() does not clear the input box for single-select
      this.autoComp.destroy();
      this.autoComp = null;
    }
  }

  /**
   * Clean up before destroy.
   * Destroy autocomplete, unsubscribe all subscriptions.
   */
  ngOnDestroy() {
    this.destroyAutocomplete();
    this.subscriptions.forEach((s) => {
      if(s) {
        s.unsubscribe();
      }
    });
  }
}
