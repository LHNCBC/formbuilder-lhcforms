import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { EnableWhenAnswerOptionsService } from '../../services/enable-when-answer-options.service';
import { EnableWhenAnswerOptionsDirective } from './enable-when-answer-options.directive';

@Component({
  imports: [EnableWhenAnswerOptionsDirective],
  template: `
    <input
      id="answer-input"
      lfbEnableWhenAnswerOptions
      [enableWhenAnswerOptionsId]="inputId">
  `
})
class TestHostComponent {
  inputId = 'fallback-id';
}

describe('EnableWhenAnswerOptionsDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let input: HTMLInputElement;
  let service: jasmine.SpyObj<EnableWhenAnswerOptionsService>;
  let autocompleteRefresh: Subject<void>;

  beforeEach(() => {
    autocompleteRefresh = new Subject<void>();
    service = jasmine.createSpyObj<EnableWhenAnswerOptionsService>(
      'EnableWhenAnswerOptionsService',
      ['initAutocomplete', 'onInput', 'suppressInvalidValue', 'destroyAutocomplete'],
      { autocompleteRefresh$: autocompleteRefresh.asObservable() }
    );

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: EnableWhenAnswerOptionsService, useValue: service }]
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.debugElement.query(By.directive(EnableWhenAnswerOptionsDirective)).nativeElement;
  });

  it('should initialize autocomplete with the host input element', () => {
    expect(service.initAutocomplete).toHaveBeenCalledWith(jasmine.objectContaining({
      nativeElement: input
    }), 'fallback-id');
  });

  it('should reinitialize autocomplete when answer options refresh', () => {
    service.initAutocomplete.calls.reset();

    autocompleteRefresh.next();

    expect(service.initAutocomplete).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      nativeElement: input
    }), 'fallback-id');
  });

  it('should delegate input and blur events to the service', () => {
    const inputEvent = new Event('input');
    const blurEvent = new Event('blur');

    input.dispatchEvent(inputEvent);
    input.dispatchEvent(blurEvent);

    expect(service.onInput).toHaveBeenCalledWith(inputEvent);
    expect(service.suppressInvalidValue).toHaveBeenCalledWith(blurEvent);
  });

  it('should destroy autocomplete when the input is destroyed', () => {
    fixture.destroy();

    expect(service.destroyAutocomplete).toHaveBeenCalled();
  });
});
