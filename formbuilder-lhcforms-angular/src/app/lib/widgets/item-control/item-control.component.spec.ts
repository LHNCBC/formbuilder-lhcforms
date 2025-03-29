import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemControlComponent } from './item-control.component';

describe('ItemControlComponent', () => {
  let component: ItemControlComponent;
  let fixture: ComponentFixture<ItemControlComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemControlComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
