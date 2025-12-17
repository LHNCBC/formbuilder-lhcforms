import {AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild, ElementRef, OnInit} from '@angular/core';
import fhir from 'fhir/r4';
import { Subscription } from 'rxjs';
import {LfbArrayWidgetComponent} from '../lfb-array-widget/lfb-array-widget.component';
import { withComponentInputBinding } from '@angular/router';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { AnswerOptionComponent } from '../answer-option/answer-option.component';

declare var LForms: any;

@Component({
  standalone: false,
  selector: 'lfb-coding-display',
  template: `
      <ng-container *ngIf="autoComplete; else manualEntry">
        <div class="{{controlWidthClass}} p-0">
          <input autocomplete="off" #codingDisplay type="text" [attr.id]="id" placeholder="Search or type your own" class="form-control"/>
        </div>
      </ng-container>
      <ng-template #manualEntry>
        <input #manualInput [name]="name" [attr.id]="id" type="text" class="form-control" [formControl]="control"
          (ngModelChange)="fieldChanged($event)">
      </ng-template>
  `,
  styles: [`
    :host ::ng-deep .autocomp_selected {
      width: 100%;
      border: 0;
      padding: 0;
    }
    :host ::ng-deep .autocomp_selected ul {
      margin: 0;
    }
  `]
})

export class CodingDisplayComponent extends LfbArrayWidgetComponent implements AfterViewInit, OnDestroy {
  @ViewChild('codingDisplay', { static: false }) codingDisplay!: ElementRef;
  @ViewChild('manualInput', { static: false }) manualInput!: ElementRef;

  private systemLookups: any[] = [];
  static seqNum = 0;
  cdr = inject(ChangeDetectorRef);

  options: any = {
    matchListValue: false,
    maxSelect: 1,
    suggestionMode: LForms.Def.Autocompleter.USE_STATISTICS,
    autocomp: true
  }

  fhirOptions: any = {
    fhir: true, // Enable FHIR mode
    minChars: 3, // Minimum characters before search
    showLoadingIndicator: true // Show progress bar
  }

  autoComp: any;
  subscriptions: Subscription[] = [];
  autoComplete = false;
  selectedSystem;
  system;
  initializing = true;

  constructor() {
    super();
  }

  /**
   * Converts systemLookups array to a hash map: { systemUrl: lookupUrl }
   */
  getSystemLookupHash(systemLookups: any): { [key: string]: string } {
    const lookups = systemLookups || [];
    const hash: { [key: string]: string } = {};
    for (const obj of lookups) {
      if (typeof obj.systemUrl === 'string' && typeof obj.lookupUrl === 'string') {
        hash[obj.systemUrl] = obj.lookupUrl;
      }
    }
    return hash;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.systemLookups = this.formProperty.parent.getProperty('system').schema.widget.systemLookups;

    const sub = this.formProperty.parent.getProperty('system').valueChanges.subscribe((system) => {
      if (!system || this.system === system) {
        return;
      }

      if (this.system) {
        this.initializing = false;
      }
      this.system = system;

      this.selectedSystem = this.systemLookups.find((obj: any) => obj.systemUrl === system);
      if (this.selectedSystem) {

        if (!this.initializing) {
          const currentCodingObject = this.formProperty.parent.value;
          currentCodingObject.system = this.system;
          currentCodingObject.display = '';
          currentCodingObject.code = '';
          this.formProperty.parent.reset(currentCodingObject, false);
        }

        this.autoComplete = true;
        this.cdr.detectChanges();
        setTimeout(() => {

          this.resetAutocomplete();
        }, 0);
      } else {
        this.autoComplete = false;
        this.cdr.detectChanges();

        this.destroyAutocomplete();

        if ((!this.control.value && this.formProperty.value) ||
            (this.control.value && !this.formProperty.value)) {
          this.control.setValue(this.formProperty.value);
          this.cdr.markForCheck();
        } else if (!this.formProperty.value) {
          if (this.manualInput && this.manualInput.nativeElement) {
            this.manualInput.nativeElement.focus();
          }
        }
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Updates the parent form property's value and the input control value with the provided FHIR 'Coding' object.
   * If manualEntry is true, resets the parent form property with the coding object.
   * If manualEntry is false, sets the input control value to the coding's display value.
   * Prevents unnecessary resets if the display value has not changed.
   *
   * @param coding - The FHIR 'Coding' object to assign to the parent form property and/or input control.
   * @param manualEntry - If true, indicates the value was entered manually; if false, indicates selection from autocomplete.
   */
  updateValueCoding(coding: fhir.Coding, manualEntry: boolean) {
    if (!manualEntry && this.formProperty.value !== coding.display) {
      this.formProperty.parent.reset(coding, false);
      this.control.setValue(coding.display);
    } else if (manualEntry) {
      this.formProperty.setValue(coding.display, false);
    }
  };

  /**
   * Handle field change event in <input> tag.
   * @param coding - Option value
   */
  fieldChanged(display: string) {
    const coding = this.formProperty.parent.value;
    coding['display'] = display;

    this.updateValueCoding(coding, true);
  }

  /**
   * Destroy autocomplete.
   * Make sure to reset value
   */
  destroyAutocomplete() {
    if(this.autoComp) {
      this.autoComp.setFieldVal('', false);
      // autoComp.destroy() does not clear the input box for single-select
      this.autoComp.destroy();
      this.autoComp = null;
    }
  }

  /**
   * Destroy and recreate autocomplete.
   */
  resetAutocomplete() {
    this.destroyAutocomplete();
    if (!this.selectedSystem) {
      return;
    }

    const id = this.codingDisplay.nativeElement.id;
    const options = (this.selectedSystem.systemUrl === "http://snomed.info/sct") ? this.fhirOptions : this.options;
    this.autoComp = new LForms.Def.Autocompleter.Search(
      id,
      this.selectedSystem.lookupUrl,
      options
    );

    if (this.formProperty.value) {
      this.autoComp.setFieldVal(this.formProperty.value, false);
    } else if (this.codingDisplay && this.codingDisplay.nativeElement && !this.codingDisplay.nativeElement.value) {
      this.codingDisplay.nativeElement.focus();
    }

    LForms.Def.Autocompleter.Event.observeListSelections(id, (data) => {
      let code = null;
      if (data.used_list || data.on_list) {
        code = data.item_code;
      }

      this.updateValueCoding({
        code: code,
        system: this.formProperty.parent.value.system,
        display: data.final_val
      } as fhir.Coding, false);
    });
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
