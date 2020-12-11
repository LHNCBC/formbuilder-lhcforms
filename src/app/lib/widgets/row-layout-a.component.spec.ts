import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RowLayoutAComponent } from './row-layout-a.component';

describe('RowLayoutAComponent', () => {
  let component: RowLayoutAComponent;
  let fixture: ComponentFixture<RowLayoutAComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RowLayoutAComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RowLayoutAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
