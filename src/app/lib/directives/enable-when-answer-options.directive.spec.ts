import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EnableWhenAnswerOptionsService } from '../../services/enable-when-answer-options.service';
import { EnableWhenAnswerOptionsDirective } from './enable-when-answer-options.directive';

@Component({
  imports: [EnableWhenAnswerOptionsDirective],
  template: `
    <input
      id="answer-input"
      [lfbEnableWhenAnswerOptions]="service"
      [enableWhenAnswerOptionsId]="inputId">
  `
})
class TestHostComponent {
  inputId = 'fallback-id';
  service = jasmine.createSpyObj<EnableWhenAnswerOptionsService>(
    'EnableWhenAnswerOptionsService',
    ['initAutocomplete', 'onInput', 'suppressInvalidValue', 'destroyAutocomplete']
  );
}

describe('EnableWhenAnswerOptionsDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let input: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent]
    });
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.debugElement.query(By.directive(EnableWhenAnswerOptionsDirective)).nativeElement;
  });

  it('should initialize autocomplete with the host input element', () => {
    expect(component.service.initAutocomplete).toHaveBeenCalledWith(jasmine.objectContaining({
      nativeElement: input
    }), 'fallback-id');
  });

  it('should delegate input and blur events to the service', () => {
    const inputEvent = new Event('input');
    const blurEvent = new Event('blur');

    input.dispatchEvent(inputEvent);
    input.dispatchEvent(blurEvent);

    expect(component.service.onInput).toHaveBeenCalledWith(inputEvent);
    expect(component.service.suppressInvalidValue).toHaveBeenCalledWith(blurEvent);
  });

  it('should destroy autocomplete when the input is destroyed', () => {
    fixture.destroy();

    expect(component.service.destroyAutocomplete).toHaveBeenCalled();
  });
});
