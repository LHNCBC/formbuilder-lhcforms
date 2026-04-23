/**
 * Component for general input box
 */
import {
  AfterViewChecked, AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild
} from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { LfbOptionControlWidgetComponent } from '../lfb-option-control-widget/lfb-option-control-widget.component';

@Component({
  standalone: false,
  selector: 'lfb-string',
  templateUrl: './string.component.html'
})
export class StringComponent extends LfbOptionControlWidgetComponent implements OnInit {

  @ViewChild('inputEl') inputElRef: ElementRef;
  showTooltip = true;
  // liveAnnouncer = inject(LiveAnnouncer);

  Array = Array; // To use in templates.

  cdr = inject(ChangeDetectorRef);
  constructor() {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.controlClasses = this.controlClasses || '';
  }

  ngAfterViewChecked() {
    if(this.inputElRef?.nativeElement.clientWidth) {
      this.showTooltip = this.inputElRef.nativeElement.scrollWidth > this.inputElRef.nativeElement.clientWidth;
      this.cdr.detectChanges();
    }
  }

}
