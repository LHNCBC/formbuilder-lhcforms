import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuantityUnitComponent } from './quantity-unit.component';

describe('QuantityUnitComponent', () => {
  let component: QuantityUnitComponent;
  let fixture: ComponentFixture<QuantityUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuantityUnitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuantityUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
