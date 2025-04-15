import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InitialNumberComponent } from './initial-number.component';

describe('InitialNumberComponent', () => {
  let component: InitialNumberComponent;
  let fixture: ComponentFixture<InitialNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InitialNumberComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InitialNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
