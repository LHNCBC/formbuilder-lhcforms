import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {IntegerDirective} from './integer.directive';

@Component({
  imports: [IntegerDirective],
  template: `
    <input id="integer" lfbInteger type="number">
    <input id="unsigned" lfbInteger type="number" min="0">
    <input id="positive" lfbInteger type="number" min="1">
    <input id="bounded" lfbInteger type="number" min="2" max="10">
  `
})
class TestHostComponent {}

describe('IntegerDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent]
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  function keydown(inputId: string, key: string, currentValue = ''): KeyboardEvent {
    const input = fixture.nativeElement.querySelector(`#${inputId}`) as HTMLInputElement;
    input.value = currentValue;
    const event = new KeyboardEvent('keydown', {key, cancelable: true});
    input.dispatchEvent(event);
    return event;
  }

  function keyup(inputId: string, key: string, currentValue = ''): KeyboardEvent {
    const input = fixture.nativeElement.querySelector(`#${inputId}`) as HTMLInputElement;
    input.value = currentValue;
    const event = new KeyboardEvent('keyup', {key, cancelable: true});
    input.dispatchEvent(event);
    return event;
  }

  function paste(inputId: string, value: string, currentValue = ''): ClipboardEvent {
    const input = fixture.nativeElement.querySelector(`#${inputId}`) as HTMLInputElement;
    input.value = currentValue;
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', value);
    const event = new ClipboardEvent('paste', {clipboardData: dataTransfer, cancelable: true});
    input.dispatchEvent(event);
    return event;
  }

  it('should allow negative sign for plain integer fields', () => {
    expect(keydown('integer', '-').defaultPrevented).toBeFalse();
  });

  it('should block negative sign for unsigned integer fields', () => {
    expect(keydown('unsigned', '-').defaultPrevented).toBeTrue();
  });

  it('should block negative sign for positive integer fields', () => {
    expect(keydown('positive', '-').defaultPrevented).toBeTrue();
  });

  it('should block plus sign for integer fields', () => {
    expect(keydown('integer', '+').defaultPrevented).toBeTrue();
  });

  it('should not block tab keyup for invalid values', () => {
    expect(keyup('positive', 'Tab', '0').defaultPrevented).toBeFalse();
  });

  it('should not block tab keydown for integer values', () => {
    expect(keydown('positive', 'Tab').defaultPrevented).toBeFalse();
    expect(keydown('positive', 'Tab', '5').defaultPrevented).toBeFalse();
    expect(keydown('positive', 'Tab', '0').defaultPrevented).toBeFalse();
  });

  it('should block appending digits to values with leading zero', () => {
    expect(keydown('integer', '1', '0').defaultPrevented).toBeTrue();
  });

  it('should allow pasted integers within the configured range', () => {
    expect(paste('bounded', '10').defaultPrevented).toBeFalse();
  });

  it('should block pasted integers below min', () => {
    expect(paste('bounded', '1').defaultPrevented).toBeTrue();
  });

  it('should block pasted integers above max', () => {
    expect(paste('bounded', '11').defaultPrevented).toBeTrue();
  });

  it('should block pasted integers with plus sign', () => {
    expect(paste('positive', '+1').defaultPrevented).toBeTrue();
  });

  it('should block appended pasted integers above max', () => {
    expect(paste('bounded', '1', '2').defaultPrevented).toBeTrue();
  });
});
