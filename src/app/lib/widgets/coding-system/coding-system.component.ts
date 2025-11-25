import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import { Subscription } from 'rxjs';
import { LfbArrayWidgetComponent } from '../lfb-array-widget/lfb-array-widget.component';

declare var LForms: any;
@Component({
  standalone: false,
  selector: 'lfb-coding-system',
  template: `

      <div class="{{controlWidthClass}} p-0">
        <input autocomplete="off" #codingSystem type="text" [attr.id]="id" placeholder="Search by system or type your own." class="form-control"  />
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

export class CodingSystemComponent extends LfbArrayWidgetComponent implements AfterViewInit, OnDestroy {
  @ViewChild('codingSystem') codingSystem: ElementRef;

  autoComp: any;
  subscriptions: Subscription[] = [];
  autoComplete = true;
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
    const systemLookups = this.formProperty.schema.widget.systemLookups || [];
    this.systemUrls = systemLookups.map((obj: any) => obj.systemUrl);

    // Guard: ensure input element and id are valid before initializing autocomplete
    const inputEl = this.codingSystem?.nativeElement;
    const inputId = inputEl?.id || this.id;
    if (!inputEl || !inputId || inputId === '"' || inputId.trim() === '') {
      return;
    }

    this.autoComp = new LForms.Def.Autocompleter.Prefetch(
      inputId,
      this.systemUrls,
      this.options
    );

    if (this.formProperty.value) {
      this.autoComp.setFieldVal(this.formProperty.value, false);
    }

    // Listen for autocomplete selection and update answerOption.valueCoding.system
    LForms.Def.Autocompleter.Event.observeListSelections(inputId, (data) => {
      if (data && typeof data.final_val === 'string') {
        if (this.formProperty) {
          const current = this.formProperty.value || {};
          this.formProperty.setValue(data.final_val, false);
          this.autoComp.setFieldVal(data.final_val, false);
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
    this.subscriptions.forEach((s) => {
      if(s) {
        s.unsubscribe();
      }
    });
  }
}



