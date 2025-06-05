import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpressionEditorDlgComponent } from './expression-editor-dlg.component';
import { HttpClient, HttpHandler } from '@angular/common/http';

describe('ExpressionEditorDlgComponent', () => {
  let component: ExpressionEditorDlgComponent;
  let fixture: ComponentFixture<ExpressionEditorDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers:[ HttpClient, HttpHandler ],
      declarations: [ExpressionEditorDlgComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExpressionEditorDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
