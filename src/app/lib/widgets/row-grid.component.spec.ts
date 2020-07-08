import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RowGridComponent } from './row-grid.component';

describe('CodingComponent', () => {
  let component: RowGridComponent;
  let fixture: ComponentFixture<RowGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RowGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RowGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
