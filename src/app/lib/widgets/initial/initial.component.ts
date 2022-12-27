/**
 * Handles FHIR initial field interaction in the item level form.
 */
import {AfterViewInit, ChangeDetectionStrategy, Component, DoCheck} from '@angular/core';
import {TableComponent} from '../table/table.component';

@Component({
  selector: 'lfb-initial',
  templateUrl: './../table/table.component.html',
  styleUrls: ['./../table/table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InitialComponent extends TableComponent implements AfterViewInit, DoCheck {

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.formProperty.searchProperty('/type').valueChanges.subscribe((type) => {
      // The UI of the component is hidden from the user, but not from the output result.
      // formProperty.visible should be true to keep it part of the result. That flag is generally
      // set based on visibleIf condition in the schema definition.
      this.formProperty.schema.widget.id = (type === 'choice' || type === 'open-choice') ? 'hidden' : 'initial';
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
