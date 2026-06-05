import { createPopper, Instance as PopperInstance } from '@popperjs/core';
import {
  Directive,
  Input,
  ElementRef,
  ComponentRef,
  ViewContainerRef,
  OnDestroy,
  HostListener
} from '@angular/core';
import { LfbPopoverComponent } from '../widgets/lfb-popover/lfb-popover.component';

/**
 * Directive to add popover functionality to any element using popper.js for positioning.
 * For some reason, ngx-bootstrap/popover does not work well inside Angular components loaded dynamically.
 * This is workaround using popper.js directly.
 */
@Directive({
  selector: '[lfbPopover]',
  exportAs: 'lfbPopover'
})
export class LfbPopoverDirective implements OnDestroy {
  @Input() lfbPopoverTitle = '';
  @Input() lfbPopoverContent = '';
  private popoverRef?: ComponentRef<LfbPopoverComponent>;
  private popperInstance?: PopperInstance;

  constructor(
    private hostEl: ElementRef,
    private vcr: ViewContainerRef
  ) {
  }

  /**
   * Create popper instance
   * @private
   */
  private createPopover() {
    this.popoverRef = this.vcr.createComponent(LfbPopoverComponent);
    this.popoverRef.instance.title = this.lfbPopoverTitle;
    this.popoverRef.instance.content = this.lfbPopoverContent;

    this.popperInstance = createPopper(
      this.hostEl.nativeElement,
      this.popoverRef.instance.popoverEl,
      {
        placement: 'bottom',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 8]
            }
          },
          {
            name: 'arrow',
            options: {
              padding: 5,
              element: this.popoverRef.location.nativeElement.querySelector(':scope .popover-arrow')
            }
          }
        ]
      }
    );
  }

  private destroyPopover() {
    this.popperInstance?.destroy();
    this.popoverRef?.destroy();
    this.popperInstance = undefined;
    this.popoverRef = undefined;
  }

  /**
   * Click handler to close the popover when clicking outside.
   * @param event
   */
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.popoverRef && !this.hostEl.nativeElement.contains(event.target)) {
      this.destroyPopover();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * API to toggle popover.
   * @param event
   */
  toggle(event: MouseEvent) {
    if (this.popoverRef) {
      this.destroyPopover();
    }
    else {
      this.createPopover();
    }
  }

  /**
   * API to open the popover.
   */
  open() {
    if (!this.popoverRef) {
      this.createPopover();
    }
  }

  /**
   * API to close the popover.
   */
  hide() {
    if (this.popoverRef) {
      this.destroyPopover();
    }
  }

  /**
   * Clean up on destroy.
   */
  ngOnDestroy() {
    this.destroyPopover();
  }
}
