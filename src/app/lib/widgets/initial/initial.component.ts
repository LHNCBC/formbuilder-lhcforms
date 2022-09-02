/**
 * Handles FHIR initial field interaction in the item level form.
 */
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, ElementRef, OnDestroy} from '@angular/core';
import {TableComponent} from '../table/table.component';

@Component({
  selector: 'lfb-initial',
  templateUrl: './../table/table.component.html',
  styleUrls: ['./../table/table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InitialComponent extends TableComponent implements DoCheck, OnDestroy {

  constructor(private elementRef: ElementRef, private cdr: ChangeDetectorRef) {
    super(elementRef, cdr);
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
