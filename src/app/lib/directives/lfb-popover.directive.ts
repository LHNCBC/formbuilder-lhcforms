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

@Directive({
  selector: '[lfbPopover]',
  exportAs: 'lfbPopover'
})
export class LfbPopoverDirective implements OnDestroy {
  @Input('lfbPopoverTitle') popoverTitle = '';
  @Input('lfbPopoverContent') popoverContent = '';
  private popoverRef?: ComponentRef<LfbPopoverComponent>;
  private popperInstance?: PopperInstance;

  constructor(
    private hostEl: ElementRef,
    private vcr: ViewContainerRef
  ) {
  }

  private createPopover() {
    this.popoverRef = this.vcr.createComponent(LfbPopoverComponent);
    this.popoverRef.instance.title = this.popoverTitle;
    this.popoverRef.instance.content = this.popoverContent;

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

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.popoverRef && !this.hostEl.nativeElement.contains(event.target)) {
      this.destroyPopover();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  toggle(event: MouseEvent) {
    if (this.popoverRef) {
      this.destroyPopover();
    }
    else {
      this.createPopover();
    }
  }

  open() {
    if (!this.popoverRef) {
      this.createPopover();
    }
  }

  hide() {
    if (this.popoverRef) {
      this.destroyPopover();
    }
  }

  ngOnDestroy() {
    this.destroyPopover();
  }
}
