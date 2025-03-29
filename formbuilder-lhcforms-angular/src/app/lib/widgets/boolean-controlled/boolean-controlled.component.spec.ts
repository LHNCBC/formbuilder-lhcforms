import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BooleanControlledComponent } from './boolean-controlled.component';
import {FormsModule} from '@angular/forms';
import {AppModule} from '../../../app.module';

describe('BooleanControlledComponent', () => {
  let component: BooleanControlledComponent;
  let fixture: ComponentFixture<BooleanControlledComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, AppModule],
      declarations: [ BooleanControlledComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanControlledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
