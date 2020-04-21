import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArrayGridComponent } from './array-grid.component';

describe('ArrayGridComponent', () => {
  let component: ArrayGridComponent;
  let fixture: ComponentFixture<ArrayGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArrayGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArrayGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
