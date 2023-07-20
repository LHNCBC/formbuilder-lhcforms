/**
 * Handles FHIR initial field interaction in the item level form.
 */
import {HostBinding, AfterViewInit, ChangeDetectionStrategy, Component, DoCheck} from '@angular/core';
import {TableComponent} from '../table/table.component';

@Component({
  selector: 'lfb-initial',
  templateUrl: './../table/table.component.html',
  styleUrls: ['./../table/table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InitialComponent extends TableComponent implements AfterViewInit, DoCheck {

  // Flag to hide host element
  hideHostElement = false;
  /**
   * Set d-none class to the host element when the flag is set.
   */
  @HostBinding('class.d-none') get dNone() {
    return this.hideHostElement;
  };

  ngAfterViewInit() {
    super.ngAfterViewInit();
    const sub = this.formProperty.searchProperty('/type').valueChanges.subscribe((type) => {
      // The UI of the component is hidden from the user, but not from the output result.
      // formProperty.visible should be true to keep it part of the result. That flag is generally
      // set based on visibleIf condition in the schema definition.
      this.hideHostElement = (type === 'choice' || type === 'open-choice');
    });
    this.subscriptions.push(sub);
  }

  /**
   * Make sure there is at least one item in the table.
   */
  ngDoCheck() {
    if(this.formProperty.properties.length === 0) {
      this.addItem();
    }
  }
}
