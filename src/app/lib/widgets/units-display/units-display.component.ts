import {AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import fhir from 'fhir/r4';
import {LfbArrayWidgetComponent} from '../lfb-array-widget/lfb-array-widget.component';
import {ExtensionsService} from '../../../services/extensions.service';
import {fhirPrimitives} from '../../../fhir';
import { UnitsComponent } from '../units/units.component';
import { UnitService } from 'src/app/services/unit.service';

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
  selector: 'lfb-units-display',
  template: `
      <div class="{{controlWidthClass}} p-0">
        <input autocomplete="off" type="text" [attr.id]="elementId" placeholder="Search for UCUM units or type your own" class="form-control" />
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
export class UnitsDisplayComponent extends LfbArrayWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  static seqNum = 0;
  cdr = inject(ChangeDetectorRef);

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
    valueCols: [1],
    wordBoundaryChars: ['/', '.']
  }

  autoComp: any;
  dataType = 'string';
  unitStorage = [];
  
  unitService = inject(UnitService);

  constructor(private extensionsService: ExtensionsService) {
    super();
    this.elementId = 'units'+UnitsComponent.seqNum++;
    this.subscriptions = [];
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.unitService.setUnitStringTokenizer(this.options.wordBoundaryChars);
  };

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.options.toolTip = this.schema.placeholder;

    // Watch item type to setup autocomplete
    let sub = this.formProperty.searchProperty('/type')
      .valueChanges.subscribe((changedValue) => {
      if(this.dataType !== changedValue && this.dataType !== "string") {
        if(changedValue === 'quantity') {
          this.extensionsService.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.decimal);
        }
        else if(changedValue === 'decimal' || changedValue === 'integer') {
          this.extensionsService.removeExtensionsByUrl(UnitsComponent.unitsExtUrl[this.dataType]);
        }
        else {
          this.extensionsService.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.decimal);
          this.extensionsService.removeExtensionsByUrl(UnitsComponent.unitsExtUrl.quantity);
        }
        this.options.maxSelect = changedValue === 'quantity' ? '*' : 1;
        this.unitService.clearUnits();
      }
      if(changedValue === 'quantity' || changedValue === 'decimal' || changedValue === 'integer') {
        this.resetAutocomplete();
      }
      this.dataType = changedValue;
    });
    this.subscriptions.push(sub);

    sub = this.formProperty.parent.valueChanges.subscribe((valueCoding) => {
      if (valueCoding.display) {
        this.addOrUpdateUnitExtension(this.createUnitExt(UnitsComponent.unitsExtUrl[this.dataType],
          valueCoding?.system, valueCoding?.code, valueCoding.display));
      }
    });

    LForms.Def.Autocompleter.Event.observeListSelections(this.elementId, (data) => {    
      const updateUnitFormProperty = (code: string, system: string, display?: string) => {
        if (display !== undefined) {
          this.formProperty.parent.setValue({
            code: code,
            system: system,
            display: display
          }, false);
        }
      };
    
      if (this.options.maxSelect === 1 && !(data.final_val?.trim())) {
        this.extensionsService.removeExtension((extProp) =>
          extProp.value.url === UnitsComponent.unitsExtUrl[this.dataType]
        );
        updateUnitFormProperty('', '', '');
        return;
      }
    
      if (data.used_list || data.on_list) {
        if (data.item_code) {
          const selectedUnit = data.list.find((unit) => unit[0] === data.item_code);
          this.unitService.addUnit(selectedUnit);
          this.addOrUpdateUnitExtension(this.createUnitExt(
            UnitsComponent.unitsExtUrl[this.dataType],
            UnitsComponent.ucumSystemUrl,
            data.item_code,
            selectedUnit[1]
          ));
          updateUnitFormProperty(data.item_code, UnitsComponent.ucumSystemUrl, selectedUnit[1]);
          return;
        }
    
        // Handle manual entry or tokenizer
        const orgFinalVal = data.final_val;
        data.final_val = this.unitService.translateUnitDisplayToCode(data.final_val, data.list);

        const parseResp = this.unitService.validateWithUcumUnit(data.final_val);

        if (parseResp.status === "valid" || (parseResp.status === "invalid" && parseResp.ucumCode)) {
          this.addOrUpdateUnitExtension(this.createUnitExt(
            UnitsComponent.unitsExtUrl[this.dataType],
            UnitsComponent.ucumSystemUrl,
            parseResp.ucumCode,
            parseResp.unit.name
          ));
          updateUnitFormProperty(parseResp.ucumCode, UnitsComponent.ucumSystemUrl, parseResp.unit.name);
        } else {
          this.addOrUpdateUnitExtension(this.createUnitExt(
            UnitsComponent.unitsExtUrl[this.dataType],
            null, null, orgFinalVal
          ));
          updateUnitFormProperty('', '', orgFinalVal);
        }
        return;
      }
    
      // Not using list
      const unitExt = this.getUnitExtension();
      if (unitExt?.valueCoding?.display !== data.final_val) {
        data.final_val = this.unitService.translateUnitDisplayToCode(data.final_val, data.list);

        const parseResp = this.unitService.validateWithUcumUnit(data.final_val);

        if (parseResp.status === "valid" || (parseResp.status === "invalid" && parseResp.ucumCode)) {
          this.addOrUpdateUnitExtension(this.createUnitExt(
            UnitsComponent.unitsExtUrl[this.dataType],
            UnitsComponent.ucumSystemUrl,
            parseResp.ucumCode,
            parseResp.unit.name
          ));
          updateUnitFormProperty(parseResp.ucumCode, UnitsComponent.ucumSystemUrl, parseResp.unit.name);
          this.autoComp.setFieldVal(parseResp.unit.name);

        } else {
          this.addOrUpdateUnitExtension(this.createUnitExt(
            UnitsComponent.unitsExtUrl[this.dataType],
            null, null, data.final_val
          ));
          updateUnitFormProperty('', '', data.final_val);
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
  addOrUpdateUnitExtension(unitExt: fhir.Extension) {
    if(this.dataType === 'integer' || this.dataType === 'decimal') {
      this.extensionsService.resetExtension(unitExt.url, unitExt, 'valueCoding', false);
    }
    else if(this.dataType === 'quantity') {
      // Use the id, for example __$units.0.valueCoding.display, to determine which
      // row the data is being updated. This only applies to 'quantity'.
      const idx = this.unitService.getUnitIndexFromId(this.id);
      const numberOfFormPropertyArray = this.formProperty.findRoot().getProperty('__$units')?.properties?.length ?? 0;
      const extensionLength = this.extensionsService.extensionsProp.value.length;

      if (extensionLength < numberOfFormPropertyArray) {
        this.extensionsService.addExtension(unitExt, 'valueCoding');
      } else if (extensionLength === numberOfFormPropertyArray && idx > -1) {
        const unitExts = this.extensionsService.getExtensionsByUrl(UnitsComponent.questionUnitOptionExtUrl);
        if (unitExts && unitExts.length > idx) {
          unitExts[idx] = unitExt;
          this.extensionsService.replaceExtensions(UnitsComponent.questionUnitOptionExtUrl, unitExts);
        } else {
          this.extensionsService.addExtension(unitExt, 'valueCoding');
        }
      }
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

    if (this.formProperty.value) {
      this.autoComp.setFieldVal(this.formProperty.value, false);
    }
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
