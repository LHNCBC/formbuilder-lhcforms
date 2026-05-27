import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LfbPopoverComponent } from './lfb-popover.component';

describe('LfbPopoverComponent', () => {
  let component: LfbPopoverComponent;
  let fixture: ComponentFixture<LfbPopoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LfbPopoverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LfbPopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
