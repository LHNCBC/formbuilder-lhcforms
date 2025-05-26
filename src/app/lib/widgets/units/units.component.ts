import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit
} from '@angular/core';
import {TableComponent} from '../table/table.component';
import { Subscription } from 'rxjs';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { ArrayProperty } from '@lhncbc/ngx-schema-form';
import { UnitService } from 'src/app/services/unit.service';

@Component({
  standalone: false,
  selector: 'lfb-units',
  templateUrl: '../table/table.component.html',
  styleUrls: ['../table/table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitsComponent extends TableComponent implements AfterViewInit, OnInit {
  static questionUnitExtUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit';
  static questionUnitOptionExtUrl = 'http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption';
  static ucumSystemUrl = 'http://unitsofmeasure.org'

  static unitsExtUrl = {
    quantity: UnitsComponent.questionUnitOptionExtUrl,
    decimal: UnitsComponent.questionUnitExtUrl,
    integer: UnitsComponent.questionUnitExtUrl
  };

  valueCodingDataType = ["decimal", "integer", "quantity"];

  newUnit = {
    url: "",
    valueCoding: {
      code: "",
      systemm: "",
      display: ""
    }
  }
  
  extensionsService = inject(ExtensionsService);
  unitService = inject(UnitService);

  initializing = false;
  dataType: string;

  constructor() {
    super();
  }

  /**
   * Angular life cycle event - Initialize attributes.
   */
  ngOnInit() {
    super.ngOnInit();
  }

  /**
   * Setup required observers
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub: Subscription;

    // Handle data if loaded from a file
    this.dataType = this.formProperty.findRoot().getProperty('type').value;
    // if unit extensions are available, then load them into form property
    const unitExts = this.extensionsService.getExtensionsByUrl(UnitsComponent.unitsExtUrl[this.dataType]);
    if (unitExts && unitExts.length > 0) {
      const units: ArrayProperty = this.formProperty as ArrayProperty;
      // clear units
      units.setValue([], false);
      // Loop through each extension and populate the unit.
      unitExts.forEach((unit) => {
        units.addItem(unit);
      });
      if (unitExts.length > 1) {
        this.includeActionColumn = true;
      }

      this.cdr.detectChanges();
    }

    // Handle scenario when switching from one valueCoding data type to another.
    sub = this.formProperty.searchProperty("type")?.valueChanges.subscribe((changedValue) => {
      const isCurrentValueCodingType = this.valueCodingDataType.includes(this.dataType);
      const isNewValueCodingType = this.valueCodingDataType.includes(changedValue);
      this.singleItem = (changedValue === 'quantity') ? false : true;

      if (isCurrentValueCodingType && isNewValueCodingType && this.dataType !== changedValue) {
        this.formProperty.setValue([this.newUnit], false);
        this.dataType = changedValue;
      }
    });

    this.cdr.detectChanges();
  }
}
