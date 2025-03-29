import {Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {SelectComponent} from '../select/select.component';
import {RestrictionsComponent} from '../restrictions/restrictions.component';
import {RestrictionOperatorService} from '../../../services/restriction-operator.service';
import {fhirPrimitives} from '../../../fhir';

/**
 * Used to get acceptance from parent component. The parent should subscribe to service
 * and set reject to true to cancel the change.
 */
export interface AcceptChange {
  newValue: string,
  oldValue: string,
  reject: boolean
}


/**
 * Restriction pull down list. Operates based data type selected.
 */
@Component({
  standalone: false,
  selector: 'lfb-restrictions-operator',
  templateUrl: './restrictions-operator.component.html',
  styleUrls: ['./restrictions-operator.component.css']
})
export class RestrictionsOperatorComponent extends SelectComponent implements OnInit {

  options: [];
  model: string;
  disable = false;
  @Output()
  rejectChange = new EventEmitter<{reject: boolean}>();
  @ViewChild('mySelect', {static: true}) mySelect: ElementRef;

  constructor(private operatorService: RestrictionOperatorService) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    // Set model based on the property value.
    this.formProperty.valueChanges.subscribe((opt) => {
      this.model = opt;
    });

    // Select options list based on type.
    this.formProperty.root.getProperty('type').valueChanges.subscribe((type) => {
      this.options = RestrictionsComponent.typeToOptions[type];
    });
  }

  /**
   * Handle model change event.
   * @param event - Angular event object.
   * @param alertSelected - Popover template reference to show alert message.
   */
  modelChanged(event, alertSelected) {
    // Setup acceptance info for any controlling component.
    const rejectChange: AcceptChange = {newValue: event, oldValue: this.model, reject: false};
    this.operatorService.next(rejectChange); // Listener will change reject flag to reject.
    if(rejectChange.reject) {
      // Restore previous value and display alert.
      this.mySelect.nativeElement.value = this.model;
      alertSelected.open();
    }
    else {
      this.model = event;
      this.formProperty.setValue(this.model, false);
    }
    return this.model;
  }

  /**
   * Return option based on uri.
   * @param extUrl - FHIR extension uri.
   */
  getOption(extUrl: fhirPrimitives.url) {
    return RestrictionsComponent.extUrlToOptionsMap[extUrl];
  }
}
