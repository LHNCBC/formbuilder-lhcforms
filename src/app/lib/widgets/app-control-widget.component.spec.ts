import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppControlWidgetComponent } from './app-control-widget.component';

describe('AppControlWidgetComponent', () => {
  let component: AppControlWidgetComponent;
  let fixture: ComponentFixture<AppControlWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppControlWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppControlWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
