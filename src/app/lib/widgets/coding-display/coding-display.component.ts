import {AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild, ElementRef} from '@angular/core';
import fhir from 'fhir/r4';
import {ReactiveFormsModule} from "@angular/forms";
import {FormService} from "../../../services/form.service";
import {LfbControlWidgetComponent} from "../lfb-control-widget/lfb-control-widget.component";

declare var LForms: any;

@Component({
  selector: 'lfb-coding-display',
  imports: [ReactiveFormsModule],
  template: `
    @if(autoComplete) {
      <div class="{{controlWidthClass}} p-0">
        <input autocomplete="off" #codingDisplay type="text" [attr.id]="id" placeholder="Search or type your own" class="form-control form-control-sm"/>
      </div>
    }
    @else {
      <input #manualInput [name]="name" [attr.id]="id" type="text" class="form-control form-control-sm" [formControl]="control"
        placeholder="Type your own">
    }
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

export class CodingDisplayComponent extends LfbControlWidgetComponent implements AfterViewInit, OnDestroy {
  @ViewChild('codingDisplay', { static: false }) codingDisplay!: ElementRef;
  @ViewChild('manualInput', { static: false }) manualInput!: ElementRef;

  private systemLookups: any[] = [];
  static seqNum = 0;
  cdr = inject(ChangeDetectorRef);
  formService = inject(FormService);

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
  autoComplete = false;
  selectedSystem;
  system;

  constructor() {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.systemLookups = this.formProperty.parent.getProperty('system').schema.widget.systemLookups;
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.systemLookups = this.formProperty.parent.getProperty('system').schema.widget.systemLookups;
    let sub = this.formProperty.valueChanges.subscribe((value: any) => {
      if(this.autoComplete) {
        this.autoComp.setFieldVal(value);
      }
    });
    this.subscriptions.push(sub);

    // Initialize system from the current property value BEFORE subscribing,
    // so the BehaviorSubject's initial emission is recognized as "no change".
    this.system = this.formProperty.parent.getProperty('system').value;
    this.selectedSystem = this.systemLookups.find((obj: any) => obj.systemUrl === this.system);
    if (this.selectedSystem) {
      this.autoComplete = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.resetAutocomplete(false);
      }, 0);
    }

    sub = this.formProperty.parent.getProperty('system').valueChanges.subscribe((system) => {
      if(this.formService.loading || this.system === system) {
        return;
      }

      this.system = system;

      this.selectedSystem = this.systemLookups.find((obj: any) => obj.systemUrl === system);
      if (this.selectedSystem) {

          const currentCodingObject = this.formProperty.parent.value;
          currentCodingObject.system = this.system;
          currentCodingObject.display = '';
          currentCodingObject.code = '';
          this.formProperty.parent.reset(currentCodingObject, false);

        this.autoComplete = true;
        this.cdr.detectChanges();
        setTimeout(() => {

          this.resetAutocomplete();
        }, 0);
      } else {
        this.autoComplete = false;
        this.cdr.detectChanges();

        this.destroyAutocomplete();

        if (!this.formProperty.value) {
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
      // this.control.setValue(coding.display);
    } else if (manualEntry) {
      this.formProperty.setValue(coding.display, true);
    }
  };


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
  resetAutocomplete(shouldFocus = true) {
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
    } else if (shouldFocus && this.codingDisplay && this.codingDisplay.nativeElement && !this.codingDisplay.nativeElement.value) {
      this.codingDisplay.nativeElement.focus();
    }

    LForms.Def.Autocompleter.Event.observeListSelections(id, (data) => {
      let code = null;
      if (data.used_list || data.on_list) {
        code = data.item_code;
      }

      const coding = this.formProperty.parent.value;
      coding.code = code;
      coding.display = data.final_val;

      this.updateValueCoding(coding, false);
    });
  }

  /**
   * Clean up before destroy.
   * Destroy autocomplete, unsubscribe all subscriptions.
   */
  ngOnDestroy() {
    this.destroyAutocomplete();
    super.ngOnDestroy();
  }
}
