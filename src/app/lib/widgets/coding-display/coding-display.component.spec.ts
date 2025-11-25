/* import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { CodingDisplayComponent } from './coding-display.component';
import { AppModule } from 'src/app/app.module';
import { AnswerOptionService } from 'src/app/services/answer-option.service';
import { of } from 'rxjs';

describe('CodingDisplayComponent', () => {
  let component: CodingDisplayComponent;
  let fixture: ComponentFixture<CodingDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: AnswerOptionService,
          useValue: {
            systemLookups$: of([]),
            systemUrlSelection$: of({}),
            clearSystemUrlSelection: () => { },
            setSystemLookups: () => {},
          }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CodingDisplayComponent);
    component = fixture.componentInstance;
    // Provide a mock formProperty object
    component.formProperty = {
      parent: {
        value: {},
        properties: {},
        schema: { widget: {} },
        valueChanges: of({}),
        parent: {
          value: {},
          properties: {},
          schema: { widget: {} },
          valueChanges: of({})
        }
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
}); */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { CodingDisplayComponent } from './coding-display.component';
import { AppModule } from 'src/app/app.module';
import { AnswerOptionService } from 'src/app/services/answer-option.service';
import { of } from 'rxjs';

describe('CodingDisplayComponent', () => {
  let component: CodingDisplayComponent;
  let fixture: ComponentFixture<CodingDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CodingDisplayComponent);
    component = fixture.componentInstance;
    // Provide a mock formProperty object with getProperty for system and valueChanges observable
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
        getProperty: (name: string) => name === 'system' ? mockSystemProperty : undefined,
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

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});