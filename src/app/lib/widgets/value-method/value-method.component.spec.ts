import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueMethodComponent } from './value-method.component';
import { HttpClient, HttpHandler } from '@angular/common/http';

describe('ValueMethodComponent', () => {
  let component: ValueMethodComponent;
  let fixture: ComponentFixture<ValueMethodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers:[ HttpClient, HttpHandler ],      
      declarations: [ValueMethodComponent]
    })
    .compileComponents();
  });
  
  beforeEach(() => {
    fixture = TestBed.createComponent(ValueMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});