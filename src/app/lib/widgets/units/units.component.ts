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
import {
  EXTENSION_URL_QUESTIONNAIRE_UNIT, EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
  TYPE_DECIMAL, TYPE_INTEGER, TYPE_QUANTITY
} from '../../constants/constants';

@Component({
  standalone: false,
  selector: 'lfb-units',
  templateUrl: '../table/table.component.html',
  styleUrls: ['../table/table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitsComponent extends TableComponent implements AfterViewInit, OnInit {
  static unitsExtUrl = {
    quantity: EXTENSION_URL_QUESTIONNAIRE_UNIT_OPTION,
    decimal: EXTENSION_URL_QUESTIONNAIRE_UNIT,
    integer: EXTENSION_URL_QUESTIONNAIRE_UNIT
  }

  valueCodingDataType = [TYPE_DECIMAL, TYPE_INTEGER, TYPE_QUANTITY];

  newUnit = {
    url: "",
    valueCoding: {
      code: "",
      systemm: "",
      display: ""
    }
  }

  extensionsService = inject(ExtensionsService);

  constructor() {
    super();
  }

  /**
   * Angular life cycle event - Initialize attributes.
   */
  ngOnInit() {
    super.ngOnInit();
    this.dataType = this.formProperty.findRoot().getProperty('type').value;
  }

  /**
   * Setup required observers
   */
  ngAfterViewInit() {
    super.ngAfterViewInit();
    let sub: Subscription;

    // Handle scenario when switching from one valueCoding data type to another.
    sub = this.formProperty.searchProperty("type")?.valueChanges.subscribe((changedValue) => {
      const isCurrentValueCodingType = this.valueCodingDataType.includes(this.dataType);
      const isNewValueCodingType = this.valueCodingDataType.includes(changedValue);
      this.singleItem = (changedValue !== TYPE_QUANTITY);

      if (isCurrentValueCodingType && isNewValueCodingType && this.dataType !== changedValue) {
        this.formProperty.setValue([this.newUnit], false);
        this.dataType = changedValue;
      }
    });
    this.subscriptions.push(sub);

    this.cdr.detectChanges();
  }
}
