import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {FormProperty} from '@lhncbc/ngx-schema-form';
import fhir from 'fhir/r4';
// import Def from 'autocomplete-lhc';
import {Subscription} from 'rxjs';
import {LfbArrayWidgetComponent} from '../lfb-array-widget/lfb-array-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {fhirPrimitives} from '../../../fhir';
declare var LForms: any;

interface UnitExtension {
  url: string,
  valueCoding: {
    system?: string,
    code?: string,
    display?: string
  }
}

@Component({
  standalone: false,
  selector: 'lfb-units',
  template: `
    <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
      <lfb-label *ngIf="!nolabel"
                 [for]="elementId"
                 [title]="schema.title"
                 [helpMessage]="schema.description"
                 [ngClass]="labelWidthClass+' ps-0 pe-1'"
      ></lfb-label>
      <div class="{{controlWidthClass}} p-0">
        <input autocomplete="off" type="text" [attr.id]="elementId" placeholder="Search for UCUM units or type your own" class="form-control" />
      </div>
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
export class UnitsComponent extends LfbArrayWidgetComponent implements OnInit, AfterViewInit, OnDestroy {

  static seqNum = 0;
  static questionUnitExtUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit';
  static questionUnitOptionExtUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption';
  static ucumSystemUrl = 'http://unitsofmeasure.org'

  static unitsExtUrl = {
    quantity: UnitsComponent.questionUnitOptionExtUrl,
    decimal: UnitsComponent.questionUnitExtUrl,
    integer: UnitsComponent.questionUnitExtUrl
  }

  elementId: string;
  unitsSearchUrl = 'https://clinicaltables.nlm.nih.gov/api/ucum/v3/search?df=cs_code,name,guidance';
  options: any = {
    matchListValue: false,
    maxSelect: 1,
    suggestionMode: LForms.Def.Autocompleter.USE_STATISTICS,
    autocomp: true,
    tableFormat: true,
    colHeaders: [
      'Unit',
      'Name',
      'Guidance'
    ],
    valueCols: [1]
  }

  autoComp: any;

  dataType = 'string';

  constructor(private extensionsService: ExtensionsService) {
    super();
    this.elementId = 'units'+UnitsComponent.seqNum++;
    this.subscriptions = [];
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.options.toolTip = this.schema.placeholder;
    // Watch item type to setup autocomplete
    let sub = this.formProperty.searchProperty('/type')
      .valueChanges.subscribe((changedValue) => {
      if(this.dataType !== changedValue) {
        if(changedValue === 'quantity') {
          this.extensionsService.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.decimal);
        }
        else if(changedValue === 'decimal' || changedValue === 'integer') {
          this.extensionsService.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.quantity);
        }
        else {
          this.extensionsService.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.decimal);
          this.extensionsService.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.quantity);
        }
        this.options.maxSelect = changedValue === 'quantity' ? '*' : 1;

        if(changedValue === 'quantity' || changedValue === 'decimal' || changedValue === 'integer') {
          this.resetAutocomplete();
        }
        this.dataType = changedValue;
      }
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.valueChanges.subscribe(() => {
      this.resetAutocomplete();
      const initialUnits = this.extensionsService.getExtensionsByUrl(UnitsComponent.unitsExtUrl[this.dataType]) || [];

      for (let i=0, len=initialUnits.length; i<len; ++i) {
        const dispVal = initialUnits[i].valueCoding.display || initialUnits[i].valueCoding.code;
        this.autoComp.storeSelectedItem(dispVal, initialUnits[i].valueCoding.code);
        if(this.options.maxSelect === '*') {
          this.autoComp.addToSelectedArea(dispVal);
        }
        else {
          this.autoComp.setFieldVal(dispVal);
          break;
        }
      }
    });
    this.subscriptions.push(sub);

    // Setup selection handler
    LForms.Def.Autocompleter.Event.observeListSelections(this.elementId, (data) => {
      if(data.removed) {
        this.extensionsService.removeExtension((extProp) => {
          const ext = extProp.value;
          return ext.url === UnitsComponent.unitsExtUrl[this.dataType] &&
            ((ext.valueCoding.code && data.item_code) ?
              ext.valueCoding.code === data.item_code : ext.valueCoding.display === data.final_val)
        });
      }
      else if(this.options.maxSelect === 1 && !(data.final_val?.trim())) {
        this.extensionsService.removeExtension((extProp) => {
          return extProp.value.url === UnitsComponent.unitsExtUrl[this.dataType];
        });
      }
      else if(data.used_list) {
        const selectedUnit = data.list.find((unit) => {
          return unit[0] === data.item_code;
        });
        this.updateUnits(this.createUnitExt(UnitsComponent.unitsExtUrl[this.dataType],
          UnitsComponent.ucumSystemUrl, data.item_code, selectedUnit[1]));
      }
      else {
        const unitExt = this.getUnitExtension();
        if(unitExt?.valueCoding?.display !== data.final_val) {
          this.updateUnits(this.createUnitExt(UnitsComponent.unitsExtUrl[this.dataType],
            null, data.final_val, data.final_val));
        }
      }
    });

  }


  /**
   * Get unit extension.
   */
  getUnitExtension(): fhir.Extension {
    return this.extensionsService.getFirstExtensionByUrl(UnitsComponent.unitsExtUrl[this.dataType]);
  }


  /**
   * Update unit extensions for integer/decimal and quantity types.
   *
   * @param unitExt - Extension object representing the appropriate unit extension.
   */
  updateUnits(unitExt: fhir.Extension) {
    if(this.dataType === 'integer' || this.dataType === 'decimal') {
      this.extensionsService.resetExtension(unitExt.url, unitExt, 'valueCoding', false);
    }
    else if(this.dataType === 'quantity') {
      this.extensionsService.addExtension(unitExt, 'valueCoding');
    }
  }


  /**
   * Destroy autocomplete.
   * Make sure to reset value
   */
  destroyAutocomplete() {
    if(this.autoComp) {
      this.autoComp.setFieldVal('', false); // autoComp.destroy() does not clear the input box for single-select
      this.autoComp.destroy();
      this.autoComp = null;
    }
  }


  /**
   * Destroy and recreate autocomplete.
   */
  resetAutocomplete() {
    this.destroyAutocomplete();
    this.autoComp = new LForms.Def.Autocompleter.Search(this.elementId, this.unitsSearchUrl, this.options);
  }

  /**
   * Create unit extension object
   *
   * @param unitsExtUrl - Extension uri for the associated unit.
   * @param system - System uri of the coding.
   * @param code - Code of the coding.
   * @param display - Display text of the coding.
   */
  createUnitExt(unitsExtUrl: fhirPrimitives.url, system: fhirPrimitives.url, code: string, display: string): fhir.Extension {
    const ret: UnitExtension =
      {
        url: unitsExtUrl,
        valueCoding: {code}
      };

    if(system) {
      ret.valueCoding.system = system;
    }
    if(display) {
      ret.valueCoding.display = display;
    }
    return ret;
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
