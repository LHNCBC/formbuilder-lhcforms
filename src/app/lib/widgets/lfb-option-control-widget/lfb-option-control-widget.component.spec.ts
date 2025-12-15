
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LfbOptionControlWidgetComponent } from './lfb-option-control-widget.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AnswerOptionService } from 'src/app/services/answer-option.service';
import { FormService } from 'src/app/services/form.service';
import { of } from 'rxjs';

describe('LfbOptionControlWidgetComponent', () => {
  let component: LfbOptionControlWidgetComponent;
  let fixture: ComponentFixture<LfbOptionControlWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [LfbOptionControlWidgetComponent],
      providers: [AnswerOptionService, FormService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LfbOptionControlWidgetComponent);
    component = fixture.componentInstance;
    // Provide a mock schema to avoid undefined error
    component.formProperty = {
      __canonicalPathNotation: 'enableWhen.0.answerString',
      schema: {
        widget: {
          showEmptyError: false,
          labelPosition: 'top',
          labelWidthClass: 'col-sm',
          controlWidthClass: 'col-sm',
          labelClasses: '',
          controlClasses: '',
          booleanControlled: false,
          booleanControlledInitial: false
        }
      },
      value: '',
      setValue: jasmine.createSpy('setValue'),
      valueChanges: of(''),
      errorsChanges: of([])
    } as any;

    component.control = {
      setValue: jasmine.createSpy('setValue'),
      valueChanges: of(''),
    } as any;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});