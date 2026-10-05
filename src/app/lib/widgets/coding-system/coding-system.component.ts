import {AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import {LfbControlWidgetComponent} from "../lfb-control-widget/lfb-control-widget.component";
import {FormService} from '../../../services/form.service';
import {getAllowedSystemLookups} from './coding-system-lookup';

declare var LForms: any;
@Component({
  standalone: true,
  selector: 'lfb-coding-system',
  imports: [MatTooltipModule],
  template: `
      <div class="{{controlWidthClass}} p-0">
        <input autocomplete="off" #codingSystem type="text" [attr.id]="id"
               [matTooltip]="'Select a system or type your own.'"
               placeholder="Select a system or type your own."
               class="form-control form-control-sm"  />
      </div>
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

export class CodingSystemComponent extends LfbControlWidgetComponent implements AfterViewInit, OnDestroy {
  @ViewChild('codingSystem') codingSystem: ElementRef;

  private formService = inject(FormService);

  autoComp: any;
  systemUrls: string[] = [];

  options: any = {
    matchListValue: false,
    maxSelect: 1,
    suggestionMode: LForms.Def.Autocompleter.USE_STATISTICS,
    showLoadingIndicator: false,
    autocomp: true
  }

  constructor() {
    super();
  }

  ngAfterViewInit() {
    const systemLookups = getAllowedSystemLookups(
      this.formProperty.schema.widget.systemLookups,
      this.formService.isSnomedUser()
    );
    this.systemUrls = systemLookups.map((obj: any) => obj.systemUrl);

    // Guard: ensure input element and id are valid before initializing autocomplete
    const inputEl = this.codingSystem?.nativeElement as HTMLInputElement;
    const inputId = this.id;
    if (!inputEl || !inputId || inputId.trim() === '') {
      return;
    }

    this.autoComp = new LForms.Def.Autocompleter.Prefetch(
      inputId,
      this.systemUrls,
      this.options
    );


    const sub = this.formProperty.valueChanges.subscribe((value) => {
      if(inputEl.value !== value) {
        this.autoComp.setFieldVal(this.formProperty.value, false);
      }
    });
    this.subscriptions.push(sub);

    // Listen for autocomplete selection and update answerOption.valueCoding.system
    LForms.Def.Autocompleter.Event.observeListSelections(inputId, (data) => {
      if (data && typeof data.final_val === 'string') {
        if (this.formProperty) {
          this.formProperty.setValue(data.final_val, false);
        }
      }
    });
  }

  /**
   * Destroy autocomplete.
   * Make sure to reset value
   */
  destroyAutocomplete() {
    if(this.autoComp) {
      this.autoComp.setFieldVal('', false);
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
    super.ngOnDestroy();
  }
}


