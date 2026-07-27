import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringComponent } from './string.component';
import {CommonTestingModule} from '../../../testing/common-testing.module';
import {ChangeDetectorRef, ElementRef} from '@angular/core';

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
  let detectChanges: jasmine.Spy;

  beforeEach(() => {
    component = Object.create(StringComponent.prototype);
    const cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
    detectChanges = cdr.detectChanges;
    component.cdr = cdr;
    component.showTooltip = false;
  });

  it('should update the tooltip state synchronously when text overflows', () => {
    component.inputElRef = {
      nativeElement: {clientWidth: 100, scrollWidth: 150}
    } as ElementRef<HTMLInputElement>;

    component.ngAfterViewChecked();

    expect(component.showTooltip).toBeTrue();
    expect(detectChanges).toHaveBeenCalledTimes(1);
  });

  it('should not trigger another refresh when the overflow state is unchanged', () => {
    component.inputElRef = {
      nativeElement: {clientWidth: 100, scrollWidth: 80}
    } as ElementRef<HTMLInputElement>;

    component.ngAfterViewChecked();

    expect(component.showTooltip).toBeFalse();
    expect(detectChanges).not.toHaveBeenCalled();
  });
});
