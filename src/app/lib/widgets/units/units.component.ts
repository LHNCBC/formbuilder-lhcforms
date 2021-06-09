import {AfterViewInit, Component, OnInit} from '@angular/core';
import {StringComponent} from '../string/string.component';
import {ArrayProperty, ArrayWidget, FormProperty} from 'ngx-schema-form';
import {LfbArrayWidgetComponent} from '../lfb-array-widget/lfb-array-widget.component';
import {fhir} from '../../../fhir';
import uri = fhir.uri;
import {ExtensionsComponent} from '../extensions/extensions.component';
declare var Def: any;

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
        <input autocomplete="off" type="text" [attr.id]="elementId" placeholder="Search for ucum units or type your own" class="form-control" />
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
export class UnitsComponent extends ExtensionsComponent implements OnInit, AfterViewInit {

  static seqNum = 0;
  elementId = 'units'+UnitsComponent.seqNum++;
  unitsUrl = 'https://clinicaltables.nlm.nih.gov/api/ucum/v3/search?df=cs_code,name,guidance';
  options: any = {
    matchListValue: false,
    maxSelect: '*',
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

  unitExtUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit';
  ucumSystemUrl = 'http://unitsofmeasure.org'


  ngOnInit() {
    super.ngOnInit();
  }


  ngAfterViewInit() {
    this.options.toolTip = this.schema.placeholder;
    // this.options.defaultValue =
    const autoComp = new Def.Autocompleter.Search(this.elementId, this.unitsUrl, this.options);
    // Setup selection handler
    Def.Autocompleter.Event.observeListSelections(this.elementId, (data) => {
      if(data.removed) {
        this.removeExt(this.unitExtUrl, data.final_val); // We are displaying codes for the user.
      }
      else if(data.used_list) {
        const selectedUnit = data.list.find((unit) => {
          return unit[0] === data.item_code;
        });
        this.addExtension(this.createUnitExt(this.ucumSystemUrl, data.item_code, selectedUnit[1]), 'valueCoding');
      }
      else {
        this.addExtension(this.createUnitExt(null, data.final_val, data.final_val), 'valueCoding');
      }
    });

    const initialUnits = (this.extensionsProp.properties as FormProperty[]).filter((p) => {
      return p.value.url === this.unitExtUrl;
    });

    for (let i=0, len=initialUnits.length; i<len; ++i) {
      const dispVal = initialUnits[i].value.valueCoding.code;
      autoComp.storeSelectedItem(dispVal, dispVal);
      autoComp.addToSelectedArea(dispVal);
    }
  }

  deleteUnit(unit: fhir.Extension): any {
    this.removeExtension(unit);
  }

  createUnitExt(system: fhir.uri, code: string, display: string): fhir.Extension {
    const ret: UnitExtension =
      {
        url: this.unitExtUrl,
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
}
