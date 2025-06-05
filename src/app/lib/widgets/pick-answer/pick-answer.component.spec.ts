import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickAnswerComponent } from './pick-answer.component';
import { HttpClient, HttpHandler } from '@angular/common/http';

describe('PickAnswerComponent', () => {
  let component: PickAnswerComponent;
  let fixture: ComponentFixture<PickAnswerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers:[ HttpClient, HttpHandler ],
      declarations: [PickAnswerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PickAnswerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
