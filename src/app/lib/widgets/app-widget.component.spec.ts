import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppArrayWidgetComponent } from './app-array-widget.component';

describe('AppWidgetComponent', () => {
  let component: AppArrayWidgetComponent;
  let fixture: ComponentFixture<AppArrayWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppArrayWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppArrayWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
