import {ComponentFixture, TestBed} from "@angular/core/testing";
import { LfbPopoverDirective } from './lfb-popover.directive';
import {Component, ViewChild} from "@angular/core";
import {By} from "@angular/platform-browser";

@Component({
  template: `
    <button lfbPopover #lfbPopover="lfbPopover">utton with popover</button>`,
  imports: [
    LfbPopoverDirective
  ]
}) class TestHostComponent{
  @ViewChild('lfbPopover', {static: false, read: LfbPopoverDirective}) lfbPopover: LfbPopoverDirective;
}

describe('LfbPopoverDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LfbPopoverDirective]
    }).compileComponents();
  });
  beforeEach(async () => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    const directiveEl = fixture.debugElement.query(By.directive(LfbPopoverDirective));
    expect(directiveEl).toBeTruthy();
  });
});
