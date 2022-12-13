/**
 * Handles FHIR initial field interaction in the item level form.
 */
import {HostBinding, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, ElementRef, OnDestroy} from '@angular/core';
import {TableComponent} from '../table/table.component';

@Component({
  selector: 'lfb-initial',
  templateUrl: './../table/table.component.html',
  styleUrls: ['./../table/table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InitialComponent extends TableComponent implements AfterViewInit, DoCheck, OnDestroy {

  // Flag to hide host element
  hideHostElement = false;
  constructor(private elementRef: ElementRef, private cdr: ChangeDetectorRef) {
    super(elementRef, cdr);
  }

  /**
   * Set d-none class to the host element when the flag is set.
   */
  @HostBinding('class.d-none') get dNone() {
    return this.hideHostElement;
  };

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.formProperty.searchProperty('/type').valueChanges.subscribe((type) => {
      // The UI of the component is hidden from the user, but not from the output result.
      // formProperty.visible should be true to keep it part of the result. That flag is generally
      // set based on visibleIf condition in the schema definition.
      this.hideHostElement = (type === 'choice' || type === 'open-choice');
    });
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
