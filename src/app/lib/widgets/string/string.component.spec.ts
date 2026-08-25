import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringComponent } from './string.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';
import {ElementRef} from '@angular/core';

xdescribe('StringComponent', () => {
  let component: StringComponent;
  let fixture: ComponentFixture<StringComponent>;

  CommonTestingModule.setUpTestBed(StringComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(StringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('StringComponent tooltip overflow', () => {
  let component: StringComponent;

  beforeEach(() => {
    component = Object.create(StringComponent.prototype);
  });

  it('should enable the tooltip for overflowing text without lifecycle deferral', () => {
    component.inputElRef = {
      nativeElement: {clientWidth: 100, scrollWidth: 150}
    } as ElementRef<HTMLInputElement>;

    component.updateTooltipVisibility();

    expect(component.hasOverflow()).toBeTrue();
    expect(component.showTooltip).toBeTrue();
  });

  it('should disable the tooltip when text fits inside the input', () => {
    component.inputElRef = {
      nativeElement: {clientWidth: 100, scrollWidth: 80}
    } as ElementRef<HTMLInputElement>;

    component.updateTooltipVisibility();

    expect(component.hasOverflow()).toBeFalse();
    expect(component.showTooltip).toBeFalse();
  });
});
