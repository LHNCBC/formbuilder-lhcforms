import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { CodingSystemComponent } from './coding-system.component';
import { AppModule } from 'src/app/app.module';
import { AnswerOptionService } from 'src/app/services/answer-option.service';
import { of } from 'rxjs';

describe('CodingSystemComponent', () => {
  let component: CodingSystemComponent;
  let fixture: ComponentFixture<CodingSystemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CodingSystemComponent);
    component = fixture.componentInstance;
    // Provide a mock formProperty object with getProperty for system
    const mockSystemProperty = {
      value: '',
      valueChanges: of(''),
      schema: { widget: { systemLookups: [] } }
    };
    component.formProperty = {
      parent: {
        value: {},
        properties: {},
        schema: { widget: {} },
        getProperty: () => mockSystemProperty,
        valueChanges: of({})
      },
      value: {},
      properties: {},
      schema: { widget: {} },
      valueChanges: of({})
    } as any;
    component.control = new FormControl('');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});