import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RowLayoutComponent } from './row-layout.component';

describe('RowLayoutComponent', () => {
  let component: RowLayoutComponent;
  let fixture: ComponentFixture<RowLayoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RowLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RowLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
