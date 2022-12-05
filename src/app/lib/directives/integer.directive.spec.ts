import { IntegerDirective } from './integer.directive';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component} from '@angular/core';
import {By} from '@angular/platform-browser';

@Component({
  template: `
    <input type="number" lfbInteger />
  `
})
class HostComponent {
  kbEvent(event: KeyboardEvent) {
    if(event.type === 'keydown' && event.key === '.') {
      event.preventDefault();
    }
    console.log(event.type, event.key);
  }
}


describe('IntegerDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  function type(inputEl: HTMLInputElement, str: string) {
    inputEl.value = ''; // Clear the input
    for (const char of str) {
      inputEl.dispatchEvent(new KeyboardEvent('keydown',{
        key: char,
        bubbles: true,
        cancelable: true,
      }));
      fixture.detectChanges();
    }
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IntegerDirective, HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  xit('should accept only integers', async () => {
    const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
    type(inputEl, '1');
    fixture.detectChanges();
    expect(inputEl.value).toEqual('1');
    type(inputEl, '-0');
    expect(inputEl.value).toEqual('-0');
    type(inputEl, '1.2');
    expect(inputEl.value).toEqual('12');
    type(inputEl, '-1.2');
    expect(inputEl.value).toEqual('-12');
  });
});
