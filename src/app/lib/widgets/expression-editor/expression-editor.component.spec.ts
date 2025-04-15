import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpressionEditorComponent } from './expression-editor.component';
import { HttpClient, HttpHandler } from '@angular/common/http';

describe('ExpressionEditorComponent', () => {
  let component: ExpressionEditorComponent;
  let fixture: ComponentFixture<ExpressionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers:[ HttpClient, HttpHandler ],
      declarations: [ExpressionEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExpressionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
