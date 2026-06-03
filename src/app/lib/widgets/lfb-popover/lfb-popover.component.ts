import {Component, ElementRef, Input, OnDestroy, ViewChild} from '@angular/core';

/**
 * A component to show a popover using LfbPopoverDirective.
 */
@Component({
  selector: 'lfb-popover',
  template: `
    <div #lfbPopoverEl class="popover lfb-popover" role="tooltip">
      <div data-popper-arrow class="popover-arrow lfb-popover-arrow"></div>
      @if(title) {
        <div class="popover-header">{{ title }}</div>
      }
      @if(content) {
        <div class="popover-body">{{ content }}</div>
      }
    </div>
  `,
  styles: [`
    .lfb-popover {
      background: #fff;
      border: 1px solid #ccc;
      z-index: 1000;
      min-width: 200px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .lfb-popover-arrow, .lfb-popover-arrow::before {
      width: 8px;
      height: 8px;
      background: inherit;
      z-index: -1;
    }
    .lfb-popover-arrow {
      position: relative;
      visibility: hidden;
    }
    .lfb-popover-arrow::before {
      position: absolute;
      visibility: visible;
      content: '';
      transform: rotate(45deg) !important;
    }
    .lfb-popover[data-popper-placement^="top"] > .lfb-popover-arrow {
      bottom: -4px;
    }
    .lfb-popover[data-popper-placement^="bottom"] > .lfb-popover-arrow {
      top: -4px;
    }
    .lfb-popover[data-popper-placement^="left"] > .lfb-popover-arrow {
      right: -4px;
    }
    .lfb-popover[data-popper-placement^="right"] > .lfb-popover-arrow {
      left: -4px;
    }
  `]
})
export class LfbPopoverComponent {
  static __ID = 0;

  id: number;
  @Input() title = '';
  @Input() content = '';
  visible = false;
  top = '0px';
  left = '0px';

  @ViewChild('lfbPopoverEl', {static: true, read: ElementRef}) popoverElement: ElementRef;
  constructor() {
    this.id = (LfbPopoverComponent.__ID++);
  }

  get popoverEl(): HTMLElement {
    return this.popoverElement.nativeElement;
  }

  show(x: number, y: number) {
    this.top = `${y}px`;
    this.left = `${x}px`;
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }
}
