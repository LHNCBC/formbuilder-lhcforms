import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {StringComponent} from '../string/string.component';
import {ArrayProperty, ArrayWidget, FormProperty} from 'ngx-schema-form';
import {LfbArrayWidgetComponent} from '../lfb-array-widget/lfb-array-widget.component';
import {fhir} from '../../../fhir';
import uri = fhir.uri;
import {ExtensionsComponent} from '../extensions/extensions.component';
import Def from 'autocomplete-lhc';
import {Subscription} from "rxjs";

interface UnitExtension {
  url: string,
  valueCoding: {
    system?: string,
    code?: string,
    display?: string
  }
}

@Component({
  selector: 'lfb-units',
  template: `
    <div [ngClass]="{'row': labelPosition === 'left', 'm-0': true}">
      <lfb-label *ngIf="!nolabel"
                 [for]="id"
                 [title]="schema.title"
                 [helpMessage]="schema.description"
                 [ngClass]="labelWidthClass+' pl-0 pr-1'"
      ></lfb-label>
      <div class="{{controlWidthClass}} p-0">
        <input autocomplete="off" type="text" [attr.id]="elementId" placeholder="Search for UCUM units or type your own" class="form-control" />
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .autocomp_selected {
      width: 100%;
      border: 0;
      padding: 0;
    }
    ::ng-deep .autocomp_selected ul {
      margin: 0;
    }
  `]
})
export class UnitsComponent extends ExtensionsComponent implements OnInit, AfterViewInit, OnDestroy {

  static seqNum = 0;
  elementId: string;
  unitsSearchUrl = 'https://clinicaltables.nlm.nih.gov/api/ucum/v3/search?df=cs_code,name,guidance';
  options: any = {
    matchListValue: false,
    maxSelect: 1,
    suggestionMode: Def.Autocompleter.USE_STATISTICS,
    autocomp: true,
    tableFormat: true,
    colHeaders: [
      'Unit',
      'Name',
      'Guidance'
    ],
    valueCols: [0]
  }

  autoComp: Def.Autocompleter;
  static questionUnitExtUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit';
  static questionUnitOptionExtUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption';
  static ucumSystemUrl = 'http://unitsofmeasure.org'

  static unitsExtUrl = {
    quantity: UnitsComponent.questionUnitOptionExtUrl,
    decimal: UnitsComponent.questionUnitExtUrl,
    integer: UnitsComponent.questionUnitExtUrl
  }

  dataType = 'string';
  typePropertySubscription: Subscription;
  propertySubscription: Subscription;

  constructor() {
    super();
    this.elementId = 'units'+UnitsComponent.seqNum++;
  }

  ngAfterViewInit() {
    this.options.toolTip = this.schema.placeholder;
    // Watch item type to setup autocomplete
    this.typePropertySubscription = this.formProperty.searchProperty('/type')
      .valueChanges.subscribe((changedValue) => {
      if(this.dataType !== changedValue) {
        if(changedValue === 'quantity') {
          this.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.decimal);
        }
        else if(changedValue === 'decimal' || changedValue === 'integer') {
          this.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.quantity);
        }
        else {
          this.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.decimal);
          this.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.quantity);
        }
        this.options.maxSelect = changedValue === 'quantity' ? '*' : 1;

        if(changedValue === 'quantity' || changedValue === 'decimal' || changedValue === 'integer') {
          this.resetAutocomplete();
        }
        this.dataType = changedValue;
      }
    });

    this.propertySubscription = this.formProperty.valueChanges.subscribe(() => {
      this.resetAutocomplete();
      const initialUnits = (this.extensionsProp.properties as FormProperty[]).filter((p) => {
        return p.value.url === UnitsComponent.unitsExtUrl[this.dataType];
      });

      for (let i=0, len=initialUnits.length; i<len; ++i) {
        const dispVal = initialUnits[i].value.valueCoding.code;
        this.autoComp.storeSelectedItem(dispVal, dispVal);
        if(this.options.maxSelect === '*') {
          this.autoComp.addToSelectedArea(dispVal);
        }
      }
    });

    // Setup selection handler
    Def.Autocompleter.Event.observeListSelections(this.elementId, (data) => {
      if(data.removed) {
        this.removeExt(UnitsComponent.unitsExtUrl[this.dataType], data.final_val); // We are displaying codes for the user.
      }
      else if(data.used_list) {
        const selectedUnit = data.list.find((unit) => {
          return unit[0] === data.item_code;
        });
        this.addExtension(this.createUnitExt(UnitsComponent.unitsExtUrl[this.dataType], UnitsComponent.ucumSystemUrl, data.item_code, selectedUnit[1]), 'valueCoding');
      }
      else {
        this.addExtension(this.createUnitExt(UnitsComponent.unitsExtUrl[this.dataType], null, data.final_val, data.final_val), 'valueCoding');
      }
    });

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
    this.autoComp = new Def.Autocompleter.Search(this.elementId, this.unitsSearchUrl, this.options);
  }

  /**
   * Delete unit extension object from the extension array.
   * @param unit
   */
  deleteUnit(unit: fhir.Extension): any {
    this.removeExtension(unit);
  }


  /**
   * Create unit extension object
   *
   * @param unitsExtUrl
   * @param system
   * @param code
   * @param display
   */
  createUnitExt(unitsExtUrl: fhir.uri, system: fhir.uri, code: string, display: string): fhir.Extension {
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
    this.typePropertySubscription.unsubscribe();
    this.propertySubscription.unsubscribe();
  }
}
